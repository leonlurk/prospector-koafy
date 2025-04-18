import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Leer la configuración desde las variables de entorno de Vite
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  // measurementId es opcional, solo incluir si está definida
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || undefined 
};

// Validar que las variables esenciales estén presentes
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.error("Error: Missing Firebase configuration. Check your .env file and ensure VITE_FIREBASE_API_KEY and VITE_FIREBASE_PROJECT_ID are set.");
  // Podrías lanzar un error o mostrar un mensaje al usuario aquí
}

// Inicializar Firebase
let app;
let auth;
let db;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app); // Inicializar Firestore
} catch (error) {
  console.error("Firebase initialization failed:", error);
  // Manejar el error de inicialización (p.ej., mostrar mensaje al usuario)
}

export { auth, db };
