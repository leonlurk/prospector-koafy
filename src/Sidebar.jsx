import React, { useState, useEffect } from "react";
import { auth } from "./firebaseConfig";
import { useNavigate, NavLink } from "react-router-dom";
import PropTypes from 'prop-types';
import { 
    FaInstagram, FaTimes, FaBan, FaHome, FaChartBar, FaTools, FaCalendarAlt, FaRobot, 
    // Add more icons as needed for Setter menu
    FaTachometerAlt, FaServer, FaShieldAlt, FaExchangeAlt, FaUsersCog, FaCreditCard, FaBell, FaLifeRing, FaCog, FaUserCircle, FaSignOutAlt,
    FaWhatsapp, FaCommentDots, FaFileAlt
} from "react-icons/fa"; 
import { doc, getDoc } from "firebase/firestore";
import { db } from "./firebaseConfig";

const logoPath = "/assets/logoBlanco.png";

// --- Define Setter Menu Items --- (Based on src2/src/layouts/Sidebar.jsx)
const setterMenuItems = [
    // Main Nav
    // { name: "SetterDashboard", label: "Dashboard", icon: <FaTachometerAlt className="md:w-5 md:h-6 text-white" />, path: "/dashboard" }, // <-- Commented out
    { name: "SetterConnections", label: "Conexiones", icon: <FaServer className="md:w-5 md:h-6 text-white" />, path: "/connections" },
    // { name: "SetterBlacklist", label: "Black List", icon: <FaShieldAlt className="md:w-5 md:h-6 text-white" />, path: "/blacklist" }, // <-- Commented out
    // { name: "SetterActionFlow", label: "Action Flow", icon: <FaExchangeAlt className="md:w-5 md:h-6 text-white" />, path: "/action-flow" }, // <-- Commented out
    // { name: "SetterWhatsAppWeb", label: "WhatsApp Web", icon: <FaWhatsapp className="md:w-5 md:h-6 text-white" />, path: "/whatsapp" }, // <-- Commented out
    // { name: "SetterMessages", label: "Mensajes", icon: <FaCommentDots className="md:w-5 md:h-6 text-white" />, path: "/messages" }, // <-- Commented out
    { name: "SetterAgents", label: "Agente IA", icon: <FaUserCircle className="md:w-5 md:h-6 text-white" />, path: "/agents" }, // Note: Was UserCircleIcon
    // { name: "SetterStatistics", label: "Estadísticas", icon: <FaChartBar className="md:w-5 md:h-6 text-white" />, path: "/statistics" }, // <-- Commented out (Note: Was ChartBarIcon)
    // { name: "SetterBilling", label: "Facturación", icon: <FaCreditCard className="md:w-5 md:h-6 text-white" />, path: "/billing" }, // <-- Commented out
    // { name: "SetterNotifications", label: "Notificación", icon: <FaBell className="md:w-5 md:h-6 text-white" />, path: "/notifications" }, // <-- Commented out
    // Bottom Section (we can integrate these differently if needed)
    { name: "SetterSupport", label: "Soporte", icon: <FaLifeRing className="md:w-5 md:h-6 text-white" />, path: "/support", section: "bottom" },
    { name: "SetterSettings", label: "Ajustes", icon: <FaCog className="md:w-5 md:h-6 text-white" />, path: "/settings", section: "bottom" }, // Note: Was Cog6ToothIcon
];

// --- Modified getMenuItems --- 
const getMenuItems = (isInstagramConnected, toolContext) => {
    
    // --- Define Herramientas Dropdown Once --- (We'll use this separately)
    // const herramientasDropdown = { ... }; // Keep this definition or make it global/imported if preferred

    // --- IF SETTER CONTEXT IS ACTIVE --- 
    if (toolContext === 'setter') {
        // Get the main Setter items (filter out bottom and commented items)
        const mainSetterItems = setterMenuItems.filter(item => 
            !item.section && 
            ["SetterConnections", "SetterAgents"].includes(item.name) 
        );

        // Manually construct the desired order, WITHOUT Herramientas
        const combinedSetterMenu = []; // <-- Start empty
        const connectionsItem = mainSetterItems.find(item => item.name === "SetterConnections");
        const agentsItem = mainSetterItems.find(item => item.name === "SetterAgents");

        if (connectionsItem) combinedSetterMenu.push(connectionsItem);
        if (agentsItem) combinedSetterMenu.push(agentsItem);

        // Add any remaining mainSetterItems 
        mainSetterItems.forEach(item => {
            if (!["SetterConnections", "SetterAgents"].includes(item.name)) {
                combinedSetterMenu.push(item);
            }
        });

        return combinedSetterMenu; // Return only the main items
    }

    // --- IF CALENDAR CONTEXT IS ACTIVE --- 
    if (toolContext === 'calendar') {
        // Return only Calendar specific items, WITHOUT Herramientas
        return [
            // herramientasDropdown removed
            { name: "CalendarView", label: "Vista Calendario", icon: <FaCalendarAlt className="md:w-5 md:h-6 text-white" /> },
        ];
    }

    // --- DEFAULT CONTEXT (Prospector/Home) ---
    // Start with Prospector items, WITHOUT Herramientas
    let prospectorMenuItems = [
        // herramientasDropdown removed
        { name: "Home", label: "Home", icon: "/assets/Home.png" },
        { name: "Plantillas", label: "Plantillas", icon: "/assets/device-message.png" },
    ];
    
    if (isInstagramConnected) {
        // Add IG-specific items 
        prospectorMenuItems.push(
            { name: "Campañas", label: "Campañas", icon: "/assets/calendar.png" },
            { 
                name: "Listas", 
                label: "Listas",
                icon: "/assets/note-2.png",
                subItems: [
                    { name: "Whitelist", label: "Whitelist", icon: "/assets/people.png" },
                    { name: "Blacklist", label: "Blacklist", icon: <FaBan className="md:w-5 md:h-6 text-white" /> }
                ]
            },
            { name: "Nueva Campaña", label: "Nueva Campaña", icon: "/assets/add-square.png" }
        );
    } else {
        // Add "Conectar Instagram"
        prospectorMenuItems.push(
            { name: "Conectar Instagram", label: "Conectar Instagram", icon: <FaInstagram className="w-5 h-5 md:w-6 md:h-6 text-white" /> }
        );
    }
    
    return prospectorMenuItems; // Return only the main items
};

// Define bottom items separately, potentially context-aware?
const getBottomItems = (toolContext) => {
    if (toolContext === 'setter') {
        // Filter setter items marked as 'bottom'
        return setterMenuItems.filter(item => item.section === 'bottom');
    }
    // Default bottom items (Prospector/Calendar)
    return [
        // { name: "Ajustes", label: "Ajustes", icon: "/assets/setting-2.png" }, // <-- Commented out
        // { name: "Light Mode", label: "Light Mode", icon: "/assets/arrange-circle-2.png" } // <-- Commented out
        // { name: "Documentos", label: "Documentos", icon: <FaFileAlt className="md:w-5 md:h-6 text-white" />, path: "/documentos" } // Commented out Documentos item
    ];
};


const Sidebar = ({ 
    selectedOption = "", 
    setSelectedOption = () => {}, 
    isInstagramConnected = false,
    toolContext = "prospector" // Default context
}) => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [userData, setUserData] = useState({});
    const [expandedMenu, setExpandedMenu] = useState(""); // State for EXPANDED dropdown (Herramientas OR Listas)
    
    // Define Herramientas dropdown object directly here or import it
    const herramientasDropdown = {
        name: "Herramientas",
        icon: <FaTools className="md:w-5 md:h-6 text-white" />, 
        subItems: [
            { name: "Prospector", label: "Prospector", icon: <FaHome className="md:w-5 md:h-6 text-white" /> }, 
            { name: "Setter IA", label: "Setter IA", icon: <FaRobot className="md:w-5 md:h-6 text-white" /> }, 
            // { name: "Calendar", label: "Calendar", icon: <FaCalendarAlt className="md:w-5 md:h-6 text-white" /> },
            { name: "CRMWhatsApp", label: "CRM WhatsApp", icon: <FaWhatsapp className="md:w-5 md:h-6 text-white" /> }
        ]
    };
    
    // Get menu items based on context (now excludes Herramientas)
    const menuItems = getMenuItems(isInstagramConnected, toolContext);
    const bottomItems = getBottomItems(toolContext);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
            setUser(currentUser);
    
            if (currentUser) {
                await fetchUserData(currentUser.uid);
            }
        });
    
        return () => unsubscribe();
    }, []);
    
    const fetchUserData = async (uid) => {
        const userRef = doc(db, "users", uid);
        const docSnap = await getDoc(userRef);
    
        if (docSnap.exists()) {
            setUserData(docSnap.data());
        } else {
            console.warn("No se encontraron datos de usuario en Firestore");
        }
    };
    
    // Function to handle item clicks (main items AND Herramientas)
    const handleItemClick = (item) => {
         console.log(`[Sidebar Click] Main Item Clicked: ${item.name}, Context: ${toolContext}`);
         if (item.subItems) {
            // Toggle the submenu (Herramientas or Listas)
            setExpandedMenu(prev => prev === item.name ? "" : item.name);
             console.log(`[Sidebar Click] Toggled expanded menu for ${item.name}. New state: ${expandedMenu === item.name ? "" : item.name}`);
        } else {
            // Navigate if it's a direct navigation item (not a dropdown parent)
            if (item.name !== selectedOption) {
                 console.log(`[Sidebar Click] Calling setSelectedOption(${item.name})`);
                 setSelectedOption(item.name);
            }
            // Close any open menu ONLY if the clicked item wasn't a dropdown parent itself
             if (expandedMenu !== "" && !item.subItems) { 
                console.log(`[Sidebar Click] Closing menu '${expandedMenu}'. Calling setExpandedMenu('').`);
            setExpandedMenu(""); 
            } else if (!item.subItems) {
                 console.log(`[Sidebar Click] Clicked non-dropdown item '${item.name}'. No menu was open or clicked item was dropdown parent. Skipping close.`);
            }
        }
    };

    // Function to handle sub-item clicks (for Herramientas, Listas)
    const handleSubItemClick = (subItem, parentItemName) => {
        console.log(`[Sidebar Click] SubItem: ${subItem.name}, Parent: ${parentItemName}, Current selectedOption: ${selectedOption}`);

        let targetOption = null;

        // Determine target based on subItem
        if (parentItemName === "Herramientas") {
            if (subItem.name === "Setter IA") targetOption = "SetterConnections"; 
            // else if (subItem.name === "Calendar") targetOption = "CalendarView"; // (Commented out)
            else if (subItem.name === "Prospector") {
                 console.log("[Sidebar Click] Prospector clicked. Setting targetOption to Home.");
                 targetOption = "Home"; 
            } else if (subItem.name === "CRMWhatsApp") { 
                 console.log("[Sidebar Click] CRMWhatsApp clicked. Setting targetOption to CRMWhatsApp.");
                 targetOption = "CRMWhatsApp";
            }
        } else if (parentItemName === "Listas") {
             targetOption = subItem.name; // Whitelist or Blacklist
        }
        // Add other parent menus if needed

        // Perform navigation if a target was set and it's different
        if (targetOption && targetOption !== selectedOption) {
            console.log(`[Sidebar Click] SubItem Click -> Calling setSelectedOption(${targetOption})`);
            setSelectedOption(targetOption);
        } else if (targetOption) {
             console.log(`[Sidebar Click] SubItem Click -> Target option ${targetOption} is already selected.`);
        } else {
             console.log(`[Sidebar Click] SubItem Click -> No target option determined for ${subItem.name} under ${parentItemName}.`);
        }

        // Always close the dropdown menu after subitem click
        if (expandedMenu !== "") { 
            console.log(`[Sidebar Click] SubItem Click -> Menu '${expandedMenu}' is open. Closing it.`); 
            setExpandedMenu(""); 
        } else {
            console.log(`[Sidebar Click] SubItem Click -> No menu currently expanded. Skipping close.`);
        }
    };

    return (
        <div className="h-screen w-[85vw] md:w-[280px] lg:w-[300px] bg-[#0d0420] shadow-lg rounded-tr-3xl flex flex-col justify-between p-4 md:p-6 font-['Poppins']"> {/* Restored justify-between, removed overflow-hidden */}
            {/* Top section: Close button (mobile) and Logo */}
            <div className="flex-shrink-0"> {/* Prevent top section from shrinking */}
            {/* Botón de cerrar solo visible en móviles */}
            <div className="md:hidden flex justify-end mb-2">
                <button 
                    className="p-1 rounded-full bg-gray-800 text-white"
                        onClick={() => setSelectedOption(selectedOption)} // Close action
                    aria-label="Cerrar menú"
                >
                    <FaTimes size={18} />
                </button>
            </div>

            {/* Logo */}
                <div className="flex items-center justify-center mb-6 pt-0 md:pt-4"> {/* Adjusted padding */}
                <img 
                    src={logoPath} 
                    alt="Koafy Logo" 
                    className="w-[160px] md:w-[200px]" 
                    onError={(e) => {
                        console.error("Logo image failed to load");
                        e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='60'%3E%3Crect width='200' height='60' fill='%23000000'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='16' fill='white'%3EKoafy%3C/text%3E%3C/svg%3E";
                    }}
                />
            </div>
            </div>

            {/* Sticky Top Section: Herramientas */}
            <div className="flex-shrink-0 mb-4 pb-4 border-b border-gray-700"> {/* Added border and margin */}
                 <div key={herramientasDropdown.name} className="relative w-full">
                     <button
                         onClick={() => handleItemClick(herramientasDropdown)} // Use dedicated handler
                         className={`flex items-center space-x-3 p-2 md:p-3 transition border border-gray-700 rounded-full text-base md:text-lg text-white bg-transparent w-full hover:bg-white hover:bg-opacity-5`} // No active state based on selectedOption here
                     >
                         {React.isValidElement(herramientasDropdown.icon) ? (
                              React.cloneElement(herramientasDropdown.icon, { className: "w-5 h-5 md:w-6 md:h-6 flex items-center justify-center text-white shrink-0" })
                         ) : null}
                         <span className="truncate">{herramientasDropdown.label || herramientasDropdown.name}</span>
                     </button>
                     
                     {/* Subitems for Herramientas */}
                     {herramientasDropdown.subItems && (
                         <div 
                             className={`pl-8 space-y-2 overflow-hidden transition-all duration-300 ease-in-out w-full
                                 ${expandedMenu === herramientasDropdown.name ? 'max-h-60 opacity-100' : 'max-h-0 opacity-0'}`}
                         >
                             {herramientasDropdown.subItems.map((subItem) => (
                                 <button
                                     key={subItem.name}
                                     onClick={() => handleSubItemClick(subItem, herramientasDropdown.name)} // Use dedicated handler
                                     className={`flex items-center space-x-3 p-2 md:p-3 transition text-sm text-gray-300 hover:text-white 
                                         bg-transparent w-full rounded-lg
                                         ${selectedOption === subItem.name || // Highlight if subitem matches...
                                            (subItem.name === 'Prospector' && selectedOption === 'Home') || // ... or Prospector clicked and Home is selected
                                            (subItem.name === 'Setter IA' && selectedOption === 'SetterConnections') // ... or Setter IA clicked and Connections is selected
                                             // Add more specific conditions if needed for other subitems mapping to different selectedOptions
                                             ? "font-semibold bg-opacity-10 bg-white" 
                                             : "hover:bg-white hover:bg-opacity-5"}`}
                                 >
                                     {/* Icon Rendering */} 
                                     {typeof subItem.icon === "string" ? (
                                         <img src={subItem.icon} alt={subItem.label || subItem.name} className="w-4 h-4 md:w-5 md:h-5 brightness-0 invert" />
                                     ) : React.isValidElement(subItem.icon) ? (
                                         React.cloneElement(subItem.icon, { className: "w-4 h-4 md:w-5 md:h-5 flex items-center justify-center text-white shrink-0" })
                                     ) : null}
                                     <span className="truncate">{subItem.label || subItem.name}</span>
                                 </button>
                             ))}
                         </div>
                     )}
                 </div>
            </div>

            {/* Wrapper Div to Center the Main Navigation Area */}
            <div className="flex-grow flex flex-col justify-center overflow-hidden"> {/* Wrapper takes up space and centers nav vertically */}
                {/* Scrollable Main Navigation Area */}
                <nav className="flex flex-col space-y-2 md:space-y-4 overflow-y-auto w-full py-4"> {/* Removed mb-4, added py-4 for padding */}
                    {/* Render main menu items (excluding Herramientas) */}
            {menuItems.map((item) => (
                        <div key={item.name} className="relative w-full"> {/* Removed conditional margin */}
                    <button
                        onClick={() => handleItemClick(item)} // Use dedicated handler
                        className={`flex items-center space-x-3 p-2 md:p-3 transition text-base md:text-lg text-white bg-transparent w-full rounded-lg
                            ${selectedOption === item.name && !item.subItems 
                                ? "font-semibold bg-opacity-10 bg-white" 
                                : "hover:bg-white hover:bg-opacity-5"}`}
                    >
                                {/* Icon Rendering */}
                        {typeof item.icon === "string" ? (
                            <img src={item.icon} alt={item.label || item.name} className="w-5 h-5 md:w-6 md:h-6 brightness-0 invert" />
                        ) : React.isValidElement(item.icon) ? (
                             React.cloneElement(item.icon, { className: "w-5 h-5 md:w-6 md:h-6 flex items-center justify-center text-white shrink-0" })
                        ) : null}
                        <span className="truncate">{item.label || item.name}</span>
                    </button>
                    
                            {/* Subitems (now only for Listas, if present) */}
                    {item.subItems && (
                        <div 
                            className={`pl-8 space-y-2 overflow-hidden transition-all duration-300 ease-in-out w-full
                                ${expandedMenu === item.name ? 'max-h-60 opacity-100' : 'max-h-0 opacity-0'}`}
                        >
                            {item.subItems.map((subItem) => (
                                <button
                                    key={subItem.name}
                                    onClick={() => handleSubItemClick(subItem, item.name)} // Use dedicated handler
                                    className={`flex items-center space-x-3 p-2 md:p-3 transition text-sm text-gray-300 hover:text-white 
                                        bg-transparent w-full rounded-lg
                                                ${selectedOption === subItem.name // Highlight based on sub-item name 
                                            ? "font-semibold bg-opacity-10 bg-white" 
                                            : "hover:bg-white hover:bg-opacity-5"}`}
                                >
                                    {/* Icon Rendering */} 
                                    {typeof subItem.icon === "string" ? (
                                        <img src={subItem.icon} alt={subItem.label || subItem.name} className="w-4 h-4 md:w-5 md:h-5 brightness-0 invert" />
                                    ) : React.isValidElement(subItem.icon) ? (
                                        React.cloneElement(subItem.icon, { className: "w-4 h-4 md:w-5 md:h-5 flex items-center justify-center text-white shrink-0" })
                                    ) : null}
                                    <span className="truncate">{subItem.label || subItem.name}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            ))}
            </nav>
            </div>

            {/* Bottom section (User profile, settings, etc.) */}
            <div className="flex-shrink-0 border-t border-gray-800 pt-3 md:pt-4 mt-auto"> {/* mt-auto keeps it at the bottom */}
                 {/* Render bottom items */}
                 <div className="flex flex-col space-y-2 md:space-y-4 w-full mb-3 md:mb-4"> {/* Added margin bottom */}
                {bottomItems.map((item) => (
                    <button
                        key={item.name}
                        onClick={() => handleItemClick(item)} // Can reuse handleItemClick
                        className={`flex items-center space-x-3 p-2 md:p-3 transition text-sm md:text-base 
                            text-white bg-transparent w-full rounded-lg
                            ${selectedOption === item.name 
                                ? "font-semibold bg-opacity-10 bg-white" 
                                : "hover:bg-white hover:bg-opacity-5"}`}
                    >
                        {/* Icon Rendering */} 
                         {typeof item.icon === "string" ? (
                            <img src={item.icon} alt={item.label || item.name} className="w-5 h-5 md:w-6 md:h-6 brightness-0 invert" />
                        ) : React.isValidElement(item.icon) ? (
                             React.cloneElement(item.icon, { className: "w-5 h-5 md:w-6 md:h-6 flex items-center justify-center text-white shrink-0" })
                        ) : null}
                        <span className="truncate">{item.label || item.name}</span>
                    </button>
                ))}
                </div>

                 {/* User Profile Section */}
                 <div className="flex items-center gap-3 md:gap-4">
                    <img 
                         src="/assets/user.png" // Consider making this dynamic based on userData
                        alt="User Icon"
                        className="w-8 h-8 md:w-10 md:h-10 rounded-full"
                         onError={(e) => { e.target.src = "/assets/avatar.png"; }}
                    />
                    <div className="flex flex-col overflow-hidden">
                        <span className="text-xs md:text-sm font-medium text-white truncate">{userData.username || "Usuario"}</span>
                        <span className="text-xs text-gray-400 truncate">{user?.email || "Sin correo"}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Update PropTypes
Sidebar.propTypes = {
    selectedOption: PropTypes.string,
    setSelectedOption: PropTypes.func,
    isInstagramConnected: PropTypes.bool,
    toolContext: PropTypes.oneOf(['prospector', 'setter', 'calendar']) // Add toolContext prop type
};

Sidebar.defaultProps = {
    selectedOption: "",
    setSelectedOption: () => {},
    isInstagramConnected: false,
    toolContext: "prospector" // Add default value
};

export default Sidebar;