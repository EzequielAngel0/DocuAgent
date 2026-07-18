import { UploadCloud, Binary, Filter, Award } from "lucide-react";

export default function HowItWorks() {
  const steps = [
    {
      number: "01",
      icon: <UploadCloud size={20} className="step-icon" />,
      title: "Carga de Documentos",
      description: "Sube documentos a través del panel de administración seguro. Los archivos se dividen en fragmentos de texto con lógica semántica.",
    },
    {
      number: "02",
      icon: <Binary size={20} className="step-icon" />,
      title: "Indexación Vectorial",
      description: "Generamos embeddings con Cohere Embed v3 y los almacenamos en la base de datos Qdrant para búsquedas semánticas ultrarrápidas.",
    },
    {
      number: "03",
      icon: <Filter size={20} className="step-icon" />,
      title: "Búsqueda y Reranking",
      description: "Al hacer una pregunta, recuperamos los chunks más relevantes y los clasificamos de nuevo con Cohere Rerank para máxima exactitud.",
    },
    {
      number: "04",
      icon: <Award size={20} className="step-icon" />,
      title: "Generación Factual",
      description: "El orquestador de agentes (LangGraph) ensambla el contexto y un LLM genera la respuesta citando el archivo y página de origen.",
    },
  ];

  return (
    <section className="how-it-works-section">
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">El Pipeline RAG paso a paso</h2>
          <p className="section-subtitle">
            Cómo transformamos documentación estática en un asistente inteligente y seguro.
          </p>
        </div>

        <div className="steps-container">
          {steps.map((step, idx) => (
            <div key={idx} className="step-item">
              <div className="step-number-badge">
                <span className="step-number">{step.number}</span>
              </div>
              <div className="step-card">
                <div className="step-header">
                  <div className="step-icon-wrapper">
                    {step.icon}
                  </div>
                  <h3 className="step-title">{step.title}</h3>
                </div>
                <p className="step-description">{step.description}</p>
              </div>
              {idx < steps.length - 1 && (
                <div className="step-divider-line"></div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
