
import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";
import { connectAuthEmulator, getAuth } from "firebase/auth";

export const firebaseConfig = {
  "projectId": "studio-3087748224-d33c9",
  "appId": "1:420177324229:web:a1cf332a3e2ddb6a9328ac",
  "apiKey": "AIzaSyDQae-ruGO-KbZ8P9k1rdy0CLriJUqVFvU",
  "authDomain": "studio-3087748224-d33c9.firebaseapp.com",
  "storageBucket": "studio-3087748224-d33c9.appspot.com",
  "measurementId": "",
  "messagingSenderId": "420177324229"
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
