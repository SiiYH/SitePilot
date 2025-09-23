
import { initializeApp, getApps, getApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "AIzaSyDJqCw3nIQQHAQtWRi-T2UL3QlCCVhywPQ",
  authDomain: "sitepilot-29e80.firebaseapp.com",
  projectId: "sitepilot-29e80",
  storageBucket: "sitepilot-29e80.appspot.com",
  messagingSenderId: "441624896794",
  appId: "1:441624896794:web:8dd3f4219f45775086d421",
  measurementId: "G-8L5J7W8J4P"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export { app };
