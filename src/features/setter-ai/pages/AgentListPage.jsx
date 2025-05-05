import React, { useState, useEffect, useCallback } from 'react';
import { useWhatsApp } from '../context/WhatsAppContext';
import { getAgents, createAgent, setActiveAgent, getActiveAgent } from '../services/api';
import OptionCard from '../components/OptionCard';
import agentImageUrl from '../assets/agent.png';

// --- Placeholder Icons --- 
const SearchIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
  </svg>
);

const ChevronDownIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
  </svg>
);

const UserGroupIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.008-2.72c.065-.916.343-1.797.788-2.596l.088-.114m-4.056 2.72a3 3 0 00-4.682 2.72m0 0a3 3 0 00-4.682-2.72m2.943-2.72a3 3 0 014.682 0m0 0a3 3 0 01-.479 3.741M12 12a3 3 0 11-6 0 3 3 0 016 0zM14.25 9a3 3 0 11-6 0 3 3 0 016 0zM4.5 19.5a3 3 0 00-3-3v-1.5a3 3 0 003 3h1.5a3 3 0 003-3v-1.5a3 3 0 00-3-3H4.5m6.75 6a3 3 0 01-3-3v-1.5a3 3 0 013-3h1.5a3 3 0 013 3v1.5a3 3 0 01-3 3h-1.5zm5.25 3.75a3 3 0 00-3-3v-1.5a3 3 0 003-3h1.5a3 3 0 003 3v1.5a3 3 0 00-3 3h-1.5z" />
  </svg>
);

const AdjustmentsHorizontalIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
  </svg>
);

const CheckCircleIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const BoltIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
  </svg>
);

const ArrowPathIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
  </svg>
);

const PlusCircleIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const BuildingOfficeIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h18M3 7.5h18M3 12h18m-4.5 4.5h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75" />
  </svg>
);

const ShoppingCartIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
  </svg>
);

const TagIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
  </svg>
);

const HeartIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
  </svg>
);

const PencilSquareIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
  </svg>
);

const ArrowLeftIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
  </svg>
);

// --- Template Data Placeholder --- 
// Prompts mejorados para mayor efectividad inicial
const agentTemplates = {
    inmobiliaria: {
        persona: {
            name: "Asesor Inmobiliario Virtual Pro",
            instructions: `Eres un asistente virtual experto en el sector inmobiliario de [Nombre de tu Agencia/Zona]. \
Tu objetivo principal es ayudar a los usuarios a encontrar propiedades que coincidan con sus necesidades, responder preguntas detalladas sobre listados (precio, características, ubicación, disponibilidad) y agendar visitas o llamadas con un agente humano. \
Actúa de forma profesional, cortés y eficiente. \
Puedes preguntar sobre presupuesto, tipo de propiedad deseada (venta/alquiler, casa/apartamento), número de habitaciones, zonas de interés y otras características relevantes. \
NO proporciones asesoramiento legal ni financiero. \
Si te preguntan por algo fuera de tu alcance, indica amablemente que un agente humano se pondrá en contacto. Finaliza la conversación recopilando los datos de contacto (nombre, teléfono, email) para el seguimiento.`,
            model: 'gpt-4', temperature: 0.7, language: 'es'
        },
        knowledge: {}
    },
    ecommerce: {
        persona: {
            name: "Asistente de Compras Online",
            instructions: `Eres un asistente de compras virtual para la tienda online [Nombre de tu Tienda]. \
Tu meta es mejorar la experiencia de compra ayudando a los clientes a encontrar productos, comparar características, responder preguntas sobre tallas, stock, materiales y políticas de envío/devolución. \
Utiliza un tono amigable, servicial y entusiasta. \
Puedes buscar productos por nombre, categoría o describiendo lo que el cliente busca. Puedes recomendar productos similares o complementarios. \nVerifica siempre la disponibilidad antes de confirmar. \
NO puedes procesar pagos directamente ni aplicar descuentos no autorizados. \
Si un cliente tiene un problema complejo con un pedido, recopila los detalles y escala la consulta al equipo de soporte humano.`,
            model: 'gpt-4', temperature: 0.7, language: 'es'
        },
        knowledge: {}
    },
    tienda: {
        persona: {
            name: "Vendedor de Tienda Amigable",
            instructions: `Eres un asistente virtual que representa a [Nombre de tu Tienda Física/Online]. \
Tu función es similar a la de un vendedor en tienda: dar la bienvenida a los clientes, entender qué buscan, responder preguntas sobre productos específicos (características, precio, ventajas), informar sobre promociones actuales y ayudarles a tomar una decisión de compra. \
Sé amable, paciente y proactivo. \
Puedes preguntar sobre las necesidades o gustos del cliente para ofrecer recomendaciones personalizadas. \
Si la tienda es física, puedes informar sobre horarios y ubicación. \
NO inventes información sobre productos ni hagas promesas que no se puedan cumplir. Si no conoces un detalle, indica que lo verificarás. \
Puedes guiar al cliente sobre cómo añadir productos al carrito o finalizar la compra si es online.`,
            model: 'gpt-4', temperature: 0.7, language: 'es'
        },
        knowledge: {}
    },
    salud: {
        persona: {
            name: "Informador de Bienestar",
            instructions: `Eres un asistente virtual informativo sobre salud y bienestar general, asociado a [Nombre de tu Organización/Clínica/Plataforma]. \
Tu propósito es proporcionar información clara y basada en fuentes confiables sobre hábitos saludables, prevención de enfermedades comunes, nutrición básica y manejo del estrés. \
Utiliza un tono empático, cuidadoso y neutral. \
**MUY IMPORTANTE:** NO eres un profesional médico. NO diagnostiques condiciones, NO prescribas tratamientos, NO interpretes resultados médicos y NO reemplaces la consulta con un médico o especialista. Siempre debes redirigir al usuario a consultar con un profesional de la salud para cualquier preocupación médica específica o consejo personalizado. Puedes ofrecer información general sobre condiciones, pero siempre enfatizando la necesidad de consulta profesional.`,
            model: 'gpt-4', temperature: 0.7, language: 'es'
        },
        knowledge: {}
    },
    blog: {
        persona: {
            name: "Asistente Creativo de Contenido",
            instructions: `Eres un asistente de IA especializado en la creación y desarrollo de contenido para blogs, trabajando para [Nombre del Blog/Agencia]. \
Tu tarea es ayudar a generar ideas para nuevos artículos, crear esquemas detallados, redactar borradores iniciales, sugerir títulos atractivos y optimizar textos para SEO (si se te proporcionan palabras clave). \
Adopta un tono creativo, colaborativo y organizado. \
Puedes investigar temas específicos (basándote en tu conocimiento general o fuentes proporcionadas), estructurar la información de forma lógica y adaptar el estilo de escritura al tema o audiencia objetivo. \
Pregunta por el tema principal, el público objetivo, el tono deseado y cualquier requisito específico (longitud, palabras clave). \
NO publiques contenido directamente. Tu rol es asistir en la creación del borrador para revisión humana.`,
            model: 'gpt-4', temperature: 0.7, language: 'es'
        },
        knowledge: {}
    },
};
// -------------------------------

function AgentListPage({ setSelectedOption }) {
  console.log('[AgentListPage] Component rendered. typeof setSelectedOption:', typeof setSelectedOption);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('all');
  const { currentUser } = useWhatsApp();
  const [agents, setAgents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeAgentId, setActiveAgentId] = useState(null);
  const [activatingAgentId, setActivatingAgentId] = useState(null);
  
  // State to control view toggle
  const [showInitialCreationView, setShowInitialCreationView] = useState(false);
  const [isCreatingAgent, setIsCreatingAgent] = useState(false); // Loading state for creation

  useEffect(() => {
    if (!currentUser?.uid) {
      setIsLoading(false);
      setAgents([]);
      setActiveAgentId(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    setAgents([]);
    setActiveAgentId(null);

    const loadAgents = getAgents(currentUser.uid);
    const loadActiveAgent = getActiveAgent(currentUser.uid);

    Promise.all([loadAgents, loadActiveAgent])
      .then(([agentsResponse, activeAgentResponse]) => {
        if (agentsResponse.success && agentsResponse.data?.success && Array.isArray(agentsResponse.data.data)) {
          setAgents(agentsResponse.data.data);
        } else {
          setError(prev => prev ? `${prev}
Error agentes: ${agentsResponse.data?.message || agentsResponse.message}` : `Error al cargar agentes: ${agentsResponse.data?.message || agentsResponse.message}`);
          setAgents([]);
        }

        if (activeAgentResponse.success && activeAgentResponse.data?.success) {
          setActiveAgentId(activeAgentResponse.data.activeAgentId || null);
        } else if (activeAgentResponse.data?.message !== 'No active agent found for this user.') {
          console.warn("Error al obtener agente activo:", activeAgentResponse.data?.message || activeAgentResponse.message);
          setActiveAgentId(null);
        }
      })
      .catch(err => {
        console.error("Error cargando datos iniciales:", err);
        setError(err.message || "Error de red al cargar datos iniciales");
        setAgents([]);
        setActiveAgentId(null);
      })
      .finally(() => {
        setIsLoading(false);
      });

  }, [currentUser]);

  const handleActivateAgent = async (agentIdToActivate) => {
      if (!currentUser?.uid || !agentIdToActivate) return;
      
      setActivatingAgentId(agentIdToActivate);
      setError(null);

      try {
          const response = await setActiveAgent(currentUser.uid, agentIdToActivate);
          if (response.success && response.data?.success) {
              setActiveAgentId(agentIdToActivate);
          } else {
               setError(response.data?.message || response.message || "Error al activar el agente");
          }
      } catch (err) {
           setError(err.message || "Error de red al activar el agente");
      } finally {
           setActivatingAgentId(null);
      }
  };

  // Modified: Navigate to creation view instead of direct API call
  const handleNavigateToCreate = () => {
      setShowInitialCreationView(true);
  };

  // Added: Handle selection from the creation view
  const handleCreationOptionClick = useCallback(async (optionType, templateKey = null) => {
    console.log('[handleCreationOptionClick] Clicked! Option:', optionType, 'Template:', templateKey);
    console.log('[handleCreationOptionClick] Checking typeof setSelectedOption before call:', typeof setSelectedOption);

    if (!currentUser?.uid || isCreatingAgent) return;

    setIsCreatingAgent(true);
    setError(null); 

    if (optionType === 'scratch') {
      console.log("[handleCreationOptionClick] Navigating to agent description setup view...");
      if (typeof setSelectedOption === 'function') {
          setSelectedOption('SetterAgentDescriptionSetup'); 
      } else {
          console.error("[handleCreationOptionClick] setSelectedOption is NOT a function!");
      }
      setIsCreatingAgent(false); 

    } else if (optionType === 'template' && templateKey && agentTemplates[templateKey]) {
      const templateData = agentTemplates[templateKey];
      console.log(`[handleCreationOptionClick] Intentando crear desde plantilla: ${templateKey}`);
      console.log('[handleCreationOptionClick] Datos a enviar (plantilla):', JSON.stringify(templateData, null, 2)); 

      if (!templateData.persona?.name || typeof templateData.knowledge === 'undefined') {
          console.error("[handleCreationOptionClick] Error: Datos de plantilla incompletos antes de enviar.", templateData);
          setError(`Datos incompletos en la plantilla '${templateKey}'.`);
          setIsCreatingAgent(false);
          return;
      }

      try {
        const response = await createAgent(currentUser.uid, templateData); 
          if (response.success && response.data?.success && response.data.data?.id) {
              const newAgentId = response.data.data.id;
          console.log('[handleCreationOptionClick] Template created, calling setSelectedOption. Type:', typeof setSelectedOption);
          if (typeof setSelectedOption === 'function') {
              setSelectedOption(`SetterAgentDetail_Persona_${newAgentId}`);
          } else {
             console.error("[handleCreationOptionClick] setSelectedOption is NOT a function here either!");
          }
        } else {
          setError(response.data?.message || response.message || `Error al crear agente desde plantilla ${templateKey}`);
        }
      } catch (error) {
        setError(error.message || `Error de red al crear desde plantilla ${templateKey}`);
      } finally {
        setIsCreatingAgent(false);
      }
    } else {
         console.warn("Opción de creación no válida o faltan datos:", optionType, templateKey);
         setIsCreatingAgent(false); 
    }
  }, [currentUser, isCreatingAgent, setSelectedOption]);

  const filteredAgents = agents.filter(agent => 
    (agent.persona?.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (agent.handle?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );
  
  // --- RENDER LOGIC ---

  const renderAgentListView = () => (
    <>
      {/* Header with Search, Filter, and NEW Button */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
         {/* Search Input */}
        <div className="relative w-full md:w-1/2 lg:w-1/3">
          <input 
            type="text"
            placeholder="Buscar Perfil"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-12 pl-12 pr-4 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 text-sm shadow-sm"
          />
          <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        </div>
         {/* Filter and New Agent Button */}
        <div className="flex items-center gap-4 w-full md:w-auto">
           {/* Platform Select */}
          <div className="relative">
            <select 
              value={selectedPlatform}
              onChange={(e) => setSelectedPlatform(e.target.value)}
              className="appearance-none h-12 w-full md:w-auto pl-4 pr-10 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 text-sm shadow-sm"
            >
              <option value="all">Plataformas</option>
              <option value="instagram">Instagram</option>
              <option value="whatsapp">WhatsApp</option>
            </select>
            <ChevronDownIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          </div>
           {/* Modified Button */}
          <button 
             onClick={handleNavigateToCreate} // Changed onClick handler
             disabled={isLoading || !currentUser} // Keep disabled logic
            className="flex items-center justify-center h-12 px-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm transition duration-150 text-sm font-medium whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <UserGroupIcon className="w-5 h-5 mr-2" />
            Nuevo Agente
          </button>
        </div>
      </div>

       {/* Agent List */}
        <div className="space-y-4">
         {filteredAgents.map((agent) => {
              const isActive = agent.id === activeAgentId;
              const isActivating = agent.id === activatingAgentId;
              return (
                <div key={agent.id} className="bg-white rounded-xl shadow-md p-5 hover:shadow-lg transition duration-200 flex items-center justify-between space-x-4">
                  <div 
                    onClick={() => setSelectedOption(`SetterAgentDetail_Persona_${agent.id}`)} 
                    className="flex items-center space-x-4 flex-grow cursor-pointer group"
                  >
                    <div className="relative shrink-0">
                      <img 
                        src={agentImageUrl}
                        alt={agent.persona?.name || 'Agente'}
                        className="w-10 h-10 rounded-full object-cover border border-gray-200 group-hover:opacity-90 transition-opacity"
                        onError={(e) => { e.target.onerror = null; e.target.src='/logoBlanco.png'; }}
                      />
                      {isActive && (
                         <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full ring-2 ring-white bg-green-500" title="Activo"></span>
                      )}
                    </div>
                    <div>
                      <p className="text-base font-semibold text-gray-800 group-hover:text-indigo-600 transition-colors">{agent.persona?.name || 'Nombre no definido'}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                     {isActive ? (
                         <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                           <CheckCircleIcon className="w-4 h-4 mr-1" />
                           Activo
                         </span>
                     ) : (
                         <button 
                           onClick={() => handleActivateAgent(agent.id)}
                           disabled={isActivating}
                           className={`inline-flex items-center justify-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white transition duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                               isActivating 
                                 ? 'bg-gray-400 cursor-not-allowed' 
                                 : 'bg-indigo-600 hover:bg-indigo-700'
                           }`}
                         >
                           {isActivating ? (
                               <>
                                 <ArrowPathIcon className="animate-spin w-4 h-4 mr-1" />
                                 Activando...
                               </>
                           ) : (
                               <>
                                 <BoltIcon className="w-4 h-4 mr-1" />
                                 Activar
                               </>
                           )}
                         </button>
                     )}
                     <button 
                         onClick={() => setSelectedOption(`SetterAgentDetail_Persona_${agent.id}`)}
                         className="text-gray-400 hover:text-indigo-600 p-2 rounded-full transition duration-150"
                         aria-label="Configurar Agente"
                         title="Configurar Agente"
                     >
                         <AdjustmentsHorizontalIcon className="w-6 h-6" />
                     </button>
                  </div>
                </div>
              );
         })}
       </div>
    </>
  );

 const renderInitialCreationView = () => (
    <div className="max-w-4xl mx-auto text-center">
       {/* Optional Back Button if agents exist */}
       {agents.length > 0 && (
         <button 
            onClick={() => setShowInitialCreationView(false)} 
            className="absolute top-6 left-6 md:top-8 md:left-8 flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
         >
            <ArrowLeftIcon className="w-5 h-5 mr-1" />
            Volver a la lista
         </button>
       )}
      <h1 className="text-3xl font-bold text-gray-800 mb-4">Agente de IA para WhatsApp</h1>
      <p className="text-lg text-gray-500 mb-10">
        Crea un agente conversacional, capacitado en el tema, que guíe a los usuarios, responda a sus preguntas y garantice una finalización fluida y precisa.
      </p>

      {isCreatingAgent && (
          <div className="text-center my-6"><p className="text-indigo-600 animate-pulse">Creando agente...</p></div>
      )}
      
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${isCreatingAgent ? 'opacity-50 pointer-events-none' : ''}`}>
        {/* Option: Start from scratch */}
        <OptionCard
          Icon={PlusCircleIcon}
          title="Comenzar desde cero"
          description="Diseña tu propio Agente de IA desde cero."
          onClick={() => handleCreationOptionClick('scratch')}
          className="h-full flex flex-col" // Ensure cards have consistent height
        />
        {/* Options: Templates */}
        <OptionCard
          Icon={BuildingOfficeIcon} // Replace with actual icon
          title="Plantilla para Inmobiliaria"
          description="Diseña tu propio Agente de IA y conéctelo a sus formularios" // Descripciones de Figma
          onClick={() => handleCreationOptionClick('template', 'inmobiliaria')}
          className="h-full flex flex-col"
        />
         <OptionCard
          Icon={ShoppingCartIcon} // Replace with actual icon
          title="Plantilla para Ecommerce"
          description="Comience con el agente de IA pre diseñados"
          onClick={() => handleCreationOptionClick('template', 'ecommerce')}
           className="h-full flex flex-col"
       />
        <OptionCard
          Icon={TagIcon} // Replace with actual icon
          title="Plantilla para tienda"
          description="Cree su clon IA y replique sus conocimientos"
          onClick={() => handleCreationOptionClick('template', 'tienda')}
          className="h-full flex flex-col"
        />
         <OptionCard
          Icon={HeartIcon} // Replace with actual icon
          title="Plantilla para Salud"
          description="Comience con el agente de IA pre diseñados"
          onClick={() => handleCreationOptionClick('template', 'salud')}
           className="h-full flex flex-col"
       />
        <OptionCard
          Icon={PencilSquareIcon} // Replace with actual icon
          title="Plantilla para Blog"
          description="Cree su clon IA y replique sus conocimientos"
          onClick={() => handleCreationOptionClick('template', 'blog')}
          className="h-full flex flex-col"
        />
        {/* Add other template OptionCards here */}
      </div>
        {error && (
            <div className="mt-6 text-center py-3 px-4 bg-red-50 text-red-700 rounded-lg shadow-sm">
                <p>Error: {error}</p>
            </div>
          )}
    </div>
 );

  return (
    <div className="p-6 md:p-8 lg:p-10 max-w-7xl mx-auto">
      {isLoading ? (
        <div className="text-center py-10"><p className="text-gray-500">Cargando...</p></div>
      ) : (
        showInitialCreationView || agents.length === 0 
          ? renderInitialCreationView() 
          : renderAgentListView()
      )}
       {/* Error display for list view loading (keep existing logic) */}
       {!isLoading && !showInitialCreationView && agents.length > 0 && error && (
         <div className="text-center py-10 px-6 bg-red-50 text-red-700 rounded-xl shadow-md">
            <p>Error al cargar: {error}</p>
        </div>
      )}
    </div>
  );
}

export default AgentListPage; 

// --- IMPORTANT ---
// Need to ensure OptionCard.jsx can accept Icon components and className prop
// Need to define the AgentDescriptionSetup page/component or refine navigation for 'scratch'
// Replace placeholder template icons
// Refine template data in agentTemplates (defined above)
// Ensure routing/navigation logic (setSelectedOption) works correctly for both flows

// --- Template Data Placeholder --- 
// ELIMINAR ESTA SEGUNDA DECLARACIÓN
/*
const agentTemplates = {
    inmobiliaria: { name: "Agente Inmobiliario Pro", persona: { instructions: "Soy un agente IA especializado en propiedades inmobiliarias...", }, knowledge: { } },
    ecommerce: { name: "Asistente Ecommerce Experto", persona: { instructions: "Ayudo a clientes a encontrar productos y completar compras...", }, knowledge: { } },
    tienda: { name: "Vendedor Tienda Amigable", persona: { instructions: "Asisto a clientes en la tienda, respondo preguntas sobre productos...", }, knowledge: { } },
    salud: { name: "Consejero de Salud Virtual", persona: { instructions: "Ofrezco información general de salud y bienestar (no soy médico)...", }, knowledge: { } },
    blog: { name: "Creador de Contenido Blog", persona: { instructions: "Genero ideas y borradores para artículos de blog sobre diversos temas...", }, knowledge: { } },
};
*/
// ------------------------------- 