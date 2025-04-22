// Crear un archivo centralizado de utilidades para la API
// src/api/instagramApi.js

const API_BASE_URL = "https://alets.com.ar";

// Función auxiliar para headers comunes
function getCommonHeaders() {
  const headers = {
    "User-Agent": "Instagram 219.0.0.12.117 Android",
    "Accept-Language": "es-ES, en-US",
  };
  
  const token = localStorage.getItem("instagram_bot_token");
  if (token) {
    headers["token"] = token;
  }
  
  const storedCookies = localStorage.getItem("instagram_cookies");
  if (storedCookies) {
    try {
      headers["Cookie"] = JSON.parse(storedCookies);
    } catch (e) {
      console.error("Error parsing stored cookies:", e);
    }
  }
  
  const deviceId = localStorage.getItem("instagram_device_id");
  if (deviceId) {
    headers["X-IG-Device-ID"] = deviceId;
    headers["X-IG-Android-ID"] = deviceId;
  }
  
  return headers;
}

// Función genérica para peticiones a la API
// Línea aproximada 23 en instagramApi.js
async function apiRequest(endpoint, params = {}, method = "POST", customToken = null) {
  console.log(`API Request to ${endpoint}:`, { 
    endpoint,
    method,
    hasCustomToken: !!customToken,
    params: JSON.parse(JSON.stringify(params)) // Safe copy for logging
  });
  
  // Log parameter details
  if (params.usuarios) {
    const usersList = params.usuarios.split(',');
    console.log(`Request targets ${usersList.length} users:`, 
      usersList.length <= 5 ? usersList : usersList.slice(0, 5).concat([`...and ${usersList.length - 5} more`])
    );
  }
  
  if (params.mensaje) {
    console.log(`Message content (${params.mensaje.length} chars):`, 
      params.mensaje.length <= 100 ? params.mensaje : params.mensaje.substring(0, 100) + "..."
    );
  }
  
  // Cambiar FormData por URLSearchParams
  const urlParams = new URLSearchParams();
  
  // Agregar todos los parámetros
  Object.keys(params).forEach(key => {
    urlParams.append(key, params[key]);
  });
  
  try {
    // Obtener headers comunes
    const headers = {
      ...getCommonHeaders(),
      "Content-Type": "application/x-www-form-urlencoded"
    };
    
    // Si hay token personalizado, usarlo
    if (customToken) {
      headers["token"] = customToken;
    }
    
    // Log headers right before the request
    console.log("Request headers:", {
      ...headers,
      token: headers.token ? "Present (hidden for security)" : "Not present"
    });
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method,
      headers,
      body: urlParams, // Usar urlParams en lugar de formData
    });
    
    console.log(`Response status for ${endpoint}:`, response.status);
    
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`Response data for ${endpoint}:`, data);
    return data;
  } catch (error) {
    console.error(`Error en petición a ${endpoint}:`, error);
    throw error;
  }
}

// Implementación de cada endpoint según la documentación
export const instagramApi = {
  // Autenticación
  login: (username, password, deviceId = null) => {
    const params = { username, password };
    if (deviceId) {
      params.device_id = deviceId;
      params.login_attempt_count = "1";
    }
    return apiRequest("/login", params);
  },
  
  verify2FA: (username, verificationCode, deviceId = null) => {
    const params = { 
      username, 
      verification_code: verificationCode 
    };
    
    if (deviceId) {
      params.device_id = deviceId;
    }
    
    // Añadir información de 2FA almacenada localmente
    const sessionId = localStorage.getItem("instagram_2fa_session");
    if (sessionId) params.session_id = sessionId;
    
    const csrfToken = localStorage.getItem("instagram_csrf_token");
    if (csrfToken) params.csrf_token = csrfToken;
    
    const twoFactorInfo = localStorage.getItem("instagram_2fa_info");
    if (twoFactorInfo) params.two_factor_info = twoFactorInfo;
    
    return apiRequest("/verify_2fa", params);
  },
  
  requestNew2FACode: (username, deviceId = null) => {
    const params = { username };
    if (deviceId) params.device_id = deviceId;
    
    const sessionId = localStorage.getItem("instagram_2fa_session");
    if (sessionId) params.session_id = sessionId;
    
    return apiRequest("/request_new_2fa_code", params);
  },
  
  checkSession: () => apiRequest("/session", {}, "GET"),
  
  resetSession: (username) => apiRequest("/reset_session", { username }),
  
  // Operaciones
  getLikes: (postLink, token = null) => {
    console.log("getLikes called with:", { postLink, token });
    console.log("Current localStorage token:", localStorage.getItem("instagram_bot_token"));
    
    return apiRequest("/obtener_likes", { link: postLink }, "POST", token)
      .then(data => {
        console.log("getLikes success response:", data);
        return data;
      })
      .catch(error => {
        console.error("getLikes error:", error);
        throw error;
      });
  },
  
  followUsers: (users, token = null) => {
    const usersStr = Array.isArray(users) ? users.join(",") : users;
    return apiRequest("/seguir_usuarios", { usuarios: usersStr }, "POST", token);
  },
  
// In instagramApi.js
sendMessages: (users, message, skipExisting = false, token = null) => {
  const usersStr = Array.isArray(users) ? users.join(",") : users;
  
  // Add debug logging
  console.log("sendMessages API call with params:", {
    users: Array.isArray(users) ? users : [users],
    usersCount: Array.isArray(users) ? users.length : 1,
    messageLength: message ? message.length : 0,
    messageSample: message ? message.substring(0, 50) + (message.length > 50 ? "..." : "") : "NULL",
    token: token ? "Present (starts with " + token.substring(0, 10) + "...)" : "Not provided"
  });
  
  return apiRequest("/enviar_mensajes_multiple", { 
    usuarios: usersStr, 
    mensaje: message,
    skip_existing: skipExisting 
  }, "POST", token).then(response => {
    console.log("sendMessages API response:", response);
    return response;
  }).catch(error => {
    console.error("sendMessages API error:", error);
    throw error;
  });
},
  
sendMedia: async (users, file, mediaType, message = "", skipExisting = false, token = null) => {
  // Agregar más logs al inicio de la función
  console.log("====== SEND MEDIA FUNCTION CALLED ======");
  console.log("sendMedia called with:", {
    users: Array.isArray(users) ? `${users.length} users` : "single user",
    mediaType,
    messageLength: message ? message.length : 0,
    hasFile: !!file,
    fileType: file ? file.type : null,
    fileName: file ? file.name : null,
    fileSize: file ? file.size : null,
    skipExisting,
    hasToken: !!token
  });
  console.log("Media request differs from messages:", {
    usesDifferentEndpoint: true,
    usesFormDataInsteadOfURLParams: true,
    hasFileAttachment: true
  });
  
  const usersStr = Array.isArray(users) ? users.join(",") : users;
  
  // Usar FormData para archivos
  const formData = new FormData();
  formData.append("usuarios", usersStr);
  formData.append("file", file);
  formData.append("media_type", mediaType);
  formData.append("mensaje", message || ""); // Asegurar que siempre enviamos al menos una cadena vacía
  formData.append("skip_existing", skipExisting);
  // Verificar contenido del FormData
for (let pair of formData.entries()) {
  console.log(`FormData contains: ${pair[0]} = ${pair[1] instanceof File ? `File: ${pair[1].name}` : pair[1]}`);
}

  
  try {
    // Obtener headers y agregar token personalizado si existe
    const headers = getCommonHeaders();
    
    // Importante: asegurar que el token se use correctamente
    if (token) {
      headers["token"] = token;
    } else if (headers.token) {
      console.log("Using token from common headers");
    } else {
      console.warn("No token available for sendMedia request");
    }
    
    // No incluir Content-Type en el header para permitir que el navegador establezca el boundary correcto
    delete headers["Content-Type"];
    
    console.log("sendMedia request headers:", {
      ...headers,
      token: headers.token ? "Present (hidden for security)" : "Not present",
      cookie: headers.Cookie ? "Present (hidden for security)" : "Not present"
    });
    console.log("Headers comparison:", {
      messageHeaders: { ...headers, token: "hidden" },
      contentType: headers['Content-Type'],
      hasAuthToken: !!headers.token
    });


    console.log("sendMedia FormData keys:", [...formData.keys()]);
    
    const response = await fetch(`${API_BASE_URL}/enviar_media`, {
      method: "POST",
      headers: headers,
      body: formData
    });
    
    console.log(`sendMedia response status:`, response.status);
    
    // Leer el texto de la respuesta
    const responseText = await response.text();
    console.log("sendMedia raw response:", responseText);
    
    let data;
    try {
      // Intentar parsear como JSON
      data = JSON.parse(responseText);
      console.log("sendMedia parsed response:", data);
      console.log("Response details:", {
      hasError: data.error !== undefined,
      hasQueueId: data.queue_id !== undefined,
      hasMessage: data.message !== undefined,
      status: data.status,
      additionalFields: Object.keys(data).filter(k => !['status', 'message', 'queue_id'].includes(k))
    });
      console.log("Full media response:", {
      status: response.status,
      headers: Object.fromEntries([...response.headers.entries()]),
      body: data
    });
    } catch (jsonError) {
      console.error("Error parsing sendMedia response as JSON:", jsonError);
      // Si no es JSON, devolver un objeto con la respuesta raw
      return {
        status: "error",
        message: "Invalid JSON response",
        raw_response: responseText,
        http_status: response.status
      };
    }
    
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }
    
    return data;
  } catch (error) {
    console.error(`Error en envío de media:`, error);
    throw error;
  }
},
  
  // Estadísticas y gestión
  getUsageStats: () => apiRequest("/usage_stats", {}, "GET"),
  
  getAccountHealth: () => apiRequest("/account_health", {}, "GET"),
  
  setActivityLevel: (level) => apiRequest("/set_activity_level", { level }),
  
  setWarmingMode: (enable) => apiRequest("/warming_mode", { enable }),
  
  pauseOperations: (durationMinutes) => 
    apiRequest("/pause_operations", { duration_minutes: durationMinutes }),
  
  getMessageHistory: (limit = 100) => 
    apiRequest("/message_history", { limit }, "GET"),
  
  getCachedLikes: () => apiRequest("/get_cached_likes", {}, "GET"),
  
  // Operaciones adicionales
  getComments: (postUrl, token = null) => 
    apiRequest("/get_comments", { post_url: postUrl }, "POST", token),
  
  getFollowers: (username, token = null) => 
    apiRequest("/get_followers", { username }, "POST", token),
  
  getFollowing: (username, amount = 50) => 
    apiRequest("/get_following", { username, amount }),
  
  likeLatestPost: (username) => apiRequest("/like_latest_post", { username }),
  
  likeComment: (postUrl, commentUsername) => 
    apiRequest("/like_comment", { post_url: postUrl, comment_username: commentUsername }),
  
  // >>> NUEVA FUNCIÓN <<<
  /**
   * Gestiona una cola de operación específica (pausar, reanudar, cancelar).
   * @param {string} action - La acción a realizar ('pause', 'resume', 'cancel').
   * @param {string} queueIdToManage - El ID de la campaña (usado como queue_id).
   * @param {string} authToken - El token de autenticación JWT.
   * @returns {Promise<object>} - La respuesta de la API.
   */
  manageOperationQueue: async (action, queueIdToManage, authToken) => {
    // Log inicial
    console.log(`manageOperationQueue called (FormData):`, { action, queueId: queueIdToManage, hasToken: !!authToken }); // Use new param name in log

    // Verificar que el token JWT se recibió
    if (!authToken) {
      console.error("manageOperationQueue: Auth token is missing!");
      throw new Error("Authentication token is required.");
    }

    // --- Check if Queue ID is provided ---
    if (!queueIdToManage) {
      console.error("manageOperationQueue: Queue ID to manage is missing!");
      throw new Error("Queue ID to manage is required.");
    }
    // --- End Check ---

    // --- Paso 1: Preparar el Cuerpo de la Solicitud (Body) ---
    const formData = new FormData();
    formData.append('action', action);       // Añade el parámetro 'action'
    formData.append('queue_id', queueIdToManage); // Añade el parámetro 'queue_id' con el valor correcto
    console.log("Request body (FormData):", { action: formData.get('action'), queue_id: formData.get('queue_id') });

    try {
      // Obtener headers comunes
      const headers = getCommonHeaders();
      
      // Importante: asegurar que el token se use correctamente
      if (authToken) {
        headers["token"] = authToken;
      } else if (headers.token) {
        console.log("Using token from common headers");
      } else {
        console.warn("No token available for manageOperationQueue request");
      }
      
      // No incluir Content-Type en el header para permitir que el navegador establezca el boundary correcto
      delete headers["Content-Type"];
      
      console.log("manageOperationQueue request headers:", {
        ...headers,
        token: headers.token ? "Present (hidden for security)" : "Not present",
        cookie: headers.Cookie ? "Present (hidden for security)" : "Not present"
      });
      console.log("Headers comparison:", {
        messageHeaders: { ...headers, token: "hidden" },
        contentType: headers['Content-Type'],
        hasAuthToken: !!headers.token
      });

      console.log("manageOperationQueue FormData keys:", [...formData.keys()]);
      
      // --- Paso 3: Realizar la Petición HTTP (fetch) --- 
      const response = await fetch(`${API_BASE_URL}/manage_operation_queue`, {
        method: 'POST',   // Método HTTP
        headers: headers, // Cabeceras definidas arriba
        body: formData,   // Cuerpo de la solicitud (FormData)
      });

      // --- Paso 4: Procesar la Respuesta ---
      console.log(`Response status for manageOperationQueue (${action}, ${queueIdToManage}):`, response.status); // Log correct queue ID
      const result = await response.json(); // Intenta parsear la respuesta como JSON

      if (!response.ok) {
        const errorMessage = result?.message || `Error HTTP: ${response.status} ${response.statusText}`;
        console.error(`manageOperationQueue error response:`, result);
        throw new Error(errorMessage);
      }
      console.log(`manageOperationQueue success response:`, result);
      return result;

    } catch (error) {
      console.error(`Error en petición a /manage_operation_queue:`, error);
      throw error; 
    }
  },
  // >>> FIN NUEVA FUNCIÓN <<<
};