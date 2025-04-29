import React, { useState, useEffect, useRef, useCallback } from 'react';

// Optimize the component to prevent unmounting
const ActionStepForm = React.memo(function ActionStepForm({ initialActionData, onStepChange, onRemove }) {
  // Use refs to track the actual DOM elements
  const formRef = useRef(null);
  const typeRef = useRef(null);
  const valueRef = useRef(null);
  const delayRef = useRef(null);
  
  // Track component lifecycle for debugging
  const mountRef = useRef(Date.now());
  const renderCountRef = useRef(0);
  
  // Use a ref to store action data to avoid triggering re-renders
  const actionRef = useRef(initialActionData);
  
  // We'll use a state variable just to trigger re-renders 
  const [localState, setLocalState] = useState(initialActionData);
  
  // Track whether we should notify parent
  const shouldNotifyParentRef = useRef(false);
  
  // Force component to re-render without changing props
  const forceUpdate = useCallback(() => {
    setLocalState(current => ({...current}));
  }, []);
  
  // Debug on render
  useEffect(() => {
    renderCountRef.current += 1;
    console.log(`[ActionStepForm] RENDER #${renderCountRef.current} for ID: ${actionRef.current.id}, mounted ${((Date.now() - mountRef.current) / 1000).toFixed(1)}s ago`);
  });
  
  // Setup actual form data from initial props only once on mount 
  useEffect(() => {
    console.log(`[ActionStepForm] MOUNTED with ID: ${initialActionData.id}`);
    actionRef.current = initialActionData;
    setLocalState(initialActionData);
    
    return () => {
      console.log(`[ActionStepForm] UNMOUNTING ID: ${initialActionData.id}, after ${((Date.now() - mountRef.current) / 1000).toFixed(1)}s`);
    };
  }, []);

  // Function to manually get values from the DOM
  const getCurrentValues = useCallback(() => {
    return {
      ...actionRef.current,
      type: typeRef.current?.value || actionRef.current.type,
      value: valueRef.current?.value || actionRef.current.value,
      delay: delayRef.current ? parseInt(delayRef.current.value) || 0 : actionRef.current.delay
    };
  }, []);
  
  // Handle local changes without notifying parent
  const handleChange = useCallback((e) => {
    // Update our local state, but don't notify parent yet
    const updatedAction = {
      ...localState,
      [e.target.name]: e.target.value
    };
    
    // Update our local state 
    setLocalState(updatedAction);
    
    // Also update ref for consistency
    actionRef.current = updatedAction;
  }, [localState]);
  
  // On blur we notify the parent with current values
  const handleBlur = useCallback((e) => {
    // Only notify parent if we should 
    console.log(`[ActionStepForm] Blur event for ${e.target.id}, notifying parent`);
    onStepChange(localState);
  }, [localState, onStepChange]);
  
  // Prevent form submission 
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
      e.preventDefault();
    }
  }, []);

  return (
    <div 
      ref={formRef} 
      className="bg-gray-50 p-4 rounded-md" 
      data-action-id={actionRef.current.id}
    >
      <div className="flex justify-between items-center mb-2">
        <h4 className="text-sm font-medium text-gray-700">Acción</h4>
        <button
          type="button"
          onClick={onRemove}
          className="text-red-600 hover:text-red-800"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div>
          <label htmlFor={`action-type-${actionRef.current.id}`} className="block text-sm font-medium text-gray-700">
            Tipo de acción
          </label>
          <select
            ref={typeRef}
            id={`action-type-${actionRef.current.id}`}
            name="type"
            value={localState.type}
            onChange={handleChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          >
            <option value="send_message">Enviar mensaje</option>
            <option value="send_image">Enviar imagen</option>
            <option value="send_audio">Enviar audio</option>
            <option value="send_document">Enviar documento</option>
            <option value="assign_tag">Asignar etiqueta</option>
            <option value="notify_agent">Notificar agente</option>
          </select>
        </div>

        <div>
          <label htmlFor={`action-value-${actionRef.current.id}`} className="block text-sm font-medium text-gray-700">
            Valor
          </label>
          {localState.type === 'send_message' ? (
            <textarea
              ref={valueRef}
              id={`action-value-${actionRef.current.id}`}
              name="value"
              value={localState.value}
              onChange={handleChange}
              onBlur={handleBlur}
              rows={3}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              required
            />
          ) : (
            <input
              ref={valueRef}
              type="text"
              id={`action-value-${actionRef.current.id}`}
              name="value"
              value={localState.value}
              onChange={handleChange}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              required
            />
          )}
        </div>

        <div>
          <label htmlFor={`action-delay-${actionRef.current.id}`} className="block text-sm font-medium text-gray-700">
            Retraso (segundos)
          </label>
          <input
            ref={delayRef}
            type="number"
            id={`action-delay-${actionRef.current.id}`}
            name="delay"
            value={localState.delay}
            onChange={handleChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            min="0"
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // This comparison function prevents re-renders unless the ID changes 
  // or the initialActionData has substantively changed
  const prevId = prevProps.initialActionData.id;
  const nextId = nextProps.initialActionData.id;
  
  if (prevId !== nextId) {
    return false; // Different IDs, do render
  }
  
  // Same ID - check if other props have changed in a way that matters
  const prevJSON = JSON.stringify(prevProps.initialActionData);
  const nextJSON = JSON.stringify(nextProps.initialActionData);
  
  return prevJSON === nextJSON; // Only re-render if the data actually changed
});

export default ActionStepForm; 