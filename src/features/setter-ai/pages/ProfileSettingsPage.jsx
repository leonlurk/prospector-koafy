import React from 'react';

// --- Placeholder Icons ---
const UserCircleIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);
const LockClosedIcon = (props) => (
 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
</svg>
);
const ArrowRightOnRectangleIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
  </svg>
);

// --- Main Settings Page Component ---
function ProfileSettingsPage() {
    // Placeholder Handlers
    const handleSaveProfile = (e) => { e.preventDefault(); console.log("Saving profile..."); };
    const handleSavePassword = (e) => { e.preventDefault(); console.log("Saving password..."); };
    const handleLogout = () => console.log("Logging out...");
    const handleManageSubscription = () => console.log("Managing subscription...");

    // Placeholder user data
    const userData = { name: 'Usuario Ejemplo', email: 'usuario@koafy.com' };

    return (
        <div className="p-6 md:p-8 lg:p-10 max-w-full mx-auto">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-semibold text-gray-800">Configuración de Cuenta</h1>
                <p className="mt-1 text-sm text-gray-500">Gestiona tu información personal, seguridad y suscripción.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                {/* Left Column: Profile & Password */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Profile Information Card */}
                    <form onSubmit={handleSaveProfile} className="bg-white rounded-xl shadow-md border border-gray-100">
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                               <UserCircleIcon className="w-6 h-6 mr-2 text-indigo-500" />
                               Información del Perfil
                            </h2>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
                                <input type="text" id="fullName" name="fullName" defaultValue={userData.name} className="block w-full h-10 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder="Tu nombre" />
                            </div>
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
                                <input type="email" id="email" name="email" defaultValue={userData.email} className="block w-full h-10 px-3 border border-gray-300 rounded-md shadow-sm bg-gray-50 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder="tu@email.com" readOnly />
                                <p className="mt-1 text-xs text-gray-500">El correo electrónico no se puede cambiar.</p>
                            </div>
                        </div>
                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end rounded-b-xl">
                            <button type="submit" className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                                Guardar Perfil
                            </button>
                        </div>
                    </form>

                    {/* Change Password Card */}
                    <form onSubmit={handleSavePassword} className="bg-white rounded-xl shadow-md border border-gray-100">
                        <div className="p-6 border-b border-gray-200">
                             <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                               <LockClosedIcon className="w-6 h-6 mr-2 text-indigo-500" />
                               Cambiar Contraseña
                            </h2>
                        </div>
                         <div className="p-6 space-y-4">
                             <div>
                                <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">Contraseña Actual</label>
                                <input type="password" id="currentPassword" name="currentPassword" className="block w-full h-10 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" required />
                             </div>
                              <div>
                                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">Nueva Contraseña</label>
                                <input type="password" id="newPassword" name="newPassword" className="block w-full h-10 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" required />
                             </div>
                             <div>
                                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">Confirmar Nueva Contraseña</label>
                                <input type="password" id="confirmPassword" name="confirmPassword" className="block w-full h-10 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" required />
                             </div>
                         </div>
                         <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end rounded-b-xl">
                             <button type="submit" className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                                 Actualizar Contraseña
                             </button>
                         </div>
                    </form>
                </div>

                {/* Right Column: Plan & Logout */}
                <div className="lg:col-span-1 space-y-8">
                     {/* Subscription Card Placeholder */}
                     <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
                          <h2 className="text-lg font-semibold text-gray-800 mb-3">Plan y Facturación</h2>
                          <p className='text-sm text-gray-600 mb-1'>Plan Actual: <span className='font-medium text-indigo-600'>Pro</span></p>
                           <p className='text-sm text-gray-500 mb-4'>Gestiona tu suscripción y revisa tu historial de facturas.</p>
                            <button onClick={handleManageSubscription} className="w-full text-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition duration-150">
                                Administrar Suscripción
                            </button>
                     </div>
                      
                     {/* Logout Card */}
                     <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
                          <h2 className="text-lg font-semibold text-gray-800 mb-3">Cerrar Sesión</h2>
                          <p className='text-sm text-gray-500 mb-4'>Finaliza tu sesión actual en este dispositivo.</p>
                           <button onClick={handleLogout} className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
                               <ArrowRightOnRectangleIcon className="w-5 h-5 mr-2" />
                               Cerrar Sesión
                           </button>
                     </div>
                </div>
            </div>
        </div>
    );
}
export default ProfileSettingsPage; 