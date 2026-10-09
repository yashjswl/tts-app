import { useState } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import Notice from './Notice';
import PasswordField from './PasswordField';

export default function ChangePasswordForm({ onDone, forced = false }) {
  const { setUser } = useAuth();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (next !== confirm) return setError('The new passwords do not match.');
    setBusy(true);
    try {
      const { user } = await api('/api/auth/password', {
        method: 'POST',
        body: { currentPassword: current, newPassword: next },
      });
      setUser(user);
      onDone?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="stack" onSubmit={submit}>
      <Notice>{error}</Notice>
      <PasswordField
        label={forced ? 'Temporary password' : 'Current password'}
        value={current}
        onChange={setCurrent}
        autoComplete="current-password"
        required
      />
      <PasswordField
        label="New password"
        hint="At least 10 characters."
        value={next}
        onChange={setNext}
        autoComplete="new-password"
        minLength={10}
        required
      />
      <PasswordField label="Repeat new password" value={confirm} onChange={setConfirm} autoComplete="new-password" required />
      <button type="submit" className="btn btn--primary btn--block" disabled={busy}>
        {busy ? 'Saving…' : 'Save new password'}
      </button>
    </form>
  );
}
