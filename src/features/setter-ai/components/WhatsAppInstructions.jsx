import React, { useEffect } from 'react';
import { Typography, Box, Divider, Card, CardContent, Grid, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';

// Reemplazamos el import que causa error con un componente local
const CheckCircleOutlineIcon = (props) => (
  <svg 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path 
      d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20ZM16.59 7.58L10 14.17L7.41 11.59L6 13L10 17L18 9L16.59 7.58Z" 
      fill="currentColor" 
    />
  </svg>
);

const WhatsAppInstructions = () => {
  // NOTE: Removing simulated user logic. Authentication should come from context.
  /* 
  // Datos de usuario simulado - Utilizamos el ID testUser123 que se observa en los logs
  const simulatedUser = {
    id: 'testUser123',
    name: 'Usuario de Prueba',
    email: 'test@example.com',
    role: 'admin'
  };
  */

  // Efecto para configurar el usuario (simulado por ahora)
  // useEffect(() => {
  //   // Simular carga de usuario
  //   // console.log("Setting simulated user in WhatsAppInstructions");
  //   // setCurrentUser(simulatedUser);
  // }, [setCurrentUser]);

  // Example function to update user ID (for simulation/testing only)
  /*
  const updateUserId = (newId) => {
    let userId = localStorage.getItem('user_id');
    if (userId !== 'testUser123') {
      localStorage.setItem('user_id', 'testUser123');
      userId = 'testUser123';
    }
    let userData = JSON.parse(localStorage.getItem('user_data')) || {};
    userData.id = 'testUser123';
    localStorage.setItem('user_data', JSON.stringify(userData));
    console.log('ID de usuario actualizado a testUser123');
  }
  */

  useEffect(() => {
    // console.log("Usuario actual en WhatsAppInstructions:", currentUser);
  }, []);

  return (
    <Box>
      <Typography variant="h5" component="h2" gutterBottom>
        Instrucciones para conectar WhatsApp
      </Typography>
      
      <Typography variant="body1" paragraph>
        Conectar WhatsApp a nuestra plataforma es un proceso sencillo que te permitirá gestionar tus conversaciones directamente desde aquí.
      </Typography>
      
      <Divider sx={{ my: 3 }} />
      
      <Typography variant="h6" gutterBottom>
        Pasos para conectar WhatsApp:
      </Typography>
      
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" color="primary" gutterBottom>
                1. Iniciar conexión
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircleOutlineIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText primary="Ve a la pestaña 'Conectar'" />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircleOutlineIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText primary="Haz clic en el botón 'Conectar'" />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircleOutlineIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText primary="Espera a que aparezca el código QR" />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" color="primary" gutterBottom>
                2. Escanear el código QR
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircleOutlineIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText primary="Abre WhatsApp en tu teléfono" />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircleOutlineIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText primary="Toca en Menú (⋮) o Ajustes" />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircleOutlineIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText primary="Selecciona 'Dispositivos vinculados'" />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircleOutlineIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText primary="Toca en 'Vincular un dispositivo'" />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircleOutlineIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText primary="Escanea el código QR mostrado en pantalla" />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      <Typography variant="h6" gutterBottom>
        Consideraciones importantes:
      </Typography>
      
      <Card sx={{ mb: 3 }} variant="outlined">
        <CardContent>
          <Typography variant="body2" paragraph>
            • Para que WhatsApp Web funcione, tu teléfono debe estar conectado a Internet.
          </Typography>
          <Typography variant="body2" paragraph>
            • Si cierras la sesión de WhatsApp Web en tu teléfono, tendrás que volver a escanear el código QR.
          </Typography>
          <Typography variant="body2" paragraph>
            • La conexión de WhatsApp Web es segura y todas las comunicaciones están cifradas.
          </Typography>
          <Typography variant="body2" paragraph>
            • Si el código QR está expirado, puedes hacer clic en el botón 'Conectar' nuevamente para generar uno nuevo.
          </Typography>
          <Typography variant="body2">
            • Recomendamos usar un número de teléfono dedicado para integración con la plataforma.
          </Typography>
        </CardContent>
      </Card>
      
      <Box sx={{ p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
        <Typography variant="body2" color="info.contrastText">
          ℹ️ Si tienes problemas para conectar WhatsApp, asegúrate de que tu teléfono tiene una conexión a Internet estable y que estás utilizando la última versión de WhatsApp.
        </Typography>
      </Box>
    </Box>
  );
};

export default WhatsAppInstructions; 