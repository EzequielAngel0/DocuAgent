"use client";

import { useState, useEffect } from "react";
import { Search, ThumbsUp, ThumbsDown, Filter, Calendar, X, Eye, HelpCircle } from "lucide-react";

interface CitationData {
  id: string;
  title: string;
  page: number;
  confidence: number;
  snippet: string;
}

interface AuditLog {
  id: number;
  query: string;
  response: string;
  confidence: number;
  category: string;
  created_at: string;
  feedback: "positive" | "negative" | null;
  citations?: CitationData[];
}

export default function AdminHistoryPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("Todas");
  const [filterFeedback, setFilterFeedback] = useState("Todos");
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [categories, setCategories] = useState<string[]>([]);

  // 1. Cargar categorías dinámicas para los filtros
  useEffect(() => {
    const fetchCats = async () => {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("auth_token="))
        ?.split("=")[1];
      try {
        const res = await fetch(`${baseUrl}/admin/categories`, {
          headers: { "Authorization": `Bearer ${token || ""}` }
        });
        if (res.ok) {
          const data = await res.json();
          setCategories(data.map((c: any) => c.name));
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchCats();
  }, []);

  // 2. Cargar historial con filtros dinámicos del backend
  useEffect(() => {
    const fetchLogs = async () => {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("auth_token="))
        ?.split("=")[1];

      // Formatear query params
      const params = new URLSearchParams();
      if (searchTerm.trim()) params.append("search", searchTerm.trim());
      if (filterCategory !== "Todas") params.append("category", filterCategory);
      
      if (filterFeedback === "Positivo") params.append("rating", "positive");
      else if (filterFeedback === "Negativo") params.append("rating", "negative");
      else if (filterFeedback === "Sin calificar") params.append("rating", "unrated");

      try {
        const res = await fetch(`${baseUrl}/admin/history?${params.toString()}`, {
          headers: { "Authorization": `Bearer ${token || ""}` }
        });
        if (res.ok) {
          const data = await res.json();
          setLogs(data);
        }
      } catch (err) {
        console.error("Error al cargar historial:", err);
      }
    };

    // Debounce simple para el buscador
    const delayDebounce = setTimeout(() => {
      fetchLogs();
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchTerm, filterCategory, filterFeedback]);

  const getConfidenceClass = (conf: number) => {
    if (conf >= 70) return "high";
    if (conf >= 40) return "medium";
    return "low";
  };

  const getFeedbackIcon = (feedback: AuditLog["feedback"]) => {
    if (feedback === "positive") return <ThumbsUp size={14} className="icon-olive" />;
    if (feedback === "negative") return <ThumbsDown size={14} className="icon-terracotta" />;
    return <span style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>-</span>;
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    // Convertir ISO DateTime a formato legible "YYYY-MM-DD HH:MM"
    const date = new Date(dateStr);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    const hh = String(date.getHours()).padStart(2, "0");
    const min = String(date.getMinutes()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
  };

  return (
    <div className="history-page-wrapper fade-in">
      <div className="page-header">
        <h3 className="section-title">Historial de Consultas</h3>
        <p className="section-desc">Audita las preguntas de los colaboradores y el rendimiento del agente RAG.</p>
      </div>

      {/* BARRA DE FILTROS */}
      <div className="card filters-card" style={{ marginBottom: "var(--space-md)", padding: "var(--space-md)" }}>
        <div className="flex flex-wrap items-center justify-between gap-md">
          {/* BUSCADOR */}
          <div className="search-bar-wrapper flex-grow" style={{ maxWidth: "400px" }}>
            <Search size={16} className="search-icon" />
            <input
              type="text"
              className="form-input search-input"
              placeholder="Buscar por pregunta o respuesta..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* SELECTS */}
          <div className="flex flex-wrap gap-md">
            <div className="flex items-center gap-sm">
              <Filter size={14} className="icon-terracotta" />
              <span style={{ fontSize: "0.85rem", fontWeight: "bold" }}>Área:</span>
              <select
                className="form-input"
                style={{ padding: "6px 12px", fontSize: "0.85rem", width: "auto" }}
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                <option value="Todas">Todas</option>
                {categories.map((cat, idx) => (
                  <option key={idx} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-sm">
              <span style={{ fontSize: "0.85rem", fontWeight: "bold" }}>Feedback:</span>
              <select
                className="form-input"
                style={{ padding: "6px 12px", fontSize: "0.85rem", width: "auto" }}
                value={filterFeedback}
                onChange={(e) => setFilterFeedback(e.target.value)}
              >
                <option value="Todos">Todos</option>
                <option value="Positivo">Útiles (👍)</option>
                <option value="Negativo">Incorrectas (👎)</option>
                <option value="Sin calificar">Sin Calificar</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* TABLA DE AUDITORÍA */}
      <div className="card admin-card">
        <div className="card-body" style={{ padding: 0 }}>
          {logs.length === 0 ? (
            <div style={{ padding: "var(--space-xl)", textAlign: "center", color: "var(--text-secondary)" }}>
              <HelpCircle size={48} style={{ margin: "0 auto var(--space-md)", opacity: 0.3 }} />
              <p>No se encontraron registros de auditoría que coincidan con los filtros.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Pregunta del Colaborador</th>
                    <th>Área / Categoría</th>
                    <th>Confianza RAG</th>
                    <th style={{ textAlign: "center" }}>Feedback</th>
                    <th style={{ textAlign: "right" }}>Detalles</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id}>
                      <td style={{ fontSize: "0.85rem", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>
                        <div className="flex items-center">
                          <Calendar size={12} style={{ marginRight: "6px" }} />
                          {formatDate(log.created_at)}
                        </div>
                      </td>
                      <td>
                        <span className="table-log-query" title={log.query}>{log.query}</span>
                      </td>
                      <td>
                        <span className="badge-category">{log.category}</span>
                      </td>
                      <td>
                        <span className={`badge-confidence ${getConfidenceClass(log.confidence)}`}>
                          {log.confidence > 0 ? `${log.confidence}%` : "0.0%"}
                        </span>
                      </td>
                      <td style={{ textAlign: "center" }}>
                        {getFeedbackIcon(log.feedback)}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <button
                          className="btn btn-action"
                          onClick={() => setSelectedLog(log)}
                          title="Inspeccionar consulta"
                        >
                          <Eye size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* MODAL DETALLES */}
      {selectedLog && (
        <div className="modal-overlay">
          <div className="modal-content fade-in" style={{ maxWidth: "600px" }}>
            <div className="modal-header flex items-center justify-between">
              <h4>Inspección de Consulta #{selectedLog.id}</h4>
              <button className="btn-close-modal" onClick={() => setSelectedLog(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)" }}>
              <div className="detail-field">
                <span className="detail-field-label">Pregunta:</span>
                <p className="detail-field-value query">"{selectedLog.query}"</p>
              </div>

              <div className="detail-field">
                <span className="detail-field-label">Respuesta del Agente:</span>
                <p className="detail-field-value response">{selectedLog.response}</p>
              </div>

              <div className="flex justify-between flex-wrap gap-md" style={{ borderTop: "1px solid var(--border-color)", paddingTop: "var(--space-md)" }}>
                <div>
                  <span className="detail-field-label">Área / Categoría:</span>
                  <span className="badge-category" style={{ display: "inline-block", marginTop: "4px" }}>
                    {selectedLog.category}
                  </span>
                </div>
                <div>
                  <span className="detail-field-label">Confianza del Recuperador:</span>
                  <span className={`badge-confidence ${getConfidenceClass(selectedLog.confidence)}`} style={{ display: "inline-block", marginTop: "4px" }}>
                    {selectedLog.confidence > 0 ? `${selectedLog.confidence}%` : "0.0%"}
                  </span>
                </div>
                <div>
                  <span className="detail-field-label">Feedback:</span>
                  <span style={{ display: "block", marginTop: "6px" }}>
                    {selectedLog.feedback === "positive" ? "Útil (👍)" : selectedLog.feedback === "negative" ? "Incorrecto (👎)" : "Sin calificar"}
                  </span>
                </div>
              </div>

              <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "var(--space-md)" }}>
                <span className="detail-field-label">Fuentes Citadas en Contexto:</span>
                {(!selectedLog.citations || selectedLog.citations.length === 0) ? (
                  <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "4px" }}>No se utilizaron citas de documentos.</p>
                ) : (
                  <div className="flex flex-col gap-sm" style={{ marginTop: "6px" }}>
                    {selectedLog.citations.map((cite, index) => (
                      <div key={index} className="citation-inspect-card" style={{ padding: "8px", border: "1px solid var(--border-color)", borderRadius: "4px", background: "var(--bg-secondary)" }}>
                        <span style={{ fontSize: "0.85rem", fontWeight: "bold" }}>
                          [{index + 1}] {cite.title} - Pág. {cite.page} (Confianza: {cite.confidence}%)
                        </span>
                        <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "2px", fontStyle: "italic" }}>
                          "{cite.snippet}"
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer flex justify-end" style={{ marginTop: "var(--space-md)" }}>
              <button className="btn btn-secondary" onClick={() => setSelectedLog(null)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
