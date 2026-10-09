import { useCallback, useState } from 'react';
import { useHybridSpeech } from './useHybridSpeech';

// Sender codes: 'A' typed (read aloud), 'B' spoken (transcribed).
export function useConversation(language) {
  const [messages, setMessages] = useState([]);

  const add = useCallback((sender, text) => {
    setMessages((prev) => [...prev, { id: crypto.randomUUID(), sender, text, at: Date.now() }]);
  }, []);

  const onFinalTranscript = useCallback((text) => text.trim() && add('B', text.trim()), [add]);
  const speech = useHybridSpeech(language, onFinalTranscript);
  const { speak } = speech;

  const sendTyped = useCallback(
    (text) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      add('A', trimmed);
      speak(trimmed);
    },
    [add, speak]
  );

  const clear = useCallback(() => setMessages([]), []);

  return { messages, sendTyped, clear, ...speech };
}
