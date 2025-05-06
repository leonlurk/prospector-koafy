import React, { useState, useEffect } from 'react';
// Remove useParams
// import { useParams } from 'react-router-dom'; 
import { useWhatsApp } from '../context/WhatsAppContext'; 
import { getAgent, updateAgent } from '../services/api';

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

  // useEffect to fetch data - uses PROPS agentId and user
  useEffect(() => {
    console.log("PersonaAIPage: Fetch Effect RUNNING", { agentId, userId: user?.uid });
    // Use the user prop passed down
    const userId = user?.uid;
    
    if (!userId || !agentId) { 
      console.log('PersonaAIPage: Waiting for userId or agentId prop...', { userId, agentId });
      setIsLoading(false); 
      setError("Falta ID de usuario o agente."); // More specific error
      return; 
    }

    setIsLoading(true);
    setError(null); 
    console.log(`PersonaAIPage: Fetching agent data for user: ${userId}, agent: ${agentId}`);

    getAgent(userId, agentId) // Use userId from prop
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

  const handleSave = async () => {
    const userId = user?.uid;
    if (!userId || !agentId) { 
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
        const response = await updateAgent(userId, agentId, updatedAgentData); // Use userId from prop
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

  return (
    // Removed outer Card, using the parent div from AgentDetailPage for background/border
    <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-8">
      
      {/* Section 1: Core Instructions & Name */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Agent Name (Read-only?) */}
          <div>
            <label htmlFor="agentName" className="block text-sm font-medium text-gray-700 mb-1">Nombre del Agente</label>
            <input
              type="text"
              id="agentName"
              name="agentName"
              value={personaData.agentName}
              onChange={handleChange}
              // readOnly // Make read-only if name is managed elsewhere
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
              rows={12} // Increased rows
              value={personaData.instructions}
              onChange={handleChange}
              placeholder={`Rol: "Eres un asistente virtual de ventas para una tienda de ropa."
Personalidad: "Actúa de forma amigable, entusiasta pero profesional."
Tono: "Usa un tono cercano y servicial, evita ser demasiado informal o robótico."
Estilo: "Escribe respuestas concisas y claras. Usa emojis con moderación."
Objetivo Principal: "Tu meta es ayudar a los clientes a encontrar productos, responder preguntas sobre tallas y stock, y guiarlos en el proceso de compra."
Tareas Específicas: "Puedes buscar productos por nombre o categoría. Puedes verificar el stock si te lo piden. No puedes procesar pagos directamente."
Restricciones/Reglas: "Nunca prometas descuentos que no existen. Si no sabes una respuesta, di que lo consultarás. No compartas información personal del cliente."`}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
            <p className="mt-1 text-xs text-gray-500">Proporciona instrucciones claras y detalladas. Puedes incluir ejemplos.</p>
          </div>
        </div>

        {/* Section 2: Model & Parameters */}
        <div className="lg:col-span-1 space-y-6">
          {/* Language Selection (Optional - could be part of instructions) -> Eliminado */}
          {/* El bloque del div para seleccionar idioma ha sido eliminado */}
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
  );
}
export default PersonaAIPage; 