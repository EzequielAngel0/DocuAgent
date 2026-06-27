"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Database, Layers, Eye } from "lucide-react";

interface Chunk {
  index: number;
  text: string;
  vectorSnippet: string;
  tokens: number;
  metadata: {
    page: string;
    language: string;
  };
}

export default function ChunksPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Desenvolver los parámetros en Next.js 15 de manera asíncrona
  const resolvedParams = use(params);
  const docId = resolvedParams.id;

  const [documentName, setDocumentName] = useState("documento_seleccionado.pdf");
  const [chunks, setChunks] = useState<Chunk[]>([]);

  useEffect(() => {
    // Buscar nombre del documento en localStorage
    const savedDocs = localStorage.getItem("admin_documents");
    if (savedDocs) {
      const docs = JSON.parse(savedDocs);
      const found = docs.find((d: any) => d.id === docId);
      if (found) {
        setDocumentName(found.name);
      } else {
        // Fallback si el ID no es secuencial sino un string directo
        setDocumentName(docId.replace(/%20/g, " "));
      }
    }

    // Generar chunks simulados
    const generatedChunks: Chunk[] = [
      {
        index: 1,
        text: "DocuAgent es la plataforma centralizada para consulta y búsqueda de información dentro de nuestra organización. Utiliza un pipeline RAG (Retrieval-Augmented Generation) para recuperar fragmentos de manuales de políticas y proveer respuestas contextualizadas mediante modelos de lenguaje autorizados.",
        vectorSnippet: "[0.142, -0.589, 0.912, 0.045, -0.312, 0.771, ...]",
        tokens: 64,
        metadata: { page: "Pág. 1", language: "es" },
      },
      {
        index: 2,
        text: "Las solicitudes de vacaciones anuales deben coordinarse con tu supervisor directo con un mínimo de 15 días de anticipación. El periodo vacacional anual remunerado consta de 15 días laborables por año de servicio continuo y no es acumulable por más de dos años consecutivos.",
        vectorSnippet: "[-0.201, 0.442, 0.812, 0.551, -0.108, 0.622, ...]",
        tokens: 61,
        metadata: { page: "Pág. 2", language: "es" },
      },
      {
        index: 3,
        text: "El reembolso de gastos de viaje y comidas de representación debe cargarse en el portal administrativo con su factura XML (CFDI) correspondiente dentro de los 5 días hábiles siguientes al gasto. Gastos mayores a $50 USD requieren la aprobación previa del Gerente de Área.",
        vectorSnippet: "[0.005, -0.198, 0.718, 0.223, 0.481, -0.092, ...]",
        tokens: 58,
        metadata: { page: "Pág. 4", language: "es" },
      },
      {
        index: 4,
        text: "Las bases de datos Qdrant (vectorial) y PostgreSQL (relacional) se ejecutan aisladas en la red privada de Podman. La autenticación de la consola requiere validación de doble factor (2FA) por TOTP. Todos los secretos en producción se consumen dinámicamente de OCI Vault.",
        vectorSnippet: "[-0.512, 0.774, -0.211, 0.089, -0.404, 0.822, ...]",
        tokens: 55,
        metadata: { page: "Pág. 6", language: "es" },
      },
    ];

    setChunks(generatedChunks);
  }, [docId]);

  return (
    <div className="chunks-page-wrapper fade-in">
      <div className="page-header flex items-center justify-between" style={{ marginBottom: "var(--space-md)" }}>
        <div>
          <Link href="/admin/documents" className="back-link flex items-center">
            <ArrowLeft size={16} style={{ marginRight: "6px" }} />
            Volver a Documentos
          </Link>
          <h3 className="section-title" style={{ marginTop: "var(--space-xs)" }}>
            Visor de Chunks (Fragmentos)
          </h3>
          <p className="section-desc">
            Viendo la partición vectorial y el texto procesado para: <strong style={{ color: "var(--text-primary)" }}>{documentName}</strong>
          </p>
        </div>
      </div>

      <div className="chunks-grid">
        {chunks.map((chunk) => (
          <div key={chunk.index} className="card chunk-card flex flex-col">
            <div className="chunk-card-header flex items-center justify-between">
              <span className="chunk-index-badge">
                <Layers size={12} style={{ marginRight: "4px" }} />
                Chunk #{chunk.index}
              </span>
              <div className="chunk-metadata flex gap-sm">
                <span className="chunk-meta-tag">{chunk.metadata.page}</span>
                <span className="chunk-meta-tag">{chunk.metadata.language.toUpperCase()}</span>
                <span className="chunk-meta-tag">{chunk.tokens} tokens</span>
              </div>
            </div>

            <div className="chunk-card-body flex-grow">
              <p className="chunk-text">"{chunk.text}"</p>
            </div>

            <div className="chunk-card-vector">
              <div className="vector-label flex items-center justify-between">
                <span className="flex items-center">
                  <Database size={12} style={{ marginRight: "4px" }} />
                  Vector Embedding
                </span>
                <span className="vector-dimension">1536 dim</span>
              </div>
              <code className="vector-snippet">{chunk.vectorSnippet}</code>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
