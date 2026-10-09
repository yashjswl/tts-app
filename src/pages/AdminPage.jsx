import { useCallback, useEffect, useState } from 'react';
import { Ban, Check, Copy, KeyRound, Plus, RotateCcw, Trash2 } from 'lucide-react';
import AppBar from '../components/AppBar';
import Dialog from '../components/Dialog';
import Footer from '../components/Footer';
import Notice from '../components/Notice';
import { api } from '../lib/api';
import { formatDateTime } from '../lib/format';
import { useAuth } from '../context/AuthContext';

function Credentials({ person, password, onDone }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };
  return (
    <div className="stack stack--lg">
      <p>
        Share this temporary password with <strong>{person.name || person.email}</strong>. It is shown only once, and they
        will choose their own at first sign-in.
      </p>
      <div className="secret">
        <code>{password}</code>
        <button type="button" className="btn btn--outline" onClick={copy}>
          {copied ? <Check size={18} aria-hidden="true" /> : <Copy size={18} aria-hidden="true" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <p className="hint">Sign-in address: {person.email}</p>
      <button type="button" className="btn btn--primary btn--block" onClick={onDone}>
        Done
      </button>
    </div>
  );
}

function AddPersonForm({ onCreated }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const result = await api('/api/admin/users', { method: 'POST', body: { name, email } });
      onCreated(result);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <form className="stack stack--lg" onSubmit={submit}>
      <Notice>{error}</Notice>
      <div className="formrow">
        <label htmlFor="add-name">Name</label>
        <input id="add-name" className="field" required data-autofocus autoComplete="off" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="formrow">
        <label htmlFor="add-email">Email</label>
        <input
          id="add-email"
          className="field"
          type="email"
          inputMode="email"
          required
          autoComplete="off"
          autoCapitalize="none"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <p className="hint">A temporary password is generated for them.</p>
      </div>
      <button type="submit" className="btn btn--primary btn--block" disabled={busy}>
        {busy ? 'Adding…' : 'Add person'}
      </button>
    </form>
  );
}

function StatusPill({ person }) {
  if (person.disabled) return <span className="pill pill--off">Disabled</span>;
  if (person.mustChangePassword) return <span className="pill pill--wait">Awaiting first sign-in</span>;
  return <span className="pill pill--on">Active</span>;
}

export default function AdminPage({ route, onOpenSettings }) {
  const { user: me } = useAuth();
  const [people, setPeople] = useState(null);
  const [error, setError] = useState('');
  const [dialog, setDialog] = useState(null); // {type:'add'} | {type:'credentials',person,password} | {type:'delete',person}

  const load = useCallback(async () => {
    try {
      const { users } = await api('/api/admin/users');
      setPeople(users);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const change = async (person, body) => {
    setError('');
    try {
      const result = await api(`/api/admin/users/${person.id}`, { method: 'PATCH', body });
      setPeople((list) => list.map((p) => (p.id === person.id ? result.user : p)));
      if (result.temporaryPassword) setDialog({ type: 'credentials', person: result.user, password: result.temporaryPassword });
    } catch (err) {
      setError(err.message);
    }
  };

  const remove = async (person) => {
    setError('');
    try {
      await api(`/api/admin/users/${person.id}`, { method: 'DELETE' });
      setPeople((list) => list.filter((p) => p.id !== person.id));
      setDialog(null);
    } catch (err) {
      setDialog(null);
      setError(err.message);
    }
  };

  const closeDialog = () => setDialog(null);

  return (
    <div className="admin">
      <AppBar route={route} onOpenSettings={onOpenSettings} />
      <main className="admin__main">
        <header className="admin__head">
          <div>
            <h1>People</h1>
            <p className="hint">Only people listed here can sign in. There is no public sign-up.</p>
          </div>
          <button type="button" className="btn btn--primary" onClick={() => setDialog({ type: 'add' })}>
            <Plus size={20} aria-hidden="true" /> Add person
          </button>
        </header>

        <Notice onDismiss={() => setError('')}>{error}</Notice>

        {!people && !error && <p className="hint">Loading…</p>}

        {people && (
          <ul className="people">
            {people.map((p) => {
              const self = p.id === me.id;
              const locked = p.role === 'admin';
              return (
                <li key={p.id} className="person" data-disabled={p.disabled || undefined}>
                  <div className="person__id">
                    <span className="avatar" aria-hidden="true">
                      {(p.name || p.email).charAt(0).toUpperCase()}
                    </span>
                    <div>
                      <p className="person__name">
                        {p.name || '(no name)'}
                        {p.role === 'admin' && <span className="pill pill--admin">Administrator</span>}
                        {self && <span className="pill">You</span>}
                      </p>
                      <p className="person__email">{p.email}</p>
                    </div>
                  </div>
                  <div className="person__meta">
                    <StatusPill person={p} />
                    <span className="person__seen">Last sign-in: {formatDateTime(p.lastLoginAt)}</span>
                  </div>
                  {!locked && (
                    <div className="person__actions">
                      <button type="button" className="btn btn--outline" onClick={() => change(p, { resetPassword: true })}>
                        <KeyRound size={18} aria-hidden="true" /> Reset password
                      </button>
                      <button type="button" className="btn btn--outline" onClick={() => change(p, { disabled: !p.disabled })}>
                        {p.disabled ? <RotateCcw size={18} aria-hidden="true" /> : <Ban size={18} aria-hidden="true" />}
                        {p.disabled ? 'Enable' : 'Disable'}
                      </button>
                      <button type="button" className="btn btn--outline btn--danger-text" onClick={() => setDialog({ type: 'delete', person: p })}>
                        <Trash2 size={18} aria-hidden="true" /> Delete
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </main>
      <Footer />

      <Dialog open={dialog?.type === 'add'} onClose={closeDialog} title="Add person">
        <AddPersonForm onCreated={({ user, temporaryPassword }) => {
          setPeople((list) => [...list, user]);
          setDialog({ type: 'credentials', person: user, password: temporaryPassword });
        }} />
      </Dialog>

      <Dialog open={dialog?.type === 'credentials'} onClose={closeDialog} title="Temporary password">
        {dialog?.type === 'credentials' && <Credentials person={dialog.person} password={dialog.password} onDone={closeDialog} />}
      </Dialog>

      <Dialog open={dialog?.type === 'delete'} onClose={closeDialog} title="Delete this person?">
        {dialog?.type === 'delete' && (
          <div className="stack stack--lg">
            <p>
              <strong>{dialog.person.name || dialog.person.email}</strong> will be signed out and will no longer be able to sign in.
              This cannot be undone. To keep the account but block access, use Disable instead.
            </p>
            <div className="row">
              <button type="button" className="btn btn--outline" onClick={closeDialog}>
                Cancel
              </button>
              <button type="button" className="btn btn--danger" onClick={() => remove(dialog.person)}>
                <Trash2 size={18} aria-hidden="true" /> Delete
              </button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
