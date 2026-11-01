import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDDuZxcJcKYEAOM5S3V9KfN6QTL1Dp7v4o",
  authDomain: "srk-birthday-2026.firebaseapp.com",
  projectId: "srk-birthday-2026",
  storageBucket: "srk-birthday-2026.firebasestorage.app",
  messagingSenderId: "495330172971",
  appId: "1:495330172971:web:43794098eb95ff1c824a6e"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);