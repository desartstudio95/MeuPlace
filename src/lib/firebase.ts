import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore, initializeFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';
import { getAnalytics } from 'firebase/analytics';
import { getMessaging, onMessage, getToken, isSupported } from 'firebase/messaging';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
// Enable long polling to bypass potential network restrictions in some environments
export const db = initializeFirestore(app, { 
  experimentalForceLongPolling: true,
  ignoreUndefinedProperties: true
}, firebaseConfig.firestoreDatabaseId === '(default)' ? undefined : firebaseConfig.firestoreDatabaseId);

import { enableNetwork } from 'firebase/firestore';
enableNetwork(db).catch(console.error);

export const auth = getAuth(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

// Initialize messaging lazily to handle unsupported browsers
let messagingInstance: any = null;
export const getMessagingInstance = async () => {
  if (typeof window === 'undefined') return null;
  if (messagingInstance !== null) return messagingInstance;
  
  try {
    const supported = await isSupported();
    if (supported) {
      messagingInstance = getMessaging(app);
    }
  } catch (error) {
    console.error('Error checking messaging support:', error);
  }
  return messagingInstance;
};

// For backward compatibility, but it might be null
export const messaging = null; 

export const googleProvider = new GoogleAuthProvider();

export const requestNotificationPermission = async () => {
  const msg = await getMessagingInstance();
  if (!msg) return null;
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const token = await getToken(msg, {
        vapidKey: 'BPIpI_y8uLp6fX_lI8_lI8_lI8_lI8_lI8_lI8_lI8_lI8_lI8_lI8_lI8_lI8_lI8_lI8_lI8_lI8_lI8_lI8_lI8' // Placeholder VAPID key
      });
      return token;
    }
  } catch (error) {
    console.error('Error requesting notification permission:', error);
  }
  return null;
};

export const onMessageListener = async () => {
  const msg = await getMessagingInstance();
  if (!msg) return new Promise(() => {}); // Return a never-resolving promise or handle accordingly
  
  return new Promise((resolve) => {
    onMessage(msg, (payload) => {
      resolve(payload);
    });
  });
};

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
