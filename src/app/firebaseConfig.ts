import { initializeApp, getApps, getApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAqd0ge5gkzFS6gDKpagOIIqRsbepb3Udc",
  authDomain: "availbility.firebaseapp.com",
  databaseURL: "https://availbility-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "availbility",
  storageBucket: "availbility.firebasestorage.app",
  messagingSenderId: "26545685543",
  appId: "1:26545685543:web:15159979ddb975c0023a02",
  measurementId: "G-W479ZEQMD2"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const database = getDatabase(app);
export const auth = getAuth(app);
export const db = getFirestore(app); 