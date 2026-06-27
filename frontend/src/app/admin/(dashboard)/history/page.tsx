"use client";

import { useState, useEffect } from "react";
import { Search, ThumbsUp, ThumbsDown, Filter, Calendar, X, Eye, HelpCircle } from "lucide-react";

interface AuditLog {
  id: string;
  query: string;
  response: string;
  confidence: number;
  category: string;
  createdAt: string;
  feedback: "positive" | "negative" | null;
  citations: string[];
}

export default function AdminHistoryPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("Todas");
  const [filterFeedback, setFilterFeedback] = useState("Todos");
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  useEffect(() => {
    // Cargar historial mockeado
    const initialLogs: AuditLog[] = [
      {
        id: "log_1",
        query: "¿Cuál es el periodo de vacaciones anuales remuneradas?",
        response: "En la empresa, el periodo de vacaciones anuales remuneradas es de 15 días laborables por año completo de servicios prestados. Estas pueden solicitarse a partir del primer aniversario en la organización.",
        confidence: 94,
        category: "Recursos Humanos",
        createdAt: "2026-06-26 14:23",
        feedback: "positive",
        citations: ["politica_vacaciones.pdf (Pág. 2)", "manual_onboarding.docx (Pág. 12)"],
      },
      {
        id: "log_2",
        query: "¿Cómo solicito reembolso de Uber en fines de semana?",
        response: "No encontré información relevante sobre reembolsos de transporte en fines de semana en los manuales de gastos vigentes. Por favor consulta con Finanzas.",
        confidence: 28,
        category: "Finanzas",
        createdAt: "2026-06-25 09:12",
        feedback: "negative",
        citations: [],
      },
      {
        id: "log_3",
        query: "¿Cuál es la política de reembolso de viajes?",
        response: "La política de reembolso de gastos corporativos establece que todos los viáticos y gastos de transporte deben rendirse mediante la plataforma administrativa en un plazo máximo de 5 días hábiles tras finalizar el viaje.",
        confidence: 88,
        category: "Finanzas",
        createdAt: "2026-06-25 11:45",
        feedback: "positive",
        citations: ["politica_gastos.pdf (Pág. 4)"],
      },
      {
        id: "log_4",
        query: "¿Cuáles son las medidas de seguridad del túnel de Podman?",
        response: "Las bases de datos Qdrant y PostgreSQL se ejecutan aisladas en la red privada de Podman. La autenticación de la consola requiere validación de doble factor (2FA) por TOTP.",
        confidence: 85,
        category: "Seguridad",
        createdAt: "2026-06-22 17:02",
        feedback: "positive",
        citations: ["security.md (Pág. 3)"],
      },
      {
        id: "log_5",
        query: "¿Cuál es el horario laboral oficial de oficina?",
        response: "El horario oficial de oficina es de lunes a viernes de 9:00 AM a 6:00 PM con una hora de almuerzo flexible entre la 1:00 PM y las 3:00 PM.",
        confidence: 90,
        category: "Recursos Humanos",
        createdAt: "2026-06-20 08:30",
        feedback: null,
        citations: ["manual_onboarding.docx (Pág. 2)"],
      },
    ];

    setLogs(initialLogs);
  }, []);

  // Filtrar logs en base al buscador y selects
  const filteredLogs = logs.filter((log) => {
    const matchesSearch = log.query.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          log.response.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = filterCategory === "Todas" || log.category === filterCategory;
    
    const matchesFeedback = filterFeedback === "Todos" || 
      (filterFeedback === "Positivo" && log.feedback === "positive") ||
      (filterFeedback === "Negativo" && log.feedback === "negative") ||
      (filterFeedback === "Sin valorar" && log.feedback === null);

    return matchesSearch && matchesCategory && matchesFeedback;
  });

  const getConfidenceClass = (score: number) => {
    if (score >= 80) return "high";
    if (score >= 50) return "medium";
    return "low";
  };

  return (
    <div className="history-page-wrapper fade-in">
      <div className="page-header">
        <h3 className="section-title">Historial de Consultas</h3>
        <p className="section-desc">Auditoría y análisis de las preguntas enviadas por los colaboradores de la empresa.</p>
      </div>

      {/* BARRA DE FILTROS */}
      <div className="card filters-card">
        <div className="filters-grid flex items-center justify-between flex-wrap gap-md">
          {/* BUSCADOR */}
          <div className="search-bar-wrapper flex-grow" style={{ minWidth: "260px" }}>
            <Search size={16} className="search-bar-icon" />
            <input
              type="text"
              placeholder="Buscar en preguntas o respuestas..."
              className="form-input search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex gap-sm flex-wrap items-center">
            {/* CATEGORIA */}
            <div className="filter-select-group">
              <span className="filter-select-label">Área:</span>
              <select
                className="form-input select-filter"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                <option value="Todas">Todas las áreas</option>
                <option value="Recursos Humanos">Recursos Humanos</option>
                <option value="Finanzas">Finanzas</option>
                <option value="Seguridad">Seguridad</option>
              </select>
            </div>

            {/* FEEDBACK */}
            <div className="filter-select-group">
              <span className="filter-select-label">Feedback:</span>
              <select
                className="form-input select-filter"
                value={filterFeedback}
                onChange={(e) => setFilterFeedback(e.target.value)}
              >
                <option value="Todos">Todos</option>
                <option value="Positivo">Útiles 👍</option>
                <option value="Negativo">Incorrectas 👎</option>
                <option value="Sin valorar">Sin valorar</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* TABLA DE AUDITORIA */}
      <div className="card admin-card" style={{ marginTop: "var(--space-md)", padding: 0 }}>
        <div className="table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Consulta del Colaborador</th>
                <th>Confianza</th>
                <th>Fecha y Hora</th>
                <th>Feedback</th>
                <th style={{ textAlign: "right" }}>Detalles</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: "var(--space-lg)", textAlign: "center", color: "var(--text-secondary)" }}>
                    No se encontraron registros de auditoría con los filtros aplicados.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="history-row-clickable">
                    <td style={{ maxWidth: "350px" }}>
                      <div className="history-query-text">{log.query}</div>
                      <span className="badge-category">{log.category}</span>
                    </td>
                    <td>
                      <span className={`badge-confidence ${getConfidenceClass(log.confidence)}`}>
                        {log.confidence}%
                      </span>
                    </td>
                    <td style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                      {log.createdAt}
                    </td>
                    <td>
                      {log.feedback === "positive" ? (
                        <span className="badge-feedback positive">👍 Útil</span>
                      ) : log.feedback === "negative" ? (
                        <span className="badge-feedback negative">👎 Incorrecta</span>
                      ) : (
                        <span className="badge-feedback neutral">Sin valorar</span>
                      )}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <button
                        className="btn-table-action"
                        onClick={() => setSelectedLog(log)}
                        title="Ver detalle de consulta"
                        aria-label="Ver detalles"
                      >
                        <Eye size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAIL MODAL */}
      {selectedLog && (
        <div className="modal-overlay flex items-center justify-center fade-in">
          <div className="modal-content card slide-up" style={{ maxWidth: "600px" }}>
            <div className="modal-header flex items-center justify-between">
              <h4>Detalle de Consulta RAG</h4>
              <button className="btn-icon" onClick={() => setSelectedLog(null)}>
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
                    {selectedLog.confidence}%
                  </span>
                </div>
                <div>
                  <span className="detail-field-label">Fecha:</span>
                  <span style={{ fontSize: "0.85rem", display: "inline-block", marginTop: "4px" }}>
                    {selectedLog.createdAt}
                  </span>
                </div>
              </div>

              <div className="detail-field">
                <span className="detail-field-label">Fuentes Citadas:</span>
                {selectedLog.citations.length === 0 ? (
                  <p className="detail-no-citations">No se usaron fuentes para esta respuesta (Fallback activado).</p>
                ) : (
                  <ul className="detail-citations-list" style={{ marginTop: "4px" }}>
                    {selectedLog.citations.map((cite, idx) => (
                      <li key={idx} className="detail-citation-item">{cite}</li>
                    ))}
                  </ul>
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
