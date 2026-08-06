import { useState, useRef, useCallback, useEffect } from 'react';

export function useDeepgram(apiKey, language, onFinalTranscript) {
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [detectedLanguage, setDetectedLanguage] = useState('en');
  
  const socketRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioRef = useRef(new Audio());

  const startListening = useCallback(async () => {
    if (!apiKey) return alert("Please enter Deepgram API Key in Settings");
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      let wsUrl = `wss://api.deepgram.com/v1/listen?model=nova-3&language=${language}&smart_format=true&interim_results=true`;
      
      // For Hinglish, we omit the model parameter so Deepgram auto-selects the supported tier,
      // avoiding 400 Bad Request WebSocket closures.
      if (language === 'hi-Latn') {
        wsUrl = `wss://api.deepgram.com/v1/listen?language=hi-Latn&interim_results=true`;
      } else if (language === 'auto') {
        // Deepgram WebSockets do NOT support detect_language=true. 
        // We must use language=multi on nova-3 for automatic code-switching.
        wsUrl = `wss://api.deepgram.com/v1/listen?model=nova-3&language=multi&smart_format=true&interim_results=true`;
      }
      
      const socket = new WebSocket(wsUrl, ['token', apiKey]);
      
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
        const received = JSON.parse(message.data);
        
        if (received.channel?.detected_language) {
          setDetectedLanguage(received.channel.detected_language);
        }

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

      socket.onclose = () => {
        setIsListening(false);
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
          mediaRecorderRef.current.stop();
        }
      };

      socketRef.current = socket;
    } catch (err) {
      console.error("Error starting Deepgram STT:", err);
      alert("Microphone access denied or error connecting to Deepgram.");
    }
  }, [apiKey, language, onFinalTranscript]);

  const stopListening = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.send(JSON.stringify({ type: 'CloseStream' }));
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsListening(false);
    setInterimTranscript('');
  }, []);

  const speak = useCallback(async (text) => {
    if (!text) return;

    let currentLang = language === 'auto' ? detectedLanguage : language;

    // Heuristic fallback: if we are in 'auto' mode and Deepgram didn't explicitly tag the language,
    // check if the transcribed text contains any Indic script characters (Devanagari, Bengali, Tamil, etc.).
    if (language === 'auto' && currentLang === 'en') {
      const hasIndicScript = /[\u0900-\u0D7F]/.test(text);
      if (hasIndicScript) {
        currentLang = 'hi'; // hi-IN is the most robust general Indic fallback for native TTS
      }
    }

    // Deepgram Aura TTS currently only supports English (and some EU languages).
    // For Indian languages, fallback to the browser's native TTS.
    if (!currentLang.startsWith('en')) {
      setIsSpeaking(true);
      window.speechSynthesis.cancel(); // Stop any currently playing audio
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Try to map to standard regional codes for better browser support
      let nativeLangCode = currentLang;
      if (currentLang === 'hi') nativeLangCode = 'hi-IN';
      else if (currentLang === 'hi-Latn') nativeLangCode = 'en-IN'; // Indian English voice reads Romanized Hinglish perfectly
      else if (currentLang === 'bn') nativeLangCode = 'bn-IN';
      else if (currentLang === 'kn') nativeLangCode = 'kn-IN';
      else if (currentLang === 'mr') nativeLangCode = 'mr-IN';
      else if (currentLang === 'ta') nativeLangCode = 'ta-IN';
      else if (currentLang === 'te') nativeLangCode = 'te-IN';
      else if (currentLang === 'ur') nativeLangCode = 'ur-IN';
      else if (currentLang === 'gu') nativeLangCode = 'gu-IN';
      
      utterance.lang = nativeLangCode;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = (e) => {
        console.error("Native TTS Error:", e);
        setIsSpeaking(false);
      };
      
      window.speechSynthesis.speak(utterance);
      return;
    }

    if (!apiKey) return alert("Please enter Deepgram API Key in Settings");

    setIsSpeaking(true);
    let voice = 'aura-asteria-en';

    try {
      const response = await fetch(`https://api.deepgram.com/v1/speak?model=${voice}`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text })
      });

      if (!response.ok) {
        throw new Error(`Deepgram TTS failed: ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      const audio = audioRef.current;
      audio.src = url;
      audio.onended = () => setIsSpeaking(false);
      audio.play();
      
    } catch (err) {
      console.error("Error with Deepgram TTS:", err);
      alert("Error generating speech. Check API key.");
      setIsSpeaking(false);
    }
  }, [apiKey, language, detectedLanguage]);

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
