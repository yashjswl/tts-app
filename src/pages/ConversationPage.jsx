import { useState } from 'react';
import FaceToFaceLayout from '../layouts/FaceToFaceLayout';
import SharedLayout from '../layouts/SharedLayout';
import { usePrefs } from '../context/PrefsContext';

export default function ConversationPage({ convo, route, onOpenSettings }) {
  const prefs = usePrefs();
  const [flipped, setFlipped] = useState(false);

  if (prefs.layout === 'face') {
    return (
      <FaceToFaceLayout
        convo={convo}
        languageCode={prefs.language}
        flipped={flipped}
        onFlip={() => setFlipped((f) => !f)}
        onShared={() => prefs.update({ layout: 'shared' })}
        onOpenSettings={onOpenSettings}
      />
    );
  }
  return <SharedLayout convo={convo} route={route} onOpenSettings={onOpenSettings} />;
}
