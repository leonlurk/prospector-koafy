import { useState, useEffect, useCallback  } from "react";
import PropTypes from 'prop-types';
import { FaArrowRight, FaTimes } from "react-icons/fa";
import { collection, addDoc, getDocs } from "firebase/firestore";
import { db } from "../firebaseConfig";
import logApiRequest from "../requestLogger";
import { instagramApi } from "../instagramApi"; 
import { checkBlacklistedUsers } from "../blacklistUtils";
import { createCampaignOptions, startCampaignMonitoring } from "../campaignIntegration";
import { 
  createCampaign as createCampaignStore, 
  updateCampaign, 
  ensureUserExists, 
  getLatestProcessingCampaign,
  activateCampaign
} from '../campaignStore';
import WhitelistSelector from './WhitelistSelector';

// Componentes
import UsersList from './UsersList';
import MessagePanel from './MessagePanel';
import MediaPanel from './MediaPanel';
import LikesPanel from './LikesPanel';
import BlacklistModal from './BlacklistModal';
import LoadingOverlay from './LoadingOverlay';

// Helper para formatear fechas
const formatDateTime = (date) => {
  if (!date || !(date instanceof Date)) return "";
  return date.toLocaleString('es-ES', { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit' 
  });
};

const NuevaCampanaModal = ({ isOpen, onClose, user, instagramToken, onCampaignCreated }) => {
  // Estados principales
  const [step, setStep] = useState(1);
  const [campaignName, setCampaignName] = useState("");
  const [targetLink, setTargetLink] = useState("");
  const [targetType, setTargetType] = useState("");
  const [isProspecting, setIsProspecting] = useState(false);
  const [users, setUsers] = useState([]);
  const [mensaje, setMensaje] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [templates, setTemplates] = useState([]);
  const [showWhitelistModal, setShowWhitelistModal] = useState(false);
  const [lastWhitelistOperation, setLastWhitelistOperation] = useState(null);
  
  // Estados para multimedia
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [mediaType, setMediaType] = useState("image");
  const [mediaCaption, setMediaCaption] = useState("");
  
  // Estados para filtrado y procesamiento
  const [showBlacklist, setShowBlacklist] = useState(false);
  const [filteredUsers, setFilteredUsers] = useState(null);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState("");
  
  // Estados para configuración de campaña
  const [selectedObjective, setSelectedObjective] = useState("");
  
  const [filters, setFilters] = useState({
    genero: false
  });
  
  const [tasks, setTasks] = useState({
    seguir: false,
    enviarMensaje: false,
    darLikes: false,
    comentar: false,
    enviarMedia: false
  });

  // --- Add reset function --- 
  const resetModalState = () => {
    setStep(1);
    setCampaignName("");
    setTargetLink("");
    setTargetType("");
    setIsProspecting(false);
    setUsers([]);
    setMensaje("");
    setSelectedTemplate(null);
    setLoading(false);
    setError("");
    // Don't reset templates (fetched once)
    setShowWhitelistModal(false);
    setLastWhitelistOperation(null);
    setMediaFile(null);
    setMediaPreview(null);
    setMediaType("image");
    setMediaCaption("");
    setShowBlacklist(false);
    setFilteredUsers(null);
    setProgress(0);
    setProgressMessage("");
    setSelectedObjective("");
    setFilters({ genero: false });
    setTasks({
      seguir: false,
      enviarMensaje: false,
      darLikes: false,
      comentar: false,
      enviarMedia: false
    });
  };
  
  const fetchTemplates = useCallback(async () => {
    if (!user?.uid) return;
    
    try {
      const templatesRef = collection(db, "users", user.uid, "templates");
      const templatesSnapshot = await getDocs(templatesRef);
      const templatesList = templatesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTemplates(templatesList);
    } catch (error) {
      console.error("Error al cargar plantillas:", error);
    }
  }, [user]);
  const updateProgress = (percentage, message = "") => {
    setProgress(percentage);
    if (message) setProgressMessage(message);
  };
  
  const removeUser = (username) => {
    console.log("Removing user:", username);
    console.log("Users before removal:", users);
    
    // Create a new filtered array excluding the specified username
    const updatedUsers = users.filter(user => user !== username);
    
    console.log("Users after removal:", updatedUsers);
    
    // Update the state with the new filtered array
    setUsers(updatedUsers);
    
    // If we've already done filtering for blacklisted users, update that state too
    if (filteredUsers) {
      const updatedFilteredUsers = {
        ...filteredUsers,
        original: updatedUsers.length,
        // If the removed user was in the filtered list, update it
        filtered: filteredUsers.blacklistedUsers.includes(username) 
          ? filteredUsers.filtered 
          : filteredUsers.filtered - 1,
      };
      setFilteredUsers(updatedFilteredUsers);
    }
  };
  
  const updateFilteredUsersState = (filteredResult) => {
    setFilteredUsers({
      original: users.length,
      filtered: filteredResult.length,
      blacklistedCount: users.length - filteredResult.length,
      blacklistedUsers: users.filter(u => !filteredResult.includes(u))
    });
  };

  const handleTaskError = async (error, campaignId, stopMonitoring, endpoint, action) => {
    updateProgress(100, `Error en la operación: ${error.message}`);
    console.error(`Error al ejecutar ${action}:`, error);
    setError(`Error en la operación: ${error.message}`);
    
    if (campaignId && user?.uid) {
      await updateCampaign(user.uid, campaignId, {
        status: "failed",
        progress: 100,
        error: error.message,
        endedAt: new Date()
      });
      
      if (stopMonitoring) stopMonitoring();
    }
    
    if (user) {
      await logApiRequest({
        endpoint: endpoint,
        requestData: { 
          usuarios_count: users.length,
          campaign_id: campaignId
        },
        userId: user.uid,
        status: "error",
        source: "NuevaCampanaModal",
        metadata: {
          action: action,
          error: error.message,
          usersCount: users.length,
          postLink: targetLink,
          campaignId: campaignId
        }
      });
    }
  };
  
  // Reset del estado cuando se abre/cierra el modal
  useEffect(() => {
    if (isOpen && user?.uid) {
      fetchTemplates();
    } else if (!isOpen) {
       // Reset state when modal is explicitly closed (or isOpen becomes false)
       resetModalState(); 
    }
  }, [isOpen, user, fetchTemplates]); // Removed resetModalState from dependencies to avoid potential loops if it causes re-renders
  
  // Manejadores para obtener usuarios
  const getLikesFromPost = async () => {
    if (!targetLink.trim()) {
      setError("Debes ingresar un enlace a una publicación");
      return false;
    }
    
    setLoading(true);
    setError("");
    
    try {
      console.log("Starting getLikesFromPost with link:", targetLink, "token:", instagramToken?.substring(0, 15) + "...");
      
      if (user) {
        await logApiRequest({
          endpoint: "/obtener_likes",
          requestData: { link: targetLink },
          userId: user.uid,
          status: "pending",
          source: "NuevaCampanaModal",
          metadata: { action: "get_likes", postLink: targetLink }
        });
      }
      
      console.log("Before API call to getLikes");
      const data = await instagramApi.getLikes(targetLink, instagramToken);
      console.log("After API call, received data:", data);
      
      if (user) {
        await logApiRequest({
          endpoint: "/obtener_likes",
          requestData: { link: targetLink },
          userId: user.uid,
          responseData: { 
            status: data.status,
            likesCount: data.likes?.length || 0
          },
          status: data.status === "success" ? "success" : "completed",
          source: "NuevaCampanaModal",
          metadata: {
            action: "get_likes",
            postLink: targetLink,
            usersCount: data.likes?.length || 0
          }
        });
      }
      
      if (data.status === "success") {
        console.log("Success! Setting users with", data.likes?.length, "users");
        console.log("Sample users:", data.likes?.slice(0, 3));
        setUsers(data.likes);
        setTimeout(() => {
          setStep(step + 1);
        }, 150);
        return true;
      } else {
        console.log("Setting error - API returned:", data.status, data.message || "No message");
        setError("Error al obtener likes: " + (data.message || "Error desconocido"));
        return false;
      }
    } catch (error) {
      console.error("Exception in getLikesFromPost:", error);
      console.log("Setting error message:", "Error de conexión o problema de red.");
      setError("Error de conexión o problema de red.");
      
      if (user) {
        await logApiRequest({
          endpoint: "/obtener_likes",
          requestData: { link: targetLink },
          userId: user.uid,
          status: "error",
          source: "NuevaCampanaModal",
          metadata: {
            action: "get_likes",
            error: error.message,
            postLink: targetLink
          }
        });
      }
      return false;
    } finally {
      setLoading(false);
      console.log("getLikesFromPost completed");
    }
  };
  
  const getCommentsFromPost = async () => {
    if (!targetLink.trim()) {
      setError("Debes ingresar un enlace a una publicación");
      return false;
    }
    
    setLoading(true);
    setError("");
    
    try {
      if (user) {
        await logApiRequest({
          endpoint: "/get_comments",
          requestData: { post_url: targetLink },
          userId: user.uid,
          status: "pending",
          source: "NuevaCampanaModal",
          metadata: { action: "get_comments", postLink: targetLink }
        });
      }
      
      const data = await instagramApi.getComments(targetLink, instagramToken);
      
      if (user) {
        await logApiRequest({
          endpoint: "/get_comments",
          requestData: { post_url: targetLink },
          userId: user.uid,
          responseData: { 
            status: data.status,
            commentsCount: data.comments?.length || 0
          },
          status: data.status === "success" ? "success" : "completed",
          source: "NuevaCampanaModal",
          metadata: {
            action: "get_comments",
            postLink: targetLink,
            commentsCount: data.comments?.length || 0
          }
        });
      }
      
      if (data.status === "success" && data.comments) {
        const commentUsers = data.comments.map(comment => comment.user);
        setUsers(commentUsers);
        return true;
      } else {
        setError("Error al obtener comentarios: " + (data.message || "Error desconocido"));
        return false;
      }
    } catch (error) {
      console.error("Error obteniendo comentarios:", error);
      setError("Error de conexión o problema de red");
      
      if (user) {
        await logApiRequest({
          endpoint: "/get_comments",
          requestData: { post_url: targetLink },
          userId: user.uid,
          status: "error",
          source: "NuevaCampanaModal",
          metadata: {
            action: "get_comments",
            error: error.message,
            postLink: targetLink
          }
        });
      }
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  const getFollowersFromProfile = async () => {
    const usernameMatch = targetLink.match(/instagram\.com\/([^/?]+)/);
    if (!usernameMatch || !usernameMatch[1]) {
      setError("No se pudo extraer el nombre de usuario del enlace de perfil");
      return false;
    }
    
    const username = usernameMatch[1];
    setLoading(true);
    setError("");
    
    try {
      if (user) {
        await logApiRequest({
          endpoint: "/get_followers",
          requestData: { username, amount: 50 },
          userId: user.uid,
          status: "pending",
          source: "NuevaCampanaModal",
          metadata: { action: "get_followers", username, amount: 50 }
        });
      }
      
      const data = await instagramApi.getFollowers(username, instagramToken);
      
      if (user) {
        await logApiRequest({
          endpoint: "/get_followers",
          requestData: { username, amount: 50 },
          userId: user.uid,
          responseData: { 
            status: data.status,
            followersCount: data.followers?.length || 0
          },
          status: data.status === "success" ? "success" : "completed",
          source: "NuevaCampanaModal",
          metadata: {
            action: "get_followers",
            username,
            followersCount: data.followers?.length || 0
          }
        });
      }
      
      if (data.status === "success" && data.followers) {
        setUsers(data.followers);
        return true;
      } else {
        setError("Error al obtener seguidores: " + (data.message || "Error desconocido"));
        return false;
      }
    } catch (error) {
      console.error("Error obteniendo seguidores:", error);
      setError("Error de conexión o problema de red");
      
      if (user) {
        await logApiRequest({
          endpoint: "/get_followers",
          requestData: { username, amount: 50 },
          userId: user.uid,
          status: "error",
          source: "NuevaCampanaModal",
          metadata: {
            action: "get_followers",
            error: error.message,
            username
          }
        });
      }
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  // --- Función Auxiliar para Preparar y Programar/Iniciar Campaña (Lógica de Cola Estricta) ---
  const prepareAndScheduleCampaign = async (taskType, taskSpecificData) => {
    if (!user?.uid || !instagramToken) {
      setError("Error: Usuario no autenticado o token de Instagram ausente.");
      return null;
    }

    setLoading(true);
    setError("");
    updateProgress(5, "Creando registro de campaña...");

    let campaignId = null;
    let activated = false;
    let scheduled = false;

    try {
      await ensureUserExists(user.uid);

      // 2. Prepare campaign options payload (without status initially)
      let campaignOptions = createCampaignOptions({
        type: taskType,
        name: campaignName || `Campaña ${formatDateTime(new Date())}`,
        targetLink: targetLink,
        targetType: targetType,
        objective: selectedObjective || taskType,
        users: users,
        messageTemplate: mensaje,
        mediaFile: mediaFile?.name,
        mediaCaption: mediaCaption,
        taskSpecificData: taskSpecificData,
        // status: shouldSchedule ? 'scheduled' : 'processing' // Status will be determined just before saving
      });
      // console.log(`[Prepare Campaign LOG] Initial campaign options created (status pending):`, campaignOptions);

      // 3. Check queue status and finalize options right before saving
      updateProgress(15, "Verificando cola y guardando campaña...");
      console.log("[Prepare Campaign LOG] Checking for active campaign IMMEDIATELY before Firestore save...");
      const activeCampaignCheck = await getLatestProcessingCampaign(user.uid);
      const shouldSchedule = !!activeCampaignCheck;
      const finalStatus = shouldSchedule ? 'scheduled' : 'processing';
      console.log(`[Prepare Campaign LOG] Result of getLatestProcessingCampaign (pre-save):`, JSON.stringify(activeCampaignCheck));
      console.log(`[Prepare Campaign LOG] Calculated shouldSchedule (pre-save): ${shouldSchedule}, Final Status: ${finalStatus}`);

      // Add the final status to the options
      campaignOptions = {
          ...campaignOptions,
          status: finalStatus
      };
      console.log(`[Prepare Campaign LOG] Final campaign options before saving:`, campaignOptions);


      // 4. Guardar campaña en Firestore with the determined status
      campaignId = await createCampaignStore(user.uid, campaignOptions); // Returns ID string

      console.log(`[Prepare Campaign LOG] Value returned by createCampaignStore (campaignId): ${campaignId} (Type: ${typeof campaignId})`);

      if (!campaignId || typeof campaignId !== 'string') {
          console.error(`[Prepare Campaign LOG] Invalid campaignId obtained after creation: ${campaignId}. Aborting.`);
          setError("Error crítico: No se pudo obtener un ID válido para la nueva campaña.");
          setLoading(false);
          return null;
      }
      console.log(`[Prepare Campaign LOG] Campaign document created successfully with ID: ${campaignId}, Status: ${campaignOptions.status}`);

      // --- Activation or Scheduling Logic (use the finalStatus determined above) ---
      let activationAttempted = false; // Track if we try to activate

      if (finalStatus === 'processing') { // Corresponds to !shouldSchedule
        activationAttempted = true;
        console.log(`[Prepare Campaign LOG] Campaign ${campaignId} determined as NOT scheduled (status 'processing'). Attempting IMMEDIATE activation.`);
        const campaignDataForActivation = { id: campaignId, ...campaignOptions };
        console.log(`[Prepare Campaign LOG] Data OBJECT being passed to activateCampaign:`, JSON.stringify(campaignDataForActivation, null, 2));

        activated = await activateCampaign(user.uid, campaignDataForActivation, instagramToken);
        console.log(`[Prepare Campaign LOG] Result of immediate activateCampaign call: ${activated}`);

        if (activated) {
          console.log(`[Prepare Campaign LOG] Immediate activation for ${campaignId} reported success by activateCampaign.`);
          // Monitoring setup (keep as is for now)
          const jwtToken = localStorage.getItem('instagram_bot_token');
          if (!jwtToken) console.warn("[Prepare Campaign] JWT Token missing for monitoring.");
          // Only start monitoring if activation succeeded
          const { stopMonitoring } = startCampaignMonitoring(user.uid, campaignId, { jwtToken: jwtToken, onUpdate: updateProgress /* ... other callbacks */ });
          // setStopMonitoringFunc(() => stopMonitoring); // If needed later
        } else {
          console.error(`[Prepare Campaign LOG] Immediate activation for ${campaignId} FAILED.`);
          setError("Error al activar la campaña inmediatamente. La campaña se creó pero no pudo iniciarse. Revise la consola.");
          // Status remains 'processing' in Firestore, let background check handle potential retry.
        }
      } else { // finalStatus === 'scheduled' (Corresponds to shouldSchedule)
        console.log(`[Prepare Campaign LOG] Campaign ${campaignId} correctly marked as 'scheduled'.`);
        scheduled = true; // Mark as successfully scheduled
      }

      // --- FINAL STEP TRANSITION & CALLBACK (Revised Logic) ---
      // Determine success based on whether it was scheduled OR successfully activated
      const isSuccess = scheduled || (activationAttempted && activated);

      if (isSuccess) {
        // Update progress message based on outcome BEFORE changing step
        let finalStep = 0;
        if (scheduled) {
            updateProgress(100, "Campaña programada con éxito.");
            finalStep = 5; // Go to 'Scheduled' success step
        } else { // Must have been activated successfully
             updateProgress(40, "Campaña activada. Puede cerrar esta ventana."); // Consistent message
             finalStep = 4; // Go to 'Activated' success step
        }

        // ***** MOVE TO CORRECT SUCCESS STEP *****
        setStep(finalStep);
        console.log(`[Prepare Campaign LOG] Moved to success step ${finalStep}. Activated: ${activated}, Scheduled: ${scheduled}`);
        // **************************************

        // Notify parent AFTER UI transition
        if (typeof onCampaignCreated === 'function') {
          onCampaignCreated();
          console.log(`[Prepare Campaign LOG] onCampaignCreated callback executed.`);
        }
      } else {
         // Handle the case where activation was attempted but failed
         console.error("[Prepare Campaign LOG] Activation failed, staying on progress/error step.");
         // Error state should already be set in the 'activated' failure block above
         // Do NOT move to success step (4 or 5)
      }

      setLoading(false); // Ensure loading stops
      return { activated, scheduled };

    } catch (error) {
      console.error("[Prepare Campaign LOG] Error caught in prepareAndScheduleCampaign:", error);
      setError(`Error inesperado: ${error.message}`);
      // Ensure loading stops on error
      setLoading(false); 
      // Consider setting a specific error step if needed, e.g., setStep(errorStepNumber);
      // Don't transition to success step
      return null; // Indicate failure
    }
  };
  // --- END prepareAndScheduleCampaign ---

  // --- Modificar Funciones de Acción (simplificado) --- 

  // Todas las funciones de acción ahora solo llaman a prepareAndScheduleCampaign
  // y manejan la navegación final (ir al paso 4 o 5)

  const handleCampaignAction = async (taskType, taskSpecificData = {}) => {
    console.log(`handleCampaignAction called with taskType: ${taskType}`);
    try {
       // The prepareAndScheduleCampaign function now returns an object { campaignId, activated, scheduled }
       const result = await prepareAndScheduleCampaign(taskType, taskSpecificData);

       // Optional: Check result if needed, though setStep(4) is handled inside prepareAndScheduleCampaign now
       if (result) {
          console.log(`handleCampaignAction: prepareAndScheduleCampaign finished. Result: activated=${result.activated}, scheduled=${result.scheduled}`);
        } else {
          console.error("handleCampaignAction: prepareAndScheduleCampaign returned null, indicating an early error.");
        }

      } catch (error) {
      // This catch block might be redundant if prepareAndScheduleCampaign handles its own errors robustly
         console.error("Error inesperado en handleCampaignAction:", error);
      setError(`Error inesperado: ${error.message}`);
       if(loading) setLoading(false); // Ensure loading is stopped on unexpected error
      }
    // No finally setLoading here, prepareAndScheduleCampaign handles it
  };

  const followAllUsers = () => handleCampaignAction('follow_users', {});
  
  const sendMessages = () => {
    if (!mensaje || !mensaje.trim()) {
      setError("El mensaje no puede estar vacío.");
      return;
    }
    handleCampaignAction('send_messages', { message: mensaje });
  };

  const commentOnLatestPosts = () => {
    if (!mensaje.trim()) {
      setError("Debes escribir un comentario.");
      return;
    }
    handleCampaignAction('comment_posts', { message: mensaje });
  };

  const likeLatestPosts = () => handleCampaignAction('like_posts', {});

  const sendMedia = () => {
    if (!mediaFile) {
      setError("Debes seleccionar un archivo.");
      return;
    }
     // TODO: Añadir lógica de subida a Storage aquí ANTES de llamar a handleCampaignAction
     // y pasar la URL en taskData. O manejar la subida dentro de activateCampaign.
     console.warn("Lógica de subida de archivo para sendMedia aún pendiente.");
    handleCampaignAction('send_media', { mediaCaption: mediaCaption, mediaType: mediaType /*, fileUrl: ... */ });
  };

  // Navegación y manejo de flujo
  const handleNext = async () => {
    setError("");
    
    if (step === 1) {
      if (!campaignName.trim()) {
        setError("Debes ingresar un nombre para la campaña");
        return;
      }
      if (!targetLink.trim()) {
        setError("Debes ingresar un link de perfil o publicación");
        return;
      }
      
      if (!targetLink.includes("instagram.com")) {
        setError("El enlace debe ser de Instagram");
        return;
      }
      
      setTargetType(targetLink.includes("/p/") ? "publicacion" : "perfil");
      setStep(step + 1);
      return;
    }
    
    if (step === 2) {
      if (!selectedObjective) {
        setError("Debes seleccionar un objetivo");
        return;
      }
      
      // Verificar que se haya seleccionado una tarea
      const hasTask = Object.values(tasks).some(val => val);
      if (!hasTask) {
        setError("Debes seleccionar una tarea");
        return;
      }
      
      // Si la tarea es enviar media, verificar el link
      if (tasks.enviarMedia && !targetLink.includes("/p/")) {
        setError("Para enviar media, debes seleccionar una publicación en el paso 1");
        return;
      }
      
      let success = false;
      try {
        setLoading(true);
        
        if (selectedObjective === "likes") {
          success = await getLikesFromPost();
        } else if (selectedObjective === "comentarios") {
          success = await getCommentsFromPost();
        } else if (selectedObjective === "seguidores") {
          success = await getFollowersFromProfile();
        }
        
        if (success && users.length > 0) {
          const uniqueUsers = [...new Set(users)];
          if (uniqueUsers.length < users.length) {
            console.log(`Filtrados ${users.length - uniqueUsers.length} usuarios duplicados`);
            setUsers(uniqueUsers);
          }
          
          setStep(step + 1);
        }
      } catch (error) {
        console.error("Error al obtener usuarios:", error);
        setError("Error al obtener usuarios: " + error.message);
      } finally {
        setLoading(false);
      }
      
      return;
    }
    
    // In handleNext function, modify the step 3 section:
// In handleNext function, step 3 section:
if (step === 3) {
  // Distinguir las validaciones según el tipo de tarea seleccionada
  if ((tasks.enviarMensaje || tasks.comentar) && !tasks.enviarMedia) {
    // Solo validar mensaje si la tarea es enviar mensaje o comentar (y no enviar media)
    if (!mensaje?.trim()) {
      setError("Debes escribir un mensaje para enviar");
      return;
    }
  }

 // Para tareas de media, solo validar el archivo de media
 if (tasks.enviarMedia && !mediaFile) {
  setError("Debes seleccionar un archivo de imagen o video para enviar");
  return;
}

if (users.length === 0) {
  setError("No hay usuarios para realizar acciones. Revisa los pasos anteriores.");
  return;
}
  
  if (users.length > 100) {
    const confirmContinue = window.confirm(`¿Estás seguro de querer procesar ${users.length} usuarios? Esto podría generar limitaciones en tu cuenta de Instagram.`);
    if (!confirmContinue) {
      return;
    }
  }
  
  try {
    // REMOVED: await createCampaign() - We'll let the individual action functions handle campaign creation
    
    // Execute the appropriate action based on selected tasks
    if (tasks.enviarMensaje) {
      await sendMessages();
      return;
    }
    
    if (tasks.enviarMedia && mediaFile) {
      await sendMedia();
      return;
    }
    
    if (tasks.darLikes) {
      await likeLatestPosts();
      return;
    }
    
    if (tasks.comentar) {
      await commentOnLatestPosts();
      return;
    }
  } catch (error) {
    console.error("Error al ejecutar la acción:", error);
    setError("Error al ejecutar la acción: " + error.message);
  }
}
  };
  
  // Render principal
  if (!isOpen) return null;
  
  return (
<div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-2 sm:p-4">
  <div className="bg-white rounded-3xl w-full max-w-6xl max-h-[90vh] overflow-auto">
    {/* Responsive header with adjusted padding */}
    <div className="flex justify-between items-center p-3 sm:p-4 border-b">
      <h2 className="text-lg sm:text-xl font-medium text-black">
        Nueva Campaña - Paso {step} de {step === 5 ? 5 : 4}
      </h2>
      <button
        onClick={() => { resetModalState(); onClose(); }}
        className="text-gray-500 hover:text-gray-700 bg-transparent border-0 p-2 rounded-full hover:bg-gray-100">
        <FaTimes size={16} />
      </button>
    </div>
        
        {/* Contenido dinámico según el paso */}
        <div className="p-3 sm:p-4">
        {/* Mensaje de error */}
        {error && (
          <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
            {error}
          </div>
        )}
          
          {/* Paso 1: Información básica */}
          {step === 1 && (
            <div>
              <div className="mb-4">
                <label className="block text-base sm:text-lg text-black font-semibold mb-1 sm:mb-2">Nombre de la Campaña</label>
                <input 
                  type="text"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  className="w-full bg-white text-black p-2 sm:p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                  placeholder="Ej: Influencers Fitness"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-base sm:text-xl text-black font-semibold mb-1 sm:mb-2">Pega el link del perfil o publicación</label>
                <input 
                  type="text"
                  value={targetLink}
                  onChange={(e) => setTargetLink(e.target.value)}
                  className="w-full p-2 sm:p-3 text-black bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                  placeholder="https://www.instagram.com/..."
                />
              </div>
              
              <div className="mb-4">
              </div>
            </div>
          )}
          {/* Paso 2: Objetivos y tareas */}
          {step === 2 && (
            <div>
              {/* Objetivos */}
            <div className="mb-5 sm:mb-6 w-auto">
              <div className="flex items-center mb-2 sm:mb-3">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-transparent rounded-full flex items-center justify-center mr-2">
                  <img src="/assets/gps.png" alt="Filter" className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-black">Objetivos (elige uno)</h3>
              </div>
              
              <div className="pl-8 sm:pl-10 space-y-1 sm:space-y-2">
                <label className="flex items-center space-x-2 text-black text-sm sm:text-base opacity-50 cursor-not-allowed"> {/* Disabled styling */}
                  <input 
                    type="radio"
                    checked={selectedObjective === "comentarios"}
                    onChange={() => setSelectedObjective("comentarios")}
                    name="objective"
                    className="w-4 h-4 sm:w-5 sm:h-5"
                    disabled // Disable input
                  />
                  <span>Comentarios de la publicación (próximamente)</span>
                </label>
                
                <label className="flex items-center space-x-2 text-black text-sm sm:text-base">
                  <input 
                    type="radio"
                    checked={selectedObjective === "likes"}
                    onChange={() => setSelectedObjective("likes")}
                    name="objective"
                    className="w-4 h-4 sm:w-5 sm:h-5"
                    // Not disabled
                  />
                  <span>Likes de la publicación</span>
                </label>
                
                <label className="flex items-center space-x-2 text-black text-sm sm:text-base opacity-50 cursor-not-allowed"> {/* Disabled styling */}
                  <input 
                    type="radio"
                    checked={selectedObjective === "seguidores"}
                    onChange={() => setSelectedObjective("seguidores")}
                    name="objective"
                    className="w-4 h-4 sm:w-5 sm:h-5"
                    disabled // Disable input
                  />
                  <span>Seguidores del perfil (próximamente)</span>
                </label>
              </div>
            </div>

              
              {/* Tareas */}
                <div className="mb-6">
                  <div className="flex items-center mb-3">
                    <div className="w-8 h-8 bg-transparent rounded-full flex items-center justify-center mr-2">
                      <img src="/assets/flag.png" alt="Flag" className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-black">Tareas (elige una)</h3>
                  </div>
                  
                  <div className="pl-10 space-y-2 text-black">
                    <label className="flex items-center space-x-2 opacity-50 cursor-not-allowed"> {/* Disabled styling */}
                      <input 
                        type="radio"
                        checked={tasks.seguir}
                        onChange={() => setTasks({
                          seguir: true,
                          enviarMensaje: false,
                          darLikes: false,
                          comentar: false,
                          enviarMedia: false
                        })}
                        name="task"
                        className="w-5 h-5"
                        disabled // Disable input
                      />
                      <span>Seguir instagrammers (próximamente)</span>
                    </label>
                    
                    <label className="flex items-center space-x-2">
                      <input 
                        type="radio"
                        checked={tasks.enviarMensaje}
                        onChange={() => setTasks({
                          seguir: false,
                          enviarMensaje: true,
                          darLikes: false,
                          comentar: false,
                          enviarMedia: false
                        })}
                        name="task"
                        className="w-5 h-5"
                         // Not disabled
                      />
                      <span>Enviar Mensaje</span>
                    </label>
                    
                    <label className="flex items-center space-x-2 opacity-50 cursor-not-allowed"> {/* Disabled styling */}
                      <input 
                        type="radio"
                        checked={tasks.darLikes}
                        onChange={() => setTasks({
                          seguir: false,
                          enviarMensaje: false,
                          darLikes: true,
                          comentar: false,
                          enviarMedia: false
                        })}
                        name="task"
                        className="w-5 h-5"
                        disabled // Disable input
                      />
                      <span>Dar likes a las publicaciones (próximamente)</span>
                    </label>
                    
                    <label className="flex items-center space-x-2 opacity-50 cursor-not-allowed"> {/* Disabled styling */}
                      <input 
                        type="radio"
                        checked={tasks.comentar}
                        onChange={() => setTasks({
                          seguir: false,
                          enviarMensaje: false,
                          darLikes: false,
                          comentar: true,
                          enviarMedia: false
                        })}
                        name="task"
                        className="w-5 h-5"
                        disabled // Disable input
                      />
                      <span>Comentar en sus publicaciones (próximamente)</span>
                    </label>
                  </div>
                </div>
            </div>
          )}
          
          {/* Paso 3: Usuarios y acciones - Modifica para que sea como la segunda captura */}
          {step === 3 && (
  <div className="flex flex-col lg:flex-row gap-4">
    {/* Lista de usuarios - Sidebar on desktop, horizontal scrolling list on mobile */}
    <div className="lg:w-1/3 xl:w-1/4 flex-shrink-0">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-3 border-b flex items-center justify-between">
          <h3 className="font-medium text-black">Usuarios ({users.length})</h3>
          <div className="flex gap-2">
            <button
              onClick={() => setShowWhitelistModal(true)}
              className="text-xs rounded-full bg-black text-white hover:bg-white hover:border-black hover:text-black py-1 px-2"
            >
              Whitelist
            </button>
            {filteredUsers?.blacklistedCount > 0 && (
              <button
                onClick={() => setShowBlacklist(true)}
                className="text-xs bg-red-50 hover:bg-red-100 text-red-600 py-1 px-2 rounded"
              >
                {filteredUsers.blacklistedCount} bloqueados
              </button>
            )}
          </div>
        </div>
        
        {/* Auto-height user list that takes available space */}
        <div className="max-h-[30vh] lg:max-h-[50vh] overflow-y-auto">
          {users.length > 0 ? (
            users.map((username, index) => (
              <div key={index} className="flex items-center justify-between p-2 text-black hover:bg-gray-50 border-b">
                <span className="truncate">{username}</span>
                <button
                  onClick={() => removeUser(username)}
                  className="text-gray-400 hover:text-red-500"
                  title="Eliminar usuario de la lista"
                >
                  <FaTimes size={14} />
                </button>
              </div>
            ))
          ) : (
            <div className="p-4 text-center text-gray-500">
              No hay usuarios seleccionados
            </div>
          )}
        </div>
      </div>
    </div>
    
    {/* Action panels - Take remaining space */}
    <div className="lg:w-2/3 xl:w-3/4">
      {/* Panel de mensajes/comentarios */}
      {(tasks.enviarMensaje || tasks.comentar) && (
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
    <h3 className="font-medium mb-3 pb-2 border-b text-black">
      {tasks.enviarMensaje ? "Enviar Mensajes" : "Comentar Publicaciones"}
    </h3>
    
    <div className="space-y-3">
      <textarea
        value={mensaje}
        onChange={(e) => {
          setMensaje(e.target.value);
          console.log("Message updated:", e.target.value); // Debug log
        }}
        className="w-full border rounded-lg p-3 min-h-[100px] focus:ring-2 bg-white text-black focus:ring-blue-500 focus:outline-none"
        placeholder={`Escribe un ${tasks.enviarMensaje ? 'mensaje' : 'comentario'} para enviar a los usuarios...`}
      ></textarea>
      
      <div className="flex flex-wrap gap-2 justify-between">
        <div className="flex gap-2">
        <button 
          onClick={() => alert("Funcionalidad de media en desarrollo")}
          className="p-2 rounded-lg border hover:bg-white hover:text-black"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </button>
        {/* Código original comentado temporalmente
        <input
          id="message-media-input"
          type="file"
          accept="image/*,video/*"
          className="hidden"
          onChange={(event) => {
            setTasks(prev => ({...prev, enviarMedia: true}));
            handleFileSelect(event);
          }}
        />
        */}
          <button
            onClick={() => alert("Funcionalidad de audio en desarrollo")}
            className="p-2 rounded-lg border hover:bg-white hover:text-black"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </button>
          
          <div className="relative">
            <button 
              onClick={() => {
                const dropdown = document.getElementById("templates-dropdown");
                if (dropdown) dropdown.classList.toggle("hidden");
              }}
              className="p-2 rounded-lg border bg-blue-50 text-blue-600 hover:bg-blue-100"
            >
              Elegir plantilla
            </button>
            
            <div id="templates-dropdown" className="hidden absolute left-0 top-full mt-1 text-black w-64 bg-white border rounded-lg shadow-lg z-10">
            <div className="p-2 border-b font-medium">Selecciona una plantilla</div>
            <div className="max-h-40 overflow-y-auto">
              {templates.length > 0 ? (
                templates.map(template => (
                  <div 
                    key={template.id}
                    className="p-2 hover:bg-gray-50 cursor-pointer"
                    onClick={() => {
                      setSelectedTemplate(template);
                      if (template) {
                        const messageText = template.body || template.content || "";
                        setMensaje(messageText);
                        console.log("Template selected:", template.name);
                        console.log("Message set from template:", messageText);
                      }
                      document.getElementById("templates-dropdown").classList.add("hidden");
                    }}
                  >
                    {template.name}
                  </div>
                ))
              ) : (
                <div className="p-2 text-gray-500">No hay plantillas disponibles</div>
              )}
            </div>
          </div>
          </div>
        </div>
        
      </div>
    </div>
  </div>
)}
      
      {/* Panel de medios */}
      {tasks.enviarMedia && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
          <h3 className="font-medium mb-3 pb-2 border-b">
            Enviar Multimedia
          </h3>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="sm:w-1/3">
              {mediaPreview ? (
                <div className="relative rounded-lg overflow-hidden border aspect-square">
                  <img 
                    src={mediaPreview} 
                    alt="Preview" 
                    className="w-full h-full object-cover"
                  />
                  <button 
                    onClick={() => {
                      setMediaFile(null);
                      setMediaPreview(null);
                    }}
                    className="absolute top-2 right-2 bg-black bg-opacity-50 text-white rounded-full p-1"
                  >
                    <FaTimes size={14} />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center border-2 border-dashed h-40 cursor-pointer hover:bg-gray-50 rounded-2xl">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-10 h-10 text-gray-400 mb-2">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span className="text-sm text-gray-500">Seleccionar archivo</span>
                  <input 
                    type="file" 
                    className="hidden"
                    onChange={handleFileSelect}
                    accept="image/*,video/*"
                  />
                </label>
              )}
            </div>
            
            <div className="sm:w-2/3 flex flex-col">
              <textarea
                value={mediaCaption}
                onChange={(e) => setMediaCaption(e.target.value)}
                className="w-full border rounded-lg p-3 mb-3 bg-white text-black focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="Añade un texto opcional para acompañar la imagen..."
              ></textarea>

            </div>
          </div>
        </div>
      )}
      
      {/* Panel de likes */}
      {tasks.darLikes && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
          <h3 className="font-medium mb-3 pb-2 border-b">
            Dar Likes a Publicaciones
          </h3>
          
          <div className="text-gray-600 mb-4">
            Se dará like a la última publicación de cada usuario seleccionado.
          </div>
          
          <button
            onClick={likeLatestPosts}
            disabled={loading}
            className="px-4 py-2 bg-indigo-900 text-white rounded-lg disabled:opacity-50"
          >
            Dar likes a {users.length} usuarios
          </button>
        </div>
      )}
    </div>
  </div>
)}
          
          {/* Paso 4: Confirmación de Éxito (si se inició inmediatamente) */}
        {step === 4 && (
           <div className="text-center py-6 sm:py-10">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <svg className="w-8 h-8 sm:w-10 sm:h-10 text-green-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 13L9 17L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3 className="text-xl sm:text-2xl font-semibold mb-2">¡Campaña Iniciada!</h3>
            <p className="text-gray-600 mb-4 text-sm sm:text-base px-4 sm:px-0">
              Tu campaña &ldquo;{campaignName}&rdquo; ha sido iniciada y está en proceso.
              Puedes seguir su progreso en la sección de Campañas.
            </p>
            <button 
              onClick={() => { resetModalState(); onClose(); }}
              className="bg-blue-600 text-white px-4 sm:px-6 py-1.5 sm:py-2 text-sm sm:text-base rounded-lg hover:bg-blue-700"
            >
              Entendido
            </button>
          </div>
        )}

        {/* Paso 5: Confirmación de Programación (Actualizado) */} 
        {step === 5 && (
          <div className="text-center py-6 sm:py-10">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <svg className="w-8 h-8 sm:w-10 sm:h-10 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl sm:text-2xl font-semibold mb-2">¡Campaña en Cola!</h3>
            <p className="text-gray-600 mb-4 text-sm sm:text-base px-4 sm:px-0">
              Tu campaña &ldquo;{campaignName}&rdquo; ha sido puesta en cola y 
              se iniciará automáticamente cuando la campaña activa actual finalice.
            </p>
            <button 
              onClick={() => { resetModalState(); onClose(); }}
              className="bg-blue-600 text-white px-4 sm:px-6 py-1.5 sm:py-2 text-sm sm:text-base rounded-lg hover:bg-blue-700"
            >
              Entendido
            </button>
          </div>
        )}
        </div>
        
        {/* Footer con botones de navegación */}
        {step < 4 && ( // Ocultar botones en paso 4 y 5
          <div className="p-3 sm:p-4 border-t flex justify-end space-x-2">
            {step > 1 && (
              <button 
                onClick={() => setStep(step - 1)}
                className="px-3 sm:px-6 py-1 sm:py-2 text-sm sm:text-base bg-gray-200 text-black rounded-lg hover:bg-gray-300"
              >
                Atrás
              </button>
            )}
            <button 
              onClick={handleNext}
              className="px-4 sm:px-8 py-1 sm:py-2 text-sm sm:text-base bg-indigo-900 text-white rounded-lg flex items-center justify-center"
              disabled={loading}
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 sm:h-5 sm:w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Procesando...
                </>
              ) : (
                <>
                  Siguiente <FaArrowRight className="ml-1 sm:ml-2" />
                </>
              )}
            </button>
          </div>
        )}
      </div>
      
      {/* Modales y overlays */}
      {showBlacklist && (
        <BlacklistModal 
          blacklistedUsers={filteredUsers?.blacklistedUsers || []}
          onClose={() => setShowBlacklist(false)}
        />
      )}
      
      {loading && (
        <LoadingOverlay 
          progress={progress}
          message={progressMessage}
        />
      )}
      {showWhitelistModal && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-2 sm:p-4">
    <div className="w-full max-w-xs sm:max-w-md max-h-[90vh] overflow-auto bg-white rounded-lg">
      <WhitelistSelector
        user={user}
        db={db}
        users={users}
        onClose={() => setShowWhitelistModal(false)}
        onWhitelistAdded={(whitelist) => {
          // Guardar la información de la operación
          setLastWhitelistOperation({
            whitelist,
            timestamp: new Date()
          });
          
          // Mostrar mensaje apropiado
          const userCount = whitelist.addedUsers?.length || 0;
          const message = whitelist.isNew 
            ? `Lista "${whitelist.name}" creada con ${userCount} usuarios.`
            : `${userCount} usuarios añadidos a la lista "${whitelist.name}"${whitelist.duplicatesSkipped ? ` (${whitelist.duplicatesSkipped} duplicados omitidos)` : ''}.`;
          
          // Mostrar mensaje
          setError(null); // Limpiar errores previos si los hay
          alert(message); // O usar un sistema de notificación más sofisticado
          
          console.log('Users added to whitelist:', whitelist);
          setShowWhitelistModal(false);
        }}
      />
    </div>
  </div>
)}
    </div>
  );
};

NuevaCampanaModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  user: PropTypes.object,
  instagramToken: PropTypes.string,
  onCampaignCreated: PropTypes.func
};

export default NuevaCampanaModal;