import { useState, useEffect, useCallback  } from "react";
import PropTypes from 'prop-types';
import { FaArrowRight, FaTimes } from "react-icons/fa";
import { collection, addDoc, getDocs } from "firebase/firestore";
import { db } from "../firebaseConfig";
import logApiRequest from "../requestLogger";
import { instagramApi } from "../instagramApi"; 
import { checkBlacklistedUsers } from "../blacklistUtils";
import { createCampaignOptions, startCampaignMonitoring } from "../campaignIntegration";
import { createCampaign as createCampaignStore, updateCampaign, ensureUserExists } from '../campaignStore';
import WhitelistSelector from './WhitelistSelector';

// Componentes
import UsersList from './UsersList';
import MessagePanel from './MessagePanel';
import MediaPanel from './MediaPanel';
import LikesPanel from './LikesPanel';
import BlacklistModal from './BlacklistModal';
import LoadingOverlay from './LoadingOverlay';

const NuevaCampanaModal = ({ isOpen, onClose, user, instagramToken }) => {
  // Estados principales
  const [step, setStep] = useState(1);
  const [campaignName, setCampaignName] = useState("");
  const [targetLink, setTargetLink] = useState("");
  const [targetType, setTargetType] = useState("");
  const [isProspecting, setIsProspecting] = useState(false);
  const [users, setUsers] = useState([]);
  const [mensaje, setMensaje] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [templates, setTemplates] = useState([]);
  const [showWhitelistModal, setShowWhitelistModal] = useState(false);
  const [lastWhitelistOperation, setLastWhitelistOperation] = useState(null);
  // Crear un nombre de campaña significativo si no se proporciona
  
  // Estados para multimedia
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [mediaType, setMediaType] = useState("image");
  const [mediaCaption, setMediaCaption] = useState("");
  
  // Estados para filtrado y procesamiento
  const [showBlacklist, setShowBlacklist] = useState(false);
  const [filteredUsers, setFilteredUsers] = useState(null);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState("");
  
  // Estados para configuración de campaña
  const [selectedObjective, setSelectedObjective] = useState("");
  
  const [filters, setFilters] = useState({
    genero: false
  });
  
  const [tasks, setTasks] = useState({
    seguir: false,
    enviarMensaje: false,
    darLikes: false,
    comentar: false,
    enviarMedia: false
  });
  
  const fetchTemplates = useCallback(async () => {
    if (!user?.uid) return;
    
    try {
      const templatesRef = collection(db, "users", user.uid, "templates");
      const templatesSnapshot = await getDocs(templatesRef);
      const templatesList = templatesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTemplates(templatesList);
    } catch (error) {
      console.error("Error al cargar plantillas:", error);
    }
  }, [user]);
  const updateProgress = (percentage, message = "") => {
    setProgress(percentage);
    if (message) setProgressMessage(message);
  };
  
  const removeUser = (username) => {
    console.log("Removing user:", username);
    console.log("Users before removal:", users);
    
    // Create a new filtered array excluding the specified username
    const updatedUsers = users.filter(user => user !== username);
    
    console.log("Users after removal:", updatedUsers);
    
    // Update the state with the new filtered array
    setUsers(updatedUsers);
    
    // If we've already done filtering for blacklisted users, update that state too
    if (filteredUsers) {
      const updatedFilteredUsers = {
        ...filteredUsers,
        original: updatedUsers.length,
        // If the removed user was in the filtered list, update it
        filtered: filteredUsers.blacklistedUsers.includes(username) 
          ? filteredUsers.filtered 
          : filteredUsers.filtered - 1,
      };
      setFilteredUsers(updatedFilteredUsers);
    }
  };
  
  const updateFilteredUsersState = (filteredResult) => {
    setFilteredUsers({
      original: users.length,
      filtered: filteredResult.length,
      blacklistedCount: users.length - filteredResult.length,
      blacklistedUsers: users.filter(u => !filteredResult.includes(u))
    });
  };

  const handleTaskError = async (error, campaignId, stopMonitoring, endpoint, action) => {
    updateProgress(100, `Error en la operación: ${error.message}`);
    console.error(`Error al ejecutar ${action}:`, error);
    setError(`Error en la operación: ${error.message}`);
    
    if (campaignId && user?.uid) {
      await updateCampaign(user.uid, campaignId, {
        status: "failed",
        progress: 100,
        error: error.message,
        endedAt: new Date()
      });
      
      if (stopMonitoring) stopMonitoring();
    }
    
    if (user) {
      await logApiRequest({
        endpoint: endpoint,
        requestData: { 
          usuarios_count: users.length,
          campaign_id: campaignId
        },
        userId: user.uid,
        status: "error",
        source: "NuevaCampanaModal",
        metadata: {
          action: action,
          error: error.message,
          usersCount: users.length,
          postLink: targetLink,
          campaignId: campaignId
        }
      });
    }
  };
  
  // Reset del estado cuando se abre/cierra el modal

  useEffect(() => {
    if (isOpen && user?.uid) {
      fetchTemplates();
    }
  }, [isOpen, user, fetchTemplates]);
  
  // Manejadores para obtener usuarios
  const getLikesFromPost = async () => {
    if (!targetLink.trim()) {
      setError("Debes ingresar un enlace a una publicación");
      return false;
    }
    
    setLoading(true);
    setError("");
    
    try {
      console.log("Starting getLikesFromPost with link:", targetLink, "token:", instagramToken?.substring(0, 15) + "...");
      
      if (user) {
        await logApiRequest({
          endpoint: "/obtener_likes",
          requestData: { link: targetLink },
          userId: user.uid,
          status: "pending",
          source: "NuevaCampanaModal",
          metadata: { action: "get_likes", postLink: targetLink }
        });
      }
      
      console.log("Before API call to getLikes");
      const data = await instagramApi.getLikes(targetLink, instagramToken);
      console.log("After API call, received data:", data);
      
      if (user) {
        await logApiRequest({
          endpoint: "/obtener_likes",
          requestData: { link: targetLink },
          userId: user.uid,
          responseData: { 
            status: data.status,
            likesCount: data.likes?.length || 0
          },
          status: data.status === "success" ? "success" : "completed",
          source: "NuevaCampanaModal",
          metadata: {
            action: "get_likes",
            postLink: targetLink,
            usersCount: data.likes?.length || 0
          }
        });
      }
      
      if (data.status === "success") {
        console.log("Success! Setting users with", data.likes?.length, "users");
        console.log("Sample users:", data.likes?.slice(0, 3));
        setUsers(data.likes);
        setTimeout(() => {
          setStep(step + 1);
        }, 150);
        return true;
      } else {
        console.log("Setting error - API returned:", data.status, data.message || "No message");
        setError("Error al obtener likes: " + (data.message || "Error desconocido"));
        return false;
      }
    } catch (error) {
      console.error("Exception in getLikesFromPost:", error);
      console.log("Setting error message:", "Error de conexión o problema de red.");
      setError("Error de conexión o problema de red.");
      
      if (user) {
        await logApiRequest({
          endpoint: "/obtener_likes",
          requestData: { link: targetLink },
          userId: user.uid,
          status: "error",
          source: "NuevaCampanaModal",
          metadata: {
            action: "get_likes",
            error: error.message,
            postLink: targetLink
          }
        });
      }
      return false;
    } finally {
      setLoading(false);
      console.log("getLikesFromPost completed");
    }
  };
  
  const getCommentsFromPost = async () => {
    if (!targetLink.trim()) {
      setError("Debes ingresar un enlace a una publicación");
      return false;
    }
    
    setLoading(true);
    setError("");
    
    try {
      if (user) {
        await logApiRequest({
          endpoint: "/get_comments",
          requestData: { post_url: targetLink },
          userId: user.uid,
          status: "pending",
          source: "NuevaCampanaModal",
          metadata: { action: "get_comments", postLink: targetLink }
        });
      }
      
      const data = await instagramApi.getComments(targetLink, instagramToken);
      
      if (user) {
        await logApiRequest({
          endpoint: "/get_comments",
          requestData: { post_url: targetLink },
          userId: user.uid,
          responseData: { 
            status: data.status,
            commentsCount: data.comments?.length || 0
          },
          status: data.status === "success" ? "success" : "completed",
          source: "NuevaCampanaModal",
          metadata: {
            action: "get_comments",
            postLink: targetLink,
            commentsCount: data.comments?.length || 0
          }
        });
      }
      
      if (data.status === "success" && data.comments) {
        const commentUsers = data.comments.map(comment => comment.user);
        setUsers(commentUsers);
        return true;
      } else {
        setError("Error al obtener comentarios: " + (data.message || "Error desconocido"));
        return false;
      }
    } catch (error) {
      console.error("Error obteniendo comentarios:", error);
      setError("Error de conexión o problema de red");
      
      if (user) {
        await logApiRequest({
          endpoint: "/get_comments",
          requestData: { post_url: targetLink },
          userId: user.uid,
          status: "error",
          source: "NuevaCampanaModal",
          metadata: {
            action: "get_comments",
            error: error.message,
            postLink: targetLink
          }
        });
      }
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  const getFollowersFromProfile = async () => {
    const usernameMatch = targetLink.match(/instagram\.com\/([^/?]+)/);
    if (!usernameMatch || !usernameMatch[1]) {
      setError("No se pudo extraer el nombre de usuario del enlace de perfil");
      return false;
    }
    
    const username = usernameMatch[1];
    setLoading(true);
    setError("");
    
    try {
      if (user) {
        await logApiRequest({
          endpoint: "/get_followers",
          requestData: { username, amount: 50 },
          userId: user.uid,
          status: "pending",
          source: "NuevaCampanaModal",
          metadata: { action: "get_followers", username, amount: 50 }
        });
      }
      
      const data = await instagramApi.getFollowers(username, instagramToken);
      
      if (user) {
        await logApiRequest({
          endpoint: "/get_followers",
          requestData: { username, amount: 50 },
          userId: user.uid,
          responseData: { 
            status: data.status,
            followersCount: data.followers?.length || 0
          },
          status: data.status === "success" ? "success" : "completed",
          source: "NuevaCampanaModal",
          metadata: {
            action: "get_followers",
            username,
            followersCount: data.followers?.length || 0
          }
        });
      }
      
      if (data.status === "success" && data.followers) {
        setUsers(data.followers);
        return true;
      } else {
        setError("Error al obtener seguidores: " + (data.message || "Error desconocido"));
        return false;
      }
    } catch (error) {
      console.error("Error obteniendo seguidores:", error);
      setError("Error de conexión o problema de red");
      
      if (user) {
        await logApiRequest({
          endpoint: "/get_followers",
          requestData: { username, amount: 50 },
          userId: user.uid,
          status: "error",
          source: "NuevaCampanaModal",
          metadata: {
            action: "get_followers",
            error: error.message,
            username
          }
        });
      }
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  // Funciones para acciones principales
  const followAllUsers = async () => {
    if (result.length === 0) {
      setError("No hay usuarios para seguir");
      return;
    }
    
    const result = await checkBlacklistedUsers(users, user, (msg) => setError(msg), "NuevaCampanaModal");
    updateFilteredUsersState(result);
  
    if (result.length === 0) {
      setError("Todos los usuarios están en listas negras. No se siguió a ningún usuario.");
      return;
    }
  
    setLoading(true);
    setError("");
    updateProgress(0, "Iniciando proceso de seguimiento...");
    
    let campaignId = null;
    let stopMonitoring = null;
    
    try {
      updateProgress(10, "Preparando campaña de seguimiento...");
      
      if (user?.uid) {

        const effectiveCampaignName = campaignName || `Mensajes a ${result.length} usuarios - ${new Date().toLocaleDateString()}`;

        const campaignOptions = createCampaignOptions({
          type: "send_messages",
          name: effectiveCampaignName,
          users: result,
          endpoint: "/enviar_mensajes_multiple",
          templateName: selectedTemplate?.name || null,
          postLink: targetLink,
          message: mensaje.substring(0, 100) + (mensaje.length > 100 ? "..." : "")
        });
        
        campaignId = await createCampaignStore(user.uid, campaignOptions);
        stopMonitoring = startCampaignMonitoring(user.uid, campaignId, { token: instagramToken });
      }
      
      updateProgress(20, "Registrando operación...");
      
      if (user) {
        await logApiRequest({
          endpoint: "/seguir_usuarios",
          requestData: { usuarios_count: users.length, campaign_id: campaignId },
          userId: user.uid,
          status: "pending",
          source: "NuevaCampanaModal",
          metadata: {
            action: "follow_users",
            usersCount: users.length,
            postLink: targetLink,
            campaignId: campaignId
          }
        });
      }
      
      updateProgress(40, `Enviando solicitud para seguir a ${result.length} usuarios...`);
      const data = await instagramApi.followUsers(result, instagramToken);
      updateProgress(70, "Procesando resultados...");
      
      if (campaignId) {
        await updateCampaign(user.uid, campaignId, {
          progress: 10,
          initialResponse: data,
          filteredUsers: result.length,
          blacklistedUsers: users.length - result.length
        });
      }
      
      updateProgress(85, "Finalizando operación...");
      
      if (user) {
        await logApiRequest({
          endpoint: "/seguir_usuarios",
          requestData: { 
            usuarios_count: users.length,
            filtered_users_count: result.length,
            campaign_id: campaignId
          },
          userId: user.uid,
          responseData: { 
            status: data.status,
            followedCount: data.followed_count || 0,
            skippedCount: data.skipped_count || 0,
            blacklistedCount: users.length - result.length,
            campaignId: campaignId
          },
          status: data.status === "success" ? "success" : "completed",
          source: "NuevaCampanaModal",
          metadata: {
            action: "follow_users",
            usersCount: users.length,
            filteredUsersCount: result.length,
            blacklistedCount: users.length - result.length,
            postLink: targetLink,
            followedCount: data.followed_count || 0,
            skippedCount: data.skipped_count || 0,
            campaignId: campaignId
          }
        });
      }
      
      updateProgress(100, `Seguimiento de usuarios iniciado exitosamente`);
      setError(null);
      alert("Seguimiento en proceso. Se ha creado una campaña para seguir el progreso.");
      setStep(4);
      
    } catch (error) {
      handleTaskError(error, campaignId, stopMonitoring, "/seguir_usuarios", "follow_users");
    } finally {
      setLoading(false);
    }
  };
  
  const sendMessages = async () => {
    if (users.length === 0) {
      setError("No hay usuarios para enviar mensajes");
      return;
    }
    
    // Solo validar mensaje vacío si no estamos enviando media
    if (!tasks.enviarMedia && (!mensaje || !mensaje.trim())) {
      console.error("Empty message detected:", mensaje);
      setError("El mensaje no puede estar vacío. Por favor, escribe un mensaje.");
      return;
    }
    
    // Log message content for debugging
    console.log("Sending message content:", mensaje);
    console.log("Message length:", mensaje ? mensaje.length : 0);
    
    const result = await checkBlacklistedUsers(users, user, (msg) => setError(msg), "NuevaCampanaModal");
    updateFilteredUsersState(result);
    
    if (result.length === 0) {
      setError("Todos los usuarios están en listas negras. No se enviaron mensajes.");
      return;
    }
    
    // Add debug logging
    console.log("Message to send:", mensaje);
    console.log("Original users:", users);
    console.log("Filtered users for sending:", result);
    
    setLoading(true);
    setError("");
    updateProgress(0, "Iniciando envío de mensajes...");
    
    let campaignId = null;
    let stopMonitoring = null;
    
    try {
      updateProgress(10, "Preparando campaña de mensajes...");
      
      if (user?.uid) {
        // Definir un nombre efectivo para la campaña - ESTO ES LO QUE FALTA
        const effectiveCampaignName = campaignName || `Mensajes a ${result.length} usuarios - ${new Date().toLocaleDateString()}`;
        
        // En sendMessages, creación de opciones de campaña
        const campaignOptions = createCampaignOptions({
          type: "send_messages",
          name: effectiveCampaignName,  // Ahora usa la variable definida arriba
          users: result,  
          endpoint: "/enviar_mensajes_multiple",
          templateName: selectedTemplate?.name || null,
          postLink: targetLink,
          message: mensaje ? mensaje.substring(0, 100) + (mensaje.length > 100 ? "..." : "") : ""
        });
        
        try {
          await ensureUserExists(user.uid);
          campaignId = await createCampaignStore(user.uid, campaignOptions);
          
          if (campaignId) {
            stopMonitoring = startCampaignMonitoring(user.uid, campaignId, { token: instagramToken });
          }
        } catch (campaignError) {
          console.error("Error al crear la campaña:", campaignError);
        }
      }
      
      updateProgress(20, "Registrando operación...");
      
      if (user) {
        await logApiRequest({
          endpoint: "/enviar_mensajes_multiple",
          requestData: { 
            usuarios_count: result.length,  // CHANGED: Use filtered count instead of total count
            mensaje_length: mensaje.length,
            template_id: selectedTemplate ? selectedTemplate.id : null,
            campaign_id: campaignId || null
          },
          userId: user.uid,
          status: "pending",
          source: "NuevaCampanaModal",
          metadata: {
            action: "send_messages",
            usersCount: result.length,  // CHANGED: Use filtered count
            messageLength: mensaje.length,
            templateId: selectedTemplate ? selectedTemplate.id : null,
            templateName: selectedTemplate ? selectedTemplate.name : null, 
            postLink: targetLink || null,
            campaignId: campaignId || null
          }
        });
      }
      
      updateProgress(40, `Enviando mensajes a ${result.length} usuarios...`);
      const data = await instagramApi.sendMessages(result, mensaje, false, instagramToken);
      updateProgress(70, "Procesando resultados...");
      
      if (campaignId) {
        await updateCampaign(user.uid, campaignId, {
          progress: 80,
          initialResponse: data,
          filteredUsers: result.length,
          blacklistedUsers: users.length - result.length
        });
      }
      
      updateProgress(90, "Finalizando envío de mensajes...");
      
      if (user) {
        await logApiRequest({
          endpoint: "/enviar_mensajes_multiple",
          requestData: { 
            usuarios_count: users.length,
            mensaje_length: mensaje.length,
            template_id: selectedTemplate?.id,
            filtered_users_count: result.length,
            campaign_id: campaignId
          },
          userId: user.uid,
          responseData: { 
            status: data.status,
            sentCount: data.sent_count || 0,
            failedCount: data.failed_count || 0,
            blacklistedCount: users.length - result.length,
            campaignId: campaignId
          },
          status: data.status === "success" ? "success" : "completed",
          source: "NuevaCampanaModal",
          metadata: {
            action: "send_messages",
            usersCount: users.length,
            filteredUsersCount: result.length,
            blacklistedCount: users.length - result.length,
            messageLength: mensaje.length,
            templateId: selectedTemplate?.id,
            templateName: selectedTemplate?.name,
            postLink: targetLink,
            sentCount: data.sent_count || 0,
            failedCount: data.failed_count || 0,
            campaignId: campaignId
          }
        });
      }
      
      updateProgress(100, `Mensajes enviados exitosamente a ${data.sent_count || 0} usuarios`);
      setError(null);
      setStep(4);
      
    } catch (error) {
      handleTaskError(error, campaignId, stopMonitoring, "/enviar_mensajes_multiple", "send_messages");
    } finally {
      setLoading(false);
    }
  };
  
  const commentOnLatestPosts = async () => {
    if (users.length === 0) {
      setError("No hay usuarios para comentar en sus publicaciones");
      return;
    }
    
    if (!mensaje.trim()) {
      setError("Debes escribir un comentario para enviar");
      return;
    }
    
    const result = await checkBlacklistedUsers(users, user, (msg) => setError(msg), "NuevaCampanaModal");
    updateFilteredUsersState(result);
  
    if (result.length === 0) {
      setError("Todos los usuarios están en listas negras. No se realizaron comentarios.");
      return;
    }
    
    setLoading(true);
    setError("");
    updateProgress(0, "Iniciando proceso de comentarios...");
    
    let campaignId = null;
    let stopMonitoring = null;
    
    try {
      updateProgress(10, "Preparando campaña de comentarios...");
      
      if (user?.uid) {
        const campaignOptions = createCampaignOptions({
          type: "comment_posts",
          users: users,
          endpoint: "/comment_latest_post",
          message: mensaje.substring(0, 50) + "...",
          postLink: targetLink
        });
        
        campaignId = await createCampaignStore(user.uid, campaignOptions);
        stopMonitoring = startCampaignMonitoring(user.uid, campaignId, { token: instagramToken });
      }
      
      updateProgress(20, "Registrando operación...");
      
      if (user) {
        await logApiRequest({
          endpoint: "/comment_latest_post",
          requestData: { 
            usuarios_count: users.length,
            message: mensaje,
            campaign_id: campaignId
          },
          userId: user.uid,
          status: "pending",
          source: "NuevaCampanaModal",
          metadata: {
            action: "comment_posts",
            usersCount: users.length,
            messageLength: mensaje.length,
            postLink: targetLink,
            campaignId: campaignId
          }
        });
      }
      
      updateProgress(40, `Preparando comentarios para ${result.length} publicaciones...`);
      
      // Simulación (implementar cuando exista el endpoint real)
      updateProgress(50, "Enviando comentarios...");
      await new Promise(resolve => setTimeout(resolve, 2000));
      updateProgress(70, "Procesando resultados...");
      
      if (user) {
        await logApiRequest({
          endpoint: "/comment_latest_post",
          requestData: { 
            usuarios_count: users.length,
            filtered_users_count: result.length,
            message: mensaje,
            campaign_id: campaignId
          },
          userId: user.uid,
          responseData: { 
            status: "success",
            commentedCount: result.length,
            failedCount: 0,
            blacklistedCount: users.length - result.length,
            campaignId: campaignId
          },
          status: "success",
          source: "NuevaCampanaModal",
          metadata: {
            action: "comment_posts",
            usersCount: users.length,
            filteredUsersCount: result.length,
            blacklistedCount: users.length - result.length,
            messageLength: mensaje.length,
            postLink: targetLink,
            commentedCount: result.length,
            failedCount: 0,
            campaignId: campaignId
          }
        });
      }
      
      updateProgress(90, "Finalizando operación...");
      
      if (campaignId) {
        await updateCampaign(user.uid, campaignId, {
          status: "completed",
          progress: 100,
          endedAt: new Date(),
          successCount: result.length,
          failedCount: 0
        });
      }
      
      updateProgress(100, `Comentarios programados para ${result.length} publicaciones`);
      setError(null);
      alert(`Se han programado comentarios para ${result.length} publicaciones`);
      setStep(4);
      
    } catch (error) {
      handleTaskError(error, campaignId, stopMonitoring, "/comment_latest_post", "comment_posts");
    } finally {
      setLoading(false);
    }
  };
  
  const likeLatestPosts = async () => {
    if (users.length === 0) {
      setError("No hay usuarios para dar like a sus publicaciones");
      return;
    }
    
    const result = await checkBlacklistedUsers(users, user, (msg) => setError(msg), "NuevaCampanaModal");
    updateFilteredUsersState(result);
  
    if (result.length === 0) {
      setError("Todos los usuarios están en listas negras. No se dieron likes.");
      return;
    }
    
    setLoading(true);
    setError("");
    updateProgress(0, "Iniciando proceso de likes...");
    
    let campaignId = null;
    let stopMonitoring = null;
    
    try {
      if (user?.uid) {
        const campaignOptions = createCampaignOptions({
          type: "like_posts",
          users: users,
          endpoint: "/like_latest_post",
          postLink: targetLink
        });
        
        campaignId = await createCampaignStore(user.uid, campaignOptions);
        stopMonitoring = startCampaignMonitoring(user.uid, campaignId, { token: instagramToken });
      }
      
      if (user) {
        await logApiRequest({
          endpoint: "/like_latest_post",
          requestData: { 
            usuarios_count: users.length,
            campaign_id: campaignId
          },
          userId: user.uid,
          status: "pending",
          source: "NuevaCampanaModal",
          metadata: {
            action: "like_posts",
            usersCount: users.length,
            postLink: targetLink,
            campaignId: campaignId
          }
        });
      }
      
      // Procesar usuarios en secuencia
      let sucessCount = 0;
      let failedCount = 0;
      
      for (let i = 0; i < result.length; i++) {
        const username = result[i];
        
        try {
          if (campaignId) {
            await updateCampaign(user.uid, campaignId, {
              progress: Math.floor((i / result.length) * 100),
              currentUser: username,
              processedUsers: i,
              totalUsers: result.length
            });
          }
          
          const likeResult = await instagramApi.likeLatestPost(username);
          
          if (likeResult.status === "success") {
            sucessCount++;
          } else {
            failedCount++;
          }
          
          await new Promise(resolve => setTimeout(resolve, 1500));
          
        } catch (error) {
          console.error(`Error al dar like a las publicaciones de ${username}:`, error);
          failedCount++;
        }
      }
      
      if (campaignId) {
        await updateCampaign(user.uid, campaignId, {
          status: "completed",
          progress: 100,
          endedAt: new Date(),
          successCount: sucessCount,
          failedCount: failedCount
        });
      }
      
      if (user) {
        await logApiRequest({
          endpoint: "/like_latest_post",
          requestData: { 
            usuarios_count: users.length,
            filtered_users_count: result.length,
            campaign_id: campaignId
          },
          userId: user.uid,
          responseData: { 
            status: "success",
            likedCount: sucessCount,
            failedCount: failedCount,
            blacklistedCount: users.length - result.length,
            campaignId: campaignId
          },
          status: "success",
          source: "NuevaCampanaModal",
          metadata: {
            action: "like_posts",
            usersCount: users.length,
            filteredUsersCount: result.length,
            blacklistedCount: users.length - result.length,
            postLink: targetLink,
            likedCount: sucessCount,
            failedCount: failedCount,
            campaignId: campaignId
          }
        });
      }
      
      setError(null);
      alert(`Se han procesado likes para ${sucessCount} usuarios (fallidos: ${failedCount})`);
      setStep(4);
      
    } catch (error) {
      handleTaskError(error, campaignId, stopMonitoring, "/like_latest_post", "like_posts");
    } finally {
      setLoading(false);
    }
  };
  
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const fileType = file.type;
    if (fileType.startsWith('image/')) {
      setMediaType("image");
    } else if (fileType.startsWith('video/')) {
      setMediaType("video");
    } else {
      setError("Tipo de archivo no soportado. Por favor, selecciona una imagen o video.");
      return;
    }
    
    setMediaFile(file);
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setMediaPreview(reader.result);
    };
    reader.readAsDataURL(file);
    
    setError(null);
  };
  
  const sendMedia = async () => {
    if (users.length === 0) {
      setError("No hay usuarios para enviar medios");
      return;
    }
    
    if (!mediaFile) {
      setError("Debes seleccionar un archivo de imagen o video");
      return;
    }
  
    const result = await checkBlacklistedUsers(users, user, (msg) => setError(msg), "NuevaCampanaModal");
    updateFilteredUsersState(result);
  
    if (result.length === 0) {
      setError("Todos los usuarios están en listas negras. No se enviaron medios.");
      return;
    }
    
    setLoading(true);
    setError("");
    updateProgress(0, "Iniciando envío de medios...");
    
    let campaignId = null;
    let stopMonitoring = null;
    
    try {
      updateProgress(10, "Preparando archivo multimedia...");
      
      // Validaciones de archivo
      if (!mediaFile) {
        throw new Error("No se ha seleccionado ningún archivo multimedia");
      }
      
      // Verificación del tipo de archivo
      const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      const validVideoTypes = ['video/mp4', 'video/quicktime', 'video/webm'];
      
      if (mediaType === 'image' && !validImageTypes.includes(mediaFile.type)) {
        throw new Error(`Tipo de imagen no soportado: ${mediaFile.type}. Use: JPG, PNG, GIF o WebP`);
      }
      
      if (mediaType === 'video' && !validVideoTypes.includes(mediaFile.type)) {
        throw new Error(`Tipo de video no soportado: ${mediaFile.type}. Use: MP4, MOV o WebM`);
      }
      
      // Verificación de tamaño de archivo (máximo 100MB para simplificar)
      const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
      if (mediaFile.size > MAX_FILE_SIZE) {
        throw new Error(`El archivo es demasiado grande (${(mediaFile.size / (1024 * 1024)).toFixed(2)}MB). Máximo 100MB.`);
      }
      
      console.log("Verificaciones de archivo completadas:", {
        fileName: mediaFile.name,
        fileType: mediaFile.type,
        fileSize: `${(mediaFile.size / 1024).toFixed(2)}KB`,
        mediaType: mediaType
      });
      
      if (user?.uid) {
        const campaignOptions = createCampaignOptions({
          type: "send_media",
          users: users,
          endpoint: "/enviar_media",
          mediaType: mediaType,
          fileName: mediaFile?.name || "archivo.media",
          postLink: targetLink
        });
        
        await ensureUserExists(user.uid);
        campaignId = await createCampaignStore(user.uid, campaignOptions);
        
        if (campaignId) {
          stopMonitoring = startCampaignMonitoring(user.uid, campaignId, { token: instagramToken });
          console.log("Campaña creada con ID:", campaignId);
        }
      }
      
      updateProgress(20, "Registrando operación...");
      
      if (user) {
        await logApiRequest({
          endpoint: "/enviar_media",
          requestData: { 
            usuarios_count: users.length,
            media_type: mediaType,
            campaign_id: campaignId
          },
          userId: user.uid,
          status: "pending",
          source: "NuevaCampanaModal",
          metadata: {
            action: "send_media",
            usersCount: users.length,
            mediaType: mediaType,
            postLink: targetLink || null,
            campaignId: campaignId
          }
        });
        console.log("Operación registrada en logs");
      }
      
      updateProgress(30, `Enviando ${mediaType} a ${result.length} usuarios...`);
      
      console.log("Preparando llamada a instagramApi.sendMedia:", {
        resultLength: result.length,
        mediaType,
        hasMediaCaption: !!mediaCaption,
        mediaCaptionLength: mediaCaption ? mediaCaption.length : 0,
        hasInstagramToken: !!instagramToken,
        tokenPreview: instagramToken ? `${instagramToken.substring(0, 10)}...` : null
      });
      
      // Llamada a la API con el token incluido
      const data = await instagramApi.sendMedia(result, mediaFile, mediaType, mediaCaption, false, instagramToken);
      
      console.log("Respuesta de sendMedia recibida:", data);
      updateProgress(70, "Procesando resultados...");
      
      // Verificar que data tenga la estructura esperada
      if (!data || typeof data !== 'object') {
        throw new Error("Respuesta inválida del servidor");
      }
      
      if (data.status !== "success") {
        throw new Error(`Error del servidor: ${data.message || "Desconocido"}`);
      }
      
      if (campaignId) {
        await updateCampaign(user.uid, campaignId, {
          progress: 80,
          initialResponse: data,
          filteredUsers: result.length,
          blacklistedUsers: users.length - result.length
        });
        console.log("Campaña actualizada con la respuesta inicial");
      }
      
      updateProgress(90, "Finalizando envío de medios...");
      
      if (user) {
        await logApiRequest({
          endpoint: "/enviar_media",
          requestData: { 
            usuarios_count: users.length,
            filtered_users_count: result.length,
            media_type: mediaType,
            campaign_id: campaignId
          },
          userId: user.uid,
          responseData: { 
            status: data.status,
            sentCount: data.sent_count || 0,
            failedCount: data.failed_count || 0,
            blacklistedCount: users.length - result.length,
            campaignId: campaignId
          },
          status: data.status === "success" ? "success" : "completed",
          source: "NuevaCampanaModal",
          metadata: {
            action: "send_media",
            usersCount: users.length,
            filteredUsersCount: result.length,
            blacklistedCount: users.length - result.length,
            mediaType: mediaType,
            postLink: targetLink,
            sentCount: data.sent_count || 0,
            failedCount: data.failed_count || 0,
            campaignId: campaignId
          }
        });
        console.log("Operación finalizada y registrada en logs");
      }
      
      updateProgress(100, `Medios enviados exitosamente a ${data.sent_count || 0} usuarios`);
      setError(null);
      alert(`Medios enviados exitosamente a ${data.sent_count || 0} usuarios`);
      setStep(4);
      
    } catch (error) {
      console.error("Error detallado en sendMedia:", error);
      

      
      // Log detallado del error
      console.error({
        errorType: error.name,
        errorMessage: error.message,
        errorStack: error.stack,
        mediaType,
        fileInfo: mediaFile ? {
          name: mediaFile.name,
          type: mediaFile.type,
          size: mediaFile.size
        } : 'No file'
      });
      
      handleTaskError(error, campaignId, stopMonitoring, "/enviar_media", "send_media");
    } finally {
      setLoading(false);
    }
  };
  
  // Navegación y manejo de flujo
  const handleNext = async () => {
    setError("");
    
    if (step === 1) {
      if (!campaignName.trim()) {
        setError("Debes ingresar un nombre para la campaña");
        return;
      }
      if (!targetLink.trim()) {
        setError("Debes ingresar un link de perfil o publicación");
        return;
      }
      
      if (!targetLink.includes("instagram.com")) {
        setError("El enlace debe ser de Instagram");
        return;
      }
      
      setTargetType(targetLink.includes("/p/") ? "publicacion" : "perfil");
      setStep(step + 1);
      return;
    }
    
    if (step === 2) {
      if (!selectedObjective) {
        setError("Debes seleccionar un objetivo");
        return;
      }
      
      const hasTask = Object.values(tasks).some(val => val);
      if (!hasTask) {
        setError("Debes seleccionar al menos una tarea");
        return;
      }
      
      if (tasks.enviarMedia && !targetLink.includes("/p/")) {
        setError("Para enviar media, debes seleccionar una publicación en el paso 1");
        return;
      }
      
      let success = false;
      try {
        setLoading(true);
        
        if (selectedObjective === "likes") {
          success = await getLikesFromPost();
        } else if (selectedObjective === "comentarios") {
          success = await getCommentsFromPost();
        } else if (selectedObjective === "seguidores") {
          success = await getFollowersFromProfile();
        }
        
        if (success && users.length > 0) {
          const uniqueUsers = [...new Set(users)];
          if (uniqueUsers.length < users.length) {
            console.log(`Filtrados ${users.length - uniqueUsers.length} usuarios duplicados`);
            setUsers(uniqueUsers);
          }
          
          setStep(step + 1);
        } /* else if (users.length === 0) {
          setError("No se pudieron obtener usuarios para la campaña");
        } */
      } catch (error) {
        console.error("Error al obtener usuarios:", error);
        setError("Error al obtener usuarios: " + error.message);
      } finally {
        setLoading(false);
      }
      
      return;
    }
    
    // In handleNext function, modify the step 3 section:
// In handleNext function, step 3 section:
if (step === 3) {
  // Distinguir las validaciones según el tipo de tarea seleccionada
  if ((tasks.enviarMensaje || tasks.comentar) && !tasks.enviarMedia) {
    // Solo validar mensaje si la tarea es enviar mensaje o comentar (y no enviar media)
    if (!mensaje?.trim()) {
      setError("Debes escribir un mensaje para enviar");
      return;
    }
  }

 // Para tareas de media, solo validar el archivo de media
 if (tasks.enviarMedia && !mediaFile) {
  setError("Debes seleccionar un archivo de imagen o video para enviar");
  return;
}

if (users.length === 0) {
  setError("No hay usuarios para realizar acciones. Revisa los pasos anteriores.");
  return;
}
  
  if (users.length > 100) {
    const confirmContinue = window.confirm(`¿Estás seguro de querer procesar ${users.length} usuarios? Esto podría generar limitaciones en tu cuenta de Instagram.`);
    if (!confirmContinue) {
      return;
    }
  }
  
  try {
    // REMOVED: await createCampaign() - We'll let the individual action functions handle campaign creation
    
    // Execute the appropriate action based on selected tasks
    if (tasks.enviarMensaje) {
      await sendMessages();
      return;
    }
    
    if (tasks.enviarMedia && mediaFile) {
      await sendMedia();
      return;
    }
    
    if (tasks.darLikes) {
      await likeLatestPosts();
      return;
    }
    
    if (tasks.comentar) {
      await commentOnLatestPosts();
      return;
    }
  } catch (error) {
    console.error("Error al ejecutar la acción:", error);
    setError("Error al ejecutar la acción: " + error.message);
  }
}
  };
  
  const createCampaign = async () => {
    try {
      if (!user?.uid) {
        setError("Debes iniciar sesión para crear campañas");
        return;
      }
      
      setLoading(true);
      
      const campaignData = {
        name: campaignName,
        targetLink,
        targetType,
        isProspecting,
        objective: selectedObjective,
        filters,
        tasks,
        users: users.length,
        message: mensaje ? true : false,
        templateId: selectedTemplate?.id || null,
        createdAt: new Date(),
        status: "processing",
        progress: 0,
        userId: user.uid
      };
      
      const campaignsRef = collection(db, "users", user.uid, "campaigns");
      const docRef = await addDoc(campaignsRef, campaignData);
      
      await logApiRequest({
        endpoint: "internal/create_campaign",
        requestData: campaignData,
        userId: user.uid,
        status: "success",
        source: "NuevaCampanaModal",
        metadata: {
          action: "create_campaign",
          campaignId: docRef.id,
          campaignName
        }
      });
      
      // Ejecutar las tareas seleccionadas secuencialmente
      if (tasks.seguir) {
        await followAllUsers();
        return;
      }
      
      if (tasks.enviarMensaje) {
        await sendMessages();
        return;
      }
      
      if (tasks.enviarMedia && mediaFile) {
        await sendMedia();
        return;
      }
      
      if (tasks.darLikes) {
        await likeLatestPosts();
        return;
      }
      
      if (tasks.comentar) {
        await commentOnLatestPosts();
        return;
      }
      
      // Si no hay tareas que ejecutar inmediatamente
      setStep(4);
      setError(null);
      
    } catch (error) {
      console.error("Error al crear la campaña:", error);
      setError("Error al crear la campaña: " + error.message);
      
      await logApiRequest({
        endpoint: "internal/create_campaign",
        requestData: { campaignName },
        userId: user?.uid,
        status: "error",
        source: "NuevaCampanaModal",
        metadata: {
          action: "create_campaign",
          error: error.message
        }
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Render principal
  if (!isOpen) return null;
  
  return (
<div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-2 sm:p-4">
  <div className="bg-white rounded-3xl w-full max-w-6xl max-h-[90vh] overflow-auto">
    {/* Responsive header with adjusted padding */}
    <div className="flex justify-between items-center p-3 sm:p-4 border-b">
      <h2 className="text-lg sm:text-xl font-medium text-black">
        Nueva Campaña - Paso {step} de 4
      </h2>
      <button
        onClick={onClose}
        className="text-gray-500 hover:text-gray-700 bg-transparent border-0 p-2 rounded-full hover:bg-gray-100">
        <FaTimes size={16} />
      </button>
    </div>
        
        {/* Contenido dinámico según el paso */}
        <div className="p-3 sm:p-4">
        {/* Mensaje de error */}
        {error && (
          <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
            {error}
          </div>
        )}
          
          {/* Paso 1: Información básica */}
          {step === 1 && (
            <div>
              <div className="mb-4">
                <label className="block text-base sm:text-lg text-black font-semibold mb-1 sm:mb-2">Nombre de la Campaña</label>
                <input 
                  type="text"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  className="w-full bg-white text-black p-2 sm:p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                  placeholder="Ej: Influencers Fitness"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-base sm:text-xl text-black font-semibold mb-1 sm:mb-2">Pega el link del perfil o publicación</label>
                <input 
                  type="text"
                  value={targetLink}
                  onChange={(e) => setTargetLink(e.target.value)}
                  className="w-full p-2 sm:p-3 text-black bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                  placeholder="https://www.instagram.com/..."
                />
              </div>
              
              <div className="mb-4">
              </div>
            </div>
          )}
          {/* Paso 2: Objetivos y tareas */}
          {step === 2 && (
            <div>
              {/* Objetivos */}
            <div className="mb-5 sm:mb-6 w-auto">
              <div className="flex items-center mb-2 sm:mb-3">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-transparent rounded-full flex items-center justify-center mr-2">
                  <img src="/assets/gps.png" alt="Filter" className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-black">Objetivos (elige uno)</h3>
              </div>
              
              <div className="pl-8 sm:pl-10 space-y-1 sm:space-y-2">
                <label className="flex items-center space-x-2 text-black text-sm sm:text-base">
                  <input 
                    type="radio"
                    checked={selectedObjective === "comentarios"}
                    onChange={() => setSelectedObjective("comentarios")}
                    name="objective"
                    className="w-4 h-4 sm:w-5 sm:h-5"
                  />
                  <span>Comentarios de la publicación</span>
                </label>
                
                <label className="flex items-center space-x-2 text-black text-sm sm:text-base">
                  <input 
                    type="radio"
                    checked={selectedObjective === "likes"}
                    onChange={() => setSelectedObjective("likes")}
                    name="objective"
                    className="w-4 h-4 sm:w-5 sm:h-5"
                  />
                  <span>Likes de la publicación</span>
                </label>
                
                <label className="flex items-center space-x-2 text-black text-sm sm:text-base">
                  <input 
                    type="radio"
                    checked={selectedObjective === "seguidores"}
                    onChange={() => setSelectedObjective("seguidores")}
                    name="objective"
                    className="w-4 h-4 sm:w-5 sm:h-5"
                  />
                  <span>Seguidores del perfil</span>
                </label>
              </div>
            </div>

              
              {/* Tareas */}
              <div className="mb-6">
                <div className="flex items-center mb-3">
                  <div className="w-8 h-8 bg-transparent rounded-full flex items-center justify-center mr-2">
                  <img src="/assets/flag.png" alt="Flag" className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-black">Tareas</h3>
                </div>
                
                <div className="pl-10 space-y-2 text-black">
                  <label className="flex items-center space-x-2">
                    <input 
                      type="checkbox"
                      checked={tasks.seguir}
                      onChange={(e) => setTasks({...tasks, seguir: e.target.checked})}
                      className="w-5 h-5"
                    />
                    <span>Seguir instagrammers</span>
                  </label>
                  
                  <label className="flex items-center space-x-2">
                    <input 
                      type="checkbox"
                      checked={tasks.enviarMensaje}
                      onChange={(e) => setTasks({...tasks, enviarMensaje: e.target.checked})}
                      className="w-5 h-5"
                    />
                    <span>Enviar Mensaje</span>
                  </label>
                  
                  <label className="flex items-center space-x-2">
                    <input 
                      type="checkbox"
                      checked={tasks.darLikes}
                      onChange={(e) => setTasks({...tasks, darLikes: e.target.checked})}
                      className="w-5 h-5"
                    />
                    <span>Dar likes a las publicaciones</span>
                  </label>
                  
                  <label className="flex items-center space-x-2">
                    <input 
                      type="checkbox"
                      checked={tasks.comentar}
                      onChange={(e) => setTasks({...tasks, comentar: e.target.checked})}
                      className="w-5 h-5"
                    />
                    <span>Comentar en sus publicaciones (soon)</span>
                  </label>
                </div>
              </div>
            </div>
          )}
          
          {/* Paso 3: Usuarios y acciones - Modifica para que sea como la segunda captura */}
          {step === 3 && (
  <div className="flex flex-col lg:flex-row gap-4">
    {/* Lista de usuarios - Sidebar on desktop, horizontal scrolling list on mobile */}
    <div className="lg:w-1/3 xl:w-1/4 flex-shrink-0">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-3 border-b flex items-center justify-between">
          <h3 className="font-medium text-black">Usuarios ({users.length})</h3>
          <div className="flex gap-2">
            <button
              onClick={() => setShowWhitelistModal(true)}
              className="text-xs rounded-full bg-black text-white hover:bg-white hover:border-black hover:text-black py-1 px-2"
            >
              Whitelist
            </button>
            {filteredUsers?.blacklistedCount > 0 && (
              <button
                onClick={() => setShowBlacklist(true)}
                className="text-xs bg-red-50 hover:bg-red-100 text-red-600 py-1 px-2 rounded"
              >
                {filteredUsers.blacklistedCount} bloqueados
              </button>
            )}
          </div>
        </div>
        
        {/* Auto-height user list that takes available space */}
        <div className="max-h-[30vh] lg:max-h-[50vh] overflow-y-auto">
          {users.length > 0 ? (
            users.map((username, index) => (
              <div key={index} className="flex items-center justify-between p-2 text-black hover:bg-gray-50 border-b">
                <span className="truncate">{username}</span>
                <button
                  onClick={() => removeUser(username)}
                  className="text-gray-400 hover:text-red-500"
                  title="Eliminar usuario de la lista"
                >
                  <FaTimes size={14} />
                </button>
              </div>
            ))
          ) : (
            <div className="p-4 text-center text-gray-500">
              No hay usuarios seleccionados
            </div>
          )}
        </div>
      </div>
    </div>
    
    {/* Action panels - Take remaining space */}
    <div className="lg:w-2/3 xl:w-3/4">
      {/* Panel de mensajes/comentarios */}
      {(tasks.enviarMensaje || tasks.comentar) && (
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
    <h3 className="font-medium mb-3 pb-2 border-b text-black">
      {tasks.enviarMensaje ? "Enviar Mensajes" : "Comentar Publicaciones"}
    </h3>
    
    <div className="space-y-3">
      <textarea
        value={mensaje}
        onChange={(e) => {
          setMensaje(e.target.value);
          console.log("Message updated:", e.target.value); // Debug log
        }}
        className="w-full border rounded-lg p-3 min-h-[100px] focus:ring-2 bg-white text-black focus:ring-blue-500 focus:outline-none"
        placeholder={`Escribe un ${tasks.enviarMensaje ? 'mensaje' : 'comentario'} para enviar a los usuarios...`}
      ></textarea>
      
      <div className="flex flex-wrap gap-2 justify-between">
        <div className="flex gap-2">
          <button 
            onClick={() => {
              const fileInput = document.getElementById("message-media-input");
              if (fileInput) fileInput.click();
            }}
            className="p-2 rounded-lg border hover:bg-white hover:text-black"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </button>
          <input
            id="message-media-input"
            type="file"
            accept="image/*,video/*"
            className="hidden"
            onChange={(event) => {
              setTasks(prev => ({...prev, enviarMedia: true}));
              handleFileSelect(event);
            }}
          />
          
          <button
            onClick={() => alert("Funcionalidad de audio en desarrollo")}
            className="p-2 rounded-lg border hover:bg-white hover:text-black"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </button>
          
          <div className="relative">
            <button 
              onClick={() => {
                const dropdown = document.getElementById("templates-dropdown");
                if (dropdown) dropdown.classList.toggle("hidden");
              }}
              className="p-2 rounded-lg border bg-blue-50 text-blue-600 hover:bg-blue-100"
            >
              Elegir plantilla
            </button>
            
            <div id="templates-dropdown" className="hidden absolute left-0 top-full mt-1 text-black w-64 bg-white border rounded-lg shadow-lg z-10">
            <div className="p-2 border-b font-medium">Selecciona una plantilla</div>
            <div className="max-h-40 overflow-y-auto">
              {templates.length > 0 ? (
                templates.map(template => (
                  <div 
                    key={template.id}
                    className="p-2 hover:bg-gray-50 cursor-pointer"
                    onClick={() => {
                      setSelectedTemplate(template);
                      if (template) {
                        const messageText = template.body || template.content || "";
                        setMensaje(messageText);
                        console.log("Template selected:", template.name);
                        console.log("Message set from template:", messageText);
                      }
                      document.getElementById("templates-dropdown").classList.add("hidden");
                    }}
                  >
                    {template.name}
                  </div>
                ))
              ) : (
                <div className="p-2 text-gray-500">No hay plantillas disponibles</div>
              )}
            </div>
          </div>
          </div>
        </div>
        
      </div>
    </div>
  </div>
)}
      
      {/* Panel de medios */}
      {tasks.enviarMedia && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
          <h3 className="font-medium mb-3 pb-2 border-b">
            Enviar Multimedia
          </h3>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="sm:w-1/3">
              {mediaPreview ? (
                <div className="relative rounded-lg overflow-hidden border aspect-square">
                  <img 
                    src={mediaPreview} 
                    alt="Preview" 
                    className="w-full h-full object-cover"
                  />
                  <button 
                    onClick={() => {
                      setMediaFile(null);
                      setMediaPreview(null);
                    }}
                    className="absolute top-2 right-2 bg-black bg-opacity-50 text-white rounded-full p-1"
                  >
                    <FaTimes size={14} />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center border-2 border-dashed h-40 cursor-pointer hover:bg-gray-50 rounded-2xl">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-10 h-10 text-gray-400 mb-2">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span className="text-sm text-gray-500">Seleccionar archivo</span>
                  <input 
                    type="file" 
                    className="hidden"
                    onChange={handleFileSelect}
                    accept="image/*,video/*"
                  />
                </label>
              )}
            </div>
            
            <div className="sm:w-2/3 flex flex-col">
              <textarea
                value={mediaCaption}
                onChange={(e) => setMediaCaption(e.target.value)}
                className="w-full border rounded-lg p-3 mb-3 bg-white text-black focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="Añade un texto opcional para acompañar la imagen..."
              ></textarea>

            </div>
          </div>
        </div>
      )}
      
      {/* Panel de likes */}
      {tasks.darLikes && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
          <h3 className="font-medium mb-3 pb-2 border-b">
            Dar Likes a Publicaciones
          </h3>
          
          <div className="text-gray-600 mb-4">
            Se dará like a la última publicación de cada usuario seleccionado.
          </div>
          
          <button
            onClick={likeLatestPosts}
            disabled={loading}
            className="px-4 py-2 bg-indigo-900 text-white rounded-lg disabled:opacity-50"
          >
            Dar likes a {users.length} usuarios
          </button>
        </div>
      )}
    </div>
  </div>
)}
          
          {/* Paso 4: Confirmación */}
        {step === 4 && (
          <div className="text-center py-6 sm:py-10">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <svg className="w-8 h-8 sm:w-10 sm:h-10 text-green-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 13L9 17L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3 className="text-xl sm:text-2xl font-semibold mb-2">¡Campaña creada con éxito!</h3>
            <p className="text-gray-600 mb-4 text-sm sm:text-base px-4 sm:px-0">
              Tu campaña &ldquo;{campaignName}&rdquo; ha sido creada y está en proceso.
              Puedes seguir su progreso en la sección de Campañas.
            </p>
            <button 
              onClick={onClose}
              className="bg-blue-600 text-white px-4 sm:px-6 py-1.5 sm:py-2 text-sm sm:text-base rounded-lg hover:bg-blue-700"
            >
              Entendido
            </button>
          </div>
        )}
        </div>
        
        {/* Footer con botones de navegación */}
        {step < 4 && (
          <div className="p-3 sm:p-4 border-t flex justify-end space-x-2">
            {step > 1 && (
              <button 
                onClick={() => setStep(step - 1)}
                className="px-3 sm:px-6 py-1 sm:py-2 text-sm sm:text-base bg-gray-200 text-black rounded-lg hover:bg-gray-300"
              >
                Atrás
              </button>
            )}
            <button 
              onClick={handleNext}
              className="px-4 sm:px-8 py-1 sm:py-2 text-sm sm:text-base bg-indigo-900 text-white rounded-lg flex items-center justify-center"
              disabled={loading}
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 sm:h-5 sm:w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Procesando...
                </>
              ) : (
                <>
                  Siguiente <FaArrowRight className="ml-1 sm:ml-2" />
                </>
              )}
            </button>
          </div>
        )}
      </div>
      
      {/* Modales y overlays */}
      {showBlacklist && (
        <BlacklistModal 
          blacklistedUsers={filteredUsers?.blacklistedUsers || []}
          onClose={() => setShowBlacklist(false)}
        />
      )}
      
      {loading && (
        <LoadingOverlay 
          progress={progress}
          message={progressMessage}
        />
      )}
      {showWhitelistModal && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-2 sm:p-4">
    <div className="w-full max-w-xs sm:max-w-md max-h-[90vh] overflow-auto bg-white rounded-lg">
      <WhitelistSelector
        user={user}
        db={db}
        users={users}
        onClose={() => setShowWhitelistModal(false)}
        onWhitelistAdded={(whitelist) => {
          // Guardar la información de la operación
          setLastWhitelistOperation({
            whitelist,
            timestamp: new Date()
          });
          
          // Mostrar mensaje apropiado
          const userCount = whitelist.addedUsers?.length || 0;
          const message = whitelist.isNew 
            ? `Lista "${whitelist.name}" creada con ${userCount} usuarios.`
            : `${userCount} usuarios añadidos a la lista "${whitelist.name}"${whitelist.duplicatesSkipped ? ` (${whitelist.duplicatesSkipped} duplicados omitidos)` : ''}.`;
          
          // Mostrar mensaje
          setError(null); // Limpiar errores previos si los hay
          alert(message); // O usar un sistema de notificación más sofisticado
          
          console.log('Users added to whitelist:', whitelist);
          setShowWhitelistModal(false);
        }}
      />
    </div>
  </div>
)}
    </div>
  );
};

NuevaCampanaModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  user: PropTypes.object,
  instagramToken: PropTypes.string,
  initialTab: PropTypes.string
};

export default NuevaCampanaModal;