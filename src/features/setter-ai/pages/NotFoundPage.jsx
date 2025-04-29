import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/Button';

function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
       <h1 className="text-6xl font-bold text-primary mb-4">404</h1>
       <h2 className="text-3xl font-semibold text-text-main mb-4">Página No Encontrada</h2>
       <p className="text-text-muted mb-8">Lo sentimos, la página que buscas no existe o ha sido movida.</p>
       <Link to="/agents"> {/* Cambiar a / si tienes un dashboard */}
         <Button>Volver a Mis Agentes</Button>
       </Link>
    </div>
  );
}
export default NotFoundPage; 