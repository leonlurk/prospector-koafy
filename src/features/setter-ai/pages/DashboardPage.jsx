import React, { useState } from 'react';
import { useWhatsApp } from '../context/WhatsAppContext';
import WhatsAppStats from '../components/WhatsAppStats';

// --- Placeholder Icons ---
const UserCircleIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const ChatBubbleLeftRightIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3.1-3.102a11.25 11.25 0 01-5.176 0l-3.1 3.102v-3.091c-.34-.02-.68-.045-1.02-.072-1.133-.093-1.98-1.057-1.98-2.193V10.608c0-.97.616-1.813 1.5-2.097M15.75 6.75v-1.5c0-1.5-1.5-2.25-3.75-2.25S8.25 3.75 8.25 5.25v1.5m7.5 0v4.5m-7.5-4.5v4.5m7.5 0H8.25m7.5 0h1.125c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125h-9.75c-.621 0-1.125-.504-1.125-1.125v-1.5c0-.621.504-1.125 1.125-1.125H8.25" />
  </svg>
);

const ServerStackIcon = (props) => (
 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12h10.5M6 12C6 5.608 6.158 4.5 7.021 3.751 7.845 3 9.162 3 11.397 3h1.206c2.235 0 3.553 0 4.377.751C17.842 4.5 18 5.608 18 12M6 12v3c0 6.392-.158 7.5-1.021 8.249C4.117 24 2.799 24 5.034 24h9.932c2.235 0 3.553 0 4.377-.751C20.205 22.5 20.047 21.392 20.047 15v-3" />
</svg>
);

const ArrowTrendingUpIcon = (props) => (
 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
</svg>
);

// --- Dashboard Stat Card Component ---
const StatCard = ({ title, value, icon: Icon, change, changeType }) => (
  <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
    <div className="flex justify-between items-start mb-3">
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <div className="p-2 bg-indigo-100 rounded-lg">
        <Icon className="w-5 h-5 text-indigo-600" />
      </div>
    </div>
    <p className="text-3xl font-semibold text-gray-800 mb-1">{value}</p>
    {change && (
      <p className={`text-xs ${changeType === 'positive' ? 'text-green-600' : 'text-red-600'}`}>
        {changeType === 'positive' ? '+' : '-'}{change} vs mes anterior
      </p>
    )}
  </div>
);

// --- Main Dashboard Component ---
function DashboardPage({ user, setSelectedOption }) {
  const { currentUser, whatsappStatus, activeAgentId } = useWhatsApp();
  const [period, setPeriod] = useState('week');

  // Check if the user prop matches context user (for debugging/consistency)
  // Optional: console.log("DashboardPage User Prop:", user?.uid, "Context User:", currentUser?.uid);

  // Función para mostrar mensaje de conexión
  const ConnectionAlert = () => {
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
                <button 
                  onClick={() => setSelectedOption('SetterConnections')}
                  className="font-medium underline text-yellow-700 hover:text-yellow-600 ml-1"
                >
                  Configura uno ahora
                </button>
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
                WhatsApp no está conectado. 
                <button 
                  onClick={() => setSelectedOption('SetterConnections')}
                  className="font-medium underline text-yellow-700 hover:text-yellow-600 ml-1"
                >
                  Conectar ahora
                </button>
              </p>
            </div>
          </div>
        </div>
      );
    }

    if (!activeAgentId) {
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
                No hay ningún agente activo configurado. 
                <button 
                  onClick={() => setSelectedOption('SetterAgents')} 
                  className="font-medium underline text-yellow-700 hover:text-yellow-600 ml-1"
                >
                  Configurar uno ahora
                </button>
              </p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-green-700">
              WhatsApp está conectado y listo para usar.
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 md:p-8 lg:p-10 max-w-full mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-800">
          Bienvenido de vuelta{currentUser?.name ? `, ${currentUser.name}` : '!'} 
        </h1>
        <p className="mt-1 text-sm text-gray-500">Aquí tienes un resumen de la actividad de tus agentes.</p>
      </div>
      
      <ConnectionAlert />

      {/* Filter by time period */}
      <div className="mb-6 flex justify-end">
        <div className="inline-flex rounded-md shadow-sm">
          <button
            type="button"
            onClick={() => setPeriod('day')}
            className={`relative inline-flex items-center px-4 py-2 rounded-l-md border border-gray-300 text-sm font-medium ${
              period === 'day' ? 'bg-indigo-50 text-indigo-700 z-10' : 'bg-white text-gray-700'
            }`}
          >
            Hoy
          </button>
          <button
            type="button"
            onClick={() => setPeriod('week')}
            className={`relative inline-flex items-center px-4 py-2 border-t border-b border-gray-300 text-sm font-medium ${
              period === 'week' ? 'bg-indigo-50 text-indigo-700 z-10' : 'bg-white text-gray-700'
            }`}
          >
            Esta semana
          </button>
          <button
            type="button"
            onClick={() => setPeriod('month')}
            className={`relative inline-flex items-center px-4 py-2 rounded-r-md border border-gray-300 text-sm font-medium ${
              period === 'month' ? 'bg-indigo-50 text-indigo-700 z-10' : 'bg-white text-gray-700'
            }`}
          >
            Este mes
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <WhatsAppStats />
        
        {/* Second Card for Recent Activity */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-6">Actividad Reciente</h2>
          
          {!currentUser || whatsappStatus.status !== 'connected' ? (
            <div className="text-center py-8 text-gray-500">
              <p>Conecta WhatsApp para ver actividad reciente</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="border-l-4 border-green-500 pl-4 py-2">
                <p className="text-sm text-gray-600">Hace 5 minutos</p>
                <p className="font-medium">Mensaje recibido de +5491141234567</p>
              </div>
              <div className="border-l-4 border-blue-500 pl-4 py-2">
                <p className="text-sm text-gray-600">Hace 12 minutos</p>
                <p className="font-medium">Mensaje enviado a +5491155667788</p>
              </div>
              <div className="border-l-4 border-purple-500 pl-4 py-2">
                <p className="text-sm text-gray-600">Hace 25 minutos</p>
                <p className="font-medium">Nueva conversación con +5491177889900</p>
              </div>
              <div className="border-l-4 border-indigo-500 pl-4 py-2">
                <p className="text-sm text-gray-600">Hace 45 minutos</p>
                <p className="font-medium">Automatización activada para +5491166778899</p>
              </div>
            </div>
          )}
        </div>
      </div>
      
    </div>
  );
}

export default DashboardPage; 