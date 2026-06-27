import { Search, Layers, BookOpen, ShieldAlert } from "lucide-react";

export default function Features() {
  const featureList = [
    {
      icon: <Search className="feature-icon" size={24} />,
      title: "Búsqueda Semántica",
      description: "Entiende el significado de las preguntas de los colaboradores en lenguaje natural, y busca respuestas más allá del texto exacto.",
    },
    {
      icon: <Layers className="feature-icon" size={24} />,
      title: "Multi-formato",
      description: "Soporte completo para PDF (OCR listo en el futuro), Word, Excel, Markdown, CSV, JSON y texto plano. Todo procesado en segundos.",
    },
    {
      icon: <BookOpen className="feature-icon" size={24} />,
      title: "Citación de Fuentes",
      description: "Transparencia total. Cada respuesta se acompaña de la sección exacta, el documento y la página de donde se obtuvo la información.",
    },
    {
      icon: <ShieldAlert className="feature-icon" size={24} />,
      title: "Anti-Alucinaciones",
      description: "Si el agente no encuentra la información en los documentos indexados, lo dirá explícitamente en lugar de inventar respuestas.",
    },
  ];

  return (
    <section className="features-section">
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">Diseñado para la precisión empresarial</h2>
          <p className="section-subtitle">
            Combina velocidad y seguridad en la recuperación de información crítica para tus colaboradores.
          </p>
        </div>

        <div className="features-grid">
          {featureList.map((feat, index) => (
            <div key={index} className="card feature-card">
              <div className="feature-icon-wrapper">
                {feat.icon}
              </div>
              <h3 className="feature-card-title">{feat.title}</h3>
              <p className="feature-card-desc">{feat.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
