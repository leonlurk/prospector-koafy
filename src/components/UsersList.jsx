import React from 'react';
import PropTypes from 'prop-types';

/**
 * Componente que muestra una lista de usuarios con opciones para eliminarlos 
 * y seguirlos, además de mostrar información sobre los usuarios en blacklist.
 * Incluye integración con WhitelistSelector
 */
const UsersList = ({ 
  users, 
  removeUser, 
  filteredUsers, 
  setShowBlacklist, 
  followAllUsers, 
  loading,
  user,
  db,
  setShowWhitelistModal
}) => {
  return (
    <div className="w-1/3 p-4 border-r">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-black text-lg">Usuarios Obtenidos ({users.length})</h3>
        <div className="flex space-x-2">
        <button 
          className="text-sm flex items-center text-white bg-black px-3 py-1.5 rounded-md"
          onClick={() => {
            if (users.length === 0) {
              alert("No hay usuarios para agregar a whitelist");
              return;
            }
            setShowWhitelistModal(true);
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
          </svg>
          Whitelist
        </button>
          {filteredUsers && filteredUsers.blacklistedCount > 0 && (
            <button 
              className="text-sm flex items-center text-black bg-gray-200 px-3 py-1.5 rounded-md"
              onClick={() => setShowBlacklist(true)}
            >
              Blacklist
            </button>
          )}
        </div>
      </div>
      
      <div className="h-64 overflow-y-auto pr-2">
        {users.map((username, index) => (
          <div key={index} className="flex justify-between items-center py-2 px-3 hover:bg-gray-100 rounded-lg">
            <span className="text-gray-800">{username}</span>
            <button 
              className="bg-transparent"
              onClick={() => removeUser(username)}
              aria-label={`Eliminar ${username}`}
            >
              <img src="/assets/trash.png" alt="Trash" className="w-6 h-6 text-white" />
            </button>
          </div>
        ))}
        
        {users.length === 0 && (
          <div className="text-center text-gray-500 py-4">
            No hay usuarios disponibles
          </div>
        )}
      </div>

      {/* Contador de usuarios filtrados por blacklist */}
      {filteredUsers && filteredUsers.blacklistedCount > 0 && (
        <div className="mt-2 text-xs text-gray-500">
          <span className="font-semibold text-red-500">{filteredUsers.blacklistedCount}</span> usuarios en lista negra no se mostrarán.
          <button 
            className="text-blue-500 hover:text-blue-700 ml-1 underline text-xs"
            onClick={() => setShowBlacklist(true)}
          >
            Ver detalles
          </button>
        </div>
      )}
      
      {/* Botón de seguir (solo si la opción está habilitada) */}
      {followAllUsers && (
        <button 
          className="w-full bg-gray-900 text-white rounded-full py-3 mt-3 font-medium hover:bg-black transition-colors"
          onClick={followAllUsers}
          disabled={loading || users.length === 0}
        >
          {loading ? "Procesando..." : "Seguir a todos"}
        </button>
      )}
    </div>
  );
};

UsersList.propTypes = {
  users: PropTypes.array.isRequired,
  removeUser: PropTypes.func.isRequired,
  filteredUsers: PropTypes.object,
  setShowBlacklist: PropTypes.func.isRequired,
  followAllUsers: PropTypes.func,
  loading: PropTypes.bool.isRequired,
  user: PropTypes.object,
  db: PropTypes.object,
  setShowWhitelistModal: PropTypes.func
};

export default UsersList;