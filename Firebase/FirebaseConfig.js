// FirebaseConfig.js
import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  initializeAuth,
  getReactNativePersistence,
} from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { getDatabase } from 'firebase/database';
import { getFirestore } from 'firebase/firestore';

// --- Your Firebase Config ---
const firebaseConfig = {
  apiKey: "AIzaSyBUbxAjFXAPyfV1EQTWyTZ1zetbgLeUuGY",
  authDomain: "timbertech-ba82e.firebaseapp.com",
  projectId: "timbertech-ba82e",
  storageBucket: "timbertech-ba82e.appspot.com",
  messagingSenderId: "740959386810",
  appId: "1:740959386810:web:98cd34ffe6248ecd9d5683",
  measurementId: "G-L53F3X0WH2",
};

// --- Initialize App (only once) ---
const firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// --- Initialize Auth with AsyncStorage Persistence ---
let auth;
try {
  auth = initializeAuth(firebaseApp, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage),
  });
} catch (error) {
  // Already initialized — get existing instance
  auth = getAuth(firebaseApp);
}

// --- Other Firebase Services ---
const database = getDatabase(firebaseApp);
const firestore = getFirestore(firebaseApp);

export { firebaseApp, auth, database, firestore };
