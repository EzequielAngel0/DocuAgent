"use client";

import { useState, useEffect } from "react";
import { Files, FileText, HeartHandshake, HelpCircle, ThumbsDown, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";

interface Document {
  chunks_count: number;
}

interface AuditLog {
  id: number;
  query: string;
  response: string;
  confidence: number;
  category: string;
  created_at: string;
  feedback: "positive" | "negative" | null;
}

export default function AdminDashboardPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Cargar documentos
        const docsRes = await apiFetch(`/admin/documents`);
        if (docsRes.ok) {
          const docsData = await docsRes.json();
          setDocuments(docsData);
        }

        // Cargar historial
        const logsRes = await apiFetch(`/admin/history`);
        if (logsRes.ok) {
          const logsData = await logsRes.json();
          setLogs(logsData);
        }
      } catch (err) {
        console.error("Error al cargar datos del dashboard:", err);
      }
    };

    fetchDashboardData();
  }, []);

  // Calcular estadísticas dinámicas
  const totalDocs = documents.length;
  const totalChunks = documents.reduce((acc, curr) => acc + curr.chunks_count, 0);
  const totalQueries = logs.length;

  const ratedLogs = logs.filter((l) => l.feedback === "positive" || l.feedback === "negative");
  const positiveCount = logs.filter((l) => l.feedback === "positive").length;
  const positiveRate = ratedLogs.length > 0 
    ? ((positiveCount / ratedLogs.length) * 100).toFixed(1) + "%" 
    : "100%";

  const stats = [
    { name: "Documentos", value: String(totalDocs), desc: "Archivos activos", icon: <Files size={20} className="icon-terracotta" /> },
    { name: "Chunks Indexados", value: String(totalChunks), desc: "Fragmentos vectoriales", icon: <FileText size={20} className="icon-bronze" /> },
    { name: "Consultas Totales", value: String(totalQueries), desc: "Consultas realizadas", icon: <HelpCircle size={20} className="icon-olive" /> },
    { name: "Feedback Positivo", value: positiveRate, desc: `${positiveCount} valoraciones 👍`, icon: <HeartHandshake size={20} className="icon-terracotta" /> },
  ];

  // Obtener las 3 preguntas peor valoradas (feedback negativo ordenado por menor confianza)
  const worstFeedbackQuestions = logs
    .filter((l) => l.feedback === "negative")
    .sort((a, b) => a.confidence - b.confidence)
    .slice(0, 3)
    .map((l) => ({
      question: l.query,
      category: l.category,
      date: l.created_at.split("T")[0],
      confidence: `${l.confidence}%`,
      reason: l.response.length > 80 ? l.response.substring(0, 78) + "..." : l.response,
    }));

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

      {/* DETALLES DE RETROALIMENTACIÓN */}
      <div className="dashboard-sections-grid" style={{ marginTop: "var(--space-lg)" }}>
        {/* PEOR RATING */}
        <div className="card admin-card">
          <div className="card-header flex items-center justify-between">
            <h4>Preguntas Peor Valoradas (Feedback 👎)</h4>
            <Link href="/admin/history" className="btn btn-secondary flex items-center" style={{ fontSize: "0.8rem", padding: "4px 8px" }}>
              Ver todo
              <ArrowUpRight size={14} style={{ marginLeft: "4px" }} />
            </Link>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {worstFeedbackQuestions.length === 0 ? (
              <div style={{ padding: "var(--space-xl)", textAlign: "center", color: "var(--text-secondary)" }}>
                <HeartHandshake size={36} style={{ margin: "0 auto var(--space-sm)", opacity: 0.3 }} />
                <p style={{ fontSize: "0.9rem" }}>¡Excelente! No hay respuestas con feedback negativo registrados.</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Pregunta</th>
                      <th>Área</th>
                      <th>Fecha</th>
                      <th>Confianza</th>
                      <th>Respuesta del Agente</th>
                    </tr>
                  </thead>
                  <tbody>
                    {worstFeedbackQuestions.map((q, idx) => (
                      <tr key={idx}>
                        <td>
                          <span className="table-log-query" style={{ maxWidth: "200px" }} title={q.question}>{q.question}</span>
                        </td>
                        <td>
                          <span className="badge-category">{q.category}</span>
                        </td>
                        <td style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                          {q.date}
                        </td>
                        <td>
                          <span className="badge-confidence low">{q.confidence}</span>
                        </td>
                        <td style={{ fontSize: "0.8rem", color: "var(--text-secondary)", maxWidth: "200px" }} title={q.reason}>
                          {q.reason}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
