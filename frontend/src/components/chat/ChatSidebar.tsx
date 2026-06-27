"use client";

import { MessageSquare, Plus, Trash2, Bot, ChevronLeft } from "lucide-react";
import Link from "next/link";

interface ChatSession {
  id: string;
  title: string;
}

interface ChatSidebarProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onCreateSession: () => void;
  onDeleteSession: (id: string) => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export default function ChatSidebar({
  sessions,
  activeSessionId,
  onSelectSession,
  onCreateSession,
  onDeleteSession,
  isMobileOpen,
  onCloseMobile,
}: ChatSidebarProps) {
  return (
    <aside className={`chat-sidebar ${isMobileOpen ? "mobile-open" : ""}`}>
      <div className="chat-sidebar-header">
        <Link href="/" className="chat-sidebar-logo">
          <img src="/logo.svg" alt="DocuAgent Logo" width="22" height="22" />
          <span>Docu<span>Agent</span></span>
        </Link>
        <button 
          className="chat-sidebar-close btn-icon mobile-only" 
          onClick={onCloseMobile}
          aria-label="Cerrar menú"
        >
          <ChevronLeft size={18} />
        </button>
      </div>

      <div className="chat-sidebar-action">
        <button className="btn btn-primary chat-sidebar-btn-new" onClick={onCreateSession}>
          <Plus size={16} style={{ marginRight: "8px" }} />
          Nuevo Chat
        </button>
      </div>

      <div className="chat-sidebar-sessions">
        <h4 className="chat-sidebar-title">Tus Conversaciones</h4>
        {sessions.length === 0 ? (
          <p className="chat-sidebar-empty">No hay conversaciones</p>
        ) : (
          <ul className="chat-sessions-list">
            {sessions.map((session) => (
              <li key={session.id} className="chat-session-item-wrapper">
                <button
                  className={`chat-session-item-btn ${
                    activeSessionId === session.id ? "active" : ""
                  }`}
                  onClick={() => {
                    onSelectSession(session.id);
                    onCloseMobile();
                  }}
                >
                  <MessageSquare size={16} className="chat-session-icon" />
                  <span className="chat-session-title">{session.title}</span>
                </button>
                <button
                  className="chat-session-delete"
                  onClick={() => onDeleteSession(session.id)}
                  title="Eliminar conversación"
                  aria-label="Eliminar conversación"
                >
                  <Trash2 size={14} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="chat-sidebar-footer">
        <div className="chat-sidebar-user">
          <div className="user-avatar">
            <Bot size={16} className="user-avatar-icon" />
          </div>
          <div className="user-info">
            <span className="user-name">Colaborador</span>
            <span className="user-role">Acceso Público</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
