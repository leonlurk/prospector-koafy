import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
// Importamos React Router si lo usamos más adelante para las páginas
// import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Páginas Principales
import AgentListPage from './pages/AgentListPage';
// import CreateAgentPage from './pages/CreateAgentPage'; // Esta ya no será una ruta directa
// import AnalyticsPage from './pages/AnalyticsPage'; // Eliminada
import ProfileSettingsPage from './pages/ProfileSettingsPage';
import NotFoundPage from './pages/NotFoundPage';
// import AutomationRulesPage from './pages/AutomationRulesPage'; // Eliminada
// import MessagesLogPage from './pages/MessagesLogPage'; // Eliminada

// --- Páginas de Creación ---
import CreateAgentLandingPage from './pages/CreateAgentPage'; // Renombramos para claridad
import SelectFormPage from './pages/creation/SelectFormPage';
import SelectTemplatePage from './pages/creation/SelectTemplatePage';
import SelectCloneSourcePage from './pages/creation/SelectCloneSourcePage';
// --------------------------

// Páginas de Detalle de Agente (anidadas)
import AgentDetailPage from './pages/AgentDetailPage'; // Layout con pestañas
import PersonaAIPage from './pages/PersonaAIPage';
import KnowledgeBasePage from './pages/KnowledgeBasePage';
import ConnectChannelsPage from './pages/ConnectChannelsPage'; // Usada para /connections
import ActionsPage from './pages/ActionsPage';
import PublishPage from './pages/PublishPage';

// --- NUEVAS PÁGINAS PLACEHOLDER --- 
// (Se crearán archivos básicos para estas)
import DashboardPage from './pages/DashboardPage'; 
import BlackListPage from './pages/BlackListPage';
import ActionFlowPage from './pages/ActionFlowPage';
import StatisticsPage from './pages/StatisticsPage';
import BillingPage from './pages/BillingPage';
import NotificationsPage from './pages/NotificationsPage';
import SupportPage from './pages/SupportPage';
import WhatsAppMessagesPage from './pages/WhatsAppMessagesPage';
import WhatsAppPage from './pages/WhatsAppPage';

function App() {
  return (
    // <Router> // Descomentar si usamos React Router
    <MainLayout>
      <Routes>  {/* Usar Routes para definir las rutas */}
        {/* Ruta raíz redirige a Dashboard o Agentes? -> Dashboard */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* --- Rutas Principales (Estilo Koafy) --- */}
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/connections" element={<ConnectChannelsPage />} /> {/* Reusamos esta */}
        <Route path="/blacklist" element={<BlackListPage />} />
        <Route path="/action-flow" element={<ActionFlowPage />} />
        {/* Agente IA apunta a la lista de agentes */}
        <Route path="/agents" element={<AgentListPage />} /> 
        <Route path="/statistics" element={<StatisticsPage />} />
        <Route path="/billing" element={<BillingPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/support" element={<SupportPage />} />
        <Route path="/settings" element={<ProfileSettingsPage />} />
        <Route path="/messages" element={<WhatsAppMessagesPage />} />
        <Route path="/whatsapp" element={<WhatsAppPage />} />

        {/* --- Rutas de Creación de Agente (Mantener accesibles) --- */}
        <Route path="/agents/new" element={<CreateAgentLandingPage />} />
        <Route path="/agents/new/select-form" element={<SelectFormPage />} />
        <Route path="/agents/new/select-template" element={<SelectTemplatePage />} />
        <Route path="/agents/new/select-clone" element={<SelectCloneSourcePage />} />
        
        {/* --- Rutas de Detalle de Agente (Anidadas bajo /agents/:agentId) --- */}
        <Route path="/agents/:agentId" element={<AgentDetailPage />}>
          <Route index element={<Navigate to="persona" replace />} />
          <Route path="persona" element={<PersonaAIPage />} />
          <Route path="knowledge-base" element={<KnowledgeBasePage />} />
          {/* "channels" anidado ya no es necesario si tenemos /connections principal */}
          {/* <Route path="channels" element={<ConnectChannelsPage />} /> */}
          <Route path="actions" element={<ActionsPage />} /> 
          <Route path="publish" element={<PublishPage />} />
        </Route>

        {/* Ruta Not Found */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </MainLayout>
    // </Router> // Descomentar si usamos React Router
  );
}

export default App;
