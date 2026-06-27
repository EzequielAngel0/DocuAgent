"use client";

import { useState, useEffect } from "react";
import ChatSidebar from "@/components/chat/ChatSidebar";
import ChatArea from "@/components/chat/ChatArea";
import { Message } from "@/components/chat/MessageItem";

interface ChatSession {
  id: string;
  title: string;
}

export default function ChatPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // 1. Cargar sesiones iniciales de localStorage al montar
  useEffect(() => {
    const savedSessions = localStorage.getItem("chat_sessions");
    if (savedSessions) {
      const parsed = JSON.parse(savedSessions);
      setSessions(parsed);
      if (parsed.length > 0) {
        setActiveSessionId(parsed[0].id);
      }
    } else {
      // Crear una conversación inicial por defecto
      const initialId = "sess_" + Date.now();
      const initialSessions = [{ id: initialId, title: "Nueva Conversación" }];
      setSessions(initialSessions);
      setActiveSessionId(initialId);
      localStorage.setItem("chat_sessions", JSON.stringify(initialSessions));
    }
  }, []);

  // 2. Cargar mensajes cada vez que cambie la sesión activa
  useEffect(() => {
    if (activeSessionId) {
      const savedMessages = localStorage.getItem(`chat_messages_${activeSessionId}`);
      if (savedMessages) {
        setMessages(JSON.parse(savedMessages));
      } else {
        setMessages([]);
      }
    } else {
      setMessages([]);
    }
  }, [activeSessionId]);

  // Guardar mensajes de la sesión activa al localStorage
  const saveMessages = (sessId: string, msgs: Message[]) => {
    localStorage.setItem(`chat_messages_${sessId}`, JSON.stringify(msgs));
  };

  const handleCreateSession = () => {
    const newId = "sess_" + Date.now();
    const newSession = { id: newId, title: "Nueva Conversación" };
    const updated = [newSession, ...sessions];
    setSessions(updated);
    setActiveSessionId(newId);
    localStorage.setItem("chat_sessions", JSON.stringify(updated));
  };

  const handleDeleteSession = (idToDelete: string) => {
    const updated = sessions.filter((s) => s.id !== idToDelete);
    setSessions(updated);
    localStorage.setItem("chat_sessions", JSON.stringify(updated));
    localStorage.removeItem(`chat_messages_${idToDelete}`);

    if (activeSessionId === idToDelete) {
      if (updated.length > 0) {
        setActiveSessionId(updated[0].id);
      } else {
        setActiveSessionId(null);
      }
    }
  };

  const handleSendMessage = (textToSend?: string) => {
    const messageText = textToSend || inputValue;
    if (!messageText.trim() || !activeSessionId) return;

    // Crear mensaje de usuario
    const userMsg: Message = {
      id: "msg_" + Date.now(),
      sender: "user",
      text: messageText.trim(),
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    saveMessages(activeSessionId, updatedMessages);
    setInputValue("");

    // Actualizar el título de la conversación si es el primer mensaje
    const currentSession = sessions.find((s) => s.id === activeSessionId);
    if (currentSession && currentSession.title === "Nueva Conversación") {
      const truncatedTitle = messageText.length > 22 ? messageText.substring(0, 20) + "..." : messageText;
      const updatedSessions = sessions.map((s) =>
        s.id === activeSessionId ? { ...s, title: truncatedTitle } : s
      );
      setSessions(updatedSessions);
      localStorage.setItem("chat_sessions", JSON.stringify(updatedSessions));
    }

    // Iniciar respuesta simulada del bot
    setIsTyping(true);

    setTimeout(() => {
      const query = messageText.toLowerCase();
      let responseText = "";
      let responseCitations: any[] = [];

      // Simular lógica de enrutamiento RAG
      if (query.includes("vacaciones") || query.includes("vacación")) {
        responseText = "En la empresa, el periodo de vacaciones anuales remuneradas es de **15 días laborables** por año completo de servicios prestados. Estas pueden solicitarse a partir del primer aniversario en la organización.\n\nNormas clave:\n- Se deben programar y coordinar con tu supervisor directo con un mínimo de **15 días de anticipación**.\n- No son acumulables más allá de 2 periodos consecutivos.";
        responseCitations = [
          {
            documentName: "politica_vacaciones.pdf",
            page: "Pág. 2",
            category: "Recursos Humanos",
            excerpt: "El empleado tendrá derecho a disfrutar de quince (15) días hábiles de vacaciones remuneradas por cada año completo de servicio continuo."
          },
          {
            documentName: "manual_onboarding.docx",
            page: "Pág. 12",
            category: "Recursos Humanos",
            excerpt: "Las vacaciones anuales deben planificarse con anticipación y requieren la aprobación formal del jefe de departamento."
          }
        ];
      } else if (query.includes("gasto") || query.includes("reembolso") || query.includes("viatico") || query.includes("viaje")) {
        responseText = "La política de reembolso de gastos corporativos establece que todos los viáticos, comidas de negocios y gastos de transporte deben rendirse mediante la plataforma administrativa en un plazo máximo de **5 días hábiles** tras finalizar el viaje o realizarse el gasto.\n\nRequisitos indispensables:\n- Cargar factura electrónica válida (CFDI/XML) emitida a nombre de la empresa.\n- Gastos individuales superiores a $50 USD requieren pre-aprobación del director del departamento.";
        responseCitations = [
          {
            documentName: "politica_gastos.pdf",
            page: "Pág. 4",
            category: "Finanzas",
            excerpt: "Todo gasto reembolsable debe reportarse con comprobante fiscal vigente en un periodo no mayor a cinco (5) días hábiles posteriores a su realización."
          }
        ];
      } else if (query.includes("seguridad") || query.includes("código") || query.includes("túnel") || query.includes("podman") || query.includes("token")) {
        responseText = "DocuAgent implementa estrictos protocolos de seguridad y aislamiento:\n- **Aislamiento de red:** Las bases de datos (PostgreSQL y Qdrant) se ejecutan en una red interna privada de Podman, inaccesible desde Internet.\n- **Autenticación admin:** El inicio de sesión administrativo requiere correo, contraseña encriptada con bcrypt, validación anti-bot de Cloudflare Turnstile y un código TOTP de 2FA compatible con Google Authenticator.\n- **Secrets Management:** Las credenciales y claves API de producción se gestionan mediante **OCI Vault**.";
        responseCitations = [
          {
            documentName: "security.md",
            page: "Pág. 3",
            category: "Seguridad",
            excerpt: "La base de datos relacional y la base de datos vectorial Qdrant operan en redes virtuales aisladas y no exponen puertos públicos."
          },
          {
            documentName: "infrastructure-and-quality-plan.md",
            page: "Pág. 2",
            category: "Infraestructura",
            excerpt: "Toda clave API y clave de encriptación simétrica debe ser leída del almacén de secretos OCI Vault en producción."
          }
        ];
      } else if (query.includes("formato") || query.includes("pdf") || query.includes("word") || query.includes("excel") || query.includes("csv")) {
        responseText = "El pipeline de ingesta soporta una gran variedad de archivos organizacionales:\n- **Documentos:** PDF (nativo), Word (DOCX) y texto plano (TXT).\n- **Tablas:** Excel (XLSX) y CSV.\n- **Formatos estructurados/web:** Markdown (MD), HTML y JSON.\n\nLos archivos se limpian semánticamente y se dividen en fragmentos de entre 200 y 1500 caracteres antes de ser indexados.";
        responseCitations = [
          {
            documentName: "execution-guide.md",
            page: "Fase 7",
            category: "Desarrollo",
            excerpt: "Extractores: PDF, Word, Excel, PowerPoint, Markdown, CSV, JSON, HTML, TXT. Ingesta semántica batch."
          }
        ];
      } else {
        // Estado Fallback del RAG
        responseText = "No se encontró información relevante sobre ese tema en los manuales ni políticas indexadas de la empresa. Por favor, asegúrate de preguntar sobre Recursos Humanos, Finanzas, Seguridad o formatos de archivos. Si consideras que esta información debería estar aquí, contacta al administrador de documentación.";
        responseCitations = [];
      }

      const botMsg: Message = {
        id: "msg_" + Date.now(),
        sender: "assistant",
        text: responseText,
        citations: responseCitations
      };

      const finalMessages = [...updatedMessages, botMsg];
      setMessages(finalMessages);
      saveMessages(activeSessionId, finalMessages);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <div className="flex" style={{ height: "100vh", overflow: "hidden" }}>
      <ChatSidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={setActiveSessionId}
        onCreateSession={handleCreateSession}
        onDeleteSession={handleDeleteSession}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />
      <ChatArea
        messages={messages}
        inputValue={inputValue}
        onInputChange={setInputValue}
        onSendMessage={handleSendMessage}
        isTyping={isTyping}
        onOpenMobileMenu={() => setIsMobileSidebarOpen(true)}
      />
    </div>
  );
}
