import { useState, useRef, useCallback, useEffect } from 'react';

// Languages routed to Deepgram for STT
const DEEPGRAM_LANGS = ['en', 'hi', 'hi-Latn', 'bn', 'kn', 'mr', 'ta', 'te', 'ur', 'gu'];

// Languages supported by Sarvam TTS (Bulbul v3)
const SARVAM_TTS_LANGS = ['en-IN', 'hi-IN', 'bn-IN', 'ta-IN', 'te-IN', 'kn-IN', 'ml-IN', 'mr-IN', 'gu-IN', 'pa-IN', 'od-IN'];

export function useHybridSpeech(deepgramApiKey, sarvamApiKey, language, onFinalTranscript) {
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const isSpeakingRef = useRef(false);
  const isListeningRef = useRef(false);

  useEffect(() => {
    isSpeakingRef.current = isSpeaking;
  }, [isSpeaking]);
  
  const socketRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioContextRef = useRef(null);
  const processorRef = useRef(null);
  const audioRef = useRef(new Audio());

  const startListening = useCallback(async () => {
    if (!deepgramApiKey && !sarvamApiKey) return alert("Please enter an API Key in Settings");
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const useDeepgram = DEEPGRAM_LANGS.includes(language);

      if (useDeepgram) {
        if (!deepgramApiKey) return alert("Deepgram API Key is required for this language.");
        
        let wsUrl = `wss://api.deepgram.com/v1/listen?model=nova-3&language=${language}&smart_format=true&interim_results=true`;
        if (language === 'hi-Latn') {
          wsUrl = `wss://api.deepgram.com/v1/listen?language=hi-Latn&interim_results=true`;
        }
        
        const socket = new WebSocket(wsUrl, ['token', deepgramApiKey]);
        
        socket.onopen = () => {
          setIsListening(true);
          const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
          mediaRecorder.addEventListener('dataavailable', (event) => {
            if (event.data.size > 0 && socket.readyState === 1) {
              socket.send(event.data);
            }
          });
          mediaRecorder.start(250);
          mediaRecorderRef.current = mediaRecorder;
        };

        socket.onmessage = (message) => {
          if (isSpeakingRef.current) return;
          const received = JSON.parse(message.data);
          const newTranscript = received.channel?.alternatives[0]?.transcript;
          if (newTranscript) {
            if (received.is_final) {
               onFinalTranscript(newTranscript);
               setInterimTranscript('');
            } else {
               setInterimTranscript(newTranscript);
            }
          }
        };

        socketRef.current = socket;
      } else {
        // Use Sarvam AI STT via REST API (Foolproof chunking)
        setIsListening(true);
        isListeningRef.current = true;
        
        const sendToSarvamREST = async (rawBlob) => {
          if (isSpeakingRef.current) return; // Mute during TTS
          
          // Strip codecs=opus from mimetype to satisfy strict Sarvam file validation
          const cleanBlob = new Blob([rawBlob], { type: 'audio/webm' });
          
          const formData = new FormData();
          formData.append('file', cleanBlob, 'audio.webm');
          formData.append('model', 'saaras:v4');
          formData.append('prompt', 'Transcribe exactly what is spoken.');
          
          try {
            const res = await fetch('/sarvam-api/speech-to-text', {
              method: 'POST',
              body: formData
            });
            
            if (res.ok) {
              const data = await res.json();
              
              if (data.diarized_transcript && data.diarized_transcript.length > 0) {
                 const formatted = data.diarized_transcript.map(segment => {
                    const speakerName = segment.speaker.replace('speaker_', 'Speaker ');
                    return `[${speakerName}] ${segment.text}`;
                 }).join('\n');
                 onFinalTranscript(formatted);
              } else if (data.transcript && data.transcript.trim()) {
                 onFinalTranscript(data.transcript.trim());
              }
            } else {
              const errText = await res.text();
              console.error("Sarvam REST API error:", res.status, res.statusText, errText);
            }
          } catch (err) {
             console.error("Sarvam REST fetch error:", err);
          }
        };

        // Dynamic VAD Chunking for REST API
        let currentRecorder = null;
        let vadInterval = null;
        let chunkStartTime = 0;
        let lastSpeechTime = 0;
        let hasAudioInChunk = false;
        
        // Setup Audio Analyser for VAD
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        audioContextRef.current = audioContext;
        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 512;
        source.connect(analyser);
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        
        const startNewChunk = () => {
          if (!isListeningRef.current) return;
          
          hasAudioInChunk = false;
          chunkStartTime = Date.now();
          lastSpeechTime = Date.now(); // Initialize to prevent instant timeout
          
          const options = MediaRecorder.isTypeSupported('audio/webm') 
            ? { mimeType: 'audio/webm' } 
            : {};
            
          currentRecorder = new MediaRecorder(stream, options);
          
          // Fallback handler: if stopped manually by the user, just send whatever we have
          currentRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) {
              sendToSarvamREST(e.data);
            }
          };
          
          currentRecorder.start();
          mediaRecorderRef.current = currentRecorder;
        };
        
        const checkVAD = () => {
          if (!isListeningRef.current) {
            clearInterval(vadInterval);
            return;
          }
          
          analyser.getByteTimeDomainData(dataArray);
          
          // 1. Calculate the mean to remove DC offset (cheap mics often rest at values like 135 instead of 128)
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const mean = sum / dataArray.length;
          
          // 2. Calculate true AC RMS volume
          let sumSquares = 0;
          for (let i = 0; i < dataArray.length; i++) {
            const normalized = (dataArray[i] - mean) / 128; // Normalize using dynamic mean
            sumSquares += normalized * normalized;
          }
          const rms = Math.sqrt(sumSquares / dataArray.length);
          
          const now = Date.now();
          
          // 0.05 requires actual deliberate sound/speech. Background fans/static usually sit below 0.03.
          const isSpeakingRightNow = rms > 0.05; 
          
          if (isSpeakingRightNow) {
            if (!hasAudioInChunk) {
               console.log("VAD detected speech! RMS Volume:", rms.toFixed(4));
            }
            hasAudioInChunk = true;
            lastSpeechTime = now;
          }
          
          const timeSinceLastSpeech = now - lastSpeechTime;
          const currentChunkDuration = now - chunkStartTime;
          
          const shouldCutChunk = (hasAudioInChunk && timeSinceLastSpeech > 1200) || (currentChunkDuration > 7000);
          
          if (shouldCutChunk) {
            if (currentRecorder && currentRecorder.state === 'recording') {
              // Capture if speech was detected in a closure to avoid async wipe
              const audioDetected = hasAudioInChunk;
              currentRecorder.ondataavailable = (e) => {
                if (e.data.size > 0 && audioDetected) {
                  sendToSarvamREST(e.data);
                }
              };
              currentRecorder.stop();
            }
            startNewChunk();
          }
        };
        
        startNewChunk();
        vadInterval = setInterval(checkVAD, 50);
      }
    } catch (err) {
      console.error("Error starting STT:", err);
      alert("Microphone access denied or error connecting to speech server.");
    }
  }, [deepgramApiKey, sarvamApiKey, language, onFinalTranscript]);

  const stopListening = useCallback(() => {
    if (socketRef.current) {
      if (DEEPGRAM_LANGS.includes(language)) {
        socketRef.current.send(JSON.stringify({ type: 'CloseStream' }));
      }
    }
    
    isListeningRef.current = false;
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current.onaudioprocess = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    
    setIsListening(false);
    setInterimTranscript('');
  }, [language]);

  const speak = useCallback(async (text) => {
    if (!text) return;

    setIsSpeaking(true);

    let ttsLangCode = 'hi-IN'; // Default
    
    if (language !== 'auto') {
      if (language === 'en') ttsLangCode = 'en-IN';
      else if (language === 'hi' || language === 'hi-Latn') ttsLangCode = 'hi-IN';
      else if (language === 'bn') ttsLangCode = 'bn-IN';
      else if (language === 'ta') ttsLangCode = 'ta-IN';
      else if (language === 'te') ttsLangCode = 'te-IN';
      else if (language === 'kn') ttsLangCode = 'kn-IN';
      else if (language === 'mr') ttsLangCode = 'mr-IN';
      else if (language === 'gu') ttsLangCode = 'gu-IN';
      else if (language === 'ur') ttsLangCode = 'hi-IN';
      else if (SARVAM_TTS_LANGS.includes(language)) {
        ttsLangCode = language;
      }
    } else {
      const hasIndicScript = /[\u0900-\u0D7F]/.test(text);
      ttsLangCode = hasIndicScript ? 'hi-IN' : 'en-IN';
    }

    try {
      const response = await fetch('/sarvam-api/text-to-speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: text,
          language_code: ttsLangCode,
          speaker: "ritu",
          pace: 1.0,
          model: "bulbul:v3"
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Sarvam TTS API Error Body:", errorText);
        throw new Error(`Sarvam TTS failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.audios && result.audios.length > 0) {
        const audioBase64 = result.audios[0];
        const audioUrl = `data:audio/wav;base64,${audioBase64}`;
        
        const audio = audioRef.current;
        audio.src = audioUrl;
        audio.onended = () => setIsSpeaking(false);
        audio.play();
      } else {
        throw new Error("No audio data returned");
      }
      
    } catch (err) {
      console.error("Error with Sarvam TTS:", err);
      // Fallback
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = ttsLangCode;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  }, [sarvamApiKey, language]);

  const [needsRestart, setNeedsRestart] = useState(false);
  const languageRef = useRef(language);

  useEffect(() => {
    if (languageRef.current !== language) {
      languageRef.current = language;
      if (isListening) {
        stopListening();
        setNeedsRestart(true);
      }
    }
  }, [language, isListening, stopListening]);

  useEffect(() => {
    if (needsRestart && !isListening) {
      setNeedsRestart(false);
      startListening();
    }
  }, [needsRestart, isListening, startListening]);

  return {
    isListening,
    interimTranscript,
    isSpeaking,
    startListening,
    stopListening,
    speak
  };
}
