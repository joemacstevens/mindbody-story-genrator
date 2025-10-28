import React from 'react';
import { HashRouter, Routes, Route, Outlet, Link, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import RenderPage from './pages/RenderPage';
import IngestPage from './pages/IngestPage';
import GymFinderPage from './pages/GymFinderPage';
import AuthPage from './pages/AuthPage';
import { useAuth } from './contexts/AuthContext';
import EditorPage from './pages/EditorPage';

const AuthenticatedLayout: React.FC = () => {
  const { user, signOut } = useAuth();
  const avatarFallback =
    user?.displayName?.charAt(0)?.toUpperCase() ||
    user?.email?.charAt(0)?.toUpperCase() ||
    'U';

  return (
    <div className="flex min-h-screen flex-col bg-neutral-900 text-white">
      <header className="border-b border-neutral-800 bg-neutral-950/80 px-4 py-3 sm:px-6">
        <div className="mx-auto flex w-full max-w-screen-2xl items-center justify-between gap-3">
          <Link to="/" className="text-lg font-semibold tracking-tight text-white hover:text-white/80 transition">
            Studiogram
          </Link>
          <div className="flex items-center gap-2">
            <Link
              to="/gym-finder"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-1.5 text-sm font-semibold text-white/80 transition hover:border-white/40 hover:text-white"
            >
              <span className="hidden sm:inline">Gym Finder</span>
              <span className="sm:hidden">Gyms</span>
            </Link>
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-2 py-1.5">
              <div className="h-9 w-9 overflow-hidden rounded-full border border-white/10 bg-neutral-800 text-sm font-semibold text-white/80">
                {user?.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={`Signed in as ${user.displayName || user.email || 'your account'}`}
                    className="h-full w-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">{avatarFallback}</div>
                )}
              </div>
              <button
                type="button"
                onClick={signOut}
                className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold text-white/80 transition hover:text-white"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
};

const ProtectedRoute: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-950 text-white">
        <p className="text-sm text-neutral-400">Checking your account…</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/sign-in" replace />;
  }

  return <AuthenticatedLayout />;
};

const App: React.FC = () => {
  return (
    <HashRouter>
      <Routes>
        <Route path="/sign-in" element={<AuthPage />} />
        <Route path="/sign-up" element={<AuthPage />} />
        <Route path="render" element={<RenderPage />} />
        <Route path="render/:slug" element={<RenderPage />} />
        <Route path="/" element={<ProtectedRoute />}>
          <Route index element={<HomePage />} />
          <Route path="editor" element={<EditorPage />} />
          <Route path="ingest" element={<IngestPage />} />
          <Route path="gym-finder" element={<GymFinderPage />} />
        </Route>
      </Routes>
    </HashRouter>
  );
};

export default App;
