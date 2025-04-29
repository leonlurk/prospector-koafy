import React, { useState, useEffect } from 'react';
import { useWhatsApp } from '../context/WhatsAppContext';
import { Link } from 'react-router-dom';

// --- Placeholder Icons ---
const CalendarDaysIcon = (props) => (
 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z" />
</svg>
);
const ChevronDownIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
  </svg>
);

// --- Placeholder Bar Chart Component ---
const BarChartPlaceholder = () => (
  <div className="w-full h-48 bg-gray-50 rounded-lg p-4 flex items-end space-x-2 overflow-hidden">
    {[40, 60, 80, 50, 70, 90, 30, 65].map((height, index) => (
      <div 
        key={index} 
        className="flex-1 bg-indigo-300 rounded-t-md animate-pulse"
        style={{ height: `${height}%` }}
      ></div>
    ))}
  </div>
);

// --- Placeholder Line Chart Component ---
const LineChartPlaceholder = () => (
   <div className="w-full h-48 bg-gray-50 rounded-lg p-4 flex items-center justify-center">
      <svg className="w-full h-full text-indigo-300 opacity-50" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 100 50">
         <path d="M 0 40 C 10 10, 20 10, 30 25 S 50 50, 60 40 S 80 10, 90 20 S 100 30, 100 30"/>
      </svg>
   </div>
);

// --- Main Statistics Page Component ---
function StatisticsPage() {
  const { currentUser, whatsappStatus } = useWhatsApp();
  const [period, setPeriod] = useState('week');
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    messages: {
      total: 0,
      sent: 0,
      received: 0,
      readRate: 0
    },
    users: {
      total: 0,
      active: 0,
      new: 0
    },
    interactions: {
      average: 0,
      longest: 0,
      responseTime: 0
    },
    popular: []
  });

  useEffect(() => {
    if (currentUser && whatsappStatus.status === 'connected') {
      setIsLoading(true);
      // Simulación de carga de datos
      setTimeout(() => {
        const mockStats = {
          messages: {
            total: 1256,
            sent: 735,
            received: 521,
            readRate: 87
          },
          users: {
            total: 156,
            active: 42,
            new: 18
          },
          interactions: {
            average: 8,
            longest: 24,
            responseTime: 12
          },
          popular: [
            { word: "precio", count: 127 },
            { word: "horario", count: 92 },
            { word: "disponible", count: 78 },
            { word: "gracias", count: 65 },
            { word: "entrega", count: 51 }
          ]
        };
        setStats(mockStats);
        setIsLoading(false);
      }, 1000);
    } else {
      setIsLoading(false);
    }
  }, [currentUser, whatsappStatus.status, period]);

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
                <Link to="/connections" className="font-medium underline text-yellow-700 hover:text-yellow-600 ml-1">
                  Configura uno ahora
                </Link>
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
                WhatsApp no está conectado. Las estadísticas no estarán disponibles hasta que conectes WhatsApp.
                <Link to="/connections" className="font-medium underline text-yellow-700 hover:text-yellow-600 ml-1">
                  Conectar ahora
                </Link>
              </p>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  const StatCard = ({ title, value, description, icon: Icon, color }) => (
    <div className="bg-white shadow-md rounded-lg p-6">
      <div className="flex items-center">
        <div className={`flex items-center justify-center w-12 h-12 rounded-lg ${color} shrink-0`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div className="ml-4">
          <h3 className="text-sm font-medium text-gray-500">{title}</h3>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {description && <p className="text-sm text-gray-500">{description}</p>}
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6 md:p-8 lg:p-10 max-w-full mx-auto">
       {/* Header and Date Range */}
       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
         <div>
           <h1 className="text-2xl font-semibold text-gray-800">Estadísticas</h1>
           <p className="mt-1 text-sm text-gray-500">Visualiza el rendimiento y la actividad de tus agentes.</p>
         </div>
         {/* Date Range Picker Placeholder */}
         <div className="relative">
           <button className="flex items-center h-10 px-4 border border-gray-300 bg-white rounded-lg shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-400">
             <CalendarDaysIcon className="w-5 h-5 mr-2 text-gray-400" />
             <span>Últimos 30 días</span>
             <ChevronDownIcon className="w-4 h-4 ml-2 text-gray-400" />
           </button>
           {/* Dropdown menu would go here */}
         </div>
       </div>
       
       {/* Chart Grid */}
       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         {/* Chart Card 1 */}
         <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
            <h3 className="text-lg font-medium text-gray-700 mb-4">Mensajes Procesados</h3>
            <BarChartPlaceholder />
         </div>

         {/* Chart Card 2 */}
         <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
            <h3 className="text-lg font-medium text-gray-700 mb-4">Tasa de Resolución</h3>
             <LineChartPlaceholder />
         </div>

          {/* Add more chart cards as needed */}

       </div>

       <ConnectionWarning />

       {/* Period Selector */}
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

       {isLoading ? (
         <div className="flex justify-center items-center h-64">
           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
         </div>
       ) : !currentUser || whatsappStatus.status !== 'connected' ? (
         <div className="bg-white shadow-md rounded-lg p-12 text-center">
           <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
           </svg>
           <h3 className="text-lg font-medium text-gray-900 mb-2">No hay datos disponibles</h3>
           <p className="text-gray-500 mb-6">
             Conecta WhatsApp para ver estadísticas.
           </p>
         </div>
       ) : (
         <div className="space-y-6">
           {/* Main Stats Grid */}
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
             <StatCard
               title="Mensajes Totales"
               value={stats.messages.total}
               icon={ChatBubbleLeftRightIcon}
               color="bg-indigo-600"
             />
             <StatCard
               title="Mensajes Enviados"
               value={stats.messages.sent}
               icon={ChatBubbleLeftRightIcon}
               color="bg-green-600"
             />
             <StatCard
               title="Mensajes Recibidos"
               value={stats.messages.received}
               icon={ChatBubbleLeftRightIcon}
               color="bg-blue-600"
             />
             <StatCard
               title="Tasa de Lectura"
               value={`${stats.messages.readRate}%`}
               icon={ChartBarIcon}
               color="bg-purple-600"
             />
           </div>

           {/* Secondary Stats Grid */}
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <StatCard
               title="Usuarios Totales"
               value={stats.users.total}
               description={`${stats.users.new} nuevos en este período`}
               icon={UserCircleIcon}
               color="bg-indigo-600"
             />
             <StatCard
               title="Tiempo de Respuesta"
               value={`${stats.interactions.responseTime} min`}
               description="Tiempo promedio de respuesta"
               icon={ArrowTrendingUpIcon}
               color="bg-green-600"
             />
             <StatCard
               title="Mensajes por Conversación"
               value={stats.interactions.average}
               description={`${stats.interactions.longest} en la conversación más larga`}
               icon={ChatBubbleLeftRightIcon}
               color="bg-blue-600"
             />
           </div>

           {/* Popular Words Chart */}
           <div className="bg-white shadow-md rounded-lg p-6">
             <h3 className="text-lg font-medium text-gray-900 mb-4">Palabras Más Populares</h3>
             <div className="grid grid-cols-5 gap-4">
               {stats.popular.map((item, index) => (
                 <div key={index} className="flex flex-col items-center">
                   <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                     <div
                       className="bg-indigo-600 h-2.5 rounded-full"
                       style={{ width: `${(item.count / stats.popular[0].count) * 100}%` }}
                     ></div>
                   </div>
                   <p className="text-sm font-medium text-gray-900">{item.word}</p>
                   <p className="text-xs text-gray-500">{item.count}</p>
                 </div>
               ))}
             </div>
           </div>

           {/* Time Series Graph Placeholder */}
           <div className="bg-white shadow-md rounded-lg p-6">
             <h3 className="text-lg font-medium text-gray-900 mb-4">Actividad por Día</h3>
             <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
               <p className="text-gray-500">Gráfico de actividad aquí</p>
             </div>
           </div>
         </div>
       )}
    </div>
  );
}

export default StatisticsPage; 