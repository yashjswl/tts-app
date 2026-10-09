import { useEffect, useState } from 'react';
import { Keyboard, Mic, Trash2 } from 'lucide-react';
import AppBar from '../components/AppBar';
import StatusBoard from '../components/StatusBoard';
import Transcript from '../components/Transcript';
import MicButton from '../components/MicButton';
import Composer from '../components/Composer';
import Notice from '../components/Notice';
import Segmented from '../components/Segmented';
import { LANGUAGES, getLanguage } from '../lib/languages';
import { TEXT_SIZES, usePrefs } from '../context/PrefsContext';
import { useMediaQuery } from '../lib/useMediaQuery';

const EMPTY = 'Tap the microphone to start listening, or type a message to have it read aloud.';

function Rail({ convo, speech, language, onFace }) {
  const prefs = usePrefs();
  return (
    <aside className="rail" aria-label="Speaker controls">
      <div className="rail__block">
        <h2 className="rail__title">Speaker</h2>
        <StatusBoard role="speaker" speech={speech} language={language.native} />
        <MicButton isListening={convo.isListening} onStart={convo.startListening} onStop={convo.stopListening} shortcut="Alt + M" />
        <p className="hint">
          Speech appears in the conversation as it is heard. Press <kbd>Alt</kbd> + <kbd>M</kbd> to start or stop.
        </p>
      </div>

      <div className="rail__block">
        <h2 className="rail__title">This conversation</h2>
        <div className="formrow">
          <label htmlFor="rail-language">Language</label>
          <select id="rail-language" className="field" value={prefs.language} onChange={(e) => prefs.update({ language: e.target.value })}>
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.name}
                {l.native !== l.name ? ` · ${l.native}` : ''}
              </option>
            ))}
          </select>
        </div>
        <div className="formrow">
          <span className="label">Text size</span>
          <Segmented
            label="Text size"
            value={prefs.textSize}
            onChange={(textSize) => prefs.update({ textSize })}
            options={TEXT_SIZES.map((s, i) => ({ id: s.id, label: 'Aa', style: { fontSize: `${0.95 + i * 0.3}rem` } }))}
          />
        </div>
        <div className="rail__actions">
          <button type="button" className="btn btn--outline" onClick={onFace}>
            Face-to-face view
          </button>
          <button type="button" className="btn btn--ghost" onClick={convo.clear} disabled={!convo.messages.length}>
            <Trash2 size={18} aria-hidden="true" /> Clear
          </button>
        </div>
      </div>
    </aside>
  );
}

export default function SharedLayout({ convo, route, onOpenSettings }) {
  const prefs = usePrefs();
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const isTablet = useMediaQuery('(min-width: 768px)');
  const [dock, setDock] = useState('type');
  const language = getLanguage(prefs.language);
  const speech = { isListening: convo.isListening, isSpeaking: convo.isSpeaking };
  const interim = convo.isListening && convo.interimTranscript ? convo.interimTranscript : null;
  const { isListening, startListening, stopListening } = convo;

  useEffect(() => {
    if (!isDesktop) return;
    const onKey = (e) => {
      if (e.altKey && e.code === 'KeyM') {
        e.preventDefault();
        (isListening ? stopListening : startListening)();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isDesktop, isListening, startListening, stopListening]);

  // On a phone, show a compact status instead of the full board in the app bar.
  const barStatus = !isTablet && <StatusBoard role="speaker" speech={speech} />;

  return (
    <div className="shared">
      <AppBar route={route} onOpenSettings={onOpenSettings} status={barStatus} />

      <div className="shared__body">
        <main className="shared__thread">
          {convo.error && <Notice onDismiss={convo.clearError}>{convo.error}</Notice>}
          <Transcript messages={convo.messages} interim={interim} empty={EMPTY} />

          <div className="dock">
            {isTablet ? (
              <>
                {!isDesktop && (
                  <MicButton size="sm" isListening={isListening} onStart={startListening} onStop={stopListening} />
                )}
                <Composer onSend={convo.sendTyped} isSpeaking={convo.isSpeaking} />
              </>
            ) : (
              <>
                <Segmented
                  label="Input mode"
                  value={dock}
                  onChange={setDock}
                  options={[
                    { id: 'type', label: (<><Keyboard size={18} aria-hidden="true" /> Type</>) },
                    { id: 'speak', label: (<><Mic size={18} aria-hidden="true" /> Speak</>) },
                  ]}
                />
                {dock === 'type' ? (
                  <Composer onSend={convo.sendTyped} isSpeaking={convo.isSpeaking} />
                ) : (
                  <MicButton isListening={isListening} onStart={startListening} onStop={stopListening} />
                )}
              </>
            )}
          </div>
        </main>

        {isDesktop && <Rail convo={convo} speech={speech} language={language} onFace={() => prefs.update({ layout: 'face' })} />}
      </div>
    </div>
  );
}
