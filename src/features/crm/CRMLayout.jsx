import React from 'react';
import { Outlet } from 'react-router-dom';

const CRMLayout = () => {
  return (
    <div className="flex-1 p-4 md:p-6 lg:p-8 bg-gray-100 dark:bg-gray-900 overflow-y-auto">
      {/* Puedes añadir un encabezado o navegación específica para el CRM aquí si es necesario */}
      {/* <h1 className="text-2xl font-semibold text-gray-800 dark:text-white mb-6">CRM Whatsapp</h1> */}
      <Outlet /> {/* Las sub-rutas del CRM se renderizarán aquí */}
    </div>
  );
};

export default CRMLayout; 