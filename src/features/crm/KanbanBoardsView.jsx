import React, { useState, useEffect, useCallback } from 'react';
import { FaPlus, FaEye, FaEdit, FaTrash, FaFilter, FaThList, FaThLarge, FaSpinner, FaCheck, FaTimes, FaExclamationTriangle, FaInfo, FaColumns, FaUser, FaPencilAlt, FaTimesCircle, FaTrashAlt as FaColumnTrash } from 'react-icons/fa';
// Importar @hello-pangea/dnd
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

import {
    getUserKanbanBoards,
    createKanbanBoard,
    getKanbanBoardDetails,
    updateKanbanBoard,
    deleteKanbanBoard,
    createKanbanColumn,
    updateKanbanColumn,
    deleteKanbanColumn,
    assignChatToKanbanColumn,
    getKanbanBoardColumnsOnly, // Mantener por si se usa en la lógica de error de índice
    getChatMessages
} from '../../api'; 
import { useAuth } from '../../context/AuthContext'; 
import CreateBoardModal from './components/CreateBoardModal'; 
import CreateColumnModal from './components/CreateColumnModal';
import EditBoardModal from './components/EditBoardModal';
import ConfirmDeleteModal from './components/ConfirmDeleteModal';
import EditColumnModal from './components/EditColumnModal';

// --- Componente para la Tarjeta de Chat ---
const ChatCard = ({ chat, onUnassign }) => (
  <div className="bg-white dark:bg-slate-700 p-3.5 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 ease-in-out flex items-start space-x-3 cursor-pointer group relative">
    <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-400 rounded-full flex items-center justify-center text-white shadow">
      <FaUser size={18}/> 
      </div>
      <div className="flex-grow min-w-0">
      <p className="font-semibold text-slate-800 dark:text-slate-100 truncate text-sm leading-tight">
        {chat.contactDisplayName || chat.contactName || chat.chatId}
      </p>
      <p className="text-xs text-slate-500 dark:text-slate-300 truncate mt-1">
        {chat.lastMessageContent || 'No hay mensajes recientes'}
      </p>
      </div>
    {onUnassign && (
      <button 
        onClick={(e) => { e.stopPropagation(); onUnassign(chat.chatId || chat.id); }}
        className="absolute top-1 right-1 p-1 rounded-full text-slate-400 hover:text-red-500 hover:bg-red-100 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
        title="Desasignar chat de esta columna"
      >
        <FaTimesCircle size={16}/>
      </button>
    )}
    </div>
);

const KanbanBoardsView = () => {
  const { currentUser, authToken } = useAuth();
  
  useEffect(() => {
    console.log("KanbanBoardsView - Montado", { 
      userPresente: !!currentUser,
      userId: currentUser?.uid,
      tokenPresente: !!authToken,
      tokenTamaño: authToken ? authToken.length : 0
    });
    
    if (!authToken) {
      const tokenCheckInterval = setInterval(() => {
        if (authToken) {
          console.log("KanbanBoardsView - Token disponible después de espera", { tokenTamaño: authToken.length });
          clearInterval(tokenCheckInterval);
        } else {
          console.log("KanbanBoardsView - Esperando token...");
        }
      }, 2000);
      return () => clearInterval(tokenCheckInterval);
    }
  }, [currentUser, authToken]);

  const userId = currentUser?.uid;

  const [boards, setBoards] = useState([]);
  const [selectedBoard, setSelectedBoard] = useState(null);
  const [boardDetails, setBoardDetails] = useState(null); 
  const [columnsState, setColumnsState] = useState({}); 
  // activeId and activeChat ya no son necesarios

  const [viewMessagesModal, setViewMessagesModal] = useState({
    isOpen: false,
    chat: null, 
    messages: [],
    isLoading: false,
    error: null
  });

  const [isLoadingBoards, setIsLoadingBoards] = useState(false);
  const [isLoadingBoardDetails, setIsLoadingBoardDetails] = useState(false);
  const [isCreatingBoard, setIsCreatingBoard] = useState(false); 
  const [isUpdatingBoard, setIsUpdatingBoard] = useState(false);
  const [isDeletingBoard, setIsDeletingBoard] = useState(false);
  const [isCreatingColumn, setIsCreatingColumn] = useState(false); 
  const [isUpdatingColumn, setIsUpdatingColumn] = useState(false);
  const [isDeletingColumn, setIsDeletingColumn] = useState(false);
  const [error, setError] = useState(null);
  const [isCreateBoardModalOpen, setIsCreateBoardModalOpen] = useState(false);
  const [isEditBoardModalOpen, setIsEditBoardModalOpen] = useState(false);
  const [isDeleteBoardModalOpen, setIsDeleteBoardModalOpen] = useState(false);
  const [boardToEdit, setBoardToEdit] = useState(null);
  const [boardToDelete, setBoardToDelete] = useState(null);
  const [isCreateColumnModalOpen, setIsCreateColumnModalOpen] = useState(false);
  const [isEditColumnModalOpen, setIsEditColumnModalOpen] = useState(false);
  const [columnToEdit, setColumnToEdit] = useState(null);
  const [isDeleteColumnModalOpen, setIsDeleteColumnModalOpen] = useState(false);
  const [columnToDelete, setColumnToDelete] = useState(null);
  const [notification, setNotification] = useState({ show: false, message: "", type: "" });
  
  // Sensores de @dnd-kit ya no son necesarios

  const showNotificationFunc = useCallback((message, type = "info") => {
    console.log(`Mostrando notificación: ${message} (${type})`);
    setNotification({ show: true, message, type });
    const timeout = type === "error" ? 5000 : type === "warning" ? 4000 : 3000;
    setTimeout(() => {
      setNotification({ show: false, message: "", type: "" });
    }, timeout);
  }, []);

  const fetchBoards = useCallback(async () => {
    if (!userId || !authToken) return;
    setIsLoadingBoards(true);
    setError(null);
    try {
      const response = await getUserKanbanBoards(userId, authToken);
      if (response.success) {
        setBoards(response.data || []);
      } else {
        setError(response.message || 'Error al cargar los tableros.');
        setBoards([]);
      }
    } catch (err) {
      setError(err.message || 'Ocurrió un error al contactar el servidor para tableros.');
      setBoards([]);
    }
    setIsLoadingBoards(false);
  }, [userId, authToken]);

  useEffect(() => {
    if (userId && authToken) { 
        fetchBoards();
    }
  }, [fetchBoards, userId, authToken]); 

  const fetchBoardDetailsData = useCallback(async (boardId) => {
    if (!userId || !authToken || !boardId) return;
    setIsLoadingBoardDetails(true);
    setError(null);
    setBoardDetails(null); 
    setColumnsState({}); 
    try {
      const response = await getKanbanBoardDetails(userId, boardId, authToken);
      console.log("Respuesta de getKanbanBoardDetails:", response);
      
      if (response.success) {
        setBoardDetails(response); 
        const initialColumns = {};
        (response.columns || []).forEach(col => {
            initialColumns[col.id] = { ...col, chats: col.chats || [] };
        });
        if (response.unassignedInBoardChats && response.unassignedInBoardChats.length > 0) {
             initialColumns['unassigned'] = { 
                 id: 'unassigned', 
                 name: 'Chats sin Columna (en este tablero)', 
                 chats: response.unassignedInBoardChats || [] 
             };
        }
        setColumnsState(initialColumns);
        // Update the specific board in the main boards list with the live column count
        setBoards(prevBoards => prevBoards.map(b => 
            b.id === boardId ? { ...b, live_columns_count: response.columns?.length ?? 0 } : b
        ));
      } else {
        if (response.code === 'INDEX_REQUIRED_CHATS_KANBAN') {
          console.log("Error específico de índice faltante detectado. Intentando obtener solo las columnas...");
          setError("Se requiere un índice en Firestore para esta función. El administrador debe crear un índice compuesto para la colección 'chats' con los campos 'kanbanBoardId' (ASC) y 'lastMessageTimestamp' (DESC).");
          try {
            const alternativeResponse = await getKanbanBoardColumnsOnly(userId, boardId, authToken);
            if (alternativeResponse.success) {
              const basicBoardDetails = {
                board: alternativeResponse.board || { id: boardId, name: selectedBoard?.name || "Tablero", columns_order: alternativeResponse.board?.columns_order || [] },
                columns: alternativeResponse.columns || [],
                noChatsLoaded: true
              };
              setBoardDetails(basicBoardDetails);
              const initialColumns = {};
              (basicBoardDetails.columns || []).forEach(col => { initialColumns[col.id] = { ...col, chats: [] }; });
              setColumnsState(initialColumns);
              // Update the specific board in the main boards list with the live column count (even if chats failed)
              setBoards(prevBoards => prevBoards.map(b => 
                b.id === boardId ? { ...b, live_columns_count: alternativeResponse.columns?.length ?? 0 } : b
              ));
              showNotificationFunc("Se ha cargado información básica del tablero. Los chats no están disponibles hasta que el administrador complete la configuración.", "warning");
            } else {
              const basicBoardDetails = { board: { id: boardId, name: selectedBoard?.name || "Tablero", columns_order: [] }, columns: [], noChatsLoaded: true };
              setBoardDetails(basicBoardDetails); setColumnsState({});
              showNotificationFunc("Se requiere configuración adicional en la base de datos. Algunas funciones están limitadas.", "warning");
            }
          } catch (alternativeError) {
            const basicBoardDetails = { board: { id: boardId, name: selectedBoard?.name || "Tablero", columns_order: [] }, columns: [], noChatsLoaded: true };
            setBoardDetails(basicBoardDetails); setColumnsState({});
            showNotificationFunc("Error al cargar información del tablero. Se muestra vista básica.", "error");
          }
        } else {
          console.error("Error en la respuesta:", response);
          setError(response.message || 'Error al cargar los detalles del tablero.');
          showNotificationFunc("Error al cargar el tablero: " + (response.message || "Error desconocido"), "error");
        }
      }
    } catch (err) {
      console.error("Error en fetchBoardDetailsData:", err);
      setError(err.message || 'Ocurrió un error al contactar el servidor para detalles del tablero.');
      showNotificationFunc("Error: " + (err.message || "No se pudo conectar con el servidor"), "error");
    }
    setIsLoadingBoardDetails(false);
  }, [userId, authToken, selectedBoard?.name, showNotificationFunc]);

  const handleSelectBoard = (board) => {
    setSelectedBoard(board); 
    if (board) {
        fetchBoardDetailsData(board.id);
    } else {
        setBoardDetails(null); 
        setColumnsState({}); 
    }
  };

  // --- Board CRUD Modals and Handlers ---
  const handleOpenCreateBoardModal = () => setIsCreateBoardModalOpen(true);
  const handleCloseCreateBoardModal = () => setIsCreateBoardModalOpen(false);
  const handleCreateBoard = async (boardName) => {
      if (!userId || !authToken) { setError("Usuario no autenticado."); showNotificationFunc("Error: Usuario no autenticado", "error"); return; }
      setIsCreatingBoard(true); setError(null);
      try {
          const response = await createKanbanBoard(userId, { name: boardName }, authToken);
          if (response && response.success) { 
              await fetchBoards(); 
              handleCloseCreateBoardModal(); 
              showNotificationFunc("Tablero creado con éxito", "success");
          } else { setError(response?.message || 'Error al crear tablero.'); showNotificationFunc(response?.message || 'Error al crear tablero', "error");}
      } catch (err) { setError(err.message || 'Error servidor creando tablero.'); showNotificationFunc(err.message || 'Error servidor creando tablero', "error");}
      setIsCreatingBoard(false);
  };

  const handleOpenEditBoardModal = (board) => {
    setBoardToEdit(board);
    setIsEditBoardModalOpen(true);
  };
  const handleCloseEditBoardModal = () => {
    setIsEditBoardModalOpen(false);
    setBoardToEdit(null);
  };
  const handleUpdateBoard = async (boardId, newName) => {
    if (!userId || !authToken) { showNotificationFunc("Usuario no autenticado.", "error"); return; }
    setIsUpdatingBoard(true);
    try {
      const response = await updateKanbanBoard(userId, boardId, { name: newName }, authToken);
      if (response.success) {
        showNotificationFunc("Tablero actualizado con éxito.", "success");
        await fetchBoards(); // Refresh the list of boards
        if (selectedBoard?.id === boardId) { // If the selected board was updated, refresh its details
            handleSelectBoard({...selectedBoard, name: newName }); // Update local selected board name immediately
        }
        handleCloseEditBoardModal();
      } else {
        showNotificationFunc(response.message || "Error al actualizar el tablero.", "error");
      }
    } catch (err) {
      showNotificationFunc(err.message || "Error de servidor al actualizar el tablero.", "error");
    }
    setIsUpdatingBoard(false);
  };

  const handleOpenDeleteBoardModal = (board) => {
    setBoardToDelete(board);
    setIsDeleteBoardModalOpen(true);
  };
  const handleCloseDeleteBoardModal = () => {
    setIsDeleteBoardModalOpen(false);
    setBoardToDelete(null);
  };
  const handleConfirmDeleteBoard = async () => {
    if (!boardToDelete || !userId || !authToken) { showNotificationFunc("Error: No se pudo eliminar el tablero.", "error"); return; }
    setIsDeletingBoard(true);
    try {
      const response = await deleteKanbanBoard(userId, boardToDelete.id, authToken);
      if (response.success) {
        showNotificationFunc("Tablero eliminado con éxito.", "success");
        await fetchBoards(); // Refresh boards
        if (selectedBoard?.id === boardToDelete.id) {
          setSelectedBoard(null); // Deselect if the deleted board was selected
          setBoardDetails(null);
          setColumnsState({});
        }
        handleCloseDeleteBoardModal();
      } else {
        showNotificationFunc(response.message || "Error al eliminar el tablero.", "error");
      }
    } catch (err) {
      showNotificationFunc(err.message || "Error de servidor al eliminar el tablero.", "error");
    }
    setIsDeletingBoard(false);
  };

  // --- Column CRUD Modals and Handlers (Create is existing, adding Edit) ---
  const handleOpenCreateColumnModal = () => { if (!selectedBoard) return; setIsCreateColumnModalOpen(true); };
  const handleCloseCreateColumnModal = () => setIsCreateColumnModalOpen(false);
  const handleCreateColumn = async (columnName, stageType) => {
    if (!userId || !authToken || !selectedBoard) {
      showNotificationFunc("Información requerida faltante (usuario, tablero).", "error");
      return;
    }
    setIsCreatingColumn(true); setError(null);
    try {
      const response = await createKanbanColumn(userId, selectedBoard.id, { name: columnName, stageType: stageType }, authToken);
      if (response && response.success) {
        await fetchBoardDetailsData(selectedBoard.id);
        await fetchBoards();
        handleCloseCreateColumnModal();
        showNotificationFunc("Columna creada con éxito", "success");
      } else {
        setError(response?.message || 'Error al crear columna.');
        showNotificationFunc(response?.message || 'Error al crear columna', "error");
      }
    } catch (err) {
      setError(err.message || 'Error servidor creando columna.');
      showNotificationFunc(err.message || 'Error servidor creando columna', "error");
    }
    setIsCreatingColumn(false);
  };

  const handleOpenEditColumnModal = (column) => {
    if (!selectedBoard) return;
    setColumnToEdit(column);
    setIsEditColumnModalOpen(true);
  };
  const handleCloseEditColumnModal = () => {
    setIsEditColumnModalOpen(false);
    setColumnToEdit(null);
  };
  const handleUpdateColumn = async (columnId, newName, stageType) => {
    if (!userId || !authToken || !selectedBoard || !columnId) {
      showNotificationFunc("Información requerida faltante (usuario, tablero, columna).", "error");
      return;
    }
    setIsUpdatingColumn(true); setError(null);
    try {
      const payload = { name: newName, stageType: stageType };
      const response = await updateKanbanColumn(userId, selectedBoard.id, columnId, payload, authToken);
      if (response && response.success) {
        await fetchBoardDetailsData(selectedBoard.id);
        handleCloseEditColumnModal();
        showNotificationFunc("Columna actualizada con éxito", "success");
      } else {
        setError(response?.message || 'Error al actualizar columna.');
        showNotificationFunc(response?.message || 'Error al actualizar columna', "error");
      }
    } catch (err) {
      setError(err.message || 'Error servidor actualizando columna.');
      showNotificationFunc(err.message || 'Error servidor actualizando columna', "error");
    }
    setIsUpdatingColumn(false);
  };

  // --- Column Delete Handlers ---
  const handleOpenDeleteColumnModal = (column) => {
    if (column.id === 'unassigned') { // Prevent deleting the logical 'unassigned' column
        showNotificationFunc("La columna de chats no asignados no se puede eliminar.", "warning");
        return;
    }
    setColumnToDelete(column);
    setIsDeleteColumnModalOpen(true);
  };
  const handleCloseDeleteColumnModal = () => {
    setIsDeleteColumnModalOpen(false);
    setColumnToDelete(null);
  };
  const handleConfirmDeleteColumn = async () => {
    if (!columnToDelete || !userId || !authToken || !selectedBoard) { 
        showNotificationFunc("Error: No se pudo eliminar la columna.", "error"); 
        return; 
    }
    setIsDeletingColumn(true);
    try {
      // IMPORTANT: Ensure chats in the column are handled (e.g., moved to unassigned) by the backend or explicitly here.
      // For now, assuming backend handles chat reassignment or deletion upon column deletion.
      const response = await deleteKanbanColumn(userId, selectedBoard.id, columnToDelete.id, authToken);
      if (response.success) {
        showNotificationFunc("Columna eliminada con éxito.", "success");
        await fetchBoardDetailsData(selectedBoard.id); // Keep this
        await fetchBoards(); // Add this line to refresh the main list
        handleCloseDeleteColumnModal();
      } else {
        showNotificationFunc(response.message || "Error al eliminar la columna.", "error");
      }
    } catch (err) {
      showNotificationFunc(err.message || "Error de servidor al eliminar la columna.", "error");
    }
    setIsDeletingColumn(false);
  };

  // --- Lógica de Drag and Drop con @hello-pangea/dnd --- 
  const handleDragEnd = async (result) => {
    const { source, destination, draggableId } = result;

    if (!destination) return; 

    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    const sourceColumn = columnsState[source.droppableId];
    const destColumn = columnsState[destination.droppableId];
    const chatToMove = sourceColumn.chats.find(chat => (chat.chatId || chat.id) === draggableId);

    if (!chatToMove) {
      console.error("Error: Chat a mover no encontrado en la columna origen.");
      showNotificationFunc("Error al mover el chat: Origen no encontrado.", "error");
      return;
    }

    // Optimistic UI Update
    const newSourceChats = Array.from(sourceColumn.chats);
    newSourceChats.splice(source.index, 1);

    const newDestChats = Array.from(destColumn.chats);
    newDestChats.splice(destination.index, 0, chatToMove);

    setColumnsState(prev => ({
      ...prev,
      [source.droppableId]: {
        ...sourceColumn,
        chats: newSourceChats
      },
      [destination.droppableId]: {
        ...destColumn,
        chats: newDestChats
      }
    }));

    try {
      // API Call
      const targetColumnId = destination.droppableId === 'unassigned' ? null : destination.droppableId;
      const response = await assignChatToKanbanColumn(userId, draggableId, selectedBoard.id, targetColumnId, authToken);

      if (!response.success) {
        // Revert UI on failure
        showNotificationFunc(response.message || "Error al asignar el chat.", "error");
        setColumnsState(prev => ({ // Revert to previous state (or re-fetch)
          ...prev,
          [source.droppableId]: sourceColumn,
          [destination.droppableId]: destColumn
        }));
      } else {
        showNotificationFunc("Chat movido con éxito.", "success");
        // Consider re-fetching board details for consistency if needed, or trust optimistic update
        // fetchBoardDetailsData(selectedBoard.id); 
      }
    } catch (err) {
      showNotificationFunc(err.message || "Error de servidor al mover el chat.", "error");
      // Revert UI on failure
      setColumnsState(prev => ({ // Revert to previous state (or re-fetch)
        ...prev,
        [source.droppableId]: sourceColumn,
        [destination.droppableId]: destColumn
      }));
    }
  };

  const handleUnassignChat = async (chatId) => {
    if (!userId || !authToken || !chatId) {
      showNotificationFunc("No se puede desasignar el chat: faltan datos.", "error");
      return;
    }
    console.log(`Intentando desasignar (eliminar) completamente el chat ${chatId} del tablero.`);

    // Optimistic UI update (remove chat from all columns in current view)
    setColumnsState(prev => {
      const newState = { ...prev };
      for (const colId in newState) {
        newState[colId].chats = newState[colId].chats.filter(chat => (chat.chatId || chat.id) !== chatId);
      }
      return newState;
    });

    try {
      // API Call: Set both boardId and columnId to null for complete removal
      const response = await assignChatToKanbanColumn(userId, chatId, null, null, authToken);

      if (response.success) {
        showNotificationFunc("Chat eliminado del tablero con éxito.", "success");
        // Re-fetch board details to ensure UI consistency after removal
        if (selectedBoard && selectedBoard.id) {
          fetchBoardDetailsData(selectedBoard.id);
        }
      } else {
        showNotificationFunc(response.message || "Error al eliminar el chat del tablero.", "error");
        // Revert optimistic update by re-fetching
        if (selectedBoard && selectedBoard.id) {
          fetchBoardDetailsData(selectedBoard.id);
        }
      }
    } catch (err) {
      showNotificationFunc(err.message || "Error de servidor al eliminar el chat del tablero.", "error");
      // Revert optimistic update by re-fetching
      if (selectedBoard && selectedBoard.id) {
        fetchBoardDetailsData(selectedBoard.id);
      }
    }
  };

  const FirestoreIndexAlert = ({ error }) => (
    <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md shadow-md">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <FaExclamationTriangle className="h-6 w-6 text-yellow-500" aria-hidden="true" />
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-lg font-medium text-yellow-800">Configuración pendiente en la base de datos</h3>
          <div className="mt-2 text-yellow-700"><p className="text-sm">{error}</p>
            <p className="mt-3 text-sm font-medium">Esta es una acción de administrador. Mientras tanto, puedes crear y gestionar las columnas del tablero, pero los chats no estarán disponibles hasta que se complete la configuración.</p>
          </div>
          <div className="mt-4"><div className="flex space-x-3">
              <button type="button" className="px-3 py-2 text-sm font-medium text-yellow-800 bg-yellow-100 hover:bg-yellow-200 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500" onClick={handleOpenCreateColumnModal}>
                <FaPlus className="inline-block mr-1" size={12} />Añadir columna mientras tanto
              </button>
          </div></div>
        </div>
      </div>
    </div>
  );

  const openViewMessagesModal = async (chatToView) => {
    if (!chatToView) { console.error("[openViewMessagesModal] chatToView is null or undefined."); showNotificationFunc("No se puede cargar el chat: datos inválidos.", "error"); return; }
    const actualChatIdForMessages = chatToView.chatId; 
    if (!actualChatIdForMessages || typeof actualChatIdForMessages !== 'string' || !actualChatIdForMessages.includes('@')) {
        console.error(`[openViewMessagesModal] Could not find a valid WhatsApp Chat ID in chatToView. Attempted ID: '${actualChatIdForMessages}'. Full object:`, chatToView);
        showNotificationFunc("ID de WhatsApp no válido para ver mensajes. Revise la consola.", "error"); return;
    }
    setViewMessagesModal(prev => ({ ...prev, isOpen: true, chat: chatToView, messages: [], isLoading: true, error: null }));
    try {
        const response = await getChatMessages(userId, actualChatIdForMessages, authToken);
        if (response.success && response.data) {
            const processedMessages = response.data.map(msg => ({ id: msg.id || `${msg.timestamp}-${Math.random().toString(36).substr(2, 9)}`, body: msg.content || msg.body || "", fromMe: !!msg.fromMe, timestamp: msg.timestamp }));
            setViewMessagesModal(prev => ({ ...prev, messages: processedMessages, isLoading: false }));
        } else { throw new Error(response.message || "No se pudieron cargar los mensajes."); }
    } catch (err) {
        console.error("Error loading messages for view modal:", err);
        setViewMessagesModal(prev => ({ ...prev, isLoading: false, error: err.message }));
        showNotificationFunc(err.message || "Error al cargar mensajes.", "error");
    }
  };

  const closeViewMessagesModal = () => {
    setViewMessagesModal({ isOpen: false, chat: null, messages: [], isLoading: false, error: null });
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6 font-['Poppins']">
      {/* Notificación Global */}
      {notification.show && (
        <div className={`fixed top-5 right-5 z-50 p-4 rounded-md shadow-lg text-white ${
          notification.type === 'success' ? 'bg-green-500' : 
          notification.type === 'error' ? 'bg-red-500' : 
          notification.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
        }`}>
          {notification.message}
        </div>
      )}

      {/* Cabecera Principal */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 pb-4 border-b border-slate-200">
        <h1 className="text-3xl font-bold text-slate-800 flex items-center">
          <FaThList className="mr-3 text-purple-600"/> Tableros Kanban
        </h1>
        <button 
          onClick={handleOpenCreateBoardModal} 
          className="mt-3 sm:mt-0 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 text-white rounded-lg flex items-center gap-2 transition-all shadow-md hover:shadow-lg focus:ring-4 focus:ring-purple-300">
          <FaPlus /> Crear Tablero Nuevo
        </button>
      </div>
      
      {/* Selección de Tableros */}
      {isLoadingBoards && (
        <div className="text-center p-10"><FaSpinner className="animate-spin h-10 w-10 mx-auto text-purple-600" /> <p className="mt-2 text-slate-600">Cargando tableros...</p></div>
      )}
      {!isLoadingBoards && boards.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-slate-700 mb-3">Mis Tableros</h2>
          <div className="flex overflow-x-auto space-x-4 pb-4 scrollbar-thin scrollbar-thumb-slate-300 hover:scrollbar-thumb-slate-400 scrollbar-track-transparent">
          {boards.map(board => (
              <div 
                key={board.id} 
                className={`min-w-[240px] sm:min-w-[260px] rounded-xl transition-all duration-200 ease-in-out group relative flex-shrink-0 ${
                  selectedBoard?.id === board.id ? 'bg-gradient-to-br from-purple-500 to-blue-500 text-white shadow-lg ring-2 ring-purple-300' : 'bg-white shadow-md hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 hover:bg-slate-50'
                }`}
              >
                <div className="p-4 cursor-pointer w-full h-full flex flex-col justify-between" onClick={() => handleSelectBoard(board)}>
                    <div>
                        <h3 className={`text-lg font-bold ${selectedBoard?.id === board.id ? 'text-white' : 'text-slate-800'}`}>{board.name}</h3>
                        <p className={`text-sm mt-1 ${selectedBoard?.id === board.id ? 'text-purple-100' : 'text-slate-500'}`}>
                        {/* Use live_columns_count if available, otherwise fallback to columns_count, then 0 */}
                        {`${typeof board.live_columns_count === 'number' ? board.live_columns_count : (board.columns_count || 0)} columnas`}
                        </p>
                    </div>
                </div>
                <div className={`absolute top-2 right-2 flex space-x-1.5 transition-opacity duration-200 ${selectedBoard?.id === board.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                    <button
                        onClick={(e) => { e.stopPropagation(); handleOpenEditBoardModal(board); }}
                        className={`p-1.5 rounded-full transition-colors ${selectedBoard?.id === board.id ? 'bg-white/20 hover:bg-white/30 text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-600'}`}
                        title="Editar tablero"
                    >
                        <FaPencilAlt size={12}/>
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); handleOpenDeleteBoardModal(board); }}
                        className={`p-1.5 rounded-full transition-colors ${selectedBoard?.id === board.id ? 'bg-white/20 hover:bg-white/30 text-white' : 'bg-red-100 hover:bg-red-200 text-red-600'}`}
                        title="Eliminar tablero"
                    >
                        <FaTrash size={12}/>
                    </button>
                </div>
            </div>
          ))}
          </div>
        </div>
      )}

      {!isLoadingBoards && boards.length === 0 && (
        <div className="text-center p-10 bg-white rounded-lg shadow-md">
          <FaThLarge className="mx-auto h-16 w-16 text-slate-400 mb-4" />
          <h3 className="text-xl font-semibold text-slate-700 mb-2">Aún no tienes tableros Kanban</h3>
          <p className="text-slate-500 mb-6">Comienza por crear tu primer tablero para organizar tus tareas o leads.</p>
          <button 
            onClick={handleOpenCreateBoardModal} 
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 text-white rounded-lg flex items-center gap-2 mx-auto transition-all shadow-md hover:shadow-lg focus:ring-4 focus:ring-purple-300">
            <FaPlus /> Crear mi Primer Tablero
          </button>
        </div>
      )}

      {/* Detalles del Tablero Seleccionado */}
      {isLoadingBoardDetails && (
         <div className="text-center p-10 mt-8"><FaSpinner className="animate-spin h-10 w-10 mx-auto text-purple-600" /> <p className="mt-2 text-slate-600">Cargando detalles del tablero...</p></div>
      )}
      {!isLoadingBoardDetails && selectedBoard && boardDetails?.board ? (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="bg-white shadow-2xl rounded-xl p-4 sm:p-6 mt-8">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-slate-800">{boardDetails.board.name}</h2>
              <button 
                onClick={handleOpenCreateColumnModal} 
                className="mt-3 sm:mt-0 px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg flex items-center gap-2 text-sm transition-colors shadow-md hover:shadow-lg focus:ring-2 focus:ring-sky-300">
                <FaPlus size={14} /> Añadir Columna
              </button>
            </div>
            
            {error && error.includes("índice en Firestore") && (<FirestoreIndexAlert error={error} />)}
            
            <div className="flex flex-col md:flex-row md:flex-nowrap md:overflow-x-auto md:space-x-4 space-y-4 md:space-y-0 pb-4 md:min-h-[600px] bg-slate-100 p-4 rounded-lg scrollbar-thin scrollbar-thumb-slate-300 hover:scrollbar-thumb-slate-400 scrollbar-track-slate-100">
              {(boardDetails?.board?.columns_order || Object.keys(columnsState).filter(cid => columnsState[cid] && !columnsState[cid].isUnassigned)) 
                .map(columnId => columnsState[columnId])
                .concat(columnsState['unassigned'] ? [columnsState['unassigned']] : []) 
                .filter(Boolean)
                .map((column) => (
                  <Droppable key={column.id} droppableId={column.id}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`bg-slate-200 rounded-xl p-3 w-full md:min-w-[320px] md:w-[320px] flex flex-col shadow-lg ${snapshot.isDraggingOver ? 'bg-purple-100' : ''}`}
                      >
                        <div className="flex justify-between items-center mb-3 px-1 group">
                          <h3 className="font-semibold text-lg text-slate-700 capitalize truncate pr-2">{column.name}</h3>
                          <div className="flex items-center space-x-1">
                            <span className="text-xs text-slate-500 bg-slate-300 px-1.5 py-0.5 rounded-full font-medium">
                              {(column.chats || []).length}
                            </span>
                            {column.id !== 'unassigned' && ( 
                                <>
                                    <button 
                                        onClick={() => handleOpenEditColumnModal(column)}
                                        className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-300/70 opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="Editar nombre de columna"
                                    >
                                        <FaPencilAlt size={12}/>
                                    </button>
                                    <button 
                                        onClick={() => handleOpenDeleteColumnModal(column)} // Delete column handler
                                        className="p-1.5 rounded-full text-slate-400 hover:text-red-500 hover:bg-red-100 opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="Eliminar columna"
                                    >
                                        <FaColumnTrash size={12}/>
                                    </button>
                                </> 
                            )}
                          </div>
                        </div>
                        <div className="space-y-3 md:min-h-[450px] flex-grow overflow-y-auto p-1 rounded-md scrollbar-thin scrollbar-thumb-slate-300 hover:scrollbar-thumb-slate-400 scrollbar-track-transparent">
                          {(column.chats || []).map((chat, index) => (
                            <Draggable key={chat.chatId || chat.id} draggableId={chat.chatId || chat.id} index={index}>
                              {(providedDraggable, snapshotDraggable) => (
                                <div
                                  ref={providedDraggable.innerRef}
                                  {...providedDraggable.draggableProps}
                                  {...providedDraggable.dragHandleProps}
                                  className={`rounded-lg transition-shadow duration-150 ${snapshotDraggable.isDragging ? 'ring-2 ring-purple-500 shadow-2xl' : 'shadow-sm'}`}
                                  onClick={() => openViewMessagesModal(chat)}
                                  style={{...providedDraggable.draggableProps.style}}
                                >
                                  <div onClick={() => openViewMessagesModal(chat)} className="w-full">
                                    <ChatCard chat={chat} onUnassign={handleUnassignChat} />
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                          {(!column.chats || column.chats.length === 0) && (
                              <div className="flex flex-col items-center justify-center h-full p-4 text-slate-500 italic">
                                <FaInfo size={24} className="mb-2"/>
                                Arrastra chats aquí o crea uno nuevo.
                              </div>
                          )}
                        </div>
                      </div>
                    )}
                  </Droppable>
                ))}
              
              {(!boardDetails?.columns || boardDetails.columns.length === 0) && 
                !Object.values(columnsState).some(col => col && col.id !== 'unassigned' && col.chats && col.chats.length > 0) && 
                !columnsState['unassigned']?.chats?.length > 0 && (
                <div className="flex items-center justify-center w-full p-6 bg-slate-50 rounded-lg border-2 border-dashed border-slate-300">
                  <div className="text-center">
                    <FaColumns className="mx-auto h-12 w-12 text-slate-400 mb-3" />
                    <h3 className="text-lg font-medium text-slate-700">Tablero Vacío</h3>
                    <p className="mt-1 text-sm text-slate-500">Comienza por añadir una columna para organizar tus chats.</p>
                    <button 
                      onClick={handleOpenCreateColumnModal} 
                      className="mt-4 px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-md transition-colors shadow-md hover:shadow-lg focus:ring-2 focus:ring-sky-300">
                      <FaPlus className="inline-block mr-2" size={12} />Añadir Primera Columna
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </DragDropContext>
      ) : (
        !isLoadingBoards && boards.length > 0 && (
          <div className="text-center p-10 mt-8 bg-white rounded-lg shadow-md">
            <FaThLarge className="mx-auto h-16 w-16 text-slate-400 mb-4" />
            <h3 className="text-xl font-semibold text-slate-700 mb-2">Selecciona un Tablero</h3>
            <p className="text-slate-500">Elige uno de tus tableros existentes arriba para ver y organizar tus chats.</p>
        </div>
        )
      )}

      {/* Modales */}
      {isCreateBoardModalOpen && (
        <CreateBoardModal 
          isOpen={isCreateBoardModalOpen} 
          onClose={handleCloseCreateBoardModal} 
          onSubmit={handleCreateBoard} 
          isLoading={isCreatingBoard} 
        />
      )}
      {isEditBoardModalOpen && boardToEdit && (
        <EditBoardModal
          isOpen={isEditBoardModalOpen}
          onClose={handleCloseEditBoardModal}
          onSubmit={handleUpdateBoard}
          isLoading={isUpdatingBoard}
          board={boardToEdit}
        />
      )}
      {isDeleteBoardModalOpen && boardToDelete && (
        <ConfirmDeleteModal
          isOpen={isDeleteBoardModalOpen}
          onClose={handleCloseDeleteBoardModal}
          onConfirm={handleConfirmDeleteBoard}
          isLoading={isDeletingBoard}
          itemName={boardToDelete.name}
          itemType="tablero"
        />
      )}
      {isCreateColumnModalOpen && selectedBoard && (
        <CreateColumnModal 
          isOpen={isCreateColumnModalOpen} 
          onClose={handleCloseCreateColumnModal} 
          onSubmit={handleCreateColumn} 
          isLoading={isCreatingColumn} 
          boardName={selectedBoard.name}
        />
      )}
      {isEditColumnModalOpen && columnToEdit && selectedBoard && (
        <EditColumnModal
          isOpen={isEditColumnModalOpen}
          onClose={handleCloseEditColumnModal}
          onSubmit={handleUpdateColumn}
          isLoading={isUpdatingColumn}
          column={columnToEdit}
          boardName={selectedBoard.name}
        />
      )}
      {isDeleteColumnModalOpen && columnToDelete && selectedBoard && ( // Render ConfirmDeleteModal for columns
        <ConfirmDeleteModal
          isOpen={isDeleteColumnModalOpen}
          onClose={handleCloseDeleteColumnModal}
          onConfirm={handleConfirmDeleteColumn}
          isLoading={isDeletingColumn}
          itemName={columnToDelete.name}
          itemType="columna"
        />
      )}

      {/* Modal para ver mensajes del chat (ya incluido en tus funciones, solo asegúrate que use los nuevos estilos si es necesario) */}
      {viewMessagesModal.isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
                    Mensajes con: {viewMessagesModal.chat?.contactName || viewMessagesModal.chat?.chatId}
                </h3>
                <button onClick={closeViewMessagesModal} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                    <FaTimes size={20} />
                </button>
            </div>
              {viewMessagesModal.isLoading ? (
                <div className="flex justify-center items-center h-48"><FaSpinner className="animate-spin h-8 w-8 text-purple-600" /></div>
              ) : viewMessagesModal.error ? (
                <p className="text-red-500 bg-red-50 p-3 rounded-md">Error: {viewMessagesModal.error}</p>
            ) : (
                <div className="overflow-y-auto space-y-3 pr-2 flex-grow scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
                    {viewMessagesModal.messages.length > 0 ? viewMessagesModal.messages.map(msg => (
                        <div key={msg.id} className={`max-w-[80%] p-3 rounded-lg text-sm ${
                            msg.fromMe ? 'ml-auto bg-purple-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100'
                        }`}>
                            <p>{msg.body}</p>
                            <p className={`text-xs mt-1 ${msg.fromMe ? 'text-purple-200' : 'text-gray-500 dark:text-gray-400'} text-right`}>
                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                        </div>
                    )) : <p className="text-center text-gray-500 dark:text-gray-400 py-10">No hay mensajes en este chat.</p>}
                  </div>
              )}
          </div>
        </div>
      )}
    </div>
  );
};

export default KanbanBoardsView;