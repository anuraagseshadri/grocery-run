import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCVj9HCuKZu93eW5jouIVlFGkaYMV3S5hw",
  authDomain: "grocery-run-d7a44.firebaseapp.com",
  projectId: "grocery-run-d7a44",
  storageBucket: "grocery-run-d7a44.firebasestorage.app",
  messagingSenderId: "908830901831",
  appId: "1:908830901831:web:2f37e55cb2bc2a2a695362",
  measurementId: "G-E2T288T4LL"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
