import React, { useState, useEffect } from 'react';
// Remove useParams
// import { useParams } from 'react-router-dom'; 
import { useWhatsApp } from '../context/WhatsAppContext'; 
import { getAgent, updateAgent, generateAssistedPrompt } from '../services/api';
import PromptHelperModal from '../components/PromptHelperModal';

// --- Icon Placeholder ---
const ArrowPathIcon = (props) => (
 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
</svg>
);

// Accept agentId and user as props
function PersonaAIPage({ agentId, user }) { 
  // const { agentId } = useParams(); // <-- REMOVE this line
  const { currentUser } = useWhatsApp(); // Keep context for fallback if needed, or remove if user prop is guaranteed
  const [personaData, setPersonaData] = useState({
    agentName: '',
    instructions: '', // Combined Role, Tone, Style, Guidelines into one main instruction field
    language: 'es', // Keep language if needed separately
  });
  const [originalAgentData, setOriginalAgentData] = useState(null); // <<< AÑADIDO: Guardar datos originales del agente
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null); // <<< AÑADIDO: Estado para errores

  // <<< ADD State for Prompt Helper Modal >>>
  const [showPromptHelperModal, setShowPromptHelperModal] = useState(false);
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
  const [promptHelperError, setPromptHelperError] = useState(null);

  // useEffect to fetch data - uses PROPS agentId and user
  useEffect(() => {
    console.log("PersonaAIPage: Fetch Effect RUNNING", { agentId, userId: user?.uid });
    // Use the user prop passed down
    const userIdToUse = user?.uid || currentUser?.uid; // Ensure we have a userId
    
    if (!userIdToUse || !agentId) { 
      console.log('PersonaAIPage: Waiting for userId or agentId prop...', { userId: userIdToUse, agentId });
      setIsLoading(false); 
      setError("Falta ID de usuario o agente."); // More specific error
      return; 
    }

    setIsLoading(true);
    setError(null); 
    console.log(`PersonaAIPage: Fetching agent data for user: ${userIdToUse}, agent: ${agentId}`);

    getAgent(userIdToUse, agentId) // Use userId from prop
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
          setError(response.message || 'No se pudieron cargar los datos del agente.');
          setPersonaData(prev => ({ ...prev, agentName: `Agente ${agentId}`})); 
        }
      })
      .catch(error => {
          console.error("PersonaAIPage: Error cargando datos del agente:", error);
          setError(error.message || 'Error de red al cargar los datos del agente.');
      })
      .finally(() => setIsLoading(false));
    // Depend on the props agentId and user object
  }, [agentId, user]); 

  const handleChange = (e) => {
    const { name, value } = e.target;
    console.log(`PersonaAIPage: handleChange - Field: ${name}, New Value: ${value}`); // Log change
    setPersonaData(prev => {
      const newState = {
          ...prev,
          [name]: value
      };
      console.log("PersonaAIPage: handleChange - Setting new state:", newState); // Log state update
      return newState;
    });
  };

  // <<< ADD Modal Handlers >>>
  const handleOpenPromptHelper = () => {
    setPromptHelperError(null);
    setShowPromptHelperModal(true);
  };

  const handleClosePromptHelper = () => {
    setShowPromptHelperModal(false);
  };

  const handleSubmitPromptHelper = async (formData) => {
    const userIdToUse = user?.uid || currentUser?.uid;
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
            setShowPromptHelperModal(false); // Close modal on success
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
    const userIdToUse = user?.uid || currentUser?.uid; // Ensure we have a userId
    if (!userIdToUse || !agentId) { 
      setError("No se puede guardar: falta información del usuario o agente.");
      return;
    }
    if (!personaData.agentName || personaData.agentName.trim() === '') {
        setError("El nombre del agente no puede estar vacío.");
        return;
    }

    setIsSaving(true);
    setError(null);
    console.log("PersonaAIPage: Saving Persona IA for agent:", agentId);

    // --- Log the instructions state right before creating the payload ---
    console.log("PersonaAIPage: Instructions state before creating payload:", personaData.instructions);
    // -------------------------------------------------------------------

    const personaPayload = {
        name: personaData.agentName,
        instructions: personaData.instructions,
        language: personaData.language,
    };
    
    if (!originalAgentData) {
        setError("Error: No se cargaron los datos originales del agente. No se puede guardar.");
        setIsSaving(false);
        return;
    }

    const updatedAgentData = JSON.parse(JSON.stringify(originalAgentData));
    updatedAgentData.persona = personaPayload;
    // delete updatedAgentData.id; // Keep or remove based on API needs

    console.log("PersonaAIPage: API Payload (Full Agent Object):", updatedAgentData);

    try {
        const response = await updateAgent(userIdToUse, agentId, updatedAgentData); // Use userId from prop
        if (response.success && response.data?.success) { 
            console.log("PersonaAIPage: Agente actualizado con éxito");
            if (response.data.data) {
                setOriginalAgentData(response.data.data);
            }
           // Add a success notification/message here
        } else {
             console.error("PersonaAIPage: Error al guardar agente:", response.data?.message || response.message);
             setError(response.data?.message || response.message || 'Error al guardar los cambios.');
        }
    } catch(error) {
        console.error("PersonaAIPage: Error de red al guardar agente:", error);
        setError(error.message || 'Error de red al guardar los cambios.');
    } finally {
        setIsSaving(false);
    }
  };

  console.log("PersonaAIPage: RENDERING with personaData:", personaData); // Log on every render

  if (isLoading) {
    return <p className="text-center text-gray-500 py-10">Cargando datos de persona...</p>;
  }

  // Ensure userIdToUse is defined for passing to the modal
  const userIdToUse = user?.uid || currentUser?.uid;

  return (
    <>
      <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-8">
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
              disabled={isSaving}
              className="inline-flex items-center justify-center px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
           >
             {isSaving ? (
                <ArrowPathIcon className="animate-spin w-5 h-5 mr-2" />
             ) : null}
             {isSaving ? 'Guardando...' : 'Guardar Cambios'}
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
          userId={userIdToUse} 
        />
      )}
    </>
  );
}
export default PersonaAIPage; 