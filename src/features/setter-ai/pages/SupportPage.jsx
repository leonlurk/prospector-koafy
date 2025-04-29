import React from 'react';

// --- Placeholder Icons ---
const LifebuoyIcon = (props) => (
 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
  <path strokeLinecap="round" strokeLinejoin="round" d="M11.35 3.836c-.065.21.166.417.382.417h.532a.75.75 0 00.588-.355l.219-.358c.065-.106.033-.241-.059-.315a4.5 4.5 0 00-5.912 0c-.092.074-.124.209-.059.315l.219.358a.75.75 0 00.588.355h.532c.216 0 .447-.207.382-.417a3.002 3.002 0 015.082-1.688 2.99 2.99 0 014.703 1.024 2.99 2.99 0 01.453 4.145A3 3 0 0119.664 12a3 3 0 01-1.5 2.598 3 3 0 01-4.145.453 2.99 2.99 0 01-1.024 4.703 3 3 0 01-1.688 5.082c-.21-.065-.417.166-.417.382v.532a.75.75 0 00.355.588l.358.219c.106.065.241.033.315-.059a4.5 4.5 0 000-5.912c-.074-.092-.209-.124-.315-.059l-.358.219a.75.75 0 00-.355.588v.532c0 .216-.207.447-.417.382a3.002 3.002 0 01-5.082-1.688 2.99 2.99 0 01-4.703-1.024 2.99 2.99 0 01-.453-4.145A3 3 0 014.336 12a3 3 0 011.5-2.598 3 3 0 014.145-.453 2.99 2.99 0 011.024-4.703 3.002 3.002 0 011.688-5.082zM12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
</svg>
);
const EnvelopeIcon = (props) => (
 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
</svg>
);
const BookOpenIcon = (props) => (
 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
</svg>
);


// --- Main Support Page Component ---
function SupportPage() {
  return (
    <div className="p-6 md:p-8 lg:p-10 max-w-full mx-auto">
      {/* Header */}
      <div className="mb-8 text-center border-b border-gray-200 pb-8">
         <LifebuoyIcon className="w-16 h-16 mx-auto text-indigo-500 mb-4" />
        <h1 className="text-3xl font-semibold text-gray-800">Soporte</h1>
        <p className="mt-2 text-lg text-gray-500">¿Necesitas ayuda? Aquí encontrarás cómo contactarnos y recursos útiles.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        
        {/* Left Column: Contact Options & Docs */}
        <div className="space-y-6">
           {/* Email Support */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center">
             <EnvelopeIcon className="w-10 h-10 mx-auto text-indigo-500 mb-3" />
             <h2 className="text-lg font-medium text-gray-800 mb-1">Soporte por Email</h2>
             <p className="text-sm text-gray-500 mb-4">Envíanos tus preguntas y te responderemos lo antes posible.</p>
             <a href="mailto:soporte@koafy.com" className="inline-block px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition duration-150">
                soporte@koafy.com
             </a>
          </div>

           {/* Documentation Link */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center">
             <BookOpenIcon className="w-10 h-10 mx-auto text-indigo-500 mb-3" />
             <h2 className="text-lg font-medium text-gray-800 mb-1">Documentación</h2>
             <p className="text-sm text-gray-500 mb-4">Encuentra guías, tutoriales y respuestas a preguntas frecuentes.</p>
             <a href="/docs" target="_blank" rel="noopener noreferrer" className="inline-block px-5 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition duration-150">
                Ir a la Documentación
             </a>
             {/* Replace /docs with the actual link */}
          </div>
        </div>

        {/* Right Column: Contact Form Placeholder */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
           <h2 className="text-lg font-medium text-gray-800 mb-4">Enviar un Mensaje</h2>
           <form className="space-y-4">
              <div>
                 <label htmlFor="support-name" className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                 <input type="text" id="support-name" name="name" className="block w-full h-10 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder="Tu nombre"/>
              </div>
               <div>
                 <label htmlFor="support-email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                 <input type="email" id="support-email" name="email" className="block w-full h-10 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder="tu@email.com"/>
              </div>
              <div>
                 <label htmlFor="support-message" className="block text-sm font-medium text-gray-700 mb-1">Mensaje</label>
                 <textarea id="support-message" name="message" rows={5} className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder="Describe tu consulta..."></textarea>
              </div>
               <div className="pt-2">
                  <button type="submit" className="w-full inline-flex justify-center py-2.5 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                    Enviar Mensaje
                  </button>
               </div>
           </form>
        </div>

      </div>
    </div>
  );
}

export default SupportPage; 