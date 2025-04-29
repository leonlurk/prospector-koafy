import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

// Heroicons (SVG como componentes React)
const RectangleStackIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.429 9.75L2.25 12l4.179 2.25m0-4.5l5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0l5.571 3m-5.571-3l-5.571 3m11.142 0l-5.571 3m5.571-3v11.25c0 .621-.504 1.125-1.125 1.125h-5.571c-.621 0-1.125-.504-1.125-1.125v-11.25m11.142 0l4.179 2.25M12 15.75l-4.179 2.25m0 0l4.179 2.25 4.179-2.25m-8.358 0l4.179 2.25M3.375 7.5l4.179 2.25m0 0l4.179 2.25M7.55 15.75l4.179-2.25m-4.179 2.25v-11.25a1.125 1.125 0 011.125-1.125h1.5a1.125 1.125 0 011.125 1.125v11.25m-3.75 0h3.75m-3.75 0L7.5 18l-4.125-2.25" />
  </svg>
);

const ChartBarIcon = (props) => (
 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
  <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
</svg>
);

const Cog6ToothIcon = (props) => (
 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
  <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.646.87.333.184.726.217 1.08.092l1.26-.365c.513-.148.975.342.792.816l-1.26 2.203c-.253.44-.686.756-1.175.82l-1.37.098c-.41.03-.786.217-1.05.49l-1.07 1.07c-.318.317-.744.497-1.18.497s-.862-.18-1.18-.497l-1.07-1.07c-.263-.274-.64-.46-1.05-.49l-1.37-.098c-.49-.064-.922-.38-1.175-.82l-1.26-2.203c-.183-.474.279-.964.792-.816l1.26.365c.354.125.747.092 1.08-.092.333-.184.582-.496.646-.87l.213-1.281zM12 8.25a3.75 3.75 0 100 7.5 3.75 3.75 0 000-7.5zM3 15.75a3 3 0 013-3h12a3 3 0 013 3v2.25a3 3 0 01-3 3H6a3 3 0 01-3-3V15.75z" />
</svg>
);

const SunIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
  </svg>
);

const MoonIcon = (props) => (
 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
  <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
</svg>
);

// Icono para Automatización
const WrenchScrewdriverIcon = (props) => (
 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
  <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.145l-5.457 5.457a3.003 3.003 0 00-4.242-4.242l-4.283 5.109a3.375 3.375 0 00-.942 2.586l-.008.008A3.375 3.375 0 005.378 21l.008.007a3.375 3.375 0 002.586-.942l5.108-4.283a3.001 3.001 0 004.242-4.242Z" />
</svg>
);

// Icono para Logs y Acciones
const ChatBubbleLeftRightIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3.1-3.102a11.25 11.25 0 01-5.176 0l-3.1 3.102v-3.091c-.34-.02-.68-.045-1.02-.072-1.133-.093-1.98-1.057-1.98-2.193V10.608c0-.97.616-1.813 1.5-2.097M15.75 6.75v-1.5c0-1.5-1.5-2.25-3.75-2.25S8.25 3.75 8.25 5.25v1.5m7.5 0v4.5m-7.5-4.5v4.5m7.5 0H8.25m7.5 0h1.125c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125h-9.75c-.621 0-1.125-.504-1.125-1.125v-1.5c0-.621.504-1.125 1.125-1.125H8.25" />
  </svg>
);

// Iconos para Koafy (Placeholders)
const HomeIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
  </svg>
);
const ServerStackIcon = (props) => (
 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12h10.5M6 12C6 5.608 6.158 4.5 7.021 3.751 7.845 3 9.162 3 11.397 3h1.206c2.235 0 3.553 0 4.377.751C17.842 4.5 18 5.608 18 12M6 12v3c0 6.392-.158 7.5-1.021 8.249C4.117 24 2.799 24 5.034 24h9.932c2.235 0 3.553 0 4.377-.751C20.205 22.5 20.047 21.392 20.047 15v-3" />
</svg>
);
const ShieldExclamationIcon = (props) => (
 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.249-8.25-3.286zm0 13.036h.008v.008H12v-.008z" />
</svg>
);
const ArrowsRightLeftIcon = (props) => (
 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
  <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h18m-7.5-1.5L21 7.5m0 0L16.5 3M21 7.5H3" />
</svg>
);
const UserCircleIcon = (props) => (
 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
  <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
</svg>
);
const CreditCardIcon = (props) => (
 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
</svg>
);
const BellIcon = (props) => (
 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
  <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
</svg>
);
const LifebuoyIcon = (props) => (
 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
  <path strokeLinecap="round" strokeLinejoin="round" d="M11.35 3.836c-.065.21.166.417.382.417h.532a.75.75 0 00.588-.355l.219-.358c.065-.106.033-.241-.059-.315a4.5 4.5 0 00-5.912 0c-.092.074-.124.209-.059.315l.219.358a.75.75 0 00.588.355h.532c.216 0 .447-.207.382-.417a3.002 3.002 0 015.082-1.688 2.99 2.99 0 014.703 1.024 2.99 2.99 0 01.453 4.145A3 3 0 0119.664 12a3 3 0 01-1.5 2.598 3 3 0 01-4.145.453 2.99 2.99 0 01-1.024 4.703 3 3 0 01-1.688 5.082c-.21-.065-.417.166-.417.382v.532a.75.75 0 00.355.588l.358.219c.106.065.241.033.315-.059a4.5 4.5 0 000-5.912c-.074-.092-.209-.124-.315-.059l-.358.219a.75.75 0 00-.355.588v.532c0 .216-.207.447-.417.382a3.002 3.002 0 01-5.082-1.688 2.99 2.99 0 01-4.703-1.024 2.99 2.99 0 01-.453-4.145A3 3 0 014.336 12a3 3 0 011.5-2.598 3 3 0 014.145-.453 2.99 2.99 0 011.024-4.703 3.002 3.002 0 011.688-5.082zM12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
</svg>
);

// Icono para WhatsApp
const WhatsAppIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
  </svg>
);

// Icono para Mensajes de WhatsApp
const ChatBubbleBottomCenterTextIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
  </svg>
);

const NavLink = ({ to, Icon, label }) => {
  const location = useLocation();
  const isActive = location.pathname === to || 
                   (to !== "/" && location.pathname.startsWith(to) && location.pathname[to.length] === '/') ||
                   (to === '/agents' && location.pathname.startsWith('/agents/'));

  const baseClass = 'flex items-center w-full px-4 py-2.5 rounded-lg transition-colors duration-150 text-sidebar-text-muted';
  const activeClass = 'bg-sidebar-item-active-bg text-sidebar-text-main font-semibold';
  const inactiveClass = 'hover:text-sidebar-text-main hover:bg-sidebar-item-hover-bg';

  return (
     <li>
       <Link
         to={to}
         className={`${baseClass} ${isActive ? activeClass : inactiveClass}`}
         title={label}
       >
         <Icon className="w-6 h-6 mr-4 shrink-0 text-white" />
         <span className="flex-1 text-sm font-medium">{label}</span>
       </Link>
     </li>
  );
};

function Sidebar() {
  const [isDarkMode, setIsDarkMode] = useState(true);

  return (
    <aside className="w-72 h-screen bg-sidebar-bg flex flex-col text-sidebar-text-main rounded-tr-3xl shadow-lg shrink-0">
      {/* Logo - Header */}
      <div className="flex flex-shrink-0 items-center justify-center p-4 border-b border-sidebar-border">
        <img src="/logoBlanco.png" alt="Koafy" className="h-12" />
      </div>

      {/* Navigation - Actualizada a Koafy */}
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {/* Items principales de Koafy */}
          <NavLink to="/dashboard" Icon={HomeIcon} label="Dashboard" />
          <NavLink to="/connections" Icon={ServerStackIcon} label="Conexiones" />
          <NavLink to="/blacklist" Icon={ShieldExclamationIcon} label="Black List" />
          <NavLink to="/action-flow" Icon={ArrowsRightLeftIcon} label="Action Flow" />
          {/* WhatsApp Section */}
          <NavLink to="/whatsapp" Icon={WhatsAppIcon} label="WhatsApp Web" />
          <NavLink to="/messages" Icon={ChatBubbleBottomCenterTextIcon} label="Mensajes" />
          {/* Agente IA podría llevar a la lista o a una página específica */}
          <NavLink to="/agents" Icon={UserCircleIcon} label="Agente IA" />
          <NavLink to="/statistics" Icon={ChartBarIcon} label="Estadísticas" />
          <NavLink to="/billing" Icon={CreditCardIcon} label="Facturación" />
          <NavLink to="/notifications" Icon={BellIcon} label="Notificación" />
      </nav>

      {/* Bottom Section - Ajustada para Koafy */}
      <div className="px-4 pb-6 pt-4 border-t border-sidebar-border">
        <ul className="space-y-2">
            <NavLink to="/support" Icon={LifebuoyIcon} label="Soporte" />
            <NavLink to="/settings" Icon={Cog6ToothIcon} label="Ajustes" />
             {/* Light/Dark mode toggle */}
             <li>
                <button
                   onClick={() => setIsDarkMode(!isDarkMode)}
                   className="flex items-center w-full px-4 py-2.5 rounded-lg text-sidebar-text-muted hover:text-sidebar-text-main hover:bg-sidebar-item-hover-bg"
                 >
                  {isDarkMode ? <SunIcon className="w-6 h-6 mr-4 text-white" /> : <MoonIcon className="w-6 h-6 mr-4 text-white" />}
                  <span className="flex-1 text-sm font-medium">{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
                </button>
             </li>
        </ul>
         {/* User Profile Section (simplificado) */}
         <div className="mt-6 pt-6 border-t border-sidebar-border">
             <Link to="/settings" className="flex items-center group">
                <img
                   src="/logoBlanco.png"
                   alt="Avatar"
                   className="w-10 h-10 rounded-full mr-3 shrink-0 border border-sidebar-border group-hover:opacity-90"
                   onError={(e) => { 
                      e.target.onerror = null;
                      e.target.outerHTML = `<div class="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-semibold mr-3 shrink-0 group-hover:opacity-90">U</div>`;
                   }}
                />
                <div className="flex-1 overflow-hidden">
                    <p className="text-sm font-semibold text-sidebar-text-main group-hover:text-gray-200 truncate">Usuario</p>
                    <p className="text-xs text-sidebar-text-muted truncate">Configuración</p>
                </div>
             </Link>
         </div>
      </div>
    </aside>
  );
}

export default Sidebar;