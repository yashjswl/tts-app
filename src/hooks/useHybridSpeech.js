import { useState, useRef, useCallback, useEffect } from 'react';
import { usesDeepgram, ttsLanguage } from '../lib/languages';

// Speech-to-text: Deepgram (streaming) for the languages it supports, Sarvam AI (VAD-chunked REST)
// for the rest. Text-to-speech: Sarvam Bulbul, falling back to the browser's voices.
// API keys live in the Pages Functions; the browser only ever talks to same-origin proxies.

const VAD_THRESHOLD = 0.05; // RMS above which a frame counts as speech
const SILENCE_CUT_MS = 1200; // pause after speech that closes a chunk
const MAX_CHUNK_MS = 7000;

export function useHybridSpeech(language, onFinalTranscript) {
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState('');

  const isSpeakingRef = useRef(false);
  const isListeningRef = useRef(false);
  const socketRef = useRef(null);
  const streamRef = useRef(null);
  const recorderRef = useRef(null);
  const audioContextRef = useRef(null);
  const vadTimerRef = useRef(null);
  const audioRef = useRef(null);
  const speakTimerRef = useRef(null);

  useEffect(() => {
    isSpeakingRef.current = isSpeaking;
  }, [isSpeaking]);

  const releaseMic = useCallback(() => {
    clearInterval(vadTimerRef.current);
    vadTimerRef.current = null;
    if (recorderRef.current && recorderRef.current.state !== 'inactive') recorderRef.current.stop();
    recorderRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    audioContextRef.current?.close().catch(() => {});
    audioContextRef.current = null;
  }, []);

  const stopListening = useCallback(() => {
    isListeningRef.current = false;

    const socket = socketRef.current;
    socketRef.current = null;
    if (socket) {
      if (socket.readyState === WebSocket.OPEN) {
        // Let Deepgram flush its last words, then close.
        socket.send(JSON.stringify({ type: 'CloseStream' }));
        setTimeout(() => socket.close(), 1500);
      } else {
        socket.close();
      }
    }

    releaseMic();
    setIsListening(false);
    setInterimTranscript('');
  }, [releaseMic]);

  const startListening = useCallback(async () => {
    setError('');
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setError('Microphone access was blocked. Allow the microphone in your browser settings, then try again.');
      return;
    }
    streamRef.current = stream;

    if (usesDeepgram(language)) {
      const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
      const query =
        language === 'hi-Latn'
          ? 'language=hi-Latn&interim_results=true'
          : `model=nova-3&language=${language}&smart_format=true&interim_results=true`;
      const socket = new WebSocket(`${protocol}://${window.location.host}/deepgram-api/v1/listen?${query}`);
      socketRef.current = socket;

      socket.onopen = () => {
        isListeningRef.current = true;
        setIsListening(true);
        const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
        recorder.addEventListener('dataavailable', (event) => {
          if (event.data.size > 0 && socket.readyState === WebSocket.OPEN) socket.send(event.data);
        });
        recorder.start(250);
        recorderRef.current = recorder;
      };

      socket.onmessage = (message) => {
        if (isSpeakingRef.current) return;
        const received = JSON.parse(message.data);
        const transcript = received.channel?.alternatives?.[0]?.transcript;
        if (!transcript) return;
        if (received.is_final) {
          onFinalTranscript(transcript);
          setInterimTranscript('');
        } else {
          setInterimTranscript(transcript);
        }
      };

      socket.onerror = () => {
        if (socketRef.current === socket) {
          setError('Could not connect to the speech service. Check your connection and sign-in, then try again.');
        }
      };

      socket.onclose = () => {
        if (socketRef.current === socket) {
          // The server hung up (expired session, network drop): reflect it instead of staying "listening".
          socketRef.current = null;
          isListeningRef.current = false;
          releaseMic();
          setIsListening(false);
          setInterimTranscript('');
        }
      };
      return;
    }

    // Sarvam path: cut the mic stream into utterances with a simple volume-based VAD.
    isListeningRef.current = true;
    setIsListening(true);

    const transcribe = async (blob) => {
      if (isSpeakingRef.current) return; // stay quiet while the device is talking
      const formData = new FormData();
      formData.append('file', new Blob([blob], { type: 'audio/webm' }), 'audio.webm');
      formData.append('model', 'saaras:v4');
      formData.append('prompt', 'Transcribe exactly what is spoken.');

      try {
        const res = await fetch('/sarvam-api/speech-to-text', { method: 'POST', body: formData });
        if (!res.ok) {
          console.error('Sarvam STT error', res.status, await res.text());
          setError('The transcription service did not respond. Try again.');
          return;
        }
        const data = await res.json();
        if (data.diarized_transcript?.length) {
          onFinalTranscript(
            data.diarized_transcript
              .map((segment) => `[${segment.speaker.replace('speaker_', 'Speaker ')}] ${segment.text}`)
              .join('\n')
          );
        } else if (data.transcript?.trim()) {
          onFinalTranscript(data.transcript.trim());
        }
      } catch (err) {
        console.error('Sarvam STT fetch error', err);
        setError('Could not reach the transcription service.');
      }
    };

    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    audioContextRef.current = audioContext;
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 512;
    audioContext.createMediaStreamSource(stream).connect(analyser);
    const samples = new Uint8Array(analyser.frequencyBinCount);

    let chunkStart = 0;
    let lastSpeech = 0;
    let heardSpeech = false;

    const startChunk = () => {
      if (!isListeningRef.current) return;
      heardSpeech = false;
      chunkStart = lastSpeech = Date.now();
      const recorder = new MediaRecorder(stream, MediaRecorder.isTypeSupported('audio/webm') ? { mimeType: 'audio/webm' } : {});
      // Stopped by the user mid-chunk: send what we have.
      recorder.ondataavailable = (e) => e.data.size > 0 && transcribe(e.data);
      recorder.start();
      recorderRef.current = recorder;
    };

    const checkVoice = () => {
      if (!isListeningRef.current) return;
      analyser.getByteTimeDomainData(samples);
      const mean = samples.reduce((sum, v) => sum + v, 0) / samples.length; // remove DC offset of cheap mics
      const rms = Math.sqrt(samples.reduce((sum, v) => sum + ((v - mean) / 128) ** 2, 0) / samples.length);

      const now = Date.now();
      if (rms > VAD_THRESHOLD) {
        heardSpeech = true;
        lastSpeech = now;
      }

      const paused = heardSpeech && now - lastSpeech > SILENCE_CUT_MS;
      if (paused || now - chunkStart > MAX_CHUNK_MS) {
        const recorder = recorderRef.current;
        if (recorder?.state === 'recording') {
          const hadSpeech = heardSpeech;
          recorder.ondataavailable = (e) => e.data.size > 0 && hadSpeech && transcribe(e.data);
          recorder.stop();
        }
        startChunk();
      }
    };

    startChunk();
    vadTimerRef.current = setInterval(checkVoice, 50);
  }, [language, onFinalTranscript, releaseMic]);

  const finishSpeaking = useCallback(() => {
    clearTimeout(speakTimerRef.current);
    setIsSpeaking(false);
  }, []);

  const speak = useCallback(
    async (text) => {
      if (!text) return;
      setIsSpeaking(true);
      const lang = ttsLanguage(language, text);

      // Some browsers never fire "ended"; do not leave the mic muted forever.
      clearTimeout(speakTimerRef.current);
      speakTimerRef.current = setTimeout(finishSpeaking, Math.min(60_000, 5000 + text.length * 150));

      const speakWithBrowser = () => {
        if (!('speechSynthesis' in window)) return finishSpeaking();
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;
        utterance.onend = finishSpeaking;
        utterance.onerror = finishSpeaking;
        window.speechSynthesis.speak(utterance);
      };

      try {
        const res = await fetch('/sarvam-api/text-to-speech', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, language_code: lang, speaker: 'ritu', pace: 1.0, model: 'bulbul:v3' }),
        });
        if (!res.ok) throw new Error(`Sarvam TTS failed: ${res.status}`);

        const result = await res.json();
        if (!result.audios?.length) throw new Error('No audio returned');

        audioRef.current ??= new Audio();
        const audio = audioRef.current;
        audio.src = `data:audio/wav;base64,${result.audios[0]}`;
        audio.onended = finishSpeaking;
        audio.onerror = finishSpeaking;
        await audio.play();
      } catch (err) {
        console.error('Sarvam TTS failed, using the browser voice', err);
        speakWithBrowser();
      }
    },
    [language, finishSpeaking]
  );

  // Switching language while the mic is open restarts it with the new engine.
  const languageRef = useRef(language);
  const [needsRestart, setNeedsRestart] = useState(false);
  useEffect(() => {
    if (languageRef.current === language) return;
    languageRef.current = language;
    if (isListeningRef.current) {
      stopListening();
      setNeedsRestart(true);
    }
  }, [language, stopListening]);

  useEffect(() => {
    if (needsRestart && !isListening) {
      setNeedsRestart(false);
      startListening();
    }
  }, [needsRestart, isListening, startListening]);

  // Release the microphone if the page unmounts while listening.
  useEffect(() => () => stopListening(), [stopListening]);

  const clearError = useCallback(() => setError(''), []);

  return { isListening, interimTranscript, isSpeaking, error, clearError, startListening, stopListening, speak };
}
