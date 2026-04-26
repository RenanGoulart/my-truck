import Constants from 'expo-constants';
import { type FirebaseApp, getApps, initializeApp } from 'firebase/app';
import { type Auth, getAuth, signInAnonymously } from 'firebase/auth';
import { type FirebaseStorage, getStorage } from 'firebase/storage';

type FirebaseConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  appId: string;
};

const readConfig = (): FirebaseConfig => {
  const cfg = (Constants.expoConfig?.extra as { firebase?: FirebaseConfig } | undefined)?.firebase;
  if (!cfg || cfg.apiKey === 'REPLACE_ME') {
    throw new Error('Firebase config missing in app.json extra.firebase');
  }
  return cfg;
};

let appInstance: FirebaseApp | null = null;

const getApp = (): FirebaseApp => {
  if (appInstance) return appInstance;
  const existing = getApps();
  appInstance = existing.length > 0 ? existing[0] : initializeApp(readConfig());
  return appInstance;
};

export const getFirebaseAuth = (): Auth => getAuth(getApp());
export const getFirebaseStorage = (): FirebaseStorage => getStorage(getApp());

export const ensureSignedIn = async (): Promise<string> => {
  const auth = getFirebaseAuth();
  if (!auth.currentUser) await signInAnonymously(auth);
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Firebase anonymous sign-in failed');
  return uid;
};
