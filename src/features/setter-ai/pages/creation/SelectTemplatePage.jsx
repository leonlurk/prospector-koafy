import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { createAgent } from '../../services/api';

// Placeholder data for templates
const availableTemplates = [
  { id: 'tpl1', name: 'Asistente de Ventas Básico', description: 'Responde preguntas frecuentes y captura leads.' },
  { id: 'tpl2', name: 'Soporte Técnico FAQ', description: 'Guía a usuarios a través de soluciones comunes.' },
  { id: 'tpl3', name: 'Agente Inmobiliario Consultas', description: 'Recopila información sobre propiedades deseadas.' },
];

function SelectTemplatePage() {
  const navigate = useNavigate();
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleCreate = async () => {
     if (!selectedTemplateId) return;
     setIsLoading(true);
     console.log(`Creando agente desde plantilla ID: ${selectedTemplateId}`);
     try {
       const selectedTemplate = availableTemplates.find(t => t.id === selectedTemplateId);
       const response = await createAgent({ type: 'template', name: selectedTemplate?.name || 'Agente desde Plantilla', templateId: selectedTemplateId });
       if (response?.success && response.agentId) {
         navigate(`/agents/${response.agentId}/persona`);
       } else {
         console.error("Error simulado creando agente desde plantilla");
         setIsLoading(false);
       }
     } catch (error) {
       console.error("Error real creando agente:", error);
       setIsLoading(false);
     }
   };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-text-main mb-4">Usar Plantilla</h1>
      <p className="text-base text-text-muted mb-8">Elige una plantilla pre-diseñada para empezar rápidamente.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {availableTemplates.map(template => (
          <Card
            key={template.id}
            className={`cursor-pointer border-2 ${selectedTemplateId === template.id ? 'border-primary ring-2 ring-primary' : 'border-transparent hover:border-border-color'}`}
            onClick={() => setSelectedTemplateId(template.id)}
          >
            <h3 className="font-semibold text-text-main">{template.name}</h3>
            <p className="text-sm text-text-muted mt-1">{template.description}</p>
          </Card>
        ))}
      </div>

      <div className="mt-8 flex justify-end">
        <Button onClick={handleCreate} disabled={!selectedTemplateId || isLoading}>
          {isLoading ? 'Creando Agente...' : 'Crear Agente desde Plantilla'}
        </Button>
      </div>
    </div>
  );
}

export default SelectTemplatePage; 