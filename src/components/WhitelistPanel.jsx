import { useState, useEffect, useRef } from "react";
import PropTypes from 'prop-types';
import { db } from "../firebaseConfig";
import { collection, addDoc, getDocs, doc, deleteDoc, query, where } from "firebase/firestore";
import { FaPlus, FaTrash, FaSearch, FaCog, FaEllipsisH } from "react-icons/fa";
import logApiRequest from "../requestLogger"; 
import { updateDoc } from "firebase/firestore";

// Importamos el componente modal para gestionar whitelists
import WhitelistModalManager from "./WhitelistModalManager";

const WhitelistPanel = ({ user }) => {
    // Estados del componente
    const [whitelists, setWhitelists] = useState([]);
    const [selectedWhitelist, setSelectedWhitelist] = useState(null);
    const [newWhitelistName, setNewWhitelistName] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isCreatingWhitelist, setIsCreatingWhitelist] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [notification, setNotification] = useState({ show: false, message: "", type: "" });
    const [showWhitelistModal, setShowWhitelistModal] = useState(false);
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

    // Cargar las listas blancas del usuario
    const fetchWhitelists = async () => {
        if (!user || !user.uid) return;

        try {
            setIsLoading(true);
            
            await logApiRequest({
                endpoint: "internal/fetch_whitelists",
                requestData: { userId: user.uid },
                userId: user.uid,
                status: "pending",
                source: "WhitelistPanel",
                metadata: {
                    action: "fetch_whitelists"
                }
            });
            
            const whitelistsRef = collection(db, "users", user.uid, "whitelists");
            const whitelistsSnapshot = await getDocs(whitelistsRef);
            const whitelistsList = whitelistsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setWhitelists(whitelistsList);
            
            await logApiRequest({
                endpoint: "internal/fetch_whitelists",
                requestData: { userId: user.uid },
                userId: user.uid,
                responseData: { count: whitelistsList.length },
                status: "success",
                source: "WhitelistPanel",
                metadata: {
                    action: "fetch_whitelists",
                    whitelistCount: whitelistsList.length
                }
            });
        } catch (error) {
            console.error("Error al cargar las listas blancas:", error);
            showNotification("Error al cargar las listas", "error");
            
            await logApiRequest({
                endpoint: "internal/fetch_whitelists",
                requestData: { userId: user.uid },
                userId: user.uid,
                status: "error",
                source: "WhitelistPanel",
                metadata: {
                    action: "fetch_whitelists",
                    error: error.message
                }
            });
        } finally {
            setIsLoading(false);
        }
    };
    // Crear una nueva lista blanca
    const createWhitelist = async () => {
        if (!user || !user.uid) return;
        if (!newWhitelistName.trim()) {
            showNotification("El nombre de la lista no puede estar vacío", "warning");
            return;
        }

        try {
            setIsLoading(true);
            
            await logApiRequest({
                endpoint: "internal/create_whitelist",
                requestData: { name: newWhitelistName.trim() },
                userId: user.uid,
                status: "pending",
                source: "WhitelistPanel"
            });
            
            const whitelistsRef = collection(db, "users", user.uid, "whitelists");
            
            // Verificar si ya existe una lista con ese nombre
            const q = query(whitelistsRef, where("name", "==", newWhitelistName.trim()));
            const querySnapshot = await getDocs(q);
            
            if (!querySnapshot.empty) {
                showNotification("Ya existe una lista con ese nombre", "warning");
                await logApiRequest({
                    endpoint: "internal/create_whitelist",
                    requestData: { name: newWhitelistName.trim() },
                    userId: user.uid,
                    status: "error",
                    source: "WhitelistPanel",
                    metadata: { error: "duplicate_name" }
                });
                return;
            }
            
            const newWhitelist = {
                name: newWhitelistName.trim(),
                createdAt: new Date(),
                userCount: 0
            };
            
            const docRef = await addDoc(whitelistsRef, newWhitelist);
            const createdWhitelist = { id: docRef.id, ...newWhitelist };
            
            setWhitelists([...whitelists, createdWhitelist]);
            setNewWhitelistName("");
            setIsCreatingWhitelist(false);
            
            showNotification("Lista creada con éxito", "success");
            
            await logApiRequest({
                endpoint: "internal/create_whitelist",
                requestData: { name: newWhitelistName.trim() },
                userId: user.uid,
                responseData: { whitelistId: docRef.id },
                status: "success",
                source: "WhitelistPanel"
            });
        } catch (error) {
            console.error("Error al crear la lista blanca:", error);
            showNotification("Error al crear la lista", "error");
            await logApiRequest({
                endpoint: "internal/create_whitelist",
                userId: user.uid,
                status: "error",
                source: "WhitelistPanel",
                metadata: { error: error.message }
            });
        } finally {
            setIsLoading(false);
        }
    };
    // Manejar actualización de whitelist desde el modal
    const handleWhitelistUpdated = (updatedWhitelist) => {
        setWhitelists(whitelists.map(list => 
            list.id === updatedWhitelist.id ? updatedWhitelist : list
        ));
    };

    // Manejar eliminación de whitelist desde el modal
    const handleWhitelistDeleted = (whitelistId) => {
        setWhitelists(whitelists.filter(list => list.id !== whitelistId));
        setSelectedWhitelist(null);
        setShowWhitelistModal(false);
        showNotification("Lista eliminada con éxito", "success");
    };

    // Abrir el modal de gestión de whitelist
    const openWhitelistModal = (whitelist) => {
        setSelectedWhitelist(whitelist);
        setShowWhitelistModal(true);
    };

    // Filtrar whitelists por término de búsqueda
    const filteredWhitelists = searchTerm
        ? whitelists.filter(whitelist => 
            whitelist.name?.toLowerCase().includes(searchTerm.toLowerCase()))
        : whitelists;
        
    // Cargar las listas al montar el componente
    useEffect(() => {
        if (user && user.uid) {
            fetchWhitelists();
        }
    }, [user]);
    return (
        <div className="bg-[#F3F2FC] min-h-screen p-6">
            {/* Barra de búsqueda y botón de crear */}
            <div className="flex items-center mb-4">
                <div className="relative flex-grow mr-4">
                    <img className="w-12 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" src="/search.png" />
                    <input
                        type="text"
                        placeholder="Buscar Lista Blanca"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-20 p-3 bg-white rounded-full text-xl text-black border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#5468FF] h-16"
                    />
                </div>
                <button 
                    onClick={() => setIsCreatingWhitelist(true)}
                    className="bg-white text-black px-4 py-3 rounded-full border border-gray-200 flex items-center gap-2 h-16"
                >
                    <span className="text-xl">+</span> Crear Whitelist
                </button>
            </div>
        
            {/* Formulario para crear nueva lista */}
            {isCreatingWhitelist && (
                <div className="bg-white p-4 rounded-lg shadow-sm mb-4">
                    <input
                        type="text"
                        placeholder="Nombre de la lista"
                        value={newWhitelistName}
                        onChange={(e) => setNewWhitelistName(e.target.value)}
                        className="w-full p-2 border border-[#A6A6A6] rounded-full mb-2 bg-white text-[#393346] focus:outline-none focus:ring-1 focus:ring-[#5468FF]"
                    />
                    <div className="flex space-x-2">
                        <button
                            onClick={createWhitelist}
                            disabled={isLoading || !newWhitelistName.trim()}
                            className="flex-1 bg-[#5468FF] text-white py-1 rounded-full hover:bg-[#4356cc] transition disabled:bg-gray-400"
                        >
                            {isLoading ? "Creando..." : "Crear"}
                        </button>
                        <button
                            onClick={() => {
                                setIsCreatingWhitelist(false);
                                setNewWhitelistName("");
                            }}
                            className="flex-1 bg-gray-200 text-gray-700 py-1 rounded-full hover:bg-gray-300 transition"
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            )}
            {/* Lista de whitelists */}
            <div className="space-y-4">
                {isLoading && whitelists.length === 0 ? (
                    <div className="flex justify-center items-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#5468FF]"></div>
                        <span className="ml-2">Cargando listas...</span>
                    </div>
                ) : filteredWhitelists.length > 0 ? (
                    filteredWhitelists.map(whitelist => (
                        <div 
                            key={whitelist.id} 
                            className="bg-white rounded-lg p-4 flex items-center justify-between shadow-sm hover:shadow-md transition"
                        >
                            <div className="flex items-center space-x-4">
                            <img 
                                src="/folder.png" 
                                alt="Folder" 
                                className="w-12 h-12 text-gray-500" 
                                />
                                <div>
                                    <h3 className="font-medium text-gray-800 text-xl">{whitelist.name}</h3>
                                    <p className="text-sm text-gray-500">
                                        {whitelist.userCount || 0} Usuarios
                                    </p>
                                </div>
                            </div>
                            <button 
                                className="text-gray-400 hover:text-gray-600 bg-transparent cursor-pointer p-2"
                                onClick={() => openWhitelistModal(whitelist)}
                                aria-label="Opciones de lista blanca"
                            >
                                <img className="w-12 text-gray-500" src="/setting-5.png" />
                            </button>
                        </div>
                    ))
                ) : (
                    <div className="p-8 bg-white rounded-lg text-center">
                        <p className="text-gray-500">
                            {searchTerm
                                ? "No se encontraron listas que coincidan con la búsqueda."
                                : "No hay listas blancas disponibles. Crea una nueva lista para comenzar."}
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
            
            {/* Modal para gestionar whitelist */}
            {showWhitelistModal && selectedWhitelist && (
                <WhitelistModalManager
                    user={user}
                    db={db}
                    selectedWhitelist={selectedWhitelist}
                    onClose={() => setShowWhitelistModal(false)}
                    onWhitelistUpdated={handleWhitelistUpdated}
                    onWhitelistDeleted={handleWhitelistDeleted}
                />
            )}
        </div>
    );
};

WhitelistPanel.propTypes = {
    user: PropTypes.object
};

export default WhitelistPanel;