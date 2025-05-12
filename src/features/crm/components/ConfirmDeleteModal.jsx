import React from 'react';
import { FaTimes, FaTrashAlt, FaExclamationTriangle } from 'react-icons/fa';

const ConfirmDeleteModal = ({ isOpen, onClose, onConfirm, isLoading, itemName, itemType = "elemento" }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm font-['Poppins']">
      <div className="bg-slate-50 rounded-xl p-6 sm:p-8 w-full max-w-md shadow-2xl transform transition-all">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-slate-800 flex items-center">
            <FaExclamationTriangle className="text-red-500 mr-3" size={24}/> Confirmar Eliminación
          </h2>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-full hover:bg-slate-200"
            disabled={isLoading}
            aria-label="Cerrar modal"
          >
            <FaTimes size={22} />
          </button>
        </div>
        
        <p className="text-slate-600 mb-6">
          ¿Estás seguro de que deseas eliminar {itemType === 'elemento' ? 'el' : 'la'} {itemType} "<strong>{itemName || 'seleccionado'}</strong>"?
          Esta acción no se puede deshacer.
        </p>
        
        <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-200 transition-colors focus:ring-2 focus:ring-slate-400 disabled:opacity-50 w-full sm:w-auto"
            disabled={isLoading}
          >
            Cancelar
          </button>
          <button
            type="button" // Changed from submit to button as it's not in a form
            onClick={onConfirm}
            className={`px-5 py-2.5 rounded-lg text-white font-semibold transition-all shadow-md hover:shadow-lg focus:ring-4 focus:ring-red-300 disabled:opacity-70 disabled:cursor-not-allowed w-full sm:w-auto ${
              isLoading 
                ? "bg-slate-400" 
                : "bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600"
            }`}
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Eliminando...
              </span>
            ) : (
              <span className="flex items-center justify-center">
                <FaTrashAlt className="mr-2" /> Eliminar
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDeleteModal; 