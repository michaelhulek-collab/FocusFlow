import * as firebaseApp from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";

// Helper type inference since direct import of FirebaseApp might fail in some environments
type FirebaseApp = ReturnType<typeof firebaseApp.initializeApp>;

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;

export interface FirebaseConfig {
    apiKey: string;
    authDomain: string;
    projectId: string;
}

const CONFIG_KEY = 'focusflow_firebase_config';

export const getStoredConfig = (): FirebaseConfig | null => {
    const stored = localStorage.getItem(CONFIG_KEY);
    return stored ? JSON.parse(stored) : null;
};

export const saveConfig = (config: FirebaseConfig) => {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
    // Reload to apply
    window.location.reload();
};

export const initializeFirebase = (): boolean => {
    const config = getStoredConfig();
    if (!config) return false;

    try {
        if (!firebaseApp.getApps().length) {
            app = firebaseApp.initializeApp({
                apiKey: config.apiKey,
                authDomain: config.authDomain,
                projectId: config.projectId,
            });
        } else {
            app = firebaseApp.getApp();
        }
        
        auth = getAuth(app);
        db = getFirestore(app);
        return true;
    } catch (e) {
        console.error("Failed to initialize Firebase", e);
        return false;
    }
};

export const getFirebaseAuth = () => {
    if (!auth) initializeFirebase();
    return auth;
};

export const getFirebaseDb = () => {
    if (!db) initializeFirebase();
    return db;
};