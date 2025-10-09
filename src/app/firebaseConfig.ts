import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getDatabase, Database } from "firebase/database";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";

// ===== AVAILABILITY PROJECT CONFIG =====
const availabilityConfig = {
  apiKey: "AIzaSyAqd0ge5gkzFS6gDKpagOIIqRsbepb3Udc",
  authDomain: "availbility.firebaseapp.com",
  databaseURL: "https://availbility-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "availbility",
  storageBucket: "availbility.firebasestorage.app",
  messagingSenderId: "26545685543",
  appId: "1:26545685543:web:15159979ddb975c0023a02",
  measurementId: "G-W479ZEQMD2"
};

// ===== CELL-DOWN PROJECT CONFIG =====
const cellDownConfig = {
  apiKey: "AIzaSyDmfoXUPeOUkz8Irsc4hnha2GPsRwEwrZM",
  authDomain: "celldown.firebaseapp.com",
  databaseURL: "https://celldown-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "celldown",
  storageBucket: "celldown.firebasestorage.app",
  messagingSenderId: "554158819494",
  appId: "1:554158819494:web:d678599585c8e09d4e0c67",
  measurementId: "G-BP1LWVESWY"
};

// ===== INITIALIZE APPS =====
let availabilityApp: FirebaseApp | null = null;
let cellDownApp: FirebaseApp | null = null;
let database: Database | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let cellDownDatabase: Database | null = null;
let cellDownAuth: Auth | null = null;

try {
  availabilityApp = !getApps().length ? initializeApp(availabilityConfig) : getApp();
  cellDownApp = initializeApp(cellDownConfig, 'celldown');
  
  // ===== AVAILABILITY PROJECT EXPORTS =====
  database = getDatabase(availabilityApp); // Realtime DB for Availability
  auth = getAuth(availabilityApp); // Auth for both projects
  db = getFirestore(availabilityApp); // Firestore for User Management
  
  // ===== CELL-DOWN PROJECT EXPORTS =====
  cellDownDatabase = getDatabase(cellDownApp); // Realtime DB for Cell-Down
  cellDownAuth = getAuth(cellDownApp); // Auth for Cell-Down (if needed separately)
} catch (error) {
  console.error('Firebase initialization error:', error);
  // Fallback for build time
  availabilityApp = null;
  cellDownApp = null;
  database = null;
  auth = null;
  db = null;
  cellDownDatabase = null;
  cellDownAuth = null;
}

export { database, auth, db, cellDownDatabase, cellDownAuth }; 