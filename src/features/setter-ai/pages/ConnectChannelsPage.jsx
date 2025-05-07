import React, { useState, useCallback } from 'react';
import WhatsAppConnection from '../components/WhatsAppConnection';
// import WhatsAppInstructions from '../components/WhatsAppInstructions'; // Ya no se usa aquí
import { Typography, Box, Paper, Grid, Tabs, Tab, Card, CardContent, CardActions, Button, CircularProgress } from '@mui/material';
// Importar un icono de Play para el placeholder del video
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import { useWhatsApp } from '../context/WhatsAppContext'; // Importar el contexto

// --- IMPORTAR IMAGEN DIRECTAMENTE ---
import fondoPng from '../assets/FondoWhatsApp.png';

function ConnectChannelsPage() {
  const [tabValue, setTabValue] = useState(0); // 0 para WhatsApp, 1 para Instagram
  const [showQrConnection, setShowQrConnection] = useState(false); // Estado para mostrar la conexión QR
  const [isDisconnecting, setIsDisconnecting] = useState(false); // Estado para la desconexión

  // Obtener estado y función del contexto
  const { whatsappStatus, disconnect } = useWhatsApp();

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setShowQrConnection(false); // Ocultar QR al cambiar de pestaña
  };

  // Función para iniciar la conexión API de WhatsApp
  const handleConnectWhatsAppApi = () => {
    // No mostrar QR si ya está conectado
    if (whatsappStatus?.status !== 'connected') {
        setShowQrConnection(true);
    }
  };

  // Función para manejar la desconexión desde la tarjeta
  const handleDisconnectFromCard = useCallback(async () => {
    if (isDisconnecting || whatsappStatus?.status === 'disconnected') return;
    setIsDisconnecting(true);
    try {
      await disconnect();
      console.log('Desconexión iniciada desde la tarjeta.');
      // Opcional: Ocultar vista QR si estaba abierta al desconectar
      setShowQrConnection(false); 
    } catch (error) {
      console.error("Error al desconectar desde tarjeta:", error);
    } finally {
      setIsDisconnecting(false);
    }
  }, [disconnect, isDisconnecting, whatsappStatus]);

  // Estados derivados para la lógica de botones
  const currentStatus = whatsappStatus?.status;
  const isConnected = currentStatus === 'connected';
  const isConnecting = ['initializing', 'generating_qr', 'authenticated'].includes(currentStatus);
  // Determinar si hay una sesión potencialmente activa o en intento
  const canDisconnect = ['initializing', 'generating_qr', 'authenticated', 'connected', 'error'].includes(currentStatus);

  return (
    <Box className="p-6 md:p-8 lg:p-10 max-w-7xl mx-auto">
      {/* Título principal eliminado o ajustado según layout general si existe */}
      
      {/* Pestañas */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 4 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          aria-label="pestañas de conexión de canales"
          sx={{
            '& .MuiTab-root': { 
              textTransform: 'none', 
              fontWeight: 600,
              fontSize: '1rem',
              color: 'text.secondary', // Color para tabs inactivas
              '&.Mui-selected': {
                backgroundColor: '#000', // Fondo negro para activa como en figma
                color: '#fff', // Texto blanco para activa
                borderRadius: '8px 8px 0 0', // Bordes redondeados superiores
              },
            },
            '& .MuiTabs-indicator': {
              display: 'none', // Ocultar indicador por defecto de MUI
            }
          }}
        >
          <Tab label="Whatsapp" />
          <Tab label="Instagram" disabled /> {/* Deshabilitado por ahora */}
        </Tabs>
      </Box>

      {/* Contenido de la pestaña WhatsApp */}
      {tabValue === 0 && !showQrConnection && (
        <Grid container spacing={4}>
          {/* Grid item 1 - Aplicar props directamente */}
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
             <Card sx={{ borderRadius: '16px', boxShadow: 3 }}>
              <Box sx={{ 
                  height: 180, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  backgroundImage: `url(${fondoPng})`, // <-- USAR VARIABLE IMPORTADA
                  backgroundSize: 'cover', // <-- RESTAURAR COVER
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat'
              }}>

              </Box>
              <CardContent>
                <Typography gutterBottom variant="h6" component="div" sx={{ fontWeight: 'thin' }}>
                  Conecta con WhatsApp API
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Aprende a como sacarle el maximo provecho a los agentes IA
                </Typography>
              </CardContent>
              <CardActions sx={{ justifyContent: 'space-around', pb: 2, px: 2 }}>
                <Button 
                  variant="contained" 
                  size="large" 
                  onClick={handleConnectWhatsAppApi}
                  // Deshabilitado si conectado, conectando, o mostrando QR
                  disabled={isConnected || isConnecting || showQrConnection}
                  sx={{ borderRadius: '20px', textTransform: 'none', flexGrow: 1, mx: 1 }}
                >
                  Ingresar
                </Button>
                <Button 
                  variant="outlined"
                  color="error"
                  size="large" 
                  onClick={handleDisconnectFromCard}
                  // REVERTIDO: Volver a usar la variable canDisconnect como estaba antes
                  disabled={!canDisconnect || isDisconnecting}
                  sx={{ borderRadius: '20px', textTransform: 'none', flexGrow: 1, mx: 1 }}
                >
                  {isDisconnecting ? <CircularProgress size={24} color="inherit" /> : 'Desconectar'}
                </Button>
              </CardActions>
            </Card>
          </Grid>
        </Grid>
      )}

       {/* Mostrar componente de conexión QR si se hizo clic en Ingresar API */}
      {tabValue === 0 && showQrConnection && (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
           {/* Aquí es donde se debe renderizar la vista del QR, 
               usando el componente WhatsAppConnection que ya tiene la lógica */}
           <WhatsAppConnection /> 
           {/* Necesitaremos ajustar WhatsAppConnection para que encaje en este nuevo flujo */}
        </Box>
      )}


      {/* Contenido de la pestaña Instagram (Placeholder) */}
      {tabValue === 1 && (
        <Typography>
          La conexión con Instagram estará disponible próximamente.
        </Typography>
      )}
    </Box>
  );
}

export default ConnectChannelsPage; 