import React from 'react';
import { HashRouter, Routes, Route, Outlet, Link, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import RenderPage from './pages/RenderPage';
import IngestPage from './pages/IngestPage';
import GymFinderPage from './pages/GymFinderPage';
import ManualEntryPage from './pages/ManualEntryPage';
import AuthPage from './pages/AuthPage';
import { useAuth } from './contexts/AuthContext';
import EditorPage from './pages/EditorPage';
import { PageTransition } from './components/transition/PageTransition';
import './lib/templates';

const AuthenticatedLayout: React.FC = () => {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const avatarFallback =
    user?.displayName?.charAt(0)?.toUpperCase() ||
    user?.email?.charAt(0)?.toUpperCase() ||
    'U';

  const hideGlobalHeader = location.pathname === '/' || location.pathname.startsWith('/editor');

  return (
    <div className="flex min-h-screen flex-col bg-neutral-900 text-white">
      {!hideGlobalHeader && (
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
      )}
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

const AnimatedRoutes: React.FC = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        <Route
          path="/sign-in"
          element={(
            <PageTransition>
              <AuthPage />
            </PageTransition>
          )}
        />
        <Route
          path="/sign-up"
          element={(
            <PageTransition>
              <AuthPage />
            </PageTransition>
          )}
        />
        <Route
          path="render"
          element={(
            <PageTransition>
              <RenderPage />
            </PageTransition>
          )}
        />
        <Route
          path="render/:slug"
          element={(
            <PageTransition>
              <RenderPage />
            </PageTransition>
          )}
        />
        <Route path="/" element={<ProtectedRoute />}>
          <Route
            index
            element={(
              <PageTransition>
                <EditorPage />
              </PageTransition>
            )}
          />
          <Route
            path="editor"
            element={(
              <PageTransition>
                <EditorPage />
              </PageTransition>
            )}
          />
          <Route
            path="ingest"
            element={(
              <PageTransition>
                <IngestPage />
              </PageTransition>
            )}
          />
          <Route
            path="gym-finder"
            element={(
              <PageTransition>
                <GymFinderPage />
              </PageTransition>
            )}
          />
          <Route
            path="gym-finder/manual"
            element={(
              <PageTransition>
                <ManualEntryPage />
              </PageTransition>
            )}
          />
        </Route>
      </Routes>
    </AnimatePresence>
  );
};

const App: React.FC = () => {
  return (
    <HashRouter>
      <AnimatedRoutes />
    </HashRouter>
  );
};

export default App;
