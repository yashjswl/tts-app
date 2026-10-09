import { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PrefsProvider, usePrefs } from './context/PrefsContext';
import { useConversation } from './hooks/useConversation';
import ConversationPage from './pages/ConversationPage';
import AdminPage from './pages/AdminPage';
import LoginPage from './pages/LoginPage';
import ForcePasswordPage from './pages/ForcePasswordPage';
import SettingsSheet from './components/SettingsSheet';
import { APP_NAME } from './config';

function useRoute() {
  const read = () => (window.location.hash === '#/people' ? 'people' : 'talk');
  const [route, setRoute] = useState(read);
  useEffect(() => {
    const onChange = () => setRoute(read());
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return route;
}

function Workspace() {
  const { user } = useAuth();
  const prefs = usePrefs();
  const hashRoute = useRoute();
  const route = hashRoute === 'people' && user.role === 'admin' ? 'people' : 'talk';
  const convo = useConversation(prefs.language);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    document.title = route === 'people' ? `People · ${APP_NAME}` : APP_NAME;
  }, [route]);

  if (user.mustChangePassword) return <ForcePasswordPage />;

  const openSettings = () => setSettingsOpen(true);
  return (
    <>
      {/* Kept mounted so the microphone and transcript survive a trip to the People page. */}
      <div className="view" hidden={route !== 'talk'}>
        <ConversationPage convo={convo} route={route} onOpenSettings={openSettings} />
      </div>
      {route === 'people' && <AdminPage route={route} onOpenSettings={openSettings} />}
      <SettingsSheet open={settingsOpen} onClose={() => setSettingsOpen(false)} onClear={convo.clear} />
    </>
  );
}

function Gate() {
  const { status } = useAuth();
  if (status === 'loading') return <div className="splash" role="status">Loading…</div>;
  if (status === 'anon') return <LoginPage />;
  return <Workspace />;
}

export default function App() {
  return (
    <PrefsProvider>
      <AuthProvider>
        <Gate />
      </AuthProvider>
    </PrefsProvider>
  );
}
