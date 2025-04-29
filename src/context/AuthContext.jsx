import React, { createContext, useState, useEffect, useContext } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebaseConfig'; // Assuming firebaseConfig is in the parent directory (src/)

// Create the context
export const AuthContext = createContext();

// Create the provider component
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true); // Optional: track loading state

  useEffect(() => {
    // Subscribe to auth state changes
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false); // Set loading to false once auth state is determined
      console.log('Auth state changed, currentUser:', user ? user.uid : null); // Log user state
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []); // Empty dependency array ensures this runs only once on mount

  // Provide the currentUser and loading state to children
  const value = {
    currentUser,
    loading, // You can provide the loading state if needed elsewhere
  };

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
  return useContext(AuthContext);
}; 