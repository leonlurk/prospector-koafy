import React, { createContext, useState, useEffect, useContext } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebaseConfig'; // Assuming firebaseConfig is in the parent directory (src/)

// Create the context
export const AuthContext = createContext();

// Create the provider component
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true); // Optional: track loading state
  const [authToken, setAuthToken] = useState(null);

  useEffect(() => {
    // Subscribe to auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('Auth state changed, user:', user ? user.uid : null);
      setCurrentUser(user);
      
      if (user) {
        try {
          // Get the ID token
          const token = await user.getIdToken();
          console.log('Token obtenido correctamente, longitud:', token?.length);
          setAuthToken(token);
        } catch (error) {
          console.error('Error al obtener token:', error);
          setAuthToken(null);
        }
      } else {
        console.log('Usuario no autenticado, limpiando token');
        setAuthToken(null);
      }
      
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []); // Empty dependency array ensures this runs only once on mount

  // Provide the currentUser, authToken and loading state to children
  const value = {
    currentUser,
    authToken,
    loading,
  };

  console.log('AuthProvider rendering with:', { 
    userPresent: !!currentUser, 
    tokenPresent: !!authToken,
    loading 
  });

  // Render children only when not loading (or handle loading state explicitly)
  return (
    <AuthContext.Provider value={value}>
      {!loading && children} 
      {/* Or show a loading spinner: loading ? <Spinner /> : children */}
    </AuthContext.Provider>
  );
};

// Custom hook for easier context usage (optional but recommended)
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    console.error('useAuth debe usarse dentro de un AuthProvider');
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  
  return context;
}; 