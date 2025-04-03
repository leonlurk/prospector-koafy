import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { doc, deleteDoc, collection, getDocs, updateDoc } from "firebase/firestore";
import { FaTrash, FaPen, FaTimes, FaSearch, FaUsers } from "react-icons/fa";
import logApiRequest from "../requestLogger";

const WhitelistModalManager = ({ 
  user, 
  db, 
  selectedWhitelist, 
  onClose, 
  onWhitelistUpdated, 
  onWhitelistDeleted 
}) => {
  const [whitelistUsers, setWhitelistUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Fetch users for the selected whitelist
  useEffect(() => {
    const fetchWhitelistUsers = async () => {
      if (!user?.uid || !selectedWhitelist?.id) return;

      try {
        setLoading(true);
        setError("");
        
        // Log API request
        await logApiRequest({
          endpoint: "internal/fetch_whitelist_users",
          requestData: { whitelistId: selectedWhitelist.id },
          userId: user.uid,
          status: "pending",
          source: "WhitelistModalManager",
          metadata: {
            action: "fetch_whitelist_users",
            whitelistId: selectedWhitelist.id
          }
        });
        
        const usersRef = collection(db, "users", user.uid, "whitelists", selectedWhitelist.id, "users");
        const usersSnapshot = await getDocs(usersRef);
        const usersList = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setWhitelistUsers(usersList);
        
        // Log success
        await logApiRequest({
          endpoint: "internal/fetch_whitelist_users",
          requestData: { whitelistId: selectedWhitelist.id },
          userId: user.uid,
          responseData: { count: usersList.length },
          status: "success",
          source: "WhitelistModalManager",
          metadata: {
            action: "fetch_whitelist_users",
            whitelistId: selectedWhitelist.id,
            userCount: usersList.length
          }
        });
      } catch (error) {
        console.error("Error fetching whitelist users:", error);
        setError("No se pudieron cargar los usuarios de la lista");
        
        // Log error
        await logApiRequest({
          endpoint: "internal/fetch_whitelist_users",
          requestData: { whitelistId: selectedWhitelist.id },
          userId: user.uid,
          status: "error",
          source: "WhitelistModalManager",
          metadata: {
            action: "fetch_whitelist_users",
            whitelistId: selectedWhitelist.id,
            error: error.message
          }
        });
      } finally {
        setLoading(false);
      }
    };

    fetchWhitelistUsers();
  }, [db, user, selectedWhitelist]);

  // Filter users based on search term
  const filteredUsers = searchTerm
    ? whitelistUsers.filter(user => 
        user.username?.toLowerCase().includes(searchTerm.toLowerCase()))
    : whitelistUsers;

  // Delete user from whitelist
  const deleteUser = async (userId) => {
    if (!user?.uid || !selectedWhitelist?.id) return;

    try {
      setLoading(true);
      setError("");
      
      // Log API request
      await logApiRequest({
        endpoint: "internal/delete_whitelist_user",
        requestData: { 
          whitelistId: selectedWhitelist.id,
          whitelistUserId: userId
        },
        userId: user.uid,
        status: "pending",
        source: "WhitelistModalManager",
        metadata: {
          action: "delete_whitelist_user",
          whitelistId: selectedWhitelist.id,
          whitelistUserId: userId
        }
      });
      
      await deleteDoc(doc(db, "users", user.uid, "whitelists", selectedWhitelist.id, "users", userId));
      
      // Update user list
      setWhitelistUsers(whitelistUsers.filter(user => user.id !== userId));
      
      // Update whitelist user count
      const newUserCount = (selectedWhitelist.userCount || 0) - 1;
      await updateDoc(doc(db, "users", user.uid, "whitelists", selectedWhitelist.id), {
        userCount: newUserCount
      });
      
      // Update parent component
      if (onWhitelistUpdated) {
        onWhitelistUpdated({
          ...selectedWhitelist,
          userCount: newUserCount
        });
      }
      
      setSuccess("Usuario eliminado con éxito");
      setTimeout(() => setSuccess(""), 3000);
      
      // Log success
      await logApiRequest({
        endpoint: "internal/delete_whitelist_user",
        requestData: { 
          whitelistId: selectedWhitelist.id,
          whitelistUserId: userId
        },
        userId: user.uid,
        status: "success",
        source: "WhitelistModalManager",
        metadata: {
          action: "delete_whitelist_user",
          whitelistId: selectedWhitelist.id,
          whitelistUserId: userId,
          updatedUserCount: newUserCount
        }
      });
    } catch (error) {
      console.error("Error deleting user from whitelist:", error);
      setError("Error al eliminar el usuario de la lista");
      
      // Log error
      await logApiRequest({
        endpoint: "internal/delete_whitelist_user",
        requestData: { 
          whitelistId: selectedWhitelist.id,
          whitelistUserId: userId
        },
        userId: user.uid,
        status: "error",
        source: "WhitelistModalManager",
        metadata: {
          action: "delete_whitelist_user",
          whitelistId: selectedWhitelist.id,
          whitelistUserId: userId,
          error: error.message
        }
      });
    } finally {
      setLoading(false);
    }
  };

  // Rename whitelist
  const renameWhitelist = async () => {
    if (!user?.uid || !selectedWhitelist?.id || !newName.trim()) return;

    try {
      setLoading(true);
      setError("");
      
      // Log API request
      await logApiRequest({
        endpoint: "internal/update_whitelist",
        requestData: { 
          whitelistId: selectedWhitelist.id,
          newName: newName.trim()
        },
        userId: user.uid,
        status: "pending",
        source: "WhitelistModalManager",
        metadata: {
          action: "rename_whitelist",
          whitelistId: selectedWhitelist.id,
          oldName: selectedWhitelist.name,
          newName: newName.trim()
        }
      });
      
      await updateDoc(doc(db, "users", user.uid, "whitelists", selectedWhitelist.id), {
        name: newName.trim()
      });
      
      // Update parent component
      if (onWhitelistUpdated) {
        onWhitelistUpdated({
          ...selectedWhitelist,
          name: newName.trim()
        });
      }
      
      setSuccess("Lista renombrada con éxito");
      setTimeout(() => setSuccess(""), 3000);
      setIsRenaming(false);
      
      // Log success
      await logApiRequest({
        endpoint: "internal/update_whitelist",
        requestData: { 
          whitelistId: selectedWhitelist.id,
          newName: newName.trim()
        },
        userId: user.uid,
        status: "success",
        source: "WhitelistModalManager",
        metadata: {
          action: "rename_whitelist",
          whitelistId: selectedWhitelist.id,
          oldName: selectedWhitelist.name,
          newName: newName.trim()
        }
      });
    } catch (error) {
      console.error("Error renaming whitelist:", error);
      setError("Error al renombrar la lista");
      
      // Log error
      await logApiRequest({
        endpoint: "internal/update_whitelist",
        requestData: { 
          whitelistId: selectedWhitelist.id,
          newName: newName.trim()
        },
        userId: user.uid,
        status: "error",
        source: "WhitelistModalManager",
        metadata: {
          action: "rename_whitelist",
          whitelistId: selectedWhitelist.id,
          error: error.message
        }
      });
    } finally {
      setLoading(false);
    }
  };

  // Delete whitelist
  const deleteWhitelist = async () => {
    if (!user?.uid || !selectedWhitelist?.id) return;

    try {
      setLoading(true);
      setError("");
      
      // Log API request
      await logApiRequest({
        endpoint: "internal/delete_whitelist",
        requestData: { whitelistId: selectedWhitelist.id },
        userId: user.uid,
        status: "pending",
        source: "WhitelistModalManager",
        metadata: {
          action: "delete_whitelist",
          whitelistId: selectedWhitelist.id,
          whitelistName: selectedWhitelist.name
        }
      });
      
      // First delete all users in the whitelist
      const usersRef = collection(db, "users", user.uid, "whitelists", selectedWhitelist.id, "users");
      const usersSnapshot = await getDocs(usersRef);
      
      const deletePromises = usersSnapshot.docs.map(userDoc => 
        deleteDoc(doc(db, "users", user.uid, "whitelists", selectedWhitelist.id, "users", userDoc.id))
      );
      
      await Promise.all(deletePromises);
      
      // Then delete the whitelist document
      await deleteDoc(doc(db, "users", user.uid, "whitelists", selectedWhitelist.id));
      
      // Notify parent component
      if (onWhitelistDeleted) {
        onWhitelistDeleted(selectedWhitelist.id);
      }
      
      // Log success
      await logApiRequest({
        endpoint: "internal/delete_whitelist",
        requestData: { whitelistId: selectedWhitelist.id },
        userId: user.uid,
        status: "success",
        source: "WhitelistModalManager",
        metadata: {
          action: "delete_whitelist",
          whitelistId: selectedWhitelist.id,
          whitelistName: selectedWhitelist.name,
          deletedUsersCount: usersSnapshot.docs.length
        }
      });
      
      // Close modal
      onClose();
    } catch (error) {
      console.error("Error deleting whitelist:", error);
      setError("Error al eliminar la lista");
      setConfirmDelete(false);
      
      // Log error
      await logApiRequest({
        endpoint: "internal/delete_whitelist",
        requestData: { whitelistId: selectedWhitelist.id },
        userId: user.uid,
        status: "error",
        source: "WhitelistModalManager",
        metadata: {
          action: "delete_whitelist",
          whitelistId: selectedWhitelist.id,
          error: error.message
        }
      });
    } finally {
      setLoading(false);
    }
  };

  // Initialize rename field with current name
  useEffect(() => {
    if (selectedWhitelist) {
      setNewName(selectedWhitelist.name || "");
    }
  }, [selectedWhitelist]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b flex justify-between items-center bg-white">
          <div className="flex items-center space-x-3">
            <div className="bg-black text-white p-2 rounded-full">
              <FaUsers size={20} />
            </div>
            <div>
              {isRenaming ? (
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="border p-1 rounded text-black bg-white"
                    placeholder="Nuevo nombre"
                    autoFocus
                  />
                  <button
                    onClick={renameWhitelist}
                    disabled={loading || !newName.trim()}
                    className="bg-[#5468FF] text-white rounded-full hover:bg-[#3340a3]"
                  >
                    Guardar
                  </button>
                  <button
                    onClick={() => {
                      setIsRenaming(false);
                      setNewName(selectedWhitelist.name || "");
                    }}
                    className="bg-white text-black border border-[#232323] rounded-full hover:border-[#c74242] hover:text-[#c74242]"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <h3 className="font-semibold text-lg text-black">{selectedWhitelist.name}</h3>
                  <button
                    onClick={() => setIsRenaming(true)}
                    className="text-black rounded-xl bg-transparent hover:text-[#5468FF]"
                    title="Renombrar lista"
                  >
                    <FaPen size={14} />
                  </button>
                </div>
              )}
              <p className="text-sm text-gray-500">
                {selectedWhitelist.userCount || whitelistUsers.length} usuarios
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-500 bg-transparent hover:text-black hover:border-[#232323]"
          >
            <FaTimes size={20} />
          </button>
        </div>

        {/* Status messages */}
        {error && (
          <div className="m-4 bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded">
            {error}
          </div>
        )}
        {success && (
          <div className="m-4 bg-green-50 border border-green-200 text-green-600 px-4 py-2 rounded">
            {success}
          </div>
        )}

        {/* Search */}
        <div className="px-6 py-3 border-b">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar usuario..."
              className="w-full bg-white text-black pl-10 pr-4 py-2 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-[#5468FF]"
            />
          </div>
        </div>

        {/* User list */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading && !whitelistUsers.length ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#5468FF]"></div>
            </div>
          ) : (
            <>
              {filteredUsers.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  {searchTerm ? "No se encontraron usuarios que coincidan con la búsqueda" : "No hay usuarios en esta lista"}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {filteredUsers.map(user => (
                    <div key={user.id} className="flex justify-between items-center bg-[#ffffff] text-[#232323] text-lg rounded-lg p-3 border">
                      <div className="flex items-center space-x-2">
                        
                        <span className="font-medium truncate">@{user.username}</span>
                      </div>
                      <button
                        onClick={() => deleteUser(user.id)}
                        disabled={loading}
                        className="text-[#232323] bg-transparent hover:border-[#232323]"
                        title="Eliminar usuario"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t bg-gray-50">
          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              className="w-full py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 flex items-center justify-center"
            >
              <FaTrash className="mr-2" /> Eliminar lista blanca
            </button>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-red-600 font-medium">
                ¿Estás seguro de eliminar esta lista? Esta acción no se puede deshacer.
              </p>
              <div className="flex space-x-2">
                <button
                  onClick={deleteWhitelist}
                  disabled={loading}
                  className="flex-1 bg-red-500 text-white py-2 rounded-lg hover:bg-red-600"
                >
                  Sí, eliminar
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="flex-1 bg-gray-200 py-2 rounded-lg hover:bg-gray-300"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

WhitelistModalManager.propTypes = {
  user: PropTypes.object.isRequired,
  db: PropTypes.object.isRequired,
  selectedWhitelist: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired,
  onWhitelistUpdated: PropTypes.func,
  onWhitelistDeleted: PropTypes.func
};

export default WhitelistModalManager;