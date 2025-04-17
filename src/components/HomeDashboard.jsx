import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { AreaChart, Area, XAxis, LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts';
import { getActiveCampaigns } from '../campaignStore';
import { getCampaignTypeName } from '../campaignIntegration';
import { generateChartData, calculateCampaignProgress } from '../campaignSimulator';
import { FaPlus } from 'react-icons/fa';

const HomeDashboard = ({ user, onCreateCampaign }) => {
  const [activeCampaign, setActiveCampaign] = useState(null);
  const [loading, setLoading] = useState(false);
  const [chartData, setChartData] = useState(null);
  const [chartLoading, setChartLoading] = useState(false);
  const [chartError, setChartError] = useState(null);

  // Efecto unificado para cargar datos de campaña y gráfico
  useEffect(() => {
    let intervalId = null;
    
    const fetchCampaignData = async () => {
      if (!user?.uid) return;
      
      try {
        setLoading(true);
        const campaigns = await getActiveCampaigns(user.uid);
        
        if (campaigns.length > 0) {
          // Ordenar por fecha de creación
          const sorted = campaigns.sort((a, b) => {
            const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
            const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
            return dateB - dateA;
          });
          
          const campaign = sorted[0];
          
          // Calcular progreso inicial
          const progress = calculateCampaignProgress(campaign);
          
          // Establecer campaña activa con datos de progreso
          setActiveCampaign({
            ...campaign,
            action: getCampaignTypeName(campaign.campaignType),
            status: "Activa",
            progress: progress.percentage,
            targetCount: progress.total_users
          });
          
          // Generar datos del gráfico iniciales
          const chartData = generateChartData(campaign);
          setChartData(chartData);
          
          // Configurar actualización periódica (cada 10 segundos)
          intervalId = setInterval(() => {
            // Actualizar progreso de campaña
            const updatedProgress = calculateCampaignProgress(campaign);
            
            setActiveCampaign(prev => ({
              ...prev,
              progress: updatedProgress.percentage
            }));
            
            // Actualizar datos del gráfico
            setChartData(generateChartData(campaign));
          }, 10000);
        }
      } catch (error) {
        console.error("Error al cargar campañas activas:", error);
        setChartError("Error al cargar datos de la campaña");
      } finally {
        setLoading(false);
      }
    };
    
    fetchCampaignData();
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [user]);

  const totalInteractions = 35765;
  
  const barChartData = [
    { label: "Bienvenida", response: 25, conversion: 5 },
    { label: "CTA", response: 19, conversion: 10 },
    { label: "Videollamada", response: 19, conversion: 10 },
    { label: "Nota de voz", response: 25, conversion: 13 }
  ];

  const interactionData = [
    { month: 'Ene', clickBio: 15, comments: 25, likes: 10 },
    { month: '', clickBio: 20, comments: 22, likes: 15 },
    { month: 'Feb', clickBio: 25, comments: 18, likes: 20 },
    { month: '', clickBio: 30, comments: 15, likes: 25 },
    { month: 'Mar', clickBio: 35, comments: 12, likes: 30 },
    { month: '', clickBio: 25, comments: 18, likes: 20 },
    { month: 'Abr', clickBio: 15, comments: 25, likes: 10 },
    { month: '', clickBio: 25, comments: 20, likes: 20 },
    { month: 'May', clickBio: 35, comments: 15, likes: 30 },
    { month: '', clickBio: 40, comments: 20, likes: 25 },
    { month: 'Jun', clickBio: 45, comments: 25, likes: 20 }
  ];

  const renderLineChart = () => {
    if (chartLoading) {
      return (
        <div className="relative w-full h-64 mt-4 mb-2 bg-[#F8F7FF] rounded-lg flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
          <span className="ml-2 text-gray-600">Cargando datos...</span>
        </div>
      );
    }

    if (chartError) {
      return (
        <div className="relative w-full h-64 mt-4 mb-2 bg-[#F8F7FF] rounded-lg flex items-center justify-center">
          <div className="text-red-500">{chartError}</div>
        </div>
      );
    }

    if (!chartData || !chartData.points || chartData.points.length === 0) {
      return (
        <div className="relative w-full h-64 mt-4 mb-2 bg-[#F8F7FF] rounded-lg flex items-center justify-center">
          <div className="text-gray-500">No hay datos disponibles</div>
        </div>
      );
    }
  
    // Convertir puntos del API a formato para el gráfico
    const data = chartData.points.map(point => ({
      name: point.hour === 0 ? 'Inicio' : `${point.hour}h`,
      value: point.messages,
      display: true
    }));
  
    // Encontrar el punto actual para destacarlo
    const currentHourIndex = chartData.points.findIndex(p => p.is_current);
  
    // Componente para punto destacado en la hora actual
    const CustomDot = (props) => {
      const { cx, cy, index } = props;
    
      if (index === currentHourIndex) {
        return (
          <circle cx={cx} cy={cy} r={5} fill="white" stroke="#4338CA" strokeWidth={2} />
        );
      }
      return null;
    };
  
    return (
      <div className="relative w-full h-64 mt-4 mb-2 bg-[#F8F7FF] rounded-lg overflow-hidden">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 10, left: 10, bottom: 30 }}
          >
            <defs>
              <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366F1" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#6366F1" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="name" 
              axisLine={false}
              tickLine={false}
              height={50}
            />
            <Tooltip />
            <Area
              type="stepAfter"
              dataKey="value"
              stroke="#4338CA"
              strokeWidth={4}
              fill="url(#colorGradient)"
              dot={true}
              activeDot={{ r: 6, fill: "white", stroke: "#4338CA", strokeWidth: 2 }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="none"
              fill="none"
              dot={CustomDot}
            />
          </AreaChart>
        </ResponsiveContainer>
        
        <div className="absolute bottom-0 left-0 right-0 flex justify-center mb-1">
          <div className="bg-white rounded-md px-2 py-1 shadow-sm flex items-center gap-2">
            <div className="w-5 h-1 bg-[#4338CA]"></div>
            <span className="text-xs text-gray-600">Mensajes Enviados</span>
          </div>
        </div>
      </div>
    );
  };

  const renderBarChart = () => {
    const maxHeight = 180;
    
    return (
      <div className="mt-6 space-y-2 px-4">
        <div className="flex justify-between">
          {barChartData.map((item, index) => (
            <div key={`column-${index}`} className="flex flex-col items-center w-1/4 px-2">
              <div className="flex items-end h-48 gap-2">
                <div className="flex flex-col items-center">
                  <div 
                    className="w-10 bg-[#4A1D96] rounded-t-sm" 
                    style={{ height: `${(item.response / 25) * maxHeight}px` }}
                  ></div>
                  <span className="text-gray-500 text-sm mt-1">{item.response}%</span>
                </div>
                
                <div className="flex flex-col items-center">
                  <div 
                    className="w-10 bg-[#8B5CF6] rounded-t-sm" 
                    style={{ height: `${(item.conversion / 25) * maxHeight}px` }}
                  ></div>
                  <span className="text-gray-500 text-sm mt-1">{item.conversion}%</span>
                </div>
              </div>
              
              <div className="text-center text-gray-500 text-sm mt-4">
                {item.label}
              </div>
            </div>
          ))}
        </div>
        
        <div className="flex justify-center mt-8 gap-8">
          <div className="flex items-center">
            <div className="h-3 w-3 mr-2 bg-[#4A1D96]"></div>
            <span className="text-sm text-gray-600">% Respuestas</span>
          </div>
          <div className="flex items-center">
            <div className="h-3 w-3 mr-2 bg-[#8B5CF6]"></div>
            <span className="text-sm text-gray-600">% Conversión</span>
          </div>
        </div>
      </div>
    );
  };

  const renderConversionRate = () => {
    return (
      <div className="flex justify-center">
        <div className="relative w-36 h-36">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="#7C3AED"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray="183 251.2"
              strokeDashoffset="0"
              transform="rotate(-270.7 50 50)"
            />
            
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="#39147e"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray="15 251.2"
              strokeDashoffset="-210"
              transform="rotate(-245.5 50 50)"
            />
            
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="#0F172A" 
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray="27.2 251.2"
              strokeDashoffset="0"
              transform="rotate(-356 50 50)"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-3xl font-medium text-black">10%</span>
          </div>
        </div>
      </div>
    );
  };
  
  const renderMessageRate = () => {
    return (
      <div className="relative w-full h-32 flex items-center justify-center">
        <svg className="w-36 h-36" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="#b393ef"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray="230 251.2"
            strokeDashoffset="0"
            transform="rotate(124 50 50)"
          />
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="#7C3AED"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray="230 283"
            strokeDashoffset="60"
            transform="rotate(124 50 50)"
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center">
          <div className="text-3xl font-medium text-black">42</div>
          <div className="text-xs text-gray-500">Mensajes x hora</div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 md:p-6 bg-[#F3F2FC] min-h-screen font-['Poppins']">
      <div className="mb-6">
        <h2 className="text-lg text-gray-600 font-normal">Hola {user?.displayName || user?.email || "Usuario"},</h2>
        <h1 className="text-2xl font-medium text-black">Bienvenido a Tribe IA</h1>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm mb-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-medium text-black">Campañas activas</h2>
          <button className="bg-white text-gray-500 px-3 py-1 rounded-lg border border-gray-200 text-sm">
            Ver todo
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
            <span className="ml-2 text-gray-600">Cargando campañas...</span>
          </div>
        ) : activeCampaign ? (
          <div className="bg-white border border-gray-100 rounded-xl p-4 mt-4 shadow-sm">
            <div className="flex justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 relative flex items-center justify-center">
                  <img src="/assets/rectangleDark.png" alt="Background" className="w-full h-full absolute top-0 left-0"/>
                  <img 
                    src={
                      activeCampaign.campaignType === "send_messages" ? "/assets/messages-2.png" :
                      activeCampaign.campaignType === "send_media" ? "/assets/gallery.png" :
                      activeCampaign.campaignType === "follow_users" ? "/assets/user-plus.png" :
                      "/assets/messages-2.png"
                    } 
                    alt="Campaign Icon" 
                    className="w-8 h-8 relative z-10 brightness-0 invert"
                  />
                </div>
                <div>
                  <div className="font-semibold text-black">{activeCampaign.name}</div>
                  <div className="text-sm text-gray-400">{activeCampaign.action}</div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="bg-green-100 text-black px-3 py-1 rounded-full text-sm">
                  {activeCampaign.status}
                </span>
                <span className="text-xs text-gray-500">
                  {activeCampaign.progress}% completado
                </span>
              </div>
            </div>

            {renderLineChart()}
          </div>
        ) : (
          <div className="p-8 text-center bg-gray-50 rounded-xl mt-4">
            <p className="text-gray-500 mb-4">No hay campañas activas en este momento.</p>
            <button 
              className="mt-3 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 inline-flex items-center justify-center"
              onClick={onCreateCampaign}
            >
              <FaPlus className="mr-2" />
              Crear Campaña
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <div className="bg-white p-4 rounded-xl shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <div>
              <h2 className="text-3xl font-medium text-black">{totalInteractions.toLocaleString()}</h2>
              <p className="text-sm text-gray-500">Total de interacciones</p>
            </div>
            
            <div className="flex items-center">
              <img 
                src="/assets/setting-4.svg" 
                alt="Configuración" 
                className="w-12 h-12 cursor-pointer"
              />
            </div>
          </div>

          <div className="flex gap-4 text-sm mb-4">
            <button className="bg-white text-black border-b-2 border-black px-3 py-1 font-medium">Día</button>
            <button className="bg-white text-gray-400 px-3 py-1">Semana</button>
            <button className="bg-white text-gray-400 px-3 py-1">Mes</button>
            <button className="bg-white text-gray-400 px-3 py-1">Año</button>
          </div>

          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={interactionData}
                margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
              >
                <XAxis 
                  dataKey="month" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9CA3AF', fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: 'none', 
                    borderRadius: '4px', 
                    boxShadow: '0 2px 5px rgba(0,0,0,0.1)' 
                  }}
                  itemStyle={{ color: '#4B5563', fontSize: 12 }}
                  formatter={(value) => [`${value}`, '']}
                  labelFormatter={() => ''}
                />
                <Line 
                  type="monotone" 
                  dataKey="clickBio" 
                  stroke="#4338CA" 
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="comments" 
                  stroke="#8B5CF6" 
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="likes" 
                  stroke="#1F2937" 
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="flex gap-6 text-xs text-gray-500 mt-2 justify-center">
            <div className="flex items-center gap-2">
              <div className="h-1 w-4 bg-[#4338CA]"></div>
              <span>Click en Bio</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-1 w-4 bg-[#8B5CF6]"></div>
              <span>Comentarios</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-1 w-4 bg-[#1F2937]"></div>
              <span>Likes</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-medium text-black">Grafico A/B de mensajes</h2>
            
            <div className="flex items-center">
              <img 
                src="/assets/setting-4.svg" 
                alt="Configuración" 
                className="w-12 h-12 cursor-pointer"
              />
            </div>
          </div>
          {renderBarChart()}
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h2 className="text-2xl font-medium mb-6 text-black">Tasa de conversión</h2>
          
          <div className="flex items-start">
            <div className="flex flex-col gap-3 pr-6">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-[#7C3AED]"></div>
                <span className="text-sm text-gray-600">Leads Totales</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-[#0F172A]"></div>
                <span className="text-sm text-gray-600">Convertidos</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-[#4F46E5]"></div>
                <span className="text-sm text-gray-600">Calificados</span>
              </div>
            </div>

            <div className="flex-grow flex justify-end">
              {renderConversionRate()}
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center mb-4">
            <h2 className="text-2xl font-medium text-black">Promedio de mensajes</h2>
            <div className="ml-2 h-5 w-5 rounded-full bg-gray-100 flex items-center justify-center">
              <span className="text-xs text-gray-400">i</span>
            </div>
          </div>
          
          <div className="flex items-start">
            <div className="flex-grow">
            </div>
            
            <div className="flex justify-end">
              {renderMessageRate()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

HomeDashboard.propTypes = {
  user: PropTypes.object,
  onCreateCampaign: PropTypes.func.isRequired
};

export default HomeDashboard;