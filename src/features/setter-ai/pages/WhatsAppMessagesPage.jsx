import React, { useState, useEffect, useRef } from 'react';
import { useWhatsApp } from '../context/WhatsAppContext';
import { getChats, getChatMessages, sendMessage, createNewChat } from '../services/api';
import WhatsAppChatList from '../components/WhatsAppChatList';
import WhatsAppConversation from '../components/WhatsAppConversation';

function WhatsAppMessagesPage() {
  const { currentUser, whatsappStatus } = useWhatsApp();
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showNewChatForm, setShowNewChatForm] = useState(false);
  const [newChatData, setNewChatData] = useState({ phoneNumber: '', name: '' });
  
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (currentUser && whatsappStatus.status === 'connected') {
      loadChats();
    }
  }, [currentUser, whatsappStatus.status]);

  useEffect(() => {
    if (selectedChat) {
      loadMessages(selectedChat.id);
    }
  }, [selectedChat]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadChats = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getChats(currentUser.id);
      if (response.success) {
        setChats(response.data);
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError('Failed to load chats');
    } finally {
      setIsLoading(false);
    }
  };

  const loadMessages = async (chatId) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getChatMessages(currentUser.id, chatId);
      if (response.success) {
        setMessages(response.data);
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError('Failed to load messages');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChat) return;

    setIsLoading(true);
    setError(null);
    try {
      const response = await sendMessage(currentUser.id, selectedChat.id, newMessage);
      if (response.success) {
        setNewMessage('');
        loadMessages(selectedChat.id);
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError('Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNewChat = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const response = await createNewChat(
        currentUser.id,
        newChatData.phoneNumber,
        newChatData.name
      );
      if (response.success) {
        setShowNewChatForm(false);
        setNewChatData({ phoneNumber: '', name: '' });
        loadChats();
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError('Failed to create new chat');
    } finally {
      setIsLoading(false);
    }
  };

  const ConnectionWarning = () => {
    if (!currentUser) {
      return (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                No hay ningún usuario de WhatsApp configurado.
              </p>
            </div>
          </div>
        </div>
      );
    }

    if (whatsappStatus.status !== 'connected') {
      return (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                WhatsApp no está conectado. Conéctate primero para empezar a chatear.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  const NewChatForm = () => (
    <div className="flex flex-col h-full bg-white">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900">Nuevo Chat</h2>
          <button
            onClick={() => setShowNewChatForm(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
      <div className="p-4">
        <form onSubmit={handleCreateNewChat} className="mt-5">
          <div className="mb-4">
            <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
              Phone Number
            </label>
            <input
              type="text"
              id="phoneNumber"
              value={newChatData.phoneNumber}
              onChange={(e) =>
                setNewChatData({ ...newChatData, phoneNumber: e.target.value })
              }
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Name (optional)
            </label>
            <input
              type="text"
              id="name"
              value={newChatData.name}
              onChange={(e) =>
                setNewChatData({ ...newChatData, name: e.target.value })
              }
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:col-start-2 sm:text-sm"
            >
              Create
            </button>
            <button
              type="button"
              onClick={() => setShowNewChatForm(false)}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:col-start-1 sm:text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Mensajes de WhatsApp</h1>
        <p className="text-gray-600">Gestiona tus conversaciones de WhatsApp</p>
      </div>

      <ConnectionWarning />

      <div className="bg-white shadow-md rounded-lg overflow-hidden mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 h-[70vh]">
          {/* Sidebar */}
          <div className="md:col-span-1 border-r border-gray-200">
            <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-lg font-medium text-gray-900">Chats</h2>
              <button
                onClick={() => {
                  setShowNewChatForm(true);
                  setSelectedChat(null);
                }}
                className="text-indigo-600 hover:text-indigo-800"
                title="Nuevo chat"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
            <WhatsAppChatList onSelectChat={setSelectedChat} />
          </div>

          {/* Main Content */}
          <div className="md:col-span-2 lg:col-span-3">
            {showNewChatForm ? (
              <NewChatForm />
            ) : (
              <WhatsAppConversation chat={selectedChat} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default WhatsAppMessagesPage; 