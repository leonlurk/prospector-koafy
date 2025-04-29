import { useEffect, useState, useCallback } from "react";
import { db, auth } from "./firebaseConfig";
import { collection, addDoc, getDocs, doc, setDoc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import { FaSearch, FaPlus, FaSlidersH, FaBars, FaBan } from "react-icons/fa";
import ChartComponent from "./components/ChartComponent";
import ConnectInstagram from "./components/ConnectInstagram";
import ModalEditarPlantilla from "./components/ModalEditarPlantilla";
import WhitelistPanel from "./components/WhitelistPanel";
import { checkBlacklistedUsers } from "./blacklistUtils";
import { getInstagramSession, clearInstagramSession } from "./instagramSessionUtils";
import CampaignsPanel from "./components/CampaignsPanel";
import HomeDashboard from "./components/HomeDashboard";
import StatisticsDashboard from "./components/StatisticsDashboard";
import NuevaCampanaModal from "./components/NuevaCampanaModal";
import { updateCampaign } from "./campaignStore";
import { instagramApi } from "./instagramApi";
import logApiRequest from "./requestLogger";
import { getLatestProcessingCampaign, getOldestScheduledCampaign, activateCampaign } from "./campaignStore";

// --- Import Setter AI Pages --- 
import SetterDashboardPage from "./features/setter-ai/pages/DashboardPage"; 
import SetterConnectionsPage from "./features/setter-ai/pages/ConnectChannelsPage"; // Import connection page
import SetterBlackListPage from "./features/setter-ai/pages/BlackListPage"; // <-- IMPORTAR NUEVA PÁGINA BLACKLIST
import SetterAgentsPage from "./features/setter-ai/pages/AgentListPage";       // Import agent list page
import SetterAgentDetailPage from "./features/setter-ai/pages/AgentDetailPage"; 
import WhatsAppPage from './features/setter-ai/pages/WhatsAppPage';
import AgentDescriptionSetupPage from './features/setter-ai/pages/AgentDescriptionSetupPage'; 
import KnowledgeBasePage from './features/setter-ai/pages/KnowledgeBasePage'; // Asumiendo que estos se usan si se navega directamente

// Helper function to determine the current tool context based on selectedOption
const getToolContext = (option) => {
  const prospectorOptions = [
    "Home", "Plantillas", "Campañas", "Listas", "Whitelist", 
    "Blacklist", "Nueva Campaña", "Conectar Instagram", "Estadísticas", "Send Media",
    // Add generic options possibly shared or belonging to prospector
    "Ajustes", "Light Mode" 
  ];
  // Include all option names that belong to the Setter context
  const setterOptions = [
      "Setter IA", 
      "SetterDashboard", "SetterConnections", "SetterBlacklist", "SetterActionFlow",
      "SetterWhatsAppWeb", "SetterMessages", "SetterAgents", "SetterStatistics", 
      "SetterBilling", "SetterNotifications", "SetterSupport", "SetterSettings"
      // Note: We don't need to list every possible AgentDetail ID here
    ]; 
  const calendarOptions = [
      "Calendar", // The main option in the dropdown
      "CalendarView"
      // Add any other Calendar-specific view options here
    ];
  
  // Check if it's an Agent Detail view
  if (typeof option === 'string' && option.startsWith("SetterAgentDetail_")) {
    return "setter";
  }
  // Check other specific Setter options
  if (setterOptions.includes(option)) {
    return "setter";
  }
  // Check Calendar context next
  if (calendarOptions.includes(option)) {
    return "calendar";
  }
  // Check Prospector context last (as a fallback for known prospector/generic options)
  if (prospectorOptions.includes(option)) {
    return "prospector";
  }
  
  // Default context if none of the specific options match
  console.warn(`getToolContext: Option '${option}' did not match known contexts, defaulting to 'prospector'.`);
  return "prospector"; 
};

const API_BASE_URL = "https://alets.com.ar";

// Genera un deviceId simulado
const generateRandomDeviceId = () => {
  return "android-" + Math.random().toString(36).substring(2, 15);
};

// Retardo aleatorio
const randomDelay = async (min = 800, max = 2500) => {
  const delay = Math.floor(Math.random() * (max - min) + min);
  return new Promise((resolve) => setTimeout(resolve, delay));
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [selectedOption, setSelectedOption] = useState("Home");
  const [isLoading, setIsLoading] = useState(true);
  const [isInstagramConnected, setIsInstagramConnected] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [instagramToken, setInstagramToken] = useState("");
  const [isPlatformMenuOpen, setIsPlatformMenuOpen] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState("Plataformas");
  const [isTypeMenuOpen, setIsTypeMenuOpen] = useState(false);
  const [selectedType, setSelectedType] = useState("Tipo");
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [isCreateTemplateModalOpen, setIsCreateTemplateModalOpen] = useState(false);
  const [newTemplate, setNewTemplate] = useState("");
  const [newTemplateBody, setNewTemplateBody] = useState("");
  const [deviceId, setDeviceId] = useState("");
  const [sessionCookies, setSessionCookies] = useState(null);
  const [isTemplatesLoading, setIsTemplatesLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredTemplates, setFilteredTemplates] = useState([]);
  const [notification, setNotification] = useState({ show: false, message: "", type: "" });
  const [showSidebar, setShowSidebar] = useState(false);
  const [showBlacklistPanel, setShowBlacklistPanel] = useState(false);
  const [showCampaignsPanel, setShowCampaignsPanel] = useState(false);
  const [isNewCampaignModalOpen, setIsNewCampaignModalOpen] = useState(false);
  const [processingScheduled, setProcessingScheduled] = useState(false);

  // Determine the current tool context
  const currentToolContext = getToolContext(selectedOption);

  // Notificación simple
  const showNotification = (message, type = "info") => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: "", type: "" });
    }, 3000);
  };

  const handleSidebarOptionChange = (option) => {
    if (option === "Nueva Campaña") {
      if (isInstagramConnected) {
        setIsNewCampaignModalOpen(true);
        setShowSidebar(false); // Cerrar el sidebar en móviles si está abierto
      } else {
        // Mostrar una notificación o redireccionar a conectar Instagram
        showNotification("Debes conectar tu cuenta de Instagram primero", "warning");
        setSelectedOption("Conectar Instagram");
        setShowSidebar(false);
      }
    } else {
      setSelectedOption(option);
      setShowSidebar(false);
    }
  };

  const types = ["Plantillas de mensajes", "Plantillas de comentarios"];

  // Búsqueda
  const searchTemplates = (query) => {
    setSearchQuery(query);
    console.log("Buscando:", query); // Agrega este console.log para depuración
    
    if (!query.trim()) {
      setFilteredTemplates(templates);
      return;
    }
    
    const filtered = templates.filter(
      (template) =>
        template.name.toLowerCase().includes(query.toLowerCase()) ||
        (template.body && template.body.toLowerCase().includes(query.toLowerCase())) ||
        (template.platform && template.platform.toLowerCase().includes(query.toLowerCase()))
    );
    
    console.log("Plantillas filtradas:", filtered.length); // Para depuración
    setFilteredTemplates(filtered);
  };

  // Carga plantillas
  const fetchTemplates = useCallback(async (uid) => {
    try {
      setIsTemplatesLoading(true);
      const templatesRef = collection(db, "users", uid, "templates");
      const templatesSnapshot = await getDocs(templatesRef);
      const templatesList = templatesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setTemplates(templatesList);
      setFilteredTemplates(templatesList);
      setIsTemplatesLoading(false);
    } catch (error) {
      console.error("Error al cargar plantillas:", error);
      showNotification("Error al cargar las plantillas", "error");
      setIsTemplatesLoading(false);
    }
  }, []);

  // Filtra por plataforma
  const filterTemplatesByPlatform = (platform) => {
    setSelectedPlatform(platform);
    setIsPlatformMenuOpen(false);
    if (platform === "Todos") {
      setFilteredTemplates(templates);
      return;
    }
    const filtered = templates.filter(
      (template) => template.platform?.toLowerCase() === platform.toLowerCase()
    );
    setFilteredTemplates(filtered);
  };

  // Filtra por tipo
  const filterTemplatesByType = (type) => {
    setSelectedType(type);
    setIsTypeMenuOpen(false);
  };

  const openCreateTemplateModal = () => {
    setIsCreateTemplateModalOpen(true);
  };

  // Verifica sesión
  const checkInstagramSession = useCallback(
    async (token) => {
      try {
        await randomDelay(300, 800);
        setIsLoading(true);

        const headers = {
          token: token,
          "User-Agent": "Instagram 219.0.0.12.117 Android",
          "Accept-Language": "es-ES, en-US",
        };
        if (sessionCookies) {
          headers["Cookie"] = sessionCookies;
        }

        const response = await fetch(`${API_BASE_URL}/session`, {
          method: "GET",
          headers: headers,
        });

        if (!response.ok) {
          throw new Error(`Error HTTP: ${response.status}`);
        }

        const data = await response.json();

        if (data.cookies) {
          localStorage.setItem("instagram_cookies", JSON.stringify(data.cookies));
          setSessionCookies(data.cookies);
        }
        return data.status === "success" && data.authenticated;
      } catch (error) {
        console.error("Error al verificar sesión de Instagram:", error);
        showNotification("No se pudo verificar la sesión de Instagram", "error");
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [sessionCookies]
  );

  useEffect(() => {
    // Carga deviceId
    const savedDeviceId = localStorage.getItem("instagram_device_id");
    if (savedDeviceId) {
      setDeviceId(savedDeviceId);
    } else {
      const newDeviceId = generateRandomDeviceId();
      setDeviceId(newDeviceId);
      localStorage.setItem("instagram_device_id", newDeviceId);
    }
  
    // Carga cookies del localStorage (solo para compatibilidad)
    const savedCookies = localStorage.getItem("instagram_cookies");
    if (savedCookies) {
      try {
        setSessionCookies(JSON.parse(savedCookies));
      } catch (e) {
        console.error("Error al parsear cookies guardadas:", e);
      }
    }
  
    // Suscribirse a Auth
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (!currentUser) {
        navigate("/");
      } else {
        setUser(currentUser);
        setIsLoading(true);
        fetchTemplates(currentUser.uid);
  
        try {
          // Obtener sesión de Instagram desde Firebase
          const instagramSession = await getInstagramSession(currentUser.uid);
          
          if (instagramSession && instagramSession.token) {
            // Restaurar localStorage desde Firebase (para compatibilidad)
            if (instagramSession.token) {
              localStorage.setItem("instagram_bot_token", instagramSession.token);
            }
            if (instagramSession.cookies) {
              localStorage.setItem(
                "instagram_cookies", 
                typeof instagramSession.cookies === 'string' 
                  ? instagramSession.cookies 
                  : JSON.stringify(instagramSession.cookies)
              );
              setSessionCookies(instagramSession.cookies);
            }
            if (instagramSession.deviceId) {
              localStorage.setItem("instagram_device_id", instagramSession.deviceId);
              setDeviceId(instagramSession.deviceId);
            }
            if (instagramSession.username) {
              localStorage.setItem("instagram_username", instagramSession.username);
            }
            
            // Verificar que la sesión sigue siendo válida
            const sessionValid = await checkInstagramSession(instagramSession.token);
            setIsInstagramConnected(sessionValid);
  
            if (sessionValid) {
              setInstagramToken(instagramSession.token);
              setSelectedOption("Home");  // Cambiar a Home cuando hay sesión válida
            } else {
              // La sesión expiró, limpiar datos
              await clearInstagramSession(currentUser.uid);
              setSelectedOption("Conectar Instagram");  // Mantener el comportamiento para sesiones expiradas
            }
          } else {
            setSelectedOption("Conectar Instagram");
          }
        } catch (error) {
          console.error("Error al recuperar sesión de Instagram:", error);
          setSelectedOption("Conectar Instagram");
        } finally {
          setIsLoading(false);
        }
      }
    });
  
    // Resize listener
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setShowSidebar(false);
      }
    };
    window.addEventListener("resize", handleResize);
  
    return () => {
      unsubscribe();
      window.removeEventListener("resize", handleResize);
    };
  }, [navigate, fetchTemplates, checkInstagramSession]);

  // --- Lógica de Polling para Campañas Programadas (Lógica de Cola Estricta) ---
  useEffect(() => {
    if (!user?.uid) return;

    console.log("Iniciando intervalo de verificación de cola de campañas...");
    const intervalId = setInterval(async () => {
      if (processingScheduled) {
        console.log("Polling Fallback: Procesamiento anterior en curso.");
        return; 
      }

      console.log("Polling Fallback: Verificando cola...");
      setProcessingScheduled(true);

      try {
        // 1. ¿Hay alguna campaña activa?
        const currentActive = await getLatestProcessingCampaign(user.uid);
        
        if (!currentActive) {
          // 2. No hay activa. ¿Hay alguna programada esperando?
          console.log("Polling Fallback: No hay campañas activas. Buscando programadas...");
          const nextCampaign = await getOldestScheduledCampaign(user.uid);

          if (nextCampaign) {
            // 3. ¡Sí hay! Intentar activarla.
            console.log(`Polling Fallback: Activando campaña programada ${nextCampaign.id}`);
            const session = await getInstagramSession(user.uid);
            const currentInstagramToken = session?.token;

            if (!currentInstagramToken) {
              console.error("Polling Fallback: No se pudo obtener token para activar campaña.");
              showNotification("Error: No se pudo obtener token para activar campaña en cola.", "error");
            } else {
               // Llamar a activateCampaign (que maneja errores internos y logs)
               const activated = await activateCampaign(user.uid, nextCampaign, currentInstagramToken);
               if (activated) {
                   showNotification(`Campaña en cola '${nextCampaign.name}' iniciada.`, "success");
                   // Podríamos querer refrescar la lista de campañas aquí
               } else {
                    // activateCampaign ya maneja el log y el cambio a status: failed
                    showNotification(`Error al iniciar campaña en cola '${nextCampaign.name}'.`, "error");
               }
            }
          } else {
             console.log("Polling Fallback: No hay campañas programadas esperando.");
          }
        } else {
            console.log(`Polling Fallback: Campaña ${currentActive.id} sigue activa.`);
        }

      } catch (error) {
        console.error("Polling Fallback: Error general al verificar/procesar cola:", error);
      } finally {
        setProcessingScheduled(false);
        console.log("Polling Fallback: Ciclo completado.");
      }
    }, 60000); // Verificar cada 60 segundos (puede ajustarse)

    return () => {
      console.log("Limpiando intervalo de verificación de cola.");
      clearInterval(intervalId);
    };
  }, [user, processingScheduled]); // Dependencias

  // Guarda plantilla
  const saveTemplate = async () => {
    if (!user) {
      showNotification("Error: No hay un usuario autenticado.", "error");
      return;
    }
    if (!newTemplate?.trim()) {
      showNotification("El nombre de la plantilla es obligatorio.", "error");
      return;
    }
    if (!newTemplateBody?.trim()) {
      showNotification("El cuerpo del mensaje es obligatorio.", "error");
      return;
    }

    try {
      setIsLoading(true);
      const templateRef = collection(db, "users", user.uid, "templates");
      await addDoc(templateRef, {
        name: newTemplate.trim(),
        body: newTemplateBody.trim(),
        userId: user.uid,
        createdAt: new Date(),
        type: selectedType !== "Tipo" ? selectedType : "Plantillas de mensajes",
    });
      showNotification("Plantilla guardada con éxito", "success");
      setNewTemplate("");
      setSelectedPlatform("Plataformas");
      setNewTemplateBody("");
      setIsCreateTemplateModalOpen(false);
      fetchTemplates(user.uid);
    } catch (error) {
      console.error("Error al guardar la plantilla:", error);
      showNotification("Error al guardar la plantilla", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Maneja opciones de plantilla
  const handleTemplateOptions = (template) => {
    if (!template.id) {
      showNotification("Error: La plantilla seleccionada no tiene un ID.", "error");
      return;
    }
    setSelectedTemplate({
      id: template.id,
      name: template.name || "",
      platform: template.platform || "",
      body: template.body || "",
      userId: template.userId || user?.uid || "",
    });
  };

  /**
   * Llamado cuando se completa el login en ConnectInstagram
   */
  const handleConnectInstagram = async (tokenOrEmail, maybePassword) => {
    console.log("Se conectó la cuenta de Instagram con email:", tokenOrEmail);
    
    // Verificar si ya hay un token almacenado en el localStorage
    const token = localStorage.getItem("instagram_bot_token");
    if (token && user) {
      // Actualizar estado
      setInstagramToken(token);
      setIsInstagramConnected(true);
      // Redireccionar a Home después de conectar Instagram
      setSelectedOption("Home");
    }
  };

  /**
   * Llamado cuando se completa la 2FA en Instagram2FAVerification
   * => Cambiamos a 'Nueva solicitud', y marcamos conectado si quieres
   */
  const handleVerify2FASuccess = (token) => {
    console.log("2FA verificada con éxito, token:", token);
    setInstagramToken(token);
    setIsInstagramConnected(true);
  
    // Redireccionar a Home después de verificar 2FA
    setSelectedOption("Home");
  };

  // Render principal
  const renderContent = () => {
    // Extraer el tipo base de la opción (ej: SetterAgentDetail)
    const optionType = typeof selectedOption === 'string' ? selectedOption.split('_')[0] : null;
    
    console.log("Dashboard renderContent - Selected Option:", selectedOption, "Type:", optionType);

    // --- MANEJO DE OPCIONES NO BASADAS EN TIPO (Nombres exactos) ---
    // Si la opción es una de las originales, manejarla directamente.
    // Esto es un parche temporal, idealmente se refactorizaría para usar solo optionType
    // o tener un mapeo claro.
    switch (selectedOption) {
        case 'Home':
            return <HomeDashboard user={user} onCreateCampaign={() => setIsNewCampaignModalOpen(true)} />;
        case 'Campañas':
            return <CampaignsPanel user={user} onRefreshStats={() => {}} onCreateCampaign={() => setIsNewCampaignModalOpen(true)} />;
        case 'Blacklist': // Manejado abajo por optionType? Revisar si hay duplicado
            return <SetterBlackListPage />;
        case 'Whitelist':
      return <WhitelistPanel user={user} />;
        case 'Conectar Instagram':
             return <ConnectInstagram 
          user={user}
          onConnect={handleConnectInstagram}
          onVerify2FA={handleVerify2FASuccess}
          errorMessage={errorMessage}
          showModal={showModal}
          setShowModal={setShowModal}
          instagramToken={instagramToken}
          deviceId={deviceId}
                    />;
        case 'Plantillas':
             // Reintegrar la lógica de renderizado de plantillas que estaba antes
      return (
        <div className="p-4 md:p-6 bg-[#F3F2FC] min-h-screen">
                   {/* ... (JSX de búsqueda y botón Crear Plantilla) ... */}
                   {/* ... (JSX de lista/loading de plantillas) ... */}
                   {/* Ejemplo simplificado: */}
                   <p>Vista de Plantillas (Reintegrar JSX)</p> 
        </div>
      );
        case 'Estadísticas': // Manejado abajo por optionType? Revisar
             return <StatisticsDashboard user={user} />;
        // Añadir otros casos directos si son necesarios ('Nueva Campaña', 'Send Media'?) 
        // Nota: 'Nueva Campaña' y 'Send Media' parecen manejarse abriendo modales, no cambiando la vista principal directamente.
        
        // Si no es una opción directa, usar el switch por tipo
        default:
            break; // Continuar al switch por optionType
    }

    // --- MANEJO POR TIPO (Principalmente Setter AI) ---
    switch (optionType) {
        case 'SetterDashboard':
            return <SetterDashboardPage user={user} setSelectedOption={setSelectedOption}/>;
        case 'SetterConnections':
      return <SetterConnectionsPage />;
        case 'SetterBlacklist': // ¿Conflicto con 'Blacklist' arriba? Usar solo uno.
            return <SetterBlackListPage />;
        case 'SetterActionFlow':
             return <div>Página Action Flow (Requiere Agente)</div>;
        case 'SetterAgents': 
      return <SetterAgentsPage user={user} setSelectedOption={setSelectedOption} />;
        case 'SetterAgentDescriptionSetup': 
            return <AgentDescriptionSetupPage setSelectedOption={setSelectedOption} />;
        case 'SetterAgentDetail': { 
             if (typeof selectedOption === 'string') {
                 const parts = selectedOption.split('_');
                 if (parts.length >= 3) {
                     const agentId = parts[2];
                     // Pasar selectedOption completo para que el detalle sepa qué tab mostrar inicialmente
         return <SetterAgentDetailPage 
                                 agentId={agentId} 
                   user={user} 
                                 setSelectedOption={setSelectedOption} 
                                 selectedOption={selectedOption} 
                />;
      } else {
                     console.error("Dashboard: Invalid SetterAgentDetail format", selectedOption);
                     return <div>Error: ID de agente inválido en la opción seleccionada.</div>; 
                 }
             } else {
                 return <div>Error: Opción de detalle de agente inválida.</div>;
    }
        }
        case 'SetterStatistics': // ¿Conflicto con 'Estadísticas' arriba? Usar solo uno.
        return <StatisticsDashboard user={user} />;
        case 'SetterBilling':
             return <div>Página de Facturación</div>;
        case 'SetterNotifications':
             return <div>Página de Notificaciones</div>;
        case 'SetterSupport':
             return <div>Página de Soporte</div>;
        case 'SetterSettings': 
             return <div>Página de Configuración</div>;        
        case 'WhatsApp': // Caso antiguo 'whatsapp'
            return <WhatsAppPage />;
        
        default:
             // Si ni el nombre directo ni el tipo coincidieron
             console.warn(`Dashboard: Unknown option or type: ${selectedOption}`);
             return <div>Seleccione una opción del menú.</div>; 
    }
  };

  // Maneja la actualización de plantillas
  const handleTemplateUpdated = () => {
    if (user) {
      fetchTemplates(user.uid);
    }
  };

  // Sidebar responsive
  const toggleSidebar = () => {
    setShowSidebar(!showSidebar);
  };

  return (
    <div className="h-screen flex flex-col md:flex-row bg-gray-100 relative font-['Poppins']">
      {/* Notificación simple */}
      {notification.show && (
        <div
          className={`fixed top-4 right-4 z-50 p-3 md:p-4 rounded-lg shadow-lg ${
            notification.type === "success"
              ? "bg-green-500"
              : notification.type === "error"
              ? "bg-red-500"
              : notification.type === "warning"
              ? "bg-yellow-500"
              : "bg-blue-500"
          } text-white text-sm md:text-base max-w-[90%] md:max-w-md`}
        >
          {notification.message}
        </div>
      )}

      {/* Botón de menú móvil */}
      <button
        className="md:hidden fixed top-4 left-4 z-40 bg-gradient-to-br from-[#232323] to-[#383737] text-white p-4 rounded-xl shadow-md"
        onClick={toggleSidebar}
      >
        <FaBars size={20} />
      </button>

      {/* Overlay sidebar móvil */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden transition-opacity duration-300 ${
          showSidebar ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={toggleSidebar}
      ></div>

      {/* Sidebar adaptativo */}
      <div
  className={`fixed md:static h-screen z-40 transition-all duration-300 transform ${
    showSidebar ? "translate-x-0" : "-translate-x-full"
  } md:translate-x-0 md:flex md:h-screen md:z-auto`}
>
<Sidebar
  selectedOption={selectedOption}
  setSelectedOption={handleSidebarOptionChange}
  isInstagramConnected={isInstagramConnected}
  toolContext={currentToolContext}
/>
</div>

      <div className="flex-1 p-2 md:p-6 overflow-auto pt-16 md:pt-6">{renderContent()}</div>

      {/* Modal para editar plantillas */}
      {selectedTemplate && (
        <ModalEditarPlantilla
          template={selectedTemplate}
          onClose={() => setSelectedTemplate(null)}
          onUpdate={handleTemplateUpdated}
        />
      )}

      {/* Modal para crear nueva plantilla */}
      {isCreateTemplateModalOpen && (
  <ModalEditarPlantilla
    isCreateMode={true}
    template={{
      id: null,
      name: newTemplate,
      body: newTemplateBody,
      userId: user?.uid || "",
      type: selectedType !== "Tipo" ? selectedType : "Plantillas"
    }}
    onClose={() => setIsCreateTemplateModalOpen(false)}
    onUpdate={handleTemplateUpdated}
    saveTemplate={saveTemplate}
    setNewTemplate={setNewTemplate}
    setNewTemplateBody={setNewTemplateBody}
    selectedType={selectedType}
    setSelectedType={setSelectedType}
  />
)}

      {/* Panel de Blacklist (Modal) */}
      {showBlacklistPanel && (
        <SetterBlackListPage />
      )}
      <NuevaCampanaModal
        isOpen={isNewCampaignModalOpen}
        onClose={() => setIsNewCampaignModalOpen(false)}
        user={user}
        instagramToken={instagramToken}
      />
    </div>
  );
};

export default Dashboard;