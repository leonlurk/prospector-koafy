import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { collection, getDocs, addDoc, query, where, doc, deleteDoc } from "firebase/firestore";
import { FaTrash, FaPlus, FaTimes, FaCheck } from "react-icons/fa";
import { updateDoc } from "firebase/firestore";

const WhitelistSelector = ({ 
  user, 
  db, 
  users, 
  onWhitelistAdded,
  onClose 
}) => {
  const [whitelists, setWhitelists] = useState([]);
  const [selectedWhitelist, setSelectedWhitelist] = useState(null);
  const [newWhitelistName, setNewWhitelistName] = useState("");
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filteredUsers, setFilteredUsers] = useState([...users]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showRetryButton, setShowRetryButton] = useState(false);
  const [showCloseButton, setShowCloseButton] = useState(false);

  // Fetch existing whitelists
  useEffect(() => {
    const fetchWhitelists = async () => {
      if (!user?.uid) return;

      try {
        const whitelistsRef = collection(db, "users", user.uid, "whitelists");
        const whitelistsSnapshot = await getDocs(whitelistsRef);
        const whitelistsList = whitelistsSnapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        }));
        setWhitelists(whitelistsList);
      } catch (error) {
        console.error("Error fetching whitelists:", error);
        setError("No se pudieron cargar las listas blancas");
      }
    };

    fetchWhitelists();
  }, [user, db]);

  // Update filtered users when search term changes
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredUsers([...users]);
      return;
    }
    
    const filtered = users.filter(username => 
      username.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredUsers(filtered);
  }, [searchTerm, users]);

  // Remove user from selection
  const removeUser = (username) => {
    setFilteredUsers(filteredUsers.filter(user => user !== username));
  };

  // Add users to existing whitelist
  const addUsersToWhitelist = async () => {
    if (!selectedWhitelist) {
      setError("Selecciona una lista blanca");
      return;
    }

    if (filteredUsers.length === 0) {
      setError("No hay usuarios para agregar");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const whitelistUsersRef = collection(
        db, 
        "users", 
        user.uid, 
        "whitelists", 
        selectedWhitelist.id, 
        "users"
      );

      // Get existing users to avoid duplicates
      const existingUsersSnapshot = await getDocs(
        collection(db, "users", user.uid, "whitelists", selectedWhitelist.id, "users")
      );
      const existingUsers = existingUsersSnapshot.docs.map(doc => doc.data().username);

      let uniqueAddedCount = 0;
      const duplicatesCount = filteredUsers.filter(username => existingUsers.includes(username)).length;

      // Add each user to the whitelist
      const addPromises = filteredUsers.map(async (username) => {
        if (!existingUsers.includes(username)) {
          uniqueAddedCount++;
          return addDoc(whitelistUsersRef, {
            username,
            addedAt: new Date()
          });
        }
        return Promise.resolve(); // Devolver una promesa resuelta para no romper Promise.all
      });
      
      await Promise.all(addPromises);
      
      // Si hubo duplicados, informar al usuario
      if (duplicatesCount > 0) {
        setError(`${duplicatesCount} usuarios ya estaban en la lista y no fueron añadidos nuevamente.`);
        setTimeout(() => setError(""), 3000); // Auto-limpiar el mensaje después de 3 segundos
      }
      
      // Update whitelist user count in the whitelist document
      const whitelistRef = doc(db, "users", user.uid, "whitelists", selectedWhitelist.id);
      const newUserCount = existingUsers.length + filteredUsers.filter(u => !existingUsers.includes(u)).length;
      
      // AÑADIR ESTA SECCIÓN: Actualizar el contador en Firestore
      await updateDoc(whitelistRef, {
        userCount: newUserCount
      });
            
      // Notify parent component
      // Verificar que la operación fue exitosa antes de cerrar
let operationSuccessful = true;

try {
  // Actualizar contador en Firestore
  await updateDoc(whitelistRef, {
    userCount: newUserCount
  });
  
  // Notify parent component con feedback confirmando éxito
  if (onWhitelistAdded) {
    onWhitelistAdded({
      ...selectedWhitelist,
      userCount: newUserCount,
      isNew: false,
      addedUsers: filteredUsers.filter(u => !existingUsers.includes(u)),
      totalUsers: newUserCount,
      duplicatesSkipped: duplicatesCount,
      timestamp: new Date(),
      success: true
    });
  }
} catch (error) {
  operationSuccessful = false;
  console.error("Error finalizing whitelist operation:", error);
  setError("La operación se completó pero hubo un error al actualizar el contador");
}

// Solo cerrar si la operación fue exitosa
if (operationSuccessful) {
  onClose();
} else {
  // Mostrar mensaje de error y botón para cerrar manualmente
  setShowCloseButton(true);
}

// Y añadir en la interfaz:
{error && showCloseButton && (
  <div className="mt-4">
    <p className="text-red-500 text-sm mb-2">
      Hubo un problema al finalizar la operación. Los usuarios se han añadido pero puede haber inconsistencias.
    </p>
    <button
      onClick={onClose}
      className="bg-gray-200 text-black py-2 px-4 rounded hover:bg-gray-300"
    >
      Cerrar de todos modos
    </button>
  </div>
)}
    } catch (error) {
      console.error("Error adding users to whitelist:", error);
      setError("Error al agregar usuarios a la lista blanca");
    } finally {
      setLoading(false);
    }
  };

  // Create a new whitelist and add users
  const createAndAddToWhitelist = async () => {
    if (!newWhitelistName.trim()) {
      setError("Ingresa un nombre para la lista blanca");
      return;
    }
    
    // Validar longitud mínima
    if (newWhitelistName.trim().length < 3) {
      setError("El nombre debe tener al menos 3 caracteres");
      return;
    }
    
    // Validar longitud máxima
    if (newWhitelistName.trim().length > 50) {
      setError("El nombre no puede exceder los 50 caracteres");
      return;
    }
    
    // Validar caracteres especiales o formato (opcional)
    const nameRegex = /^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s\-_]+$/;
    if (!nameRegex.test(newWhitelistName.trim())) {
      setError("El nombre solo puede contener letras, números, espacios, guiones y guiones bajos");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const whitelistsRef = collection(db, "users", user.uid, "whitelists");
      
      // Check if a whitelist with the same name already exists
      const querySnapshot = await getDocs(
        query(whitelistsRef, where("name", "==", newWhitelistName.trim()))
      );
      
      if (!querySnapshot.empty) {
        setError("Ya existe una lista con ese nombre");
        setLoading(false);
        return;
      }
      
      // Create new whitelist
      const newWhitelistRef = await addDoc(whitelistsRef, {
        name: newWhitelistName.trim(),
        createdAt: new Date(),
        userCount: filteredUsers.length
      });

      // Add users to new whitelist
      const whitelistUsersRef = collection(
        db, 
        "users", 
        user.uid, 
        "whitelists", 
        newWhitelistRef.id, 
        "users"
      );

      const addPromises = filteredUsers.map(username => 
        addDoc(whitelistUsersRef, {
          username,
          addedAt: new Date()
        })
      );

      await Promise.all(addPromises);

      // Notify parent component
      if (onWhitelistAdded) {
        onWhitelistAdded({
          id: newWhitelistRef.id,
          name: newWhitelistName.trim(),
          userCount: filteredUsers.length,
          isNew: true, // Indicar que es una lista nueva
          addedUsers: filteredUsers,
          timestamp: new Date()
        });
      }

      // Close modal
      onClose();
    } catch (error) {
      console.error("Error creating whitelist:", error);
      
      // Mejorar el mensaje de error con detalles específicos
      let errorMessage = "Error al crear la lista blanca";
      
      if (error.code === 'permission-denied') {
        errorMessage = "No tienes permisos para realizar esta acción";
      } else if (error.code === 'unavailable') {
        errorMessage = "Servicio no disponible. Comprueba tu conexión a internet e inténtalo de nuevo";
      } else if (error.message) {
        // Si el error tiene un mensaje específico, mostrarlo
        errorMessage = `Error: ${error.message}`;
      }
      
      setError(errorMessage);
      
      // Opcional: Agregar un botón de reintento para operaciones críticas
      setShowRetryButton(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-3xl shadow-xl">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-black">Agregar a Lista Blanca</h2>
        <button 
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 bg-transparent"
        >
          <FaTimes size={20} />
        </button>
      </div>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded mb-4">
          {error}
        </div>
      )}

      {/* Search filter for users */}
      <div className="mb-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar usuario..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2 pl-8 border rounded-full bg-white text-gray-500"
          />
          <div className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
            </svg>
          </div>
        </div>
      </div>
      
      {/* Selected users list with removal option */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-medium text-gray-700">Usuarios seleccionados ({filteredUsers.length})</h3>
          {filteredUsers.length < users.length && (
            <button 
              onClick={() => setFilteredUsers([...users])}
              className="text-xs text-white hover:bg-white hover:text-black hover:border-[#232323]"
            >
              Mostrar todos
            </button>
          )}
        </div>
        <div className="max-h-32 overflow-y-auto border rounded-3xl p-2 bg-white">
          {filteredUsers.length > 0 ? (
            <div className="grid grid-cols-2 gap-1">
              {filteredUsers.map(username => (
                <div key={username} className="flex items-center justify-between bg-white p-1 rounded-full border text-sm text-black">
                  <span className="truncate">@{username}</span>
                  <button 
                    onClick={() => removeUser(username)}
                    className="bg-transparent text-red-500 hover:text-red-700 hover:border-red-700 ml-1"
                    title="Eliminar"
                  >
                    <FaTrash size={12} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm italic text-center">
              {searchTerm ? "No hay usuarios que coincidan con la búsqueda" : "No hay usuarios seleccionados"}
            </p>
          )}
        </div>
      </div>

      {!isCreatingNew ? (
        <>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Selecciona una Lista Blanca existente
            </label>
            <select
              value={selectedWhitelist?.id || ''}
              onChange={(e) => {
                const selected = whitelists.find(w => w.id === e.target.value);
                setSelectedWhitelist(selected);
              }}
              className="w-full p-2 border rounded text-black bg-white"
            >
              <option value="">Seleccionar lista</option>
              {whitelists.map(list => (
                <option key={list.id} value={list.id}>
                  {list.name} ({list.userCount || 0} usuarios)
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-between items-center mb-4">
            <button
              onClick={() => setIsCreatingNew(true)}
              className="text-black hover:bg-white border border-[#232323] hover:text-black hover:border-[#232323] flex items-center"
            >
              <FaPlus size={12} className="mr-1" /> Crear nueva lista
            </button>
          </div>

          <div className="flex space-x-2">
          <button
            onClick={addUsersToWhitelist}
            disabled={!selectedWhitelist || loading || filteredUsers.length === 0}
            className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Procesando...
              </>
            ) : 'Agregar a Lista'}
          </button>
          {loading && (
            <div className="absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center z-10">
              <div className="text-center">
                <svg className="animate-spin h-8 w-8 text-blue-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="mt-2 text-blue-600 font-medium">Procesando...</p>
              </div>
            </div>
          )}
            <button
              onClick={onClose}
              className="flex-1 bg-gray-200 text-black py-2 rounded hover:bg-gray-300"
            >
              Cancelar
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre de la Nueva Lista Blanca
            </label>
            <input
              type="text"
              value={newWhitelistName}
              onChange={(e) => setNewWhitelistName(e.target.value)}
              placeholder="Nombre de la lista"
              className="w-full p-2 border rounded-xl bg-white text-black"
            />
          </div>

          <div className="flex space-x-2">
            <button
              onClick={createAndAddToWhitelist}
              disabled={!newWhitelistName.trim() || loading || filteredUsers.length === 0}
              className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creando...' : 'Crear y Agregar'}
            </button>
            <button
              onClick={() => setIsCreatingNew(false)}
              className="flex-1 bg-gray-200 text-black py-2 rounded hover:bg-gray-300"
            >
              Cancelar
            </button>
          </div>
        </>
      )}
    </div>
  );
};

WhitelistSelector.propTypes = {
  user: PropTypes.object.isRequired,
  db: PropTypes.object.isRequired,
  users: PropTypes.array.isRequired,
  onWhitelistAdded: PropTypes.func,
  onClose: PropTypes.func.isRequired
};

export default WhitelistSelector;