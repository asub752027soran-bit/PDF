import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAnalytics, isSupported } from 'firebase/analytics';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  AuthError
} from 'firebase/auth';

// User provided Firebase configuration for pdfeditfy
export const firebaseConfig = {
  apiKey: "AIzaSyCtb6BetQ8XUQjLYVuYaBrPBfXZGBPAVXY",
  authDomain: "pdfeditfy.firebaseapp.com",
  projectId: "pdfeditfy",
  storageBucket: "pdfeditfy.firebasestorage.app",
  messagingSenderId: "179789699009",
  appId: "1:179789699009:web:50aab167559b26289fc140",
  measurementId: "G-KW777T56MT"
};

// Initialize Firebase App
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);

// Initialize Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Helper for Analytics
export const initAnalytics = async () => {
  if (typeof window !== 'undefined' && await isSupported()) {
    return getAnalytics(app);
  }
  return null;
};

export {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
};
export type { User, AuthError };
