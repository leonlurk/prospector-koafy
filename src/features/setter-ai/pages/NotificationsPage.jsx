import React, { useState } from 'react';

// --- Placeholder Icons ---
const BellAlertIcon = (props) => (
 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
  <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0M12.75 3.935c.386-.195.806-.327 1.246-.419A6.001 6.001 0 0121 9v.75" />
</svg>
);

const CheckCircleIcon = (props) => (
 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
</svg>
);

// --- Main Notifications Page Component ---
function NotificationsPage() {
  // Placeholder Data
  const notifications = [
    { id: 1, type: 'success', title: 'Agente Publicado', description: 'Tu agente "Ventas Bot" ha sido publicado con éxito.', timestamp: 'Hace 5 minutos', read: false },
    { id: 2, type: 'warning', title: 'Límite de Mensajes Cercano', description: 'Has utilizado el 90% de tu cuota de mensajes para el plan Pro.', timestamp: 'Hace 2 horas', read: false },
    { id: 3, type: 'info', title: 'Nueva Conexión', description: 'Se ha conectado un nuevo canal de WhatsApp.', timestamp: 'Hace 1 día', read: true },
    { id: 4, type: 'error', title: 'Error de Facturación', description: 'No se pudo procesar el pago de tu suscripción.', timestamp: 'Hace 3 días', read: true },
  ];

  const [filter, setFilter] = useState('all'); // 'all', 'unread'

  const filteredNotifications = notifications.filter(n => 
     filter === 'all' || (filter === 'unread' && !n.read)
  );

  const getNotificationIcon = (type) => {
      switch (type) {
          case 'success': return <CheckCircleIcon className="w-6 h-6 text-green-500" />;
          case 'warning': return <BellAlertIcon className="w-6 h-6 text-yellow-500" />;
          case 'error': return <BellAlertIcon className="w-6 h-6 text-red-500" />;
          case 'info':
          default: return <BellAlertIcon className="w-6 h-6 text-blue-500" />;
      }
  };

  return (
    <div className="p-6 md:p-8 lg:p-10 max-w-full mx-auto">
       {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-800">Notificaciones</h1>
        <p className="mt-1 text-sm text-gray-500">Revisa las actualizaciones importantes y alertas.</p>
      </div>

      {/* Filter Controls */}
      <div className="mb-6 flex items-center space-x-2 border-b border-gray-200 pb-3">
         <button 
            onClick={() => setFilter('all')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors duration-150 ${filter === 'all' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
         >
            Todas
         </button>
         <button 
             onClick={() => setFilter('unread')}
             className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors duration-150 ${filter === 'unread' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
          >
             No Leídas
         </button>
         {/* Optional: Add Mark All as Read button */}
         {/* <button className="ml-auto text-sm text-indigo-600 hover:underline">Marcar todas como leídas</button> */}
      </div>

      {/* Notifications List */}
      <div className="space-y-4">
         {filteredNotifications.length > 0 ? (
             filteredNotifications.map((notification) => (
               <div 
                 key={notification.id} 
                 className={`bg-white rounded-lg shadow-sm border p-4 flex items-start space-x-4 transition-opacity duration-200 ${notification.read ? 'opacity-60 border-gray-100' : 'border-gray-200'}`}
               >
                  <div className="shrink-0 mt-1">
                     {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1">
                     <h3 className={`text-sm font-semibold ${notification.read ? 'text-gray-600' : 'text-gray-800'}`}>{notification.title}</h3>
                     <p className={`mt-1 text-sm ${notification.read ? 'text-gray-500' : 'text-gray-600'}`}>{notification.description}</p>
                     <p className="mt-2 text-xs text-gray-400">{notification.timestamp}</p>
                  </div>
                   {/* Optional: Action button (e.g., mark as read/unread, view details) */}
                   {!notification.read && (
                     <button className="text-xs text-indigo-500 hover:text-indigo-700 shrink-0" title="Marcar como leída">
                       Marcar Leída
                     </button>
                    )}
               </div>
             ))
         ) : (
             <div className="text-center py-16 px-6 bg-white rounded-lg border border-gray-200">
                 <BellAlertIcon className="mx-auto h-10 w-10 text-gray-400" />
                 <p className="mt-4 text-sm text-gray-500">No tienes notificaciones {filter === 'unread' ? 'no leídas' : 'nuevas'}.</p>
             </div>
         )}
      </div>
      
    </div>
  );
}

export default NotificationsPage; 