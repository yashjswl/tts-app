import { Settings } from 'lucide-react';
import BrandMark from './BrandMark';
import { APP_NAME, TAGLINE } from '../config';
import { useAuth } from '../context/AuthContext';

export default function AppBar({ route, onOpenSettings, status }) {
  const { user } = useAuth();
  const initial = (user.name || user.email).trim().charAt(0).toUpperCase();

  return (
    <header className="appbar">
      <a className="appbar__brand" href="#/" aria-label={`${APP_NAME}: conversation`}>
        <BrandMark size={30} />
        <span className="appbar__name">{APP_NAME}</span>
        <span className="appbar__tagline">{TAGLINE}</span>
      </a>

      {user.role === 'admin' && (
        <nav className="appbar__nav" aria-label="Main">
          <a href="#/" aria-current={route === 'talk' ? 'page' : undefined}>
            Conversation
          </a>
          <a href="#/people" aria-current={route === 'people' ? 'page' : undefined}>
            People
          </a>
        </nav>
      )}

      <div className="appbar__end">
        {status}
        <button type="button" className="appbar__account" onClick={onOpenSettings} aria-label="Settings and account">
          <span className="avatar" aria-hidden="true">
            {initial}
          </span>
          <span className="appbar__who">{user.name || user.email}</span>
          <Settings size={18} aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}
