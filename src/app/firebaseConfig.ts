import { initializeApp, getApps, getApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// ===== AVAILABILITY PROJECT CONFIG =====
const availabilityConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// ===== CELL-DOWN PROJECT CONFIG =====
const cellDownConfig = {
  apiKey: process.env.NEXT_PUBLIC_CELLDOWN_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_CELLDOWN_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_CELLDOWN_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_CELLDOWN_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_CELLDOWN_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_CELLDOWN_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_CELLDOWN_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_CELLDOWN_FIREBASE_MEASUREMENT_ID
};

// ===== INITIALIZE APPS =====
const availabilityApp = !getApps().length ? initializeApp(availabilityConfig) : getApp();
const cellDownApp = initializeApp(cellDownConfig, 'celldown');

// ===== AVAILABILITY PROJECT EXPORTS =====
export const database = getDatabase(availabilityApp); // Realtime DB for Availability
export const auth = getAuth(availabilityApp); // Auth for both projects
export const db = getFirestore(availabilityApp); // Firestore for User Management

// ===== CELL-DOWN PROJECT EXPORTS =====
export const cellDownDatabase = getDatabase(cellDownApp); // Realtime DB for Cell-Down
export const cellDownAuth = getAuth(cellDownApp); // Auth for Cell-Down (if needed separately) 