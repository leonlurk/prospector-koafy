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
    
    // Asegurar que los campos necesarios existen
    const campaignDataToSave = {
      ...campaignData,
      createdAt: new Date(),
      lastUpdated: new Date(),
      status: "processing", 
      progress: 0,
      totalProcessed: 0
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
  if (!campaign || !campaign.id || !campaign.campaignType) { 
    console.error("activateCampaign: Datos de campaña inválidos (check id, campaignType).", campaign);
    return false;
  }
  console.log(`Activando campaña ${campaign.id} (${campaign.campaignType})`);

  try {
    // 1. Marcar como 'processing'
    await updateDoc(doc(db, "users", userId, "campaigns", campaign.id), { 
      status: 'processing', 
      lastUpdated: new Date()
      // Podríamos añadir un campo 'startedAt': new Date() si es útil
    });
    console.log(`Campaña ${campaign.id} marcada como 'processing'.`);

    // 2. Ejecutar la acción de la API
    let apiResponse = null;
    const usersToProcess = campaign.targetUsers || [];
    if (usersToProcess.length === 0 && campaign.campaignType !== 'some_task_without_users') { // Añadir excepciones si aplica
       throw new Error("No users found in target list during activation.");
    }

    // Loggear inicio de la acción
     await logApiRequest({
        endpoint: `/activate_campaign/${campaign.campaignType}`,
        requestData: { campaignId: campaign.id, userCount: usersToProcess.length },
        userId: userId, status: 'pending', source: 'activateCampaign',
        metadata: { action: `start_${campaign.campaignType}`, campaignId: campaign.id }
    });

    switch (campaign.campaignType) {
      case 'send_messages':
        // Refined check for message content
        const messageContent = campaign.message || campaign.messageTemplate; // Prefer message if it exists
        console.log(`[activateCampaign] Trying to send message. Content found:`, !!messageContent, `(Value: ${messageContent ? messageContent.substring(0,30)+'...' : 'N/A'})`);
        
        if (!messageContent) { 
          console.error("[activateCampaign] Message content is definitively missing:", campaign);
          throw new Error("Contenido del mensaje (message o messageTemplate) no encontrado para activar campaña.");
        }

        // *** THE API CALL ITSELF ***
        console.log(`---> Calling instagramApi.sendMessages with ${usersToProcess.length} users for campaign ${campaign.id}. Token provided: ${!!instagramToken}`);
        try {
            apiResponse = await instagramApi.sendMessages(usersToProcess, messageContent, false, instagramToken);
            console.log(`---> instagramApi.sendMessages response for ${campaign.id}:`, apiResponse); 
        } catch (apiError) {
             console.error(`---> Error DIRECTLY from instagramApi.sendMessages for ${campaign.id}:`, apiError);
             throw apiError; // Re-throw the specific API error
        }
        break;
      case 'follow_users':
        apiResponse = await instagramApi.followUsers(usersToProcess, instagramToken);
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
        throw new Error(`Tipo de tarea desconocido al activar: ${campaign.campaignType}`);
    }
    
    console.log(`API para campaña ${campaign.id} ejecutada tras activación, respuesta:`, apiResponse?.status);
    
    // Actualizar con respuesta inicial (si aplica)
    await updateDoc(doc(db, "users", userId, "campaigns", campaign.id), { 
       initialResponse: apiResponse,
       lastUpdated: new Date()
    });

     // Loggear éxito
     await logApiRequest({
        endpoint: `/activate_campaign/${campaign.campaignType}`,
        requestData: { campaignId: campaign.id }, userId: userId, responseData: apiResponse, 
        status: apiResponse?.status === 'success' ? 'success' : 'completed', source: 'activateCampaign',
        metadata: { action: `activated_${campaign.campaignType}`, campaignId: campaign.id, apiStatus: apiResponse?.status }
    });

    return true;

  } catch (error) {
    console.error(`Error al activar campaña ${campaign.id}:`, error);
    // Marcar como fallida si la activación falló
    try {
      await updateDoc(doc(db, "users", userId, "campaigns", campaign.id), { 
        status: 'failed', 
        error: `Error on activation: ${error.message}`,
        endedAt: new Date(),
        lastUpdated: new Date()
      });
      await logApiRequest({ // Loggear el fallo
          endpoint: `/activate_campaign/${campaign.campaignType}`,
          requestData: { campaignId: campaign.id }, userId: userId, status: 'error',
          source: 'activateCampaign', 
          metadata: { action: `failed_activation_${campaign.campaignType}`, campaignId: campaign.id, error: error.message }
      });
    } catch (updateError) {
      console.error(`Error al marcar campaña ${campaign.id} como fallida tras error de activación:`, updateError);
    }
    return false;
  }
};

/**
 * Revisa si hay campañas programadas y activa la siguiente si no hay ninguna activa.
 * @param {string} userId 
 * @param {string} instagramToken 
 * @returns {Promise<boolean>} - true si una campaña fue activada, false en caso contrario.
 */
export const checkAndActivateNextScheduled = async (userId, instagramToken) => {
  console.log("checkAndActivateNextScheduled: Verificando...");
  if (!userId || !instagramToken) {
    console.log("checkAndActivateNextScheduled: Falta userId o instagramToken.");
    return false;
  }

  // 1. ¿Hay alguna campaña ya activa?
  const currentActive = await getLatestProcessingCampaign(userId);
  if (currentActive) {
    console.log(`checkAndActivateNextScheduled: Ya hay una campaña activa (${currentActive.id}). No se activa nada.`);
    return false; // Ya hay una activa, no hacemos nada
  }

  // 2. No hay activa, ¿hay alguna programada?
  const nextCampaign = await getOldestScheduledCampaign(userId);
  if (!nextCampaign) {
    console.log("checkAndActivateNextScheduled: No hay campañas programadas esperando.");
    return false; // No hay ninguna esperando
  }

  // 3. ¡Sí hay! Activarla.
  console.log(`checkAndActivateNextScheduled: Activando la campaña programada ${nextCampaign.id}`);
  const activated = await activateCampaign(userId, nextCampaign, instagramToken);
  return activated;
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