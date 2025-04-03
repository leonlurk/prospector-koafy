import { useState, useEffect, useRef } from "react";
import { db } from "../firebaseConfig";
import { collection, addDoc, getDocs, doc, deleteDoc, query, where, setDoc } from "firebase/firestore";
import logApiRequest from "../requestLogger";

const BlacklistDashboard = ({ user }) => {
  const [blacklistUsers, setBlacklistUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [notification, setNotification] = useState({ show: false, message: "", type: "" });
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [manualUsername, setManualUsername] = useState("");
  const notificationTimerRef = useRef(null);

  // Función para mostrar notificaciones
  const showNotification = (message, type = "info") => {
    if (notificationTimerRef.current) {
      clearTimeout(notificationTimerRef.current);
    }
    
    setNotification({ show: true, message, type });
    
    notificationTimerRef.current = setTimeout(() => {
      setNotification({ show: false, message: "", type: "" });
      notificationTimerRef.current = null;
    }, 3000);
  };

  // Limpiar temporizador de notificación al desmontar
  useEffect(() => {
    return () => {
      if (notificationTimerRef.current) {
        clearTimeout(notificationTimerRef.current);
      }
    };
  }, []);

  // Cargar usuarios de la lista negra
  const fetchBlacklistUsers = async () => {
    if (!user || !user.uid) return;

    try {
      setIsLoading(true);
      
      // Log the blacklist users fetch attempt
      await logApiRequest({
        endpoint: "internal/fetch_blacklist_users",
        requestData: { userId: user.uid },
        userId: user.uid,
        status: "pending",
        source: "BlacklistDashboard",
        metadata: {
          action: "fetch_blacklist_users"
        }
      });
      
      // Asumimos que hay una única lista negra principal o la primera disponible
      const blacklistsRef = collection(db, "users", user.uid, "blacklists");
      const blacklistsSnapshot = await getDocs(blacklistsRef);
      
      if (blacklistsSnapshot.empty) {
        setBlacklistUsers([]);
        setIsLoading(false);
        return;
      }
      
      // Tomamos la primera lista negra
      const blacklistId = blacklistsSnapshot.docs[0].id;
      
      // Obtenemos los usuarios de esa lista
      const usersRef = collection(db, "users", user.uid, "blacklists", blacklistId, "users");
      const usersSnapshot = await getDocs(usersRef);
      const usersList = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setBlacklistUsers(usersList);
      
      // Log the blacklist users fetch success
      await logApiRequest({
        endpoint: "internal/fetch_blacklist_users",
        requestData: { userId: user.uid },
        userId: user.uid,
        responseData: { count: usersList.length },
        status: "success",
        source: "BlacklistDashboard",
        metadata: {
          action: "fetch_blacklist_users",
          userCount: usersList.length
        }
      });
    } catch (error) {
      console.error("Error al cargar usuarios de la lista negra:", error);
      showNotification("Error al cargar usuarios", "error");
      
      // Log the blacklist users fetch error
      await logApiRequest({
        endpoint: "internal/fetch_blacklist_users",
        requestData: { userId: user.uid },
        userId: user.uid,
        status: "error",
        source: "BlacklistDashboard",
        metadata: {
          action: "fetch_blacklist_users",
          error: error.message
        }
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Eliminar un usuario de la lista negra
  const deleteUserFromBlacklist = async (userId) => {
    if (!user || !user.uid) return;

    try {
      setIsLoading(true);
      
      // Primero necesitamos obtener el ID de la lista negra
      const blacklistsRef = collection(db, "users", user.uid, "blacklists");
      const blacklistsSnapshot = await getDocs(blacklistsRef);
      
      if (blacklistsSnapshot.empty) {
        showNotification("No se encontró una lista negra", "error");
        setIsLoading(false);
        return;
      }
      
      const blacklistId = blacklistsSnapshot.docs[0].id;
      
      // Log the user deletion attempt
      await logApiRequest({
        endpoint: "internal/delete_blacklist_user",
        requestData: { 
          blacklistId: blacklistId,
          blacklistUserId: userId
        },
        userId: user.uid,
        status: "pending",
        source: "BlacklistDashboard",
        metadata: {
          action: "delete_blacklist_user",
          blacklistId: blacklistId,
          blacklistUserId: userId
        }
      });
      
      await deleteDoc(doc(db, "users", user.uid, "blacklists", blacklistId, "users", userId));
      
      // Actualizar conteo de usuarios en la lista
      const updatedUsers = blacklistUsers.filter(user => user.id !== userId);
      setBlacklistUsers(updatedUsers);
      
      // Actualizar el contador de usuarios en el documento de la blacklist en Firestore
      const blacklistDoc = doc(db, "users", user.uid, "blacklists", blacklistId);
      await setDoc(blacklistDoc, { userCount: updatedUsers.length }, { merge: true });
      
      showNotification("Usuario eliminado de la lista negra", "success");
      
      // Log the user deletion success
      await logApiRequest({
        endpoint: "internal/delete_blacklist_user",
        requestData: { 
          blacklistId: blacklistId,
          blacklistUserId: userId
        },
        userId: user.uid,
        status: "success",
        source: "BlacklistDashboard",
        metadata: {
          action: "delete_blacklist_user",
          blacklistId: blacklistId,
          blacklistUserId: userId,
          updatedUserCount: updatedUsers.length
        }
      });
    } catch (error) {
      console.error("Error al eliminar usuario de la lista negra:", error);
      showNotification("Error al eliminar usuario", "error");
      
      // Log the user deletion error
      await logApiRequest({
        endpoint: "internal/delete_blacklist_user",
        requestData: { blacklistUserId: userId },
        userId: user.uid,
        status: "error",
        source: "BlacklistDashboard",
        metadata: {
          action: "delete_blacklist_user",
          blacklistUserId: userId,
          error: error.message
        }
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Cargar los usuarios al montar el componente
  useEffect(() => {
    if (user && user.uid) {
      fetchBlacklistUsers();
    }
  }, [user]);

  // Agregar usuario manualmente a la lista negra
  const addUserToBlacklist = async () => {
    if (!user || !user.uid) return;
    
    if (!manualUsername.trim()) {
      showNotification("Ingresa un nombre de usuario válido", "warning");
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Obtenemos primero la lista negra
      const blacklistsRef = collection(db, "users", user.uid, "blacklists");
      const blacklistsSnapshot = await getDocs(blacklistsRef);
      
      let blacklistId;
      
      // Si no existe una lista negra, la creamos
      if (blacklistsSnapshot.empty) {
        const newBlacklistRef = await addDoc(blacklistsRef, {
          name: "Lista Principal",
          createdAt: new Date(),
          userCount: 0
        });
        blacklistId = newBlacklistRef.id;
      } else {
        blacklistId = blacklistsSnapshot.docs[0].id;
      }
      
      // Log the user addition attempt
      await logApiRequest({
        endpoint: "internal/add_blacklist_user",
        requestData: { 
          blacklistId: blacklistId,
          username: manualUsername.trim()
        },
        userId: user.uid,
        status: "pending",
        source: "BlacklistDashboard",
        metadata: {
          action: "add_blacklist_user",
          blacklistId: blacklistId,
          username: manualUsername.trim()
        }
      });
      
      // Verificar si el usuario ya existe en la lista
      const usersRef = collection(db, "users", user.uid, "blacklists", blacklistId, "users");
      const q = query(usersRef, where("username", "==", manualUsername.trim()));
      const existingUserSnapshot = await getDocs(q);
      
      if (!existingUserSnapshot.empty) {
        showNotification("Este usuario ya está en la lista negra", "warning");
        
        await logApiRequest({
          endpoint: "internal/add_blacklist_user",
          requestData: { 
            blacklistId: blacklistId,
            username: manualUsername.trim()
          },
          userId: user.uid,
          status: "error",
          source: "BlacklistDashboard",
          metadata: {
            action: "add_blacklist_user",
            error: "duplicate_user",
            blacklistId: blacklistId,
            username: manualUsername.trim()
          }
        });
        
        setIsLoading(false);
        return;
      }
      
      // Agregar el usuario a la lista negra
      const docRef = await addDoc(usersRef, {
        username: manualUsername.trim(),
        addedAt: new Date(),
        source: "manual_input",
        reason: "Agregado manualmente"
      });
      
      // Actualizar la UI
      const newUser = {
        id: docRef.id,
        username: manualUsername.trim(),
        addedAt: new Date(),
        source: "manual_input",
        reason: "Agregado manualmente"
      };
      
      setBlacklistUsers([...blacklistUsers, newUser]);
      
      // Actualizar contador en la lista negra en Firestore
      const blacklistDoc = doc(db, "users", user.uid, "blacklists", blacklistId);
      const newUserCount = blacklistUsers.length + 1;
      await setDoc(blacklistDoc, { userCount: newUserCount }, { merge: true });
      
      setManualUsername("");
      setIsAddUserModalOpen(false);
      showNotification("Usuario añadido a la lista negra", "success");
      
      // Log the user addition success
      await logApiRequest({
        endpoint: "internal/add_blacklist_user",
        requestData: { 
          blacklistId: blacklistId,
          username: manualUsername.trim()
        },
        userId: user.uid,
        responseData: { userId: docRef.id },
        status: "success",
        source: "BlacklistDashboard",
        metadata: {
          action: "add_blacklist_user",
          blacklistId: blacklistId,
          username: manualUsername.trim(),
          userId: docRef.id
        }
      });
      
    } catch (error) {
      console.error("Error al agregar usuario a la lista negra:", error);
      showNotification("Error al agregar usuario", "error");
      
      // Log the user addition error
      await logApiRequest({
        endpoint: "internal/add_blacklist_user",
        requestData: { username: manualUsername.trim() },
        userId: user.uid,
        status: "error",
        source: "BlacklistDashboard",
        metadata: {
          action: "add_blacklist_user",
          error: error.message,
          username: manualUsername.trim()
        }
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Filtrar usuarios por término de búsqueda
  const filteredUsers = searchTerm
    ? blacklistUsers.filter(user => 
        user.username?.toLowerCase().includes(searchTerm.toLowerCase()))
    : blacklistUsers;

  return (
    <div className="bg-[#F3F2FC] min-h-screen p-6">
      {/* Barra de búsqueda y botón de cargar perfiles */}
      <div className="flex items-center mb-4">
        <div className="relative flex-grow mr-4">
          <img className="w-12 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" src="/search.png" />
          <input
            type="text"
            placeholder="Buscar Perfil"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-20 p-3 bg-white rounded-full text-xl text-black border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#5468FF] h-16"
          />
        </div>
        <button 
          onClick={() => setIsAddUserModalOpen(true)}
          className="bg-white text-black px-4 py-3 rounded-full border border-gray-200 flex items-center gap-2 h-16"
        >
          <img src="/user-add.png" className="w-8"/> Cargar perfiles
        </button>
      </div>

      {/* Lista de usuarios */}
      <div className="space-y-4">
        {isLoading && blacklistUsers.length === 0 ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#5468FF]"></div>
            <span className="ml-2">Cargando usuarios...</span>
          </div>
        ) : filteredUsers.length > 0 ? (
          filteredUsers.map(user => (
            <div 
              key={user.id} 
              className="bg-white rounded-lg p-4 flex items-center justify-between shadow-sm hover:shadow-md transition"
            >
              <div className="flex items-center space-x-4">
                <img 
                  src="/blacklisted.png" 
                  alt="User Avatar" 
                  className="w-20 rounded-full object-cover"
                />
                <div>
                  <h3 className="font-medium text-gray-800 text-xl">{user.username}</h3>
                  <p className="text-sm text-gray-500">
                    @{user.username?.toLowerCase().replace(/\s/g, '') || "username"}
                  </p>
                </div>
              </div>
              <button 
                className="text-gray-400 bg-transparent hover:text-red-500 hover:border-red-500 p-2 cursor-pointer"
                onClick={() => deleteUserFromBlacklist(user.id)}
                aria-label="Eliminar usuario"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))
        ) : (
          <div className="p-8 bg-white rounded-lg text-center">
            <p className="text-gray-500">
              {searchTerm
                ? "No se encontraron usuarios que coincidan con la búsqueda."
                : "No hay usuarios en la lista negra. Carga perfiles para comenzar."}
            </p>
          </div>
        )}
      </div>

      {/* Sistema de notificaciones */}
      {notification.show && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
          notification.type === 'success' ? 'bg-green-500' : 
          notification.type === 'error' ? 'bg-red-500' : 
          notification.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
        } text-white`}>
          {notification.message}
        </div>
      )}

      {/* Modal para agregar usuario */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-lg text-[#232323]">Agregar perfil a la lista negra</h3>
              <button 
                onClick={() => setIsAddUserModalOpen(false)} 
                className="text-gray-500 hover:bg-gray-100 p-1 bg-transparent"
                aria-label="Cerrar modal"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Usuario de Instagram
              </label>
              <input
                type="text"
                placeholder="@username"
                value={manualUsername}
                onChange={(e) => setManualUsername(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white text-black"
              />
            </div>
            
            <div className="flex gap-2 mt-6">
              <button
                onClick={addUserToBlacklist}
                disabled={isLoading || !manualUsername.trim()}
                className={`flex-1 py-2 px-4 rounded-md ${
                  isLoading || !manualUsername.trim()
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : 'bg-[#5468FF] text-white hover:bg-[#4356cc] transition'
                }`}
              >
                {isLoading ? 'Agregando...' : 'Agregar'}
              </button>
              <button
                onClick={() => setIsAddUserModalOpen(false)}
                className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 transition"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BlacklistDashboard;