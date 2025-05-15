import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { useWhatsApp } from '../context/WhatsAppContext'; 
import { getAgent, updateAgent, generateAssistedPrompt } from '../services/api';
import PromptHelperModal from '../components/PromptHelperModal';
import { useTemporaryAgent } from '../context/TemporaryAgentContext';

// --- Icon Placeholder ---
const ArrowPathIcon = (props) => (
 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
</svg>
);

// --- Simple Snackbar Component ---
const Snackbar = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000); // Auto-close after 3 seconds
    return () => clearTimeout(timer);
  }, [onClose]);

  const baseStyle = {
    position: 'fixed',
    top: '20px',
    right: '20px',
    padding: '10px 20px',
    borderRadius: '5px',
    color: 'white',
    zIndex: 1050, // Ensure it's above other elements like modals
    boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
    transition: 'transform 0.3s ease-in-out',
  };

  const typeStyles = {
    success: { backgroundColor: '#4CAF50' }, // Green
    error: { backgroundColor: '#F44336' },   // Red
  };

  return (
    <div style={{ ...baseStyle, ...typeStyles[type] }}>
      {message}
    </div>
  );
};

// Accept agentId and user as props, or get from URL params
function PersonaAIPage({ agentId: propAgentId, user: propUser, setSelectedOption }) { 
  let params = {};
  let location = { pathname: '' };

  try {
    // These may fail if React Router is not available
    params = useParams() || {};
    location = useLocation() || { pathname: '' };
  } catch (error) {
    console.log("React Router hooks not available");
  }

  const urlAgentId = params.agentId;
  
  // Use prop agentId if provided, otherwise use from URL
  const agentId = propAgentId || urlAgentId;
  
  // Determinar si estamos trabajando con un agente temporal
  const isTemporary = agentId === 'temp';
  
  const { currentUser } = useWhatsApp();
  const user = propUser || currentUser;
  
  // Use temporary agent context if available, but don't require it
  const {
    temporaryAgent, 
    updateTemporaryAgent, 
    persistTemporaryAgent, 
    isLoading: isTemporaryAgentLoading 
  } = useTemporaryAgent();
  
  const [personaData, setPersonaData] = useState({
    agentName: '',
    instructions: '', 
    language: 'es',
  });
  const [originalAgentData, setOriginalAgentData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Modal state
  const [showPromptHelperModal, setShowPromptHelperModal] = useState(false);
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
  const [promptHelperError, setPromptHelperError] = useState(null);

  // Snackbar state
  const [snackbar, setSnackbar] = useState({ open: false, message: '', type: 'success' });

  const showSnackbar = (message, type = 'success') => {
    setSnackbar({ open: true, message, type });
  };

  const closeSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // useEffect to handle temporary agent vs. fetching existing agent
  useEffect(() => {
    console.log("PersonaAIPage: Mount Effect RUNNING", { agentId, isTemporary, temporaryAgent });
    
    if (isTemporary && temporaryAgent) {
      // If we're in the temporary agent flow, use the data from context
      console.log("PersonaAIPage: Usando datos del agente temporal");
      setPersonaData({
        agentName: temporaryAgent.persona?.name || 'Nuevo Agente',
        instructions: temporaryAgent.persona?.instructions || '',
        language: temporaryAgent.persona?.language || 'es'
      });
      setOriginalAgentData(temporaryAgent);
      return;
    }
    
    // If we're NOT working with a temporary agent, proceed with normal fetch
    const userIdToUse = user?.uid;
    
    if (!userIdToUse || !agentId || agentId === 'temp') { 
      console.log('PersonaAIPage: Waiting for userId or agentId...', { userId: userIdToUse, agentId });
      setIsLoading(false);
      if (!isTemporary) {
        showSnackbar("Falta ID de usuario o agente.", "error");
      }
      return; 
    }

    setIsLoading(true);
    console.log(`PersonaAIPage: Fetching agent data for user: ${userIdToUse}, agent: ${agentId}`);

    getAgent(userIdToUse, agentId)
      .then(response => {
        if (response.success && response.data && response.data.data) {
          const agent = response.data.data; 
          setOriginalAgentData(agent); 
          setPersonaData({
            agentName: agent.persona?.name || `Agente ${agentId}`,
            instructions: agent.persona?.instructions || '', 
            language: agent.persona?.language || 'es'
          });
        } else {
          console.error("PersonaAIPage: Error fetching agent data:", response.message);
          showSnackbar(response.message || 'No se pudieron cargar los datos del agente.', "error");
          setPersonaData(prev => ({ ...prev, agentName: `Agente ${agentId}`})); 
        }
      })
      .catch(error => {
          console.error("PersonaAIPage: Error cargando datos del agente:", error);
          showSnackbar(error.message || 'Error de red al cargar los datos del agente.', "error");
      })
      .finally(() => setIsLoading(false));
  }, [agentId, user, isTemporary, temporaryAgent]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    console.log(`PersonaAIPage: handleChange - Field: ${name}, New Value: ${value}`);
    
    // Actualizar el estado local
    setPersonaData(prev => {
      const newState = {
          ...prev,
          [name]: value
      };
      
      // Solo actualizar temporaryAgent si es necesario y no en cada keystroke
      if (isTemporary && temporaryAgent && updateTemporaryAgent && 
          // Solo actualizamos después de un pequeño delay para evitar actualizaciones excesivas
          (name === 'agentName' || value.length % 10 === 0 || value.length === 0)) {
        
        setTimeout(() => {
          updateTemporaryAgent({
            persona: {
              ...temporaryAgent.persona,
              [name === 'agentName' ? 'name' : name]: value
            }
          });
        }, 300);
      }
      
      return newState;
    });
  };

  // Añadir un manejador de onBlur para actualizar temporaryAgent al perder el foco
  const handleBlur = (e) => {
    const { name, value } = e.target;
    
    // Actualizar temporaryAgent cuando el input pierde el foco
    if (isTemporary && temporaryAgent && updateTemporaryAgent) {
      updateTemporaryAgent({
        persona: {
          ...temporaryAgent.persona,
          [name === 'agentName' ? 'name' : name]: value
        }
      });
    }
  };

  // Modal Handlers
  const handleOpenPromptHelper = () => {
    setPromptHelperError(null);
    setShowPromptHelperModal(true);
  };

  const handleClosePromptHelper = () => {
    setShowPromptHelperModal(false);
  };

  const handleSubmitPromptHelper = async (formData) => {
    const userIdToUse = user?.uid;
    if (!userIdToUse) {
        setPromptHelperError("Usuario no autenticado.");
        alert("Error: Usuario no autenticado. No se puede generar el prompt."); 
        return;
    }
    setIsGeneratingPrompt(true);
    setPromptHelperError(null);
    try {
        const apiResponse = await generateAssistedPrompt(userIdToUse, formData);
        if (apiResponse.success && apiResponse.data && apiResponse.data.generatedPrompt) {
            setPersonaData(prevData => ({
                ...prevData,
                instructions: apiResponse.data.generatedPrompt 
            }));
            setShowPromptHelperModal(false);
            showSnackbar("Prompt generado y aplicado con éxito.", "success");
        } else {
            const errorMessage = apiResponse.data?.message || apiResponse.message || "Error al generar el prompt.";
            setPromptHelperError(errorMessage);
            alert(`Error del Asistente: ${errorMessage}`);
        }
    } catch (err) {
        const errorMessage = err.message || "Ocurrió un error inesperado al generar el prompt.";
        setPromptHelperError(errorMessage);
        alert(`Error del Asistente: ${errorMessage}`);
    }
    setIsGeneratingPrompt(false);
  };

  const handleSave = async () => {
    const userIdToUse = user?.uid;
    if (!userIdToUse) { 
      showSnackbar("No se puede guardar: falta información del usuario.", "error");
      return;
    }
    if (!personaData.agentName || personaData.agentName.trim() === '') {
        showSnackbar("El nombre del agente no puede estar vacío.", "error");
        return;
    }

    setIsSaving(true);
    console.log("PersonaAIPage: Saving Persona IA:", { isTemporary, agentId });

    // Create payload based on persona data
    const personaPayload = {
        name: personaData.agentName,
        instructions: personaData.instructions,
        language: personaData.language,
    };
    
    try {
      let response;
      
      if (isTemporary && temporaryAgent && persistTemporaryAgent) {
        // If this is a temporary agent, persist it to the database
        console.log("PersonaAIPage: Saving temporary agent to database");
        response = await persistTemporaryAgent(userIdToUse);
        
        // For temporary agents being saved for the first time, we'll need to redirect to 
        // the permanent URL with the new agent ID
        if (response.success && response.agentId) {
          // Navigate to the permanent URL with the new agent ID
          showSnackbar("Agente guardado con éxito. Redirigiendo...", "success");
          setTimeout(() => {
            window.location.href = `/agents/${response.agentId}/persona`;
          }, 1500);
          return;
        }
      } else {
        // If this is an existing agent, update it
        if (!originalAgentData) {
          showSnackbar("Error: No se cargaron los datos originales del agente. No se puede guardar.", "error");
          setIsSaving(false);
          return;
        }

        // Create a deep copy to avoid mutating originalAgentData
        const updatedAgentData = JSON.parse(JSON.stringify(originalAgentData));
        updatedAgentData.persona = personaPayload;
        
        console.log("PersonaAIPage: Updating existing agent", updatedAgentData);
        response = await updateAgent(userIdToUse, agentId, updatedAgentData);
        
        if (response.success && response.data?.success) { 
          console.log("PersonaAIPage: Agente actualizado con éxito");
          if (response.data.data) {
              setOriginalAgentData(response.data.data);
              setPersonaData({
                  agentName: response.data.data.persona?.name || `Agente ${agentId}`,
                  instructions: response.data.data.persona?.instructions || '', 
                  language: response.data.data.persona?.language || 'es'
              });
          }
        }
      }
      
      // Handle response and show appropriate message
      if (response && response.success) {
        showSnackbar("Cambios guardados con éxito.", "success");
      } else if (response) {
        console.error("PersonaAIPage: Error al guardar agente:", response.message);
        showSnackbar(response.message || 'Error al guardar los cambios.', "error");
      } else {
        // No response, likely temp agent provider not available
        showSnackbar("Agente guardado con éxito.", "success");
      }
    } catch(error) {
      console.error("PersonaAIPage: Error de red al guardar agente:", error);
      showSnackbar(error.message || 'Error de red al guardar los cambios.', "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveTemporaryAgent = async () => {
    console.log("PersonaAIPage: Guardando agente temporal con datos:", {
      personaData,
      temporaryAgent,
      userId: user?.uid,
      isTemporary
    });
    
    // Actualizar el agente temporal en el contexto
    updateTemporaryAgent({
      persona: {
        ...temporaryAgent.persona,
        name: personaData.agentName,
        instructions: personaData.instructions,
        language: personaData.language
      }
    });
    
    // Si hay un userId y estamos en modo temporal, persistir el agente
    if (user?.uid && isTemporary) {
      setIsSaving(true);
      try {
        const result = await persistTemporaryAgent(user.uid);
        if (result.success) {
          setIsSaving(false);
          showSnackbar("Agente guardado con éxito", "success");
          // Redirigir a la página de detalles del nuevo agente
          setSelectedOption(`SetterAgentDetail_Persona_${result.agentId}`);
        } else {
          setIsSaving(false);
          showSnackbar(result.message || "Error al guardar el agente", "error");
        }
      } catch (error) {
        setIsSaving(false);
        showSnackbar(error.message || "Error al guardar el agente", "error");
      }
    }
  };

  console.log("PersonaAIPage: RENDERING", { personaData, isTemporary, temporaryAgent });

  // Show loading state
  if (isLoading || (isTemporary && isTemporaryAgentLoading)) {
    return <p className="text-center text-gray-500 py-10">Cargando datos de persona...</p>;
  }

  // Ensure userIdToUse is defined for passing to the modal
  const userIdToUse = user?.uid;

  return (
    <>
      {snackbar.open && (
        <Snackbar
          message={snackbar.message}
          type={snackbar.type}
          onClose={closeSnackbar}
        />
      )}
      <form onSubmit={(e) => { 
        e.preventDefault(); 
        isTemporary ? handleSaveTemporaryAgent() : handleSave();
      }} className="space-y-8">
        {/* Section 1: Core Instructions & Name */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Agent Name */}
            <div>
              <label htmlFor="agentName" className="block text-sm font-medium text-gray-700 mb-1">Nombre del Agente</label>
              <input
                type="text"
                id="agentName"
                name="agentName"
                value={personaData.agentName}
                onChange={handleChange}
                onBlur={handleBlur}
                className="block w-full h-10 px-3 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-black focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Nombre visible del Agente"
              />
            </div>
            
            {/* Main Instructions Textarea */}
            <div>
              <label htmlFor="instructions" className="block text-sm font-medium text-gray-700 mb-1">Instrucciones Principales (Prompt del Sistema)</label>
              <textarea
                id="instructions"
                name="instructions"
                rows={12}
                value={personaData.instructions}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder={`Rol: "Eres un asistente virtual de ventas para una tienda de ropa."\nPersonalidad: "Actúa de forma amigable, entusiasta pero profesional."\nTono: "Usa un tono cercano y servicial, evita ser demasiado informal o robótico."\nEstilo: "Escribe respuestas concisas y claras. Usa emojis con moderación."\nObjetivo Principal: "Tu meta es ayudar a los clientes a encontrar productos, responder preguntas sobre tallas y stock, y guiarlos en el proceso de compra."\nTareas Específicas: "Puedes buscar productos por nombre o categoría. Puedes verificar el stock si te lo piden. No puedes procesar pagos directamente."\nRestricciones/Reglas: "Nunca prometas descuentos que no existen. Si no sabes una respuesta, di que lo consultarás. No compartas información personal del cliente.""`}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
              <p className="mt-1 text-xs text-gray-500">Proporciona instrucciones claras y detalladas. Puedes incluir ejemplos.</p>
              {/* Modal Trigger Button */}
              <button 
                type="button"
                onClick={handleOpenPromptHelper} 
                className="mt-3 inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-500 hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 00-1 1v2.586l-1.707-1.707a1 1 0 00-1.414 1.414L7.586 8H5a1 1 0 000 2h2.586l-1.707 1.707a1 1 0 001.414 1.414L9 11.414V14a1 1 0 002 0v-2.586l1.707 1.707a1 1 0 001.414-1.414L12.414 10H15a1 1 0 000-2h-2.586l1.707-1.707a1 1 0 00-1.414-1.414L11 5.586V4a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Asistente de Prompt IA
              </button>
              {promptHelperError && <p className="mt-2 text-xs text-red-600">Error del Asistente: {promptHelperError}</p>}
            </div>
          </div>

          {/* Section 2: Model & Parameters (was lg:col-span-1) */}
          <div className="lg:col-span-1 space-y-6">
            {/* Content for this section, if any, or it can be removed if not used */}
          </div>
        </div>

        {/* Save Button Area */}
        <div className="pt-6 flex justify-end border-t border-gray-200 mt-8">
           <button 
              type="submit" 
              disabled={isSaving || isLoading} // Also disable if initially loading
              className="inline-flex items-center justify-center px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
           >
             {(isSaving || isLoading) ? ( // Show spinner if saving or initial loading
                <ArrowPathIcon className="animate-spin w-5 h-5 mr-2" />
             ) : null}
             {isSaving ? 'Guardando...' : (isLoading ? 'Cargando...' : 'Guardar Cambios')}
           </button>
         </div>
      </form>

      {/* Modal Component Render - Moved outside the form */}
      {showPromptHelperModal && (
        <PromptHelperModal
          isOpen={showPromptHelperModal}
          onClose={handleClosePromptHelper}
          onSubmit={handleSubmitPromptHelper}
          isLoading={isGeneratingPrompt}
          userId={userIdToUse} // Pass defined userIdToUse
        />
      )}
    </>
  );
}

export default PersonaAIPage; 