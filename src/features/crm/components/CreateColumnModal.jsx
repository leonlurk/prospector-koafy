import React, { useState, useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';

const stageTypeOptions = [
  { value: '', label: 'Seleccionar tipo (Opcional)' },
  { value: 'prospecting', label: 'Prospecting (Prospección)' },
  { value: 'contacted', label: 'Contacted (Contactado)' },
  { value: 'qualified', label: 'Qualified (Calificado)' },
  { value: 'proposal', label: 'Proposal Sent (Propuesta Enviada)' },
  { value: 'negotiation', label: 'Negotiation (Negociación)' },
  { value: 'won', label: 'Won (Ganado)' },
  { value: 'lost', label: 'Lost (Perdido)' },
  { value: 'on-hold', label: 'On Hold (En Espera)' },
  { value: 'nurturing', label: 'Nurturing (Nutrición)' },
  { value: 'bad-fit', label: 'Bad Fit (No Encaja)' },
  { value: 'other', label: 'Other (Otro)' },
];

const CreateColumnModal = ({ isOpen, onClose, onSubmit, isLoading, boardName }) => {
  const [columnName, setColumnName] = useState('');
  const [stageType, setStageType] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setColumnName('');
      setStageType('');
    }
  }, [isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (columnName.trim()) {
      onSubmit(columnName.trim(), stageType || null);
    } else {
      console.warn('CreateColumnModal - Nombre de la columna vacío');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm font-['Poppins']">
      <div className="bg-slate-50 rounded-xl p-6 sm:p-8 w-full max-w-lg shadow-2xl transform transition-all">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-2xl font-bold text-slate-800">Añadir Nueva Columna</h2>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-full hover:bg-slate-200"
            disabled={isLoading}
            aria-label="Cerrar modal"
          >
            <FaTimes size={22} />
          </button>
        </div>
        {boardName && <p className="text-sm text-slate-500 mb-6">Al tablero: <span className='font-semibold text-slate-700'>{boardName}</span></p>}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label 
                htmlFor="columnName" 
                className="block text-sm font-medium text-slate-700 mb-1.5"
            >
              Nombre de la Columna
            </label>
            <input 
              type="text" 
              id="columnName"
              value={columnName}
              onChange={(e) => setColumnName(e.target.value)}
              className="w-full p-3 bg-white border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition"
              placeholder="Ej: Contactados, Propuesta Enviada"
              required
              disabled={isLoading}
              autoFocus
            />
          </div>

          <div>
            <label 
                htmlFor="stageType" 
                className="block text-sm font-medium text-slate-700 mb-1.5"
            >
              Tipo de Etapa (Para Estadísticas)
            </label>
            <select
              id="stageType"
              value={stageType}
              onChange={(e) => setStageType(e.target.value)}
              disabled={isLoading}
              className="w-full p-3 bg-white border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition appearance-none"
            >
              {stageTypeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className='text-xs text-slate-500 mt-1'>Seleccionar un tipo ayuda a generar estadísticas más precisas.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3 pt-2">
            <button 
              type="button" 
              onClick={onClose} 
              disabled={isLoading}
              className="px-5 py-2.5 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-200 transition-colors focus:ring-2 focus:ring-slate-400 disabled:opacity-50 w-full sm:w-auto"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={isLoading || !columnName.trim()}
              className={`px-5 py-2.5 rounded-lg text-white font-semibold transition-all shadow-md hover:shadow-lg focus:ring-4 focus:ring-purple-300 disabled:opacity-70 disabled:cursor-not-allowed w-full sm:w-auto ${
                isLoading 
                  ? "bg-slate-400" 
                  : "bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600"
              }`}
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creando...
                </span>
              ) : (
                'Añadir Columna'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateColumnModal; 