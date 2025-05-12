// 📌 src/api.js
import axios from 'axios';

// Verificamos si tenemos un proxy configurado en desarrollo o si estamos en producción
// Esta aproximación puede ayudar con problemas de CORS
const isDevelopment = process.env.NODE_ENV === 'development';

// URL basada en la configuración de NGINX (location /setter-api/)
const API_URL = 'https://alets.com.ar/setter-api';

// API Key para autenticación del servidor - La misma que se usa en WhatsAppCRM.jsx
const STATIC_API_KEY = 'DA0p3i0lNnuuCWTXieGI1CrVjr9IcVzjiXsbMMMyi6s77l4Snq';

console.log('API_URL configurada:', API_URL);
console.log('Entorno:', process.env.NODE_ENV);

// Añadimos un mensaje para confirmar que se está usando el archivo api.js actualizado
console.log('Version de api.js: 1.0.2 - Usando /setter-api endpoint con API key estática');

// Configuración global de axios para debugging
axios.interceptors.request.use(request => {
  console.log('Axios Request:', {
    url: request.url,
    method: request.method,
    headers: request.headers,
    data: request.data
  });
  return request;
}, error => {
  console.error('Axios Request Error:', error);
  return Promise.reject(error);
});

axios.interceptors.response.use(response => {
  console.log('Axios Response Success:', {
    status: response.status,
    statusText: response.statusText
  });
  return response;
}, error => {
  console.error('Axios Response Error:', error);
  return Promise.reject(error);
});

// Función utilitaria para establecer las cabeceras de autenticación
// Usa la API key en lugar del token de Firebase para las llamadas a la API
const getAuthHeaders = () => {
  // Usar la API key estática para todas las llamadas
  return { 
    'Authorization': `Bearer ${STATIC_API_KEY}`,
    'Content-Type': 'application/json'
  };
};

// Login a la API de Instagram
export const loginInstagram = async (username, password, verificationCode = '') => {
    try {
        const response = await axios.post(`${API_URL}/login`, {
            username,
            password,
            verification_code: verificationCode,
        }, {
            headers: getAuthHeaders()
        });
        return response.data;
    } catch (error) {
        console.error("Error en login:", error);
        throw error;
    }
};

// Obtener likes de una publicación
export const obtenerLikes = async (session, link) => {
    try {
        const response = await axios.post(`${API_URL}/obtener_likes`, 
            new URLSearchParams({
                session,
                link
            }), 
            {
                headers: {
                    ...getAuthHeaders(),
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }
        );
        return response.data;
    } catch (error) {
        console.error("Error obteniendo likes:", error);
        throw error;
    }
};

// Seguir usuarios
export const seguirUsuarios = async (session, usuarios) => {
    try {
        const response = await axios.post(`${API_URL}/seguir_usuarios`, 
            new URLSearchParams({
                session,
                usuarios: usuarios.join(',')
            }),
            {
                headers: {
                    ...getAuthHeaders(),
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }
        );
        return response.data;
    } catch (error) {
        console.error("Error al seguir usuarios:", error);
        throw error;
    }
};

// Enviar mensajes a usuarios
export const enviarMensajes = async (session, usuarios, mensaje) => {
    try {
        const response = await axios.post(`${API_URL}/enviar_mensajes_multiple`, 
            new URLSearchParams({
                session,
                usuarios: usuarios.join(','),
                mensaje
            }),
            {
                headers: {
                    ...getAuthHeaders(),
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }
        );
        return response.data;
    } catch (error) {
        console.error("Error enviando mensajes:", error);
        throw error;
    }
};

// Cerrar sesión en la API
export const logoutInstagram = async (session) => {
    try {
        const response = await axios.post(`${API_URL}/logout`, 
            new URLSearchParams({
                session
            }),
            {
                headers: {
                    ...getAuthHeaders(),
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }
        );
        return response.data;
    } catch (error) {
        console.error("Error cerrando sesión:", error);
        throw error;
    }
};

// 📌 Integración con "Nueva Solicitud" en Sidebar
import { useState } from "react";

export const useNuevaSolicitud = () => {
    const [session, setSession] = useState(localStorage.getItem("session"));
    const [link, setLink] = useState("");
    const [likes, setLikes] = useState([]);
    const [mensaje, setMensaje] = useState("");

    const handleObtenerLikes = async () => {
        try {
            const data = await obtenerLikes(session, link);
            setLikes(data.usuarios);
        } catch (error) {
            console.error("Error al obtener likes:", error);
        }
    };

    const handleSeguirUsuarios = async () => {
        try {
            await seguirUsuarios(session, likes);
            alert("Usuarios seguidos exitosamente");
        } catch (error) {
            console.error("Error al seguir usuarios:", error);
        }
    };

    const handleEnviarMensajes = async () => {
        try {
            await enviarMensajes(session, likes, mensaje);
            alert("Mensajes enviados exitosamente");
        } catch (error) {
            console.error("Error enviando mensajes:", error);
        }
    };

    return {
        link,
        setLink,
        likes,
        mensaje,
        setMensaje,
        handleObtenerLikes,
        handleSeguirUsuarios,
        handleEnviarMensajes,
    };
};

// --- CRM Kanban API Calls ---

// Función genérica para manejar las respuestas y errores de Axios
const handleApiResponse = (response) => {
    console.log("handleApiResponse - Procesando respuesta:", response.status, response.statusText);
    try {
        return response.data;
    } catch (err) {
        console.error("handleApiResponse - Error al procesar response.data:", err);
        return { success: false, message: "Error al procesar la respuesta del servidor" };
    }
};

const handleApiError = (error) => {
    console.error("API Error:", error);
    
    // Mostrar detalles adicionales para ayudar a diagnosticar problemas
    if (error.response) {
        console.error("Status:", error.response.status);
        console.error("Data:", error.response.data);
        console.error("Headers:", error.response.headers);
    } else if (error.request) {
        console.error("Request fue enviado pero sin respuesta:", error.request);
    } else {
        console.error("Error en la configuración de la solicitud:", error.message);
    }
    
    // Construir un objeto de error más informativo
    return {
        success: false,
        message: error.response?.data?.message || error.message || 'Error desconocido',
        statusCode: error.response?.status,
        error: error.message
    };
};

// Tableros Kanban
export const getUserKanbanBoards = async (userId, authToken) => {
    try {
        const response = await axios.get(`${API_URL}/users/${userId}/kanban-boards`, {
            headers: getAuthHeaders()
        });
        return handleApiResponse(response);
    } catch (error) {
        return handleApiError(error);
    }
};

export const createKanbanBoard = async (userId, boardData, authToken) => {
    console.log("api.js - createKanbanBoard iniciado con:", { userId, boardData });
    console.log("api.js - Usando URL:", `${API_URL}/users/${userId}/kanban-boards`);
    console.log("api.js - authToken presente:", !!authToken);
    
    if (!userId || !boardData || !boardData.name) {
        console.error("api.js - Parámetros inválidos para createKanbanBoard");
        return { success: false, message: "Parámetros inválidos. Se requiere userId y boardData.name" };
    }

    try {
        const config = {
            headers: getAuthHeaders(),
            timeout: 15000 // 15 segundos de timeout
        };
        
        console.log("api.js - Configuración de la petición:", config);
        console.log("api.js - Enviando petición POST...");
        
        const response = await axios.post(
            `${API_URL}/users/${userId}/kanban-boards`, 
            boardData, 
            config
        );
        
        console.log("api.js - Respuesta recibida:", response.status, response.statusText);
        return handleApiResponse(response);
    } catch (error) {
        console.error("api.js - Error en createKanbanBoard:", error.message);
        return handleApiError(error);
    }
};

export const getKanbanBoardDetails = async (userId, boardId, authToken) => {
    // Este endpoint en el backend es GET /users/:userId/kanban-boards/:boardId/chats-by-column
    // Devuelve el tablero, sus columnas ordenadas y los chats dentro de cada columna.
    try {
        const response = await axios.get(`${API_URL}/users/${userId}/kanban-boards/${boardId}/chats-by-column`, {
            headers: getAuthHeaders()
        });
        return handleApiResponse(response);
    } catch (error) {
        return handleApiError(error);
    }
};

export const updateKanbanBoard = async (userId, boardId, boardData, authToken) => {
    try {
        const response = await axios.put(`${API_URL}/users/${userId}/kanban-boards/${boardId}`, boardData, {
            headers: getAuthHeaders()
        });
        return handleApiResponse(response);
    } catch (error) {
        return handleApiError(error);
    }
};

export const deleteKanbanBoard = async (userId, boardId, authToken) => {
    try {
        const response = await axios.delete(`${API_URL}/users/${userId}/kanban-boards/${boardId}`, {
            headers: getAuthHeaders()
        });
        return handleApiResponse(response);
    } catch (error) {
        return handleApiError(error);
    }
};

// Columnas Kanban
export const createKanbanColumn = async (userId, boardId, columnData, authToken) => {
    try {
        const response = await axios.post(`${API_URL}/users/${userId}/kanban-boards/${boardId}/columns`, columnData, {
            headers: getAuthHeaders()
        });
        return handleApiResponse(response);
    } catch (error) {
        return handleApiError(error);
    }
};

export const updateKanbanColumn = async (userId, boardId, columnId, columnData, authToken) => {
    try {
        const response = await axios.put(`${API_URL}/users/${userId}/kanban-boards/${boardId}/columns/${columnId}`, columnData, {
            headers: getAuthHeaders()
        });
        return handleApiResponse(response);
    } catch (error) {
        return handleApiError(error);
    }
};

export const deleteKanbanColumn = async (userId, boardId, columnId, authToken) => {
    try {
        const response = await axios.delete(`${API_URL}/users/${userId}/kanban-boards/${boardId}/columns/${columnId}`, {
            headers: getAuthHeaders()
        });
        return handleApiResponse(response);
    } catch (error) {
        return handleApiError(error);
    }
};

// Gestión de Chats en Kanban
export const assignChatToKanbanColumn = async (userId, chatId, boardId, columnId, authToken) => {
    if (!userId || !chatId) {
        console.error("Error: Parámetros faltantes en assignChatToKanbanColumn", { userId, chatId, boardId, columnId });
        return { success: false, message: "Parámetros faltantes: userId y chatId son obligatorios" };
    }
    
    if (!STATIC_API_KEY) {
        console.error("Error: API key no configurada en assignChatToKanbanColumn");
        return { success: false, message: "API key no configurada" };
    }
    
    try {
        console.log(`Llamando API: PUT /users/${userId}/chats/${chatId}/assign-kanban-column con boardId=${boardId}, columnId=${columnId}`);
        
        const response = await axios.put(`${API_URL}/users/${userId}/chats/${chatId}/assign-kanban-column`, 
            { boardId, columnId }, 
            {
                headers: getAuthHeaders(),
                timeout: 15000 // Aumentar timeout para operaciones de arrastrar
            }
        );
        return handleApiResponse(response);
    } catch (error) {
        return handleApiError(error); // Devolver el error en lugar de lanzarlo
    }
};

// Obtener solo las columnas de un tablero Kanban (sin chats, para evitar el error de índice)
export const getKanbanBoardColumnsOnly = async (userId, boardId, authToken) => {
    console.log("api.js - getKanbanBoardColumnsOnly iniciado con:", { userId, boardId });
    
    if (!userId || !boardId) {
        console.error("api.js - Parámetros inválidos para getKanbanBoardColumnsOnly");
        return { success: false, message: "Parámetros inválidos. Se requiere userId y boardId" };
    }

    try {
        const response = await axios.get(`${API_URL}/users/${userId}/kanban-boards/${boardId}`, {
            headers: getAuthHeaders()
        });
        
        console.log("api.js - Respuesta de getKanbanBoardColumnsOnly:", response.status);
        const boardData = handleApiResponse(response);
        
        if (boardData.success && boardData.data) {
            // Ahora obtener las columnas
            try {
                const columnsResponse = await axios.get(
                    `${API_URL}/users/${userId}/kanban-boards/${boardId}/columns`, 
                    { headers: getAuthHeaders() }
                );
                
                const columnsData = handleApiResponse(columnsResponse);
                
                if (columnsData.success) {
                    return {
                        success: true,
                        board: boardData.data,
                        columns: columnsData.data || [],
                        noChatsLoaded: true // Indicador de que no se cargaron chats
                    };
                } else {
                    return {
                        success: true,
                        board: boardData.data,
                        columns: [],
                        noChatsLoaded: true,
                        columnsError: columnsData.message
                    };
                }
            } catch (columnsError) {
                console.error("api.js - Error obteniendo columnas:", columnsError);
                return {
                    success: true,
                    board: boardData.data,
                    columns: [],
                    noChatsLoaded: true,
                    columnsError: columnsError.message || "Error obteniendo columnas"
                };
            }
        }
        
        return boardData;
    } catch (error) {
        console.error("api.js - Error en getKanbanBoardColumnsOnly:", error.message);
        return handleApiError(error);
    }
};

// Obtener mensajes de un chat específico para el Kanban (o cualquier otro lugar)
export const getChatMessages = async (userId, chatId, authToken) => {
    console.log(`api.js - getChatMessages iniciado para userId: ${userId}, chatId: ${chatId}`);
    if (!userId || !chatId) {
        console.error("api.js - Parámetros inválidos para getChatMessages");
        return { success: false, message: "Parámetros inválidos. Se requiere userId y chatId." };
    }
    try {
        // El endpoint es similar al que usa WhatsAppCRM.jsx internamente.
        // Asumimos que el authToken (STATIC_API_KEY via getAuthHeaders) es suficiente.
        const response = await axios.get(`${API_URL}/users/${userId}/chats/${chatId}/messages?limit=100`, { // Limit 100 messages
            headers: getAuthHeaders()
        });
        console.log("api.js - Respuesta de getChatMessages:", response.status);
        return handleApiResponse(response); // Reutiliza el manejador de respuesta existente
    } catch (error) {
        console.error("api.js - Error en getChatMessages:", error.message);
        return handleApiError(error); // Reutiliza el manejador de error existente
    }
};
