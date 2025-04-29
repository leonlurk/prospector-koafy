import React from 'react';
import Card from '../components/Card';

function AnalyticsPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-text-main mb-8">Analíticas</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         <Card title="Conversaciones Totales">
           <p className="text-4xl font-bold text-primary">1,234</p>
           <p className="text-sm text-text-muted">Últimos 30 días</p>
         </Card>
         <Card title="Tasa de Resolución">
            <p className="text-4xl font-bold text-primary">85%</p>
            <p className="text-sm text-text-muted">Promedio</p>
         </Card>
         <Card title="Agentes Más Activos">
            <ul className="text-sm text-text-main list-disc list-inside">
                <li>Asistente de Ventas</li>
                <li>Agente Inmobiliario</li>
            </ul>
         </Card>
         {/* Añadir más tarjetas o gráficos */}
         <Card className="md:col-span-2 lg:col-span-3" title="Gráfico de Conversaciones por Día">
             <div className="h-64 bg-gray-100 flex items-center justify-center rounded">
                <p className="text-text-muted">(Placeholder para gráfico)</p>
             </div>
         </Card>
      </div>
    </div>
  );
}
export default AnalyticsPage; 