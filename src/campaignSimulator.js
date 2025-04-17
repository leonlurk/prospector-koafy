/**
 * Calcula el progreso actual de una campaña
 */
export const calculateCampaignProgress = (campaign) => {
  if (!campaign || !campaign.createdAt) {
    return {
      percentage: 0,
      completed_batches: 0,
      messages_sent: 0,
      next_batch_in: "--:--",
      time_elapsed: "0:00:00",
      batch_progress: 0,
      estimated_completion: null,
      total_users: 0,
      is_completed: false,
      should_update_status: false
    };
  }

  // Obtener el recuento real de usuarios
  let totalUsers = campaign.filteredUsers || 0;

  // Si no hay usuarios, la campaña no puede progresar
  if (totalUsers <= 0) {
     return {
      percentage: 0,
      completed_batches: 0,
      messages_sent: 0,
      next_batch_in: "--:--",
      time_elapsed: "0:00:00", // O podríamos calcular el tiempo real transcurrido
      batch_progress: 0,
      estimated_completion: campaign.createdAt, // Finaliza inmediatamente si no hay usuarios
      total_users: 0,
      is_completed: true, // Se considera completa porque no hay trabajo que hacer
      should_update_status: campaign.status === 'processing' // Sugerir actualización si estaba 'procesando'
    };
  }

  const rate = campaign.processingRatePerHour || 3;
  
  // Cálculo de tiempo
  const now = new Date();
  const startTime = campaign.createdAt instanceof Date ? campaign.createdAt : new Date(campaign.createdAt);
  const elapsedMs = now - startTime;
  const elapsedHours = elapsedMs / 3600000;
  

// Batches completados (horas completas)
const completedBatches = Math.floor(elapsedHours);
// El primer batch se procesa inmediatamente
const messagesSent = Math.min((completedBatches + 1) * rate, totalUsers);
  
  // Porcentaje basado en mensajes enviados
  const percentage = Math.floor((messagesSent / totalUsers) * 100);
  
  // Tiempo hasta próximo batch
  const secondsInCurrentHour = (elapsedHours - Math.floor(elapsedHours)) * 3600;
  const secondsToNextBatch = 3600 - secondsInCurrentHour;
  const minutesToNext = Math.floor(secondsToNextBatch / 60);
  const secondsToNext = Math.floor(secondsToNextBatch % 60);
  const nextBatchIn = `${minutesToNext}m ${secondsToNext}s`;
  
  // Progreso dentro del batch actual
  const batchProgress = Math.floor((secondsInCurrentHour / 3600) * 100);
  
  // Finalización estimada
  const hoursNeeded = Math.ceil(totalUsers / rate);
  const estimatedCompletion = new Date(startTime.getTime() + (hoursNeeded * 3600000));
  
  // Tiempo transcurrido formateado
  const hours = Math.floor(elapsedMs / 3600000);
  const minutes = Math.floor((elapsedMs % 3600000) / 60000);
  const seconds = Math.floor((elapsedMs % 60000) / 1000);
  const timeElapsed = `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  
  // Determinar si la campaña ya debería estar completada
const isCompleted = messagesSent >= totalUsers;

// Si la campaña debería estar completada pero su estado no lo refleja
const shouldUpdateStatus = isCompleted && campaign.status === 'processing';

return {
  percentage: isCompleted ? 100 : percentage,
  completed_batches: completedBatches,
  messages_sent: isCompleted ? totalUsers : messagesSent,
  next_batch_in: isCompleted ? "0m 0s" : nextBatchIn,
  time_elapsed: timeElapsed,
  batch_progress: isCompleted ? 100 : batchProgress,
  estimated_completion: estimatedCompletion,
  total_users: totalUsers,
  is_completed: isCompleted,
  should_update_status: shouldUpdateStatus
};
};

/**
 * Genera datos para el gráfico de escalones
 */
export const generateChartData = (campaign) => {
  if (!campaign || !campaign.createdAt) {
    return { points: [], total_hours: 0, total_messages: 0 };
  }
  
// Obtener el recuento real de usuarios - usar la misma lógica que en calculateCampaignProgress
let totalUsers = campaign.filteredUsers || 0;

// Si no hay usuarios, no hay datos para el gráfico o dura 0 horas
if (totalUsers <= 0) {
  return { points: [], total_hours: 0, total_messages: 0 };
}
  
  const rate = campaign.processingRatePerHour || 3;
  const totalHours = Math.ceil(totalUsers / rate);
  
  // Calcular hora actual
  const now = new Date();
  const startTime = campaign.createdAt instanceof Date ? campaign.createdAt : new Date(campaign.createdAt);
  const elapsedHours = (now - startTime) / 3600000;
  const currentHour = Math.floor(elapsedHours);
  
  // Generar puntos para el gráfico
  const points = [];
  
  // Primer punto (hora 0)
  points.push({
    hour: 0,
    messages: Math.min(rate, totalUsers), // Procesamiento inmediato del primer lote
    is_current: currentHour === 0
  });
  
  // Puntos para cada hora
  for (let hour = 1; hour <= totalHours; hour++) {
    const messageCount = Math.min((hour + 1) * rate, totalUsers);
    
    points.push({
      hour,
      messages: messageCount,
      is_current: currentHour === hour
    });
  }
  
  return {
    points,
    total_hours: totalHours,
    total_messages: totalUsers
  };
};