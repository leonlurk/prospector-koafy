import React, { useState, useEffect, useRef } from 'react';
import { FaWhatsapp, FaUser, FaRobot, FaChartBar, FaPlus, FaPaperPlane, FaQrcode, FaCog, FaSearch, FaSignInAlt, FaSpinner, FaTasks, FaCommentDots, FaPaperclip, FaEdit, FaSave, FaTimes } from 'react-icons/fa';
import { db, auth } from '../firebaseConfig';
import axios from 'axios';
import { 
    getUserKanbanBoards, 
    getKanbanBoardColumnsOnly,
    assignChatToKanbanColumn 
} from '../api';

// URLs de producción - Ajusta estos valores según tu configuración de VPS con nginx
const API_BASE_URL = "https://alets.com.ar/setter-api"; // La URL correcta según la configuración de Nginx
const WS_BASE_URL = "wss://alets.com.ar/setter-api/ws"; // Corregida la URL para WebSocket, añadiendo /ws

// API Key estática como en setter-ai/services/api.js
const STATIC_API_KEY = 'DA0p3i0lNnuuCWTXieGI1CrVjr9IcVzjiXsbMMMyi6s77l4Snq';

// Función para obtener la API key
const getApiKey = () => {
  return STATIC_API_KEY;
};

// Modo de depuración
const DEBUG = true; // Controla logs detallados

// Componente de chat
const ChatInterface = ({ 
  conversations, 
  selectedChat, 
  selectChat, 
  messages, 
  newMessage, 
  setNewMessage, 
  sendMessage, 
  openAssignToKanbanModal, 
  formatPhoneNumber, 
  connectionStatus, 
  wsRef,
  isEditingName,
  editingNameValue,
  handleEditNameClick,
  handleNameInputChange,
  handleSaveName,
  handleCancelEditName
}) => (
    // Main container with modern styling
    <div className="flex h-full bg-slate-50 text-slate-900 font-['Poppins'] rounded-xl shadow-lg overflow-hidden border border-slate-100">
      {/* Lista de conversaciones */}
      <div className="w-1/3 flex flex-col border-r border-slate-100 bg-white">
        {/* Header con Búsqueda y Filtros */}
        <div className="p-4 space-y-3 border-b border-slate-100">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar chat..." 
              className="w-full p-2 pl-10 bg-slate-50 border border-transparent focus:bg-white focus:ring-1 focus:ring-purple-500 focus:border-purple-500 outline-none transition text-sm"
            />
          </div>
        </div>
        
        {/* Lista de Chats */}
        <div className="flex-grow overflow-y-auto">
          {conversations && conversations.length > 0 ? (
            conversations.map(chat => (
              <div 
                key={chat.id || chat.phoneNumber} 
                className={`px-4 py-3 cursor-pointer transition-colors duration-150 ease-in-out border-l-2 flex items-center space-x-3 ${ 
                  selectedChat?.id === chat.id 
                    ? 'border-purple-500 bg-slate-50' 
                    : 'border-transparent hover:bg-slate-50'
                }`}
                onClick={() => selectChat(chat)}
              >
                 {/* Avatar */}
                 <div className="relative flex-shrink-0">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-blue-400 rounded-full flex items-center justify-center text-white text-base font-medium shadow-sm">
                      {chat.name ? chat.name.substring(0,1).toUpperCase() : <FaUser size={18}/>}
                    </div>
                 </div>
               
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <p className="text-sm font-medium text-slate-700 truncate">
                      {chat.contactDisplayName || chat.name || formatPhoneNumber(chat.phoneNumber)}
                    </p>
                    <p className={`text-xs whitespace-nowrap ${selectedChat?.id === chat.id ? 'text-purple-600' : 'text-slate-400'}`}>
                      {chat.timestamp ? new Date(chat.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
                    </p>
                  </div>
                  <div className="flex justify-between items-center mt-0.5">
                    <p className={`text-xs truncate ${selectedChat?.id === chat.id ? 'text-slate-600' : 'text-slate-500'}`}>
                      {chat.lastMessage || 'Haz click para ver detalles'}
                    </p>
                    {chat.unreadCount > 0 && (
                      <div className="bg-purple-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-medium shadow-sm">
                        {chat.unreadCount}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-6 text-center text-slate-500">
              <FaWhatsapp size={36} className="mx-auto mb-3 text-slate-400" />
              <p className="font-medium text-sm">Bandeja vacía</p>
              <p className="text-xs">No hay conversaciones.</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Panel de mensajes */}
      <div className="w-2/3 flex flex-col bg-white">
        {selectedChat ? (
          <>
            {/* Cabecera del chat - Minimalist */}
            <div className="p-3 border-b border-slate-100 bg-white flex justify-between items-center shadow-sm">
              <div className="flex items-center space-x-3 flex-grow min-w-0">
                 <div className="relative flex-shrink-0">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-blue-400 rounded-full flex items-center justify-center text-white text-base font-medium shadow-sm">
                        {selectedChat.name ? selectedChat.name.substring(0,1).toUpperCase() : <FaUser size={18}/>}
                    </div>
                 </div>
                <div className="flex-grow min-w-0">
                 {isEditingName ? (
                    <div className="flex items-center space-x-1">
                        <input 
                            type="text"
                            value={editingNameValue}
                            onChange={handleNameInputChange}
                            onKeyDown={(e) => e.key === 'Enter' ? handleSaveName() : (e.key === 'Escape' ? handleCancelEditName() : null)}
                            className="text-base font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-purple-300 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 flex-grow"
                            autoFocus
                        />
                        <button onClick={handleSaveName} className="p-1 text-green-600 hover:text-green-700"><FaSave size={16}/></button>
                        <button onClick={handleCancelEditName} className="p-1 text-red-600 hover:text-red-700"><FaTimes size={16}/></button>
                    </div>
                 ) : (
                    <div className="flex items-center space-x-1.5 group">
                      <h3 className="font-semibold text-slate-800 text-base leading-tight truncate">
                        {selectedChat.contactDisplayName || selectedChat.name || formatPhoneNumber(selectedChat.phoneNumber)}
                      </h3>
                      <button onClick={handleEditNameClick} className="text-slate-400 hover:text-purple-600 opacity-0 group-hover:opacity-100 transition-opacity">
                        <FaEdit size={14} />
                      </button>
                    </div>
                 )}
                  <p className={`text-xs leading-tight ${connectionStatus === 'connected' && wsRef.current?.readyState === WebSocket.OPEN ? 'text-green-500' : 'text-slate-400'}`}>
                     {connectionStatus === 'connected' && wsRef.current?.readyState === WebSocket.OPEN ? '● Online' : '○ Offline'}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-1">
                 {/* Simplified Assign Button */}
                <button 
                  onClick={() => openAssignToKanbanModal(selectedChat)}
                  className="p-2 text-slate-500 hover:text-purple-600 rounded-lg hover:bg-slate-100 transition-colors"
                  title="Asignar chat a Kanban"
                  disabled={!selectedChat.id}
                >
                  <FaTasks size={18} /> 
                </button>
                {/* Placeholder Action Icons */}
                <button className="p-2 text-slate-500 hover:text-purple-600 rounded-lg hover:bg-slate-100 transition-colors">
                    <FaSearch size={18}/>
                </button>
                <button className="p-2 text-slate-500 hover:text-purple-600 rounded-lg hover:bg-slate-100 transition-colors">
                    <FaCog size={18}/> {/* Using FaCog as a general 'more options' placeholder */}
                </button>
              </div>
            </div>
            
            {/* Área de mensajes - Increased spacing & Reversed Order */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50 flex flex-col-reverse">
              {messages && messages.length > 0 ? (
                messages.map(msg => {
                  // Log fromMe value for each message during render
                  console.log(`[Render] Message ID: ${msg.id}, fromMe: ${msg.fromMe}`); 
                  return (
                    <div 
                      key={msg.id || (String(msg.timestamp) + '-' + Math.random().toString(36).substr(2, 9))} 
                      className={`flex ${msg.fromMe ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-xl px-4 py-3 rounded-2xl shadow-md ${ 
                        msg.fromMe 
                          ? 'bg-blue-50 text-blue-800 rounded-br-lg' 
                          : 'bg-white text-slate-700 rounded-bl-lg border border-slate-200'
                      }`}>
                        <p className="text-sm whitespace-pre-wrap">{msg.body}</p>
                        <p className={`text-xs mt-1.5 ${msg.fromMe ? 'text-blue-600/80' : 'text-slate-400'} text-right`}>
                          {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex justify-center items-center h-full text-slate-500">
                  <FaCommentDots size={32} className="mx-auto mb-2" />
                  <p>No hay mensajes en esta conversación.</p>
                </div>
              )}
            </div>
            
            {/* Área de entrada de mensajes - Minimalist */}
            <div className="p-3 border-t border-slate-100 bg-white">
              <div className="flex items-center space-x-2 bg-slate-50 p-1 rounded-lg">
                <button className="p-2.5 text-slate-500 hover:text-purple-600 rounded-lg hover:bg-slate-200 transition-colors">
                  <FaPaperclip size={18} />
                </button>
                <input 
                  type="text" 
                  placeholder="Escribe un mensaje..." 
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey ? (e.preventDefault(), sendMessage()) : null}
                  className="flex-grow py-2 px-3 bg-transparent text-slate-700 placeholder-slate-400 focus:outline-none text-sm"
                />
                <button 
                  onClick={sendMessage} 
                  disabled={!newMessage.trim() || connectionStatus !== 'connected' || wsRef.current?.readyState !== WebSocket.OPEN}
                  className="p-2.5 rounded-lg bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white transition-all shadow-sm hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  <FaPaperPlane size={18} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center bg-slate-100 text-slate-500 p-8">
            <FaWhatsapp size={56} className="mx-auto mb-5 text-slate-400" />
            <h3 className="text-xl font-semibold mb-1">Tu Bandeja de Entrada CRM</h3>
            <p className="text-center">Selecciona una conversación de la lista para ver los mensajes aquí.</p>
            <p className="text-center text-sm mt-1">Gestiona todas tus interacciones en un solo lugar.</p>
          </div>
        )}
      </div>
    </div>
  );

const WhatsAppCRM = ({ user }) => {
  // Estados para la conexión y estado de WhatsApp
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [qrCodeUrl, setQrCodeUrl] = useState(null);
  const [agents, setAgents] = useState([]);
  const [activeAgentId, setActiveAgentId] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [rules, setRules] = useState([]);
  const [errorMessage, setErrorMessage] = useState(null); // Para mostrar errores en la UI
  const [isConnectingWs, setIsConnectingWs] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const maxReconnectAttempts = 5;
  const reconnectDelay = 5000; // 5 segundos
  
  // Referencia al WebSocket
  const wsRef = useRef(null);
  // Referencia al intervalo de verificación de estado
  const statusCheckIntervalRef = useRef(null);
  // Referencia al intervalo de ping
  const pingIntervalRef = useRef(null);

  // Estado para controlar si WebSocket está habilitado
  const [wsEnabled, setWsEnabled] = useState(true);

  // New state for Kanban assignment modal
  const [assignModalState, setAssignModalState] = useState({
    isOpen: false,
    chat: null,
    boards: [],
    selectedBoardId: '',
    columns: [],
    selectedColumnId: '',
    isLoadingBoards: false,
    isLoadingColumns: false,
    error: null,
    successMessage: '',
    currentContactName: ''
  });

  // <<< ADDED: State for contact name editing >>>
  const [isEditingName, setIsEditingName] = useState(false);
  const [editingNameValue, setEditingNameValue] = useState('');

  // Helper function para manejar respuestas de la API (como en setter-ai/services/api.js)
  const handleResponse = async (response) => {
    if (response.status >= 200 && response.status < 300) {
      if (response.data) {
        return response.data;
      }
      return { success: true };
    }

    // Si hay un error, obtener mensaje del servidor
    let errorMsg;
    if (response.data && response.data.message) {
      errorMsg = response.data.message;
    } else if (response.statusText) {
      errorMsg = response.statusText;
    } else {
      errorMsg = `Error: ${response.status}`;
    }

    throw new Error(errorMsg);
  };

  // Helper function para manejar errores de la API (como en setter-ai/services/api.js)
  const handleApiError = (error) => {
    console.error("API Error:", error);
    
    // Log completo del error para depuración
    console.log("Error completo:", JSON.stringify(error, null, 2));
    
    let errorMsg = "Error desconocido";
    
    if (error.response) {
      console.log("Status del error:", error.response.status);
      console.log("Datos del error:", JSON.stringify(error.response.data, null, 2));
      
      // No mostrar error para 404 en determinados endpoints
      if (error.response.status === 404 && 
          (error.config.url.includes('/active-agent') || 
           error.config.url.includes('/agents/active'))) {
        return { success: false, notFound: true };
      }
      
      errorMsg = error.response.data?.message || error.response.statusText || "Error del servidor";
    } else if (error.request) {
      errorMsg = "No se pudo contactar al servidor. Verifique su conexión.";
    } else {
      errorMsg = error.message || "Error desconocido";
    }
    
    setErrorMessage(errorMsg);
    throw new Error(errorMsg);
  };

  // Función para realizar llamadas a la API utilizando axios como en setter-ai
  const apiCall = async (endpoint, method = 'GET', data = null) => {
    try {
      if (DEBUG) console.log(`API Call: ${method} ${API_BASE_URL}${endpoint}`);
      
      const apiKey = getApiKey();
      const options = {
        method,
        url: `${API_BASE_URL}${endpoint}`,
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 15000 // 15 segundos como en setter-ai
      };

      if (data && (method === 'POST' || method === 'PUT')) {
        options.data = data;
        if (DEBUG) console.log("Request body:", data);
      }

      try {
        const response = await axios(options);
        return await handleResponse(response);
      } catch (axiosError) {
        // Si es un error 404 en el endpoint de status, interpretamos como desconectado
        if (axiosError.response && 
            axiosError.response.status === 404 && 
            endpoint.includes('/status')) {
          console.log("Endpoint de status devolvió 404, interpretando como desconectado");
          return { status: 'disconnected' };
        }
        return handleApiError(axiosError);
      }
    } catch (generalError) {
      console.error("Error general en apiCall:", generalError);
      throw generalError;
    }
  };

  // Verificar estado del WhatsApp (AHORA SOLO USADO PARA UI INICIAL, NO PARA GESTIÓN DE CONEXIÓN WS)
  const checkWorkerStatusForUI = async () => {
    try {
      console.log(`[UI Status Check] Verificando estado para usuario: ${user.uid}`);
      const result = await apiCall(`/users/${user.uid}/status`);
      console.log("[UI Status Check] Respuesta completa del status:", JSON.stringify(result, null, 2));

      if (result) {
        const qrCodeFromApi = result.qrCodeUrl || result.qrCode || (result.data && (result.data.qrCodeUrl || result.data.qrCode));
        if (qrCodeFromApi) {
            setQrCodeUrl(qrCodeFromApi);
            // Si hay QR, el estado real lo determinará el WS o el intervalo
             if (connectionStatus !== 'connected' && connectionStatus !== 'connecting') {
                 setConnectionStatus('generating_qr'); // Solo si no estamos ya conectados/conectando
             }
        } else {
            setQrCodeUrl(null); // Limpiar QR si no viene en la respuesta
        }
        // Nota: Ya no establecemos connectionStatus aquí basado en HTTP,
        // dejamos que el WebSocket y el intervalo lo manejen.
      } else {
         setConnectionStatus( prevStatus => prevStatus === 'connected' ? 'connected' : 'disconnected');
      }
    } catch (error) {
      console.error("[UI Status Check] Error al verificar estado:", error);
      setConnectionStatus( prevStatus => prevStatus === 'connected' ? 'connected' : 'disconnected');
    }
  };

  // Cargar todos los datos iniciales necesarios
  const loadInitialData = async () => {
    try {
      console.log("Cargando datos iniciales...");
      await checkWorkerStatusForUI(); // Check initial status for QR display etc.
      await loadAgents();
      await loadRules();
      // Load conversations ONLY if WebSocket confirms connection later
      // await loadConversations(); // Moved to be triggered by WebSocket connection status
    } catch (error) {
      console.error("Error general al cargar datos iniciales:", error);
      // Set specific error messages if needed
      setErrorMessage("Error al cargar datos iniciales. Intente recargar.");
    }
  };

  // Función para actualizar el estado basado en WebSocket.readyState
  const updateStatusFromReadyState = () => {
    if (!wsRef.current) {
        // Si no hay referencia y el estado no es ya 'disconnected', actualizarlo.
        if (connectionStatus !== 'disconnected') {
            setConnectionStatus('disconnected');
        }
        return;
    }

    const currentReadyState = wsRef.current.readyState;
    let newStatus = connectionStatus; // Empezar con el estado actual

    switch (currentReadyState) {
        case WebSocket.CONNECTING:
            newStatus = 'connecting';
            break;
        case WebSocket.OPEN:
            // Solo cambiar a 'connected' y cargar si NO estábamos ya conectados
            if (connectionStatus !== 'connected') {
                newStatus = 'connected';
                console.log("[Status Check] WebSocket OPEN detectado. Estado anterior:", connectionStatus, "-> Estableciendo 'connected'.");
                // Si nos conectamos, reseteamos intentos de reconexión
                if (reconnectAttempts > 0) setReconnectAttempts(0);
                // Cargar conversaciones solo al pasar a estado OPEN
                console.log("[Status Check] Llamando a loadConversations() por transición a OPEN.");
                loadConversations().catch(err => console.error("Error cargando conversaciones post-conexión:", err));
            } else {
                 // Si ya estábamos conectados, mantenemos 'connected'
                 newStatus = 'connected';
            }
            break;
        case WebSocket.CLOSING:
            newStatus = 'disconnecting';
            break;
        case WebSocket.CLOSED:
        default:
             // Si está cerrado y no estamos ya intentando reconectar, iniciamos reconexión
            if (!isConnectingWs && connectionStatus !== 'disconnected') {
                 console.log("[Status Check] WebSocket CLOSED detectado. Iniciando reconexión.");
                 newStatus = 'reconnecting'; // Indicar que intentaremos reconectar
                 handleReconnect(); // Intenta reconectar si se cerró inesperadamente
            } else if (isConnectingWs && reconnectAttempts >= maxReconnectAttempts) {
                 // Si fallaron todos los intentos de reconexión
                 console.log("[Status Check] WebSocket CLOSED, intentos agotados.");
                 newStatus = 'disconnected';
            } else if (isConnectingWs) {
                 // Si está cerrado pero aún estamos en proceso de (re)conexión
                 console.log("[Status Check] WebSocket CLOSED mientras se conectaba/reconectaba.");
                 newStatus = 'reconnecting'; // O mantener 'connecting' si se prefiere
            } else {
                 // Si ya estaba desconectado, mantenerlo
                 newStatus = 'disconnected';
            }
            break;
    }

    // Actualizar estado solo si ha cambiado
    if (newStatus !== connectionStatus) {
        setConnectionStatus(newStatus);
    }

     if (DEBUG) console.log(`[Status Check Interval] readyState: ${currentReadyState}, currentStatus: ${connectionStatus}, newStatus: ${newStatus}`);
  };

  // Efecto para inicializar WebSocket y manejar ciclo de vida
  useEffect(() => {
    if (!user?.uid || !wsEnabled) {
      // Si no hay usuario o WS está deshabilitado, asegurarse de limpiar
      if (wsRef.current) {
          console.log("Cerrando WebSocket existente (no user/disabled)...");
          wsRef.current.close(1000, "WebSocket disabled or user logged out");
          wsRef.current = null;
      }
      if (statusCheckIntervalRef.current) {
          clearInterval(statusCheckIntervalRef.current);
          statusCheckIntervalRef.current = null;
      }
      // Limpiar intervalo de ping también
      if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = null;
      }
       setConnectionStatus('disconnected');
      return;
    }

    const initWebSocket = () => {
      // Prevenir múltiples conexiones simultáneas
      if (wsRef.current && wsRef.current.readyState !== WebSocket.CLOSED) {
        console.log("WebSocket ya existe y no está cerrado. Saltando inicialización.");
        return;
      }

      setIsConnectingWs(true);
      setErrorMessage(null);
      setConnectionStatus('connecting'); // Estado inicial al intentar conectar

      const wsUrl = `${WS_BASE_URL}?userId=${user.uid}`;
      if (DEBUG) console.log(`Attempting WebSocket connection to ${wsUrl} (Attempt ${reconnectAttempts + 1})`);

      try {
          wsRef.current = new WebSocket(wsUrl);

          wsRef.current.onopen = () => {
            if (DEBUG) console.log('WebSocket connection opened');
            setIsConnectingWs(false);
            // NO establecemos 'connected' aquí, el intervalo lo hará basado en readyState

            // --- Iniciar Ping Interval --- 
            if (pingIntervalRef.current) {
                clearInterval(pingIntervalRef.current); // Limpiar anterior si existe
            }
            pingIntervalRef.current = setInterval(() => {
                if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                    try {
                        if (DEBUG) console.log("[Ping] Sending PING to server.");
                        wsRef.current.send(JSON.stringify({ type: 'PING' }));
                    } catch (pingError) {
                        console.error("[Ping] Error sending PING:", pingError);
                        // Si falla el envío, podría indicar que la conexión está mal, limpiar intervalo?
                        // clearInterval(pingIntervalRef.current);
                        // pingIntervalRef.current = null;
                        // Considerar forzar una verificación de estado o reconexión
                    }
                } else {
                    // Si el socket ya no está abierto, limpiar el intervalo de ping
                    if (DEBUG) console.log("[Ping] WebSocket not OPEN. Clearing ping interval.");
                    clearInterval(pingIntervalRef.current);
                    pingIntervalRef.current = null;
                }
            }, 30000); // Enviar PING cada 30 segundos
            // --- Fin Iniciar Ping Interval ---
          };

          wsRef.current.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                // Log ALL incoming WS messages for debugging
                console.log('[WebSocket] Received Message:', message);

                // Manejar diferentes tipos de mensajes del servidor
                switch (message.type) {
                    case 'STATUS_UPDATE':
                         // Actualizar estado basado en mensaje del servidor (puede complementar el readyState)
                         // setConnectionStatus(message.status); // Podríamos usar esto si el servidor envía estados
                         // setQrCodeUrl(message.qrCodeUrl || null);
                         break;
                    case 'NEW_MESSAGE':
                        // IGNORAR mensajes de broadcast/newsletter aquí también si es posible identificar el chat
                        if (message.payload?.chatId && 
                            (message.payload.chatId.includes('@newsletter') || message.payload.chatId.includes('@broadcast'))) {
                            if (DEBUG) console.log('Ignorando NEW_MESSAGE de broadcast/newsletter:', message.payload.chatId);
                            return; // No procesar este mensaje
                        }
                        // Actualizar la lista de mensajes del chat seleccionado
                        if (selectedChat && selectedChat.id === message.payload.chatId) {
                            // Log before adding message
                            console.log('[WebSocket] Adding NEW_MESSAGE to selected chat:', message.payload);
                            setMessages(prev => [...prev, message.payload]);
                            // TODO: Scroll to bottom
                        }
                        // Actualizar la lista de conversaciones (ej. lastMessage, unreadCount)
                         setConversations(prevConvos => prevConvos.map(convo =>
                             convo.id === message.payload.chatId
                                 ? { ...convo, lastMessage: formatLastMessage(message.payload.body), timestamp: message.payload.timestamp, unreadCount: (convo.id === selectedChat?.id ? 0 : (convo.unreadCount || 0) + 1) }
                                 : convo
                         ));
                        break;
                    case 'CHAT_UPDATE':
                        // IGNORAR actualizaciones de chats de broadcast/newsletter
                        if (message.payload?.id && 
                            (message.payload.id.includes('@newsletter') || message.payload.id.includes('@broadcast'))) {
                            if (DEBUG) console.log('Ignorando CHAT_UPDATE de broadcast/newsletter:', message.payload.id);
                            return; // No procesar esta actualización de chat
                        }
                        // Actualizar una conversación específica en la lista
                         setConversations(prevConvos => {
                             const existingIndex = prevConvos.findIndex(c => c.id === message.payload.id);
                             if (existingIndex > -1) {
                                 const updatedConvos = [...prevConvos];
                                 updatedConvos[existingIndex] = { ...updatedConvos[existingIndex], ...message.payload };
                                 return updatedConvos;
                             } else {
                                 return [...prevConvos, message.payload]; // Añadir si es nueva
                             }
                         });
                        break;
                     case 'ERROR':
                         console.error("Error recibido del WebSocket Server:", message.payload);
                         setErrorMessage(message.payload?.message || "Error desconocido del servidor.");
                         break;
                     case 'PONG': // Si implementamos ping/pong
                         if (DEBUG) console.log("Pong received from server.");
                         // Podríamos resetear un temporizador de inactividad aquí
                         break;
                    default:
                        if (DEBUG) console.log('Unhandled WebSocket message type:', message.type);
                }
            } catch (e) {
                console.error('Error parsing WebSocket message:', e);
                console.error('Raw message data:', event.data);
            }
          };

          wsRef.current.onerror = (error) => {
            console.error('WebSocket error:', error);
            // Log detallado del evento de error
             console.error('Error Event Object:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
             setIsConnectingWs(false); // Dejó de intentar conectar (falló)
             setErrorMessage("Error de conexión WebSocket.");
             // El onclose se llamará después, no necesitamos setear disconnected aquí
          };

          wsRef.current.onclose = (event) => {
            if (DEBUG) console.log(`WebSocket disconnected. Code: ${event.code}, Reason: ${event.reason || 'N/A'}, Clean close: ${event.wasClean}`);
            setIsConnectingWs(false); // Dejó de estar en proceso de conexión activa
            wsRef.current = null; // Limpiar la referencia

            // NO establecemos 'disconnected' inmediatamente si vamos a reconectar
            // setConnectionStatus('disconnected'); // <-- REMOVED

            // Intentar reconectar solo si no fue un cierre limpio/intencional y no se superaron los intentos
            if (!event.wasClean && wsEnabled && reconnectAttempts < maxReconnectAttempts) {
                 handleReconnect();
            } else {
                 // Si fue cierre limpio, deshabilitado, o se agotaron intentos, marcar como desconectado
                 setConnectionStatus('disconnected');
                 if (reconnectAttempts >= maxReconnectAttempts) {
                    setErrorMessage(`No se pudo reconectar después de ${maxReconnectAttempts} intentos.`);
                 }
                 // Limpiar intervalo si existe
                 if (statusCheckIntervalRef.current) {
                    clearInterval(statusCheckIntervalRef.current);
                    statusCheckIntervalRef.current = null;
                 }
            }

            // Limpiar intervalo de ping al cerrar
            if (pingIntervalRef.current) {
                clearInterval(pingIntervalRef.current);
                pingIntervalRef.current = null;
                if (DEBUG) console.log("[Ping] Cleared ping interval on WebSocket close.");
            }
          };
      } catch (e) {
         console.error("Error creating WebSocket:", e);
         setErrorMessage("No se pudo crear la conexión WebSocket.");
         setIsConnectingWs(false);
         setConnectionStatus('disconnected');
      }
    };

    const handleReconnect = () => {
        if (isConnectingWs || !wsEnabled) return; // Evitar reconexiones múltiples o si está deshabilitado

        const attempt = reconnectAttempts + 1;
         setReconnectAttempts(attempt);
         console.log(`Intentando reconectar WebSocket en ${reconnectDelay / 1000}s... (Intento ${attempt}/${maxReconnectAttempts})`);
         setConnectionStatus('reconnecting'); // Estado intermedio

        setTimeout(() => {
            if (wsEnabled) { // Volver a verificar por si se deshabilitó mientras esperaba
                 initWebSocket();
            } else {
                 console.log("Reconexión cancelada porque wsEnabled es false.");
                 setConnectionStatus('disconnected');
            }
        }, reconnectDelay);
    };

    // Iniciar conexión inicial
    initWebSocket();

    // --- Iniciar intervalo para verificar estado ---
    if (statusCheckIntervalRef.current) {
        clearInterval(statusCheckIntervalRef.current); // Limpiar intervalo previo si existe
    }
    statusCheckIntervalRef.current = setInterval(updateStatusFromReadyState, 3000); // Verificar cada 3 segundos

    // Función de limpieza del efecto
    return () => {
      console.log("Limpiando WebSocket y intervalos al desmontar/cambiar dependencias...");
      // Limpiar intervalo de estado
      if (statusCheckIntervalRef.current) {
          clearInterval(statusCheckIntervalRef.current);
          statusCheckIntervalRef.current = null;
      }
      // Limpiar intervalo de ping
      if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = null;
      }
      // Cerrar WebSocket si existe
      if (wsRef.current) {
          wsRef.current.close(1000, "Component unmounting"); // Cierre limpio
          wsRef.current = null;
      }
       // Resetear estado de conexión al desmontar para evitar estados inconsistentes si se remonta rápido
       setIsConnectingWs(false);
       setReconnectAttempts(0); // Resetear intentos al desmontar/cambiar user
    };
  }, [user?.uid, wsEnabled]); // Dependencias: cambio de usuario o habilitación/deshabilitación del WS

  // Efecto para cargar datos iniciales cuando el usuario cambia
  useEffect(() => {
    if (user?.uid) {
        loadInitialData();
    } else {
       // Limpiar datos si el usuario se desloguea
       setAgents([]);
       setConversations([]);
       setMessages([]);
       setSelectedChat(null);
       setRules([]);
       setQrCodeUrl(null);
       setConnectionStatus('disconnected');
    }
  }, [user?.uid]); // Solo depende del UID del usuario

  // Verificar estado de WhatsApp y cargar conversaciones si está activo
  const connectWhatsApp = async () => {
    // Simplemente llamar a loadConversations directamente
    // Esta función ahora solo sirve como alias para mantener compatibilidad con el código existente
    await loadConversations();
  };

  // Cargar conversaciones
  const loadConversations = async () => {
    try {
      setErrorMessage(null);
      console.log("Cargando conversaciones...");
      const result = await apiCall(`/users/${user.uid}/chats`);
      console.log("Conversaciones cargadas (raw):", result);
      if (result && result.data) {
        // Procesar y FILTRAR las conversaciones
        const processedAndFilteredChats = result.data
          .filter(chat => 
            chat.chatId && 
            !chat.chatId.includes('@newsletter') && 
            !chat.chatId.includes('@broadcast')
          )
          .map(chat => ({
            id: chat.chatId,  // Asignar chatId a id para mantener consistencia
            phoneNumber: chat.contactName || chat.chatId, // Keep original chatId here if no contactName
            name: formatPhoneNumber(chat.contactName || chat.chatId), // Format for display
            lastMessage: formatLastMessage(chat.lastMessageContent),
            timestamp: chat.lastMessageTimestamp,
            unreadCount: chat.unreadCount || 0
          }));
        
        console.log("Conversaciones procesadas y filtradas para CRM Inbox:", processedAndFilteredChats);
        setConversations(processedAndFilteredChats);
      }
    } catch (error) {
      console.error("Error al cargar conversaciones:", error);
      
      // Mostrar mensaje de error específico
      if (error.message && error.message.includes("404")) {
        setErrorMessage("No se pudo cargar las conversaciones. Asegúrese de que WhatsApp esté conectado en la sección Setter.");
      } else {
        setErrorMessage("Error al cargar conversaciones: " + (error.message || "Error desconocido"));
      }
    }
  };

  // Función para formatear el número de teléfono para mostrar
  const formatPhoneNumber = (phoneStr) => {
    if (!phoneStr) return "";
    
    // Evitar procesar IDs que no parecen números de teléfono
    if (phoneStr.includes('@newsletter') || phoneStr.includes('@broadcast')) {
      return phoneStr;
    }
    
    // Extraer solo dígitos del número
    const digits = phoneStr.replace(/\D/g, '');
    if (digits.length >= 10) {
      // Formatear como número telefónico
      return `+${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5, 8)}-${digits.slice(8)}`;
    }
    
    return phoneStr;
  };
  
  // Función para formatear el último mensaje (truncar si es muy largo o es una imagen)
  const formatLastMessage = (content) => {
    if (!content) return "Sin mensajes";
    
    // Verificar si es un mensaje multimedia (comienza con base64 o tiene formato de archivo)
    if (content.startsWith('/9j/') || content.startsWith('data:image')) {
      return "[Imagen]";
    }
    
    // Truncar mensaje de texto largo
    if (content.length > 50) {
      return content.substring(0, 47) + '...';
    }
    
    return content;
  };

  // Cargar mensajes de un chat específico
  const loadChatMessages = async (chatId) => {
    console.log(`[loadChatMessages] Attempting to load messages for chatId: ${chatId}`);
    try {
      console.log("Cargando mensajes para chat:", chatId);
      const result = await apiCall(`/users/${user.uid}/chats/${chatId}/messages?limit=50`);
      console.log("[loadChatMessages] Raw API response:", result); // Log raw response
      if (result && result.data) {
        // Procesar los mensajes para asegurar el formato correcto
        const processedMessages = result.data.map(msg => ({
          id: msg.id || `${msg.timestamp}-${Math.random().toString(36).substr(2, 9)}`,
          body: formatMessageContent(msg.content || msg.body),
          fromMe: !!msg.fromMe, // Ensure boolean
          timestamp: msg.timestamp,
          hasMedia: isMediaMessage(msg.content || msg.body)
        }));
        
        console.log("[loadChatMessages] Processed messages (check fromMe):", processedMessages);
        setMessages(processedMessages);
      }
    } catch (error) {
      console.error("[loadChatMessages] Error loading messages:", error);
      setErrorMessage("Error al cargar mensajes: " + (error.message || "Error desconocido"));
    }
  };

  // Función para formatear el contenido del mensaje
  const formatMessageContent = (content) => {
    if (!content) return "";
    
    // Verificar si es un mensaje multimedia (comienza con base64)
    if (typeof content === 'string' && (content.startsWith('/9j/') || content.startsWith('data:image'))) {
      return "[Imagen]";
    }
    
    return content;
  };
  
  // Verificar si el mensaje contiene media
  const isMediaMessage = (content) => {
    if (!content) return false;
    return typeof content === 'string' && (content.startsWith('/9j/') || content.startsWith('data:image'));
  };

  // Seleccionar chat y cargar sus mensajes
  const selectChat = (chat) => {
    console.log("Seleccionando chat:", chat);
    setSelectedChat(chat);
    if (chat && chat.id) {
      loadChatMessages(chat.id);
    }
  };

  // Enviar mensaje de WhatsApp
  const sendMessage = async () => {
    if (!selectedChat || !newMessage.trim()) return;
    
    console.log(`[sendMessage] Attempting to send: "${newMessage}" to chat:`, selectedChat.id);
    console.log(`[sendMessage] Connection Status: ${connectionStatus}, WS Ready State: ${wsRef.current?.readyState}`);
    
    try {
      console.log('[sendMessage] Making API call...');
      await apiCall(`/users/${user.uid}/send-message`, 'POST', {
        number: selectedChat.phoneNumber, // Ensure this holds the correct recipient ID
        message: newMessage
      });
      console.log('[sendMessage] API call successful.');
      
      // Optimistic update para la UI
      const newMsg = {
        id: Date.now().toString(),
        body: newMessage,
        fromMe: true, // Assuming sent messages are always fromMe
        timestamp: new Date().toISOString()
      };
      
      console.log('[sendMessage] Optimistically updating UI with:', newMsg);
      setMessages(prev => [...prev, newMsg]);
      setNewMessage('');
      
    } catch (error) {
      console.error("[sendMessage] Error sending message:", error);
      setErrorMessage("Error al enviar mensaje: " + (error.message || "Error desconocido")); // Show error in UI
    }
  };

  // Cargar agentes
  const loadAgents = async () => {
    try {
      const result = await apiCall(`/users/${user.uid}/agents`);
      if (result && result.data) {
        setAgents(result.data || []);
      }
      
      // Cargar agente activo - manejar 404 correctamente
      try {
        const activeAgentResult = await apiCall(`/users/${user.uid}/active-agent`);
        if (activeAgentResult && activeAgentResult.activeAgentId) {
          setActiveAgentId(activeAgentResult.activeAgentId);
        }
      } catch (error) {
        // Ignorar el error 404 para agente activo, es normal si no hay un agente configurado
        console.log("No se encontró agente activo, esto es normal si no hay agentes configurados");
        setActiveAgentId(null);
      }
    } catch (error) {
      console.error("Error al cargar agentes:", error);
    }
  };

  // Cargar reglas
  const loadRules = async () => {
    try {
      const result = await apiCall(`/users/${user.uid}/rules`);
      if (result && result.data) {
        setRules(result.data || []);
      }
    } catch (error) {
      console.error("Error al cargar reglas:", error);
    }
  };

  // Cambiar agente activo
  const setActiveAgent = async (agentId) => {
    try {
      await apiCall(`/users/${user.uid}/active-agent`, 'PUT', { agentId });
      setActiveAgentId(agentId);
    } catch (error) {
      console.error("Error al cambiar agente activo:", error);
    }
  };

  // Función para comprobar si el servicio de WhatsApp está activo (cualquier estado que no sea disconnected)
  const isWhatsAppActive = () => {
    // Solo consideramos como activo si el estado es explícitamente 'connected'
    return connectionStatus === 'connected' || connectionStatus === 'connecting' || connectionStatus === 'generating_qr';
  };

  // --- Kanban Assignment Modal Functions ---
  const openAssignToKanbanModal = async (chat) => {
    if (!chat || !chat.id) {
      console.error("[openAssignToKanbanModal] Invalid chat object provided.");
      setErrorMessage("No se puede asignar el chat: objeto inválido.");
      return;
    }
    console.log("[openAssignToKanbanModal] Opening for chat:", chat);
    // <<< ADDED: Initialize currentContactName from chat >>>
    setAssignModalState(prev => ({
      ...prev,
      isOpen: true,
      chat: chat,
        selectedBoardId: chat.kanbanBoardId || '', // Pre-select board if already assigned
        selectedColumnId: chat.kanbanColumnId || '', // Pre-select column if already assigned
        currentContactName: chat.contactDisplayName || chat.name || '', // Pre-fill name
        columns: [], // Reset columns initially
        errorMessage: null, 
        successMessage: null,
        isLoading: true 
    }));
    
    await loadBoardsForModal(); // Load boards first
    // If a board was pre-selected, load its columns
    if (chat.kanbanBoardId) {
      await handleBoardSelectedInModal(chat.kanbanBoardId, chat.kanbanColumnId || ''); // Pass pre-selected column
    }
     setAssignModalState(prev => ({ ...prev, isLoading: false }));
  };

  const loadBoardsForModal = async () => {
    if (!user || !user.uid) return;
    setAssignModalState(prev => ({ ...prev, isLoadingBoards: true, error: null }));
    try {
      // The authToken parameter in getUserKanbanBoards is not strictly used if getAuthHeaders() provides the key.
      // We can pass STATIC_API_KEY or a placeholder if needed, relying on getAuthHeaders in api.js.
      const response = await getUserKanbanBoards(user.uid, STATIC_API_KEY); 
      if (response.success && response.data) {
        setAssignModalState(prev => ({ ...prev, boards: response.data, isLoadingBoards: false }));
      } else {
        throw new Error(response.message || "No se pudieron cargar los tableros Kanban.");
      }
    } catch (error) {
      console.error("Error loading Kanban boards for modal:", error);
      setAssignModalState(prev => ({ ...prev, isLoadingBoards: false, error: error.message }));
    }
  };

  const handleBoardSelectedInModal = async (boardId, preSelectedColumnId = '') => {
    setAssignModalState(prev => ({
      ...prev,
      selectedBoardId: boardId,
      selectedColumnId: preSelectedColumnId,
      isLoadingColumns: true,
      error: null
    }));
    if (!user || !user.uid || !boardId) {
      setAssignModalState(prev => ({ ...prev, isLoadingColumns: false, error: "ID de usuario o tablero no válido." }));
      return;
    }
    try {
      const response = await getKanbanBoardColumnsOnly(user.uid, boardId, STATIC_API_KEY);
      if (response.success && response.columns) {
        setAssignModalState(prev => ({ ...prev, columns: response.columns, isLoadingColumns: false }));
      } else {
        throw new Error(response.message || "No se pudieron cargar las columnas del tablero.");
      }
    } catch (error) {
      console.error("Error loading columns for modal:", error);
      setAssignModalState(prev => ({ ...prev, isLoadingColumns: false, error: error.message }));
    }
  };
  
  const handleAssignConfirm = async () => {
    if (!assignModalState.chat || !assignModalState.selectedBoardId || !assignModalState.selectedColumnId) {
      setAssignModalState(prev => ({ ...prev, errorMessage: "Debes seleccionar un tablero y una columna." }));
      return;
    }

    setAssignModalState(prev => ({ ...prev, isLoading: true, errorMessage: null, successMessage: null }));

    const endpoint = `/users/${user.uid}/chats/${assignModalState.chat.id}/assign-kanban-column`;
    const payload = {
      boardId: assignModalState.selectedBoardId,
      columnId: assignModalState.selectedColumnId,
      // <<< ADDED: Include contactName in payload >>>
      contactName: assignModalState.currentContactName 
    };

    console.log("[handleAssignConfirm] Sending payload:", payload);

    try {
        const response = await apiCall(endpoint, 'PUT', payload);
      if (response.success) {
        setAssignModalState(prev => ({
          ...prev,
                isLoading: false, 
                successMessage: 'Chat asignado con éxito!'
            }));
            // Optionally update local state if needed, or reload
            await loadConversations(); // Reload conversations to reflect potential name change
            // Close modal after a short delay
            setTimeout(() => closeAssignModal(), 1500);
      } else {
            setAssignModalState(prev => ({ 
                ...prev, 
                isLoading: false, 
                errorMessage: response.message || 'Error desconocido al asignar.' 
            }));
      }
    } catch (error) {
        setAssignModalState(prev => ({ 
            ...prev, 
            isLoading: false, 
            errorMessage: `Error: ${error.message}` 
        }));
    }
  };

  const closeAssignModal = () => {
    setAssignModalState({
      isOpen: false,
      chat: null,
      boards: assignModalState.boards, // Keep boards loaded
      selectedBoardId: '',
      columns: [],
      selectedColumnId: '',
      isLoadingBoards: false,
      isLoadingColumns: false,
      error: null,
      successMessage: '',
      currentContactName: ''
    });
  };

  // Componente de agentes
  const AgentsPanel = () => (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold">Agentes Conversacionales</h3>
        <button className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600 transition">
          <FaPlus />
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {agents.map(agent => (
          <div 
            key={agent.id} 
            className={`border rounded-lg p-4 cursor-pointer hover:shadow-md transition ${
              activeAgentId === agent.id ? 'border-green-500 bg-green-50' : 'border-gray-200'
            }`}
            onClick={() => setActiveAgent(agent.id)}
          >
            <div className="flex items-center mb-2">
              <FaRobot className="text-gray-600 mr-2" />
              <h4 className="font-medium">{agent.persona.name}</h4>
            </div>
            <p className="text-sm text-gray-600 mb-2">{agent.persona.role}</p>
            <div className="flex justify-between text-xs text-gray-500">
              <span>Lenguaje: {agent.persona.language}</span>
              <span>{new Date(agent.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        ))}
        
        {agents.length === 0 && (
          <div className="col-span-full text-center p-4 border border-dashed border-gray-300 rounded-lg">
            <p className="text-gray-500">No hay agentes creados</p>
            <button className="mt-2 text-blue-500 hover:underline">
              Crear un agente
            </button>
          </div>
        )}
      </div>
    </div>
  );

  // Componente de reglas
  const RulesPanel = () => (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold">Reglas de Auto-respuesta</h3>
        <button className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600 transition">
          <FaPlus />
        </button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trigger</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Respuesta</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {rules.map(rule => (
              <tr key={rule.id}>
                <td className="px-6 py-4 whitespace-nowrap">{rule.trigger}</td>
                <td className="px-6 py-4">{rule.response}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <button className="text-blue-500 hover:text-blue-700 mr-2">Editar</button>
                  <button className="text-red-500 hover:text-red-700">Eliminar</button>
                </td>
              </tr>
            ))}
            {rules.length === 0 && (
              <tr>
                <td colSpan={3} className="px-6 py-4 text-center text-gray-500">
                  No hay reglas configuradas
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  // Componente de estadísticas (placeholder)
  const StatsPanel = () => (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-xl font-semibold mb-4">Estadísticas</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-blue-500">Total de Chats</p>
          <p className="text-2xl font-bold">{conversations.length}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <p className="text-sm text-green-500">Mensajes Enviados</p>
          <p className="text-2xl font-bold">0</p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <p className="text-sm text-purple-500">Mensajes Recibidos</p>
          <p className="text-2xl font-bold">0</p>
        </div>
      </div>
      
      <div className="bg-gray-100 p-4 rounded-lg flex items-center justify-center h-64">
        <p className="text-gray-500">Aquí irán los gráficos de actividad</p>
      </div>
    </div>
  );

  // <<< ADDED: Functions for managing name editing >>>
  const handleEditNameClick = () => {
    if (!selectedChat) return;
    setEditingNameValue(selectedChat.contactDisplayName || selectedChat.name || '');
    setIsEditingName(true);
  };

  const handleNameInputChange = (event) => {
    setEditingNameValue(event.target.value);
  };

  const handleCancelEditName = () => {
    setIsEditingName(false);
    setEditingNameValue(''); // Clear the temp value
  };

  const handleSaveName = async () => {
    if (!selectedChat || !selectedChat.id) return;
    const trimmedName = editingNameValue.trim();
    
    // Optimistic UI Update & Local State
    const originalName = selectedChat.contactDisplayName;
    const updatedChat = { ...selectedChat, contactDisplayName: trimmedName };
    setSelectedChat(updatedChat);
    setConversations(prevConvos => 
        prevConvos.map(convo => 
            convo.id === selectedChat.id ? updatedChat : convo
        )
    );
    setIsEditingName(false); // Exit edit mode immediately

    try {
      const endpoint = `/users/${user.uid}/chats/${selectedChat.id}/contact-name`;
      const response = await apiCall(endpoint, 'PUT', { name: trimmedName });

      if (!response.success) {
        // Revert optimistic update on failure
        console.error("Failed to save contact name:", response.message);
        setErrorMessage(`Error al guardar nombre: ${response.message}`);
        const revertedChat = { ...selectedChat, contactDisplayName: originalName }; // Use original name
        setSelectedChat(revertedChat);
        setConversations(prevConvos => 
            prevConvos.map(convo => 
                convo.id === selectedChat.id ? revertedChat : convo
            )
        );
      } else {
        console.log("Contact name saved successfully.");
        // Optionally clear error message on success
        // setErrorMessage(null);
      }
    } catch (error) {
      console.error("Error saving contact name:", error);
      setErrorMessage(`Error al guardar nombre: ${error.message}`);
      // Revert optimistic update on catch
      const revertedChatOnError = { ...selectedChat, contactDisplayName: originalName };
      setSelectedChat(revertedChatOnError);
      setConversations(prevConvos => 
          prevConvos.map(convo => 
              convo.id === selectedChat.id ? revertedChatOnError : convo
          )
      );
    }
  };

  // Render the ChatInterface and pass down necessary props
  return (
    <div className="h-full flex flex-col bg-slate-50 text-slate-900 font-['Poppins'] rounded-3xl">
      <div className="p-4 border-b border-slate-200 bg-white shadow-sm rounded-t-3xl">
        <h2 className="text-2xl font-bold flex items-center text-slate-800">
          <FaWhatsapp className="text-green-500 mr-3" />
          Bandeja de Entrada WhatsApp
        </h2>
      </div>
      
      {/* Mostrar mensaje de error si existe */}
      {errorMessage && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mx-4 mt-4 relative shadow">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{errorMessage}</span>
          <button 
            className="absolute top-0 bottom-0 right-0 px-4 py-3"
            onClick={() => setErrorMessage(null)}
          >
            <span className="text-red-500 text-xl font-bold hover:text-red-700">&times;</span>
          </button>
        </div>
      )}
      
      {/* Panel de información de conexión */}
      <div className="bg-blue-50 border-l-4 border-blue-400 text-blue-800 p-3 mx-4 mt-4 rounded-r-md shadow-sm text-sm">
        <p className="flex items-center">
          <FaWhatsapp className="inline mr-2 flex-shrink-0" /> 
          <span className="mr-1 font-medium">Estado:</span>
          {connectionStatus === 'connected' ? 'Conectado y Activo' : connectionStatus === 'connecting' ? 'Conectando...' : connectionStatus === 'reconnecting' ? 'Reconectando...' : connectionStatus === 'generating_qr' ? 'Generando QR...' : 'Desconectado'}
          {connectionStatus !== 'connected' && <span className="ml-2 text-xs">(Funcionalidad de envío/recepción limitada)</span>}
        </p>
      </div>
      
      {/* Contenedor principal para la interfaz de chat */}
      <div className="flex-1 p-4 overflow-hidden">
        {/* Envolver ChatInterface para que tome el espacio restante y maneje su propio overflow */}
        <div className="h-full w-full overflow-hidden">
          {/* Renderizar ChatInterface directamente.
              Se espera que ChatInterface maneje su propia altura interna con h-full 
              y que sus componentes internos (lista de chats, panel de mensajes) sean scrollables.
          */}
           {/* Pass required state and functions as props */}
          <ChatInterface 
            conversations={conversations}
            selectedChat={selectedChat}
            selectChat={selectChat}
            messages={messages}
            newMessage={newMessage}
            setNewMessage={setNewMessage}
            sendMessage={sendMessage}
            openAssignToKanbanModal={openAssignToKanbanModal}
            formatPhoneNumber={formatPhoneNumber}
            connectionStatus={connectionStatus}
            wsRef={wsRef} // Pass the WebSocket ref
            isEditingName={isEditingName}
            editingNameValue={editingNameValue}
            handleEditNameClick={handleEditNameClick}
            handleNameInputChange={handleNameInputChange}
            handleSaveName={handleSaveName}
            handleCancelEditName={handleCancelEditName}
          />
        </div>
      </div>

      {/* Modal para asignar Chat a Kanban */}
      {assignModalState.isOpen && assignModalState.chat && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 backdrop-blur-sm">
        <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4 relative">
          <button 
                onClick={closeAssignModal} 
                className="absolute top-2 right-2 text-slate-400 hover:text-slate-600"
          >
                <FaTimes size={20}/>
          </button>
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Asignar Chat a Kanban</h3>
            
            {/* <<< ADDED: Contact Name Input >>> */}
            <div className="mb-4">
                <label htmlFor="contactNameInput" className="block text-sm font-medium text-slate-700 mb-1">Nombre del Contacto</label>
                <input
                    type="text"
                    id="contactNameInput"
                    value={assignModalState.currentContactName} // Use state for controlled input
                    onChange={(e) => setAssignModalState(prev => ({ ...prev, currentContactName: e.target.value }))}
                    placeholder="Ej: Juan Pérez (Opcional)"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 text-sm"
                />
      </div>

            <div className="mb-4">
            <label htmlFor="kanbanBoardSelect" className="block text-sm font-medium text-slate-700 mb-1">Seleccionar Tablero</label>
                <select
                id="kanbanBoardSelect"
                  value={assignModalState.selectedBoardId}
                  onChange={(e) => handleBoardSelectedInModal(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 text-sm bg-white"
                >
                <option value="">-- Selecciona un tablero --</option>
                  {assignModalState.boards.map(board => (
                    <option key={board.id} value={board.id}>{board.name}</option>
                  ))}
                </select>
            </div>

            {assignModalState.columns.length > 0 && (
              <div className="mb-6">
                <label htmlFor="kanbanColumnSelect" className="block text-sm font-medium text-slate-700 mb-1">Seleccionar Columna</label>
                  <select
                    id="kanbanColumnSelect"
                    value={assignModalState.selectedColumnId}
                    onChange={(e) => setAssignModalState(prev => ({ ...prev, selectedColumnId: e.target.value }))}
                    disabled={!assignModalState.selectedBoardId} // Disable if no board selected
                    className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 text-sm bg-white disabled:bg-slate-50"
                  >
                <option value="">-- Mover a esta columna --</option>
                    {assignModalState.columns.map(column => (
                      <option key={column.id} value={column.id}>{column.name}</option>
                    ))}
                  </select>
            </div>
                )}

            {assignModalState.isLoading && (
                <div className="flex justify-center items-center mb-4">
                    <FaSpinner className="animate-spin mr-2 text-purple-500" />
                    <span>Cargando...</span>
              </div>
            )}
            {assignModalState.errorMessage && (
                <p className="text-red-600 text-sm mb-4">Error: {assignModalState.errorMessage}</p>
            )}
             {assignModalState.successMessage && (
                <p className="text-green-600 text-sm mb-4">{assignModalState.successMessage}</p>
            )}

            <div className="flex justify-end space-x-3">
              <button
                onClick={closeAssignModal}
                className="px-4 py-2 bg-slate-200 text-slate-700 rounded-md hover:bg-slate-300 transition text-sm font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleAssignConfirm}
                disabled={!assignModalState.selectedBoardId || !assignModalState.selectedColumnId || assignModalState.isLoading}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {assignModalState.isLoading ? 'Asignando...' : 'Confirmar Asignación'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WhatsAppCRM; 