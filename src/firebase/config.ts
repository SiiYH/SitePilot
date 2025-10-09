
import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

export const firebaseConfig = {
  "projectId": "studio-3087748224-d33c9",
  "appId": "1:420177324229:web:a1cf332a3e2ddb6a9328ac",
  "apiKey": "AIzaSyDQae-ruGO-KbZ8P9k1rdy0CLriJUqVFvU",
  "authDomain": "studio-3087748224-d33c9.firebaseapp.com",
  "storageBucket": "studio-3087748224-d33c9.firebasestorage.app",
  "measurementId": "",
  "messagingSenderId": "420177324229"
};

const app = initializeApp(firebaseConfig);

export const storage = getStorage(app);
export const firestore = getFirestore(app);
export const auth = getAuth(app);
