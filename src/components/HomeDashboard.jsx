import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
// import { AreaChart, Area, XAxis, LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts'; // Original line before commenting
import { AreaChart, Area, XAxis, /* LineChart, Line, */ ResponsiveContainer, Tooltip } from 'recharts'; // Commented out LineChart, Line
import { getCampaignTypeName } from '../campaignIntegration';
import { generateChartData, calculateCampaignProgress } from '../campaignSimulator';
import { FaPlus, FaArrowRight } from 'react-icons/fa';
import { db } from "../firebaseConfig";
import { collection, query, where, orderBy, limit, onSnapshot } from "firebase/firestore";

const HomeDashboard = ({ user, onCreateCampaign, navigateToCampaigns, isInstagramConnected, showNotification }) => {
  const [activeCampaign, setActiveCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState(null);
  const [chartError, setChartError] = useState(null);

  useEffect(() => {
    if (!user?.uid) {
      setActiveCampaign(null);
      setChartData(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setChartError(null);
    console.log("Setting up LATEST ACTIVE campaign listener for user:", user.uid);

    const campaignsRef = collection(db, "users", user.uid, "campaigns");
    const q = query(
      campaignsRef, 
      where("status", "==", "processing"), 
      orderBy("createdAt", "desc"), 
      limit(1)
    );

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        if (snapshot.empty) {
          console.log("Campaign listener update: No active campaigns found.");
          setActiveCampaign(null);
          setChartData(null);
        } else {
          const campaignDoc = snapshot.docs[0];
          const campaignData = {
            id: campaignDoc.id,
            ...campaignDoc.data(),
            createdAt: campaignDoc.data().createdAt?.toDate ? campaignDoc.data().createdAt.toDate() : null,
            lastUpdated: campaignDoc.data().lastUpdated?.toDate ? campaignDoc.data().lastUpdated.toDate() : null,
          };
          console.log(`Campaign listener update: Active campaign found - ID: ${campaignData.id}`);
          
          setActiveCampaign({
            ...campaignData,
            action: getCampaignTypeName(campaignData.campaignType),
            status: "Activa",
          });

          try {
             const generatedData = generateChartData(campaignData); 
             setChartData(generatedData);
             setChartError(null);
          } catch(genError) {
            console.error("Error generating chart data:", genError);
            setChartError("Error al generar datos del gráfico.");
            setChartData(null);
          }
        }
        setLoading(false);
      },
      (error) => {
        console.error("Error listening to active campaign changes:", error);
        setChartError("Error al cargar datos de campaña.");
        setActiveCampaign(null);
        setChartData(null);
        setLoading(false);
      }
    );

    return () => {
      console.log("Cleaning up LATEST ACTIVE campaign listener for user:", user.uid);
      unsubscribe();
    };

  }, [user?.uid]);

  const handleVerTodoClick = () => {
    if (isInstagramConnected) {
      navigateToCampaigns();
    } else {
      showNotification("Debes conectar tu cuenta de Instagram primero para ver las campañas.", "error");
    }
  };

  const renderLineChart = () => {
    if (loading) {
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

  return (
    <div className="p-4 md:p-6 bg-[#F3F2FC] min-h-screen font-['Poppins']">
      <div className="mb-6">
        <h2 className="text-lg text-gray-600 font-normal">Hola, {user?.displayName || user?.email || "Usuario"}</h2>
        <h1 className="text-2xl font-medium text-black">Bienvenido a Tribe IA</h1>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm mb-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-medium text-black">Campañas activas</h2>
          <button 
            onClick={handleVerTodoClick}
            className="bg-white text-gray-500 px-3 py-1 rounded-lg border border-gray-200 text-sm hover:bg-gray-50"
          >
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
                  {activeCampaign.targetCount > 0 ? Math.floor((activeCampaign.currentProgress / activeCampaign.targetCount) * 100) : 0}% completado
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
              onClick={() => {
                if (isInstagramConnected) {
                  onCreateCampaign();
                } else {
                  showNotification("Debes conectar tu cuenta de Instagram para crear una campaña.", "error");
                }
              }}
            >
              <FaPlus className="mr-2" />
              Crear Campaña
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

HomeDashboard.propTypes = {
  user: PropTypes.object,
  onCreateCampaign: PropTypes.func.isRequired,
  navigateToCampaigns: PropTypes.func,
  isInstagramConnected: PropTypes.bool,
  showNotification: PropTypes.func
};

export default HomeDashboard;