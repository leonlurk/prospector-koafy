import React, { useState, useEffect, useCallback } from 'react';
// Remove useParams, Outlet, NavLink, useLocation - replace with prop-based navigation
// import { useParams, Outlet, NavLink, useLocation } from 'react-router-dom'; 
import { useWhatsApp } from '../context/WhatsAppContext';
import { getAgent } from '../services/api';
// Importar componentes MUI necesarios para la nueva estructura
import { Box, Typography, Paper, Tabs, Tab, CircularProgress, Fade, Button } from '@mui/material'; 
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
// import { useAuth } from '../../../context/AuthContext'; // This seems unused, consider removing if not needed elsewhere

// Child components for tabs (assuming they exist)
import PersonaAIPage from './PersonaAIPage';
import KnowledgeBasePage from './KnowledgeBasePage';
import ActionFlowPage from './ActionFlowPage';
// import PublishPage from './PublishPage'; // <- Ya no es necesario importar

// Updated tabs definition - simpler now, just identifiers
const tabs = [
    { id: 'Persona', name: 'Personalización' },
    { id: 'Knowledge', name: 'Conocimientos' },
    // { id: 'Actions', name: 'Acciones' },
    // { id: 'Publish', name: 'Publicar' }, // <- Eliminado
];

// Accept props: agentId, user, selectedOptionValue (renamed for clarity), setSelectedOption function
function AgentDetailPage({ agentId, user, selectedOption: selectedOptionValue, setSelectedOption }) { 
    const { currentUser } = useWhatsApp(); 
    const [agentData, setAgentData] = useState(null); 
    const [isLoading, setIsLoading] = useState(true); 
    const [error, setError] = useState(null); 
    // Active tab is now primarily driven by local state, updated onClick
    const [activeTabId, setActiveTabId] = useState('Persona'); // Default to Persona

    // Effect to set the *initial* active tab based on the prop when the component mounts *or* agentId changes
    useEffect(() => {
        const optionParts = selectedOptionValue && typeof selectedOptionValue === 'string' ? selectedOptionValue.split('_') : [];
        // Assuming format SetterAgentDetail_TABID_AGENTID
        if (optionParts.length >= 3 && optionParts[0] === 'SetterAgentDetail' && optionParts[2] === agentId) {
             const tabIdFromOption = optionParts[1]; // Get Tab ID from index 1
             const validTab = tabs.find(t => t.id === tabIdFromOption);
             if (validTab) {
                console.log(`AgentDetail Initial Mount/Agent Change: Setting active tab from prop: ${validTab.id}`);
                setActiveTabId(validTab.id);
             } else {
                 console.log(`AgentDetail Initial Mount/Agent Change: Invalid tab in prop, defaulting to Persona.`);
                 setActiveTabId('Persona'); 
             }
        } else {
            console.log(`AgentDetail Initial Mount/Agent Change: Prop format mismatch or different agent, defaulting to Persona.`);
            setActiveTabId('Persona'); // Default if format doesn't match or agentId is different
        }
        // This effect should ONLY run when the specific agent detail page is loaded or the agentId prop changes.
        // It should NOT re-run just because the parent selectedOption changes due to tab clicks within *this* component.
    }, [agentId, selectedOptionValue]); // Depend on agentId and the incoming value

    // useEffect to load agent data (remains largely the same)
    useEffect(() => {
       // ... (loading logic using agentId prop as before) ...
        const userId = user?.uid || currentUser?.uid;
        
        if (!userId || !agentId) { 
            console.error("AgentDetail Error: Missing userId or agentId", { userId, agentId });
            setIsLoading(false);
            setError("Falta información del usuario o ID del agente.");
            setAgentData(null);
            return;
        }

        // Only proceed if agentId looks valid (basic check)
        if (typeof agentId !== 'string' || agentId.length < 3) { 
             console.error("AgentDetail Error: Invalid agentId prop", { agentId });
             setIsLoading(false);
             setError("ID de agente inválido.");
             setAgentData(null);
             return;
        }

        setIsLoading(true);
        setError(null);
        console.log(`AgentDetail: Fetching agent ${agentId} for user ${userId}`);

        getAgent(userId, agentId)
           // ... .then, .catch, .finally ...
           .then(response => {
                console.log(`AgentDetail Response for ${agentId}:`, response);
                if (response.success && response.data?.success && response.data.data) {
                    setAgentData(response.data.data);
                } else {
                    setError(response.data?.message || response.message || "No se encontró el agente.");
                    setAgentData(null); 
                }
            })
            .catch(err => {
                console.error(`AgentDetail Error fetching agent ${agentId}:`, err);
                setError(err.message || "Error de red al cargar el agente.");
                setAgentData(null); 
            })
            .finally(() => {
                setIsLoading(false);
            });

    }, [user, currentUser, agentId]); 

    // Handler para cambio de pestaña usando MUI Tabs
    const handleTabChange = (event, newTabId) => {
        // No cambiar activeTabId inmediatamente si queremos animacion de salida
        // setActiveTabId(newTabId); // Comentar o ajustar si se usa AnimatePresence
        
        const newSelectedOption = `SetterAgentDetail_${newTabId}_${agentId}`;
        console.log(`AgentDetail: MUI Tab changed, setting option to: ${newSelectedOption}, setting activeTabId to ${newTabId}`);
        
        // Actualizar el estado local que controla el contenido
        setActiveTabId(newTabId);
        
        if (typeof setSelectedOption === 'function') {
             setSelectedOption(newSelectedOption); 
        }
    };

    // Render loading/error states
    if (isLoading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>;
    }
    if (error) {
        // Usar un Alert de MUI podría ser mejor visualmente
        return <Paper sx={{ p: 3, m: 3, color: 'error.main', bgcolor: 'error.lighter' }}>Error: {error}</Paper>; 
    }
    if (!agentData) {
        return <Paper sx={{ p: 3, m: 3 }}>Agente no encontrado.</Paper>;
    }

    // Render content based on activeTabId, wrapped in Fade
    const renderTabContent = () => {
        let content = null;
        switch (activeTabId) {
            case 'Persona':
                content = <PersonaAIPage agentData={agentData} user={user || currentUser} agentId={agentId} />;
                break;
            case 'Knowledge':
                content = <KnowledgeBasePage agentData={agentData} user={user || currentUser} agentId={agentId} />;
                break;
            /*
            case 'Actions':
                content = <ActionFlowPage agentData={agentData} user={user || currentUser} agentId={agentId} />;
                break;
            */
            // case 'Publish': // <- Eliminado
            //     content = <PublishPage agentData={agentData} user={user || currentUser} agentId={agentId} />;
            //     break;
            default:
                content = <Box sx={{ p: 3 }}>Contenido no encontrado</Box>;
                break;
        }
        
        // Wrap the content in Fade. Use activeTabId as key to trigger transitions.
        // Timeout controls the speed (in ms).
        return (
            <Fade in={true} key={activeTabId} timeout={500}>
                {/* Wrap content in a div for Fade to work reliably */}
                <div>
                    {content}
                </div>
            </Fade>
        );
    };

    // This handleUpdateAgent might not be directly used anymore if PersonaAIPage handles its own saves
    // Or it could be a general refresh function if needed.
    const handleUpdateAgent = async (updatedData) => {
        if (!currentUser?.uid || !agentId) return;
        console.log("AgentDetail: Updating agent with data (simulated for now):", updatedData);
        // Potentially refetch or merge data if PersonaAIPage doesn't lift state up for all changes
        setAgentData(prev => ({ ...prev, ...updatedData })); 
        // alert("Agente actualizado (simulado)");
    };

    return (
        // Contenedor principal
        <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}> 
            {/* Botón Volver */}
            <Button
                startIcon={<ArrowBackIcon />}
                onClick={() => setSelectedOption('SetterAgents')} // Navega a la lista de agentes
                sx={{
                    mb: 3, // Margen inferior para separar de las pestañas
                    textTransform: 'none', // Evitar mayúsculas automáticas
                    color: 'text.secondary', // Color discreto
                    '&:hover': {
                        backgroundColor: 'action.hover' // Efecto hover suave
                    }
                }}
            >
                Volver a la lista de agentes
            </Button>

            {/* Header (si lo hubiera) */}
            {/* <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}> ... </Box> */}

            {/* Navegación con MUI Tabs */}
             <Box sx={{ borderBottom: 0, mb: 0, backgroundColor: '#F8F9FA', borderRadius: '12px 12px 0 0' }}> {/* Fondo claro para la barra de tabs */}
                <Tabs
                    value={activeTabId} // El valor es el ID de la pestaña activa
                    onChange={handleTabChange}
                    aria-label="Pestañas de configuración del agente"
                    variant="fullWidth" // O 'standard' si se prefiere
                    sx={{
                        minHeight: '48px', // Ajustar altura si es necesario
                        padding: '4px', // Espacio alrededor de las tabs
                        '& .MuiTabs-indicator': {
                            display: 'none', // Ocultar indicador MUI
                        },
                         '& .MuiTab-root': {
                             textTransform: 'none',
                             borderRadius: '9999px',
                             margin: '0 4px', // Espacio entre tabs
                             padding: '10px 16px',
                             minHeight: '40px',
                             fontWeight: 600,
                             color: 'text.secondary', // Color inactivo
                             opacity: 1,
                             // Añadir transición para suavizar cambios de color y fondo
                             transition: 'background-color 0.3s ease-in-out, color 0.3s ease-in-out',
                             '&.Mui-selected': {
                                 backgroundColor: '#000', // Fondo negro activo
                                 color: '#fff', // Texto blanco activo
                             },
                             '&:not(.Mui-selected)': {
                                backgroundColor: 'transparent', // Fondo transparente inactivo
                                 '&:hover': {
                                     backgroundColor: 'action.hover' // Efecto hover ligero
                                 }
                             }
                         }
                    }}
                >
                    {tabs.map((tab) => (
                        // Usar el id como `value` para el estado y el onChange
                        <Tab key={tab.id} label={tab.name} value={tab.id} /> 
                    ))}
                </Tabs>
            </Box>

            {/* Área de Contenido Principal con fondo blanco */}
            <Paper 
                elevation={1} // Sombra sutil
                sx={{ 
                    p: { xs: 2, sm: 3, md: 4 }, // Padding interno
                    borderRadius: '0 0 12px 12px', // Redondeo solo inferior
                    borderTop: '1px solid', // Borde superior para separar de tabs
                    borderColor: 'divider',
                    overflow: 'hidden' // Añadido para contener la animación
                }}
            >
                {renderTabContent()}
            </Paper>

            {/* This save button might become redundant if PersonaAIPage handles its own save */}
            {/* Consider if this button is still needed or if save actions are per-tab */}
            {/* 
            <button onClick={() => handleUpdateAgent(agentData)} style={{ padding: '10px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', marginTop: '20px'}}>
                Guardar Cambios del Agente (Simulado)
            </button> 
            */}
        </Box>
    );
}

export default AgentDetailPage; 