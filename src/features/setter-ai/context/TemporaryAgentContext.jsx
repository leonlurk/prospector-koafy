import React, { createContext, useContext, useState } from 'react';
import { createAgent, updateAgent } from '../services/api';

// Create context
const TemporaryAgentContext = createContext(null);

export const TemporaryAgentProvider = ({ children }) => {
  // State for temporary agent data
  const [temporaryAgent, setTemporaryAgent] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Clear temporary agent data
  const clearTemporaryAgent = () => {
    setTemporaryAgent(null);
    setError(null);
  };

  // Create a temporary agent (in memory, not persisted to database)
  const createTemporaryAgent = (agentData) => {
    setTemporaryAgent(agentData);
    setError(null);
    return { success: true, temporaryAgent: agentData };
  };

  // Save the temporary agent to the database
  const persistTemporaryAgent = async (userId) => {
    if (!temporaryAgent) {
      setError("No hay agente temporal para guardar");
      return { success: false, message: "No hay agente temporal para guardar" };
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await createAgent(userId, temporaryAgent);
      if (response?.success && response.agentId) {
        // Clear the temporary agent once it's been successfully persisted
        clearTemporaryAgent();
        return { 
          success: true, 
          message: "Agente guardado con éxito", 
          agentId: response.agentId,
          data: response.data
        };
      } else {
        setError(response?.message || "Error al guardar el agente");
        return { success: false, message: response?.message || "Error al guardar el agente" };
      }
    } catch (error) {
      const errorMessage = error.message || "Error al guardar el agente";
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  // Update the temporary agent data (for example, when user edits fields in the setup)
  const updateTemporaryAgent = (updates) => {
    setTemporaryAgent(prev => ({
      ...prev,
      ...updates
    }));
  };

  // Context value
  const value = {
    temporaryAgent,
    isLoading,
    error,
    createTemporaryAgent,
    updateTemporaryAgent,
    persistTemporaryAgent,
    clearTemporaryAgent
  };

  return (
    <TemporaryAgentContext.Provider value={value}>
      {children}
    </TemporaryAgentContext.Provider>
  );
};

// Custom hook to use the context
export const useTemporaryAgent = () => {
  const context = useContext(TemporaryAgentContext);
  if (!context) {
    throw new Error('useTemporaryAgent must be used within a TemporaryAgentProvider');
  }
  return context;
}; 