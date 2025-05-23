import React, { createContext, useContext, useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { getFirestore, doc, onSnapshot } from "firebase/firestore";
import { auth, db } from '../../../firebaseConfig';
import { getWhatsAppStatus, connectWhatsApp, disconnectWhatsApp } from '../services/api';

const WhatsAppContext = createContext();

export const useWhatsApp = () => {
  const context = useContext(WhatsAppContext);
  if (!context) {
    throw new Error('useWhatsApp must be used within a WhatsAppProvider');
  }
  return context;
};

export const WhatsAppProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [whatsappStatus, setWhatsappStatus] = useState({
    status: 'disconnected',
    qr: null,
    error: null,
    message: null
  });
  const [isLoading, setIsLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log("Firebase User Signed In:", user);
        setCurrentUser({
          uid: user.uid,
          email: user.email,
          name: user.displayName,
        });
        checkStatus(user.uid);
      } else {
        console.log("Firebase User Signed Out");
        setCurrentUser(null);
        setWhatsappStatus({ status: 'disconnected', qr: null, error: null, message: null });
      }
      setAuthLoading(false);
    });

    return () => {
      unsubscribeAuth();
    };
  }, []);

  useEffect(() => {
    if (!currentUser?.uid) return;

    const userId = currentUser.uid;
    const statusDocRef = doc(db, 'users', userId, 'status', 'whatsapp');

    console.log(`[Firestore Listener] Setting up listener for user ${userId} at path: users/${userId}/status/whatsapp`);

    const unsubscribeFirestore = onSnapshot(statusDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        console.log("[Firestore Listener] Received status update:", data);
        setWhatsappStatus({
          status: data.status || 'unknown',
          qr: data.qrCodeUrl || null,
          error: data.error || null,
          message: data.message || null
        });
      } else {
        console.log("[Firestore Listener] Status document does not exist for user:", userId);
        setWhatsappStatus({ status: 'disconnected', qr: null, error: null, message: 'Status not found.' });
      }
    }, (error) => {
      console.error("[Firestore Listener] Error:", error);
      setWhatsappStatus({ 
        status: 'error', 
        qr: null, 
        error: 'Failed to listen to status updates', 
        message: error.message 
      });
    });

    return () => {
      console.log("[Firestore Listener] Unsubscribing listener for user:", userId);
      unsubscribeFirestore();
    };
  }, [currentUser]);

  const addNotification = (notification) => {
    setNotifications(prev => [
      ...prev,
      { ...notification, id: Date.now(), timestamp: new Date().toISOString() } 
    ]);
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const checkStatus = async (userId) => {
    if (!userId) {
      console.warn("checkStatus llamado sin userId");
      return;
    }

    console.log("Performing initial checkStatus for user:", userId);
    try {
      const response = await getWhatsAppStatus(userId);
      console.log("API Response in checkStatus:", response);
      if (response.success && response.data) {
        setWhatsappStatus(prev => ({
          status: response.data.status || prev.status,
          qr: response.data.qrCodeUrl || prev.qr,
          error: response.data.error || prev.error,
          message: response.data.message || prev.message
        }));
      } else {
        setWhatsappStatus(prev => ({ ...prev, error: response.message }));
      }
    } catch (error) {
      setWhatsappStatus(prev => ({ ...prev, status: 'error', error: error.message }));
    }
  };

  const connect = async () => {
    if (!currentUser?.uid) return;
    const userId = currentUser.uid;

    setIsLoading(true);

    try {
      const response = await connectWhatsApp(userId);
      if (response.success) {
        console.log("Connect API call successful. Firestore listener will handle status updates.");
      } else {
        setWhatsappStatus(prev => ({
          ...prev,
          status: 'error',
          error: response.message || 'Error al iniciar conexión'
        }));
      }
    } catch (error) {
      setWhatsappStatus(prev => ({
        ...prev,
        status: 'error',
        error: error.message || 'Error de conexión'
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const disconnect = async () => {
    if (!currentUser?.uid) return;
    const userId = currentUser.uid;

    setIsLoading(true);
    try {
      const response = await disconnectWhatsApp(userId);
      if (response.success) {
        console.log("Disconnect API call successful. Firestore listener should update status.");
      } else {
        setWhatsappStatus(prev => ({
          ...prev,
          error: response.message
        }));
      }
    } catch (error) {
      setWhatsappStatus(prev => ({
        ...prev,
        error: error.message
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out: ", error);
      addNotification({ type: 'error', title: 'Error al cerrar sesión', message: error.message });
    }
  };

  const value = {
    currentUser,
    authLoading,
    whatsappStatus,
    isLoading,
    connect,
    disconnect,
    checkStatus,
    notifications,
    addNotification,
    clearNotifications,
    logout
  };

  return (
    <WhatsAppContext.Provider value={value}>
      {children}
    </WhatsAppContext.Provider>
  );
}; 