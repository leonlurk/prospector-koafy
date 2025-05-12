import { useEffect, useState } from "react";
import { auth } from "./firebaseConfig";
import Login from "./Login";
import Dashboard from "./Dashboard";
import { useLocation } from "react-router-dom";
import Sidebar from './Sidebar';
import CampaignsPanel from './components/CampaignsPanel';
import ProspectsPanel from './components/ProspectsPanel';
import SettingsPanel from './components/SettingsPanel';
import StatisticsDashboard from './components/StatisticsDashboard';
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import CRMLayout from './features/crm/CRMLayout';
import KanbanBoardsView from './features/crm/KanbanBoardsView';

function App() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Verificar si la ruta actual es /sso
  const isSSO = location.pathname === "/sso";

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Cargando...</div>;
  }

  // Si estamos en la ruta SSO, no mostrar Login ni Dashboard
  // El componente SSOHandler ya se encargará de la redirección
  if (isSSO) {
    return null;
  }

  return (
    <Router>
      <Sidebar />
      <Routes>
        <Route path="/prospects" element={<ProspectsPanel user={user} />} />
        <Route path="/settings" element={<SettingsPanel user={user} />} />
        <Route path="/statistics" element={<StatisticsDashboard />} />
        <Route path="/sso-handler" element={<SSOHandler />} />
        
        {/* Rutas CRM Whatsapp */}
        <Route path="/crm" element={<CRMLayout />}>
          <Route index element={<Navigate to="kanban-boards" replace />} /> {/* Redirigir /crm a /crm/kanban-boards */}
          <Route path="kanban-boards" element={<KanbanBoardsView />} />
          {/* <Route path="contacts" element={<ContactsView />} /> */}
          {/* <Route path="whatsapp-chats" element={<WhatsappChatsView />} /> */}
          {/* Otras sub-rutas del CRM aquí */}
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;