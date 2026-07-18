"use client";

import { useEffect, useRef } from "react";
import { Send, Bot, Menu, ArrowDown } from "lucide-react";
import MessageItem, { Message } from "./MessageItem";

interface ChatAreaProps {
  messages: Message[];
  inputValue: string;
  onInputChange: (val: string) => void;
  onSendMessage: (text?: string) => void;
  isTyping: boolean;
  onOpenMobileMenu: () => void;
}

export default function ChatArea({
  messages,
  inputValue,
  onInputChange,
  onSendMessage,
  isTyping,
  onOpenMobileMenu,
}: ChatAreaProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll al fondo al recibir mensajes o cambiar estado
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSendMessage();
  };

  // Ejemplos genéricos de TEMAS de documentos (no afirman saber nada del propio
  // proyecto: el agente solo responde a partir de los documentos cargados).
  const suggestedQuestions = [
    { text: "¿Cuál es la política de vacaciones?", label: "Recursos Humanos" },
    { text: "¿Cómo solicito un reembolso de gastos?", label: "Finanzas" },
    { text: "¿Cuál es el procedimiento ante un incidente?", label: "Seguridad" },
    { text: "Resume el reglamento interno de trabajo", label: "General" },
  ];

  return (
    <main className="chat-area">
      {/* HEADER */}
      <header className="chat-area-header">
        <button
          className="chat-area-menu-toggle btn-icon mobile-only"
          onClick={onOpenMobileMenu}
          aria-label="Abrir conversaciones"
        >
          <Menu size={20} />
        </button>

        <div className="chat-area-header-info">
          <h2 className="chat-agent-title">Asistente Corporativo RAG</h2>
          <span className="chat-agent-status">En Línea</span>
        </div>
      </header>

      {/* MESSAGES LIST OR EMPTY STATE */}
      <div className="chat-messages-container">
        {messages.length === 0 ? (
          <div className="chat-empty-state slide-up">
            <div className="chat-empty-logo">
              <img src="/logo.svg" alt="DocuAgent Logo" width="64" height="64" />
            </div>
            <h3 className="chat-empty-title">Te damos la bienvenida a DocuAgent</h3>
            <p className="chat-empty-description">
              Pregúntame cualquier duda sobre manuales corporativos, reglamentos, contratos o procedimientos operacionales de la empresa.
            </p>

            <div className="suggested-questions-container">
              <h4 className="suggested-questions-title">Consultas de Ejemplo sugeridas</h4>
              <div className="suggested-questions-grid">
                {suggestedQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    className="suggested-q-btn"
                    onClick={() => onSendMessage(q.text)}
                  >
                    <span className="suggested-q-text">{q.text}</span>
                    <span className="suggested-q-badge">{q.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="chat-messages-list-wrapper">
            {messages.map((msg) => (
              <MessageItem key={msg.id} message={msg} />
            ))}

            {/* TYPING INDICATOR */}
            {isTyping && (
              <div className="chat-message-row assistant typing fade-in">
                <div className="message-container">
                  <div className="message-avatar-wrapper">
                    <div className="message-avatar bot">
                      <Bot size={16} />
                    </div>
                  </div>
                  <div className="message-bubble-wrapper">
                    <div className="message-bubble typing-bubble">
                      <div className="typing-dots">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={scrollRef} style={{ height: "1px" }} />
          </div>
        )}
      </div>

      {/* INPUT FORM */}
      <div className="chat-input-wrapper">
        <form onSubmit={handleSubmit} className="chat-input-form">
          <input
            type="text"
            className="chat-input-text"
            placeholder="Pregunta sobre las políticas, manuales, etc..."
            value={inputValue}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                e.preventDefault();
                if (inputValue.trim() && !isTyping) onSendMessage();
              }
            }}
            disabled={isTyping}
          />
          <button
            type="submit"
            className="btn btn-primary chat-btn-submit"
            disabled={!inputValue.trim() || isTyping}
            aria-label="Enviar pregunta"
          >
            <Send size={16} />
          </button>
        </form>
        <p className="chat-input-disclaimer">
          DocuAgent puede cometer errores. Verifica la información clave citada de los documentos oficiales.{" "}
          <a
            href="https://angelezequiel.dev/docuagent/privacidad"
            target="_blank"
            rel="noopener noreferrer"
            className="chat-input-privacy-link"
          >
            Aviso de Privacidad
          </a>
        </p>
      </div>
    </main>
  );
}
