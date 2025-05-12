import React, { useState, useEffect, useCallback } from 'react';
import { FaChartBar, FaFilter, FaSpinner, FaExclamationTriangle, FaProjectDiagram, FaClipboardList, FaUsers } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { getUserKanbanBoards, getKanbanBoardDetails } from '../../api'; // Assuming these API functions exist
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'; // Import Recharts components

const KanbanStatsView = ({ user }) => {
  const { authToken } = useAuth();
  const userId = user?.uid;

  const [boards, setBoards] = useState([]);
  const [selectedBoardId, setSelectedBoardId] = useState('');
  const [statsData, setStatsData] = useState(null);
  const [isLoadingBoards, setIsLoadingBoards] = useState(false);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [error, setError] = useState(null);

  // Fetch available Kanban boards for the selector
  useEffect(() => {
    if (userId && authToken) {
      const fetchBoards = async () => {
        setIsLoadingBoards(true);
        try {
          const response = await getUserKanbanBoards(userId, authToken);
          if (response.success && response.data) {
            setBoards(response.data);
            if (response.data.length > 0) {
              // setSelectedBoardId(response.data[0].id); // Optionally auto-select the first board
            }
          } else {
            setError('Could not load Kanban boards: ' + (response.message || 'Unknown error'));
          }
        } catch (err) {
          setError('Error fetching boards: ' + err.message);
        }
        setIsLoadingBoards(false);
      };
      fetchBoards();
    }
  }, [userId, authToken]);

  // Fetch and process stats when a board is selected
  useEffect(() => {
    if (selectedBoardId && userId && authToken) {
      const fetchStats = async () => {
        setIsLoadingStats(true);
        setError(null);
        try {
          const response = await getKanbanBoardDetails(userId, selectedBoardId, authToken);
          if (response.success) {
            const processedStats = {
              leadFunnelData: [], 
              kpiData: {
                totalLeads: 0,
                activeLeads: 0, // Leads not in 'won' or 'lost' stages
                wonLeads: 0,
                lostLeads: 0,
                conversionRate: 0, 
                avgLeadsPerActiveColumn: 0, // New KPI
              },
              columnAnalysisData: [],
            };

            if (response.board && response.columns) {
              const allChatsInBoard = [];
              let wonLeadsCount = 0;
              let lostLeadsCount = 0;
              let activeColumnsCount = 0; // Columns that are not 'won' or 'lost'
              let leadsInActiveColumns = 0;

              response.columns.forEach(col => {
                const leadCount = col.chats?.length || 0;
                processedStats.leadFunnelData.push({ columnName: col.name, count: leadCount });
                if (col.chats) {
                    allChatsInBoard.push(...col.chats);
                }
                processedStats.columnAnalysisData.push({
                  columnName: col.name,
                  columnId: col.id,
                  leadCount: leadCount,
                  stageType: col.stageType || 'N/D', // Access and store stageType
                });

                // KPI Calculations based on stageType
                if (col.stageType === 'won') {
                  wonLeadsCount += leadCount;
                } else if (col.stageType === 'lost') {
                  lostLeadsCount += leadCount;
                } else {
                  // Consider any other stage as active for these KPIs
                  activeColumnsCount++;
                  leadsInActiveColumns += leadCount;
                }
              });

              if(response.unassignedInBoardChats && response.unassignedInBoardChats.length > 0) {
                allChatsInBoard.push(...response.unassignedInBoardChats);
                // Optionally add to funnel/column analysis if it makes sense for your view
                // For now, unassigned are just part of total leads
              }
              
              processedStats.kpiData.totalLeads = allChatsInBoard.length;
              processedStats.kpiData.wonLeads = wonLeadsCount;
              processedStats.kpiData.lostLeads = lostLeadsCount;
              processedStats.kpiData.activeLeads = processedStats.kpiData.totalLeads - wonLeadsCount - lostLeadsCount;
              
              // Conversion Rate: Won / (Won + Lost) - avoiding division by zero
              const totalClosedLeads = wonLeadsCount + lostLeadsCount;
              if (totalClosedLeads > 0) {
                processedStats.kpiData.conversionRate = parseFloat(((wonLeadsCount / totalClosedLeads) * 100).toFixed(1));
              } else if (wonLeadsCount > 0) {
                processedStats.kpiData.conversionRate = 100; // If only won leads, 100% CR
              } else {
                processedStats.kpiData.conversionRate = 0;
              }

              // Avg Leads Per Active Column
              if (activeColumnsCount > 0) {
                processedStats.kpiData.avgLeadsPerActiveColumn = parseFloat((leadsInActiveColumns / activeColumnsCount).toFixed(1));
              }

            }
            setStatsData(processedStats);
          } else {
            setError('Could not load statistics for the board: ' + (response.message || 'Unknown error'));
            setStatsData(null);
          }
        } catch (err) {
          setError('Error fetching statistics: ' + err.message);
          setStatsData(null);
        }
        setIsLoadingStats(false);
      };
      fetchStats();
    } else {
      setStatsData(null); // Clear stats if no board is selected
    }
  }, [selectedBoardId, userId, authToken]);

  const Card = ({ title, icon, children, className = '' }) => (
    <div className={`bg-white dark:bg-slate-800 p-5 md:p-6 rounded-xl shadow-lg transition-all hover:shadow-2xl ${className}`}>
      <div className="flex items-center text-slate-700 dark:text-slate-200 mb-4">
        {icon && React.cloneElement(icon, { className: 'mr-3 text-xl text-purple-600 dark:text-purple-400' })}
        <h2 className="text-xl font-semibold">{title}</h2>
      </div>
      <div>{children}</div>
    </div>
  );

  const KPI = ({ title, value, icon, unit = '' }) => (
    <div className="bg-slate-50 dark:bg-slate-700 p-4 rounded-lg shadow flex items-start">
        {icon && React.cloneElement(icon, { className: 'mr-4 text-2xl text-blue-500 dark:text-blue-400 flex-shrink-0 mt-1' })}
        <div>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{title}</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                {value}{unit && <span className="text-lg ml-1">{unit}</span>}
            </p>
        </div>
    </div>
  );

  if (isLoadingBoards) {
    return <div className="p-10 text-center"><FaSpinner className="animate-spin text-4xl text-purple-600 mx-auto" /><p className="mt-3 text-slate-600">Cargando tableros...</p></div>;
  }

  if (error && !isLoadingBoards && !boards.length) { // Show general error if boards didn't load
    return (
        <div className="p-10 text-center bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg">
            <FaExclamationTriangle className="text-4xl mx-auto mb-3" />
            <p className="font-semibold">Error al cargar la página de estadísticas.</p>
            <p>{error}</p>
        </div>
    );
  }


  return (
    <div className="min-h-screen rounded-3xl bg-slate-100 dark:bg-slate-900 p-4 md:p-8 font-['Poppins'] text-slate-800 dark:text-slate-200">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white flex items-center">
          <FaChartBar className="mr-3 text-purple-600 dark:text-purple-400" />
          Estadísticas del CRM
        </h1>
      </div>

      {/* Board Selector */}
      <div className="mb-8 max-w-md">
        <label htmlFor="boardSelector" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          Seleccionar Tablero Kanban
        </label>
        <select
          id="boardSelector"
          value={selectedBoardId}
          onChange={(e) => setSelectedBoardId(e.target.value)}
          disabled={isLoadingBoards || boards.length === 0}
          className="w-full p-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
        >
          <option value="">-- Elige un tablero --</option>
          {boards.map(board => (
            <option key={board.id} value={board.id}>{board.name}</option>
          ))}
        </select>
        {!isLoadingBoards && boards.length === 0 && (
            <p className="text-sm text-amber-600 dark:text-amber-400 mt-2">No se encontraron tableros Kanban. Por favor, cree uno primero.</p>
        )}
      </div>

      {selectedBoardId && isLoadingStats && (
        <div className="p-10 text-center"><FaSpinner className="animate-spin text-4xl text-purple-600 mx-auto" /><p className="mt-3 text-slate-600">Cargando estadísticas del tablero...</p></div>
      )}
      
      {error && selectedBoardId && !isLoadingStats && (
         <div className="p-6 text-center bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg shadow-md">
            <FaExclamationTriangle className="text-3xl mx-auto mb-2" />
            <p className="font-medium">No se pudieron cargar las estadísticas para este tablero.</p>
            <p className="text-sm">{error}</p>
        </div>
      )}

      {selectedBoardId && !isLoadingStats && statsData && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Card 1: Lead Funnel / Flow (Bar Chart) */}
          <Card title="Flujo de Leads por Columna" icon={<FaProjectDiagram />} className="lg:col-span-2">
            <div className="h-80 bg-slate-100 dark:bg-slate-700/50 rounded-lg flex items-center justify-center text-slate-500 dark:text-slate-400 p-4">
              {statsData.leadFunnelData && statsData.leadFunnelData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={statsData.leadFunnelData}
                    margin={{
                      top: 5,
                      right: 20,
                      left: -20, // Adjust if YAxis labels are cut off
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" /> {/* Darker grid for better visibility on light/dark themes */}
                    <XAxis 
                        dataKey="columnName" 
                        angle={-30} // Angle labels if they overlap
                        textAnchor="end"
                        height={70} // Increase height to accommodate angled labels
                        interval={0} // Show all labels
                        tick={{ fontSize: 10, fill: '#A0AEC0' }} // Tailwind gray-500 for ticks
                    />
                    <YAxis tick={{ fontSize: 12, fill: '#A0AEC0' }} />
                    <Tooltip 
                        contentStyle={{ backgroundColor: '#2D3748', borderRadius: '0.5rem', borderColor: '#4A5568' }} // Tailwind gray-800 bg, gray-600 border
                        labelStyle={{ color: '#E2E8F0' }} // Tailwind gray-300 label
                        itemStyle={{ color: '#E2E8F0' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                    <Bar dataKey="count" name="Leads" fill="#8B5CF6" radius={[4, 4, 0, 0]} /> {/* Tailwind purple-500 */}                  
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center">
                  No hay datos suficientes para mostrar el gráfico de flujo de leads.
                  <br />
                  Asegúrate de que el tablero tenga columnas con chats asignados.
                </p>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">
                Este gráfico muestra la cantidad de leads actuales en cada columna del tablero.
            </p>
          </Card>

          {/* Card 2: Stage Performance KPIs */}
          <Card title="KPIs de Rendimiento" icon={<FaUsers />}>
            <div className="space-y-4">
                <KPI title="Total de Leads en Tablero" value={statsData.kpiData?.totalLeads || 0} />
                <KPI title="Leads Activos" value={statsData.kpiData?.activeLeads || 0} />
                <KPI title="Leads Ganados" value={statsData.kpiData?.wonLeads || 0} />
                <KPI title="Leads Perdidos" value={statsData.kpiData?.lostLeads || 0} />
                <KPI title="Tasa de Conversión (Ganados / Cerrados)" value={statsData.kpiData?.conversionRate || 0} unit="%" />
                <KPI title="Prom. Leads por Columna Activa" value={statsData.kpiData?.avgLeadsPerActiveColumn || 0} />
                 <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Los KPIs se calculan basados en el "Tipo de Etapa" configurado para cada columna.
                </p>
            </div>
          </Card>

          {/* Card 3: Column Analysis (Table Placeholder) */}
          <Card title="Análisis por Columna" icon={<FaClipboardList />} className="lg:col-span-3">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] text-sm text-left text-slate-500 dark:text-slate-400">
                <thead className="text-xs text-slate-700 dark:text-slate-300 uppercase bg-slate-100 dark:bg-slate-700">
                  <tr>
                    <th scope="col" className="px-6 py-3">Nombre de Columna</th>
                    <th scope="col" className="px-6 py-3 text-center">Cantidad de Leads</th>
                    <th scope="col" className="px-6 py-3">Tipo de Etapa (Configurable)</th>
                    {/* <th scope="col" className="px-6 py-3">Tiempo Prom. en Etapa</th> */}
                  </tr>
                </thead>
                <tbody>
                  {statsData.columnAnalysisData && statsData.columnAnalysisData.length > 0 ? (
                    statsData.columnAnalysisData.map((col, index) => (
                      <tr key={col.columnId || index} className="bg-white dark:bg-slate-800 border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                        <th scope="row" className="px-6 py-4 font-medium text-slate-900 dark:text-white whitespace-nowrap">
                          {col.columnName}
                        </th>
                        <td className="px-6 py-4 text-center">{col.leadCount}</td>
                        <td className="px-6 py-4 italic text-slate-400 dark:text-slate-500">
                          {col.stageType || 'No definido'}
                           {/* This will be populated once stageType is implemented for columns */}
                        </td>
                        {/* <td className="px-6 py-4">{col.avgTimeInStage || 'N/A'}</td> */}
                      </tr>
                    ))
                  ) : (
                    <tr>
                        <td colSpan="3" className="px-6 py-10 text-center text-slate-500 dark:text-slate-400">
                            No hay columnas o datos de columnas para mostrar.
                        </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
             <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">
                Para un análisis más detallado, puede configurar un "Tipo de Etapa" para cada columna (ej: Prospección, Calificación, Negociación, Cierre Ganado, Cierre Perdido).
                Esto permitirá calcular métricas como tasas de conversión entre etapas y tiempo promedio en cada etapa (funcionalidades futuras).
            </p>
          </Card>
        </div>
      )}
      
      {!selectedBoardId && boards.length > 0 && !isLoadingStats && (
        <div className="p-10 text-center bg-white dark:bg-slate-800 rounded-lg shadow-md">
            <FaFilter className="text-5xl text-purple-500 dark:text-purple-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold">Selecciona un Tablero</h3>
            <p className="mt-1 text-slate-600 dark:text-slate-300">Elige un tablero Kanban del menú de arriba para ver sus estadísticas.</p>
        </div>
      )}

    </div>
  );
};

export default KanbanStatsView; 