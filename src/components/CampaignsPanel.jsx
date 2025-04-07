import { useState, useEffect, useCallback } from "react";
import PropTypes from 'prop-types';
import { getActiveCampaigns, getRecentCampaigns, cancelCampaign } from "../campaignStore";
import logApiRequest from "../requestLogger";
import CampaignDetailsModal from "./CampaignDetailsModal";

const CampaignsPanel = ({ user, onRefreshStats, onCreateCampaign }) => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [dropdownState, setDropdownState] = useState({
    estado: false,
    tipo: false
  });
  const [selectedEstado, setSelectedEstado] = useState("Estado");
  const [selectedTipo, setSelectedTipo] = useState("Tipo");
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Opciones para los dropdowns
  const estadoOptions = ["Todas", "Activas", "Pausadas", "Terminadas"];
  const tipoOptions = ["Todos", "Mensajes", "Comentarios", "Seguimientos"];

  // Función para obtener las campañas
  const fetchCampaigns = useCallback(async () => {
    if (!user?.uid) return;
    
    try {
      setLoading(true);
      
      // Registrar la solicitud de carga de campañas
      await logApiRequest({
        endpoint: "internal/fetch_campaigns",
        requestData: {},
        userId: user.uid,
        status: "pending",
        source: "CampaignsPanel"
      });
      
      // Obtener campañas activas
      const active = await getActiveCampaigns(user.uid);
      
      // Obtener campañas recientes (incluye completadas, pausadas, etc.)
      const recent = await getRecentCampaigns(user.uid, 15);
      
      // Combinar y eliminar duplicados
      const allCampaigns = [...active];
      
      // Añadir campañas recientes que no estén ya en las activas
      recent.forEach(recentCampaign => {
        if (!allCampaigns.some(c => c.id === recentCampaign.id)) {
          allCampaigns.push(recentCampaign);
        }
      });
      
      // Actualizamos el estado
      setCampaigns(allCampaigns);
      
      // Registrar éxito
      await logApiRequest({
        endpoint: "internal/fetch_campaigns",
        requestData: {},
        userId: user.uid,
        responseData: { campaignsCount: allCampaigns.length },
        status: "success",
        source: "CampaignsPanel"
      });
      
    } catch (error) {
      console.error("Error al cargar campañas:", error);
      
      // Registrar error
      await logApiRequest({
        endpoint: "internal/fetch_campaigns",
        requestData: {},
        userId: user.uid,
        status: "error",
        source: "CampaignsPanel",
        metadata: {
          action: "fetch_campaigns",
          error: error.message
        }
      });
      
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Cargar campañas al montar el componente y cuando cambie el refreshKey
  useEffect(() => {
    if (user?.uid) {
      fetchCampaigns();
    }
  }, [fetchCampaigns, refreshKey, user]);

  // Programar actualizaciones periódicas si hay campañas activas
  useEffect(() => {
    const activeCampaignsCount = campaigns.filter(c => c.status === "processing").length;
    
    if (activeCampaignsCount > 0) {
      const intervalId = setInterval(() => {
        setRefreshKey(prev => prev + 1);
        
        // También actualizar estadísticas generales si hay una función para ello
        if (typeof onRefreshStats === 'function') {
          onRefreshStats();
        }
      }, 10000); // Actualizar cada 10 segundos
      
      return () => clearInterval(intervalId);
    }
  }, [campaigns, onRefreshStats]);

  // Función para cancelar una campaña
  const handleCancelCampaign = async (campaignId, e) => {
    e.stopPropagation(); // Evitar que el clic se propague al contenedor
    
    if (!window.confirm('¿Estás seguro de cancelar esta campaña?')) return;
    
    try {
      await logApiRequest({
        endpoint: "internal/cancel_campaign",
        requestData: { campaignId },
        userId: user.uid,
        status: "pending",
        source: "CampaignsPanel"
      });
      
      const success = await cancelCampaign(user.uid, campaignId);
      
      if (success) {
        setRefreshKey(prev => prev + 1);
        await logApiRequest({
          endpoint: "internal/cancel_campaign",
          requestData: { campaignId },
          userId: user.uid,
          status: "success",
          source: "CampaignsPanel"
        });
      } else {
        await logApiRequest({
          endpoint: "internal/cancel_campaign",
          requestData: { campaignId },
          userId: user.uid,
          status: "error",
          source: "CampaignsPanel"
        });
      }
    } catch (error) {
      console.error("Error al cancelar campaña:", error);
    }
  };

  // Manejar eliminación de campaña desde el modal
  const handleDeleteCampaign = (campaignId) => {
    // Actualizar la lista de campañas
    setCampaigns(prev => prev.filter(c => c.id !== campaignId));
  };

  // Abrir el modal de detalles
  const openDetailsModal = (campaign, e) => {
    e.stopPropagation(); // Evitar que el clic se propague
    setSelectedCampaign(campaign);
    setShowDetailsModal(true);
  };

  // Filtrar campañas según los filtros seleccionados
  const filteredCampaigns = campaigns.filter(campaign => {
    // Filtro por estado
    if (selectedEstado === "Activas" && campaign.status !== "processing") return false;
    if (selectedEstado === "Pausadas" && campaign.status !== "paused") return false;
    if (selectedEstado === "Terminadas" && 
      campaign.status !== "completed" && 
      campaign.status !== "cancelled" && 
      campaign.status !== "failed") return false;
    // Si es "Todas", no filtramos por estado
    
    // Filtro por tipo
    if (selectedTipo === "Mensajes" && campaign.campaignType !== "send_messages") return false;
    if (selectedTipo === "Comentarios" && campaign.campaignType !== "send_comments") return false;
    if (selectedTipo === "Seguimientos" && campaign.campaignType !== "follow_users") return false;
    // Si es "Todos", no filtramos por tipo
    
    return true;
  });

  // Función para abrir/cerrar un dropdown
  const toggleDropdown = (name, event) => {
    event.stopPropagation();
    setDropdownState(prev => ({
      estado: name === 'estado' ? !prev.estado : false,
      tipo: name === 'tipo' ? !prev.tipo : false
    }));
  };

  // Función para seleccionar una opción
  const selectOption = (name, value, event) => {
    event.stopPropagation();
    if (name === 'estado') {
      setSelectedEstado(value);
    } else if (name === 'tipo') {
      setSelectedTipo(value);
    }
    setDropdownState(prev => ({...prev, [name]: false}));
  };

  // Cerrar dropdowns al hacer clic fuera
  useEffect(() => {
    const closeDropdowns = () => {
      setDropdownState({estado: false, tipo: false});
    };
    
    document.addEventListener('click', closeDropdowns);
    return () => document.removeEventListener('click', closeDropdowns);
  }, []);

  // Función para mapear estado a estilo de badge
  const getStatusBadge = (status) => {
    switch (status) {
      case 'processing':
        return {
          text: 'Activa',
          className: 'bg-green-100 text-green-800'
        };
      case 'paused':
        return {
          text: 'Pausada',
          className: 'bg-yellow-100 text-yellow-800'
        };
      case 'completed':
        return {
          text: 'Terminada',
          className: 'bg-blue-100 text-blue-800'
        };
      case 'cancelled':
        return {
          text: 'Cancelada',
          className: 'bg-red-100 text-red-800'
        };
      case 'failed':
        return {
          text: 'Fallida',
          className: 'bg-red-100 text-red-800'
        };
      default:
        return {
          text: 'Desconocido',
          className: 'bg-gray-100 text-gray-800'
        };
    }
  };

  // Renderizar spinner de carga
  if (loading && campaigns.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        <span className="ml-2 text-gray-600">Cargando campañas...</span>
      </div>
    );
  }

  // Definir una clase común para los botones
  const buttonClass = "bg-white text-black py-2 px-3 sm:py-3 sm:px-4 md:py-4 md:px-6 rounded-full border border-gray-200 flex items-center gap-1 sm:gap-2 h-12 sm:h-14 md:h-16 text-sm sm:text-base md:text-lg whitespace-nowrap";
  const menuItemClass = "block w-full text-left px-3 sm:px-5 py-2 sm:py-3 text-black text-sm sm:text-base md:text-lg hover:bg-gray-50";

  return (
    <div className="w-full bg-[#edf0ff] min-h-screen">
      {/* Botones de filtro y acción */}
      <div className="flex flex-wrap gap-3 mb-6 px-3 sm:px-5 pt-4 sm:pt-6">
        {/* Nueva Campaña button */}
        <button 
          className={buttonClass}
          onClick={() => {
            console.log("Botón Nueva Campaña presionado");
            if (onCreateCampaign) {
              onCreateCampaign();
            } else {
              console.log("Error: onCreateCampaign no está definido");
            }
          }}
        >
          <img src="/assets/add-square.png" alt="Add" className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
          <span>Nueva Campaña</span>
        </button>
        
        {/* Estado dropdown */}
        <div className="relative">
          <button 
            className={buttonClass}
            onClick={(e) => toggleDropdown('estado', e)}
          >
            <span>{selectedEstado}</span>
            <svg 
              className={`w-4 h-4 sm:w-5 sm:h-5 ml-1 sm:ml-2 transition-transform duration-200 ${dropdownState.estado ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
            </svg>
          </button>
          
          {dropdownState.estado && (
            <div className="absolute top-full left-0 mt-1 w-48 sm:w-56 md:w-64 rounded-lg z-20 py-1 sm:py-2 bg-white shadow-lg">
              {estadoOptions.map((option) => (
                <button
                  key={option}
                  className="block w-full text-left px-3 sm:px-5 py-2 sm:py-3 text-black text-sm sm:text-base md:text-lg hover:bg-gray-200 whitespace-nowrap"
                  onClick={(e) => selectOption('estado', option, e)}
                >
                  {option}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Tipo dropdown */}
        <div className="relative">
          <button 
            className={buttonClass}
            onClick={(e) => toggleDropdown('tipo', e)}
          >
            <span>{selectedTipo}</span>
            <svg 
              className={`w-4 h-4 sm:w-5 sm:h-5 ml-1 sm:ml-2 transition-transform duration-200 ${dropdownState.tipo ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
            </svg>
          </button>
          
          {dropdownState.tipo && (
            <div className="absolute top-full left-0 mt-1 w-48 sm:w-56 md:w-64 rounded-lg z-20 py-1 sm:py-2 bg-white shadow-lg">
              {tipoOptions.map((option) => (
                <button
                  key={option}
                  className="block w-full text-left px-3 sm:px-5 py-2 sm:py-3 text-black text-sm sm:text-base md:text-lg hover:bg-gray-200 whitespace-nowrap"
                  onClick={(e) => selectOption('tipo', option, e)}
                >
                  {option}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Lista de campañas */}
      <div className="space-y-3 sm:space-y-4 md:space-y-5 px-3 sm:px-5">
        {filteredCampaigns.length === 0 ? (
          <div className="text-center py-6 sm:py-8 bg-white rounded-lg">
            <p className="text-gray-500">No hay campañas que coincidan con el filtro seleccionado.</p>
          </div>
        ) : (
          filteredCampaigns.map(campaign => {
            const statusBadge = getStatusBadge(campaign.status);
            const isActive = campaign.status === 'processing';
            const isCompleted = campaign.status === 'completed' || campaign.status === 'cancelled' || campaign.status === 'failed';
            
            return (
              <div 
                key={campaign.id}
                className="bg-white rounded-lg overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 md:p-5"
              >
                {/* Icono y nombre de campaña */}
                <div className="flex items-center w-full sm:w-auto">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-black rounded-lg flex items-center justify-center">
                    <img 
                      src="/assets/messages-2.png" 
                      alt="Mensajes" 
                      className="w-6 h-6 sm:w-8 sm:h-8 brightness-0 invert" 
                    />
                  </div>
                  <div className="ml-3 sm:ml-4 flex-grow">
                    <h3 className="font-medium text-base sm:text-lg text-black">
                      {campaign.name || "Campaña sin nombre"}
                    </h3>
                    <div className="flex items-center flex-wrap">
                      <p className="text-xs sm:text-sm text-gray-500 mr-2 sm:mr-3">
                        {campaign.status === 'processing' ? 'En proceso' : 
                        campaign.status === 'paused' ? 'En pausa' : 
                        campaign.status === 'completed' ? 'Completada' : 
                        campaign.status === 'cancelled' ? 'Cancelada' : 
                        campaign.status === 'failed' ? 'Fallida' : 'Estado desconocido'}
                      </p>
                      
                      {campaign.status === 'processing' && (
                        <div className="text-xs text-indigo-600">
                          {campaign.targetCount && `${campaign.totalProcessed || 0}/${campaign.targetCount} usuarios procesados`}
                        </div>
                      )}
                    </div>
  
                    {campaign.status === 'processing' && (
                      <div className="mt-1 w-full bg-gray-200 rounded-full h-1.5">
                        <div 
                          className="h-1.5 rounded-full bg-indigo-600"
                          style={{ width: `${campaign.progress || 0}%` }}
                        ></div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Estado y menú */}
                <div className="flex items-center mt-3 sm:mt-0 w-full sm:w-auto justify-between sm:justify-end">
                  <span className={`px-4 sm:px-6 md:px-8 py-2 sm:py-3 rounded-full text-xs sm:text-sm font-medium ${statusBadge.className}`}>
                    {statusBadge.text}
                  </span>
                  
                  {/* Botón de settings - Visible para todas las campañas */}
                  <button 
                    onClick={(e) => openDetailsModal(campaign, e)}
                    className="ml-2 sm:ml-4 text-gray-400 bg-transparent border-0 p-0"
                    title="Ver detalles de la campaña"
                  >
                    <img
                      src="/assets/setting-5.png"
                      alt="Opciones"
                      className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12"
                    />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal de detalles de campaña */}
      {showDetailsModal && selectedCampaign && (
        <CampaignDetailsModal
          isOpen={showDetailsModal}
          onClose={() => setShowDetailsModal(false)}
          campaignId={selectedCampaign.id}
          userId={user.uid}
          onDelete={handleDeleteCampaign}
        />
      )}
    </div>
  );
};

CampaignsPanel.propTypes = {
  user: PropTypes.object.isRequired,
  onRefreshStats: PropTypes.func,
  onCreateCampaign: PropTypes.func
};

export default CampaignsPanel;