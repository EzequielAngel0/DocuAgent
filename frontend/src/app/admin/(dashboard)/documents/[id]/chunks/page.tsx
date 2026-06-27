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

  const [documentName, setDocumentName] = useState("");
  const [chunks, setChunks] = useState<Chunk[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchChunks = async () => {
      try {
        setLoading(true);
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
        
        // Leer cookie auth_token
        const token = document.cookie
          .split("; ")
          .find((row) => row.startsWith("auth_token="))
          ?.split("=")[1];

        const res = await fetch(`${baseUrl}/admin/documents/${docId}/chunks`, {
          headers: {
            "Authorization": `Bearer ${token || ""}`,
          },
        });

        if (!res.ok) {
          throw new Error("No se pudieron cargar los fragmentos vectoriales.");
        }

        const data = await res.json();
        
        // Mapear los datos de Qdrant a nuestro estado
        const mappedChunks: Chunk[] = data.map((item: any, idx: number) => ({
          index: idx + 1,
          text: item.content,
          vectorSnippet: `[${item.vector.map((v: number) => v.toFixed(3)).join(", ")}, ...]`,
          tokens: Math.floor(item.content.split(/\s+/).length * 1.3),  // Estimación de tokens
          metadata: {
            page: `Pág. ${item.page}`,
            language: "es",
          },
        }));

        setChunks(mappedChunks);
        if (data.length > 0) {
          setDocumentName(data[0].document_name);
        } else {
          setDocumentName("Documento");
        }
      } catch (err: any) {
        setError(err.message || "Error al conectar con el backend.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchChunks();
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
