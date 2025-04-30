import PropTypes from 'prop-types';
import { useState } from 'react';
import { doc, updateDoc, addDoc, collection, deleteDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import logApiRequest from "../requestLogger"; // Import the logger utility

const ModalEditarPlantilla = ({ 
  template = {}, 
  isCreateMode = false, 
  name = "", 
  platform = "", 
  body = "", 
  onClose, 
  onUpdate,
  saveTemplate,
  setNewTemplate,
  setNewTemplateBody,
  selectedType = "Plantillas de mensajes",
  setSelectedType,
  setSelectedPlatform
}) => {
    // Inicializa estados considerando ambos casos (props individuales o objeto template)
    const [nombre, setNombre] = useState(isCreateMode ? name : (template.name || ""));
    const [tipo, setTipo] = useState(isCreateMode ? (selectedType !== "Tipo" ? selectedType : "Plantillas de mensajes") : (template.type || "Plantillas de mensajes"));
    const [cuerpo, setCuerpo] = useState(isCreateMode ? body : (template.body || ""));
    const [isLoading, setIsLoading] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleSave = async () => {
        // Validar todos los campos
        if (!nombre.trim()) {
            setError("El nombre de la plantilla es obligatorio");
            return;
        }
        
        if (!cuerpo.trim()) {
            setError("El cuerpo del mensaje es obligatorio");
            return;
        }
    
        // Si estamos en modo creación, usar la función saveTemplate proporcionada
        if (isCreateMode && saveTemplate) {
            // Actualizar los estados del componente padre
            if (setNewTemplate) setNewTemplate(nombre);
            if (setNewTemplateBody) setNewTemplateBody(cuerpo);
            if (setSelectedType && tipo !== selectedType) setSelectedType(tipo);
            
            // Llamar a la función de guardar del componente padre
            saveTemplate();
            return;
        }
    
        // Validar template para modo de edición
        if (!isCreateMode && (!template || !template.id || !template.userId)) {
            setError("Error: Datos de plantilla incompletos");
            console.error("Error: Falta el ID de la plantilla o el usuario.", template);
            return;
        }
    
        try {
            setIsLoading(true);
            setIsDeleting(false);
            setError("");
            
            // Solo para modo edición
            if (!isCreateMode) {
                // Log the template update attempt
                await logApiRequest({
                    endpoint: "internal/update_template",
                    requestData: {
                        templateId: template.id,
                        name: nombre.trim(),
                        type: tipo,
                        bodyLength: cuerpo.trim().length
                    },
                    userId: template.userId,
                    status: "pending",
                    source: "ModalEditarPlantilla",
                    metadata: {
                        action: "update_template",
                        templateId: template.id,
                        originalName: template.name,
                        newName: nombre.trim(),
                        originalPlatform: template.platform,
                        originalType: template.type,
                        newType: tipo,
                        originalBodyLength: template.body?.length || 0,
                        newBodyLength: cuerpo.trim().length
                    }
                });
                
                const templateRef = doc(db, "users", template.userId, "templates", template.id);
                await updateDoc(templateRef, {
                    name: nombre.trim(),
                    type: tipo,
                    body: cuerpo.trim(),
                    updatedAt: new Date()
                });
                
                setSuccess("Plantilla actualizada con éxito");
                
                // Log the template update success
                await logApiRequest({
                    endpoint: "internal/update_template",
                    requestData: {
                        templateId: template.id,
                        name: nombre.trim()
                    },
                    userId: template.userId,
                    status: "success",
                    source: "ModalEditarPlantilla",
                    metadata: {
                        action: "update_template",
                        templateId: template.id,
                        templateName: nombre.trim()
                    }
                });
            }
            
            // Notificar al componente padre que se ha actualizado la plantilla
            if (onUpdate) {
                onUpdate();
            }
            
            // Cerrar el modal después de un breve retraso
            setTimeout(() => {
                onClose();
            }, 1500);
            
        } catch (error) {
            console.error("Error al actualizar la plantilla:", error);
            setError(`Error al actualizar: ${error.message || "Algo salió mal"}`);
            setIsLoading(false);
            
            // Log the template update error (solo en modo edición)
            if (!isCreateMode) {
                await logApiRequest({
                    endpoint: "internal/update_template",
                    requestData: {
                        templateId: template.id,
                        name: nombre.trim()
                    },
                    userId: template.userId,
                    status: "error",
                    source: "ModalEditarPlantilla",
                    metadata: {
                        action: "update_template",
                        templateId: template.id,
                        error: error.message || "Unknown error"
                    }
                });
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async () => {
        // Check if in edit mode and template data is valid
        if (isCreateMode || !template || !template.id || !template.userId) {
            setError("La eliminación solo está disponible para plantillas existentes.");
            console.error("Error: Intento de eliminar en modo creación o con datos inválidos.", template);
            return;
        }

        if (!window.confirm(`¿Estás seguro de que deseas eliminar la plantilla "${template.name}"? Esta acción no se puede deshacer.`)) {
            return; // User cancelled
        }

        try {
            setIsLoading(true);
            setIsDeleting(true);
            setError("");
            setSuccess("");
            
            // Log the delete attempt
            await logApiRequest({
                endpoint: "internal/delete_template",
                requestData: { templateId: template.id },
                userId: template.userId,
                status: "pending",
                source: "ModalEditarPlantilla",
                metadata: { action: "delete_template", templateId: template.id, templateName: template.name }
            });
            
            const templateRef = doc(db, "users", template.userId, "templates", template.id);
            await deleteDoc(templateRef);
            
            setSuccess("Plantilla eliminada con éxito");
            
            // Log the delete success
            await logApiRequest({
                endpoint: "internal/delete_template",
                requestData: { templateId: template.id },
                userId: template.userId,
                status: "success",
                source: "ModalEditarPlantilla",
                metadata: { action: "delete_template", templateId: template.id, templateName: template.name }
            });
            
            // Notificar al componente padre (si se proporciona la función)
            if (onUpdate) {
                onUpdate();
            }
            
            // Cerrar el modal después de un breve retraso para mostrar el mensaje
            setTimeout(() => {
                onClose();
            }, 1500);
            
        } catch (error) {
            console.error("Error al eliminar la plantilla:", error);
            setError(`Error al eliminar: ${error.message || "Algo salió mal"}`);
            
            // Log the delete error
            await logApiRequest({
                endpoint: "internal/delete_template",
                requestData: { templateId: template.id },
                userId: template.userId,
                status: "error",
                source: "ModalEditarPlantilla",
                metadata: { action: "delete_template", templateId: template.id, templateName: template.name, error: error.message || "Unknown error" }
            });
        } finally {
            setIsLoading(false);
            setIsDeleting(false);
        }
    };

    // Vista previa del mensaje
    const handlePreview = () => {
        // Aquí podrías implementar una vista previa más detallada si es necesario
        alert(cuerpo);
        
        // Log the preview action (solo en modo edición)
        if (!isCreateMode) {
            logApiRequest({
                endpoint: "internal/preview_template",
                requestData: {
                    templateId: template.id
                },
                userId: template.userId,
                status: "success",
                source: "ModalEditarPlantilla",
                metadata: {
                    action: "preview_template",
                    templateId: template.id,
                    templateName: nombre.trim()
                }
            });
        }
    };
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-lg p-4 md:p-6 w-full max-w-[500px] relative">
                
                {/* Notificaciones de error y éxito */}
                {error && (
                    <div className="mb-4 p-2 md:p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg text-sm">
                        {error}
                    </div>
                )}
                
                {success && (
                    <div className="mb-4 p-2 md:p-3 bg-green-100 border border-green-300 text-green-700 rounded-lg text-sm">
                        {success}
                    </div>
                )}
                
                {/* Botón de cerrar - sin fondo */}
                <button
                    className="absolute top-3 right-3 md:top-4 md:right-4 text-gray-600 hover:text-gray-800 transition"
                    style={{ backgroundColor: 'transparent', border: 'none', padding: 0, cursor: 'pointer' }}
                    onClick={() => {
                        // Log the close action (solo en modo edición)
                        if (!isCreateMode) {
                            logApiRequest({
                                endpoint: "internal/close_edit_template",
                                requestData: {
                                    templateId: template.id
                                },
                                userId: template.userId,
                                status: "success",
                                source: "ModalEditarPlantilla",
                                metadata: {
                                    action: "close_edit_template",
                                    templateId: template.id,
                                    templateName: template.name,
                                    wasSaved: success !== ""
                                }
                            });
                        }
                        
                        onClose();
                    }}
                    disabled={isLoading}
                >
                    ✕
                </button>

                {/* Título */}
                <h2 className="text-base md:text-lg font-semibold text-gray-800 mb-3 md:mb-4">
                    {isCreateMode ? "Crear nueva plantilla" : "Editar plantilla de mensaje"}
                </h2>

                {/* Nombre de la plantilla */}
                <label className="text-gray-600 text-xs md:text-sm font-medium">Nombre de la plantilla</label>
                <input
                    type="text"
                    value={nombre}
                    onChange={(e) => {
                        setNombre(e.target.value);
                        if (isCreateMode && setNewTemplate) setNewTemplate(e.target.value);
                    }}
                    className="w-full p-2 md:p-3 mt-1 mb-3 md:mb-4 border border-[#A6A6A6] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#5468FF] bg-white text-[#393346] text-sm md:text-base"
                    placeholder="Nombre de la plantilla"
                    disabled={isLoading}
                />
                {/* Cuerpo */}
                <label className="text-gray-600 text-xs md:text-sm font-medium">Cuerpo</label>
                <div className="border border-gray-300 rounded-lg mt-1">
                    <div className="flex items-center justify-between bg-[#F3F2FC] p-2 rounded-t-lg">
                    </div>
                    <textarea
                        value={cuerpo}
                        onChange={(e) => {
                            setCuerpo(e.target.value);
                            if (isCreateMode && setNewTemplateBody) setNewTemplateBody(e.target.value);
                        }}
                        className="w-full p-2 md:p-3 border-t border-gray-300 focus:outline-none resize-none h-24 md:h-32 bg-white text-gray-700 text-sm md:text-base"
                        disabled={isLoading}
                        placeholder="Escribe el contenido de tu plantilla aquí..."
                    />
                </div>

                {/* Botones de formato */}
                
                {/* Botones Guardar y Eliminar */}
                <div className="mt-4 md:mt-6 flex flex-col md:flex-row gap-2 md:gap-3">
                  <button
                      className="w-full bg-[#0d0420] text-white py-2 md:py-3 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-[#7c7c7c] transition text-sm md:text-base"
                      onClick={handleSave}
                      disabled={isLoading}
                  >
                      {/* Loading/Save text logic */}
                       {isLoading && !isDeleting ? (
                          <>
                              <svg className="animate-spin -ml-1 mr-3 h-4 w-4 md:h-5 md:w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Guardando...
                          </>
                      ) : "Guardar →"}
                  </button>
                  
                  {!isCreateMode && (
                    <button
                      className="w-full md:w-auto bg-red-600 text-white py-2 md:py-3 px-4 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-red-700 transition text-sm md:text-base disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={handleDelete}
                      disabled={isLoading}
                    >
                      {isLoading && isDeleting ? (
                         <>
                            <svg className="animate-spin -ml-1 mr-3 h-4 w-4 md:h-5 md:w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Eliminando...
                         </>
                      ) : "Eliminar"}
                    </button>
                  )}
                </div>
            </div>
        </div>
    );
};

ModalEditarPlantilla.propTypes = {
    template: PropTypes.object,
    isCreateMode: PropTypes.bool,
    name: PropTypes.string,
    platform: PropTypes.string,
    body: PropTypes.string,
    onClose: PropTypes.func.isRequired,
    onUpdate: PropTypes.func,
    saveTemplate: PropTypes.func,
    setNewTemplate: PropTypes.func,
    setNewTemplateBody: PropTypes.func,
    selectedType: PropTypes.string,
    setSelectedType: PropTypes.func,
    setSelectedPlatform: PropTypes.func 
};

ModalEditarPlantilla.defaultProps = {
    template: {},
    isCreateMode: false,
    name: "",
    platform: "",
    body: "",
    selectedType: "Plantillas de mensajes"
};

export default ModalEditarPlantilla;