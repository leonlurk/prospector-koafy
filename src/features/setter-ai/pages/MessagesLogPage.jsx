import React, { useState, useEffect, useCallback } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import Textarea from '../components/Textarea';
import { getMessages, sendMessage, initiateConversation } from '../services/api';

// Icono Placeholder para refrescar
const ArrowPathIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
  </svg>
);

function MessagesLogPage() {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Estados para nuevos formularios
  const [sendNumber, setSendNumber] = useState('');
  const [sendMessageText, setSendMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendFeedback, setSendFeedback] = useState({ message: '', success: false });

  const [initiateNumber, setInitiateNumber] = useState('');
  const [initiatePrompt, setInitiatePrompt] = useState('');
  const [isInitiating, setIsInitiating] = useState(false);
  const [initiateFeedback, setInitiateFeedback] = useState({ message: '', success: false });

  const fetchMessages = useCallback(async () => {
    if (!isRefreshing) setIsLoading(true);
    setError(null);
    try {
      const fetchedMessages = await getMessages();
      // El backend devuelve los mensajes más recientes al final,
      // pero para mostrarlos es más útil tener los más nuevos arriba.
      setMessages(Array.isArray(fetchedMessages) ? fetchedMessages.reverse() : []);
    } catch (err) {
      console.error("Error fetching messages:", err);
      setError(err.message || 'Error al cargar los mensajes.');
      setMessages([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [isRefreshing]);

  useEffect(() => {
    fetchMessages();
    // Podríamos añadir un intervalo de refresco si se quiere,
    // pero para logs puede ser suficiente con refresco manual.
    // const intervalId = setInterval(fetchMessages, 15000); // Cada 15 seg
    // return () => clearInterval(intervalId);
  }, [fetchMessages]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    // fetchMessages se llamará por el cambio de estado en la dependencia del useCallback
  };

  const formatSender = (from) => {
      if (!from) return 'Desconocido';
      if (from.startsWith('me (')) return 'Agente IA';
      // Extraer número de 'numero@c.us'
      const match = from.match(/^(\d+)@c\.us$/);
      return match ? `Usuario (${match[1]})` : from; // Mostrar ID completo si no es formato estándar
  }

  // --- Handlers para enviar mensaje --- 
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!sendNumber.trim() || !sendMessageText.trim()) return;
    setIsSending(true);
    setSendFeedback({ message: '', success: false });
    try {
      const result = await sendMessage(sendNumber, sendMessageText);
      setSendFeedback({ message: result.message || 'Mensaje enviado con éxito', success: result.success });
      if (result.success) {
        setSendMessageText(''); // Limpiar solo el mensaje, mantener número?
        // No limpiamos el número por si quiere enviar varios
        fetchMessages(); // Refrescar logs para ver el mensaje enviado
        setTimeout(() => setSendFeedback({ message: '', success: false }), 4000);
      }
    } catch (err) {
      console.error("Error sending message:", err);
      setSendFeedback({ message: err.message || 'Error al enviar mensaje.', success: false });
    } finally {
      setIsSending(false);
    }
  };

  // --- Handlers para iniciar conversación IA --- 
  const handleInitiateConversation = async (e) => {
    e.preventDefault();
    if (!initiateNumber.trim() || !initiatePrompt.trim()) return;
    setIsInitiating(true);
    setInitiateFeedback({ message: '', success: false });
    try {
      const result = await initiateConversation(initiateNumber, initiatePrompt);
      // La API devuelve el mensaje enviado por la IA en result.openingMessage
      const feedbackMsg = result.success
          ? `Conversación iniciada. Mensaje enviado: "${result.openingMessage}"`
          : result.message || 'Error al iniciar conversación.';
      setInitiateFeedback({ message: feedbackMsg, success: result.success });

      if (result.success) {
        setInitiatePrompt(''); // Limpiar prompt, mantener número?
        fetchMessages(); // Refrescar logs
        setTimeout(() => setInitiateFeedback({ message: '', success: false }), 6000); // Más tiempo para leer el mensaje enviado
      }
    } catch (err) {
      console.error("Error initiating conversation:", err);
      setInitiateFeedback({ message: err.message || 'Error al iniciar conversación.', success: false });
    } finally {
      setIsInitiating(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-text-main">Acciones Directas y Logs</h2>
        <Button onClick={handleRefresh} variant="secondary" size="sm" disabled={isRefreshing || isLoading}>
          <ArrowPathIcon className={`w-4 h-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Refrescando...' : 'Refrescar Logs'}
        </Button>
      </div>

      {/* Sección de Acciones Directas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Enviar Mensaje Manual */}
        <Card>
          <h3 className="text-lg font-medium text-text-main mb-4">Enviar Mensaje Manual</h3>
          <form onSubmit={handleSendMessage} className="space-y-4">
            <Input
              id="send-number"
              label="Número Destino (con código país)"
              placeholder="Ej: 5491123456789"
              value={sendNumber}
              onChange={(e) => setSendNumber(e.target.value)}
              required
              disabled={isSending}
            />
            <Textarea
              id="send-message-text"
              label="Mensaje"
              rows={3}
              placeholder="Escribe tu mensaje aquí..."
              value={sendMessageText}
              onChange={(e) => setSendMessageText(e.target.value)}
              required
              disabled={isSending}
            />
            {sendFeedback.message && (
              <p className={`text-sm ${sendFeedback.success ? 'text-green-600' : 'text-red-500'}`}>
                {sendFeedback.message}
              </p>
            )}
            <Button type="submit" disabled={isSending || !sendNumber.trim() || !sendMessageText.trim()}>
              {isSending ? 'Enviando...' : 'Enviar Mensaje'}
            </Button>
          </form>
        </Card>

        {/* Iniciar Conversación IA */}
        <Card>
           <h3 className="text-lg font-medium text-text-main mb-4">Iniciar Conversación con IA</h3>
            <form onSubmit={handleInitiateConversation} className="space-y-4">
             <Input
               id="initiate-number"
               label="Número Destino (con código país)"
               placeholder="Ej: 5491198765432"
               value={initiateNumber}
               onChange={(e) => setInitiateNumber(e.target.value)}
               required
               disabled={isInitiating}
             />
             <Textarea
               id="initiate-prompt"
               label="Prompt para Mensaje de Apertura"
               rows={3}
               placeholder="Describe brevemente el objetivo. Ej: Recordarle sobre la reunión de mañana."
               value={initiatePrompt}
               onChange={(e) => setInitiatePrompt(e.target.value)}
               required
               disabled={isInitiating}
             />
             {initiateFeedback.message && (
               <p className={`text-sm ${initiateFeedback.success ? 'text-green-600' : 'text-red-500'}`}>
                 {initiateFeedback.message}
               </p>
             )}
             <Button type="submit" disabled={isInitiating || !initiateNumber.trim() || !initiatePrompt.trim()}>
               {isInitiating ? 'Iniciando...' : 'Iniciar con IA'}
             </Button>
           </form>
        </Card>
      </div>

      {/* Historial de Mensajes (Logs) */}
      <Card>
          <h3 className="text-lg font-medium text-text-main mb-4">Historial de Mensajes Recientes</h3>
        {isLoading ? (
          <p className="text-text-muted text-center py-8">Cargando historial...</p>
        ) : error ? (
          <p className="text-red-500 text-center py-8">Error al cargar logs: {error}</p>
        ) : messages.length === 0 ? (
          <p className="text-text-muted text-center py-8">No hay mensajes registrados.</p>
        ) : (
          <ul className="divide-y divide-border-color max-h-[500px] overflow-y-auto border border-border-main rounded-md">
            {messages.map((msg, index) => (
              <li key={index} className="py-3 px-4 hover:bg-surface transition-colors duration-150">
                 <div className="flex justify-between items-baseline mb-1">
                    <p className={`text-sm font-medium ${msg.from.startsWith('me (') ? 'text-primary' : 'text-text-main'}`}>
                        {formatSender(msg.from)}
                        {msg.to && <span className='text-text-muted font-normal'> → {formatSender(msg.to)}</span>}
                    </p>
                     <p className="text-xs text-text-muted">{msg.timestamp || ''}</p>
                 </div>
                 <p className="text-sm text-text-main whitespace-pre-wrap">{msg.body}</p>
                 {msg.prompt && (
                     <p className="text-xs text-blue-600 mt-1 bg-blue-50 p-1 rounded border border-blue-200">Prompt usado: {msg.prompt}</p>
                 )}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

export default MessagesLogPage; 