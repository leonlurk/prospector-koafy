import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

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
let storage;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app); // Inicializar Firestore
  storage = getStorage(app); // Initialize Firebase Storage

  // Set authentication persistence
  setPersistence(auth, browserLocalPersistence)
    .catch((error) => {
      console.error("Error setting auth persistence:", error);
    });
} catch (error) {
  console.error("Firebase initialization failed:", error);
  // Manejar el error de inicialización (p.ej., mostrar mensaje al usuario)
}

/**
 * Uploads a file to Firebase Storage for a specific agent's knowledge base.
 * 
 * @param {string} userId - The ID of the user.
 * @param {string} agentId - The ID of the agent.
 * @param {File} file - The file object to upload.
 * @returns {Promise<string>} A promise that resolves with the download URL of the uploaded file.
 * @throws {Error} If the upload fails.
 */
const uploadAgentFile = async (userId, agentId, file) => {
  if (!userId || !agentId || !file) {
    throw new Error("User ID, Agent ID, and file are required for upload.");
  }

  // Create a storage reference
  const filePath = `users/${userId}/agents/${agentId}/knowledge/${Date.now()}_${file.name}`;
  const storageRef = ref(storage, filePath);

  try {
    console.log(`[uploadAgentFile] Uploading ${file.name} to ${filePath}...`);
    // Upload the file
    const snapshot = await uploadBytes(storageRef, file);
    console.log(`[uploadAgentFile] Upload successful for ${file.name}. Snapshot:`, snapshot);

    // Get the download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log(`[uploadAgentFile] Download URL for ${file.name}: ${downloadURL}`);
    
    return downloadURL;
  } catch (error) {
    console.error("[uploadAgentFile] Error uploading file:", error);
    // Throw a more specific error or handle it as needed
    throw new Error(`Failed to upload file ${file.name}: ${error.message}`);
  }
};

// Export necessary Firebase services and the new upload function
export { auth, db, storage, onAuthStateChanged, uploadAgentFile };
