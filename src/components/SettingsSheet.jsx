import { useState } from 'react';
import { KeyRound, LogOut, Trash2, Users } from 'lucide-react';
import Dialog from './Dialog';
import Segmented from './Segmented';
import ChangePasswordForm from './ChangePasswordForm';
import { LANGUAGES } from '../lib/languages';
import { TEXT_SIZES, usePrefs } from '../context/PrefsContext';
import { useAuth } from '../context/AuthContext';

const THEMES = [
  { id: 'auto', label: 'Auto' },
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
];

const LAYOUTS = [
  { id: 'face', label: 'Face to face' },
  { id: 'shared', label: 'Shared' },
];

export default function SettingsSheet({ open, onClose, onClear }) {
  const prefs = usePrefs();
  const { user, logout } = useAuth();
  const [view, setView] = useState('settings'); // 'settings' | 'password'
  const [confirmClear, setConfirmClear] = useState(false);

  const close = () => {
    setView('settings');
    setConfirmClear(false);
    onClose();
  };

  if (view === 'password') {
    return (
      <Dialog open={open} onClose={close} title="Change password" variant="sheet">
        <ChangePasswordForm onDone={close} />
        <button type="button" className="btn btn--ghost btn--block" onClick={() => setView('settings')}>
          Back to settings
        </button>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onClose={close} title="Settings" variant="sheet">
      <div className="stack stack--lg">
        <div className="formrow">
          <label htmlFor="setting-language">Conversation language</label>
          <select
            id="setting-language"
            className="field"
            value={prefs.language}
            onChange={(e) => prefs.update({ language: e.target.value })}
          >
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

        <div className="formrow">
          <span className="label">Screen layout</span>
          <Segmented label="Screen layout" value={prefs.layout} onChange={(layout) => prefs.update({ layout })} options={LAYOUTS} />
          <p className="hint">Face to face turns one half of the screen around for the person opposite you.</p>
        </div>

        <div className="formrow">
          <span className="label">Appearance</span>
          <Segmented label="Appearance" value={prefs.theme} onChange={(theme) => prefs.update({ theme })} options={THEMES} />
        </div>

        <button
          type="button"
          className={`btn btn--block ${confirmClear ? 'btn--danger' : 'btn--outline'}`}
          onClick={() => {
            if (!confirmClear) return setConfirmClear(true);
            onClear();
            close();
          }}
        >
          <Trash2 size={18} aria-hidden="true" />
          {confirmClear ? 'Tap again to clear this conversation' : 'Clear conversation'}
        </button>

        <section className="account" aria-label="Account">
          <p className="account__who">
            <strong>{user.name || user.email}</strong>
            <span>{user.email}</span>
          </p>
          <div className="account__actions">
            {user.role === 'admin' && (
              <a className="btn btn--outline" href="#/people" onClick={close}>
                <Users size={18} aria-hidden="true" /> Manage people
              </a>
            )}
            <button type="button" className="btn btn--outline" onClick={() => setView('password')}>
              <KeyRound size={18} aria-hidden="true" /> Change password
            </button>
            <button type="button" className="btn btn--outline" onClick={logout}>
              <LogOut size={18} aria-hidden="true" /> Sign out
            </button>
          </div>
        </section>
      </div>
    </Dialog>
  );
}
