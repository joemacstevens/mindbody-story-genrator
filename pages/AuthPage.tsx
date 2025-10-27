import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

type Mode = 'signIn' | 'signUp';

const AuthPage: React.FC = () => {
  const [mode, setMode] = useState<Mode>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetRequested, setResetRequested] = useState(false);
  const { signIn, signUp, resetPassword, signInWithGoogle, error, clearError } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      if (mode === 'signIn') {
        await signIn(email, password);
      } else {
        await signUp(email, password);
      }
      navigate('/', { replace: true });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = async () => {
    if (!email) {
      return;
    }
    setIsSubmitting(true);
    try {
      await resetPassword(email);
      setResetRequested(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsSubmitting(true);
    try {
      await signInWithGoogle();
      navigate('/', { replace: true });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleMode = () => {
    setMode(mode === 'signIn' ? 'signUp' : 'signIn');
    setResetRequested(false);
    clearError();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-950 px-4">
      <div className="w-full max-w-md rounded-3xl border border-neutral-800 bg-neutral-900/70 p-8 text-white shadow-xl shadow-black/30">
        <h1 className="mb-6 text-center text-2xl font-semibold tracking-tight">
          {mode === 'signIn' ? 'Sign in to Studiogram' : 'Create your Studiogram account'}
        </h1>
        <button
          type="button"
          onClick={handleGoogleSignIn}
          className="flex w-full items-center justify-center gap-3 rounded-full border border-white/10 bg-white/10 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/20 disabled:opacity-60"
          disabled={isSubmitting}
        >
          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs font-bold text-neutral-900">
            G
          </span>
          Continue with Google
        </button>
        <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-neutral-500">
          <span className="h-px flex-1 bg-white/10" />
          <span>Email</span>
          <span className="h-px flex-1 bg-white/10" />
        </div>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-neutral-300">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-neutral-950/80 px-4 py-3 text-sm text-white placeholder:text-neutral-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
              autoComplete="email"
              required
              disabled={isSubmitting}
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-neutral-300">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-neutral-950/80 px-4 py-3 text-sm text-white placeholder:text-neutral-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
              autoComplete={mode === 'signIn' ? 'current-password' : 'new-password'}
              minLength={8}
              required
              disabled={isSubmitting}
            />
          </div>
          {error && (
            <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}
          {resetRequested && (
            <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
              Password reset email sent. Check your inbox.
            </div>
          )}
          <button
            type="submit"
            className="w-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:brightness-110 disabled:opacity-60"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Please wait…' : mode === 'signIn' ? 'Sign In' : 'Sign Up'}
          </button>
        </form>
        <div className="mt-6 flex flex-col items-center gap-3 text-sm text-neutral-400">
          <button
            type="button"
            onClick={toggleMode}
            className="text-indigo-300 hover:text-indigo-200"
          >
            {mode === 'signIn'
              ? "Need an account? Create one instead."
              : 'Already have an account? Sign in instead.'}
          </button>
          {mode === 'signIn' && (
            <button
              type="button"
              className="text-indigo-300 hover:text-indigo-200"
              onClick={handleReset}
              disabled={isSubmitting || !email}
            >
              Forgot password? Send reset email
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
