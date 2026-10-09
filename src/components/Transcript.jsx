import { useEffect, useRef } from 'react';
import { formatTime } from '../lib/format';

/**
 * The conversation. Colour says who produced a message (spoken = paper, typed = board blue),
 * the label says it in words. `viewerRole` aligns "my" messages to the right on a face-to-face half.
 */
export default function Transcript({ messages, interim, viewerRole = null, empty, hidden = false }) {
  const scrollRef = useRef(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, interim]);

  const alignEnd = (role) => (viewerRole ? role === viewerRole : role === 'A');

  const isEmpty = messages.length === 0 && !interim;

  return (
    <div
      className="transcript"
      ref={scrollRef}
      aria-hidden={hidden || undefined}
      role={hidden ? undefined : 'log'}
      aria-label={hidden ? undefined : 'Conversation'}
    >
      {isEmpty ? (
        <div className="transcript__empty">{empty}</div>
      ) : (
        <ol className="transcript__list">
          {messages.map((m) => (
            <li key={m.id} className={`msg msg--${m.sender === 'A' ? 'typed' : 'spoken'}${alignEnd(m.sender) ? ' msg--end' : ''}`}>
              <span className="msg__meta">
                {m.sender === 'A' ? 'Typed' : 'Spoken'} · {formatTime(m.at)}
              </span>
              <p className="msg__text">{m.text}</p>
            </li>
          ))}
          {interim && (
            <li className={`msg msg--spoken msg--live${alignEnd('B') ? ' msg--end' : ''}`}>
              <span className="msg__meta">Hearing…</span>
              <p className="msg__text">{interim}</p>
            </li>
          )}
        </ol>
      )}
    </div>
  );
}
