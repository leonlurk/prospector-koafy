import React, { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { updateAgent, getAgent } from '../services/api';
import { AuthContext } from '../../../context/AuthContext';
// Remove custom component imports
// import Card from '../components/Card';
// import Button from '../components/Button';
// import Input from '../components/Input';
// import Textarea from '../components/Textarea';

// --- Heroicons (Keep) ---
const InformationCircleIcon = (props) => (
<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
  <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.25 5.25m.47-5.47l.25-5.25M11.25 11.25h.008v.015h-.008v-.015zm0 0a2.25 2.25 0 100 4.5 2.25 2.25 0 000-4.5zM12 21a9 9 0 100-18 9 9 0 000 18z" />
</svg>
);
const LinkIcon = (props) => (
<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
  <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
</svg>
);
const DocumentArrowUpIcon = (props) => (
<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12l-3-3m0 0l-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
</svg>
);
const QuestionMarkCircleIcon = (props) => (
<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
  <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
</svg>
);
const ChevronDownIcon = (props) => (
<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
</svg>
);
const ArrowUpTrayIcon = (props) => (
 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
</svg>
);
const ArrowPathIcon = (props) => ( // Icon for save button
 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
</svg>
);
// --------------------------------------------------

// --- Reusable Form Field Components (Optional but recommended for consistency) ---
const FormLabel = ({ htmlFor, children }) => (
  <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-700 mb-1">{children}</label>
);

const FormInput = ({ id, name, type = "text", placeholder, value, onChange, ...props }) => (
  <input
    type={type}
    id={id}
    name={name}
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    className="block w-full h-10 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
    {...props}
  />
);

const FormTextarea = ({ id, name, rows, placeholder, value, onChange, hint, ...props }) => (
  <div>
    <textarea
      id={id}
      name={name}
      rows={rows}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
      {...props}
    />
    {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
  </div>
);

// --- Collapsible Section Component --- (Refactored Styling)
const CollapsibleSection = ({ title, Icon, children }) => {
  const [isOpen, setIsOpen] = useState(true); // Keep state for potential future use

  return (
     // Adjusted borders and padding
     <div className="border-t border-gray-200 first:border-t-0">
        <button 
           type="button" 
           onClick={() => setIsOpen(!isOpen)} 
           className="flex justify-between items-center w-full p-4 text-left hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-300"
         >
          <div className="flex items-center">
            <Icon className="w-5 h-5 mr-3 text-indigo-600" />
            <span className="font-medium text-gray-800">{title}</span>
          </div>
          <ChevronDownIcon className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} />
        </button>
        {isOpen && (
          // Added padding to content area
          <div className="px-4 pb-5 space-y-4">
            {children}
          </div>
        )}
      </div>
  );
};

// --- Subcomponents using Tailwind/Standard HTML ---
const InformationSection = ({ data, handleChange }) => (
  <CollapsibleSection title="Información" Icon={InformationCircleIcon}>
    <FormLabel htmlFor="info-text">Información para su agente</FormLabel>
    <FormTextarea
      id="info-text"
      name="information"
      rows={5}
      placeholder="Resume la empresa, funciones de los productos, preguntas frecuentes de los clientes, pauta o servicios..."
      value={data.information}
      onChange={handleChange}
      hint="Agregue información basada en texto para entrenar a su agente."
    />
  </CollapsibleSection>
);

const LinkSection = ({ data, handleChange }) => (
  <CollapsibleSection title="Enlace URL" Icon={LinkIcon}>
    <FormLabel htmlFor="link-url">Introducir una URL</FormLabel>
    <FormInput
      type="url"
      id="link-url"
      name="linkUrl"
      placeholder="https://www.ejemplo.com"
      value={data.linkUrl}
      onChange={handleChange}
    />
    {/* TODO: Add radio buttons for frequency if needed */}
     <p className="text-xs text-gray-500 mt-1">Proporcione una URL para que su agente la analice dinámicamente.</p>
  </CollapsibleSection>
);

const FileUploadSection = ({ data, handleChange, handleFileChange }) => (
  <CollapsibleSection title="Archivo" Icon={DocumentArrowUpIcon}>
    <FormLabel htmlFor="file-upload">Subir Archivo</FormLabel>
    <div className="mt-1 flex justify-center px-6 pt-8 pb-8 border-2 border-gray-300 border-dashed rounded-md bg-white hover:border-indigo-400 transition duration-150">
      <div className="space-y-1 text-center">
        <ArrowUpTrayIcon className="mx-auto h-10 w-10 text-gray-400" />
        <div className="flex text-sm text-gray-600 justify-center">
          <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500 px-1">
            <span>Cargar un archivo</span>
            <input id="file-upload" name="file" type="file" className="sr-only" onChange={handleFileChange} />
          </label>
          <p className="pl-1">o arrastre y suelte</p>
        </div>
        <p className="text-xs text-gray-500">PDF, DOCX, TXT hasta 10MB</p> {/* Adjust types/size */}
      </div>
    </div>
    {/* Display selected file name if available */}
    {data.fileName && <p className="mt-2 text-sm text-gray-600">Archivo seleccionado: {data.fileName}</p>}
    
    <div className="mt-4">
        <FormLabel htmlFor="file-usage">¿Cómo debe su agente utilizar este archivo?</FormLabel>
        <FormTextarea
          id="file-usage"
          name="fileUsage"
          rows={2}
          placeholder="Ej: Usar como fuente principal para responder preguntas sobre características del producto."
          value={data.fileUsage}
          onChange={handleChange}
          hint="Describe cómo debe usar el archivo su agente."
        />
    </div>
  </CollapsibleSection>
);

const QandASection = ({ data, handleChange }) => (
   <CollapsibleSection title="Preguntas y Respuestas" Icon={QuestionMarkCircleIcon}>
    <FormLabel htmlFor="qa-question">Pregunta</FormLabel>
     <FormTextarea
      id="qa-question"
      name="qaQuestion"
      rows={2}
      placeholder="Ej: ¿Cuál es el horario de atención?"
      value={data.qaQuestion}
      onChange={handleChange}
      hint="Entrene a la IA con pares de preguntas y respuestas."
    />
    <div className="mt-4">
        <FormLabel htmlFor="qa-answer">Respuesta</FormLabel>
        <FormTextarea
          id="qa-answer"
          name="qaAnswer"
          rows={4}
          placeholder="Ej: Nuestro horario es de Lunes a Viernes de 9:00 a 18:00."
          value={data.qaAnswer}
          onChange={handleChange}
        />
    </div>
   </CollapsibleSection>
);

// --- Main Page Component ---
function KnowledgeBasePage() {
  const { agentId } = useParams();
  const { currentUser } = useContext(AuthContext);
  const userId = currentUser?.uid;

  // Combine state for all sections
  const [knowledgeData, setKnowledgeData] = useState({
      information: '',
      linkUrl: '',
      file: null,
      fileName: '',
      fileUsage: '',
      qaQuestion: '',
      qaAnswer: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [initialAgentData, setInitialAgentData] = useState(null);

  // --- Fetch existing knowledge data on component mount ---
  useEffect(() => {
    const fetchAgentKnowledge = async () => {
      if (!userId || !agentId) return;
      try {
        const response = await getAgent(userId, agentId);
        if (response.success && response.data?.knowledge) {
          setInitialAgentData(response.data);
          setKnowledgeData({
            information: response.data.knowledge.information || '',
            linkUrl: response.data.knowledge.urls?.[0] || '',
            file: null,
            fileName: response.data.knowledge.files?.[0]?.name || '',
            fileUsage: response.data.knowledge.files?.[0]?.usage || '',
            qaQuestion: response.data.knowledge.qandas?.[0]?.question || '',
            qaAnswer: response.data.knowledge.qandas?.[0]?.answer || '',
          });
        } else {
          console.error("Failed to fetch agent knowledge:", response.message);
        }
      } catch (error) {
        console.error("Error fetching agent knowledge:", error);
      }
    };
    fetchAgentKnowledge();
  }, [userId, agentId]);

  const handleChange = (e) => {
      const { name, value } = e.target;
      setKnowledgeData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
      const file = e.target.files[0];
      if (file) {
          setKnowledgeData(prev => ({
              ...prev,
              file: file,
              fileName: file.name
            }));
      }
  };

  const handleSave = async () => {
    if (!userId || !agentId || !initialAgentData) {
        alert("Error: No se pudo obtener la información del usuario o del agente.");
        return;
    }
    setIsSaving(true);
    console.log("Guardando base de conocimientos (Data):", knowledgeData);

    try {
        const updatedKnowledge = {
            information: knowledgeData.information || '',
            urls: knowledgeData.linkUrl ? [knowledgeData.linkUrl] : [],
            qandas: (knowledgeData.qaQuestion && knowledgeData.qaAnswer)
                ? [{ question: knowledgeData.qaQuestion, answer: knowledgeData.qaAnswer }]
                : [],
            files: initialAgentData.knowledge?.files || [],
        };

        if(knowledgeData.fileName && knowledgeData.fileUsage && updatedKnowledge.files.length > 0) {
            const fileIndex = updatedKnowledge.files.findIndex(f => f.name === knowledgeData.fileName);
            if(fileIndex !== -1) {
                updatedKnowledge.files[fileIndex].usage = knowledgeData.fileUsage;
            } else {
                console.warn("File usage specified but file not found or upload not implemented");
            }
        }

        const agentDataToUpdate = {
            ...initialAgentData,
            knowledge: updatedKnowledge
        };
        delete agentDataToUpdate.id;

        const response = await updateAgent(userId, agentId, agentDataToUpdate);

        if (response.success) {
            alert("Base de conocimientos actualizada correctamente.");
            setInitialAgentData(prev => ({...prev, knowledge: updatedKnowledge}));
        } else {
            console.error("Error saving knowledge base:", response.message);
            alert(`Error al guardar: ${response.message || 'Error desconocido'}`);
        }

    } catch (error) {
        console.error("API call failed:", error);
        alert(`Error de conexión al guardar: ${error.message}`);
    } finally {
        setIsSaving(false);
    }
};

  return (
    <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
       <h2 className="text-xl font-semibold text-gray-800 mb-1">Base de Conocimientos</h2>
       <p className="text-sm text-gray-500 mb-6">Entrene a su agente para que ofrezca respuestas contextualizadas que aseguren respuestas precisas.</p>

       <div className="bg-white rounded-lg shadow-sm border border-gray-200 divide-y divide-gray-200">
           <InformationSection data={knowledgeData} handleChange={handleChange} />
           <LinkSection data={knowledgeData} handleChange={handleChange} />
           <FileUploadSection data={knowledgeData} handleChange={handleChange} handleFileChange={handleFileChange} />
           <QandASection data={knowledgeData} handleChange={handleChange} />
       </div>

       <div className="mt-8 flex justify-end">
           <button
             type="submit"
             disabled={isSaving}
             className={`inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
               isSaving ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
             }`}
           >
             {isSaving ? (
                <>
                 <ArrowPathIcon className="-ml-1 mr-2 h-5 w-5 animate-spin" />
                 Guardando...
                </>
             ) : (
                <>
                 <ArrowPathIcon className="-ml-1 mr-2 h-5 w-5" />
                 Guardar Cambios
                </>
             )}
           </button>
       </div>
    </form>
  );
}

export default KnowledgeBasePage; 