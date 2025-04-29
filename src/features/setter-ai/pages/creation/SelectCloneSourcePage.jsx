import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/Card';
import Button from '../../components/Button';

// Placeholder para icono
const UserGroupIcon = (props) => (
 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
  <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-3.741-1.5a.5.5 0 01-.479-.479 3 3 0 00-1.5-3.741 .5.5 0 01-.479-.479 3 3 0 00-3.741-1.5 .5.5 0 01-.479-.479 3 3 0 00-1.5-3.741 .5.5 0 01-.479-.479 3 3 0 00-1.5-3.741 .5.5 0 01-.479-.479 9.094 9.094 0 00-.479 3.741 3 3 0 001.5 3.741 .5.5 0 01.479.479 3 3 0 003.741 1.5 .5.5 0 01.479.479 3 3 0 003.741 1.5 .5.5 0 01.479.479 3 3 0 001.5 3.741zM12 12a3 3 0 110-6 3 3 0 010 6z" />
</svg>
);

function SelectCloneSourcePage() {
  const navigate = useNavigate();
  const [agents, setAgents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('La funcionalidad de listar y clonar agentes no está implementada en la API actual.');
  const [selectedAgentId, setSelectedAgentId] = useState(null);

  const handleSelectAgent = (agentId) => {
    setSelectedAgentId(agentId);
  };

  const handleNext = () => {
    if (selectedAgentId) {
      console.log(`Navegar a configuración con agente base: ${selectedAgentId}`);
      alert("Funcionalidad de clonación no implementada.");
    } else {
        alert("Por favor, selecciona un agente como base.");
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Button onClick={() => navigate(-1)} variant="link" className="mb-4">
         &larr; Volver
      </Button>
      <h2 className="text-2xl font-semibold text-text-main mb-6">Clonar Agente Existente</h2>
      <p className="text-base text-text-muted mb-8">
        Selecciona uno de tus agentes existentes como base para la configuración del nuevo agente.
      </p>

      <Card>
        <h3 className="text-lg font-medium text-text-main mb-4">Seleccionar Agente Base</h3>
        {isLoading ? (
          <p className="text-text-muted">Cargando agentes...</p>
        ) : error ? (
          <p className="text-red-500 bg-red-50 p-3 rounded border border-red-200">{error}</p>
        ) : agents.length === 0 ? (
           <p className="text-red-500 bg-red-50 p-3 rounded border border-red-200">{error}</p>
        ) : (
          <div className="space-y-3 max-h-60 overflow-y-auto border border-border-main rounded-md p-2">
            {agents.map((agent) => (
              <button
                key={agent.id}
                onClick={() => handleSelectAgent(agent.id)}
                className={`w-full text-left p-3 rounded-md border transition-colors ${selectedAgentId === agent.id ? 'bg-primary-light border-primary ring-1 ring-primary' : 'border-border-color hover:bg-surface'}`}
              >
                <p className="font-medium text-text-main">{agent.name || `Agente ${agent.id}`}</p>
                <p className="text-sm text-text-muted">ID: {agent.id}</p>
              </button>
            ))}
          </div>
        )}
      </Card>

      <div className="mt-8 flex justify-end">
        <Button onClick={handleNext} disabled={!selectedAgentId || isLoading || !!error}>
            Siguiente: Configurar Agente
        </Button>
      </div>
    </div>
  );
}

export default SelectCloneSourcePage; 