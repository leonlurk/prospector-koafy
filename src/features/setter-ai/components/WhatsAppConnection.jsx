import React, { useState, useEffect, useCallback } from 'react';
import { useWhatsApp } from '../context/WhatsAppContext';
import { Box, Button, Card, Typography, CircularProgress, Alert, Paper } from '@mui/material';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

const WhatsAppConnection = () => {
  const { 
    whatsappStatus, 
    currentUser,
    connect,
    disconnect
  } = useWhatsApp();
  
  const [isLoading, setIsLoading] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [qrCode, setQrCode] = useState(null);
  const [connectionMessage, setConnectionMessage] = useState('');
  const [waLink, setWaLink] = useState('wa.link/pjxqxl');

  const handleConnect = useCallback(async () => {
    if (!currentUser || isLoading || isDisconnecting || whatsappStatus.status === 'connected' || whatsappStatus.status === 'initializing' || whatsappStatus.status === 'authenticated') {
      return;
    }
    setIsLoading(true);
    setConnectionMessage('Generando código QR...');
    console.log('Conectando usuario:', currentUser);
    try {
      await connect();
    } catch (error) {
      console.error("Error during connect call in component:", error);
      setConnectionMessage(`Error al conectar: ${error.message || 'Error desconocido'}`);
    } finally {
    }
  }, [connect, currentUser, isLoading, isDisconnecting, whatsappStatus.status]);

  const handleDisconnect = useCallback(async () => {
    if (!currentUser || isDisconnecting) {
      return;
    }
    setIsDisconnecting(true);
    setConnectionMessage('Desconectando...');
    try {
      await disconnect();
    } catch (error) {
      console.error("Error during disconnect call:", error);
      setConnectionMessage(`Error al desconectar: ${error.message || 'Error desconocido'}`);
    } finally {
      setIsDisconnecting(false);
    }
  }, [disconnect, currentUser, isDisconnecting]);

  useEffect(() => {
    if (whatsappStatus?.status !== 'connected' && !qrCode) {
      handleConnect();
    }
  }, [handleConnect, whatsappStatus, qrCode]);

  useEffect(() => {
    console.log("[Effect] WhatsAppConnection received status object:", whatsappStatus);
    if (whatsappStatus) {
      setIsDisconnecting(false);

      let newIsLoading = isLoading;
      let newConnectionMessage = connectionMessage;
      let newQrCode = qrCode;

      switch (whatsappStatus.status) {
        case 'initializing':
          console.log("[Effect] Status: initializing");
          newIsLoading = true;
          newConnectionMessage = 'Inicializando conexión...';
          newQrCode = null;
          break;
        case 'generating_qr':
          console.log("[Effect] Status: generating_qr");
          newIsLoading = true;
          newConnectionMessage = 'Generando código QR...';
          if (whatsappStatus.qr) {
            console.log("[Effect] QR found within 'generating_qr' state! Displaying QR.");
            newIsLoading = false;
            newQrCode = whatsappStatus.qr;
            newConnectionMessage = 'Escanea el código QR con WhatsApp en tu teléfono';
            console.log("[Effect] QR Code length:", whatsappStatus.qr?.length);
          } else {
            newQrCode = null;
          }
          break;
        case 'qr':
          console.log("[Effect] Status: qr - Setting loading FALSE, setting QR code");
          newIsLoading = false;
          newConnectionMessage = 'Escanea el código QR con WhatsApp en tu teléfono';
          newQrCode = whatsappStatus.qr;
          console.log("[Effect] QR Code length:", whatsappStatus.qr?.length);
          break;
        case 'authenticated':
          console.log("[Effect] Status: authenticated - Setting loading FALSE");
          newIsLoading = false;
          newConnectionMessage = 'Autenticado. Conectando...';
          newQrCode = null;
          break;
        case 'connected':
          console.log("[Effect] Status: connected - Setting loading FALSE");
          newIsLoading = false;
          newConnectionMessage = '¡WhatsApp conectado correctamente!';
          newQrCode = null;
          break;
        case 'disconnected':
          console.log("[Effect] Status: disconnected - Setting loading FALSE");
          newIsLoading = false;
          newConnectionMessage = `Desconectado: ${whatsappStatus.message || 'Se perdió la conexión'}`;
          newQrCode = null;
          break;
        case 'error':
          console.log("[Effect] Status: error - Setting loading FALSE");
          newIsLoading = false;
          newConnectionMessage = `Error: ${whatsappStatus.message || 'Ocurrió un error'}`;
          newQrCode = null;
          break;
        default:
          console.log("[Effect] Status: unknown (", whatsappStatus.status, ") - Setting loading FALSE");
          newIsLoading = false;
          newConnectionMessage = `Estado desconocido: ${whatsappStatus.status}`;
          newQrCode = null;
          break;
      }

      setIsLoading(newIsLoading);
      setConnectionMessage(newConnectionMessage);
      setQrCode(newQrCode);
    }
  }, [whatsappStatus]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(waLink)
      .then(() => {
        console.log('Link copiado!');
      })
      .catch(err => {
        console.error('Error al copiar link:', err);
      });
  };

  const handleDownloadLink = () => {
    console.log('Descargar link no implementado');
  };

  if (!currentUser) {
    return (
      <Alert severity="warning">
        Error: Usuario no identificado.
      </Alert>
    );
  }

        return (
    <Paper elevation={3} sx={{ 
      padding: '40px', 
      borderRadius: '16px', 
      maxWidth: '550px', 
      width: '100%', 
      margin: 'auto', 
      textAlign: 'center',
      backgroundColor: '#fff'
    }}>
      <Typography variant="h5" component="h2" sx={{ mb: 3, fontWeight: 'bold' }}>
        Este es un link corto de WhatsApp para conectarte a tu API
      </Typography>

      <Box display="flex" alignItems="center" justifyContent="center" mb={3}>
        <WhatsAppIcon sx={{ color: '#25D366', mr: 1, fontSize: '2rem' }} />
        <Typography variant="h6" sx={{ fontWeight: 'medium' }}>
          {waLink}
        </Typography>
      </Box>

      <Box sx={{ minHeight: '320px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', mb: 3 }}>
        {(isLoading || isDisconnecting) && (
          <Box textAlign="center">
            <CircularProgress sx={{ mb: 2 }} />
            <Typography>{connectionMessage}</Typography>
          </Box>
        )}
        {!isLoading && !isDisconnecting && qrCode && (
              <Box 
                component="img" 
            src={qrCode.startsWith('data:') ? qrCode : `data:image/png;base64,${qrCode}`}
                alt="Código QR de WhatsApp"
                sx={{
                  width: 256,
                  height: 256,
              margin: 'auto',
                  border: '1px solid #e0e0e0',
                  padding: 1,
                  borderRadius: 1,
                  backgroundColor: 'white'
                }}
                onError={(e) => {
                  console.error('Error al cargar imagen QR:', e);
                  e.target.src = 'https://via.placeholder.com/256x256?text=QR+Error';
                }}
              />
        )}
        {!isLoading && !isDisconnecting && !qrCode && whatsappStatus.status !== 'connected' && (
          <Alert severity={whatsappStatus.status === 'error' || whatsappStatus.status === 'disconnected' ? 'error' : 'info'} sx={{ width: '100%', justifyContent: 'center' }}>
            {connectionMessage}
          </Alert>
        )}
         {!isLoading && !isDisconnecting && whatsappStatus.status === 'connected' && (
          <Alert severity="success" sx={{ width: '100%', justifyContent: 'center', mb: 2 }}>
            {connectionMessage}
          </Alert>
        )}
      </Box>

      {!isLoading && !isDisconnecting && qrCode && (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, mb: 3 }}>
      <Button 
        variant="contained" 
            onClick={handleCopyLink}
            endIcon={<ArrowForwardIcon />}
            sx={{ 
              borderRadius: '20px', 
              textTransform: 'none', 
              px: 4, 
              py: 1,
              fontSize: '1rem',
              minWidth: '200px'
            }}
          >
            Copiar
      </Button>
          <Typography variant="caption" color="text.secondary">- o -</Typography>
      <Button 
        variant="outlined" 
            onClick={handleDownloadLink}
            endIcon={<ArrowForwardIcon />}
             sx={{ 
              borderRadius: '20px', 
              textTransform: 'none', 
              px: 4, 
              py: 1,
              fontSize: '1rem',
              minWidth: '200px'
            }}
          >
            Descargar Link
      </Button>
        </Box>
      )}

      {!isLoading && whatsappStatus.status === 'connected' && (
         <Button 
          variant="outlined" 
          color="error"
          disabled={isDisconnecting}
          onClick={handleDisconnect}
          sx={{ 
            borderRadius: '20px', 
            textTransform: 'none', 
            px: 4, 
            py: 1,
            fontSize: '1rem',
            minWidth: '200px',
            mt: 2
          }}
        >
          {isDisconnecting ? <CircularProgress size={24} color="inherit" /> : 'Desconectar'}
        </Button>
      )}

    </Paper>
  );
};

export default WhatsAppConnection; 