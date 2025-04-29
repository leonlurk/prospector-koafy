import React, { useState, useEffect } from 'react';
// Import API functions
import { getRules, addRule, deleteRule } from '../services/api'; 

// --- Reused Placeholder Icons (Similar to AgentListPage) ---
const SearchIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
  </svg>
);

const ChevronDownIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
  </svg>
);

const UserGroupIcon = (props) => ( // Icon used for "Cargar perfiles" button
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.008-2.72c.065-.916.343-1.797.788-2.596l.088-.114m-4.056 2.72a3 3 0 00-4.682 2.72m0 0a3 3 0 00-4.682-2.72m2.943-2.72a3 3 0 014.682 0m0 0a3 3 0 01-.479 3.741M12 12a3 3 0 11-6 0 3 3 0 016 0zM14.25 9a3 3 0 11-6 0 3 3 0 016 0zM4.5 19.5a3 3 0 00-3-3v-1.5a3 3 0 003 3h1.5a3 3 0 003-3v-1.5a3 3 0 00-3-3H4.5m6.75 6a3 3 0 01-3-3v-1.5a3 3 0 013-3h1.5a3 3 0 013 3v1.5a3 3 0 01-3 3h-1.5zm5.25 3.75a3 3 0 00-3-3v-1.5a3 3 0 003-3h1.5a3 3 0 003 3v1.5a3 3 0 00-3 3h-1.5z" />
  </svg>
);

const AdjustmentsHorizontalIcon = (props) => ( // Icon for profile actions
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
  </svg>
);

// Placeholder Instagram Icon (simplified)
const InstagramIcon = (props) => (
    <svg {...props} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.27.058 2.16.245 2.938.551.848.324 1.556.773 2.257 1.474.699.702 1.149 1.41 1.473 2.258.307.778.494 1.669.551 2.939.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.058 1.27-.245 2.16-.551 2.938-.324.848-.773 1.556-1.474 2.257-.702.699-1.41 1.149-2.258 1.473-.778.307-1.669.494-2.939.551-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.27-.058-2.16-.245-2.938-.551-.848-.324-1.556-.773-2.257-1.474-.699-.702-1.149-1.41-1.473-2.258-.307-.778-.494-1.669-.551-2.939-.058-1.266-.07-1.646-.07-4.85s.012-3.584.07-4.85c.058-1.27.245-2.16.551-2.938.324-.848.773-1.556 1.474-2.257.702-.699 1.41-1.149 2.258-1.473.778-.307 1.669-.494 2.939-.551A48.321 48.321 0 0112 2.163zm0 1.646c-3.197 0-3.575.012-4.81.07-1.16.052-1.81.213-2.307.405-.58.225-1.03.507-1.487.963-.458.458-.739.908-.964 1.488-.192.497-.353 1.147-.405 2.307-.057 1.235-.07 1.613-.07 4.81s.012 3.575.07 4.81c.052 1.16.213 1.81.405 2.307.225.58.507 1.03.964 1.487.457.458.907.739 1.487.964.497.192 1.147.353 2.307.405 1.235.057 1.613.07 4.81.07s3.575-.012 4.81-.07c1.16-.052 1.81-.213 2.307-.405.58-.225 1.03-.507 1.487-.964.458-.457.739-.907.964-1.487.192-.497.353-1.147.405-2.307.057-1.235.07-1.613.07-4.81s-.012-3.575-.07-4.81c-.052-1.16-.213-1.81-.405-2.307-.225-.58-.507-1.03-.964-1.487-.457-.458-.907-.739-1.487-.964-.497-.192-1.147-.353-2.307-.405C15.575 3.821 15.197 3.809 12 3.809zM12 7.188c-2.648 0-4.812 2.164-4.812 4.812s2.164 4.812 4.812 4.812 4.812-2.164 4.812-4.812-2.164-4.812-4.812-4.812zm0 7.978c-1.752 0-3.166-1.414-3.166-3.166s1.414-3.166 3.166-3.166 3.166 1.414 3.166 3.166-1.414 3.166-3.166 3.166zm4.406-7.08c-.61 0-1.104.494-1.104 1.104s.494 1.104 1.104 1.104 1.104-.494 1.104-1.104-.494-1.104-1.104-1.104z"/>
    </svg>
);


// --- Placeholder Profile Data ---
const placeholderProfiles = [
  { id: '1', name: 'Carolina Pineda', handle: '@carolina.blog', platform: 'instagram', avatar: '/profile-placeholder.jpg' },
  { id: '2', name: 'Carolina Pineda', handle: '@carolina.blog', platform: 'instagram', avatar: '/profile-placeholder.jpg' },
  { id: '3', name: 'Carolina Pineda', handle: '@carolina.blog', platform: 'instagram', avatar: '/profile-placeholder.jpg' },
  { id: '4', name: 'Carolina Pineda', handle: '@carolina.blog', platform: 'instagram', avatar: '/profile-placeholder.jpg' },
  // Add more placeholder profiles if needed
];

// --- Main Component ---
function BlackListPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('all');
  const [profiles, setProfiles] = useState([]); // Start empty, then fill
  const [isLoading, setIsLoading] = useState(true); // Simulate loading
  const [error, setError] = useState(null);

  // Simulate fetching data on mount
  useEffect(() => {
    setIsLoading(true);
    setError(null);
    // Simulate API call delay
    const timer = setTimeout(() => {
      try {
        // In a real scenario, fetch data from an API here
        setProfiles(placeholderProfiles);
        setIsLoading(false);
      } catch (err) {
        console.error("Error loading profiles (simulated):", err);
        setError("No se pudieron cargar los perfiles.");
        setIsLoading(false);
      }
    }, 1000); // 1 second delay

    return () => clearTimeout(timer); // Cleanup timer on unmount
  }, []);

  // Filter logic (dynamic but not functional backend yet)
  const filteredProfiles = profiles.filter(profile => {
    const termMatch = searchTerm === '' ||
                      profile.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      profile.handle.toLowerCase().includes(searchTerm.toLowerCase());
    const platformMatch = selectedPlatform === 'all' || profile.platform === selectedPlatform;
    return termMatch && platformMatch;
  });

  // --- Handlers (Non-functional placeholders) ---
  const handleLoadProfiles = () => {
    console.log("Attempting to load profiles...");
    // Add actual API call or logic here in the future
  };

  const handleProfileSettings = (profileId) => {
    console.log("Opening settings for profile:", profileId);
    // Add navigation or modal logic here in the future
  };

  // --- Render Logic ---
  return (
    <div className="p-6 md:p-8 lg:p-10 max-w-full mx-auto bg-[#F4F5FA]"> {/* Background color from image */}

      {/* Header with Search, Filter, and Load Button */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
        {/* Search Input */}
        <div className="relative w-full md:w-1/2 lg:w-1/3">
          <input
            type="text"
            placeholder="Buscar Perfil"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-12 pl-12 pr-4 border border-gray-200 rounded-full bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 text-sm shadow-sm" // Rounded-full like image
          />
          <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        </div>

        {/* Filter and Load Profiles Button */}
        <div className="flex items-center gap-4 w-full md:w-auto">
          {/* Platform Select */}
          <div className="relative">
            <select
              value={selectedPlatform}
              onChange={(e) => setSelectedPlatform(e.target.value)}
              className="appearance-none h-12 w-full md:w-auto pl-4 pr-10 border border-gray-200 rounded-full bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 text-sm shadow-sm" // Rounded-full like image
            >
              <option value="all">Plataformas</option>
              <option value="instagram">Instagram</option>
              <option value="whatsapp">WhatsApp</option>
              {/* Add other platforms if needed */}
            </select>
            <ChevronDownIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          </div>

          {/* Load Profiles Button */}
          <button
            onClick={handleLoadProfiles}
            disabled={isLoading} // Disable while loading initial data
            className="flex items-center justify-center h-12 px-6 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-full shadow-sm transition duration-150 text-sm font-medium whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed" // Style from image
          >
            <UserGroupIcon className="w-5 h-5 mr-2 text-gray-500" />
            Cargar perfiles
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 rounded-md bg-red-50 p-4 border border-red-200">
          <p className="text-sm font-medium text-red-800">Error: {error}</p>
        </div>
      )}

      {/* Profile List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-10"><p className="text-gray-500">Cargando perfiles...</p></div>
        ) : filteredProfiles.length > 0 ? (
          filteredProfiles.map((profile) => (
            <div key={profile.id} className="bg-white rounded-xl shadow-sm p-5 flex items-center justify-between space-x-4 border border-gray-100 hover:shadow-md transition-shadow duration-200">
              {/* Left side: Avatar and Info */}
              <div className="flex items-center space-x-4 flex-grow">
                <div className="relative shrink-0">
                  <img
                    src={profile.avatar}
                    alt={profile.name}
                    className="w-12 h-12 rounded-full object-cover border border-gray-200"
                    // Simple placeholder handling
                    onError={(e) => { e.target.onerror = null; e.target.src = '/logoBlanco.png'; }}
                  />
                  {/* Platform Icon Overlay */}
                  {profile.platform === 'instagram' && (
                    <span className="absolute -bottom-1 -right-1 block p-0.5 rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 ring-2 ring-white" title="Instagram">
                       <InstagramIcon className="w-3 h-3 text-white" />
                    </span>
                  )}
                  {/* Add other platform icons here (e.g., WhatsApp) */}
                </div>
                <div>
                  <p className="text-base font-semibold text-gray-800">{profile.name}</p>
                  <p className="text-sm text-gray-500">{profile.handle}</p>
                </div>
              </div>

              {/* Right side: Action Button */}
              <div className="shrink-0">
                <button
                  onClick={() => handleProfileSettings(profile.id)}
                  className="text-gray-400 hover:text-indigo-600 p-2 rounded-full transition duration-150"
                  aria-label="Configurar Perfil"
                  title="Configurar Perfil"
                >
                  <AdjustmentsHorizontalIcon className="w-6 h-6" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-16">
             <UserGroupIcon className="mx-auto h-12 w-12 text-gray-300 mb-3" />
            <p className="text-gray-500 text-sm">
              {searchTerm ? 'No se encontraron perfiles que coincidan con tu búsqueda.' : 'No hay perfiles para mostrar.'}
            </p>
            {!searchTerm && <p className="text-gray-400 text-xs mt-1">Intenta cargar perfiles si aún no lo has hecho.</p>}
          </div>
        )}
      </div>
    </div>
  );
}

export default BlackListPage; 