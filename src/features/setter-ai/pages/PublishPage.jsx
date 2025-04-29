import React, { useState, useEffect, useCallback } from 'react';
import { useWhatsApp } from '../context/WhatsAppContext';

// Heroicon
const ClipboardDocumentIcon = (props) => (
 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
  <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
</svg>
);

const CheckCircleIcon = (props) => (
 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
</svg>
);

// Nuevo icono para refrescar
const ArrowPathIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
  </svg>
);

// Added ExclamationTriangleIcon for errors
const ExclamationTriangleIcon = (props) => (
 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
</svg>
);

function PublishPage() {
  const { whatsappStatus, isLoading: contextIsLoading, checkStatus, currentUser } = useWhatsApp();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
      if (!currentUser?.uid) return;
      setIsRefreshing(true);
      try {
        await checkStatus(currentUser.uid);
      } catch (e) {
        console.error("Error manual refresh:", e);
      } finally {
          setIsRefreshing(false);
      }
  }

  const renderStatusBadge = () => {
    let bgColor, textColor, text;
    switch (whatsappStatus.status) {
      case 'connected':
        bgColor = 'bg-green-100'; textColor = 'text-green-800'; text = 'Conectado';
        break;
      case 'generating_qr':
        bgColor = 'bg-yellow-100'; textColor = 'text-yellow-800'; text = 'Esperando QR';
        break;
      case 'error':
         bgColor = 'bg-red-100'; textColor = 'text-red-800'; text = 'Error';
         break;
      case 'disconnected':
      default:
        bgColor = 'bg-gray-100'; textColor = 'text-gray-800'; text = 'Desconectado';
        break;
    }
    return <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${bgColor} ${textColor}`}>{text}</span>;
  };

  if (contextIsLoading) {
    return <p className="text-center text-gray-500 py-10">Cargando información de publicación...</p>;
  }

  return (
    <div className="space-y-6">
       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
           <div>
              <h2 className="text-xl font-semibold text-gray-800">Publicar Agente / Estado Conexión</h2>
              <p className="text-sm text-gray-500 mt-1">Gestiona el estado de conexión de WhatsApp para tu usuario.</p>
           </div>
           <div className="flex items-center space-x-3 shrink-0">
                {renderStatusBadge()}
                <button 
                  onClick={handleRefresh}
                  disabled={isRefreshing || !currentUser?.uid}
                  className="inline-flex items-center justify-center px-3 py-1.5 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 rounded-md text-xs font-medium transition duration-150 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                     <ArrowPathIcon className={`w-4 h-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
                    {isRefreshing ? 'Refrescando...' : 'Refrescar'}
                </button>
           </div>
       </div>

        {/* Error Message Display */}
        {whatsappStatus.status === 'error' && whatsappStatus.error && (
             <div className="rounded-md bg-red-50 p-4 border border-red-200">
               <div className="flex">
                 <div className="shrink-0">
                   <ExclamationTriangleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
                 </div>
                 <div className="ml-3">
                   <h3 className="text-sm font-medium text-red-800">Error de Conexión</h3>
                   <div className="mt-2 text-sm text-red-700">
                     <p>{whatsappStatus.error || 'Ocurrió un error desconocido.'}</p>
                     {whatsappStatus.message && <p className="mt-1 text-xs">Detalle: {whatsappStatus.message}</p>}
                   </div>
                 </div>
               </div>
             </div>
        )}

       {/* QR Code Display */}
        {whatsappStatus.status === 'generating_qr' && whatsappStatus.qr && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                 <h3 className="text-lg font-medium text-gray-900 mb-2">Conectar WhatsApp</h3>
                 <p className="text-sm text-gray-500 mb-4">Escanea el código QR con tu aplicación de WhatsApp para activar el agente.</p>
                 <div className="text-center p-4 border border-gray-200 rounded-md bg-gray-50">
                    <img src={whatsappStatus.qr} alt="Código QR de WhatsApp" className="mx-auto border border-gray-300 p-1 max-w-xs bg-white" />
                    <p className="text-xs text-gray-500 mt-3">Ve a WhatsApp &gt; Dispositivos Vinculados &gt; Vincular un dispositivo.</p>
                 </div>
            </div>
        )}

        {/* Published State Display */}
         {whatsappStatus.status === 'connected' && (
             <div className="rounded-md bg-green-50 p-4 border border-green-200">
               <div className="flex">
                 <div className="shrink-0">
                   <CheckCircleIcon className="h-5 w-5 text-green-400" aria-hidden="true" />
                 </div>
                 <div className="ml-3">
                   <h3 className="text-sm font-medium text-green-800">WhatsApp Conectado</h3>
                   <div className="mt-2 text-sm text-green-700">
                     <p>El agente está conectado a través de WhatsApp y listo para interactuar.</p>
                     {whatsappStatus.message && <p className="mt-1 text-xs">{whatsappStatus.message}</p>}
                   </div>
                 </div>
               </div>
             </div>
        )}

         {/* Disconnected State Display */}
         {whatsappStatus.status === 'disconnected' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                 <h3 className="text-lg font-medium text-gray-900 mb-2">WhatsApp Desconectado</h3>
                 <p className="text-sm text-gray-500">El agente no está conectado actualmente a WhatsApp. Intenta conectar desde la sección "Conexiones" o refresca el estado.</p>
            </div>
        )}

    </div>
  );
}
export default PublishPage; 