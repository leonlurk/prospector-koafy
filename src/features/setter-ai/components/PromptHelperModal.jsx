import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { generateFollowupQuestions } from '../services/api';

// Basic styling (can be expanded or moved to a CSS file)
const styles = {
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: '25px', // Increased padding
    borderRadius: '8px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    width: '90%', // Responsive width
    maxWidth: '600px', // Max width
    maxHeight: '90vh', // Max height
    overflowY: 'auto', // Scrollable content
    color: '#333', // Darker text for better readability
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    borderBottom: '1px solid #eee', // Separator
    paddingBottom: '10px',
  },
  modalTitle: {
    margin: 0,
    fontSize: '1.5em', // Larger title
    color: '#1a202c', // Darker title
  },
  closeButton: {
    background: 'transparent',
    border: 'none',
    fontSize: '1.8em', // Larger close button
    cursor: 'pointer',
    color: '#777', // Softer color for close button
  },
  formGroup: {
    marginBottom: '20px', // More spacing
  },
  label: {
    display: 'block',
    marginBottom: '8px', // More space for label
    fontWeight: '600', // Bolder labels
    fontSize: '0.95em',
    color: '#4a5568', // Label color
  },
  input: {
    width: '100%',
    padding: '12px', // More padding in inputs
    border: '1px solid #ddd', // Softer border
    borderRadius: '6px',
    boxSizing: 'border-box',
    fontSize: '1em',
  },
  textarea: {
    width: '100%',
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    boxSizing: 'border-box',
    minHeight: '100px', // Taller textarea
    fontSize: '1em',
    resize: 'vertical',
  },
  checkboxContainer: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '20px',
  },
  checkbox: {
    marginRight: '10px',
    accentColor: '#4A90E2', // Theme color for checkbox
  },
  buttonContainer: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: '25px', // More space before buttons
  },
  button: {
    padding: '12px 25px', // Larger buttons
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '1em',
    fontWeight: '600', // Bolder button text
  },
  cancelButton: {
    backgroundColor: '#f0f0f0', // Light grey
    color: '#555',
    marginRight: '10px',
  },
  submitButton: {
    backgroundColor: '#4A90E2', // Theme color
    color: 'white',
  },
  backButton: {
    backgroundColor: '#f0f0f0', // Light grey
    color: '#555',
    marginRight: 'auto', // Push to left
  },
  disabledButton: {
    backgroundColor: '#ccc',
    cursor: 'not-allowed',
  },
  radioGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  radioOption: {
    display: 'flex',
    alignItems: 'center',
  },
  radio: {
    marginRight: '8px',
    accentColor: '#4A90E2',
  },
  checkboxGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  progressContainer: {
    marginBottom: '20px',
    width: '100%',
  },
  progressBar: {
    height: '8px',
    borderRadius: '4px',
    backgroundColor: '#e0e0e0',
    position: 'relative',
    overflow: 'hidden',
  },
  progressFill: {
    position: 'absolute',
    height: '100%',
    borderRadius: '4px',
    backgroundColor: '#4A90E2',
    transition: 'width 0.3s ease-in-out',
  },
  progressText: {
    textAlign: 'center',
    fontSize: '0.8em',
    marginTop: '5px',
    color: '#666',
  },
  stepIndicator: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '15px',
  },
  stepDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    backgroundColor: '#ddd',
    margin: '0 5px',
  },
  activeStepDot: {
    backgroundColor: '#4A90E2',
  },
};

const PromptHelperModal = ({ isOpen, onClose, onSubmit, isLoading, userId }) => {
  // State for initial form data
  const [objective, setObjective] = useState('');
  const [needsTools, setNeedsTools] = useState(false);
  const [tools, setTools] = useState('');
  const [expectedInputs, setExpectedInputs] = useState('');
  const [expectedOutputs, setExpectedOutputs] = useState('');
  const [agentNameOrRole, setAgentNameOrRole] = useState('');
  const [companyOrContext, setCompanyOrContext] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [desiredTone, setDesiredTone] = useState('');
  const [keyInfoToInclude, setKeyInfoToInclude] = useState('');
  const [thingsToAvoid, setThingsToAvoid] = useState('');
  const [primaryCallToAction, setPrimaryCallToAction] = useState('');

  // Multi-step form state
  const [currentStep, setCurrentStep] = useState(1);
  const [followupQuestions, setFollowupQuestions] = useState([]);
  const [followupResponses, setFollowupResponses] = useState({});
  const [loadingFollowupQuestions, setLoadingFollowupQuestions] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Reset to step 1 when modal opens
      setCurrentStep(1);
      setFollowupQuestions([]);
      setFollowupResponses({});
      // Reset initial form fields
      setObjective('');
      setNeedsTools(false);
      setTools('');
      setExpectedInputs('');
      setExpectedOutputs('');
      setAgentNameOrRole('');
      setCompanyOrContext('');
      setTargetAudience('');
      setDesiredTone('');
      setKeyInfoToInclude('');
      setThingsToAvoid('');
      setPrimaryCallToAction('');
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  // Get initial form data for step 1
  const getFormData = () => ({
    objective,
    needsTools,
    tools: needsTools ? tools : '',
    expectedInputs,
    expectedOutputs,
    agentNameOrRole,
    companyOrContext,
    targetAudience,
    desiredTone,
    keyInfoToInclude,
    thingsToAvoid,
    primaryCallToAction,
  });

  // Handle first step form submission - Request followup questions
  const handleInitialSubmit = async (e) => {
    e.preventDefault();
    if (!objective.trim()) {
      alert("El objetivo principal es requerido.");
      return;
    }

    // Get initial form data
    const initialData = getFormData();
    
    // Start loading state
    setLoadingFollowupQuestions(true);
    
    try {
      // Request followup questions from the server
      const response = await generateFollowupQuestions(userId, initialData);
      
      if (response.success && response.data && response.data.followupQuestions && Array.isArray(response.data.followupQuestions)) {
        // Set the followup questions
        setFollowupQuestions(response.data.followupQuestions);
        
        // Initialize responses object based on question type
        const initialResponses = {};
        response.data.followupQuestions.forEach(q => {
          initialResponses[q.id] = {
            question: q.question, // Store the question text for context
            answer: q.type === 'checkbox' ? [] : '', // Array for checkboxes, string for others
          };
        });
        setFollowupResponses(initialResponses);
        setCurrentStep(2); // Move to the next step
      } else {
        // If no followup questions or an error, proceed to final submission directly or show error
        console.warn('No followup questions received or error, proceeding to final submit or show error.', response);
        // Fallback: if no questions, effectively skip to submitting what we have
        // or allow user to submit without them. For now, let's assume we always get them or handle error.
        // If there's a specific error message from backend, display it.
        alert(response.message || 'Could not load additional questions. You can submit with basic info, or try again.');
        // Optionally, allow submitting with initial data if no followup questions
        // onSubmit(initialData); 
      }
    } catch (error) {
      console.error("Error fetching followup questions:", error);
      alert(`Error fetching followup questions: ${error.message}`);
    } finally {
      setLoadingFollowupQuestions(false);
    }
  };

  // Handle final submission (after step 2)
  const handleFinalSubmit = (e) => {
    e.preventDefault();
    const initialData = getFormData();
    
    // Format followupResponses to match the backend's expected structure
    const formattedFollowupResponses = Object.values(followupResponses).map(res => {
        if (Array.isArray(res.answer)) { // Checkbox
            return {
                question: res.question,
                selectedOptions: res.answer // Backend expects 'selectedOptions' for checkboxes
            };
        }
        return { // Text, textarea, radio, select
            question: res.question,
            answer: res.answer
        };
    });

    const finalData = {
      ...initialData,
      followupResponses: formattedFollowupResponses,
    };
    onSubmit(finalData); // Pass all data to the parent component's submit handler
  };

  // Update response for a followup question
  const updateFollowupResponse = (questionId, value) => {
    setFollowupResponses(prev => ({
      ...prev,
      [questionId]: {
        ...prev[questionId], // Keep existing properties like question text
        answer: value,
      }
    }));
  };
  
  // Handle checkbox changes specifically
  const handleCheckboxChange = (questionId, optionValue, isChecked) => {
    setFollowupResponses(prev => {
      const existingAnswers = prev[questionId]?.answer || [];
      let newAnswers;
      if (isChecked) {
        newAnswers = [...existingAnswers, optionValue];
      } else {
        newAnswers = existingAnswers.filter(ans => ans !== optionValue);
      }
      return {
        ...prev,
        [questionId]: {
          ...prev[questionId],
          answer: newAnswers,
        }
      };
    });
  };

  // Render individual input based on question type
  const renderQuestionInput = (question) => {
    const response = followupResponses[question.id] || { answer: question.type === 'checkbox' ? [] : '' }; // Default for safety

    switch (question.type) {
      case 'text':
        return (
          <input
            type="text"
            style={styles.input}
            value={response.answer}
            onChange={(e) => updateFollowupResponse(question.id, e.target.value)}
            placeholder={question.placeholder || 'Type your answer...'}
          />
        );
      case 'textarea':
        return (
          <textarea
            style={styles.textarea}
            value={response.answer}
            onChange={(e) => updateFollowupResponse(question.id, e.target.value)}
            placeholder={question.placeholder || 'Provide detailed information...'}
          />
        );
      case 'select':
        return (
          <select
            style={styles.input}
            value={response.answer}
            onChange={(e) => updateFollowupResponse(question.id, e.target.value)}
          >
            <option value="">{question.placeholder || '-- Select an option --'}</option>
            {question.options && question.options.map((opt, idx) => (
              <option key={idx} value={opt.value || opt}>{opt.label || opt}</option>
            ))}
          </select>
        );
      case 'radio':
        return (
          <div style={styles.radioGroup}>
            {question.options && question.options.map((opt, idx) => (
              <label key={idx} style={styles.radioOption}>
                <input
                  type="radio"
                  name={question.id}
                  value={opt.value || opt}
                  checked={response.answer === (opt.value || opt)}
                  onChange={(e) => updateFollowupResponse(question.id, e.target.value)}
                  style={styles.radio}
                />
                {opt.label || opt}
              </label>
            ))}
          </div>
        );
      case 'checkbox':
        return (
          <div style={styles.checkboxGroup}>
            {question.options && question.options.map((opt, idx) => (
              <label key={idx} style={styles.checkboxContainer} /* Reusing checkboxContainer style */>
                <input
                  type="checkbox"
                  value={opt.value || opt}
                  checked={(response.answer || []).includes(opt.value || opt)}
                  onChange={(e) => handleCheckboxChange(question.id, (opt.value || opt), e.target.checked)}
                  style={styles.checkbox}
                />
                {opt.label || opt}
              </label>
            ))}
          </div>
        );
      default:
        return <p>Unsupported question type: {question.type}</p>;
    }
  };

  // Render step indicator
  const renderStepIndicator = () => (
    <div style={styles.stepIndicator}>
      <div style={{...styles.stepDot, ...(currentStep === 1 ? styles.activeStepDot : {})}}></div>
      <div style={{...styles.stepDot, ...(currentStep === 2 ? styles.activeStepDot : {})}}></div>
    </div>
  );

  const totalSteps = followupQuestions.length > 0 ? 2 : 1;

  return (
    <div style={styles.modalOverlay} /* onClick={onClose} */ >
      <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <h2 style={styles.modalTitle}>
            {currentStep === 1 ? 'Asistente de Creación de Prompt' : 'Preguntas Adicionales'}
          </h2>
          <button style={styles.closeButton} onClick={onClose}>&times;</button>
        </div>

        {/* Progress Indicator */}
        <div style={styles.progressContainer}>
          <div style={styles.progressBar}>
            <div 
              style={{
                ...styles.progressFill, 
                width: `${(currentStep / totalSteps) * 100}%`
              }}
            />
          </div>
          <p style={styles.progressText}>Paso {currentStep} de {totalSteps}</p>
        </div>
        {renderStepIndicator()}

        {currentStep === 1 && (
          <form onSubmit={handleInitialSubmit}>
            {/* Objective */}
            <div style={styles.formGroup}>
              <label htmlFor="objective" style={styles.label}>1. ¿Cuál es el objetivo principal de este Agente IA? *</label>
              <textarea id="objective" style={styles.textarea} value={objective} onChange={(e) => setObjective(e.target.value)} placeholder="Ej: Responder preguntas frecuentes sobre nuestros productos, generar leads, agendar citas..." />
            </div>

            {/* Agent Name/Role */}
            <div style={styles.formGroup}>
                <label htmlFor="agentNameOrRole" style={styles.label}>2. ¿Qué nombre o rol tendrá el Agente IA?</label>
                <input type="text" id="agentNameOrRole" style={styles.input} value={agentNameOrRole} onChange={(e) => setAgentNameOrRole(e.target.value)} placeholder="Ej: Asistente de Ventas, Soporte Técnico Nivel 1, Guía Virtual" />
            </div>

            {/* Company/Context */}
            <div style={styles.formGroup}>
                <label htmlFor="companyOrContext" style={styles.label}>3. ¿Para qué empresa o en qué contexto principal operará?</label>
                <input type="text" id="companyOrContext" style={styles.input} value={companyOrContext} onChange={(e) => setCompanyOrContext(e.target.value)} placeholder="Ej: Mi Tienda Online, Consultorio Dental Dr. Ejemplo, Plataforma Educativa XYZ" />
            </div>
            
            {/* Target Audience */}
            <div style={styles.formGroup}>
                <label htmlFor="targetAudience" style={styles.label}>4. ¿Cuál es la audiencia o cliente ideal al que se dirige?</label>
                <input type="text" id="targetAudience" style={styles.input} value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)} placeholder="Ej: Jóvenes adultos interesados en tecnología, Padres primerizos, Profesionales del marketing" />
            </div>

            {/* Desired Tone */}
            <div style={styles.formGroup}>
                <label htmlFor="desiredTone" style={styles.label}>5. ¿Qué tono de comunicación debe usar el Agente?</label>
                <input type="text" id="desiredTone" style={styles.input} value={desiredTone} onChange={(e) => setDesiredTone(e.target.value)} placeholder="Ej: Amigable y cercano, Formal y profesional, Entusiasta y motivador" />
            </div>

            {/* Needs Tools */}
            {/*
            <div style={styles.checkboxContainer}>
              <input type="checkbox" id="needsTools" style={styles.checkbox} checked={needsTools} onChange={(e) => setNeedsTools(e.target.checked)} />
              <label htmlFor="needsTools" style={{...styles.label, marginBottom: 0}}>6. ¿El Agente necesitará acceder a herramientas o funciones específicas (ej: calendario, CRM, base de datos de productos)?</label>
            </div>
            */}

            {/* Tools */}
            {/*
            {needsTools && (
              <div style={styles.formGroup}>
                <label htmlFor="tools" style={styles.label}>Si es así, ¿cuáles herramientas o funciones?</label>
                <textarea id="tools" style={styles.textarea} value={tools} onChange={(e) => setTools(e.target.value)} placeholder="Ej: Acceso a API de calendario para agendar, consulta a base de datos de FAQs, etc."/>
              </div>
            )}
            */}

            {/* Expected Inputs */}
            <div style={styles.formGroup}>
              <label htmlFor="expectedInputs" style={styles.label}>7. ¿Qué tipo de preguntas o frases esperas de los clientes?</label>
              <textarea id="expectedInputs" style={styles.textarea} value={expectedInputs} onChange={(e) => setExpectedInputs(e.target.value)} placeholder="Ej: '¿Cuánto cuesta el producto X?', 'Quiero hablar con un humano', 'Necesito ayuda con mi pedido'" />
            </div>

            {/* Expected Outputs */}
            <div style={styles.formGroup}>
              <label htmlFor="expectedOutputs" style={styles.label}>8. ¿Cómo debería responder o qué acciones debería tomar el Agente idealmente?</label>
              <textarea id="expectedOutputs" style={styles.textarea} value={expectedOutputs} onChange={(e) => setExpectedOutputs(e.target.value)} placeholder="Ej: Proporcionar precio y enlace, ofrecer transferir la conversación, pedir número de orden para verificar" />
            </div>
            
            {/* Key Info to Include */}
            <div style={styles.formGroup}>
                <label htmlFor="keyInfoToInclude" style={styles.label}>9. ¿Hay alguna información clave que el Agente DEBE incluir o conocer?</label>
                <textarea id="keyInfoToInclude" style={styles.textarea} value={keyInfoToInclude} onChange={(e) => setKeyInfoToInclude(e.target.value)} placeholder="Ej: Horarios de atención, políticas de devolución, nombres de productos específicos" />
            </div>

            {/* Things to Avoid */}
            <div style={styles.formGroup}>
                <label htmlFor="thingsToAvoid" style={styles.label}>10. ¿Hay algo que el Agente DEBE EVITAR decir o hacer?</label>
                <textarea id="thingsToAvoid" style={styles.textarea} value={thingsToAvoid} onChange={(e) => setThingsToAvoid(e.target.value)} placeholder="Ej: Dar opiniones personales, prometer cosas que no puede cumplir, usar jerga muy técnica" />
            </div>

            {/* Primary Call to Action */}
            <div style={styles.formGroup}>
                <label htmlFor="primaryCallToAction" style={styles.label}>11. ¿Cuál es la principal llamada a la acción que el Agente debe impulsar?</label>
                <input type="text" id="primaryCallToAction" style={styles.input} value={primaryCallToAction} onChange={(e) => setPrimaryCallToAction(e.target.value)} placeholder="Ej: Completar una compra, Registrarse para un webinar, Solicitar una demostración" />
            </div>

            <div style={styles.buttonContainer}>
              <button type="button" onClick={onClose} style={{...styles.button, ...styles.cancelButton}}>Cancelar</button>
              <button 
                type="submit" 
                style={{...styles.button, ...styles.submitButton, ...(loadingFollowupQuestions || isLoading ? styles.disabledButton : {})}}
                disabled={loadingFollowupQuestions || isLoading}
              >
                {loadingFollowupQuestions ? 'Cargando Preguntas...' : (followupQuestions.length > 0 ? 'Siguiente' : 'Generar Prompt')} 
              </button>
            </div>
          </form>
        )}

        {currentStep === 2 && followupQuestions.length > 0 && (
          <form onSubmit={handleFinalSubmit}>
            {followupQuestions.map((q) => (
              <div key={q.id} style={styles.formGroup}>
                <label style={styles.label}>{q.question}</label>
                {renderQuestionInput(q)}
              </div>
            ))}
            <div style={styles.buttonContainer}>
              <button 
                type="button" 
                onClick={() => setCurrentStep(1)} 
                style={{...styles.button, ...styles.backButton}}
                disabled={isLoading}
              >
                Atrás
              </button>
              <button type="button" onClick={onClose} style={{...styles.button, ...styles.cancelButton}}>Cancelar</button>
              <button 
                type="submit" 
                style={{...styles.button, ...styles.submitButton, ...(isLoading ? styles.disabledButton : {})}}
                disabled={isLoading}
              >
                {isLoading ? 'Generando Prompt...' : 'Generar Prompt'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

PromptHelperModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
  userId: PropTypes.string.isRequired, // userId es necesario para las llamadas API
};

PromptHelperModal.defaultProps = {
  isLoading: false,
};

export default PromptHelperModal; 