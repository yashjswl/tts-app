import BrandMark from '../components/BrandMark';
import ChangePasswordForm from '../components/ChangePasswordForm';
import { APP_NAME } from '../config';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';

export default function ForcePasswordPage() {
  const { user, logout } = useAuth();
  return (
    <div className="auth auth--single">
      <main className="auth__panel">
        <div className="auth__form stack stack--lg">
          <div className="lockup lockup--dark">
            <BrandMark size={36} />
            <span className="lockup__name">{APP_NAME}</span>
          </div>
          <div>
            <h1 className="auth__title">Choose your own password</h1>
            <p className="hint">
              {user.name ? `${user.name}, you` : 'You'} signed in with a temporary password. Set a new one to continue.
            </p>
          </div>
          <ChangePasswordForm forced />
          <button type="button" className="btn btn--ghost btn--block" onClick={logout}>
            Sign out
          </button>
          <Footer />
        </div>
      </main>
    </div>
  );
}
