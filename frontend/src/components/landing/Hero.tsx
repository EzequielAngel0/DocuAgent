import Link from "next/link";
import { MessageSquare, ArrowRight, ShieldCheck, Database, FileText } from "lucide-react";

export default function Hero() {
  return (
    <section className="hero fade-in">
      <div className="hero-container">
        <div className="hero-content">
          <div className="hero-badge">
            <ShieldCheck size={14} className="hero-badge-icon" />
            <span>Agente de Inteligencia Artificial Autorizado</span>
          </div>
          
          <h1 className="hero-title">
            Toda la documentación de tu empresa, <span>al alcance de una pregunta</span>
          </h1>
          
          <p className="hero-description">
            Consulta políticas de recursos humanos, contratos, normativas financieras y guías de operaciones al instante. Respuestas precisas, seguras y con citación directa de fuentes.
          </p>
          
          <div className="hero-actions">
            <Link href="/chat" className="btn btn-primary hero-btn-chat">
              <MessageSquare size={18} style={{ marginRight: "8px" }} />
              Iniciar Consulta RAG
            </Link>
          </div>
        </div>
        
        <div className="hero-visual">
          <div className="hero-flat-diagram">
            {/* Diagrama editorial minimalista que representa RAG */}
            <div className="diagram-card doc-card">
              <div className="diagram-card-header">
                <FileText size={16} className="icon-terracotta" />
                <span className="diagram-card-title">Manual_Onboarding.pdf</span>
              </div>
              <div className="diagram-lines">
                <div className="diagram-line short"></div>
                <div className="diagram-line medium"></div>
                <div className="diagram-line long"></div>
              </div>
            </div>
            
            <div className="diagram-arrow arrow-1">
              <div className="diagram-dot"></div>
              <div className="diagram-line-horizontal"></div>
            </div>
            
            <div className="diagram-card vector-card">
              <div className="diagram-card-header">
                <Database size={16} className="icon-olive" />
                <span className="diagram-card-title">Qdrant Vector DB</span>
              </div>
              <div className="diagram-vector-grid">
                <span>[0.12, -0.45, 0.89...]</span>
                <span>[0.91, 0.05, -0.32...]</span>
              </div>
            </div>

            <div className="diagram-arrow arrow-2">
              <div className="diagram-line-horizontal"></div>
              <div className="diagram-dot"></div>
            </div>
            
            <div className="diagram-response-bubble">
              <div className="bubble-header">
                <div className="bubble-bot-avatar">DA</div>
                <span className="bubble-bot-name">DocuAgent</span>
              </div>
              <p className="bubble-text">
                "El periodo de vacaciones anuales es de 15 días laborables..."
              </p>
              <div className="bubble-source">
                <span>Fuente: Manual_Onboarding.pdf (Pág. 4)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
