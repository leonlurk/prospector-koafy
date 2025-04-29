import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { createAgent } from '../../services/api';

// Placeholder data for forms
const availableForms = [
  { id: 'form1', name: 'Formulario de Contacto Web' },
  { id: 'form2', name: 'Encuesta de Satisfacción Cliente' },
  { id: 'form3', name: 'Registro a Newsletter' },
];

function SelectFormPage() {
  const navigate = useNavigate();
  const [selectedFormId, setSelectedFormId] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleCreate = async () => {
    if (!selectedFormId) return; // O mostrar error
    setIsLoading(true);
    console.log(`Creando agente desde formulario ID: ${selectedFormId}`);
    try {
      const response = await createAgent({ type: 'form', name: `Agente de ${selectedFormId}`, formId: selectedFormId });
      if (response?.success && response.agentId) {
        navigate(`/agents/${response.agentId}/persona`);
      } else {
        console.error("Error simulado creando agente desde formulario");
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Error real creando agente:", error);
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-text-main mb-4">Empezar con Formulario</h1>
      <p className="text-base text-text-muted mb-8">Selecciona el formulario existente que servirá como base para el conocimiento inicial de tu agente.</p>
      <Card>
        <div className="space-y-4">
          <label htmlFor="form-select" className="block text-sm font-medium text-text-main">
            Selecciona un formulario:
          </label>
          <select
            id="form-select"
            value={selectedFormId}
            onChange={(e) => setSelectedFormId(e.target.value)}
            className="block w-full rounded-md border-border-color shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
          >
            <option value="" disabled>-- Elige un formulario --</option>
            {availableForms.map(form => (
              <option key={form.id} value={form.id}>{form.name}</option>
            ))}
          </select>
          <div className="pt-4 flex justify-end">
            <Button onClick={handleCreate} disabled={!selectedFormId || isLoading}>
              {isLoading ? 'Creando Agente...' : 'Crear Agente desde Formulario'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default SelectFormPage; 