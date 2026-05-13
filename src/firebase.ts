import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore"; // Ensure this is here!

// Only change the values inside the quotes below
const firebaseConfig = {
  apiKey: "AIzaSyCVj9HCuKZu93eW5jouIVlFGkaYMV3S5hw",
  authDomain: "grocery-run-d7a44.firebaseapp.com",
  projectId: "grocery-run-d7a44",
  storageBucket: "grocery-run-d7a44.firebasestorage.app",
  messagingSenderId: "908830901831",
  appId: "1:908830901831:web:2f37e55cb2bc2a2a695362",
  measurementId: "G-E2T288T4LL"
};

// Initialize the Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and export it so the rest of the app can use it
export const db = getFirestore(app); // This is the line your app was looking for!