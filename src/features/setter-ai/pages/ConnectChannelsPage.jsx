import React, { useState, useCallback } from 'react';
import WhatsAppConnection from '../components/WhatsAppConnection';
// import WhatsAppInstructions from '../components/WhatsAppInstructions'; // Ya no se usa aquí
import { Typography, Box, Paper, Grid, Tabs, Tab, Card, CardContent, CardActions, Button, CircularProgress, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
// Importar un icono de Play para el placeholder del video
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord'; // Icon for list items
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
      {tabValue === 0 && (
        <Box>
          {/* Mostrar Instrucciones si NO se está mostrando el QR */}

          {/* Contenido existente de la pestaña WhatsApp (Tarjetas o Conexión QR) */}
          {!showQrConnection ? (
            <Grid container spacing={4} alignItems="stretch"> {/* Cambiado a stretch y eliminada instrucción anterior */}
              {/* Columna Izquierda: Tarjeta de Conexión */}
              <Grid item xs={12} md={5}> {/* Tarjeta ocupa 5/12 en pantallas medianas+ */}
                 <Card sx={{ 
                    borderRadius: '16px', 
                    boxShadow: 3, 
                    height: '100%', 
                    display: 'flex', // Added for flex layout
                    flexDirection: 'column' // Arrange items in a column
                  }}> 
                  <Box sx={{ 
                      // height: 180, // Consider making this flexible or larger
                      flexGrow: 1, // Allow this box to grow and take available space
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
                      Aprende a como sacarle el máximo provecho a los agentes IA
                    </Typography>
                  </CardContent>
                  <CardActions sx={{ 
                    justifyContent: 'space-around', 
                    pb: 2, px: 2, 
                    mt: 'auto' // Push actions to the bottom if content is shorter
                  }}>
                    <Button 
                      variant="contained" 
                      size="large" 
                      onClick={handleConnectWhatsAppApi}
                      // Deshabilitado si conectado, conectando, o mostrando QR
                      disabled={isConnected || isConnecting || showQrConnection}
                      sx={{ borderRadius: '20px', textTransform: 'none', flexGrow: 1, mx: 1 }}
                    >
                      Vincular WhatsApp
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
              {/* Columna Derecha: Instrucciones */}
              <Grid item xs={12} md={7}> {/* Instrucciones ocupan 7/12 en pantallas medianas+ */}
                <Paper elevation={2} sx={{ p: 3, borderRadius: '12px', height: '100%' }}> {/* Añadido height 100% */}
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
                    Cómo conectar tu WhatsApp:
                  </Typography>
                  <List dense>
                    <ListItem disablePadding>
                      <ListItemIcon sx={{ minWidth: '30px' }}><FiberManualRecordIcon sx={{ fontSize: '0.7rem' }} /></ListItemIcon>
                      <ListItemText primary='Haz clic en el botón "Vincular WhatsApp" en el cuadro de la izquierda.' />
                    </ListItem>
                    <ListItem disablePadding>
                      <ListItemIcon sx={{ minWidth: '30px' }}><FiberManualRecordIcon sx={{ fontSize: '0.7rem' }} /></ListItemIcon>
                      <ListItemText primary="Espera a que aparezca el código QR en la pantalla." />
                    </ListItem>
                    <ListItem disablePadding>
                      <ListItemIcon sx={{ minWidth: '30px' }}><FiberManualRecordIcon sx={{ fontSize: '0.7rem' }} /></ListItemIcon>
                      <ListItemText primary="Abre WhatsApp en tu teléfono." />
                    </ListItem>
                    <ListItem disablePadding>
                      <ListItemIcon sx={{ minWidth: '30px' }}><FiberManualRecordIcon sx={{ fontSize: '0.7rem' }} /></ListItemIcon>
                      <ListItemText primary={<span>Ve a <strong>Configuración</strong> {'>'} <strong>Dispositivos vinculados</strong>.</span>} />
                    </ListItem>
                    <ListItem disablePadding>
                      <ListItemIcon sx={{ minWidth: '30px' }}><FiberManualRecordIcon sx={{ fontSize: '0.7rem' }} /></ListItemIcon>
                      <ListItemText primary='Toca "Vincular un dispositivo".' />
                    </ListItem>
                    <ListItem disablePadding>
                      <ListItemIcon sx={{ minWidth: '30px' }}><FiberManualRecordIcon sx={{ fontSize: '0.7rem' }} /></ListItemIcon>
                      <ListItemText primary="Escanea el código QR que se muestra en esta página." />
                    </ListItem>
                  </List>

                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mt: 3, mb: 2 }}>
                    Cómo desconectar tu WhatsApp:
                  </Typography>
                  <List dense>
                    <ListItem disablePadding>
                      <ListItemIcon sx={{ minWidth: '30px' }}><FiberManualRecordIcon sx={{ fontSize: '0.7rem' }} /></ListItemIcon>
                      <ListItemText primary='Haz clic en el botón "Desconectar" en el cuadro de la izquierda en esta plataforma.' />
                    </ListItem>
                    <ListItem disablePadding>
                      <ListItemIcon sx={{ minWidth: '30px' }}><FiberManualRecordIcon sx={{ fontSize: '0.7rem' }} /></ListItemIcon>
                      <ListItemText primary="Para una desconexión completa, también debes desvincular el dispositivo desde tu teléfono." />
                    </ListItem>
                    <ListItem disablePadding>
                      <ListItemIcon sx={{ minWidth: '30px' }}><FiberManualRecordIcon sx={{ fontSize: '0.7rem' }} /></ListItemIcon>
                      <ListItemText primary={<span>En WhatsApp en tu teléfono, ve a <strong>Configuración</strong> {'>'} <strong>Dispositivos vinculados</strong>.</span>} />
                    </ListItem>
                    <ListItem disablePadding>
                      <ListItemIcon sx={{ minWidth: '30px' }}><FiberManualRecordIcon sx={{ fontSize: '0.7rem' }} /></ListItemIcon>
                      <ListItemText primary="Selecciona el dispositivo vinculado a esta plataforma y elige la opción para desvincular o cerrar sesión." />
                    </ListItem>
                  </List>
                </Paper>
              </Grid>
            </Grid>
          ) : (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
              <WhatsAppConnection />
            </Box>
          )}
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