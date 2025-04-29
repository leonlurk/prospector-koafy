import React from 'react';
import Card from './Card'; // Usar el componente Card base

function OptionCard({ Icon, title, description, onClick, className = '' }) {
  // Icono por defecto si no se proporciona uno
  const DefaultIcon = () => <div className="w-12 h-12 bg-gray-200 rounded-full mb-4"></div>;
  const CardIcon = Icon || DefaultIcon;

  return (
    <Card
      className={`hover:shadow-lg transition-shadow duration-200 cursor-pointer text-center h-full flex flex-col items-center justify-center ${className}`}
      onClick={onClick}
    >
        <CardIcon className="w-12 h-12 mb-4 text-primary" />
        <h3 className="text-lg font-semibold text-text-main mb-2">{title}</h3>
        <p className="text-sm text-text-muted">{description}</p>
    </Card>
  );
}

export default OptionCard; 