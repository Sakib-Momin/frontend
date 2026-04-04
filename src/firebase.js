// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, setPersistence, browserSessionPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Paste your actual Firebase config object here!
const firebaseConfig = {
  apiKey: "AIzaSyBUv7B4Y8Y4Wocai0J5DyaKuKT2mkOHFSw",
  authDomain: "ai-resume-builder-3ba56.firebaseapp.com",
  projectId: "ai-resume-builder-3ba56",
  storageBucket: "ai-resume-builder-3ba56.firebasestorage.app",
  messagingSenderId: "936626190398",
  appId: "1:936626190398:web:70b53caa56ab0df5af796f"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);
export const db = getFirestore(app);

// ==========================================
// 🔐 SET SESSION PERSISTENCE
// This ensures users are automatically logged out
// when they close the browser tab or window.
// ==========================================
setPersistence(auth, browserSessionPersistence)
  .then(() => {
    // Session persistence successfully set!
  })
  .catch((error) => {
    console.error("Auth persistence error:", error);
  });