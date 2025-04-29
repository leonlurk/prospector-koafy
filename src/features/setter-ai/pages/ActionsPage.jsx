import React, { useState } from 'react';

// --- Placeholder Icons ---
const BoltIcon = (props) => (
 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
</svg>
);

const PlusIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
);

// --- Main Component ---
function ActionsPage() {
  // Placeholder state for actions list (replace with actual data fetching)
  const [actions, setActions] = useState([]); 

  const handleAddAction = () => {
    console.log("Add New Action clicked");
    // TODO: Implement logic to open a modal or navigate to an action creation form
  };

  return (
    // Using the parent container's padding/background from AgentDetailPage
    <div className="space-y-6">
       {/* Header */}
       <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Acciones</h2>
            <p className="text-sm text-gray-500 mt-1">
              Define acciones específicas que tu agente puede realizar (APIs, funciones personalizadas).
            </p>
          </div>
          <button 
             onClick={handleAddAction}
             className="inline-flex items-center justify-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition duration-150 shadow-sm"
           >
             <PlusIcon className="w-5 h-5 mr-2 -ml-1" />
             Añadir Acción
           </button>
       </div>

       {/* Actions List Area */}
       <div className="bg-white rounded-lg border border-gray-200 min-h-[20rem] flex items-center justify-center">
         {actions.length === 0 ? (
             // Empty state placeholder
             <div className="text-center py-12 px-6">
                 <BoltIcon className="mx-auto h-10 w-10 text-gray-400" />
                 <h3 className="mt-2 text-base font-medium text-gray-700">Sin acciones definidas</h3>
                 <p className="mt-1 text-sm text-gray-500">Empieza añadiendo la primera acción para tu agente.</p>
                 <div className="mt-6">
                   <button 
                       onClick={handleAddAction}
                       className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                   >
                     <PlusIcon className="w-5 h-5 mr-2 -ml-1" />
                     Añadir Nueva Acción
                   </button>
                 </div>
             </div>
         ) : (
             // TODO: Render the list of defined actions here
             // Example: actions.map(action => <ActionItem key={action.id} action={action} />)
             <p className="text-gray-500">Lista de acciones iría aquí...</p>
         )}
       </div>
       
    </div>
  );
}
export default ActionsPage; 