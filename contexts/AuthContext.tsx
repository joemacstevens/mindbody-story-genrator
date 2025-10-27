import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useRef,
  ReactNode,
} from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
} from 'firebase/auth';
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  AuthError,
} from 'firebase/auth';
import { auth } from '../services/firebase';
import { runUserDataMigration } from '../services/migrations';

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  clearError: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const formatFirebaseError = (message: string | undefined) => {
  if (!message) return 'Authentication failed. Please try again.';
  const parts = message.split(':');
  return parts[parts.length - 1].trim() || 'Authentication failed. Please try again.';
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const migrationTracker = useRef<Record<string, boolean>>({});

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (nextUser) => {
        setUser(nextUser);
        setLoading(false);
        if (nextUser?.uid && !migrationTracker.current[nextUser.uid]) {
          migrationTracker.current[nextUser.uid] = true;
          runUserDataMigration(nextUser.uid).catch((migrationError) => {
            console.error('Failed to complete user data migration', migrationError);
          });
        }
      },
      (authError) => {
        console.error('Firebase auth state error', authError);
        setError(formatFirebaseError(authError?.message));
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      console.error('Firebase sign-in failed', err);
      setError(formatFirebaseError((err as Error)?.message));
      throw err;
    }
  };

  const signUp = async (email: string, password: string) => {
    setError(null);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (err) {
      console.error('Firebase sign-up failed', err);
      setError(formatFirebaseError((err as Error)?.message));
      throw err;
    }
  };

  const signOut = async () => {
    setError(null);
    try {
      await firebaseSignOut(auth);
    } catch (err) {
      console.error('Firebase sign-out failed', err);
      setError(formatFirebaseError((err as Error)?.message));
      throw err;
    }
  };

  const resetPassword = async (email: string) => {
    setError(null);
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (err) {
      console.error('Failed to send password reset email', err);
      setError(formatFirebaseError((err as Error)?.message));
      throw err;
    }
  };

  const signInWithGoogle = async () => {
    setError(null);
    const provider = new GoogleAuthProvider();
    try {
      provider.setCustomParameters({ prompt: 'select_account' });
      await signInWithPopup(auth, provider);
    } catch (err) {
      const authErr = err as AuthError;
      if (authErr?.code === 'auth/popup-blocked') {
        try {
          await signInWithRedirect(auth, provider);
          return;
        } catch (redirectErr) {
          console.error('Google redirect sign-in failed', redirectErr);
          setError(formatFirebaseError((redirectErr as Error)?.message));
          throw redirectErr;
        }
      }
      console.error('Firebase Google sign-in failed', err);
      setError(formatFirebaseError(authErr?.message || (err as Error)?.message));
      throw err;
    }
  };

  const clearError = () => setError(null);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      error,
      signIn,
      signUp,
      signOut,
      resetPassword,
      signInWithGoogle,
      clearError,
    }),
    [user, loading, error],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
