import { updateCampaign, getCampaignDetails, getActiveCampaigns } from "./campaignStore";

// URL base de la API (ajusta según tu configuración)
const API_BASE_URL = "https://alets.com.ar";

/**
 * Crea un objeto de opciones de campaña para un tipo específico
 * @param {Object} options - Opciones basadas en el tipo de campaña
 * @returns {Object} - Datos de la campaña para guardarse
 */
export const createCampaignOptions = (options = {}) => {
  const {
    type,
    name,
    users = [],
    endpoint,
    mediaType,
    fileName,
    postLink,
    processingRate, // Nueva opción para tasa personalizada
    messageTemplate // Use this for the actual message content passed from modal
  } = options;

  // Determinar tasa de procesamiento y ENDPOINT según el tipo de campaña
  let ratePerHour;
  let apiEndpoint; // Variable para guardar el endpoint

  switch (type) {
    case "send_messages":
      ratePerHour = 3;
      apiEndpoint = "/enviar_mensajes_multiple"; // Endpoint para enviar mensajes
      break;
    case "send_media":
      ratePerHour = 3;
      // Definir el endpoint para enviar media si es diferente
      apiEndpoint = "/send_media_endpoint"; // <-- ¡¡AJUSTA ESTE ENDPOINT!!
      break;
    case "follow_users":
      ratePerHour = 10;
      apiEndpoint = "/seguir_usuarios"; // Endpoint para seguir usuarios
      break;
    case "like_posts":
      ratePerHour = 15; // Ejemplo
      apiEndpoint = "/like_posts_endpoint"; // <-- ¡¡AJUSTA ESTE ENDPOINT!!
      break;
    case "comment_posts":
      ratePerHour = 5; // Ejemplo
      apiEndpoint = "/comment_posts_endpoint"; // <-- ¡¡AJUSTA ESTE ENDPOINT!!
      break;
    default:
      ratePerHour = 3;
      apiEndpoint = "/default_endpoint"; // Endpoint por defecto o lanzar error
      console.warn(`Tipo de campaña desconocido '${type}' al determinar endpoint. Usando default.`);
  }
  
  // Usar tasa personalizada si se proporciona
  if (processingRate && typeof processingRate === 'number' && processingRate > 0) {
    ratePerHour = processingRate;
  }
  
  // Calcular tiempo estimado total en horas
  const estimatedHours = Math.ceil(users.length / ratePerHour);
  
  // Datos base de campaña
  const campaignData = {
    name: name || `${type} - ${new Date().toLocaleString()}`,
    campaignType: type,
    targetUsers: users,
    targetCount: users.length,
    originalTargetCount: users.length, // Añadido para seguimiento de filtrados
    endpoint: apiEndpoint,
    createdAt: new Date(),
    status: "processing",
    progress: 0,
    totalProcessed: 0,
    processingRatePerHour: ratePerHour,
    estimatedCompletionHours: estimatedHours,
    estimatedCompletionTime: new Date(Date.now() + (estimatedHours * 60 * 60 * 1000)),
  };

  // Añadir datos específicos según el tipo
  switch (type) {
    case "send_messages":
      return {
        ...campaignData,
        name: name || `Envío de mensajes (${users.length} usuarios)`,
        postLink: postLink || null,
        message: messageTemplate || null
      };

      case "send_media":
        return {
          ...campaignData,
          name: name || `Envío de ${mediaType || "media"} (${users.length} usuarios)`,
          mediaType,
          fileName,
          postLink: postLink || null, // <--- con esto evitas que sea undefined
        };

    case "follow_users":
      return {
        ...campaignData,
        name: name || `Seguimiento de usuarios (${users.length} usuarios)`,
        postLink,
      };

    default:
      return campaignData;
  }
};

/**
 * Inicia el monitoreo de una campaña con verificaciones periódicas de estado
 * @param {string} userId - ID del usuario
 * @param {string} campaignId - ID de la campaña
 * @param {Object} options - Opciones adicionales
 * @returns {Function} - Función para detener el monitoreo
 */
export const startCampaignMonitoring = (userId, campaignId, options = {}) => {
  const { 
    token,
    jwtToken,
    initialDelay = 5000, // Esperar 5 segundos antes del primer check
    checkInterval = 60000, // Verificar cada 60 segundos (aumentado para evitar demasiadas solicitudes)
    maxChecks = 200, // Aumentado significativamente para campañas largas (hasta ~3 horas)
  } = options;

  let checkCount = 0;
  let intervalId = null;

  // Primera verificación después de initialDelay
  const initialTimeoutId = setTimeout(() => {
    checkCampaignStatus(userId, campaignId, token, jwtToken)
      .then(shouldContinue => {
        if (shouldContinue) {
          // Iniciar verificaciones periódicas
          intervalId = setInterval(async () => {
            checkCount++;
            
            // Verificar si se alcanzó el máximo de verificaciones
            if (checkCount >= maxChecks) {
              clearInterval(intervalId);
              
              // Actualizar la campaña como incompleta o sin confirmación
              try {
                await updateCampaign(userId, campaignId, {
                  status: "unknown",
                  progress: 95, // No podemos confirmar 100%
                  message: "No se pudo confirmar la finalización del proceso"
                });
              } catch (error) {
                console.error("Error al actualizar campaña tras máximos intentos:", error);
              }
              
              return;
            }
            
            // Verificar estado
            const shouldContinue = await checkCampaignStatus(userId, campaignId, token, jwtToken);
            if (!shouldContinue && intervalId) {
              clearInterval(intervalId);
            }
          }, checkInterval);
        }
      })
      .catch(error => {
        console.error("Error en la verificación inicial de campaña:", error);
      });
  }, initialDelay);

  // Devolver función para detener el monitoreo
  return () => {
    clearTimeout(initialTimeoutId);
    if (intervalId) clearInterval(intervalId);
  };
};

/**
 * Verifica el estado actual de una campaña usando la API
 * @param {string} userId - ID del usuario
 * @param {string} campaignId - ID de la campaña
 * @param {string} token - Token de sesión de Instagram (puede ser obsoleto si no se usa)
 * @param {string} jwtToken - Token de autenticación JWT de la aplicación
 * @returns {Promise<boolean>} - true si se debe seguir verificando, false si ya terminó
 */
async function checkCampaignStatus(userId, campaignId, token, jwtToken) {
  try {
    // Obtener la campaña actual para conocer sus detalles
    const campaign = await getCampaignDetails(userId, campaignId);
    if (!campaign) {
      console.error("No se pudo encontrar la campaña:", campaignId);
      return true; // Seguir monitoreando hasta que podamos obtener más información
    }

    // Verificar el estado actual de la API - ** USAR JWT TOKEN **
    if (!jwtToken) {
        console.error("checkCampaignStatus: JWT token is missing. Cannot check usage stats.");
        // Decide how to handle this - maybe keep monitoring assuming it might become available?
        return true; // Continue monitoring for now
    }
    
    const response = await fetch(`${API_BASE_URL}/usage_stats`, {
      method: "GET",
      headers: {
        // Use Authorization header with Bearer scheme for JWT
        'Authorization': `Bearer ${jwtToken}` 
        // 'token': token // Remove the old Instagram token header
      }
    });

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    const data = await response.json();
    const blockStatus = data.block_status || null;
    
    // Si hay bloqueos, actualizamos la campaña como fallida
    if (blockStatus) {
      await updateCampaign(userId, campaignId, {
        status: "failed",
        progress: 100,
        error: `Cuenta bloqueada: ${blockStatus.message || "Razón desconocida"}`,
        endedAt: new Date()
      });
      return false; // No seguir verificando
    }
    
    const now = new Date();
    const startTime = campaign.createdAt instanceof Date 
      ? campaign.createdAt 
      : new Date(campaign.createdAt);
    const elapsedMs = now - startTime;
    
    // Obtener recuento de usuarios y verificar si hay filtrados
    const originalTargetCount = campaign.originalTargetCount || campaign.targetCount || (campaign.targetUsers?.length || 0);
    let targetCount = originalTargetCount;
    
    // Si tenemos información de usuarios filtrados, ajustar el recuento
    if (campaign.filteredUsers !== undefined) {
      // Restar los usuarios filtrados del total
      targetCount = Math.max(0, originalTargetCount - campaign.filteredUsers);
      
      // Actualizar el targetCount en la campaña si ha cambiado
      if (campaign.targetCount !== targetCount) {
        await updateCampaign(userId, campaignId, {
          targetCount: targetCount,
          // Guardar el recuento original si no existe
          originalTargetCount: campaign.originalTargetCount || originalTargetCount
        });
      }
    }
    
    // Determinar la tasa de procesamiento según el tipo de campaña
    let ratePerHour = 3; // Por defecto: 3 operaciones por hora
    
    switch (campaign.campaignType) {
      case "send_messages":
      case "send_media":
        ratePerHour = 3; // 3 mensajes por hora
        break;
      case "follow_users":
        ratePerHour = 10; // Ejemplo: 10 seguimientos por hora
        break;
      default:
        ratePerHour = 3; // Valor por defecto para otros tipos
    }
    
    // Calcular la duración total estimada en milisegundos
    // Math.ceil para redondear hacia arriba, asegurando que no terminemos antes de tiempo
    const hoursNeeded = Math.ceil(targetCount / ratePerHour);
    const estimatedDurationMs = hoursNeeded * 60 * 60 * 1000 + (5 * 60 * 1000); // Horas a ms + 5 min de margen
    
    // Verificar si ya pasó el tiempo estimado para considerar la campaña como completada
    if (elapsedMs >= estimatedDurationMs) {
      // El tiempo estimado ha transcurrido, marcar como completada
      let totalProcessed = targetCount; // Asumimos que todos fueron procesados
      
      // Si hay estadísticas disponibles, usarlas
      if (data.message && data.message.day && data.message.day.current) {
        totalProcessed = Math.min(targetCount, data.message.day.current);
      } else if (data.follow && data.follow.day && data.follow.day.current) {
        totalProcessed = Math.min(targetCount, data.follow.day.current);
      }
      
      await updateCampaign(userId, campaignId, {
        status: "completed",
        progress: 100,
        totalProcessed: totalProcessed,
        endedAt: new Date()
      });
      return false; // No seguir verificando
    }
    
    // La campaña sigue en proceso, actualizar el progreso basado en el tiempo transcurrido
    const progressPercentage = Math.min(95, Math.round((elapsedMs / estimatedDurationMs) * 100));
    const estimatedProcessed = Math.round((progressPercentage / 100) * targetCount);
    
    await updateCampaign(userId, campaignId, {
      progress: progressPercentage,
      totalProcessed: estimatedProcessed
    });
    
    // Registrar información de seguimiento
    console.log(`Campaña ${campaignId} en progreso: ${progressPercentage}%. Tiempo transcurrido: ${formatElapsedTime(startTime)}. Tiempo estimado total: ${formatElapsedTime(startTime, new Date(startTime.getTime() + estimatedDurationMs))}`);
    
    // Devolver true para seguir monitoreando
    return true;
  } catch (error) {
    console.error("Error al verificar estado de campaña:", error);
    
    // En caso de error, seguimos monitoreando
    return true;
  }
}

/**
 * Verifica si hay alguna campaña activa para un usuario específico
 * @param {string} userId - ID del usuario
 * @returns {Promise<boolean>} - true si hay campañas activas
 */
export const hasActiveCampaigns = async (userId) => {
  try {
    const campaigns = await getActiveCampaigns(userId);
    return campaigns.length > 0;
  } catch (error) {
    console.error("Error al verificar campañas activas:", error);
    return false;
  }
};

/**
 * Calcula el tiempo estimado que lleva una campaña en curso
 * @param {Object} campaign - Objeto de campaña
 * @returns {Object} - Objeto con tiempo en milisegundos y formato legible
 */
export const calculateCampaignElapsedTime = (campaign) => {
  if (!campaign || !campaign.createdAt) {
    return { ms: 0, formatted: "0:00" };
  }
  
  const now = new Date();
  const start = campaign.createdAt instanceof Date 
    ? campaign.createdAt 
    : new Date(campaign.createdAt);
  
  const elapsedMs = now - start;
  
  // Formato legible
  const minutes = Math.floor(elapsedMs / 60000);
  const seconds = Math.floor((elapsedMs % 60000) / 1000);
  
  return {
    ms: elapsedMs,
    formatted: `${minutes}:${seconds.toString().padStart(2, '0')}`
  };
};

/**
 * Formatea el tiempo transcurrido de forma legible
 * @param {Date} startDate - Fecha de inicio
 * @param {Date} endDate - Fecha de finalización (por defecto: ahora)
 * @returns {string} - Tiempo transcurrido formateado
 */
export const formatElapsedTime = (startDate, endDate = new Date()) => {
  if (!startDate) return "N/A";
  
  const start = startDate instanceof Date ? startDate : new Date(startDate);
  const end = endDate instanceof Date ? endDate : new Date(endDate);
  
  const elapsed = Math.max(0, Math.floor((end - start) / 1000)); // segundos (nunca negativo)
  
  if (elapsed < 60) return `${elapsed} segundo${elapsed !== 1 ? 's' : ''}`;
  
  const minutes = Math.floor(elapsed / 60);
  if (minutes < 60) return `${minutes} minuto${minutes !== 1 ? 's' : ''}`;
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) {
    return `${hours} hora${hours !== 1 ? 's' : ''}`;
  } else {
    return `${hours} hora${hours !== 1 ? 's' : ''} ${remainingMinutes} minuto${remainingMinutes !== 1 ? 's' : ''}`;
  }
}

/**
 * Obtiene el nombre descriptivo para un tipo de campaña
 * @param {string} type - Tipo de campaña
 * @returns {string} - Nombre descriptivo
 */
export const getCampaignTypeName = (type) => {
  switch (type) {
    case "send_messages": return "Envío de mensajes";
    case "send_media": return "Envío de media";
    case "follow_users": return "Seguimiento de usuarios";
    default: return type || "Operación";
  }
};

/**
 * Estima el tiempo restante para completar una campaña
 * @param {Object} campaign - Objeto de campaña
 * @returns {string} - Tiempo restante estimado formateado
 */
export const estimateRemainingTime = (campaign) => {
  if (!campaign || !campaign.createdAt) {
    return "Calculando...";
  }
  
  // Si está casi completo, estimamos que quedan 30 segundos
  if (campaign.progress >= 95) {
    return "< 1 minuto";
  }
  
  // Determinar tasa de procesamiento basada en el tipo de campaña
  let ratePerHour = 3; // Por defecto: 3 operaciones por hora
  
  switch (campaign.campaignType) {
    case "send_messages":
    case "send_media":
      ratePerHour = 3; // 3 mensajes por hora
      break;
    case "follow_users":
      ratePerHour = 10; // Ejemplo: 10 seguimientos por hora
      break;
    default:
      ratePerHour = 3; // Valor por defecto para otros tipos
  }
  
  // Obtener el tiempo transcurrido
  const now = new Date();
  const start = campaign.createdAt instanceof Date 
    ? campaign.createdAt 
    : new Date(campaign.createdAt);
  const elapsedMs = now - start;
  
  // Calcular tiempo total estimado basado en la cantidad de usuarios
  const originalCount = campaign.originalTargetCount || (campaign.targetUsers?.length || campaign.targetCount || 0);
  const filteredCount = campaign.filteredUsers || 0;
  const targetCount = Math.max(0, originalCount - filteredCount);
  const hoursNeeded = Math.ceil(targetCount / ratePerHour);
  const totalEstimatedMs = hoursNeeded * 60 * 60 * 1000; // Horas a ms
  
  // Calcular tiempo restante
  const remainingMs = Math.max(0, totalEstimatedMs - elapsedMs);
  const remainingMinutes = Math.ceil(remainingMs / 60000);
  
  // Formatear el tiempo restante
  if (remainingMinutes < 1) return "< 1 minuto";
  if (remainingMinutes === 1) return "~1 minuto";
  if (remainingMinutes < 60) return `~${remainingMinutes} minutos`;
  
  const hours = Math.floor(remainingMinutes / 60);
  const mins = remainingMinutes % 60;
  
  if (mins === 0) {
    return `~${hours} hora${hours !== 1 ? 's' : ''}`;
  } else {
    return `~${hours} hora${hours !== 1 ? 's' : ''} y ${mins} minuto${mins !== 1 ? 's' : ''}`;
  }
}

/**
 * Calcula y devuelve la hora estimada de finalización de una campaña
 * @param {Object} campaign - Objeto de la campaña
 * @returns {Date|null} - Fecha estimada de finalización o null si no se puede calcular
 */
export const calculateEstimatedCompletionTime = (campaign) => {
  if (!campaign || !campaign.createdAt) return null;
  
  // Determinar tasa de procesamiento basada en el tipo
  let ratePerHour = campaign.processingRatePerHour || 3;
  
  // Considerar usuarios filtrados
  const originalCount = campaign.originalTargetCount || campaign.targetCount || 0;
  const filteredCount = campaign.filteredUsers || 0;
  const targetCount = Math.max(0, originalCount - filteredCount);
  
  const hoursNeeded = Math.ceil(targetCount / ratePerHour);
  
  const startTime = campaign.createdAt instanceof Date 
    ? campaign.createdAt 
    : new Date(campaign.createdAt);
  
  return new Date(startTime.getTime() + (hoursNeeded * 60 * 60 * 1000));
}