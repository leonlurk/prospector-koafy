import { useEffect, useState, useCallback } from "react";
import { db, auth } from "./firebaseConfig";
import { collection, addDoc, getDocs, doc, setDoc, getDoc, query, orderBy, onSnapshot } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import { FaSearch, FaPlus, FaSlidersH, FaBars, FaBan } from "react-icons/fa";
import ChartComponent from "./components/ChartComponent";
import ConnectInstagram from "./components/ConnectInstagram";
import ModalEditarPlantilla from "./components/ModalEditarPlantilla";
import WhitelistPanel from "./components/WhitelistPanel";
import BlacklistDashboard from "./components/BlacklistDashboard";
import { checkBlacklistedUsers } from "./blacklistUtils";
import { getInstagramSession, clearInstagramSession } from "./instagramSessionUtils";
import CampaignsPanel from "./components/CampaignsPanel";
import HomeDashboard from "./components/HomeDashboard";
import StatisticsDashboard from "./components/StatisticsDashboard";
import NuevaCampanaModal from "./components/NuevaCampanaModal";
import { updateCampaign } from "./campaignStore";
import { instagramApi } from "./instagramApi";
import logApiRequest from "./requestLogger";
import { getLatestProcessingCampaign, getOldestScheduledCampaign, activateCampaign, checkAndActivateNextScheduled } from "./campaignStore";

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
  const [campaignListVersion, setCampaignListVersion] = useState(0);
  const [allCampaigns, setAllCampaigns] = useState([]);
  const [isLoadingCampaigns, setIsLoadingCampaigns] = useState(true);
  const [currentlyProcessingCampaignId, setCurrentlyProcessingCampaignId] = useState(null);

  // Determine the current tool context
  const currentToolContext = getToolContext(selectedOption);

  // Notificación simple
  const showNotificationFunc = (message, type = "info") => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: "", type: "" });
    }, 3000);
  };

  // Function to trigger campaign list refresh
  const triggerCampaignsRefresh = () => {
    setCampaignListVersion(prevVersion => prevVersion + 1);
  };

  const handleSidebarOptionChange = (option) => {
    // Save the selected option to localStorage
    localStorage.setItem('lastSelectedOption', option);

    if (option === "Nueva Campaña") {
      if (isInstagramConnected) {
        setIsNewCampaignModalOpen(true);
        setShowSidebar(false); // Cerrar el sidebar en móviles si está abierto
      } else {
        // Mostrar una notificación o redireccionar a conectar Instagram
        showNotificationFunc("Debes conectar tu cuenta de Instagram primero", "warning");
        setSelectedOption("Conectar Instagram");
        localStorage.setItem('lastSelectedOption', "Conectar Instagram"); // Save this state too
        setShowSidebar(false);
      }
    } else {
      setSelectedOption(option);
      setShowSidebar(false);
    }
  };

  // Function to navigate specifically to the Campaigns tab
  const navigateToCampaigns = () => {
    handleSidebarOptionChange('Campañas');
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
      showNotificationFunc("Error al cargar las plantillas", "error");
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
        showNotificationFunc("No se pudo verificar la sesión de Instagram", "error");
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
  
        let finalSelectedOption = null; // Variable to hold the final decision
        let sessionValid = false; // <-- Declare sessionValid here, outside the try block
  
        try {
          const instagramSession = await getInstagramSession(currentUser.uid);
          // let sessionValid = false; // <-- Remove declaration from here
          
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
            sessionValid = await checkInstagramSession(instagramSession.token);
            setIsInstagramConnected(sessionValid);
  
            if (sessionValid) {
              setInstagramToken(instagramSession.token);
            } else {
              await clearInstagramSession(currentUser.uid);
            }
          } else {
             // No Instagram session found
             setIsInstagramConnected(false);
             sessionValid = false;
          }
  
          // --- PRIORITY CHECK: Instagram Connection --- 
          if (!sessionValid) {
            // If NOT connected, force the Connect Instagram page
            finalSelectedOption = "Conectar Instagram";
            console.log("Setting initial option to Conectar Instagram (Session invalid/missing - PRIORITY).");
            // Clear any potentially invalid last option from localStorage
            localStorage.removeItem('lastSelectedOption'); 
          } else {
            // If connected, THEN try to restore from localStorage
            const savedOption = localStorage.getItem('lastSelectedOption');
            if (savedOption) {
              // Optional: Validate savedOption is still valid
              finalSelectedOption = savedOption;
              console.log("Restoring selected option from localStorage:", savedOption);
            } else {
              // If connected and no saved option, default to Home
              finalSelectedOption = "Home";
              console.log("Setting initial option to Home (Session valid, no saved option).");
            }
          }
  
        } catch (error) {
          console.error("Error during initial setup:", error);
          setIsInstagramConnected(false);
          // On error, default to Connect Instagram page as a safe fallback
          finalSelectedOption = "Conectar Instagram";
          console.log("Setting initial option to Conectar Instagram (Error during setup - PRIORITY).");
          localStorage.removeItem('lastSelectedOption'); 
        } finally {
          // Set the determined option, fallback to Home ONLY if finalSelectedOption is somehow null
          const optionToSet = finalSelectedOption || "Home";
          setSelectedOption(optionToSet);
          
          // Update localStorage only if the session is valid and we are setting a non-connect option
          if (sessionValid && optionToSet !== "Conectar Instagram") { // <-- Now sessionValid is accessible
              localStorage.setItem('lastSelectedOption', optionToSet);
          } 
          
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
  }, [navigate, fetchTemplates]);

  // --- Lógica de Polling para Campañas Programadas (MEJORADA) ---
  useEffect(() => {
    if (!user?.uid) return;

    console.log("[Queue Check] Iniciando intervalo de verificación...");
    const intervalId = setInterval(async () => {
      if (processingScheduled) {
        console.log("[Queue Check] Procesamiento anterior en curso, omitiendo ciclo.");
        return; 
      }

      console.log("[Queue Check] Verificando cola...");
      setProcessingScheduled(true);

      try {
        const activeNow = await getLatestProcessingCampaign(user.uid);
        const activeNowId = activeNow?.id || null;

        // --- Logica Mejorada --- 
        if (activeNowId) {
          // Hay una campaña activa AHORA
          if (activeNowId !== currentlyProcessingCampaignId) {
            console.log(`[Queue Check] Campaña activa detectada/cambiada: ${activeNowId}`);
            setCurrentlyProcessingCampaignId(activeNowId); // Track it
          }
           // Else: La misma campaña sigue activa, no hacer nada extra aquí
           
        } else if (!activeNowId && currentlyProcessingCampaignId) {
          // NO hay campaña activa AHORA, PERO *HABÍA UNA* antes
          console.log(`[Queue Check] Campaña ${currentlyProcessingCampaignId} parece haber terminado. Buscando siguiente en cola...`);
          setCurrentlyProcessingCampaignId(null); // Clear tracking
          triggerCampaignsRefresh(); // Refresh the list panel
          
          // Immediately try to activate the next scheduled one
          const activatedNext = await checkAndActivateNextScheduled(user.uid); 
          if (activatedNext) {
             console.log(`[Queue Check] Siguiente campaña (${activatedNext.id}) activada inmediatamente.`);
             setCurrentlyProcessingCampaignId(activatedNext.id); // Start tracking the new one
             showNotificationFunc(`Siguiente campaña '${activatedNext.name || activatedNext.id}' iniciada.`, "success");
             triggerCampaignsRefresh(); // Refresh list again to show the new active one
          } else {
             console.log("[Queue Check] No se encontró o no se pudo activar una campaña en cola.");
          }
          
        } else if (!activeNowId && !currentlyProcessingCampaignId) {
          // NO hay campaña activa AHORA y NO HABÍA UNA antes
          // This case might be redundant if checkAndActivateNextScheduled covers it, but keep for clarity
          console.log("[Queue Check] No hay campaña activa. Verificando si hay alguna programada...");
          const nextCampaign = await getOldestScheduledCampaign(user.uid);
          if (nextCampaign) {
            console.log(`[Queue Check] Encontrada campaña programada ${nextCampaign.id}. Intentando activar...`);
            const session = await getInstagramSession(user.uid);
            const token = session?.token;
            if (token) {
              const activated = await activateCampaign(user.uid, nextCampaign, token);
              if (activated) {
                console.log(`[Queue Check] Campaña programada ${nextCampaign.id} activada.`);
                setCurrentlyProcessingCampaignId(nextCampaign.id);
                showNotificationFunc(`Campaña en cola '${nextCampaign.name}' iniciada.`, "success");
                triggerCampaignsRefresh();
              } else {
                 showNotificationFunc(`Error al iniciar campaña en cola '${nextCampaign.name}'.`, "error");
                 triggerCampaignsRefresh(); // Refresh even on failure
              }
            } else {
              showNotificationFunc("Error: No se pudo obtener token para activar campaña en cola.", "error");
            }
          } else {
             console.log("[Queue Check] No hay campañas programadas esperando.");
          }
        }
        // --- Fin Logica Mejorada ---

      } catch (error) {
        console.error("[Queue Check] Error general al verificar/procesar cola:", error);
        // Potentially clear tracking ID on error?
        // setCurrentlyProcessingCampaignId(null); 
      } finally {
        setProcessingScheduled(false);
        console.log("[Queue Check] Ciclo completado.");
      }
    }, 30000); // Reducir intervalo a 30 segundos para reacción más rápida?

    return () => {
      console.log("[Queue Check] Limpiando intervalo de verificación.");
      clearInterval(intervalId);
    };
  // Dependencies: Add currentlyProcessingCampaignId if state updates within loop affect next run
  }, [user, processingScheduled, currentlyProcessingCampaignId]); 

  // --- useEffect for Real-time Campaign Listener --- 
  useEffect(() => {
    if (!user?.uid) {
      setAllCampaigns([]); // Clear campaigns if user logs out
      setIsLoadingCampaigns(false);
      return; // No user, no listener
    }

    setIsLoadingCampaigns(true);
    const campaignsRef = collection(db, "users", user.uid, "campaigns");
    const q = query(campaignsRef, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const campaignsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : null,
          lastUpdated: doc.data().lastUpdated?.toDate ? doc.data().lastUpdated.toDate() : null,
          endedAt: doc.data().endedAt?.toDate ? doc.data().endedAt.toDate() : null,
          scheduledAt: doc.data().scheduledAt?.toDate ? doc.data().scheduledAt.toDate() : null,
        }));
        setAllCampaigns(campaignsData); // Update state with all campaigns
        setIsLoadingCampaigns(false);
      },
      (error) => {
        console.error("Error listening to campaign changes in Dashboard:", error);
        setIsLoadingCampaigns(false);
        // Handle listener error (e.g., show notification)
      }
    );

    // Cleanup listener
    return () => unsubscribe();

  }, [user?.uid]); // Re-run if user changes

  // Guarda plantilla
  const saveTemplate = async () => {
    if (!user) {
      showNotificationFunc("Error: No hay un usuario autenticado.", "error");
      return;
    }
    if (!newTemplate?.trim()) {
      showNotificationFunc("El nombre de la plantilla es obligatorio.", "error");
      return;
    }
    if (!newTemplateBody?.trim()) {
      showNotificationFunc("El cuerpo del mensaje es obligatorio.", "error");
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
      showNotificationFunc("Plantilla guardada con éxito", "success");
      setNewTemplate("");
      setSelectedPlatform("Plataformas");
      setNewTemplateBody("");
      setIsCreateTemplateModalOpen(false);
      fetchTemplates(user.uid);
    } catch (error) {
      console.error("Error al guardar la plantilla:", error);
      showNotificationFunc("Error al guardar la plantilla", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Maneja opciones de plantilla
  const handleTemplateOptions = (template) => {
    if (!template.id) {
      showNotificationFunc("Error: La plantilla seleccionada no tiene un ID.", "error");
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
            // Pass relevant campaign data down to HomeDashboard
            const latestActiveCampaign = allCampaigns.find(c => c.status === 'processing');
            return <HomeDashboard 
                     user={user} 
                     onCreateCampaign={() => setIsNewCampaignModalOpen(true)} 
                     navigateToCampaigns={navigateToCampaigns} 
                     isInstagramConnected={isInstagramConnected}
                     showNotification={showNotificationFunc}
                     activeCampaign={latestActiveCampaign}
                     isLoading={isLoadingCampaigns}
                   />;
        case 'Campañas':
            return <CampaignsPanel 
                     user={user} 
                     onRefreshStats={null} // Add function if needed
                     onCreateCampaign={() => setIsNewCampaignModalOpen(true)}
                     refreshTrigger={campaignListVersion}
                     showNotificationFunc={showNotificationFunc} // <-- Pass the function down
                    />;
        case 'Blacklist': 
            return <BlacklistDashboard user={user} />;
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
          <div className="flex flex-row justify-between items-center mb-4 md:mb-6 gap-2">
  <div className="relative flex-grow">
    <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500" />
    <input
      type="text"
      placeholder="Buscar Plantilla"
      value={searchQuery}
      onChange={(e) => searchTemplates(e.target.value)}
      style={{ paddingLeft: '40px' }}
      className="p-3 md:p-4 border border-[#ffffff] rounded-full w-full bg-white shadow-sm text-[#393346] focus:outline-none focus:ring-1 focus:ring-black"
    />
  </div>
  <button
  className="px-4 md:px-6 py-3 md:py-4 bg-white text-black rounded-full shadow-sm flex items-center gap-2 hover:bg-[#acacac] transition text-sm md:text-base whitespace-nowrap h-[46px] md:h-[54px]"
  onClick={openCreateTemplateModal}
>
  <FaPlus /> Crear Plantilla
</button>
</div>

          {isTemplatesLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              <span className="ml-2">Cargando plantillas...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTemplates.length > 0 ? (
                filteredTemplates.map((template, index) => (
                  <div
                    key={template.id}
                    className="p-4 bg-white rounded-2xl flex justify-between items-center shadow-sm hover:shadow-md transition"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className="w-12 h-12 md:w-12 md:h-12 flex items-center justify-center"
                        style={{
                          backgroundImage: "url(/assets/rectangleDark.png)",
                          backgroundSize: "cover",
                          width: "58px", // Fuerza el ancho con estilo en línea
                          height: "58px"
                        }}
                      >
                        <img
                          src={index % 2 === 0 ? "/assets/message.png" : "/assets/messages-2.png"}
                          alt="Message Icon"
                          className="w-10 h-10 md:w-8 md:h-8 object-contain"
                        />
                      </div>
                      <div className="overflow-hidden">
                        <p className="font-semibold text-black truncate text-sm md:text-base">
                          {template.name}
                        </p>
                      </div>
                    </div>
                    <button
                      className="cursor-pointer flex items-center justify-center ml-2"
                      style={{
                        backgroundColor: "transparent",
                        border: "none",
                        padding: 0,
                        margin: 0,
                        lineHeight: 1,
                      }}
                      onClick={() => handleTemplateOptions(template)}
                    >
                      <img
                        src="/assets/setting-5.png"
                        alt="Opciones"
                        className="w-9 h-9 md:w-11 md:h-11"
                      />
                    </button>
                  </div>
                ))
              ) : (
                <div className="p-4 md:p-8 bg-white rounded-2xl text-center">
                  <p className="text-gray-500">
                    {searchQuery
                      ? "No se encontraron plantillas con esos criterios de búsqueda."
                      : "No hay plantillas disponibles. Crea una nueva plantilla para comenzar."}
                  </p>
                </div>
              )}
            </div>
          )}
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
        onCampaignCreated={triggerCampaignsRefresh}
      />
    </div>
  );
};

export default Dashboard;