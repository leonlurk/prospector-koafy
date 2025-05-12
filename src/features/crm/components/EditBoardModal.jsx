import React, { useState, useEffect } from "react";
import { FaTimes, FaSave } from 'react-icons/fa';

const EditBoardModal = ({ isOpen, onClose, onSubmit, isLoading, board }) => {
  const [boardName, setBoardName] = useState("");

  useEffect(() => {
    if (isOpen && board) {
      setBoardName(board.name);
    } else if (!isOpen) {
      setBoardName(""); // Reset when closing
    }
  }, [isOpen, board]);

  const handleInputChange = (e) => {
    setBoardName(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (boardName.trim() && boardName.trim() !== board.name) {
      onSubmit(board.id, boardName.trim());
    } else if (boardName.trim() === board.name) {
      onClose(); // No change, just close
    } else {
      // Handle empty name error - ideally with a more visual cue
      console.warn("EditBoardModal - Nombre del tablero no puede estar vacío");
    }
  };

  if (!isOpen || !board) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm font-['Poppins']">
      <div className="bg-slate-50 rounded-xl p-6 sm:p-8 w-full max-w-lg shadow-2xl transform transition-all">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-800">Editar Nombre del Tablero</h2>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-full hover:bg-slate-200"
            disabled={isLoading}
            aria-label="Cerrar modal"
          >
            <FaTimes size={22} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label 
              htmlFor="editBoardName" 
              className="block text-sm font-medium text-slate-700 mb-1.5"
            >
              Nuevo nombre del Tablero
            </label>
            <input
              type="text"
              id="editBoardName"
              value={boardName}
              onChange={handleInputChange}
              placeholder="Ej: Leads Actualizados"
              className="w-full p-3 bg-white border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition"
              autoFocus
              disabled={isLoading}
            />
          </div>
          
          {/* {errorMessage && ( // If you pass an errorMessage prop
            <div className="p-3 bg-red-50 border-l-4 border-red-400 text-red-700 rounded-md text-sm">
              <p><span className="font-medium">Error:</span> {errorMessage}</p>
            </div>
          )} */}
          
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
              type="submit"
              className={`px-5 py-2.5 rounded-lg text-white font-semibold transition-all shadow-md hover:shadow-lg focus:ring-4 focus:ring-purple-300 disabled:opacity-70 disabled:cursor-not-allowed w-full sm:w-auto ${
                isLoading 
                  ? "bg-slate-400" 
                  : "bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600" // Different color for save
              }`}
              disabled={isLoading || !boardName.trim() || boardName.trim() === board.name}
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Guardando...
                </span>
              ) : (
                <span className="flex items-center justify-center">
                  <FaSave className="mr-2" /> Guardar Cambios
                </span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditBoardModal; 