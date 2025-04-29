import React, { useState, useEffect } from 'react';
import { useWhatsApp } from '../context/WhatsAppContext';

const WhatsAppStats = () => {
  const { currentUser, whatsappStatus } = useWhatsApp();
  const [stats, setStats] = useState({
    totalMessages: 0,
    sentMessages: 0,
    receivedMessages: 0,
    activeChats: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Placeholder para cargar estadísticas reales
    // En una implementación real, aquí se llamaría a una API para obtener estadísticas
    if (currentUser && whatsappStatus.status === 'connected') {
      setIsLoading(true);
      // Simulación de carga de datos
      setTimeout(() => {
        setStats({
          totalMessages: 256,
          sentMessages: 142,
          receivedMessages: 114,
          activeChats: 18
        });
        setIsLoading(false);
      }, 1000);
    } else {
      setIsLoading(false);
    }
  }, [currentUser, whatsappStatus.status]);

  const ConnectionBadge = () => {
    let color = 'bg-gray-100 text-gray-800';
    let text = 'No conectado';

    if (whatsappStatus.status === 'connected') {
      color = 'bg-green-100 text-green-800';
      text = 'Conectado';
    } else if (whatsappStatus.status === 'connecting' || whatsappStatus.status === 'generating_qr') {
      color = 'bg-yellow-100 text-yellow-800';
      text = 'Conectando...';
    } else if (whatsappStatus.status === 'error') {
      color = 'bg-red-100 text-red-800';
      text = 'Error';
    }

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
        {text}
      </span>
    );
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-medium text-gray-900">WhatsApp Stats</h2>
        <ConnectionBadge />
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : !currentUser || whatsappStatus.status !== 'connected' ? (
        <div className="text-center py-8 text-gray-500">
          <p>Conecta WhatsApp para ver estadísticas</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-indigo-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-indigo-600 mb-1">Mensajes Totales</h3>
            <p className="text-2xl font-bold text-indigo-800">{stats.totalMessages}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-green-600 mb-1">Mensajes Enviados</h3>
            <p className="text-2xl font-bold text-green-800">{stats.sentMessages}</p>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-blue-600 mb-1">Mensajes Recibidos</h3>
            <p className="text-2xl font-bold text-blue-800">{stats.receivedMessages}</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-purple-600 mb-1">Chats Activos</h3>
            <p className="text-2xl font-bold text-purple-800">{stats.activeChats}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default WhatsAppStats; 