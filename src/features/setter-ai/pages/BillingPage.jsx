import React from 'react';

// --- Placeholder Icons ---
const CreditCardIcon = (props) => (
 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
</svg>
);
const ArrowDownTrayIcon = (props) => (
 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
</svg>
);

// --- Main Billing Page Component ---
function BillingPage() {
  
  // Placeholder Data
  const currentPlan = { name: 'Pro', price: '$49/mes', features: ['10 Agentes', '10,000 Mensajes/mes', 'Soporte Prioritario'] };
  const paymentMethod = { type: 'Visa', last4: '4242', expiry: '12/25' };
  const billingHistory = [
    { id: 1, date: '2024-03-01', description: 'Suscripción Pro', amount: '$49.00', status: 'Pagado' },
    { id: 2, date: '2024-02-01', description: 'Suscripción Pro', amount: '$49.00', status: 'Pagado' },
    { id: 3, date: '2024-01-01', description: 'Suscripción Pro', amount: '$49.00', status: 'Pagado' },
  ];

  const getStatusBadgeClass = (status) => {
    switch (status.toLowerCase()) {
      case 'pagado': return 'bg-green-100 text-green-800';
      case 'pendiente': return 'bg-yellow-100 text-yellow-800';
      case 'fallido': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 md:p-8 lg:p-10 max-w-full mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-800">Facturación</h1>
        <p className="mt-1 text-sm text-gray-500">Gestiona tu plan, método de pago e historial de facturas.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Plan & Payment Method */}
        <div className="lg:col-span-1 space-y-8">
          {/* Current Plan Card */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Plan Actual</h2>
            <div className="mb-4">
              <p className="text-3xl font-bold text-indigo-600">{currentPlan.name}</p>
              <p className="text-sm text-gray-500">{currentPlan.price}</p>
            </div>
            <ul className="space-y-2 text-sm text-gray-600 mb-5">
              {currentPlan.features.map((feature, index) => (
                <li key={index} className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-green-500 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                  {feature}
                </li>
              ))}
            </ul>
            <button className="w-full text-center px-4 py-2 border border-indigo-600 text-indigo-600 rounded-lg text-sm font-medium hover:bg-indigo-50 transition duration-150">
              Cambiar Plan
            </button>
          </div>

          {/* Payment Method Card */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Método de Pago</h2>
            <div className="flex items-center mb-4">
              <CreditCardIcon className="w-8 h-8 mr-4 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-700">{paymentMethod.type} terminada en {paymentMethod.last4}</p>
                <p className="text-xs text-gray-500">Expira {paymentMethod.expiry}</p>
              </div>
            </div>
            <button className="w-full text-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition duration-150">
              Actualizar Método de Pago
            </button>
          </div>
        </div>

        {/* Right Column: Billing History */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
            <h2 className="text-lg font-semibold text-gray-800 p-6 border-b border-gray-200">Historial de Facturación</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descripción</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Factura</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {billingHistory.map((item) => (
                    <tr key={item.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.date}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.description}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.amount}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                         <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(item.status)}`}>
                            {item.status}
                         </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                         <button className="text-indigo-600 hover:text-indigo-800 hover:underline inline-flex items-center">
                            <ArrowDownTrayIcon className="w-4 h-4 mr-1" />
                            Descargar
                         </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
             {/* Optional: Add pagination if history is long */}
             {/* <div className="p-4 border-t border-gray-200">Pagination controls</div> */}
          </div>
        </div>
      </div>
    </div>
  );
}

export default BillingPage; 