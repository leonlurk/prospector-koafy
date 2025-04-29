import React from 'react';
import Sidebar from './Sidebar';
import WhatsAppNotifications from '../components/WhatsAppNotifications';
import { WhatsAppProvider } from '../context/WhatsAppContext';

function MainLayout({ children }) {
  return (
    <WhatsAppProvider>
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
        <WhatsAppNotifications />
      </div>
    </WhatsAppProvider>
  );
}

export default MainLayout; 