// src/services/api.js
// Quitamos el import de 'json' si no se usa react-router-dom aquí.
// import { json } from "react-router-dom";

import axios from 'axios';

// --- URL Base y configuración de la API ---
// Cambiamos a la URL de producción según la documentación
const API_BASE_URL = 'https://alets.com.ar/setter-api';
const API_TIMEOUT = 15000; // 15 segundos

// API Key provided in the documentation
const STATIC_API_KEY = 'DA0p3i0lNnuuCWTXieGI1CrVjr9IcVzjiXsbMMMyi6s77l4Snq';

// Function to get the API key - Using static key
const getApiKey = () => {
  // You might want to store/retrieve this securely or via Firebase later
  return STATIC_API_KEY;
};

// Helper function to handle API responses
const handleResponse = async (response) => {
  // Si recibimos una respuesta con status 200-299
  if (response.status >= 200 && response.status < 300) {
    if (response.data) {
      return {
        success: true,
        data: response.data
      };
    }
    return { success: true };
  }

  // Si hay un error, intentamos obtener mensaje del servidor
  let errorMessage;
  if (response.data && response.data.message) {
    errorMessage = response.data.message;
  } else if (response.statusText) {
    errorMessage = response.statusText;
  } else {
    errorMessage = `Error: ${response.status}`;
  }

  return { 
    success: false, 
    message: errorMessage 
  };
};

const handleApiError = (error) => {
  console.error("API Error:", error);
  
  if (error.response) {
    return { 
      success: false, 
      message: error.response.data?.message || error.response.statusText || "Error del servidor",
      error: error.response.data
    };
  }
  
  if (error.request) {
    return { 
      success: false, 
      message: "No se pudo contactar al servidor. Verifique su conexión.",
      error: error.request
    };
  }
  
  return { 
    success: false, 
    message: error.message || "Error desconocido",
    error
  };
};

// Function to create fetch options with authentication
const createFetchOptions = (method = 'GET', body = null) => {
  const apiKey = getApiKey(); // Use the static key
  const headers = {
    'Content-Type': 'application/json',
    // Use Authorization Bearer token as per documentation
    'Authorization': `Bearer ${apiKey}`,
    'Accept': 'application/json'
    // Remove 'x-api-key' if it existed, Bearer token is standard
  };

  const options = {
    method,
    headers,
    timeout: API_TIMEOUT
  };

  if (body) {
    options.data = body; // Assuming axios, use 'data' key for body
  }

  return options;
};

// --- API Key Management ---
export const saveApiKey = (apiKey) => {
  if (!apiKey) {
    localStorage.removeItem('api_key');
    return false;
  }
  localStorage.setItem('api_key', apiKey);
  return true;
};

export const getStoredApiKey = () => {
  return localStorage.getItem('api_key');
};

export const testApiConnection = async () => {
  try {
    const response = await axios({
      ...createFetchOptions('GET'),
      url: `${API_BASE_URL}/health`
    });
    return handleResponse(response);
  } catch (error) {
    return handleApiError(error);
  }
};

// --- User Management ---
export const createUser = async (userData) => {
  try {
    const response = await axios({
      ...createFetchOptions('POST', userData),
      url: `${API_BASE_URL}/users`
    });
    return handleResponse(response);
  } catch (error) {
    return handleApiError(error);
  }
};

export const getUsers = async () => {
  try {
    const response = await axios({
      ...createFetchOptions('GET'),
      url: `${API_BASE_URL}/users`
    });
    return handleResponse(response);
  } catch (error) {
    return handleApiError(error);
  }
};

export const getUserStatus = async (userId) => {
  try {
    const response = await axios({
      ...createFetchOptions('GET'),
      url: `${API_BASE_URL}/users/${userId}/status`
    });
    return handleResponse(response);
  } catch (error) {
    return handleApiError(error);
  }
};

// --- WhatsApp Management ---
export const connectWhatsApp = async (userId) => {
  try {
    const response = await axios({
      ...createFetchOptions('POST'),
      url: `${API_BASE_URL}/users/${userId}/connect`
    });
    return handleResponse(response);
  } catch (error) {
    return handleApiError(error);
  }
};

export const disconnectWhatsApp = async (userId) => {
  try {
    const response = await axios({
      ...createFetchOptions('POST'),
      url: `${API_BASE_URL}/users/${userId}/disconnect`
    });
    return handleResponse(response);
  } catch (error) {
    return handleApiError(error);
  }
};

export const getWhatsAppStats = async (userId, period = 'week') => {
  try {
    const response = await axios({
      ...createFetchOptions('GET'),
      url: `${API_BASE_URL}/users/${userId}/stats?period=${period}`
    });
    return handleResponse(response);
  } catch (error) {
    return handleApiError(error);
  }
};

export const getWhatsAppStatus = async (userId) => {
  try {
    const response = await axios({
      ...createFetchOptions('GET'),
      url: `${API_BASE_URL}/users/${userId}/status`
    });
    return handleResponse(response);
  } catch (error) {
    return handleApiError(error);
  }
};

// --- Chat & Messages ---
export const getChats = async (userId) => {
  try {
    const response = await axios({
      ...createFetchOptions('GET'),
      url: `${API_BASE_URL}/users/${userId}/chats`
    });
    return handleResponse(response);
  } catch (error) {
    return handleApiError(error);
  }
};

export const getChatMessages = async (userId, chatId, limit = 50) => {
  try {
    const response = await axios({
      ...createFetchOptions('GET'),
      url: `${API_BASE_URL}/users/${userId}/chats/${chatId}/messages?limit=${limit}`
    });
    return handleResponse(response);
  } catch (error) {
    return handleApiError(error);
  }
};

export const sendMessage = async (userId, chatId, message) => {
  try {
    const response = await axios({
      ...createFetchOptions('POST', { message }),
      url: `${API_BASE_URL}/users/${userId}/chats/${chatId}/messages`
    });
    return handleResponse(response);
  } catch (error) {
    return handleApiError(error);
  }
};

export const createNewChat = async (userId, phoneNumber, name = '') => {
  try {
    const response = await axios({
      ...createFetchOptions('POST', { phoneNumber, name }),
      url: `${API_BASE_URL}/users/${userId}/chats`
    });
    return handleResponse(response);
  } catch (error) {
    return handleApiError(error);
  }
};

// --- Agent Management ---
export const getAgents = async (userId) => {
  try {
    const response = await axios({
      ...createFetchOptions('GET'),
      url: `${API_BASE_URL}/users/${userId}/agents`
    });
    return handleResponse(response);
  } catch (error) {
    return handleApiError(error);
  }
};

export const getAgent = async (userId, agentId) => {
  try {
    const response = await axios({
      ...createFetchOptions('GET'),
      url: `${API_BASE_URL}/users/${userId}/agents/${agentId}`
    });
    return handleResponse(response);
  } catch (error) {
    return handleApiError(error);
  }
};

export const createAgent = async (userId, agentData) => {
  try {
    const response = await axios({
      ...createFetchOptions('POST', agentData),
      url: `${API_BASE_URL}/users/${userId}/agents`
    });
    return handleResponse(response);
  } catch (error) {
    return handleApiError(error);
  }
};

export const updateAgent = async (userId, agentId, agentData) => {
  try {
    const response = await axios({
      ...createFetchOptions('PUT', agentData),
      url: `${API_BASE_URL}/users/${userId}/agents/${agentId}`
    });
    return handleResponse(response);
  } catch (error) {
    return handleApiError(error);
  }
};

export const deleteAgent = async (userId, agentId) => {
  try {
    const response = await axios({
      ...createFetchOptions('DELETE'),
      url: `${API_BASE_URL}/users/${userId}/agents/${agentId}`
    });
    return handleResponse(response);
  } catch (error) {
    return handleApiError(error);
  }
};

export const getActiveAgent = async (userId) => {
  try {
    const response = await axios({
      ...createFetchOptions('GET'),
      url: `${API_BASE_URL}/users/${userId}/active-agent`
    });
    return handleResponse(response);
  } catch (error) {
    return handleApiError(error);
  }
};

export const setActiveAgent = async (userId, agentId) => {
  try {
    const response = await axios({
      ...createFetchOptions('PUT', { agentId: agentId }),
      url: `${API_BASE_URL}/users/${userId}/active-agent`
    });
    return handleResponse(response);
  } catch (error) {
    return handleApiError(error);
  }
};

// --- Agent Publishing ---
export const getAgentPublishInfo = async (agentId) => {
  if (!agentId) {
    console.error("getAgentPublishInfo requires an agentId");
    return { success: false, message: "Agent ID is required" };
  }
  try {
    const response = await axios({
      ...createFetchOptions('GET'),
      url: `${API_BASE_URL}/agents/${agentId}/publish`
    });
    // Assume the API returns the correct structure directly
    // { status: '...', qrCodeUrl: '...', message: '...', success: true/false }
    return handleResponse(response); 
  } catch (error) {
    // handleApiError wraps the error in { success: false, message: ..., error: ... }
    // It might not return qrCodeUrl or status correctly on error, 
    // but PublishPage handles error states based on success flag.
    return handleApiError(error);
  }
};

// --- Action Flows ---
export const getActionFlows = async () => {
  try {
    const response = await axios({
      ...createFetchOptions('GET'),
      url: `${API_BASE_URL}/action-flows`
    });
    return handleResponse(response);
  } catch (error) {
    return handleApiError(error);
  }
};

export const getActionFlow = async (flowId) => {
  try {
    const response = await axios({
      ...createFetchOptions('GET'),
      url: `${API_BASE_URL}/action-flows/${flowId}`
    });
    return handleResponse(response);
  } catch (error) {
    return handleApiError(error);
  }
};

export const createActionFlow = async (flowData) => {
  try {
    const response = await axios({
      ...createFetchOptions('POST', flowData),
      url: `${API_BASE_URL}/action-flows`
    });
    return handleResponse(response);
  } catch (error) {
    return handleApiError(error);
  }
};

export const updateActionFlow = async (flowId, flowData) => {
  try {
    const response = await axios({
      ...createFetchOptions('PUT', flowData),
      url: `${API_BASE_URL}/action-flows/${flowId}`
    });
    return handleResponse(response);
  } catch (error) {
    return handleApiError(error);
  }
};

export const deleteActionFlow = async (flowId) => {
  try {
    const response = await axios({
      ...createFetchOptions('DELETE'),
      url: `${API_BASE_URL}/action-flows/${flowId}`
    });
    return handleResponse(response);
  } catch (error) {
    return handleApiError(error);
  }
};

// --- Rules Management ---
export const getRules = async (userId) => {
  try {
    const response = await axios({
      ...createFetchOptions('GET'),
      url: `${API_BASE_URL}/users/${userId}/rules`
    });
    return handleResponse(response);
  } catch (error) {
    return handleApiError(error);
  }
};

export const addRule = async (userId, trigger, response) => {
  try {
    const response = await axios({
      ...createFetchOptions('POST', { trigger, response }),
      url: `${API_BASE_URL}/users/${userId}/rules`
    });
    return handleResponse(response);
  } catch (error) {
    return handleApiError(error);
  }
};

export const deleteRule = async (userId, ruleId) => {
  try {
    const response = await axios({
      ...createFetchOptions('DELETE'),
      url: `${API_BASE_URL}/users/${userId}/rules/${ruleId}`
    });
    return handleResponse(response);
  } catch (error) {
    return handleApiError(error);
  }
};

// --- Gemini Starters ---
export const getGeminiStarters = async (userId) => {
  try {
    const response = await axios({
      ...createFetchOptions('GET'),
      url: `${API_BASE_URL}/users/${userId}/gemini-starters`
    });
    return handleResponse(response);
  } catch (error) {
    return handleApiError(error);
  }
};

export const addGeminiStarter = async (userId, trigger, prompt) => {
  try {
    const response = await axios({
      ...createFetchOptions('POST', { trigger, prompt }),
      url: `${API_BASE_URL}/users/${userId}/gemini-starters`
    });
    return handleResponse(response);
  } catch (error) {
    return handleApiError(error);
  }
};

export const deleteGeminiStarter = async (userId, starterId) => {
  try {
    const response = await axios({
      ...createFetchOptions('DELETE'),
      url: `${API_BASE_URL}/users/${userId}/gemini-starters/${starterId}`
    });
    return handleResponse(response);
  } catch (error) {
    return handleApiError(error);
  }
};

// --- Blacklist Management ---
export const getBlacklist = async (userId) => {
  try {
    const response = await axios({
      ...createFetchOptions('GET'),
      url: `${API_BASE_URL}/users/${userId}/blacklist`
    });
    return handleResponse(response);
  } catch (error) {
    return handleApiError(error);
  }
};

export const addToBlacklist = async (userId, phoneNumber, reason = '') => {
  try {
    const response = await axios({
      ...createFetchOptions('POST', { phoneNumber, reason }),
      url: `${API_BASE_URL}/users/${userId}/blacklist`
    });
    return handleResponse(response);
  } catch (error) {
    return handleApiError(error);
  }
};

export const removeFromBlacklist = async (userId, phoneNumber) => {
  try {
    const response = await axios({
      ...createFetchOptions('DELETE'),
      url: `${API_BASE_URL}/users/${userId}/blacklist/${phoneNumber}`
    });
    return handleResponse(response);
  } catch (error) {
    return handleApiError(error);
  }
};

// --- Statistics ---
export const getStatistics = async (userId, period = 'week') => {
  try {
    const response = await axios({
      ...createFetchOptions('GET'),
      url: `${API_BASE_URL}/users/${userId}/statistics?period=${period}`
    });
    return handleResponse(response);
  } catch (error) {
    return handleApiError(error);
  }
};

// --- Notifications ---
export const getNotifications = async (userId) => {
  try {
    const response = await axios({
      ...createFetchOptions('GET'),
      url: `${API_BASE_URL}/users/${userId}/notifications`
    });
    return handleResponse(response);
  } catch (error) {
    return handleApiError(error);
  }
};

export const markNotificationAsRead = async (userId, notificationId) => {
  try {
    const response = await axios({
      ...createFetchOptions('PUT'),
      url: `${API_BASE_URL}/users/${userId}/notifications/${notificationId}/read`
    });
    return handleResponse(response);
  } catch (error) {
    return handleApiError(error);
  }
};

// --- User Settings ---
export const getUserSettings = async (userId) => {
  try {
    const response = await axios({
      ...createFetchOptions('GET'),
      url: `${API_BASE_URL}/users/${userId}/settings`
    });
    return handleResponse(response);
  } catch (error) {
    return handleApiError(error);
  }
};

export const updateUserSettings = async (userId, settings) => {
  try {
    const response = await axios({
      ...createFetchOptions('PUT', settings),
      url: `${API_BASE_URL}/users/${userId}/settings`
    });
    return handleResponse(response);
  } catch (error) {
    return handleApiError(error);
  }
};