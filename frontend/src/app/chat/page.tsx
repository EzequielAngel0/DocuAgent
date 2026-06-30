"use client";

import { useState, useEffect, useRef } from "react";
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
  // Token de Turnstile (en ref para evitar closures obsoletos al enviar).
  const turnstileTokenRef = useRef("");

  // Cargar Turnstile (anti-bot) y capturar el token; el backend lo verifica una
  // vez por IP. Si no hay site key, no se renderiza (queda sin protección).
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
    if (!key) return;

    (window as any).onloadChatTurnstile = () => {
      const ts = (window as any).turnstile;
      const el = document.getElementById("chat-turnstile");
      if (ts && el) {
        ts.render("#chat-turnstile", {
          sitekey: key,
          theme: "dark",
          callback: (token: string) => {
            turnstileTokenRef.current = token;
          },
          "expired-callback": () => {
            turnstileTokenRef.current = "";
          },
        });
      }
    };

    const script = document.createElement("script");
    script.src =
      "https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onloadChatTurnstile";
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    return () => {
      if (document.head.contains(script)) document.head.removeChild(script);
      delete (window as any).onloadChatTurnstile;
    };
  }, []);

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

    // Iniciar respuesta
    setIsTyping(true);

    let wsConnected = false;
    let ws: WebSocket | null = null;
    let accumulatedText = "";
    const botMsgId = "msg_bot_" + Date.now();

    const handleConnectionError = () => {
      setIsTyping(false);
      const errorMsg: Message = {
        id: "msg_err_" + Date.now(),
        sender: "assistant",
        text: "Lo siento, no se pudo conectar con el servidor de chat. Asegúrate de que el backend esté en ejecución o inténtalo más tarde.",
        citations: []
      };

      const finalMessages = [...updatedMessages, errorMsg];
      setMessages(finalMessages);
      saveMessages(activeSessionId, finalMessages);
    };

    try {
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000/api/v1/chat/ws";
      ws = new WebSocket(wsUrl);

      // Fallback si no conecta en 1.5s
      const connectTimeout = setTimeout(() => {
        if (!wsConnected) {
          if (ws) ws.close();
          handleConnectionError();
        }
      }, 1500);

      ws.onopen = () => {
        wsConnected = true;
        clearTimeout(connectTimeout);
        ws?.send(
          JSON.stringify({ query: messageText, turnstile_token: turnstileTokenRef.current })
        );
        // El mensaje del asistente se crea al llegar el primer token; mientras
        // tanto solo se muestra el indicador de "escribiendo" (isTyping).
      };

      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);

        if (msg.type === "token") {
          setIsTyping(false); // Ocultar animación una vez empieza el stream
          accumulatedText += msg.token;
          setMessages((prev) => {
            const exists = prev.some((m) => m.id === botMsgId);
            if (exists) {
              return prev.map((m) =>
                m.id === botMsgId ? { ...m, text: accumulatedText } : m
              );
            }
            return [
              ...prev,
              { id: botMsgId, sender: "assistant", text: accumulatedText, citations: [] },
            ];
          });
        } else if (msg.type === "done") {
          const finalCitations = msg.citations.map((c: any) => ({
            documentName: c.title,
            page: `Pág. ${c.page}`,
            category: c.category,
            excerpt: c.snippet
          }));

          setMessages((prev) => {
            const finalMsgs = prev.map((m) =>
              m.id === botMsgId
                ? { ...m, text: accumulatedText, citations: finalCitations, logId: msg.log_id }
                : m
            );
            saveMessages(activeSessionId, finalMsgs);
            return finalMsgs;
          });
          
          ws?.close();
          setIsTyping(false);
        } else if (msg.type === "error") {
          console.error("Error en RAG Stream:", msg.error);
          ws?.close();
          // Eliminar el mensaje vacío que se creó e ir a fallback
          setMessages((prev) => prev.filter((m) => m.id !== botMsgId));
          handleConnectionError();
        }
      };

      ws.onerror = (err) => {
        console.error("WebSocket Error:", err);
        if (!wsConnected) {
          clearTimeout(connectTimeout);
          handleConnectionError();
        }
      };

    } catch (e) {
      console.error("Fallo al instanciar WebSocket:", e);
      handleConnectionError();
    }
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
