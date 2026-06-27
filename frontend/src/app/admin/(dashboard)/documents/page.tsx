"use client";

import { useState, useEffect } from "react";
import { Upload, Trash2, RotateCw, FileText, ChevronRight, CheckCircle, AlertCircle } from "lucide-react";
import Link from "next/link";

interface Document {
  id: string;
  name: string;
  category_id: string;
  uploaded_at: string;
  chunks_count: number;
  status: "Indexando" | "Indexado" | "Fallo";
}

interface CategoryData {
  id: string;
  name: string;
}

export default function AdminDocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [uploadCategoryId, setUploadCategoryId] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [reindexingId, setReindexingId] = useState<string | null>(null);
  const [categories, setCategories] = useState<CategoryData[]>([]);

  // 1. Cargar datos iniciales del backend (documentos y categorías reales)
  useEffect(() => {
    const loadInitialData = async () => {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("auth_token="))
        ?.split("=")[1];

      try {
        // Cargar categorías
        const catsRes = await fetch(`${baseUrl}/admin/categories`, {
          headers: { "Authorization": `Bearer ${token || ""}` }
        });
        if (catsRes.ok) {
          const catsData = await catsRes.json();
          setCategories(catsData);
          if (catsData.length > 0) {
            setUploadCategoryId(catsData[0].id);
          }
        }

        // Cargar documentos
        const docsRes = await fetch(`${baseUrl}/admin/documents`, {
          headers: { "Authorization": `Bearer ${token || ""}` }
        });
        if (docsRes.ok) {
          const docsData = await docsRes.json();
          setDocuments(docsData);
        }
      } catch (err) {
        console.error("Error al cargar datos iniciales:", err);
      }
    };
    loadInitialData();
  }, []);

  // 2. Polling inteligente: refrescar lista de documentos mientras haya alguno en estado "Indexando"
  useEffect(() => {
    const hasIndexingDocs = documents.some((d) => d.status === "Indexando");
    if (hasIndexingDocs) {
      const interval = setInterval(async () => {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
        const token = document.cookie
          .split("; ")
          .find((row) => row.startsWith("auth_token="))
          ?.split("=")[1];
        try {
          const res = await fetch(`${baseUrl}/admin/documents`, {
            headers: { "Authorization": `Bearer ${token || ""}` }
          });
          if (res.ok) {
            const data = await res.json();
            setDocuments(data);
          }
        } catch (err) {
          console.error("Error al refrescar documentos:", err);
        }
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [documents]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setUploadFile(e.target.files[0]);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) return;

    setUploadProgress(10);
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
    const token = document.cookie
      .split("; ")
      .find((row) => row.startsWith("auth_token="))
      ?.split("=")[1];

    try {
      const formData = new FormData();
      formData.append("file", uploadFile);
      formData.append("category_id", uploadCategoryId);

      setUploadProgress(40);
      const res = await fetch(`${baseUrl}/admin/documents/upload`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token || ""}`
        },
        body: formData
      });

      setUploadProgress(80);
      if (!res.ok) {
        throw new Error("No se pudo cargar el documento.");
      }

      const newDoc = await res.json();
      setDocuments((prev) => [newDoc, ...prev]);
      setUploadProgress(100);
      setUploadFile(null);

      // Limpiar barra de progreso
      setTimeout(() => setUploadProgress(null), 800);
    } catch (err: any) {
      console.error(err);
      alert("Error al subir archivo: " + err.message);
      setUploadProgress(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este documento y todos sus vectores indexados en Qdrant?")) return;

    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
    const token = document.cookie
      .split("; ")
      .find((row) => row.startsWith("auth_token="))
      ?.split("=")[1];

    try {
      const res = await fetch(`${baseUrl}/admin/documents/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token || ""}`
        }
      });
      if (res.ok) {
        setDocuments((prev) => prev.filter((doc) => doc.id !== id));
      } else {
        alert("No se pudo eliminar el documento.");
      }
    } catch (err) {
      console.error("Error al eliminar documento:", err);
    }
  };

  const handleReindex = async (id: string) => {
    setReindexingId(id);
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
    const token = document.cookie
      .split("; ")
      .find((row) => row.startsWith("auth_token="))
      ?.split("=")[1];

    try {
      // Actualización optimista de interfaz
      setDocuments((prev) =>
        prev.map((d) => (d.id === id ? { ...d, status: "Indexando" as const } : d))
      );

      const res = await fetch(`${baseUrl}/admin/documents/${id}/reindex`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token || ""}`
        }
      });

      if (!res.ok) {
        throw new Error("No se pudo reindexar.");
      }

      const updatedDoc = await res.json();
      setDocuments((prev) =>
        prev.map((d) => (d.id === id ? updatedDoc : d))
      );
    } catch (err) {
      console.error("Error al reindexar:", err);
      setDocuments((prev) =>
        prev.map((d) => (d.id === id ? { ...d, status: "Fallo" as const } : d))
      );
    } finally {
      setReindexingId(null);
    }
  };

  const getCategoryName = (catId: string) => {
    const cat = categories.find((c) => c.id === catId);
    return cat ? cat.name : "General";
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    return dateStr.split("T")[0];
  };

  return (
    <div className="documents-page-wrapper fade-in">
      <div className="page-header">
        <h3 className="section-title">Gestión de Documentos</h3>
        <p className="section-desc">Sube y gestiona los archivos fuente que alimentan la base de conocimiento RAG.</p>
      </div>

      <div className="admin-grid-2col">
        {/* DRAG & DROP / SUBIR */}
        <div className="card admin-card">
          <div className="card-header">
            <h4>Indexar Nuevo Documento</h4>
          </div>
          <div className="card-body">
            <form onSubmit={handleUploadSubmit} className="upload-form">
              <div className="form-group">
                <label className="form-label">Categoría Asociada</label>
                <select
                  className="form-input"
                  value={uploadCategoryId}
                  onChange={(e) => setUploadCategoryId(e.target.value)}
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Seleccionar Archivo</label>
                <div className="file-drop-zone">
                  <Upload size={32} className="icon-terracotta" style={{ marginBottom: "var(--space-sm)" }} />
                  <input
                    type="file"
                    id="file-upload-input"
                    className="file-hidden-input"
                    onChange={handleFileChange}
                    accept=".pdf,.docx,.xlsx,.xls,.csv,.md,.txt,.html,.json"
                  />
                  <label htmlFor="file-upload-input" className="file-drop-label">
                    {uploadFile ? (
                      <span className="file-name-highlight">{uploadFile.name}</span>
                    ) : (
                      "Arrastra un archivo o haz clic para buscar"
                    )}
                  </label>
                  <span className="file-drop-sub">Soporta PDF, DOCX, XLSX, CSV, MD, JSON</span>
                </div>
              </div>

              {uploadProgress !== null && (
                <div className="progress-bar-container">
                  <div className="progress-bar" style={{ width: `${uploadProgress}%` }}></div>
                  <span className="progress-text">{uploadProgress}% Indexando...</span>
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary w-full"
                disabled={!uploadFile || uploadProgress !== null}
              >
                Comenzar Indexación
              </button>
            </form>
          </div>
        </div>

        {/* LISTADO DE DOCUMENTOS */}
        <div className="card admin-card">
          <div className="card-header">
            <h4>Documentos Cargados</h4>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {documents.length === 0 ? (
              <div style={{ padding: "var(--space-xl)", textAlign: "center", color: "var(--text-secondary)" }}>
                <FileText size={48} style={{ margin: "0 auto var(--space-md)", opacity: 0.3 }} />
                <p>No hay documentos indexados todavía.</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Categoría</th>
                      <th>Subido</th>
                      <th>Chunks</th>
                      <th>Estado</th>
                      <th style={{ textAlign: "right" }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {documents.map((doc) => (
                      <tr key={doc.id}>
                        <td>
                          <div className="flex items-center">
                            <FileText size={16} className="icon-terracotta" style={{ marginRight: "8px", flexShrink: 0 }} />
                            <span className="table-doc-name" title={doc.name}>{doc.name}</span>
                          </div>
                        </td>
                        <td>
                          <span className="badge-category">{getCategoryName(doc.category_id)}</span>
                        </td>
                        <td style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                          {formatDate(doc.uploaded_at)}
                        </td>
                        <td style={{ textAlign: "center", fontWeight: "bold" }}>
                          {doc.status === "Indexando" ? "-" : doc.chunks_count}
                        </td>
                        <td>
                          <span className={`badge-status ${doc.status.toLowerCase()}`}>
                            {doc.status === "Indexando" && <RotateCw size={10} className="spin" style={{ marginRight: "4px" }} />}
                            {doc.status === "Indexado" && <CheckCircle size={10} style={{ marginRight: "4px" }} />}
                            {doc.status === "Fallo" && <AlertCircle size={10} style={{ marginRight: "4px" }} />}
                            {doc.status}
                          </span>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <div className="flex justify-end gap-sm">
                            <Link
                              href={`/admin/documents/${doc.id}/chunks`}
                              className="btn btn-action"
                              title="Ver fragmentos vectoriales"
                            >
                              <ChevronRight size={14} />
                            </Link>
                            <button
                              className="btn btn-action"
                              onClick={() => handleReindex(doc.id)}
                              disabled={doc.status === "Indexando" || reindexingId === doc.id}
                              title="Re-indexar documento"
                            >
                              <RotateCw size={14} className={reindexingId === doc.id ? "spin" : ""} />
                            </button>
                            <button
                              className="btn btn-action danger"
                              onClick={() => handleDelete(doc.id)}
                              disabled={doc.status === "Indexando"}
                              title="Eliminar de RAG"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
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
