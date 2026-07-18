import { Cpu, Server, Database, Container, Globe, Terminal } from "lucide-react";

export default function TechStack() {
  const technologies = [
    {
      icon: <Globe className="tech-icon" size={20} />,
      name: "Next.js 15",
      type: "Frontend",
      desc: "React 19, TypeScript y App Router para una interfaz web responsiva y optimizada.",
    },
    {
      icon: <Terminal className="tech-icon" size={20} />,
      name: "FastAPI",
      type: "Backend API",
      desc: "API asíncrona de alto rendimiento en Python 3.12+ con documentación OpenAPI interactiva.",
    },
    {
      icon: <Cpu className="tech-icon" size={20} />,
      name: "LangGraph",
      type: "Orquestación IA",
      desc: "Estructuración de flujos RAG con grafos de estados y control estricto sobre las alucinaciones.",
    },
    {
      icon: <Database className="tech-icon" size={20} />,
      name: "Qdrant",
      type: "Base Vectorial",
      desc: "Indexación semántica ultrarrápida y filtrado preciso de metadatos de documentos.",
    },
    {
      icon: <Server className="tech-icon" size={20} />,
      name: "PostgreSQL",
      type: "Base Relacional",
      desc: "Trazabilidad de chats, persistencia de categorías, metadatos y auditoría completa.",
    },
    {
      icon: <Container className="tech-icon" size={20} />,
      name: "Oracle Cloud (OCI)",
      type: "Despliegue",
      desc: "Infraestructura segura basada en contenedores (Podman) en la nube de Oracle.",
    },
  ];

  return (
    <section className="tech-stack-section">
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">Arquitectura Tecnológica Robusta</h2>
          <p className="section-subtitle">
            Un stack moderno, asíncrono y de grado empresarial que garantiza fiabilidad y velocidad.
          </p>
        </div>

        <div className="tech-grid">
          {technologies.map((tech, idx) => (
            <div key={idx} className="tech-card">
              <div className="tech-card-header">
                <div className="tech-icon-wrapper">
                  {tech.icon}
                </div>
                <div className="tech-name-group">
                  <h3 className="tech-name">{tech.name}</h3>
                  <span className="tech-type">{tech.type}</span>
                </div>
              </div>
              <p className="tech-desc">{tech.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
