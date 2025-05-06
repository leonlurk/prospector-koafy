import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useWhatsApp } from '../context/WhatsAppContext';
import { getActionFlows, createActionFlow, updateActionFlow, deleteActionFlow } from '../services/api';
import { Link } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import ActionStepForm from '../components/ActionStepForm';

// --- Placeholder Icons ---
const BoltIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
  </svg>
);

const PlusCircleIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const EllipsisVerticalIcon = (props) => (
 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
</svg>
);

// --- NUEVO COMPONENTE MEMOIZADO PARA METADATOS DEL FLUJO ---
const FlowMetadataForm = React.memo(({ name, description, trigger, triggerValue, onChange }) => {
  console.log("[FlowMetadataForm] Rendering with name:", name);
  return (
    <div className="space-y-4 mb-6">
      <div>
        <label htmlFor="flow-name" className="block text-sm font-medium text-gray-700">
          Nombre del flujo
        </label>
        <input
          type="text"
          id="flow-name"
          name="name"
          value={name}
          onChange={onChange} // Usar el handler pasado por props
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          required
        />
      </div>
      <div>
        <label htmlFor="flow-description" className="block text-sm font-medium text-gray-700">
          Descripción
        </label>
        <textarea
          id="flow-description"
          name="description"
          value={description}
          onChange={onChange}
          rows={3}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
      </div>
      <div>
        <label htmlFor="flow-trigger" className="block text-sm font-medium text-gray-700">
          Disparador
        </label>
        <select
          id="flow-trigger"
          name="trigger"
          value={trigger}
          onChange={onChange}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        >
          <option value="message">Mensaje contiene</option>
          <option value="exact_message">Mensaje exacto</option>
          <option value="image_received">Imagen recibida</option>
           {/* Añadir otros triggers si existen */}
        </select>
      </div>
      {/* Mostrar valor del disparador solo si es relevante (ej. no para imagen recibida) */}
      {trigger === 'message' || trigger === 'exact_message' ? (
        <div>
          <label htmlFor="flow-trigger-value" className="block text-sm font-medium text-gray-700">
            {trigger === 'message' ? 'El mensaje contiene' : 'Mensaje exacto'}
          </label>
          <input
            type="text"
            id="flow-trigger-value"
            name="triggerValue"
            value={triggerValue}
            onChange={onChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder={trigger === 'message' ? 'Ej: \'promo\' o \'ayuda\'' : 'Ej: \'Quiero info\''}
          />
        </div>
      ) : null}
    </div>
  );
});
// --- FIN NUEVO COMPONENTE ---

// --- Action Flow Page Component ---
function ActionFlowPage() {
  const { currentUser, whatsappStatus } = useWhatsApp();
  const userId = currentUser?.uid;
  console.log('[ActionFlowPage] Rendering. userId:', userId, 'currentUser:', currentUser);

  const [flows, setFlows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showNewFlowForm, setShowNewFlowForm] = useState(false);
  const [selectedFlow, setSelectedFlow] = useState(null);
  
  // Initialize newFlowData only once on mount, then update it using reference
  const [newFlowData, setNewFlowData] = useState(() => ({
    name: '',
    description: '',
    trigger: 'message',
    triggerValue: '',
    steps: [
      {
        id: uuidv4(),
        type: 'send_message',
        value: '',
        delay: 0
      }
    ]
  }));

  useEffect(() => {
    console.log('[ActionFlowPage] useEffect triggered. userId:', userId);
    if (userId) {
      fetchFlows();
    } else {
      console.log('[ActionFlowPage] useEffect: userId is missing, setting error.');
      setError('No se ha podido identificar al usuario para cargar los flujos.');
      setIsLoading(false);
    }
  }, [userId]);

  const fetchFlows = async () => {
    if (!userId) return;
    console.log('[ActionFlowPage] fetchFlows called FOR userId:', userId, '. Clearing error.');
    setIsLoading(true);
    setError(null);

    try {
      const response = await getActionFlows(userId);
      console.log('[ActionFlowPage][fetchFlows] Raw response from getActionFlows:', response);
      
      if (response.success && response.data) {
        const flowsData = response.data || [];
        console.log('[ActionFlowPage][fetchFlows] Data being set to flows state:', flowsData);
        setFlows(flowsData);
      } else {
        console.error('[ActionFlowPage][fetchFlows] API call failed or returned no data:', response);
        setError(response.message || 'Error cargando flujos');
        setFlows([]);
      }
    } catch (err) {
      console.error('[ActionFlowPage][fetchFlows] Error caught:', err);
      setError(err.message || 'Error cargando flujos');
      setFlows([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateFlow = async (e) => {
    e.preventDefault();
    if (!userId) {
      setError('No se puede crear el flujo sin un ID de usuario.');
      return;
    }
    setIsLoading(true);
    setError(null);

    console.log(`Enviando datos a createActionFlow para usuario ${userId}:`, newFlowData);

    try {
      const response = await createActionFlow(userId, newFlowData);
      if (response.success) {
        await fetchFlows();
        setShowNewFlowForm(false);
        setNewFlowData({
          name: '',
          description: '',
          trigger: 'message',
          triggerValue: '',
          steps: [
            {
              id: uuidv4(),
              type: 'send_message',
              value: '',
              delay: 0
            }
          ]
        });
      } else {
        setError(response.message || 'Error creando flujo');
      }
    } catch (err) {
      setError(err.message || 'Error creando flujo');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateFlow = async (e, flowId) => {
    e.preventDefault();
    if (!userId || !flowId || !selectedFlow) {
       setError('Faltan datos para actualizar el flujo (userId, flowId o datos del flujo).');
      return;
    }
    setIsLoading(true);
    setError(null);

    try {
      const response = await updateActionFlow(userId, flowId, selectedFlow);
      if (response.success) {
        await fetchFlows();
        setSelectedFlow(null);
      } else {
        setError(response.message || 'Error actualizando flujo');
      }
    } catch (err) {
      setError(err.message || 'Error actualizando flujo');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteFlow = async (flowId) => {
    if (!userId || !flowId) {
      setError('Faltan datos para eliminar el flujo (userId o flowId).');
      return;
    }
    if (!window.confirm('¿Estás seguro de que deseas eliminar este flujo?')) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await deleteActionFlow(userId, flowId);
      if (response.success) {
        await fetchFlows();
        setSelectedFlow(null);
      } else {
        setError(response.message || 'Error eliminando flujo');
      }
    } catch (err) {
      setError(err.message || 'Error eliminando flujo');
    } finally {
      setIsLoading(false);
    }
  };

  // Stable function to add a new action
  const handleAddAction = useCallback(() => {
    const newAction = {
      id: uuidv4(),
      type: 'send_message',
      value: '',
      delay: 0
    };
    
    if (selectedFlow) {
      setSelectedFlow(prevFlow => ({
        ...prevFlow,
        steps: [...prevFlow.steps, newAction]
      }));
    } else {
      setNewFlowData(prevData => ({
        ...prevData,
        steps: [...prevData.steps, newAction]
      }));
    }
  }, [selectedFlow]);

  // Stable function to remove an action
  const handleRemoveAction = useCallback((actionId) => {
    console.log(`[ActionFlowPage] handleRemoveAction called for ID: ${actionId}`);
    
    if (selectedFlow) {
      setSelectedFlow(prev => ({
        ...prev,
        steps: prev.steps.filter(step => step.id !== actionId)
      }));
    } else {
      setNewFlowData(prev => ({
        ...prev,
        steps: prev.steps.filter(step => step.id !== actionId)
      }));
    }
  }, [selectedFlow]);

  // Stable function to update an action step
  const handleStepChange = useCallback((updatedAction) => {
    console.log(`[ActionFlowPage] handleStepChange called for ID: ${updatedAction.id}`);
    
    if (selectedFlow) {
      setSelectedFlow(prevFlow => {
        // Find the action in the steps array
        const actionIndex = prevFlow.steps.findIndex(step => step.id === updatedAction.id);
        if (actionIndex === -1) return prevFlow; // Not found, return same reference

        // Deep compare the action to see if anything actually changed
        if (JSON.stringify(prevFlow.steps[actionIndex]) === JSON.stringify(updatedAction)) {
          return prevFlow; // Nothing changed, return same reference
        }

        // Create a new steps array with the updated action
        const newSteps = [...prevFlow.steps];
        newSteps[actionIndex] = updatedAction;
        
        return { ...prevFlow, steps: newSteps };
      });
    } else {
      setNewFlowData(prevData => {
        // Find the action in the steps array
        const actionIndex = prevData.steps.findIndex(step => step.id === updatedAction.id);
        if (actionIndex === -1) return prevData; // Not found, return same reference

        // Deep compare the action to see if anything actually changed
        if (JSON.stringify(prevData.steps[actionIndex]) === JSON.stringify(updatedAction)) {
          return prevData; // Nothing changed, return same reference
        }

        // Create a new steps array with the updated action
        const newSteps = [...prevData.steps];
        newSteps[actionIndex] = updatedAction;
        
        return { ...prevData, steps: newSteps };
      });
    }
  }, []);

  // --- NUEVO HANDLER ESTABLE PARA METADATOS ---
  const handleMetadataChange = useCallback((e) => {
      const { name, value } = e.target;
      if (selectedFlow) {
          setSelectedFlow(prev => ({ ...prev, [name]: value }));
      } else {
          setNewFlowData(prev => ({ ...prev, [name]: value }));
      }
  }, [selectedFlow]); // Depende solo de si estamos editando o creando
  // --- FIN NUEVO HANDLER ---

  const ConnectionWarning = () => {
    if (!currentUser) {
      return (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                No hay ningún usuario de WhatsApp configurado.
                <Link to="/connections" className="font-medium underline text-yellow-700 hover:text-yellow-600 ml-1">
                  Configura uno ahora
                </Link>
              </p>
            </div>
          </div>
        </div>
      );
    }

    if (whatsappStatus.status !== 'connected') {
      return (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                WhatsApp no está conectado. Los flujos no se ejecutarán hasta que conectes WhatsApp.
                <Link to="/connections" className="font-medium underline text-yellow-700 hover:text-yellow-600 ml-1">
                  Conectar ahora
                </Link>
              </p>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  // Datos actuales para el formulario (ya sea nuevo o seleccionado)
  const currentFlowData = selectedFlow || newFlowData;

  // Render Logic (suponiendo que el formulario se muestra en un modal o condicionalmente)
  const renderFlowForm = () => (
      <form onSubmit={selectedFlow ? (e) => handleUpdateFlow(e, selectedFlow.id) : handleCreateFlow}>
          {/* --- USAR EL NUEVO COMPONENTE --- */}
          <FlowMetadataForm 
              name={currentFlowData.name}
              description={currentFlowData.description}
              trigger={currentFlowData.trigger}
              triggerValue={currentFlowData.triggerValue}
              onChange={handleMetadataChange} // Pasar el handler estable
          />
          {/* --- FIN USO NUEVO COMPONENTE --- */}

          <h3 className="text-lg font-medium text-gray-900 mb-3">Pasos de acción</h3>
          <div className="space-y-4 mb-6">
              {currentFlowData.steps.map((step, index) => (
                  <ActionStepForm 
                      key={step.id} // Usar ID único como key
                      initialActionData={step} 
                      onStepChange={handleStepChange} 
                      onRemove={() => handleRemoveAction(step.id)}
                  />
              ))}
          </div>
          
          <button 
            type="button" 
            onClick={handleAddAction} 
            className="mb-6 text-sm font-medium text-indigo-600 hover:text-indigo-500 flex items-center"
          >
              <PlusCircleIcon className="w-5 h-5 mr-1" />
              Añadir paso de acción
          </button>

          <div className="flex justify-end space-x-3">
              <button 
                  type="button" 
                  onClick={() => { setSelectedFlow(null); setShowNewFlowForm(false); }} 
                  className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                  Cancelar
              </button>
              <button 
                  type="submit" 
                  disabled={isLoading}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                  {isLoading ? 'Guardando...' : (selectedFlow ? 'Actualizar Flujo' : 'Crear Flujo')}
              </button>
          </div>
      </form>
  );

  return (
    <div className="p-6 md:p-8 lg:p-10 max-w-7xl mx-auto">
        <ConnectionWarning />

        {/* Botón para mostrar formulario de nuevo flujo */}
        {!showNewFlowForm && !selectedFlow && (
             <div className="text-right mb-6">
                 <button
                     onClick={() => setShowNewFlowForm(true)}
                     className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                 >
                      <PlusCircleIcon className="-ml-1 mr-2 h-5 w-5" />
                     Nuevo Flujo de Acción
                 </button>
             </div>
        )}

        {error && <p className="text-red-500 mb-4">Error: {error}</p>}

        {/* Mostrar formulario de creación o edición */}
        {(showNewFlowForm || selectedFlow) && (
            <div className="bg-white p-6 rounded-lg shadow mb-8">
                <h2 className="text-xl font-semibold mb-4">{selectedFlow ? 'Editar Flujo de Acción' : 'Crear Nuevo Flujo de Acción'}</h2>
                {renderFlowForm()}
            </div>
        )}
        

        {/* Lista de flujos existentes */}
        <h2 className="text-xl font-semibold mb-4">Flujos Existentes</h2>
        {isLoading && !flows.length ? (
            <p>Cargando flujos...</p>
        ) : flows.length > 0 ? (
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
                 <ul role="list" className="divide-y divide-gray-200">
                    {console.log('[ActionFlowPage] Rendering list with flows state:', flows)}
                    {flows.map((flow) => (
                        <li key={flow.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                           <div className="flex items-center justify-between">
                                <div className="truncate">
                                     <p className="text-sm font-medium text-indigo-600 truncate cursor-pointer" onClick={() => setSelectedFlow(flow)}>{flow.name}</p>
                                     <p className="text-sm text-gray-500 truncate">{flow.description || 'Sin descripción'}</p>
                                     <p className="text-xs text-gray-400">Trigger: {flow.trigger} {flow.triggerValue ? `(${flow.triggerValue})` : ''}</p>
                                </div>
                                <div className="ml-2 flex-shrink-0 flex space-x-2">
                                     <button 
                                        onClick={() => setSelectedFlow(flow)} 
                                        className="px-2 py-1 text-xs font-medium text-indigo-700 bg-indigo-100 rounded hover:bg-indigo-200"
                                     >
                                        Editar
                                     </button>
                                     <button 
                                        onClick={() => handleDeleteFlow(flow.id)} 
                                        className="px-2 py-1 text-xs font-medium text-red-700 bg-red-100 rounded hover:bg-red-200"
                                        disabled={isLoading}
                                     >
                                        Eliminar
                                     </button>
                                     {/* Podría ir un menú desplegable aquí con más opciones */}
                                 </div>
                             </div>
                         </li>
                     ))}
                 </ul>
             </div>
        ) : (
            <p className="text-gray-500">No hay flujos de acción creados.</p>
        )}
    </div>
  );
}

export default ActionFlowPage; 