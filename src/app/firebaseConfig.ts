import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getDatabase, Database } from "firebase/database";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";

// ===== AVAILABILITY PROJECT CONFIG =====
const availabilityConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "dummy-api-key",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "dummy.firebaseapp.com",
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || "https://dummy-default-rtdb.firebaseio.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "dummy-project",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "dummy.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:123456789:web:dummy",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-DUMMY"
};

// ===== CELL-DOWN PROJECT CONFIG =====
const cellDownConfig = {
  apiKey: process.env.NEXT_PUBLIC_CELLDOWN_FIREBASE_API_KEY || "dummy-api-key",
  authDomain: process.env.NEXT_PUBLIC_CELLDOWN_FIREBASE_AUTH_DOMAIN || "celldown.firebaseapp.com",
  databaseURL: process.env.NEXT_PUBLIC_CELLDOWN_FIREBASE_DATABASE_URL || "https://celldown-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: process.env.NEXT_PUBLIC_CELLDOWN_FIREBASE_PROJECT_ID || "celldown",
  storageBucket: process.env.NEXT_PUBLIC_CELLDOWN_FIREBASE_STORAGE_BUCKET || "celldown.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_CELLDOWN_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: process.env.NEXT_PUBLIC_CELLDOWN_FIREBASE_APP_ID || "1:123456789:web:dummy",
  measurementId: process.env.NEXT_PUBLIC_CELLDOWN_FIREBASE_MEASUREMENT_ID || "G-DUMMY"
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