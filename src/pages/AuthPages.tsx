import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, Mail } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GlassButton, GlassPanel } from '../components/glass';
import { useSeoMetadata } from '../utils/seo';

function GoogleButton({
  label,
  onClick,
  disabled,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-full glass-control hover:bg-white/20 text-sm font-semibold text-white transition-all disabled:opacity-50 cursor-pointer"
    >
      <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="#4285F4"
          d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
        />
        <path
          fill="#34A853"
          d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z"
        />
        <path
          fill="#FBBC05"
          d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
        />
        <path
          fill="#EA4335"
          d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
        />
      </svg>
      {label}
    </button>
  );
}

const INPUT_CLASS =
  'w-full px-4 py-2.5 rounded-full bg-white/10 border border-white/20 text-sm text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/25 focus:border-white/45 transition-all';

export function LoginPage() {
  useSeoMetadata({
    title: 'Sign In – ZyvoMovie',
    description: 'Sign in to ZyvoMovie to synchronize your watchlist, continue watching, and preferences.',
    path: '/login',
  });

  const { signInWithGoogle, signInWithEmail, authError, clearAuthError } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const ok = await signInWithEmail(email, password);
    setBusy(false);
    if (ok) navigate('/profile');
  };

  const handleGoogle = async () => {
    setBusy(true);
    const ok = await signInWithGoogle();
    setBusy(false);
    if (ok) navigate('/profile');
  };

  return (
    <div className="max-w-md mx-auto px-4 pt-10 sm:pt-14">
      <GlassPanel variant="elevated" padding="lg" className="rounded-3xl space-y-6">
        <div className="text-center space-y-1.5">
          <h1 className="font-display text-2xl font-extrabold text-white">Sign in to ZyvoMovie</h1>
          <p className="text-sm text-white/70">
            Sync your watchlist, watch history, and resume progress across devices.
          </p>
        </div>

        {authError && (
          <div
            role="alert"
            className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-[#E50914]/20 border border-[#E50914]/40 text-xs text-red-200"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{authError}</span>
          </div>
        )}

        <GoogleButton label="Continue with Google" onClick={handleGoogle} disabled={busy} />

        <div className="flex items-center gap-3 text-xs text-white/55">
          <div className="h-px flex-1 bg-white/15" />
          <span>or sign in with email</span>
          <div className="h-px flex-1 bg-white/15" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="login-email" className="block text-xs font-semibold mb-1.5">
              Email Address
            </label>
            <input
              id="login-email"
              type="email"
              required
              value={email}
              onChange={(e) => {
                clearAuthError();
                setEmail(e.target.value);
              }}
              className={INPUT_CLASS}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="login-password" className="block text-xs font-semibold">
                Password
              </label>
              <Link to="/forgot-password" className="text-xs text-[#E50914] hover:underline">
                Forgot password?
              </Link>
            </div>
            <input
              id="login-password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => {
                clearAuthError();
                setPassword(e.target.value);
              }}
              className={INPUT_CLASS}
            />
          </div>

          <GlassButton type="submit" variant="primary" size="lg" disabled={busy} className="w-full">
            {busy ? 'Signing in...' : 'Sign In'}
          </GlassButton>
        </form>

        <p className="text-center text-xs text-white/65">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="text-[#E50914] font-semibold hover:underline">
            Create one
          </Link>
        </p>
      </GlassPanel>
    </div>
  );
}

export function RegisterPage() {
  useSeoMetadata({
    title: 'Create Account – ZyvoMovie',
    description: 'Create a ZyvoMovie account to save watchlists and sync playback progress.',
    path: '/register',
  });

  const { signInWithGoogle, registerWithEmail, authError, clearAuthError } = useAuth();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const ok = await registerWithEmail(displayName, email, password);
    setBusy(false);
    if (ok) navigate('/profile');
  };

  const handleGoogle = async () => {
    setBusy(true);
    const ok = await signInWithGoogle();
    setBusy(false);
    if (ok) navigate('/profile');
  };

  return (
    <div className="max-w-md mx-auto px-4 pt-10 sm:pt-14">
      <GlassPanel variant="elevated" padding="lg" className="rounded-3xl space-y-6">
        <div className="text-center space-y-1.5">
          <h1 className="font-display text-2xl font-extrabold text-white">Create ZyvoMovie Account</h1>
          <p className="text-sm text-white/70">
            Start syncing your favorite movies, series, and anime.
          </p>
        </div>

        {authError && (
          <div
            role="alert"
            className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-[#E50914]/20 border border-[#E50914]/40 text-xs text-red-200"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{authError}</span>
          </div>
        )}

        <GoogleButton label="Sign up with Google" onClick={handleGoogle} disabled={busy} />

        <div className="flex items-center gap-3 text-xs text-white/55">
          <div className="h-px flex-1 bg-white/15" />
          <span>or register with email</span>
          <div className="h-px flex-1 bg-white/15" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="reg-name" className="block text-xs font-semibold mb-1.5">
              Display Name
            </label>
            <input
              id="reg-name"
              type="text"
              required
              minLength={2}
              maxLength={100}
              value={displayName}
              onChange={(e) => {
                clearAuthError();
                setDisplayName(e.target.value);
              }}
              className={INPUT_CLASS}
            />
          </div>

          <div>
            <label htmlFor="reg-email" className="block text-xs font-semibold mb-1.5">
              Email Address
            </label>
            <input
              id="reg-email"
              type="email"
              required
              value={email}
              onChange={(e) => {
                clearAuthError();
                setEmail(e.target.value);
              }}
              className={INPUT_CLASS}
            />
          </div>

          <div>
            <label htmlFor="reg-password" className="block text-xs font-semibold mb-1.5">
              Password (minimum 6 characters)
            </label>
            <input
              id="reg-password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => {
                clearAuthError();
                setPassword(e.target.value);
              }}
              className={INPUT_CLASS}
            />
          </div>

          <GlassButton type="submit" variant="primary" size="lg" disabled={busy} className="w-full">
            {busy ? 'Creating Account...' : 'Create Account'}
          </GlassButton>
        </form>

        <p className="text-center text-xs text-white/65">
          Already have an account?{' '}
          <Link to="/login" className="text-[#E50914] font-semibold hover:underline">
            Sign in
          </Link>
        </p>
      </GlassPanel>
    </div>
  );
}

export function ForgotPasswordPage() {
  useSeoMetadata({
    title: 'Reset Password – ZyvoMovie',
    description: 'Send a Firebase password reset email for your ZyvoMovie account.',
    path: '/forgot-password',
  });

  const { sendResetEmail, authError, clearAuthError } = useAuth();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const ok = await sendResetEmail(email);
    setBusy(false);
    if (ok) setSent(true);
  };

  return (
    <div className="max-w-md mx-auto px-4 pt-10 sm:pt-14">
      <GlassPanel variant="elevated" padding="lg" className="rounded-3xl space-y-6">
        <div className="text-center space-y-1.5">
          <div className="w-11 h-11 rounded-2xl bg-[#E50914]/12 border border-[#E50914]/25 text-[#E50914] flex items-center justify-center mx-auto mb-2">
            <Mail className="w-5 h-5" />
          </div>
          <h1 className="font-display text-2xl font-extrabold text-white">Reset Password</h1>
          <p className="text-sm text-white/70">
            Enter your account email to receive a Firebase password reset link.
          </p>
        </div>

        {authError && (
          <div
            role="alert"
            className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-[#E50914]/20 border border-[#E50914]/40 text-xs text-red-200"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{authError}</span>
          </div>
        )}

        {sent ? (
          <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-400/35 text-sm text-emerald-200 flex items-start gap-2.5">
            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Reset link sent</p>
              <p className="text-xs mt-1">
                If an account exists for {email}, check your inbox for the reset link.
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="reset-email" className="block text-xs font-semibold mb-1.5 text-white">
                Email Address
              </label>
              <input
                id="reset-email"
                type="email"
                required
                value={email}
                onChange={(e) => {
                  clearAuthError();
                  setEmail(e.target.value);
                }}
                className={INPUT_CLASS}
              />
            </div>
            <GlassButton type="submit" variant="primary" size="lg" disabled={busy} className="w-full">
              {busy ? 'Sending...' : 'Send Reset Link'}
            </GlassButton>
          </form>
        )}

        <p className="text-center text-xs text-white/65">
          <Link to="/login" className="text-[#E50914] font-semibold hover:underline">
            Back to Sign In
          </Link>
        </p>
      </GlassPanel>
    </div>
  );
}
