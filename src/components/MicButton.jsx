import { Mic, Square } from 'lucide-react';

export default function MicButton({ isListening, onStart, onStop, size = 'lg', shortcut }) {
  return (
    <button
      type="button"
      className={`mic mic--${size}`}
      data-listening={isListening}
      aria-pressed={isListening}
      onClick={isListening ? onStop : onStart}
      title={shortcut ? `Shortcut: ${shortcut}` : undefined}
    >
      <span className="mic__disc">
        {isListening ? <Square size={26} fill="currentColor" aria-hidden="true" /> : <Mic size={28} aria-hidden="true" />}
      </span>
      <span className="mic__label">{isListening ? 'Stop listening' : 'Tap to speak'}</span>
    </button>
  );
}
