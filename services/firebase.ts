import { initializeApp, getApps } from 'firebase/app';
// FIX: The `getDatabase` named import was failing. Changed to a namespace import
// (`* as rtdb`) to resolve the "no exported member" error. This is a common
// workaround for module resolution or CJS/ESM interop issues with bundlers.
import * as rtdb from 'firebase/database';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth, setPersistence, browserLocalPersistence, connectAuthEmulator } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyA_6IDekd7114N5PgymClDRvrx5k-lUTFY",
  authDomain: "gym-schedule-57385.firebaseapp.com",
  projectId: "gym-schedule-57385",
  storageBucket: "gym-schedule-57385.firebasestorage.app",
  messagingSenderId: "679394196941",
  appId: "1:679394196941:web:3b2555150ff74ad1781884",
  measurementId: "G-2PNY583P6J",
  databaseURL: "https://gym-schedule-57385-default-rtdb.firebaseio.com"
};

// Initialize Firebase only if it hasn't been initialized yet.
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// FIX: `getDatabase` is now accessed through the `rtdb` namespace.
export const db = rtdb.getDatabase(app);
export const firestore = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);

auth.useDeviceLanguage();
setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.error('Failed to set Firebase Auth persistence', error);
});

if (import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true') {
  try {
    connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
  } catch (error) {
    console.warn('Auth emulator not available:', error);
  }
}
