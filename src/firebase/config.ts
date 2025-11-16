
import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";
import { connectAuthEmulator, getAuth } from "firebase/auth";

export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);

export const storage = getStorage(app);
export const firestore = getFirestore(app);
export const auth = getAuth(app);

// 🔥 Connect to emulators only in local development
// if (process.env.NODE_ENV === 'development') {
//   console.log('🔥 Using Firebase emulators...');
//   connectFirestoreEmulator(firestore, 'localhost', 8080);
//   connectAuthEmulator(auth, 'http://localhost:9099');
// }

// export default app;  
