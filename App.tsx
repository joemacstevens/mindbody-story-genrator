import React from 'react';
import { HashRouter, Routes, Route, Outlet } from 'react-router-dom';
import { SignedIn, SignedOut, SignIn, SignUp, UserButton, RedirectToSignIn } from '@clerk/clerk-react';
import HomePage from './pages/HomePage';
import RenderPage from './pages/RenderPage';
import IngestPage from './pages/IngestPage';
import GymFinderPage from './pages/GymFinderPage';

const AuthenticatedLayout: React.FC = () => {
  return (
    <div className="flex min-h-screen flex-col bg-neutral-900 text-white">
      <header className="flex items-center justify-between border-b border-neutral-800 bg-neutral-950/80 px-6 py-4">
        <h1 className="text-lg font-semibold tracking-tight">Studiogram</h1>
        <UserButton afterSignOutUrl="/sign-in" appearance={{ elements: { avatarBox: 'h-10 w-10' } }} />
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
};

const AuthPageShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-950 px-4">
      <div className="w-full max-w-md rounded-3xl border border-neutral-800 bg-neutral-900/70 p-8 text-white shadow-xl shadow-black/30">
        {children}
      </div>
    </div>
  );
};

const ProtectedRoute: React.FC = () => {
  return (
    <>
      <SignedIn>
        <AuthenticatedLayout />
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn routing="hash" redirectUrl="/sign-in" />
      </SignedOut>
    </>
  );
};

const App: React.FC = () => {
  return (
    <HashRouter>
      <Routes>
        <Route
          path="/sign-in"
          element={
            <SignedOut>
              <AuthPageShell>
                <h2 className="mb-6 text-center text-2xl font-semibold tracking-tight">Sign in to Studiogram</h2>
                <SignIn routing="hash" signUpUrl="/sign-up" afterSignInUrl="/" />
              </AuthPageShell>
            </SignedOut>
          }
        />
        <Route
          path="/sign-up"
          element={
            <SignedOut>
              <AuthPageShell>
                <h2 className="mb-6 text-center text-2xl font-semibold tracking-tight">Create your Studiogram account</h2>
                <SignUp routing="hash" signInUrl="/sign-in" afterSignUpUrl="/" />
              </AuthPageShell>
            </SignedOut>
          }
        />
        <Route path="/" element={<ProtectedRoute />}>
          <Route index element={<HomePage />} />
          <Route path="render" element={<RenderPage />} />
          <Route path="ingest" element={<IngestPage />} />
          <Route path="gym-finder" element={<GymFinderPage />} />
        </Route>
      </Routes>
    </HashRouter>
  );
};

export default App;
