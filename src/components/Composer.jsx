import { useId, useRef, useState } from 'react';
import { Volume2 } from 'lucide-react';

export default function Composer({ onSend, isSpeaking, autoFocus = false }) {
  const [text, setText] = useState('');
  const fieldRef = useRef(null);
  const fieldId = useId();

  const resize = () => {
    const field = fieldRef.current;
    if (!field) return;
    field.style.height = 'auto';
    field.style.height = `${Math.min(field.scrollHeight, 160)}px`;
  };

  const send = () => {
    if (!text.trim()) return;
    onSend(text);
    setText('');
    requestAnimationFrame(() => {
      resize();
      fieldRef.current?.focus();
    });
  };

  return (
    <form
      className="composer"
      onSubmit={(e) => {
        e.preventDefault();
        send();
      }}
    >
      <label className="sr-only" htmlFor={fieldId}>
        Message to speak aloud
      </label>
      <textarea
        id={fieldId}
        ref={fieldRef}
        className="field composer__field"
        rows={1}
        value={text}
        autoFocus={autoFocus}
        placeholder="Type to speak aloud"
        enterKeyHint="send"
        onChange={(e) => {
          setText(e.target.value);
          resize();
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            send();
          }
        }}
      />
      <button type="submit" className="btn btn--primary composer__send" disabled={!text.trim()}>
        <Volume2 size={20} aria-hidden="true" />
        <span>{isSpeaking ? 'Speaking…' : 'Speak'}</span>
      </button>
    </form>
  );
}
