"use client";

import { Files, FileText, HeartHandshake, HelpCircle, ThumbsUp, ThumbsDown, ArrowUpRight } from "lucide-react";
import Link from "next/link";

export default function AdminDashboardPage() {
  const stats = [
    { name: "Documentos", value: "14", desc: "Archivos activos", icon: <Files size={20} className="icon-terracotta" /> },
    { name: "Chunks Indexados", value: "432", desc: "Fragmentos vectoriales", icon: <FileText size={20} className="icon-bronze" /> },
    { name: "Consultas Totales", value: "1,280", desc: "Consultas realizadas", icon: <HelpCircle size={20} className="icon-olive" /> },
    { name: "Feedback Positivo", value: "89.2%", desc: "1,142 valoraciones 👍", icon: <HeartHandshake size={20} className="icon-terracotta" /> },
  ];

  const worstFeedbackQuestions = [
    {
      question: "¿Cómo solicito reembolso de Uber en fines de semana?",
      category: "Finanzas",
      date: "2026-06-25",
      confidence: "28%",
      reason: "Las fuentes no detallan reembolsos fuera de horario hábil.",
    },
    {
      question: "¿Cuál es la política de asuetos obligatorios 2026?",
      category: "Recursos Humanos",
      date: "2026-06-24",
      confidence: "35%",
      reason: "El Manual_Onboarding cargado está desactualizado (versión 2025).",
    },
    {
      question: "¿Cómo configuro el túnel con Docker Compose local?",
      category: "Seguridad",
      date: "2026-06-22",
      confidence: "42%",
      reason: "La documentación local solo cubre Podman en Windows.",
    },
  ];

  return (
    <div className="dashboard-wrapper fade-in">
      <div className="dashboard-welcome">
        <h3 className="section-title">Vista General del Sistema</h3>
        <p className="section-desc">Métricas operacionales de DocuAgent y retroalimentación de los usuarios.</p>
      </div>

      {/* STATS GRID */}
      <div className="stats-grid">
        {stats.map((stat, idx) => (
          <div key={idx} className="card stat-card flex items-start justify-between">
            <div className="stat-content">
              <span className="stat-name">{stat.name}</span>
              <span className="stat-value">{stat.value}</span>
              <span className="stat-desc">{stat.desc}</span>
            </div>
            <div className="stat-icon-wrapper">{stat.icon}</div>
          </div>
        ))}
      </div>

      {/* CHARTS & TABLES ROW */}
      <div className="dashboard-grid">
        {/* FEEDBACK DISTRIBUTION */}
        <div className="card dashboard-card">
          <div className="card-header">
            <h4>Distribución de Feedback</h4>
          </div>
          <div className="card-body">
            <div className="feedback-chart-wrapper">
              <div className="feedback-bar-container">
                <div className="feedback-bar-positive" style={{ width: "89.2%" }} title="89.2% Positivo"></div>
                <div className="feedback-bar-negative" style={{ width: "10.8%" }} title="10.8% Negativo"></div>
              </div>
              <div className="feedback-chart-legend flex justify-between">
                <div className="legend-item flex items-center">
                  <span className="legend-dot positive"></span>
                  <span>Útiles (89.2%)</span>
                </div>
                <div className="legend-item flex items-center">
                  <span className="legend-dot negative"></span>
                  <span>Incorrectas (10.8%)</span>
                </div>
              </div>
            </div>

            <div className="dashboard-quick-actions">
              <h5>Acciones Recomendadas</h5>
              <ul className="quick-actions-list">
                <li className="flex items-center justify-between">
                  <span>Actualizar manuales de asuetos 2026</span>
                  <Link href="/admin/documents" className="quick-action-link flex items-center">
                    Subir <ArrowUpRight size={14} style={{ marginLeft: "4px" }} />
                  </Link>
                </li>
                <li className="flex items-center justify-between">
                  <span>Revisar logs de preguntas con baja confianza</span>
                  <Link href="/admin/history" className="quick-action-link flex items-center">
                    Ver <ArrowUpRight size={14} style={{ marginLeft: "4px" }} />
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* WORST QUESTIONS */}
        <div className="card dashboard-card">
          <div className="card-header">
            <h4>Preguntas con Peor Calificación</h4>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Pregunta</th>
                    <th>Confianza</th>
                    <th>Motivo de Fallo</th>
                  </tr>
                </thead>
                <tbody>
                  {worstFeedbackQuestions.map((item, idx) => (
                    <tr key={idx}>
                      <td style={{ maxWidth: "200px" }}>
                        <div style={{ fontWeight: 500, fontSize: "0.85rem" }}>{item.question}</div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                          {item.category} · {item.date}
                        </div>
                      </td>
                      <td>
                        <span className="badge-confidence low">{item.confidence}</span>
                      </td>
                      <td style={{ fontSize: "0.8rem", color: "var(--text-terracotta)" }}>
                        {item.reason}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
