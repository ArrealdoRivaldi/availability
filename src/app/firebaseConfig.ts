import { initializeApp, getApps, getApp, cert } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// ===== AVAILABILITY PROJECT CONFIG (SERVICE ACCOUNT) =====
const availabilityConfig = {
  credential: cert(JSON.parse(process.env.availability_service_account || '{}')),
  databaseURL: 'https://availbility-default-rtdb.asia-southeast1.firebasedatabase.app'
};

// ===== CELL-DOWN PROJECT CONFIG (SERVICE ACCOUNT) =====
const cellDownConfig = {
  credential: cert(JSON.parse(process.env.celldown_service_account || '{}')),
  databaseURL: 'https://celldown-default-rtdb.asia-southeast1.firebasedatabase.app'
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