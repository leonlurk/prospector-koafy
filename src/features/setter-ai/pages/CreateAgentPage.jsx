import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import OptionCard from '../components/OptionCard';
import { createAgent } from '../services/api';

// Heroicons SVG
const PlusCircleIcon = (props) => (
 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
</svg>
);
const DocumentDuplicateIcon = (props) => (
<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
</svg>
);
const SparklesIcon = (props) => (
<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L1.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.25 12l2.846.813a4.5 4.5 0 013.09 3.09L21 18.75l-.813 2.846a4.5 4.5 0 01-3.09 3.09L14.25 21l-2.846-.813a4.5 4.5 0 01-3.09-3.09L9 15.75l.813-2.846a4.5 4.5 0 013.09-3.09L15.75 9l2.846.813a4.5 4.5 0 013.09 3.09L21 15.75l-.813 2.846a4.5 4.5 0 01-3.09 3.09L14.25 21l-2.846-.813a4.5 4.5 0 01-3.09-3.09L9 15.75z" />
</svg>
);
const UserCircleIcon = (props) => (
 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
  <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
</svg>
);
// --------------------------------------------------

function CreateAgentPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  // Navegar al paso intermedio o crear directamente si es 'scratch'
  const handleOptionClick = async (optionType) => {
    setIsLoading(true); // Mostrar feedback general
    console.log(`Opción seleccionada: ${optionType}`);

    if (optionType === 'scratch') {
      // Crear directamente y navegar a persona
      try {
        const response = await createAgent({ type: 'scratch', name: 'Nuevo Agente (desde cero)' });
        if (response?.success && response.agentId) {
          navigate(`/agents/${response.agentId}/persona`);
        } else {
          console.error("Error simulado al crear agente 'scratch'");
          setIsLoading(false); // Permitir reintentar
        }
      } catch (error) {
        console.error("Error real al crear agente 'scratch':", error);
        setIsLoading(false);
      }
    } else if (optionType === 'form') {
      navigate('/agents/new/select-form');
    } else if (optionType === 'template') {
      navigate('/agents/new/select-template');
    } else if (optionType === 'clone') {
      navigate('/agents/new/select-clone');
    }
    // setIsLoading(false) no se llama aquí intencionadamente si la navegación tiene éxito
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-text-main mb-3">Crear un Agente IA</h1>
        <p className="text-lg text-text-muted max-w-2xl mx-auto">
          Elige cómo quieres empezar a crear tu agente conversacional.
        </p>
      </div>

      {isLoading && (
          <div className="text-center my-8">
              <p className="text-primary animate-pulse">Procesando...</p>
          </div>
      )}

      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}>
        <OptionCard
          Icon={PlusCircleIcon}
          title="Empezar desde cero"
          description="Construye tu propio Agente IA desde la base."
          onClick={() => !isLoading && handleOptionClick('scratch')}
        />
        <OptionCard
          Icon={DocumentDuplicateIcon}
          title="Empezar con formulario"
          description="Crea tu Agente IA y conéctalo a tus formularios."
          onClick={() => !isLoading && handleOptionClick('form')}
        />
        <OptionCard
          Icon={SparklesIcon}
          title="Usar plantilla"
          description="Comienza rápidamente con Agentes IA pre-diseñados."
          onClick={() => !isLoading && handleOptionClick('template')}
        />
        <OptionCard
          Icon={UserCircleIcon}
          title="Clonar persona"
          description="Crea tu clon IA y replica tus conocimientos."
          onClick={() => !isLoading && handleOptionClick('clone')}
        />
      </div>
    </div>
  );
}

// Actualizar OptionCard para aceptar Icon como componente
// (Necesitamos modificar OptionCard.jsx)

export default CreateAgentPage; 