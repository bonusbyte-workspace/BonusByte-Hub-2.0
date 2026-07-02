import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey:            "AIzaSyDi_HhkIGVF138k359doneP8Lqsaj_6ohg",
  authDomain:        "bonusbyte-6a4bb.firebaseapp.com",
  projectId:         "bonusbyte-6a4bb",
  storageBucket:     "bonusbyte-6a4bb.firebasestorage.app",
  messagingSenderId: "1091428714278",
  appId:             "1:1091428714278:web:c5e3a8508a20e2336b63e7",
  measurementId:     "G-021R7P16BP",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db   = getFirestore(app);
export const auth = getAuth(app);
export default app;
