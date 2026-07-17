"use client";

import { useState, useEffect } from "react";
import { ThumbsUp, ThumbsDown, Bot, User } from "lucide-react";
import SourceCitations, { Citation } from "./SourceCitations";

export interface Message {
  id: string;
  sender: "user" | "assistant";
  text: string;
  citations?: Citation[];
  logId?: number;
}

interface MessageItemProps {
  message: Message;
}

export default function MessageItem({ message }: MessageItemProps) {
  const [feedback, setFeedback] = useState<"positive" | "negative" | null>(null);

  const isAssistant = message.sender === "assistant";

  // Restaurar el feedback guardado: el pulgar debe persistir al recargar la
  // página o cambiar de sesión (antes se reiniciaba porque vivía solo en estado).
  useEffect(() => {
    const saved = localStorage.getItem(`chat_feedback_${message.id}`);
    if (saved === "positive" || saved === "negative") setFeedback(saved);
  }, [message.id]);

  // Formateador simple de texto con soporte básico de markdown (**bold**, - list)
  const formatMessageText = (txt: string) => {
    // Escapar caracteres básicos de HTML para seguridad
    let escaped = txt
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // Reemplazar **negrita**
    escaped = escaped.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

    // Reemplazar listas (- item)
    const lines = escaped.split("\n");
    let inList = false;
    const formattedLines = lines.map((line) => {
      const trimmed = line.trim();
      if (trimmed.startsWith("- ")) {
        const itemContent = trimmed.substring(2);
        let output = "";
        if (!inList) {
          inList = true;
          output += '<ul className="chat-message-list">';
        }
        output += `<li>${itemContent}</li>`;
        return output;
      } else {
        let output = "";
        if (inList) {
          inList = false;
          output += "</ul>";
        }
        output += `<p>${line}</p>`;
        return output;
      }
    });

    if (inList) {
      formattedLines.push("</ul>");
    }

    return formattedLines.join("");
  };

  const handleFeedback = async (type: "positive" | "negative") => {
    const isToggleOff = feedback === type;
    const nextState = isToggleOff ? null : type;
    const nextFeedback = isToggleOff ? "none" : type;
    setFeedback(nextState);

    // Persistir localmente para que el pulgar se mantenga.
    if (nextState) localStorage.setItem(`chat_feedback_${message.id}`, nextState);
    else localStorage.removeItem(`chat_feedback_${message.id}`);

    if (message.logId) {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
        await fetch(`${baseUrl}/admin/history/${message.logId}/feedback`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ feedback: nextFeedback }),
        });
      } catch (err) {
        console.error("Error al guardar feedback en backend:", err);
      }
    }
  };

  return (
    <div className={`chat-message-row ${message.sender}`}>
      <div className="message-container">
        <div className="message-avatar-wrapper">
          {isAssistant ? (
            <div className="message-avatar bot">
              <Bot size={16} />
            </div>
          ) : (
            <div className="message-avatar user">
              <User size={16} />
            </div>
          )}
        </div>

        <div className="message-bubble-wrapper">
          <div className="message-bubble">
            <div 
              className="message-text" 
              dangerouslySetInnerHTML={{ __html: formatMessageText(message.text) }}
            />

            {isAssistant && message.citations && message.citations.length > 0 && (
              <SourceCitations citations={message.citations} />
            )}
          </div>

          {isAssistant && (
            <div className="message-actions-row">
              <span className="message-ai-badge">Agente de IA</span>
              <div className="message-feedback-buttons">
                <button
                  className={`btn-feedback-like ${feedback === "positive" ? "active" : ""}`}
                  onClick={() => handleFeedback("positive")}
                  aria-label="Me gusta"
                  title="Respuesta útil"
                >
                  <ThumbsUp size={12} />
                </button>
                <button
                  className={`btn-feedback-dislike ${feedback === "negative" ? "active" : ""}`}
                  onClick={() => handleFeedback("negative")}
                  aria-label="No me gusta"
                  title="Respuesta incorrecta o incompleta"
                >
                  <ThumbsDown size={12} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
