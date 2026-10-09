import { useState } from 'react';
import { LogIn } from 'lucide-react';
import BrandMark from '../components/BrandMark';
import Notice from '../components/Notice';
import PasswordField from '../components/PasswordField';
import { APP_NAME, TAGLINE } from '../config';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';

// Synthetic sample, shown only to explain what the product does.
function Sample() {
  return (
    <figure className="sample">
      <figcaption>Sample conversation</figcaption>
      <div className="board" data-tone="live" role="presentation">
        <span className="board__cell board__role">Speaker</span>
        <span className="board__cell board__state">
          <i className="board__lamp" aria-hidden="true" />
          Listening
        </span>
        <span className="board__cell board__lang">हिन्दी</span>
      </div>
      <ol className="sample__list">
        <li className="msg msg--spoken">
          <span className="msg__meta">Spoken · 10:42</span>
          <p className="msg__text">आपकी अपॉइंटमेंट कल सुबह दस बजे है।</p>
        </li>
        <li className="msg msg--typed msg--end">
          <span className="msg__meta">Typed · 10:43</span>
          <p className="msg__text">धन्यवाद। क्या आप डॉक्टर का नाम बता सकते हैं?</p>
        </li>
        <li className="msg msg--spoken msg--live">
          <span className="msg__meta">Hearing…</span>
          <p className="msg__text">डॉक्टर शर्मा आपको</p>
        </li>
      </ol>
    </figure>
  );
}

// Keep hyphenated words (speech-to-text) whole when the headline wraps.
function Headline({ text }) {
  return text.split(' ').map((word, i, words) => (
    <span key={i}>
      {word.includes('-') ? <span style={{ whiteSpace: 'nowrap' }}>{word}</span> : word}
      {i < words.length - 1 && ' '}
    </span>
  ));
}

export default function LoginPage() {
  const { login, notice } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <div className="auth">
      <aside className="auth__showcase">
        <div className="lockup">
          <BrandMark size={40} />
          <span className="lockup__name">{APP_NAME}</span>
        </div>
        <h1 className="auth__headline">
          <Headline text={`${TAGLINE}.`} />
        </h1>
        <Sample />
      </aside>

      <main className="auth__panel">
        <form className="auth__form stack stack--lg" onSubmit={submit}>
          <div>
            <h2 className="auth__title">Sign in</h2>
            <p className="hint">Access is by invitation. Ask your administrator if you need an account.</p>
          </div>

          <Notice tone="info">{!error && notice}</Notice>
          <Notice>{error}</Notice>

          <div className="formrow">
            <label htmlFor="login-email">Email</label>
            <input
              id="login-email"
              className="field"
              type="email"
              inputMode="email"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              required
              autoFocus={!window.matchMedia('(pointer: coarse)').matches}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <PasswordField label="Password" value={password} onChange={setPassword} autoComplete="current-password" required />

          <button type="submit" className="btn btn--primary btn--block btn--lg" disabled={busy}>
            <LogIn size={20} aria-hidden="true" />
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        <Footer />
      </main>
    </div>
  );
}
