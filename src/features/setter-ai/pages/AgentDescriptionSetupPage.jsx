import React, { useState, useCallback } from 'react';
import { useWhatsApp } from '../context/WhatsAppContext'; // Para obtener currentUser
import { createAgent } from '../services/api'; // Para llamar a la API de creación
import { Box, Typography, TextareaAutosize, Button, CircularProgress, Paper, Tabs, Tab } from '@mui/material'; // Usar componentes MUI
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowLeftIcon from '@mui/icons-material/ArrowLeft';
import LightbulbIcon from '@mui/icons-material/Lightbulb'; // Icono para Asistencia
import ListAltIcon from '@mui/icons-material/ListAlt'; // Icono para Ejemplos

// Props: setSelectedOption para navegar
function AgentDescriptionSetupPage({ setSelectedOption }) {
  const { currentUser } = useWhatsApp();
  const [description, setDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0); // 0 para Asistencia, 1 para Ejemplos

  const handleDescriptionChange = (event) => {
    setDescription(event.target.value);
  };

  const handleContinue = useCallback(async () => {
    if (!currentUser?.uid || !description.trim() || isCreating) {
      if (!description.trim()) {
          setError("Por favor, describe tu agente antes de continuar.");
      }
      return;
    }

    setIsCreating(true);
    setError(null);

    const agentData = {
      persona: {
        name: "Nuevo Agente", // Nombre inicial, se puede cambiar después
        instructions: description.trim(),
        model: 'gpt-4', // Valores por defecto
        temperature: 0.7,
        language: 'es'
      },
      knowledge: {} // Base de conocimientos vacía inicialmente
    };

    try {
      const response = await createAgent(currentUser.uid, agentData);
      if (response.success && response.data?.success && response.data.data?.id) {
        const newAgentId = response.data.data.id;
        console.log(`AgentDescriptionSetup: Agente creado con ID: ${newAgentId}`);
        // Navegar a la página de detalles, pestaña Persona
        setSelectedOption(`SetterAgentDetail_Persona_${newAgentId}`); 
      } else {
        setError(response.data?.message || response.message || "Error al crear el agente.");
        setIsCreating(false); // Permitir reintento
      }
    } catch (err) {
      console.error("Error creating agent:", err);
      setError(err.message || "Error de red al crear el agente.");
      setIsCreating(false); // Permitir reintento
    }
    // No poner setIsCreating(false) aquí si la navegación tiene éxito
  }, [currentUser, description, isCreating, setSelectedOption]);

  const handleOmit = () => {
      console.log("Omitir descripción - Crear agente con descripción vacía y navegar");
       // Reutilizar lógica de handleContinue pero con descripción vacía
       // Podríamos refactorizar para evitar duplicación, pero por ahora es más claro así
       if (!currentUser?.uid || isCreating) return;
       setIsCreating(true);
       setError(null);
       const agentData = { persona: { name: "Nuevo Agente", instructions: "", model: 'gpt-4', temperature: 0.7, language: 'es' }, knowledge: {} };
       createAgent(currentUser.uid, agentData)
         .then(response => {
            if (response.success && response.data?.success && response.data.data?.id) {
                const newAgentId = response.data.data.id;
                setSelectedOption(`SetterAgentDetail_Persona_${newAgentId}`);
            } else {
                setError(response.data?.message || response.message || "Error al crear agente (omitir).");
                setIsCreating(false);
            }
        })
        .catch(err => {
             console.error("Error creating agent (omit):", err);
             setError(err.message || "Error de red al crear agente (omitir).");
             setIsCreating(false);
        });
  };
  
   const handleBack = () => {
        // Navegar de vuelta a la vista de selección de agente/plantilla
        // Asumiendo que la vista anterior es manejada por AgentListPage reseteando su estado
        setSelectedOption('SetterAgents'); // O la clave que represente la lista/vista de creación inicial
    };

   const handleTabChange = (event, newValue) => {
      setActiveTab(newValue);
   };


  return (
    <Paper elevation={0} sx={{ p: 4, maxWidth: '800px', mx: 'auto', backgroundColor: 'transparent' }}>
       <Button 
            startIcon={<ArrowLeftIcon />} 
            onClick={handleBack}
            sx={{ mb: 3, textTransform: 'none', color: 'text.secondary' }}
       >
            Atrás
       </Button>
    
      <Typography variant="h4" component="h1" sx={{ mb: 1, fontWeight: 'bold' }}>
        Describe tu Agente
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Vas a describir detalladamente a tu agente, se detallado para que la IA pueda reconocer lo que requieres.
      </Typography>

      <Paper variant="outlined" sx={{ p: 3, mb: 4, backgroundColor: '#f8f9fa', borderColor: '#dee2e6' }}>
        <Typography variant="caption" display="block" color="text.secondary" sx={{ mb: 1}}>
            Ejemplo: Crea un agente que me ayude con ideas de diseño Grafico. Donde creo contenido para redes sociales.
        </Typography>
        <TextareaAutosize
          minRows={6}
          placeholder="Describe aquí las funciones principales de tu agente..."
          value={description}
          onChange={handleDescriptionChange}
          style={{ 
              width: '100%', 
              padding: '12px', 
              borderRadius: '8px', 
              border: '1px solid #ced4da', 
              fontSize: '1rem',
              fontFamily: 'inherit',
              resize: 'vertical',
              backgroundColor: '#ffffff' // Fondo blanco para el textarea
          }}
          disabled={isCreating}
        />
      </Paper>

       {/* Pestañas Asistencia / Ejemplos */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange} aria-label="pestañas de ayuda">
          <Tab icon={<LightbulbIcon />} iconPosition="start" label="Asistencia" sx={{ textTransform: 'none' }} />
          <Tab icon={<ListAltIcon />} iconPosition="start" label="Ejemplos" sx={{ textTransform: 'none' }}/>
        </Tabs>
      </Box>
       {/* Contenido de las pestañas (Placeholder) */}
       <Box sx={{ p: 2, minHeight: '100px', backgroundColor: '#f8f9fa', borderRadius: '8px', mb: 4}}>
           {activeTab === 0 && (
                <Typography variant="body2" color="text.secondary">
                   Aquí podríamos mostrar consejos o guías sobre cómo describir mejor al agente.
                   Por ejemplo: Sé específico, menciona el objetivo principal, define el tono deseado, etc.
                </Typography>
           )}
           {activeTab === 1 && (
               <Typography variant="body2" color="text.secondary">
                   Aquí irían ejemplos concretos de descripciones para diferentes tipos de agentes (soporte, ventas, etc.).
               </Typography>
           )}
       </Box>


       <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        *Al darle continuar, te enviaremos a una seccion a parte para que puedas entrenar tu Agente... Igualmente te daremos una opcion para que puedas entrenar a tu agente.*
      </Typography>

      {error && (
        <Typography color="error" sx={{ mb: 2, textAlign: 'center' }}>
          Error: {error}
        </Typography>
      )}

      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
        <Button
          variant="contained"
          color="primary"
          size="large"
          endIcon={isCreating ? null : <ArrowForwardIcon />}
          onClick={handleContinue}
          disabled={isCreating || !description.trim()}
          sx={{ borderRadius: '20px', px: 5, minWidth: '200px' }}
        >
          {isCreating ? <CircularProgress size={24} color="inherit" /> : 'Continuar'}
        </Button>
        <Typography variant="body2" color="text.secondary">- o -</Typography>
        <Button
          variant="outlined"
          size="large"
          endIcon={<ArrowForwardIcon />}
          onClick={handleOmit}
          disabled={isCreating}
           sx={{ borderRadius: '20px', px: 5, minWidth: '200px' }}
        >
          Omitir
        </Button>
      </Box>
    </Paper>
  );
}

export default AgentDescriptionSetupPage; 