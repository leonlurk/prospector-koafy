import { useState, useEffect } from "react";
import PropTypes from 'prop-types';
import { FaTimes, FaTrash, FaInfoCircle, FaCalendarAlt, FaTasks, FaLink, FaEnvelope, FaComment, FaImage } from "react-icons/fa";
import { doc, onSnapshot, deleteDoc, Timestamp } from "firebase/firestore";
import { db } from "../firebaseConfig";

// Helper para formatear duración
const formatDuration = (start, end) => {
  if (!start || !end) return "N/A";
  const startDate = start instanceof Date ? start : start?.toDate ? start.toDate() : new Date(start);
  const endDate = end instanceof Date ? end : end?.toDate ? end.toDate() : new Date(end);
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return "N/A";
  
  const durationMs = endDate.getTime() - startDate.getTime();
  if (durationMs < 0) return "N/A";

  const seconds = Math.floor((durationMs / 1000) % 60);
  const minutes = Math.floor((durationMs / (1000 * 60)) % 60);
  const hours = Math.floor((durationMs / (1000 * 60 * 60)) % 24);
  const days = Math.floor(durationMs / (1000 * 60 * 60 * 24));

  let durationStr = "";
  if (days > 0) durationStr += `${days}d `;
  if (hours > 0) durationStr += `${hours}h `;
  if (minutes > 0) durationStr += `${minutes}m `;
  if (seconds >= 0) durationStr += `${seconds}s`; // Mostrar segundos siempre

  return durationStr.trim() || "< 1s";
};

const CampaignDetailsModal = ({ campaignId, userId, isOpen, onClose }) => {
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen || !userId || !campaignId) {
      setLoading(false); // Don't load if modal isn't open or IDs are missing
      setCampaign(null); // Clear campaign data if modal closed or IDs missing
      return;
    }

    setLoading(true);
    setError("");
    console.log(`[Modal ${campaignId}] Setting up listener for user ${userId}, campaign ${campaignId}`);

    const campaignRef = doc(db, "users", userId, "campaigns", campaignId);
    const unsubscribe = onSnapshot(campaignRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        console.log(`[Modal ${campaignId}] Snapshot received:`, data);
        
        // Process data before setting state
        const processedData = {
          ...data,
          id: docSnap.id,
          // Directly convert timestamps to locale strings, handle null/undefined
          createdAtFormatted: data.createdAt?.toDate ? data.createdAt.toDate().toLocaleString() : 'N/A',
          estimatedCompletionTimeFormatted: data.estimatedCompletionTime?.toDate ? data.estimatedCompletionTime.toDate().toLocaleString() : 'N/A',
          lastUpdatedFormatted: data.lastUpdated?.toDate ? data.lastUpdated.toDate().toLocaleString() : 'N/A'
        };
        
        setCampaign(processedData);
        setError("");
      } else {
        console.log(`[Modal ${campaignId}] No such document!`);
        setError("No se encontró la campaña.");
        setCampaign(null);
      }
      setLoading(false);
    }, (err) => {
      console.error(`[Modal ${campaignId}] Listener error:`, err);
      setError("Error al cargar detalles de la campaña.");
      setLoading(false);
    });

    // Cleanup listener
    return () => {
      console.log(`[Modal ${campaignId}] Cleaning up listener.`);
      unsubscribe();
    };

  }, [isOpen, userId, campaignId]);
  
  const handleDeleteCampaign = async () => {
    if (!window.confirm("¿Estás seguro de eliminar esta campaña? Esta acción no se puede deshacer.")) {
      return;
    }
    console.log(`[Modal Delete] Attempting delete. UserID: ${userId}, CampaignID: ${campaignId}`);
    try {
      const campaignRef = doc(db, "users", userId, "campaigns", campaignId);
      await deleteDoc(campaignRef);
      onClose();
    } catch (error) {
      console.error("Error al eliminar la campaña:", error);
      setError("No se pudo eliminar la campaña. Intente nuevamente.");
    }
  };
  
  if (!isOpen) return null;
  
  // --- Funciones Helper para el Render --- 
  const getStatusInfo = (status) => {
    switch (status) {
      case 'processing': return { text: 'En proceso', color: 'text-green-600', icon: FaTasks };
      case 'paused': return { text: 'Pausada', color: 'text-yellow-600', icon: FaPause }; // Reusar FaPause
      case 'completed': return { text: 'Completada', color: 'text-blue-600', icon: FaInfoCircle };
      case 'cancelled': return { text: 'Cancelada', color: 'text-red-600', icon: FaTimes };
      case 'failed': return { text: 'Fallida', color: 'text-red-700 font-bold', icon: FaInfoCircle };
      case 'scheduled': return { text: 'En Cola', color: 'text-cyan-600', icon: FaCalendarAlt };
      default: return { text: 'Desconocido', color: 'text-gray-500', icon: FaInfoCircle };
    }
  };
  
  const getCampaignTypeInfo = (type) => {
    switch (type) {
      case 'send_messages': return { text: 'Envío de mensajes', icon: FaEnvelope };
      case 'send_media': return { text: 'Envío de multimedia', icon: FaImage };
      case 'follow_users': return { text: 'Seguimiento de usuarios', icon: FaTasks }; // Cambiar icono si quieres
      case 'like_posts': return { text: 'Dar likes a publicaciones', icon: FaTasks }; // Cambiar icono
      case 'comment_posts': return { text: 'Comentar publicaciones', icon: FaComment };
      default: return { text: type || 'Desconocido', icon: FaTasks };
    }
  };

  // Obtener datos calculados
  const statusInfo = campaign ? getStatusInfo(campaign.status) : getStatusInfo('');
  const typeInfo = campaign ? getCampaignTypeInfo(campaign.campaignType) : getCampaignTypeInfo('');
  const duration = campaign ? formatDuration(campaign.createdAt, campaign.endedAt) : "N/A";
  const filteredCount = (campaign?.originalUserCount ?? 0) - (campaign?.filteredUsers ?? campaign?.targetUserList?.length ?? 0);
  const targetFinalCount = campaign?.filteredUsers ?? campaign?.targetUserList?.length ?? 0;
  const totalProcessed = campaign?.totalProcessed ?? 0;

  // --- Componente de Sección --- 
  const DetailSection = ({ title, children }) => (
    <div className="mb-4 border border-gray-200 rounded-lg overflow-hidden">
      <h4 className="bg-gray-50 px-4 py-2 text-sm font-semibold text-gray-700 border-b border-gray-200">{title}</h4>
      <div className="p-4 space-y-2 text-sm">
        {children}
      </div>
    </div>
  );

  // --- Componente de Item de Detalle --- 
  const DetailItem = ({ label, value, icon: IconComponent }) => (
    <div className="flex items-start">
      {IconComponent && <IconComponent className="w-4 h-4 mr-2 mt-0.5 text-gray-500 flex-shrink-0" />}
      <span className="font-medium text-gray-600 mr-2">{label}:</span>
      <span className="text-black break-words">{value || "N/A"}</span>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b bg-gray-50 rounded-t-xl">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center">
            <FaInfoCircle className="mr-2 text-indigo-600" />
            Detalles de Campaña
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-200"
          >
            <FaTimes size={18} />
          </button>
        </div>
        
        {/* Contenido Scrollable */}
        <div className="p-5 overflow-y-auto flex-grow">
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
            </div>
          ) : error ? (
            <div className="text-center py-6 px-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
              {error}
            </div>
          ) : campaign ? (
            <div className="space-y-3">
              {/* Información Básica */}
              <DetailSection title="Información Básica">
                <DetailItem label="Nombre" value={campaign.name} />
                <DetailItem label="Estado" value={statusInfo.text} icon={statusInfo.icon} />
                <DetailItem label="Tipo" value={typeInfo.text} icon={typeInfo.icon} />
                <DetailItem label="Creada" value={campaign.createdAtFormatted} icon={FaCalendarAlt} />
                {campaign.endedAt && <DetailItem label="Finalizada" value={campaign.endedAtFormatted} icon={FaCalendarAlt} />}
                {campaign.endedAt && <DetailItem label="Duración" value={duration} />}
              </DetailSection>

              {/* Estadísticas de Ejecución */}
              <DetailSection title="Estadísticas">
                <DetailItem label="Objetivo" value={campaign.objective || 'No especificado'} />
                <DetailItem label="Usuarios Iniciales" value={campaign.originalUserCount} />
                <DetailItem label="Usuarios Filtrados (Blacklist)" value={filteredCount < 0 ? 0 : filteredCount} />
                <DetailItem label="Usuarios Objetivo Final" value={targetFinalCount} />
                <DetailItem label="Procesados" value={`${totalProcessed} / ${targetFinalCount}`} />
              </DetailSection>

              {/* Detalles de la Tarea */}
              <DetailSection title="Detalles de Tarea">
                 <DetailItem 
                    label="Enlace/Perfil" 
                    icon={FaLink} 
                    value={
                      campaign.targetLink ? (
                        <a 
                          href={campaign.targetLink} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:underline break-all"
                        >
                          {campaign.targetLink}
                        </a>
                      ) : (
                        "N/A"
                      )
                    }
                  />
                 {campaign.campaignType === 'send_messages' && campaign.message && 
                   <DetailItem label="Mensaje" value={campaign.message} icon={FaEnvelope} />
                 }
                 {campaign.campaignType === 'comment_posts' && campaign.message && 
                   <DetailItem label="Comentario" value={campaign.message} icon={FaComment} />
                 }
                 {campaign.campaignType === 'send_media' && 
                   <>
                    <DetailItem label="Tipo Media" value={campaign.mediaType} icon={FaImage} />
                    <DetailItem label="Texto Adjunto" value={campaign.mediaCaption} />
                   </>
                 }
              </DetailSection>

              {/* Resultados/Errores */}
              {(campaign.status === 'failed' || campaign.status === 'cancelled') && (
                <DetailSection title="Resultado / Errores">
                  {campaign.status === 'failed' && 
                    <DetailItem label="Error" value={campaign.error || 'Error desconocido'} icon={FaInfoCircle} />
                  }
                  {campaign.status === 'cancelled' && 
                    <DetailItem label="Resultado" value="Cancelada manualmente" icon={FaInfoCircle} />
                  }
                </DetailSection>
              )}

            </div>
          ) : (
            <div className="text-center py-6 px-4 text-gray-500">
              No se encontraron datos para esta campaña.
            </div>
          )}
        </div>

        {/* Footer con botón de eliminar */}
        <div className="p-4 border-t bg-gray-50 rounded-b-xl flex justify-end">
          <button
            onClick={handleDeleteCampaign}
            disabled={loading}
            className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center"
          >
            <FaTrash className="mr-2" />
            Eliminar Campaña
          </button>
        </div>
      </div>
    </div>
  );
};

CampaignDetailsModal.propTypes = {
  campaignId: PropTypes.string.isRequired,
  userId: PropTypes.string.isRequired,
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default CampaignDetailsModal;