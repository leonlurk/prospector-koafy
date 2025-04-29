import React, { useState, useEffect, useCallback } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import Textarea from '../components/Textarea';
import { getRules, addRule, deleteRule, getGeminiStarters, addGeminiStarter, deleteGeminiStarter, getActiveConversations, stopAiConversation } from '../services/api';

// Iconos Placeholder
const TrashIcon = (props) => (
 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
</svg>
);
const PlusIcon = (props) => (
 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
</svg>
);
// Icono para detener
const StopCircleIcon = (props) => (
 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 9.563C9 9.252 9.252 9 9.563 9h4.874c.311 0 .563.252.563.563v4.874c0 .311-.252.563-.563.563H9.564A.562.562 0 019 14.437V9.564z" />
 </svg>
);

function AutomationRulesPage() {
  const [rules, setRules] = useState([]);
  const [starters, setStarters] = useState([]);
  const [activeConversations, setActiveConversations] = useState({});
  const [isLoadingRules, setIsLoadingRules] = useState(true);
  const [isLoadingStarters, setIsLoadingStarters] = useState(true);
  const [isLoadingActiveConvs, setIsLoadingActiveConvs] = useState(true);
  const [errorRules, setErrorRules] = useState(null);
  const [errorStarters, setErrorStarters] = useState(null);
  const [errorActiveConvs, setErrorActiveConvs] = useState(null);

  // Estados para formularios
  const [newRuleTrigger, setNewRuleTrigger] = useState('');
  const [newRuleResponse, setNewRuleResponse] = useState('');
  const [newStarterTrigger, setNewStarterTrigger] = useState('');
  const [newStarterPrompt, setNewStarterPrompt] = useState('');

  // Estados para feedback de acciones
  const [isAddingRule, setIsAddingRule] = useState(false);
  const [isAddingStarter, setIsAddingStarter] = useState(false);
  const [ruleFeedback, setRuleFeedback] = useState({ message: '', success: false });
  const [starterFeedback, setStarterFeedback] = useState({ message: '', success: false });
  const [activeConvFeedback, setActiveConvFeedback] = useState({ message: '', success: false });

  // Usamos useCallback para evitar recrear las funciones fetch en cada render
  const fetchRules = useCallback(async () => {
    setIsLoadingRules(true);
    setErrorRules(null);
    try {
      const fetchedRules = await getRules();
      setRules(Array.isArray(fetchedRules) ? fetchedRules : []);
    } catch (error) {
      console.error("Error fetching rules:", error);
      setErrorRules(error.message || 'Error al cargar las reglas simples.');
      setRules([]);
    } finally {
      setIsLoadingRules(false);
    }
  }, []); // Dependencia vacía, solo se crea una vez

  const fetchStarters = useCallback(async () => {
    setIsLoadingStarters(true);
    setErrorStarters(null);
    try {
      const fetchedStarters = await getGeminiStarters();
      setStarters(Array.isArray(fetchedStarters) ? fetchedStarters : []);
    } catch (error) {
      console.error("Error fetching starters:", error);
      setErrorStarters(error.message || 'Error al cargar los disparadores IA.');
      setStarters([]);
    } finally {
      setIsLoadingStarters(false);
    }
  }, []); // Dependencia vacía

  // Nueva función para fetch active conversations
  const fetchActiveConversations = useCallback(async () => {
    setIsLoadingActiveConvs(true);
    setErrorActiveConvs(null);
    try {
        const fetchedConvs = await getActiveConversations();
        // La API devuelve un objeto { senderId: prompt }, asegurarse que es un objeto
        setActiveConversations(typeof fetchedConvs === 'object' && fetchedConvs !== null ? fetchedConvs : {});
    } catch (error) {
        console.error("Error fetching active conversations:", error);
        setErrorActiveConvs(error.message || 'Error al cargar conversaciones activas.');
        setActiveConversations({});
    } finally {
        setIsLoadingActiveConvs(false);
    }
  }, []);

  // Cargar todos los datos al montar
  useEffect(() => {
    fetchRules();
    fetchStarters();
    fetchActiveConversations();
    // Refresco periódico para conversaciones activas (opcional, puede ser solo manual)
    const intervalId = setInterval(fetchActiveConversations, 15000); // Cada 15 segundos
    return () => clearInterval(intervalId);
  }, [fetchRules, fetchStarters, fetchActiveConversations]);

  // --- Handlers para Reglas Simples ---
  const handleAddRule = async (e) => {
    e.preventDefault();
    if (!newRuleTrigger.trim() || !newRuleResponse.trim()) return;
    setIsAddingRule(true);
    setRuleFeedback({ message: '', success: false });
    try {
      const result = await addRule(newRuleTrigger, newRuleResponse);
      setRuleFeedback({ message: result.message || 'Regla añadida con éxito', success: result.success });
      if (result.success) {
        setNewRuleTrigger('');
        setNewRuleResponse('');
        fetchRules(); // Recargar lista de reglas
        setTimeout(() => setRuleFeedback({ message: '', success: false }), 3000); // Limpiar feedback
      }
    } catch (error) {
      console.error("Error adding rule:", error);
      setRuleFeedback({ message: error.message || 'Error al añadir la regla.', success: false });
    } finally {
      setIsAddingRule(false);
    }
  };

  const handleDeleteRule = async (trigger) => {
    // Opcional: pedir confirmación
    // if (!window.confirm(`¿Seguro que quieres eliminar la regla para "${trigger}"?`)) return;
    // Para simplificar, no añadimos confirmación por ahora.

    // Podríamos añadir un estado para indicar qué regla se está borrando
    // setDeletingRuleTrigger(trigger);

    try {
      const result = await deleteRule(trigger);
      if (result.success) {
        fetchRules(); // Recargar lista si se borró
        // Mostrar feedback temporal si se quiere
        setRuleFeedback({ message: result.message || 'Regla eliminada.', success: true });
        setTimeout(() => setRuleFeedback({ message: '', success: false }), 3000);
      } else {
         setRuleFeedback({ message: result.message || 'Error al eliminar la regla.', success: false });
         setTimeout(() => setRuleFeedback({ message: '', success: false }), 3000);
      }
    } catch (error) {
      console.error("Error deleting rule:", error);
       setRuleFeedback({ message: error.message || 'Error al eliminar la regla.', success: false });
       setTimeout(() => setRuleFeedback({ message: '', success: false }), 3000);
    } finally {
       // setDeletingRuleTrigger(null);
    }
  };

  // --- Handlers para Disparadores IA ---
  const handleAddStarter = async (e) => {
    e.preventDefault();
    if (!newStarterTrigger.trim() || !newStarterPrompt.trim()) return;
    setIsAddingStarter(true);
    setStarterFeedback({ message: '', success: false });
    try {
      const result = await addGeminiStarter(newStarterTrigger, newStarterPrompt);
       setStarterFeedback({ message: result.message || 'Disparador añadido con éxito', success: result.success });
      if (result.success) {
        setNewStarterTrigger('');
        setNewStarterPrompt('');
        fetchStarters(); // Recargar lista
        setTimeout(() => setStarterFeedback({ message: '', success: false }), 3000); // Limpiar feedback
      }
    } catch (error) {
      console.error("Error adding starter:", error);
      setStarterFeedback({ message: error.message || 'Error al añadir el disparador.', success: false });
    } finally {
      setIsAddingStarter(false);
    }
  };

  const handleDeleteStarter = async (trigger) => {
    // Opcional: confirmación
     try {
      const result = await deleteGeminiStarter(trigger);
      if (result.success) {
        fetchStarters(); // Recargar lista
        setStarterFeedback({ message: result.message || 'Disparador eliminado.', success: true });
        setTimeout(() => setStarterFeedback({ message: '', success: false }), 3000);
      } else {
          setStarterFeedback({ message: result.message || 'Error al eliminar el disparador.', success: false });
          setTimeout(() => setStarterFeedback({ message: '', success: false }), 3000);
      }
    } catch (error) {
      console.error("Error deleting starter:", error);
       setStarterFeedback({ message: error.message || 'Error al eliminar el disparador.', success: false });
       setTimeout(() => setStarterFeedback({ message: '', success: false }), 3000);
    }
  };

  // --- Handlers Conversaciones Activas IA ---
  const handleStopConversation = async (senderId) => {
      // Podríamos añadir estado de carga específico para este botón
      setActiveConvFeedback({ message: '', success: false });
      try {
          const result = await stopAiConversation(senderId);
          setActiveConvFeedback({ message: result.message || 'Conversación detenida.', success: result.success });
          if(result.success) {
              fetchActiveConversations(); // Recargar lista
          }
          setTimeout(() => setActiveConvFeedback({ message: '', success: false }), 3000);
      } catch (error) {
          console.error("Error stopping conversation:", error);
          setActiveConvFeedback({ message: error.message || 'Error al detener la conversación.', success: false });
          setTimeout(() => setActiveConvFeedback({ message: '', success: false }), 3000);
      }
  }

  // Helper para formatear sender ID
  const formatSenderId = (senderId) => {
    const match = senderId.match(/^(\d+)@c\.us$/);
    return match ? `Usuario (${match[1]})` : senderId;
  }

  return (
    <div className="max-w-4xl space-y-8">
      <h2 className="text-2xl font-semibold text-text-main">Reglas de Automatización</h2>

      {/* Sección Reglas Simples */}
      <Card>
        <h3 className="text-lg font-medium text-text-main mb-4">Respuestas Automáticas Simples</h3>
        <p className="text-sm text-text-muted mb-6">
          Define respuestas automáticas basadas en palabras clave o frases exactas detectadas en los mensajes entrantes.
        </p>

        {/* Formulario Añadir Regla */}
        <form onSubmit={handleAddRule} className="mb-6 p-4 border border-border-main rounded-md bg-surface">
          <h4 className="text-md font-medium text-text-main mb-3">Añadir Nueva Regla</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
              <Input
                id="new-rule-trigger"
                label="Si el mensaje contiene:"
                placeholder="Ej: hola, precio, horario"
                value={newRuleTrigger}
                onChange={(e) => setNewRuleTrigger(e.target.value)}
                required
                disabled={isAddingRule} // Deshabilitar mientras se añade
              />
              <Input
                id="new-rule-response"
                label="Responder con:"
                placeholder="Ej: ¡Hola! ¿Cómo puedo ayudarte?"
                value={newRuleResponse}
                onChange={(e) => setNewRuleResponse(e.target.value)}
                required
                 disabled={isAddingRule}
              />
          </div>
          {/* Feedback para añadir regla */}
          {ruleFeedback.message && (
            <p className={`text-sm mb-3 ${ruleFeedback.success ? 'text-green-600' : 'text-red-500'}`}>
              {ruleFeedback.message}
            </p>
          )}
          <Button type="submit" size="sm" disabled={isAddingRule || !newRuleTrigger.trim() || !newRuleResponse.trim()}>
             <PlusIcon className="w-4 h-4 mr-1" /> {isAddingRule ? 'Añadiendo...' : 'Añadir Regla'}
          </Button>
        </form>

        {/* Lista de Reglas */}
        <div className="space-y-3">
           <h4 className="text-md font-medium text-text-main border-t border-border-main pt-4">Reglas Existentes</h4>
          {isLoadingRules ? (
            <p className="text-text-muted">Cargando reglas...</p>
          ) : errorRules ? (
            <p className="text-red-500">Error: {errorRules}</p>
          ) : rules.length === 0 ? (
            <p className="text-text-muted">No hay reglas simples definidas.</p>
          ) : (
            <ul className="divide-y divide-border-color">
              {rules.map((rule, index) => (
                <li key={rule.trigger || index} className="flex items-center justify-between py-3 group">
                  {/* Usar rule.trigger como key si es único, si no index */}
                  <div>
                    <p className="text-sm font-medium text-text-main">"{rule.trigger}"</p>
                    <p className="text-sm text-text-muted mt-1">→ "{rule.response}"</p>
                  </div>
                   {/* Añadir estado de carga/deshabilitado al botón borrar si se implementa setDeletingRuleTrigger */}
                  <Button variant="danger" size="sm" onClick={() => handleDeleteRule(rule.trigger)} aria-label={`Eliminar regla ${rule.trigger}`} className="opacity-0 group-hover:opacity-100 transition-opacity">
                     <TrashIcon className="w-4 h-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>

      {/* Sección Disparadores IA */}
      <Card>
         <h3 className="text-lg font-medium text-text-main mb-4">Disparadores de Conversación IA (Gemini)</h3>
         <p className="text-sm text-text-muted mb-6">
          Inicia una conversación inteligente con Gemini cuando se detecte una palabra clave. El agente usará el prompt asociado para generar la respuesta inicial y continuar la conversación.
        </p>

        {/* Formulario Añadir Starter */}
        <form onSubmit={handleAddStarter} className="mb-6 p-4 border border-border-main rounded-md bg-surface">
           <h4 className="text-md font-medium text-text-main mb-3">Añadir Nuevo Disparador IA</h4>
          <div className="space-y-4 mb-3">
             <Input
                id="new-starter-trigger"
                label="Si el mensaje contiene:"
                placeholder="Ej: ayuda con producto, quiero demo"
                value={newStarterTrigger}
                onChange={(e) => setNewStarterTrigger(e.target.value)}
                required
                disabled={isAddingStarter}
              />
              <Textarea
                id="new-starter-prompt"
                label="Prompt para Gemini:"
                placeholder="Describe cómo debe actuar Gemini. Ej: Eres un asistente amigable..."
                rows={4}
                value={newStarterPrompt}
                onChange={(e) => setNewStarterPrompt(e.target.value)}
                required
                disabled={isAddingStarter}
              />
          </div>
           {/* Feedback para añadir starter */}
          {starterFeedback.message && (
            <p className={`text-sm mb-3 ${starterFeedback.success ? 'text-green-600' : 'text-red-500'}`}>
              {starterFeedback.message}
            </p>
          )}
           <Button type="submit" size="sm" disabled={isAddingStarter || !newStarterTrigger.trim() || !newStarterPrompt.trim()}>
             <PlusIcon className="w-4 h-4 mr-1" /> {isAddingStarter ? 'Añadiendo...' : 'Añadir Disparador'}
          </Button>
        </form>

         {/* Lista de Starters */}
        <div className="space-y-3">
             <h4 className="text-md font-medium text-text-main border-t border-border-main pt-4">Disparadores Existentes</h4>
          {isLoadingStarters ? (
            <p className="text-text-muted">Cargando disparadores IA...</p>
          ) : errorStarters ? (
             <p className="text-red-500">Error: {errorStarters}</p>
          ) : starters.length === 0 ? (
            <p className="text-text-muted">No hay disparadores IA definidos.</p>
          ) : (
            <ul className="divide-y divide-border-color">
              {starters.map((starter, index) => (
                <li key={starter.trigger || index} className="flex items-center justify-between py-3 group">
                   {/* Usar starter.trigger como key si es único */}
                  <div>
                    <p className="text-sm font-medium text-text-main">"{starter.trigger}"</p>
                    {/* Usar max-w para truncar texto largo en el prompt */}
                    <p className="text-sm text-text-muted mt-1 max-w-md truncate" title={starter.prompt}>Prompt: {starter.prompt}</p>
                  </div>
                  <Button variant="danger" size="sm" onClick={() => handleDeleteStarter(starter.trigger)} aria-label={`Eliminar disparador ${starter.trigger}`} className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <TrashIcon className="w-4 h-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>

      {/* Nueva Sección: Conversaciones IA Activas */}
       <Card>
            <h3 className="text-lg font-medium text-text-main mb-4">Conversaciones IA Activas</h3>
             <p className="text-sm text-text-muted mb-6">
                Aquí se listan las conversaciones que están siendo gestionadas activamente por la IA debido a un disparador. Puedes detenerlas manualmente si es necesario.
             </p>
             {/* Feedback para detener conversación */}
            {activeConvFeedback.message && (
                <p className={`text-sm mb-3 ${activeConvFeedback.success ? 'text-green-600' : 'text-red-500'}`}>
                {activeConvFeedback.message}
                </p>
            )}
            <div className="space-y-3">
                {isLoadingActiveConvs ? (
                    <p className="text-text-muted">Cargando conversaciones activas...</p>
                ) : errorActiveConvs ? (
                    <p className="text-red-500">Error: {errorActiveConvs}</p>
                ) : Object.keys(activeConversations).length === 0 ? (
                    <p className="text-text-muted">No hay conversaciones IA activas en este momento.</p>
                ) : (
                    <ul className="divide-y divide-border-color">
                    {Object.entries(activeConversations).map(([senderId, prompt]) => (
                        <li key={senderId} className="flex items-center justify-between py-3 group">
                        <div>
                            <p className="text-sm font-medium text-text-main">{formatSenderId(senderId)}</p>
                            <p className="text-sm text-text-muted mt-1 max-w-md truncate" title={prompt}>Prompt activo: {prompt}</p>
                        </div>
                        <Button
                            variant="warning"
                            size="sm"
                            onClick={() => handleStopConversation(senderId)}
                            aria-label={`Detener conversación con ${senderId}`}
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                         >
                            <StopCircleIcon className="w-4 h-4 mr-1" /> Detener IA
                        </Button>
                        </li>
                    ))}
                    </ul>
                )}
            </div>
       </Card>

    </div>
  );
}

export default AutomationRulesPage; 