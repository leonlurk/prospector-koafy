import React, { useState, useEffect } from 'react';
import { useWhatsApp } from '../context/WhatsAppContext';
import { getChats } from '../services/api';

const WhatsAppChatList = ({ onSelectChat }) => {
  const { currentUser, whatsappStatus, addNotification } = useWhatsApp();
  const [chats, setChats] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchChats = async () => {
      if (currentUser && whatsappStatus.status === 'connected') {
        setIsLoading(true);
        try {
          const response = await getChats(currentUser.id);
          if (response.success) {
            setChats(response.data || []);
          } else {
            addNotification({
              type: 'error',
              title: 'Error al cargar chats',
              message: response.message || 'No se pudieron cargar los chats'
            });
            setChats([]);
          }
        } catch (error) {
          addNotification({
            type: 'error',
            title: 'Error al cargar chats',
            message: error.message || 'Error de conexión'
          });
          setChats([]);
        } finally {
          setIsLoading(false);
        }
      } else {
        setChats([]);
        setIsLoading(false);
      }
    };

    fetchChats();
    
    // Configurar un intervalo para actualizar los chats cada 30 segundos si está conectado
    let interval;
    if (currentUser && whatsappStatus.status === 'connected') {
      interval = setInterval(fetchChats, 30000); // 30 segundos
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [currentUser, whatsappStatus.status, addNotification]);

  const filteredChats = chats.filter(chat => 
    (chat.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    chat.phone?.includes(searchTerm))
  );

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    
    // Si es hoy, mostrar solo la hora
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // Si es ayer
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Ayer';
    }
    
    // Si es esta semana
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    if (date >= weekStart) {
      const options = { weekday: 'short' };
      return date.toLocaleDateString(undefined, options);
    }
    
    // Para fechas más antiguas
    return date.toLocaleDateString([], { day: 'numeric', month: 'numeric' });
  };

  return (
    <div className="h-full flex flex-col border-r border-gray-200">
      {/* Search Bar */}
      <div className="p-4 border-b border-gray-200">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="Buscar chat"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : !currentUser || whatsappStatus.status !== 'connected' ? (
          <div className="flex flex-col items-center justify-center h-full p-4 text-center text-gray-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p>WhatsApp no está conectado</p>
            <p className="text-sm mt-2">Conecta WhatsApp para ver tus chats</p>
          </div>
        ) : filteredChats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-4 text-center text-gray-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 16l2.879-2.879m0 0a3 3 0 104.243-4.242 3 3 0 00-4.243 4.242zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p>No se encontraron chats</p>
            <p className="text-sm mt-2">Intenta con otra búsqueda</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {filteredChats.map((chat) => (
              <li
                key={chat.id}
                className="hover:bg-gray-50 cursor-pointer"
                onClick={() => onSelectChat(chat)}
              >
                <div className="relative px-4 py-4 flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    {chat.isGroup ? (
                      <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-500">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-500">
                        {chat.name ? chat.name.charAt(0).toUpperCase() : '#'}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900 truncate">{chat.name || chat.phone}</p>
                      <p className="text-xs text-gray-500">{formatTimestamp(chat.timestamp)}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-500 truncate">{chat.lastMessage}</p>
                      {chat.unread > 0 && (
                        <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-green-100 text-xs font-medium text-green-800">
                          {chat.unread}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default WhatsAppChatList; 