import { db } from "./firebaseConfig";
import { collection, addDoc, getDocs, doc, updateDoc, getDoc, setDoc, query, where, orderBy, limit } from "firebase/firestore";
import { instagramApi } from "./instagramApi"; // Necesario para activar
import logApiRequest from "./requestLogger"; // Para logs de activación
import { getInstagramSession } from "./instagramSessionUtils"; // <-- Importar para obtener token

/**
 * Crea una nueva campaña en Firestore
 * @param {string} userId - ID del usuario en Firebase
 * @param {Object} campaignData - Datos de la campaña a guardar
 * @returns {Promise<string>} - ID de la campaña creada
 */
export const createCampaign = async (userId, campaignData) => {
  try {
    // Verificar que userId existe
    if (!userId) {
      console.error("Error: userId no proporcionado");
      throw new Error("userId es obligatorio para crear una campaña");
    }
    
    // Referencia correcta a la subcolección campaigns dentro del documento del usuario
    const campaignsRef = collection(db, "users", userId, "campaigns");
    
    // Prepare campaign data for saving
    const campaignDataToSave = {
      ...campaignData,          // Spread the incoming data first (contains the correct status)
      createdAt: new Date(),
      lastUpdated: new Date(),
      progress: campaignData.progress !== undefined ? campaignData.progress : 0, // Keep existing progress if provided, else 0
      totalProcessed: campaignData.totalProcessed !== undefined ? campaignData.totalProcessed : 0 // Keep existing processed if provided, else 0
    };
    
    // *** Log ANTES de addDoc ***
    console.log("[Store createCampaign] campaignDataToSave before addDoc:", JSON.stringify(campaignDataToSave, null, 2));

    // Crear el documento
    const docRef = await addDoc(campaignsRef, campaignDataToSave);
    
    console.log(`Campaña creada exitosamente: ${docRef.id} para usuario: ${userId}`);
    
    return docRef.id;
  } catch (error) {
    console.error("Error al crear campaña:", error);
    console.error("Detalles adicionales:", {
      userId: userId,
      campaignData: JSON.stringify(campaignData)
    });
    throw error;
  }
};

/**
 * Actualiza el estado de una campaña
 * @param {string} userId - ID del usuario en Firebase
 * @param {string} campaignId - ID de la campaña a actualizar
 * @param {Object} updateData - Datos a actualizar
 * @returns {Promise<void>}
 */

export const ensureUserExists = async (userId) => {
  if (!userId) return false;
  
  try {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      // Crear el documento del usuario si no existe
      await setDoc(userRef, {
        createdAt: new Date(),
        userCreatedManually: true
      });
      console.log("Documento de usuario creado:", userId);
    }
    
    return true;
  } catch (error) {
    console.error("Error al verificar/crear usuario:", error);
    return false;
  }
};

export const updateCampaign = async (userId, campaignId, updateData) => {
  try {
    const campaignRef = doc(db, "users", userId, "campaigns", campaignId);
    
    // Asegurar que lastUpdated siempre se actualice
    await updateDoc(campaignRef, {
      ...updateData,
      lastUpdated: new Date()
    });
  } catch (error) {
    console.error("Error al actualizar campaña:", error);
    throw error;
  }
};

/**
 * Obtiene todas las campañas activas de un usuario
 * @param {string} userId - ID del usuario en Firebase
 * @returns {Promise<Array>} - Lista de campañas activas
 */
export const getActiveCampaigns = async (userId) => {
  try {
    const campaignsRef = collection(db, "users", userId, "campaigns");
    const q = query(
      campaignsRef,
      where("status", "==", "processing"),
      orderBy("createdAt", "desc")
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      lastUpdated: doc.data().lastUpdated?.toDate() || new Date()
    }));
  } catch (error) {
    console.error("Error al obtener campañas activas:", error);
    return [];
  }
};

/**
 * Obtiene las campañas recientes de un usuario (completadas o no)
 * @param {string} userId - ID del usuario en Firebase
 * @param {number} limit - Número máximo de campañas a obtener
 * @returns {Promise<Array>} - Lista de campañas recientes
 */
export const getRecentCampaigns = async (userId, limitCount = 10) => {
  try {
    const campaignsRef = collection(db, "users", userId, "campaigns");
    const q = query(
      campaignsRef,
      orderBy("createdAt", "desc"),
      limit(limitCount)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      lastUpdated: doc.data().lastUpdated?.toDate() || new Date()
    }));
  } catch (error) {
    console.error("Error al obtener campañas recientes:", error);
    return [];
  }
};

/**
 * Obtiene los detalles de una campaña específica
 * @param {string} userId - ID del usuario en Firebase
 * @param {string} campaignId - ID de la campaña
 * @returns {Promise<Object|null>} - Detalles de la campaña o null si no existe
 */
export const getCampaignDetails = async (userId, campaignId) => {
  try {
    const campaignRef = doc(db, "users", userId, "campaigns", campaignId);
    const docSnap = await getDoc(campaignRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        lastUpdated: data.lastUpdated?.toDate() || new Date()
      };
    }
    
    return null;
  } catch (error) {
    console.error("Error al obtener detalles de campaña:", error);
    return null;
  }
};

/**
 * Obtiene la campaña activa (processing) más reciente.
 * @param {string} userId - ID del usuario en Firebase
 * @returns {Promise<Object|null>} - El objeto de la campaña más reciente en procesamiento o null.
 */
export const getLatestProcessingCampaign = async (userId) => {
  try {
    const campaignsRef = collection(db, "users", userId, "campaigns");
    const q = query(
      campaignsRef,
      where("status", "==", "processing"), // Solo buscar activas
      orderBy("createdAt", "desc"), 
      limit(1)
    );
    
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      return null;
    }
    
    const campaignDoc = snapshot.docs[0];
    const data = campaignDoc.data();
    return {
        id: campaignDoc.id,
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : null,
        lastUpdated: data.lastUpdated?.toDate() || new Date()
      };

  } catch (error) {
    console.error("Error al obtener la última campaña en procesamiento:", error);
    return null; 
  }
};

/**
 * Obtiene la campaña programada (scheduled) más antigua.
 * @param {string} userId - ID del usuario en Firebase
 * @returns {Promise<Object|null>} - El objeto de la campaña programada más antigua o null.
 */
export const getOldestScheduledCampaign = async (userId) => {
  try {
    const campaignsRef = collection(db, "users", userId, "campaigns");
    const q = query(
      campaignsRef,
      where("status", "==", "scheduled"),
      orderBy("createdAt", "asc"), // La más antigua primero (FIFO)
      limit(1)
    );

    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      return null;
    }

    const campaignDoc = snapshot.docs[0];
    const data = campaignDoc.data();
    // Devolver el objeto completo con ID y fechas convertidas
    return {
      id: campaignDoc.id,
      ...data,
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : null,
      lastUpdated: data.lastUpdated?.toDate() || new Date(),
      // Incluir otros campos necesarios para activar, como targetUserList, message, etc.
      targetUserList: data.targetUserList || [],
      taskType: data.taskType,
      message: data.message,
      mediaCaption: data.mediaCaption,
      mediaType: data.mediaType,
      // ... otros campos específicos de tareas que se guardaron
    };

  } catch (error) {
    console.error("Error al obtener la campaña programada más antigua:", error);
    return null;
  }
};

/**
 * Activa una campaña específica (cambia status a processing y llama a la API).
 * @param {string} userId - ID del usuario.
 * @param {Object} campaign - El objeto completo de la campaña a activar (obtenido de Firestore).
 * @param {string} instagramToken - Token de Instagram actual.
 * @returns {Promise<boolean>} - true si la activación fue exitosa (API llamada), false si hubo error.
 */
export const activateCampaign = async (userId, campaign, instagramToken) => {
  // --- LOGGING: Function Entry --- 
  console.log(`[activateCampaign ENTRY] Attempting to activate campaign. ID: ${campaign?.id}, Type: ${campaign?.campaignType}`);
  console.log(`[activateCampaign ENTRY] Received Campaign Data:`, JSON.stringify(campaign, null, 2));
  console.log(`[activateCampaign ENTRY] Received Instagram Token Present: ${!!instagramToken}`);
  // --- END LOGGING ---
  
  if (!campaign || !campaign.id || !campaign.campaignType) { 
    console.error("[activateCampaign VALIDATION] Datos de campaña inválidos (check id, campaignType).", campaign);
    return false;
  }
  // console.log(`Activando campaña ${campaign.id} (${campaign.campaignType})`); // Redundant with entry log

  try {
    // --- LOGGING: Status Update --- 
    console.log(`[activateCampaign ${campaign.id}] Attempting to update status to 'processing' in Firestore...`);
    // --- END LOGGING ---
    await updateDoc(doc(db, "users", userId, "campaigns", campaign.id), { 
      status: 'processing', 
      lastUpdated: new Date()
    });
    console.log(`[activateCampaign ${campaign.id}] Status updated to 'processing' successfully.`);

    // 2. Ejecutar la acción de la API
    let apiResponse = null;
    const usersToProcess = campaign.targetUsers || campaign.targetUserList || []; // Use targetUserList as fallback
    console.log(`[activateCampaign ${campaign.id}] usersToProcess length: ${usersToProcess.length}`);
    if (usersToProcess.length === 0 && campaign.campaignType !== 'some_task_without_users') { 
       console.error(`[activateCampaign ${campaign.id}] ERROR: User list (targetUsers/targetUserList) is empty.`);
       throw new Error("No users found in target list during activation.");
    }

    // Loggear inicio de la acción
    console.log(`[activateCampaign ${campaign.id}] Logging API request pending...`);
     await logApiRequest({
        endpoint: `/activate_campaign/${campaign.campaignType}`,
        requestData: { campaignId: campaign.id, userCount: usersToProcess.length },
        userId: userId, status: 'pending', source: 'activateCampaign',
        metadata: { action: `start_${campaign.campaignType}`, campaignId: campaign.id }
    });

    console.log(`[activateCampaign ${campaign.id}] Entering SWITCH statement for campaignType: ${campaign.campaignType}`);
    switch (campaign.campaignType) {
      case 'send_messages':
        console.log(`[activateCampaign ${campaign.id}] Entered 'send_messages' case.`);
        const messageContent = campaign.message || campaign.messageTemplate;
        
        // --- Add Detailed Logging HERE ---
        console.log(`[activateCampaign ${campaign.id}] Preparing 'send_messages'.`);
        console.log(`[activateCampaign ${campaign.id}]   Users Count: ${usersToProcess.length}`);
        console.log(`[activateCampaign ${campaign.id}]   Message Content Present: ${!!messageContent}`);
        console.log(`[activateCampaign ${campaign.id}]   Message Content Snippet: ${messageContent ? messageContent.substring(0, 50) + '...' : 'N/A'}`);
        console.log(`[activateCampaign ${campaign.id}]   Token Present: ${!!instagramToken}`);
        // --- End Logging ---

        if (!messageContent) { 
          console.error(`[activateCampaign ${campaign.id}] ERROR: Message content (message/messageTemplate) is missing:`, campaign);
          throw new Error("Contenido del mensaje no encontrado para activar campaña.");
        }
        // Removed redundant usersToProcess empty check here, handled above

        console.log(`--->>> [activateCampaign ${campaign.id}] EXECUTING instagramApi.sendMessages NOW...`);
        try {
            apiResponse = await instagramApi.sendMessages(usersToProcess, messageContent, false, instagramToken);
            console.log(`--->>> [activateCampaign ${campaign.id}] FINISHED instagramApi.sendMessages.`); 
        } catch (apiError) {
             console.error(`--->>> [activateCampaign ${campaign.id}] CAUGHT ERROR during instagramApi.sendMessages:`, apiError);
             throw apiError; // Re-throw
        }
        break;
      case 'follow_users':
        // Add similar detailed logging if needed for other types
        console.log(`[activateCampaign ${campaign.id}] Preparing 'follow_users'. Users: ${usersToProcess.length}, Token: ${!!instagramToken}`);
        console.log(`--->>> [activateCampaign ${campaign.id}] EXECUTING instagramApi.followUsers NOW...`);
        try {
           apiResponse = await instagramApi.followUsers(usersToProcess, instagramToken);
           console.log(`--->>> [activateCampaign ${campaign.id}] FINISHED instagramApi.followUsers.`);
        } catch (apiError) {
           console.error(`--->>> [activateCampaign ${campaign.id}] CAUGHT ERROR during instagramApi.followUsers:`, apiError);
           throw apiError; 
        } 
        break;
      case 'like_posts':
        console.warn("Activando campaña de likes (backend debería manejar el bucle)");
        apiResponse = { status: 'success', message: 'Like campaign activation simulated' };
        break;
      case 'comment_posts':
         if (!campaign.message && !campaign.messageTemplate) { 
           console.error("Comment content missing in:", campaign);
           throw new Error("Comentario/Plantilla no encontrado para activar campaña.");
         }
         const commentContent = campaign.messageTemplate || campaign.message;
         console.warn("Activando campaña de comentarios (backend debería manejar API/bucle)");
         apiResponse = { status: 'success', message: 'Comment campaign activation simulated' };
        break;
      case 'send_media':
        console.warn("Activación de campaña send_media no implementada (requiere URL de storage).");
        // if (!campaign.mediaFileUrl) throw new Error("URL de media no encontrada");
        // apiResponse = await instagramApi.sendMedia(usersToProcess, campaign.mediaFileUrl, campaign.mediaType, campaign.mediaCaption, false, instagramToken);
        apiResponse = { status: 'success', message: 'Media campaign activation simulated' };
        break;
      default:
        console.error(`[activateCampaign ${campaign.id}] ERROR: Unknown campaignType: ${campaign.campaignType}`);
        throw new Error(`Tipo de tarea desconocido al activar: ${campaign.campaignType}`);
    }
    
    // --- LOGGING: API Response --- 
    console.log(`[activateCampaign ${campaign.id}] API call executed. Response received:`, JSON.stringify(apiResponse));
    // --- END LOGGING ---
    
    // --- LOGGING: Firestore Update (Initial Response) --- 
    console.log(`[activateCampaign ${campaign.id}] Attempting to update Firestore with initialResponse:`, JSON.stringify(apiResponse));
    // --- END LOGGING ---
    try {
       await updateDoc(doc(db, "users", userId, "campaigns", campaign.id), { 
         initialResponse: apiResponse, // Store the raw response
         lastUpdated: new Date()
       });
       console.log(`[activateCampaign ${campaign.id}] Successfully updated Firestore with initialResponse.`);
    } catch (updateError) {
        console.error(`[activateCampaign ${campaign.id}] FAILED to update Firestore with initialResponse:`, updateError);
        // Consider if this failure should mark the campaign as failed immediately
    }

     // Loggear éxito general
     console.log(`[activateCampaign ${campaign.id}] Logging API request success/completed...`);
     await logApiRequest({
        endpoint: `/activate_campaign/${campaign.campaignType}`,
        requestData: { campaignId: campaign.id }, userId: userId, responseData: apiResponse, 
        status: apiResponse?.status === 'success' ? 'success' : 'completed', source: 'activateCampaign',
        metadata: { action: `activated_${campaign.campaignType}`, campaignId: campaign.id, apiStatus: apiResponse?.status }
    });

    console.log(`[activateCampaign ${campaign.id}] Activation process completed successfully.`);
    return true; // Activation succeeded

  } catch (error) {
    // --- LOGGING: Main Catch Block --- 
    console.error(`[activateCampaign ${campaign.id}] CAUGHT ERROR in main try block:`, error);
    console.error(`[activateCampaign ${campaign.id}] Error details:`, error.message, error.stack);
    // --- END LOGGING ---
    
    // Marcar como fallida si la activación falló
    try {
      console.log(`[activateCampaign ${campaign.id}] Attempting to update status to 'failed' due to error...`);
      await updateDoc(doc(db, "users", userId, "campaigns", campaign.id), { 
        status: 'failed', 
        error: `Error on activation: ${error.message}`,
        endedAt: new Date(),
        lastUpdated: new Date()
      });
      console.log(`[activateCampaign ${campaign.id}] Status updated to 'failed'.`);
      // Log the failure
      await logApiRequest({
        endpoint: `/activate_campaign/${campaign.campaignType}`,
        requestData: { campaignId: campaign.id }, userId: userId, status: 'error',
        source: 'activateCampaign', 
        metadata: { action: `failed_activation_${campaign.campaignType}`, campaignId: campaign.id, error: error.message }
    });
    } catch (updateError) {
      console.error(`[activateCampaign ${campaign.id}] FAILED to update status to 'failed' after catching error:`, updateError);
    }
    return false; // Activation failed
  }
};

/**
 * Verifica si hay una campaña programada y, si no hay ninguna activa, la activa.
 * Intenta obtener el token de Instagram desde Firebase.
 * @param {string} userId - ID del usuario.
 * @returns {Promise<Object|null>} - La campaña activada o null.
 */
export const checkAndActivateNextScheduled = async (userId) => {
  // --- LOGGING: Function Entry ---
  console.log(`[checkAndActivateNextScheduled ENTRY] Verifying queue for user: ${userId}`);
  // --- END LOGGING ---

  if (!userId) {
    console.error("[checkAndActivateNextScheduled] ERROR: Missing userId.");
    return null; 
  }

  try {
    // --- LOGGING: Checking for active campaign ---
    console.log("[checkAndActivateNextScheduled] Checking for currently active campaign...");
    // --- END LOGGING ---
    const activeCampaign = await getLatestProcessingCampaign(userId);
    if (activeCampaign) {
      // --- LOGGING: Active campaign found ---
      console.log(`[checkAndActivateNextScheduled] Found active campaign: ${activeCampaign.id}. No action needed.`);
      // --- END LOGGING ---
      return null; // Hay una activa, no hacer nada
    }

    // --- LOGGING: No active campaign, checking for scheduled ---
    console.log("[checkAndActivateNextScheduled] No active campaign found. Checking for oldest scheduled...");
    // --- END LOGGING ---
    const nextCampaign = await getOldestScheduledCampaign(userId);
    if (!nextCampaign) {
      // --- LOGGING: No scheduled campaign found ---
      console.log("[checkAndActivateNextScheduled] No scheduled campaigns found.");
      // --- END LOGGING ---
      return null; // No hay ninguna programada
    }

    // --- LOGGING: Scheduled campaign found, attempting activation ---
    console.log(`[checkAndActivateNextScheduled] Found scheduled campaign: ${nextCampaign.id}. Attempting to activate...`);
    console.log(`[checkAndActivateNextScheduled] Scheduled Campaign Data:`, JSON.stringify(nextCampaign, null, 2));
    // --- END LOGGING ---

    // --- LOGGING: Fetching Instagram Token --- 
    console.log(`[checkAndActivateNextScheduled] Fetching Instagram token for user ${userId}...`);
    const session = await getInstagramSession(userId);
    const instagramToken = session?.token;
    if (!instagramToken) {
        console.error(`[checkAndActivateNextScheduled] ERROR: Could not retrieve Instagram token for user ${userId}. Cannot activate campaign ${nextCampaign.id}.`);
        return null; // Cannot activate without token
    }
    console.log(`[checkAndActivateNextScheduled] Instagram token retrieved successfully.`);
    // --- END LOGGING ---

    // --- LOGGING: Calling activateCampaign --- 
    console.log(`[checkAndActivateNextScheduled] Calling activateCampaign for ${nextCampaign.id}...`);
    // --- END LOGGING ---
    const activated = await activateCampaign(userId, nextCampaign, instagramToken);

    if (activated) {
      // --- LOGGING: Activation Successful --- 
      console.log(`[checkAndActivateNextScheduled] Successfully activated campaign: ${nextCampaign.id}`);
      // --- END LOGGING ---
      return nextCampaign; // Devolver la campaña activada
    } else {
      // --- LOGGING: Activation Failed --- 
      console.error(`[checkAndActivateNextScheduled] Failed to activate campaign ${nextCampaign.id}. activateCampaign returned false.`);
      // --- END LOGGING ---
      // Maybe update status to 'failed' here?
      // await updateCampaign(userId, nextCampaign.id, { status: 'failed', error: 'Activation failed during checkAndActivateNextScheduled' });
      return null;
    }

  } catch (error) {
    // --- LOGGING: General Error --- 
    console.error("[checkAndActivateNextScheduled] General error during execution:", error);
    // --- END LOGGING ---
    return null;
  }
};

/**
 * Obtiene el timestamp de finalización de la última campaña completada o cancelada.
 * @param {string} userId - ID del usuario en Firebase
 * @returns {Promise<Date|null>} - Timestamp de finalización o null si no hay ninguna.
 */
export const getLastCompletedCampaignTimestamp = async (userId) => {
  try {
    const campaignsRef = collection(db, "users", userId, "campaigns");
    const q = query(
      campaignsRef,
      where("status", "in", ["completed", "failed", "cancelled"]), // Consideramos cualquier estado finalizado
      orderBy("endedAt", "desc"), // Asume que existe un campo 'endedAt' al finalizar
      limit(1)
    );
    
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      return null;
    }
    
    const lastCampaign = snapshot.docs[0].data();
    // Asegurarse de que endedAt sea un objeto Date
    return lastCampaign.endedAt?.toDate ? lastCampaign.endedAt.toDate() : null;
  } catch (error) {
    console.error("Error al obtener timestamp de última campaña completada:", error);
    // En caso de error, permitir continuar para no bloquear la creación
    return null;
  }
};

/**
 * Pausa una campaña activa.
 * Llama a la API del backend con el token de AUTENTICACIÓN JWT y luego actualiza Firestore.
 * @param {string} userId - ID del usuario en Firebase
 * @param {string} campaignId - ID de la campaña a pausar
 * @param {string} backendQueueId - El ID de la cola devuelto por el backend (UUID).
 * @param {string} jwtAuthToken - El token de autenticación JWT de la aplicación.
 * @returns {Promise<boolean>} - true si se pausó correctamente
 */
export const pauseCampaign = async (userId, campaignId, backendQueueId, jwtAuthToken) => {
  console.log(`Intentando pausar (Firestore ID: ${campaignId}, Backend Queue ID: ${backendQueueId})`);
  try {
    // 1. Verificar token de autenticación JWT
    // console.log(`pauseCampaign: Received JWT Auth Token - Type: ${typeof jwtAuthToken}, Length: ${jwtAuthToken?.length}`);
    if (!jwtAuthToken) {
      console.error("pauseCampaign: Auth token is missing!");
      throw new Error("Authentication token is required to pause campaign.");
    }

    // 2. Llamar a la API del backend para pausar con el token JWT y el ID de la cola del backend
    await instagramApi.manageOperationQueue('pause', backendQueueId, jwtAuthToken);
    console.log(`API /manage_operation_queue (pause) llamada exitosamente para Backend Queue ID: ${backendQueueId}.`);

    // 3. Si la API no lanzó error, actualizar Firestore usando el campaignId (Firestore ID)
    await updateCampaign(userId, campaignId, {
      status: "paused",
      error: null 
    });
    console.log(`Campaña ${campaignId} marcada como paused en Firestore.`);
    
    // Loggear éxito general
    await logApiRequest({
        endpoint: "/manage_operation_queue", requestData: { action: 'pause', queue_id: backendQueueId }, 
        userId: userId, status: "success", source: "pauseCampaign", 
        metadata: { action: "pause_campaign", campaignId, backendQueueId }
      });

    return true;

  } catch (error) {
    console.error(`Error al pausar campaña ${campaignId}:`, error);
    // Loggear el error
    await logApiRequest({
        endpoint: "/manage_operation_queue", requestData: { action: 'pause', queue_id: backendQueueId }, 
        userId: userId, status: "error", source: "pauseCampaign", 
        metadata: { action: "pause_campaign_error", campaignId, backendQueueId, error: error.message }
      });
    return false;
  }
};

/**
 * Reanuda una campaña pausada.
 * Llama a la API del backend con el token de AUTENTICACIÓN JWT y luego actualiza Firestore.
 * @param {string} userId - ID del usuario en Firebase
 * @param {string} campaignId - ID de la campaña a reanudar
 * @param {string} backendQueueId - El ID de la cola devuelto por el backend (UUID).
 * @param {string} jwtAuthToken - El token de autenticación JWT de la aplicación.
 * @returns {Promise<boolean>} - true si se reanudó o encoló correctamente
 */
export const resumeCampaign = async (userId, campaignId, backendQueueId, jwtAuthToken) => {
  console.log(`Intentando reanudar (Firestore ID: ${campaignId}, Backend Queue ID: ${backendQueueId})`);
  try {
    // 1. Verificar token de autenticación JWT
    // console.log(`resumeCampaign: Received JWT Auth Token - Type: ${typeof jwtAuthToken}, Length: ${jwtAuthToken?.length}`);
     if (!jwtAuthToken) {
      console.error("resumeCampaign: Auth token is missing!");
      throw new Error("Authentication token is required to resume campaign.");
    }

    // 2. Verificar si hay otra campaña activa AHORA MISMO (lógica del frontend)
    const currentActive = await getLatestProcessingCampaign(userId);
    let targetStatus = 'processing'; 
    if (currentActive && currentActive.id !== campaignId) {
        targetStatus = 'scheduled';
    } else if (currentActive && currentActive.id === campaignId) {
        targetStatus = 'scheduled';
    }

    // 3. Llamar a la API del backend para reanudar con el token JWT y el ID de la cola del backend
    await instagramApi.manageOperationQueue('resume', backendQueueId, jwtAuthToken);
    console.log(`API /manage_operation_queue (resume) llamada exitosamente para Backend Queue ID: ${backendQueueId}.`);

    // 4. Si la API no lanzó error, actualizar Firestore usando el campaignId (Firestore ID)
    await updateCampaign(userId, campaignId, {
      status: targetStatus,
      error: null 
    });
    console.log(`Campaña ${campaignId} actualizada a estado: ${targetStatus} en Firestore.`);

    // Loggear éxito general
    await logApiRequest({
        endpoint: "/manage_operation_queue", requestData: { action: 'resume', queue_id: backendQueueId }, 
        userId: userId, status: "success", source: "resumeCampaign", 
        metadata: { action: "resume_campaign", campaignId, backendQueueId, final_status: targetStatus }
      });

    return true;

  } catch (error) {
    console.error(`Error al reanudar campaña ${campaignId}:`, error);
    // Loggear el error
    await logApiRequest({
        endpoint: "/manage_operation_queue", requestData: { action: 'resume', queue_id: backendQueueId }, 
        userId: userId, status: "error", source: "resumeCampaign", 
        metadata: { action: "resume_campaign_error", campaignId, backendQueueId, error: error.message }
      });
    return false;
  }
};

/**
 * Cancela una campaña.
 * Llama a la API del backend con el token de AUTENTICACIÓN JWT y luego actualiza Firestore.
 * @param {string} userId - ID del usuario en Firebase
 * @param {string} campaignId - ID de la campaña a cancelar
 * @param {string} backendQueueId - El ID de la cola devuelto por el backend (UUID).
 * @param {string} jwtAuthToken - El token de autenticación JWT de la aplicación.
 * @returns {Promise<boolean>} - true si se canceló correctamente
 */
export const cancelCampaign = async (userId, campaignId, backendQueueId, jwtAuthToken) => {
  console.log(`Intentando cancelar (Firestore ID: ${campaignId}, Backend Queue ID: ${backendQueueId})`);
  try {
    // 1. Verificar token de autenticación JWT
    // console.log(`cancelCampaign: Received JWT Auth Token - Type: ${typeof jwtAuthToken}, Length: ${jwtAuthToken?.length}`);
    if (!jwtAuthToken) {
       console.error("cancelCampaign: Auth token is missing!");
      throw new Error("Authentication token is required to cancel campaign.");
    }
    
    // --- Obtener token de sesión de Instagram SOLO si es necesario para activar la siguiente ---
    let instagramSessionToken = null; 
    try {
        const session = await getInstagramSession(userId);
        instagramSessionToken = session?.token;
        // console.log(`cancelCampaign: Retrieved Instagram Session Token for potential next activation - Type: ${typeof instagramSessionToken}, Length: ${instagramSessionToken?.length}`);
    } catch (sessionError) {
        console.warn(`cancelCampaign: Could not get Instagram session token for next activation, continuing cancellation. Error: ${sessionError.message}`);
        // No lanzar error aquí, la cancelación debe continuar
    }
    // --- Fin obtención token IG ---


    // 2. Llamar a la API del backend para cancelar con el token JWT y el ID de la cola del backend
    await instagramApi.manageOperationQueue('cancel', backendQueueId, jwtAuthToken);
    console.log(`API /manage_operation_queue (cancel) llamada exitosamente para Backend Queue ID: ${backendQueueId}.`);

    // 3. Si la API no lanzó error, actualizar Firestore usando el campaignId (Firestore ID)
    await updateCampaign(userId, campaignId, {
      status: "cancelled",
      endedAt: new Date(),
      error: null 
    });
    console.log(`Campaña ${campaignId} marcada como cancelled en Firestore.`);
    
    // Loggear éxito general
    await logApiRequest({
        endpoint: "/manage_operation_queue", requestData: { action: 'cancel', queue_id: backendQueueId }, 
        userId: userId, status: "success", source: "cancelCampaign", 
        metadata: { action: "cancel_campaign", campaignId, backendQueueId }
      });

    // 4. Intentar activar la siguiente (SOLO si obtuvimos el token de sesión IG)
    if (instagramSessionToken) {
        console.log(`Verificando si hay otra campaña en cola después de cancelar ${campaignId}...`);
        await checkAndActivateNextScheduled(userId, instagramSessionToken); 
    } else {
        console.log("Skipping next activation check as Instagram session token was not available.");
    }
       
    return true;

  } catch (error) {
    console.error(`Error al cancelar campaña ${campaignId}:`, error);
    // Loggear el error
    await logApiRequest({
        endpoint: "/manage_operation_queue", requestData: { action: 'cancel', queue_id: backendQueueId }, 
        userId: userId, status: "error", source: "cancelCampaign", 
        metadata: { action: "cancel_campaign_error", campaignId, backendQueueId, error: error.message }
      });
    return false;
  }
};