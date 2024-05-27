// Import the individual Firebase modules
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import { getFirestore } from 'firebase/firestore';

// Firebase configuration object
const firebaseConfig = {
  apiKey: "AIzaSyBUbxAjFXAPyfV1EQTWyTZ1zetbgLeUuGY",
  authDomain: "timbertech-ba82e.firebaseapp.com",
  projectId: "timbertech-ba82e",
  storageBucket: "timbertech-ba82e.appspot.com",
  messagingSenderId: "740959386810",
  appId: "1:740959386810:web:98cd34ffe6248ecd9d5683",
  measurementId: "G-L53F3X0WH2"
};

// Initialize Firebase app
const firebaseApp = initializeApp(firebaseConfig);

// Get Firebase services
const auth = getAuth(firebaseApp);
const database = getDatabase(firebaseApp);
const firestore = getFirestore(firebaseApp);
export { auth, database, firestore };

