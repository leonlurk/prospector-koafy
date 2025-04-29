import React, { useState, useEffect, useRef } from 'react';
import { useWhatsApp } from '../context/WhatsAppContext';
import { getChatMessages, sendMessage } from '../services/api';

const WhatsAppConversation = ({ chat }) => {
  const { currentUser, addNotification } = useWhatsApp();
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!chat) return;
    
    const fetchMessages = async () => {
      setIsLoading(true);
      try {
        const response = await getChatMessages(currentUser.id, chat.id);
        if (response.success) {
          setMessages(response.data || []);
        } else {
          addNotification({
            type: 'error',
            title: 'Error al cargar mensajes',
            message: response.message || 'No se pudieron cargar los mensajes'
          });
        }
      } catch (error) {
        addNotification({
          type: 'error',
          title: 'Error al cargar mensajes',
          message: error.message || 'Error de conexión'
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchMessages();
    
    // Configurar un intervalo para actualizar mensajes cada 10 segundos
    const interval = setInterval(fetchMessages, 10000);
    
    return () => clearInterval(interval);
  }, [chat, currentUser, addNotification]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !chat || isSending) return;

    // Optimistic update - add message to UI immediately
    const tempId = `temp-${Date.now()}`;
    const tempMessage = {
      id: tempId,
      text: newMessage,
      timestamp: new Date().toISOString(),
      fromMe: true,
      status: 'sending'
    };
    
    setMessages(prev => [...prev, tempMessage]);
    setNewMessage('');
    setIsSending(true);
    
    try {
      const response = await sendMessage(currentUser.id, chat.id, newMessage);
      
      if (response.success) {
        // Update with real message data from server
        setMessages(prev => 
          prev.map(msg => 
            msg.id === tempId ? { ...response.data, status: 'sent' } : msg
          )
        );
        
        addNotification({
          type: 'success',
          title: 'Mensaje enviado',
          message: 'El mensaje ha sido enviado correctamente'
        });
      } else {
        // Mark as failed
        setMessages(prev => 
          prev.map(msg => 
            msg.id === tempId ? { ...msg, status: 'failed' } : msg
          )
        );
        
        addNotification({
          type: 'error',
          title: 'Error al enviar mensaje',
          message: response.message || 'No se pudo enviar el mensaje'
        });
      }
    } catch (error) {
      // Mark as failed
      setMessages(prev => 
        prev.map(msg => 
          msg.id === tempId ? { ...msg, status: 'failed' } : msg
        )
      );
      
      addNotification({
        type: 'error',
        title: 'Error al enviar mensaje',
        message: error.message || 'Error de conexión'
      });
    } finally {
      setIsSending(false);
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!chat) {
    return (
      <div className="h-full flex items-center justify-center p-6 bg-gray-50">
        <div className="text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900">Ninguna conversación seleccionada</h3>
          <p className="mt-2 text-sm text-gray-500">Selecciona un chat para ver la conversación</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Chat Header */}
      <div className="px-4 py-3 border-b border-gray-200 flex items-center">
        <div className="flex-shrink-0 mr-3">
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
        <div>
          <h2 className="text-lg font-medium text-gray-900">{chat.name || chat.phone}</h2>
          <p className="text-sm text-gray-500">{chat.phone}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12a3.5 3.5 0 11-7 0 3.5 3.5 0 017 0zm-11-4a3.5 3.5 0 11-7 0 3.5 3.5 0 017 0zm0 8a3.5 3.5 0 11-7 0 3.5 3.5 0 017 0z" />
            </svg>
            <p className="text-gray-500">No hay mensajes en esta conversación</p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((message) => (
              <div 
                key={message.id} 
                className={`flex ${message.fromMe ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-xs sm:max-w-md px-4 py-2 rounded-lg ${
                    message.fromMe 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-white text-gray-800 border border-gray-200'
                  }`}
                >
                  <div className="text-sm">{message.text}</div>
                  <div className="mt-1 flex items-center justify-end space-x-1">
                    <span className="text-xs text-gray-500">{formatTime(message.timestamp)}</span>
                    {message.fromMe && (
                      <span>
                        {message.status === 'sending' && (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        )}
                        {message.status === 'sent' && (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                        {message.status === 'delivered' && (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M6.293 9.293a1 1 0 011.414 0L10 11.586l6.293-6.293a1 1 0 111.414 1.414l-7 7a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        )}
                        {message.status === 'read' && (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M6.293 9.293a1 1 0 011.414 0L10 11.586l6.293-6.293a1 1 0 111.414 1.414l-7 7a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        )}
                        {message.status === 'failed' && (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Message Input */}
      <div className="px-4 py-3 border-t border-gray-200">
        <form onSubmit={handleSendMessage} className="flex space-x-2">
          <input
            type="text"
            className="flex-1 min-w-0 rounded-md border border-gray-300 px-3 py-2 text-base leading-6 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Escribe un mensaje..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            disabled={isSending}
          />
          <button
            type="submit"
            className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
              isSending || !newMessage.trim()
                ? 'bg-indigo-400 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
            }`}
            disabled={isSending || !newMessage.trim()}
          >
            {isSending ? (
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="-ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
            Enviar
          </button>
        </form>
      </div>
    </div>
  );
};

export default WhatsAppConversation; 