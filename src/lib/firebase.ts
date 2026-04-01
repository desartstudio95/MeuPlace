import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore, initializeFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';
import { getAnalytics } from 'firebase/analytics';
import { getMessaging, onMessage, getToken } from 'firebase/messaging';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
// Enable long polling to bypass potential network restrictions in some environments
export const db = firebaseConfig.firestoreDatabaseId === '(default)' 
  ? getFirestore(app)
  : initializeFirestore(app, { experimentalForceLongPolling: true }, firebaseConfig.firestoreDatabaseId);

export const auth = getAuth(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
export const messaging = typeof window !== 'undefined' ? getMessaging(app) : null;
export const googleProvider = new GoogleAuthProvider();

export const requestNotificationPermission = async () => {
  if (!messaging) return null;
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const token = await getToken(messaging, {
        vapidKey: 'BPIpI_y8uLp6fX_lI8_lI8_lI8_lI8_lI8_lI8_lI8_lI8_lI8_lI8_lI8_lI8_lI8_lI8_lI8_lI8_lI8_lI8_lI8' // Placeholder VAPID key
      });
      return token;
    }
  } catch (error) {
    console.error('Error requesting notification permission:', error);
  }
  return null;
};

export const onMessageListener = () =>
  new Promise((resolve) => {
    if (!messaging) return;
    onMessage(messaging, (payload) => {
      resolve(payload);
    });
  });

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Error signing in with Google", error);
    throw error;
  }
};

export const logOut = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out", error);
    throw error;
  }
};
