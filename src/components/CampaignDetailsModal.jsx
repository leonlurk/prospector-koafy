import { useState, useEffect } from "react";
import PropTypes from 'prop-types';
import { FaTimes, FaTrash } from "react-icons/fa";
import { doc, deleteDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { getCampaignDetails } from "../campaignStore";

const CampaignDetailsModal = ({ campaignId, userId, isOpen, onClose, onDelete }) => {
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [elapsedTime, setElapsedTime] = useState("0:00");
  const [timerInterval, setTimerInterval] = useState(null);
  const [batchInfo, setBatchInfo] = useState({
  completedBatches: 0,
  nextBatchIn: "0m 0s",
  progress: 0
});

  useEffect(() => {
    if (isOpen && campaign?.status === 'processing' && campaign?.createdAt) {
      // Función para actualizar el tiempo transcurrido
      // Función mejorada para actualizar tiempo y lotes
const updateElapsedTime = () => {
  const now = new Date();
  const startTime = campaign.createdAt instanceof Date 
    ? campaign.createdAt 
    : new Date(campaign.createdAt);
  
  const elapsedMs = now - startTime;
  const minutes = Math.floor(elapsedMs / 60000);
  const seconds = Math.floor((elapsedMs % 60000) / 1000);
  const hours = Math.floor(minutes / 60);
  
  // Formatear tiempo transcurrido (igual que antes)
  if (hours > 0) {
    setElapsedTime(`${hours}:${(minutes % 60).toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
  } else {
    setElapsedTime(`${minutes}:${seconds.toString().padStart(2, '0')}`);
  }
  
  // Calcular información de lotes
  const elapsedHours = elapsedMs / (1000 * 60 * 60);
  const ratePerHour = campaign.processingRatePerHour || 3;
  const completedBatches = Math.floor(elapsedHours);
  
  // Tiempo hasta el siguiente lote
  const millisToNextBatch = ((completedBatches + 1) * 60 * 60 * 1000) - elapsedMs;
  const minutesToNext = Math.floor(millisToNextBatch / 60000);
  const secondsToNext = Math.floor((millisToNextBatch % 60000) / 1000);
  const nextBatchIn = `${minutesToNext}m ${secondsToNext}s`;
  
  // Progreso porcentual al siguiente lote
  const progressToNext = Math.min(100, Math.round((elapsedMs % (60 * 60 * 1000)) / (60 * 60 * 10)));
  
  setBatchInfo({
    completedBatches,
    nextBatchIn,
    progress: progressToNext
  });
};
      
      // Actualizar inmediatamente
      updateElapsedTime();
      
      // Configurar intervalo para actualizar cada segundo
      const interval = setInterval(updateElapsedTime, 1000);
      setTimerInterval(interval);
      
      // Limpieza al desmontar
      return () => {
        if (interval) clearInterval(interval);
      };
    } else {
      // Limpiar intervalo si el modal se cierra o la campaña no está en proceso
      if (timerInterval) {
        clearInterval(timerInterval);
        setTimerInterval(null);
      }
    }
  }, [isOpen, campaign, timerInterval]);
  
  useEffect(() => {
    const fetchCampaignDetails = async () => {
      if (!isOpen || !campaignId || !userId) return;
      
      try {
        setLoading(true);
        setError("");
        
        const campaignData = await getCampaignDetails(userId, campaignId);
        setCampaign(campaignData);
      } catch (error) {
        console.error("Error al obtener detalles de la campaña:", error);
        setError("No se pudieron cargar los detalles de la campaña.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchCampaignDetails();
  }, [campaignId, userId, isOpen]);
  
  const handleDeleteCampaign = async () => {
    if (!window.confirm("¿Estás seguro de eliminar esta campaña? Esta acción no se puede deshacer.")) {
      return;
    }
    
    try {
      const campaignRef = doc(db, "users", userId, "campaigns", campaignId);
      await deleteDoc(campaignRef);
      
      if (typeof onDelete === 'function') {
        onDelete(campaignId);
      }
      
      onClose();
    } catch (error) {
      console.error("Error al eliminar la campaña:", error);
      setError("No se pudo eliminar la campaña. Intente nuevamente.");
    }
  };
  
  if (!isOpen) return null;
  
  // Determinar si la campaña está finalizada
  const isCompleted = campaign?.status === 'completed' || 
                      campaign?.status === 'cancelled' || 
                      campaign?.status === 'failed';

  // Añade esto justo después de donde defines isCompleted
const elapsedMs = campaign?.createdAt 
? (new Date() - (campaign.createdAt instanceof Date ? campaign.createdAt : new Date(campaign.createdAt))) 
: 0;
  
  // Formatear fecha
  const formatDate = (dateObj) => {
    if (!dateObj) return "N/A";
    
    const date = dateObj instanceof Date ? dateObj : new Date(dateObj);
    return date.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Obtener texto para el estado
  const getStatusText = (status) => {
    switch (status) {
      case 'processing': return 'En proceso';
      case 'paused': return 'En pausa';
      case 'completed': return 'Completada';
      case 'cancelled': return 'Cancelada';
      case 'failed': return 'Fallida';
      default: return 'Desconocido';
    }
  };
  
  // Obtener texto para el tipo de campaña
  const getCampaignTypeText = (type) => {
    switch (type) {
      case 'send_messages': return 'Envío de mensajes';
      case 'send_media': return 'Envío de multimedia';
      case 'follow_users': return 'Seguimiento de usuarios';
      case 'like_posts': return 'Dar likes a publicaciones';
      case 'comment_posts': return 'Comentar publicaciones';
      default: return type || 'Desconocido';
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden shadow-xl">
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b">
          <h2 className="text-xl font-medium text-black">
            Detalles de Campaña
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 bg-transparent border-0 p-2 rounded-full hover:bg-gray-100"
          >
            <FaTimes size={16} />
          </button>
        </div>
        
        {/* Contenido */}
        <div className="p-5 overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
              <span className="ml-2 text-gray-600">Cargando detalles...</span>
            </div>
          ) : error ? (
            <div className="text-center py-6 px-4 bg-red-50 text-red-600 rounded-lg">
              {error}
            </div>
          ) : campaign ? (
            <div className="space-y-4">
              {/* Información básica */}
              <div className="bg-indigo-50 p-4 rounded-lg">
                <h3 className="font-semibold text-lg text-indigo-800 mb-2">
                  {campaign.name || "Campaña sin nombre"}
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Tipo:</span>{" "}
                    <span className="text-black">{getCampaignTypeText(campaign.campaignType)}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Estado:</span>{" "}
                    <span className={`${
                      campaign.status === 'processing' ? 'text-green-600' :
                      campaign.status === 'paused' ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>{getStatusText(campaign.status)}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Creada:</span>{" "}
                    <span className="text-black">{formatDate(campaign.createdAt)}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Última actualización:</span>{" "}
                    <span className="text-black">{formatDate(campaign.lastUpdated)}</span>
                  </div>
                  {campaign.endedAt && (
                    <div className="col-span-2">
                      <span className="font-medium text-gray-700">Finalizada:</span>{" "}
                      <span className="text-black">{formatDate(campaign.endedAt)}</span>
                    </div>
                  )}
                </div>
              </div>
              
              
              {/* Progreso */}
<div className="bg-gray-50 p-4 rounded-lg">
  <div className="flex justify-between mb-1">
    <span className="font-medium text-gray-700">Progreso:</span>
    <span className="text-black">{campaign.progress || 0}%</span>
  </div>
  <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
    <div 
      className={`h-2.5 rounded-full ${
        campaign.status === 'processing' ? 'bg-indigo-600' :
        campaign.status === 'paused' ? 'bg-yellow-500' :
        campaign.status === 'completed' ? 'bg-green-500' :
        'bg-red-500'
      }`}
      style={{ width: `${campaign.progress || 0}%` }}
    ></div>
  </div>
  
  {campaign.status === 'processing' && (
  <div className="mt-3 text-sm">
    {/* Timer en tiempo real */}
    <div className="flex justify-between mb-1">
      <span className="text-gray-600">Tiempo transcurrido:</span>
      <span className="text-black font-medium bg-blue-50 px-2 py-1 rounded">
        {elapsedTime}
      </span>
    </div>
    
    <div className="flex justify-between mb-1">
      <span className="text-gray-600">Tasa de procesamiento:</span>
      <span className="text-black font-medium">{campaign.processingRatePerHour || 3} ops/hora</span>
    </div>
    
    {/* Información de lotes - NUEVO */}
    <div className="flex justify-between mb-1">
      <span className="text-gray-600">Lotes completados:</span>
      <span className="text-black font-medium">{batchInfo.completedBatches}</span>
    </div>
    
    <div className="flex justify-between mb-1">
      <span className="text-gray-600">Próximo lote en:</span>
      <span className="text-black font-medium">{batchInfo.nextBatchIn}</span>
    </div>
    
    {/* Barra de progreso para el próximo lote - NUEVO */}
    <div className="mt-2 mb-3">
      <div className="flex justify-between text-xs mb-1">
        <span>Progreso hacia el próximo lote</span>
        <span>{batchInfo.progress}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-1.5">
        <div 
          className="h-1.5 rounded-full bg-indigo-500"
          style={{ width: `${batchInfo.progress}%` }}
        ></div>
      </div>
    </div>
    
    {/* Resto del código... */}
  </div>
)}
      
      {campaign.estimatedCompletionTime && (
        <div className="flex justify-between">
          <span className="text-gray-600">Finalización estimada:</span>
          <span className="text-black font-medium">
            {formatDate(campaign.estimatedCompletionTime)}
          </span>
        </div>
      )}
      
      {campaign.estimatedCompletionHours !== undefined && (
        <div className="flex justify-between">
          <span className="text-gray-600">Duración estimada:</span>
          <span className="text-black font-medium">
            {campaign.estimatedCompletionHours === 1 
              ? '~1 hora' 
              : `~${campaign.estimatedCompletionHours} horas`}
          </span>
        </div>
      )}
  
</div>
              
              {/* Usuarios */}
              <div className="border border-gray-200 rounded-lg">
                <div className="bg-gray-50 p-4 border-b border-gray-200">
                  <h3 className="font-medium text-gray-800">Usuarios a interactuar</h3>
                </div>
                <div className="p-4">
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-700">Total de usuarios:</span>
                    <span className="font-medium text-black">{campaign.targetCount || 0}</span>
                  </div>
                  
                  {campaign.totalProcessed !== undefined && (
                <div className="flex justify-between mb-2">
                  <span className="text-gray-700">Usuarios procesados:</span>
                  <span className="font-medium text-black">
                    {campaign.totalProcessed || 0}
                    {campaign.status === 'processing' && (
                      <span className="text-gray-500 text-xs">
                        {" "}(próximo lote: {Math.min((Math.floor(elapsedMs / (1000 * 60 * 60)) + 1) * (campaign.processingRatePerHour || 3), campaign.targetCount || 0)})
                      </span>
                    )}
                  </span>
                </div>
              )}
                  
                  {campaign.filteredUsers !== undefined && (
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-700">Usuarios filtrados:</span>
                      <span className="font-medium text-black">{campaign.filteredUsers || 0}</span>
                    </div>
                  )}
                  
                  {campaign.targetUsers && campaign.targetUsers.length > 0 && (
                    <div className="mt-3">
                      <p className="text-gray-700 mb-2">Lista de usuarios:</p>
                      <div className="max-h-32 overflow-y-auto bg-gray-50 p-2 rounded-md text-sm">
                        {campaign.targetUsers.map((user, index) => (
                          <div key={index} className="mb-1 text-gray-800">
                            {user}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Resultados (solo si está completa) */}
              {isCompleted && (
                <div className="border border-gray-200 rounded-lg">
                  <div className="bg-gray-50 p-4 border-b border-gray-200">
                    <h3 className="font-medium text-gray-800">Resultados finales</h3>
                  </div>
                  <div className="p-4">
                    {campaign.successCount !== undefined && (
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-700">Operaciones exitosas:</span>
                        <span className="font-medium text-green-600">{campaign.successCount || 0}</span>
                      </div>
                    )}
                    
                    {campaign.failedCount !== undefined && (
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-700">Operaciones fallidas:</span>
                        <span className="font-medium text-red-600">{campaign.failedCount || 0}</span>
                      </div>
                    )}
                    
                    {campaign.error && (
                      <div className="mt-2 p-2 bg-red-50 rounded-md text-red-600 text-sm">
                        Error: {campaign.error}
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Información adicional */}
              {campaign.postLink && (
                <div className="border border-gray-200 rounded-lg">
                  <div className="bg-gray-50 p-4 border-b border-gray-200">
                    <h3 className="font-medium text-gray-800">Enlace objetivo</h3>
                  </div>
                  <div className="p-4">
                    <a 
                      href={campaign.postLink} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-indigo-600 hover:underline break-words"
                    >
                      {campaign.postLink}
                    </a>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-gray-500">No se encontraron detalles para esta campaña.</p>
            </div>
          )}
        </div>
        
        {/* Footer con botones */}
        <div className="p-4 border-t flex justify-between items-center">
          <div>
            {/* Botón de eliminar - visible para todas pero deshabilitado si no está completada */}
            <button 
              onClick={isCompleted ? handleDeleteCampaign : undefined}
              className={`flex items-center px-4 py-2 rounded-lg transition ${
                isCompleted 
                  ? "bg-red-50 text-red-600 hover:bg-red-100 cursor-pointer" 
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
              disabled={!isCompleted}
              title={isCompleted ? "Eliminar campaña" : "Solo se pueden eliminar campañas finalizadas"}
            >
              <FaTrash className="mr-2" size={14} />
              Eliminar campaña
            </button>
          </div>
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-indigo-900 text-white rounded-lg hover:bg-indigo-800 transition"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

CampaignDetailsModal.propTypes = {
  campaignId: PropTypes.string,
  userId: PropTypes.string,
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onDelete: PropTypes.func
};

export default CampaignDetailsModal;