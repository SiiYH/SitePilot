
import { initializeApp, getApps, getApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "AIzaSyDJqCw3nIQQHAQtWRi-T2UL3QlCCVhywPQ",
  authDomain: "sitepilot-29e80.firebaseapp.com",
  projectId: "sitepilot-29e80",
  storageBucket: "sitepilot-29e80.appspot.com",
  messagingSenderId: "961120405483",
  appId: "1:961120405483:web:91099236c1d02d203efbae",
  measurementId: "G-WVD74EE0QZ"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export { app };
