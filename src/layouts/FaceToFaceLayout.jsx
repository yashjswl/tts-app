import { ArrowUpDown, PanelTop, Settings } from 'lucide-react';
import StatusBoard from '../components/StatusBoard';
import Transcript from '../components/Transcript';
import MicButton from '../components/MicButton';
import Composer from '../components/Composer';
import Notice from '../components/Notice';
import Footer from '../components/Footer';
import { getLanguage } from '../lib/languages';

function Half({ role, rotated, convo, language }) {
  const speech = { isListening: convo.isListening, isSpeaking: convo.isSpeaking };
  const interim = convo.isListening && convo.interimTranscript ? convo.interimTranscript : null;
  const viewerRole = role === 'speaker' ? 'B' : 'A';

  return (
    <section className={`half${rotated ? ' half--rotated' : ''}`} aria-label={rotated ? 'Opposite side' : 'Your side'}>
      <header className="half__head">
        <StatusBoard role={role} speech={speech} language={language} />
      </header>
      <Transcript
        messages={convo.messages}
        interim={interim}
        viewerRole={viewerRole}
        hidden={rotated}
        empty={
          role === 'speaker'
            ? 'Tap the microphone and speak. What you say appears here as text.'
            : 'Type below. What you write is read aloud.'
        }
      />
      <footer className="half__control">
        {role === 'speaker' ? (
          <MicButton isListening={convo.isListening} onStart={convo.startListening} onStop={convo.stopListening} />
        ) : (
          <Composer onSend={convo.sendTyped} isSpeaking={convo.isSpeaking} />
        )}
      </footer>
    </section>
  );
}

export default function FaceToFaceLayout({ convo, languageCode, flipped, onFlip, onShared, onOpenSettings }) {
  const language = getLanguage(languageCode).native;
  const topRole = flipped ? 'typist' : 'speaker';
  const bottomRole = flipped ? 'speaker' : 'typist';

  return (
    <div className="face">
      <Half role={topRole} rotated convo={convo} language={language} />

      <div className="face__seam">
        <button type="button" className="btn btn--icon btn--board" onClick={onOpenSettings} aria-label="Settings">
          <Settings size={22} aria-hidden="true" />
        </button>
        <button type="button" className="face__language" onClick={onOpenSettings} aria-label={`Language: ${getLanguage(languageCode).name}. Change`}>
          {language}
        </button>
        <button type="button" className="btn btn--icon btn--board" onClick={onFlip} aria-label="Swap sides: speaker and typist trade places">
          <ArrowUpDown size={22} aria-hidden="true" />
        </button>
        <button type="button" className="btn btn--icon btn--board" onClick={onShared} aria-label="Switch to shared view">
          <PanelTop size={22} aria-hidden="true" />
        </button>
      </div>

      <Half role={bottomRole} convo={convo} language={language} />
      <Footer className="footer--bar" />

      {convo.error && (
        <>
          <div className="face__notice">
            <Notice onDismiss={convo.clearError}>{convo.error}</Notice>
          </div>
          <div className="face__notice face__notice--rotated" aria-hidden="true">
            <Notice>{convo.error}</Notice>
          </div>
        </>
      )}
    </div>
  );
}
