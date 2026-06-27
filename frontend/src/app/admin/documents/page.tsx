"use client";

import { useState, useEffect } from "react";
import { Upload, Trash2, RotateCw, FileText, ChevronRight, CheckCircle, AlertCircle } from "lucide-react";
import Link from "next/link";

interface Document {
  id: string;
  name: string;
  category: string;
  uploadedAt: string;
  chunksCount: number;
  status: "Indexando" | "Indexado" | "Fallo";
}

export default function AdminDocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [uploadCategory, setUploadCategory] = useState("Recursos Humanos");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [reindexingId, setReindexingId] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>(["Recursos Humanos", "Finanzas", "Seguridad", "General"]);

  // Inicializar documentos
  useEffect(() => {
    const savedDocs = localStorage.getItem("admin_documents");
    if (savedDocs) {
      setDocuments(JSON.parse(savedDocs));
    } else {
      const initialDocs: Document[] = [
        { id: "doc_1", name: "manual_onboarding.pdf", category: "Recursos Humanos", uploadedAt: "2026-06-20", chunksCount: 45, status: "Indexado" },
        { id: "doc_2", name: "politica_gastos.pdf", category: "Finanzas", uploadedAt: "2026-06-21", chunksCount: 12, status: "Indexado" },
        { id: "doc_3", name: "security.md", category: "Seguridad", uploadedAt: "2026-06-22", chunksCount: 8, status: "Indexado" },
      ];
      setDocuments(initialDocs);
      localStorage.setItem("admin_documents", JSON.stringify(initialDocs));
    }

    // Cargar categorías si existen en localStorage
    const savedCats = localStorage.getItem("admin_categories");
    if (savedCats) {
      const parsedCats = JSON.parse(savedCats);
      setCategories(parsedCats.map((c: any) => c.name));
    }
  }, []);

  const saveDocs = (newDocs: Document[]) => {
    setDocuments(newDocs);
    localStorage.setItem("admin_documents", JSON.stringify(newDocs));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setUploadFile(e.target.files[0]);
    }
  };

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) return;

    setUploadProgress(10);
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev === null) return 0;
        if (prev >= 100) {
          clearInterval(interval);
          
          // Guardar el nuevo documento
          const newDoc: Document = {
            id: "doc_" + Date.now(),
            name: uploadFile.name,
            category: uploadCategory,
            uploadedAt: new Date().toISOString().split("T")[0],
            chunksCount: Math.floor(Math.random() * 30) + 5,
            status: "Indexado",
          };

          saveDocs([newDoc, ...documents]);
          setUploadFile(null);
          
          // Reset progress bar after completion animation
          setTimeout(() => setUploadProgress(null), 800);
          return 100;
        }
        return prev + 30;
      });
    }, 200);
  };

  const handleDelete = (id: string) => {
    const updated = documents.filter((doc) => doc.id !== id);
    saveDocs(updated);
  };

  const handleReindex = (id: string) => {
    setReindexingId(id);
    // Cambiar estado a indexando
    const updated = documents.map((doc) => 
      doc.id === id ? { ...doc, status: "Indexando" as const } : doc
    );
    saveDocs(updated);

    setTimeout(() => {
      const finished = documents.map((doc) => 
        doc.id === id ? { ...doc, status: "Indexado" as const } : doc
      );
      saveDocs(finished);
      setReindexingId(null);
    }, 1500);
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
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value)}
                >
                  {categories.map((cat, idx) => (
                    <option key={idx} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="upload-dropzone">
                <input
                  type="file"
                  id="file-upload-input"
                  className="upload-input-file"
                  onChange={handleFileChange}
                  accept=".pdf,.docx,.xlsx,.csv,.md,.html,.txt"
                />
                <label htmlFor="file-upload-input" className="upload-label flex flex-col items-center justify-center">
                  <Upload size={32} className="upload-icon-style" />
                  <span className="upload-title">
                    {uploadFile ? uploadFile.name : "Selecciona o arrastra un archivo"}
                  </span>
                  <span className="upload-formats">
                    Formatos soportados: PDF, DOCX, XLSX, CSV, MD, HTML, TXT
                  </span>
                </label>
              </div>

              {uploadProgress !== null && (
                <div className="upload-progress-bar-container">
                  <div className="upload-progress-fill" style={{ width: `${uploadProgress}%` }}></div>
                  <span className="upload-progress-text">Procesando chunks... {uploadProgress}%</span>
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary upload-submit-btn"
                disabled={!uploadFile || uploadProgress !== null}
                style={{ width: "100%" }}
              >
                Subir e Indexar
              </button>
            </form>
          </div>
        </div>

        {/* LISTADO DE DOCUMENTOS */}
        <div className="card admin-card">
          <div className="card-header">
            <h4>Documentos Indexados ({documents.length})</h4>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {documents.length === 0 ? (
              <p style={{ padding: "var(--space-lg)", textAlign: "center", color: "var(--text-secondary)" }}>
                No hay documentos indexados. Sube tu primer archivo.
              </p>
            ) : (
              <div className="table-responsive">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Documento</th>
                      <th>Categoría</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {documents.map((doc) => (
                      <tr key={doc.id}>
                        <td>
                          <div className="flex items-center">
                            <FileText size={16} className="icon-terracotta" style={{ marginRight: "8px", flexShrink: 0 }} />
                            <div>
                              <div style={{ fontWeight: 500, fontSize: "0.85rem" }}>{doc.name}</div>
                              <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                                {doc.uploadedAt} · {doc.chunksCount} chunks
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="badge-category">{doc.category}</span>
                        </td>
                        <td>
                          <span className={`badge-status ${doc.status.toLowerCase()}`}>
                            {doc.status === "Indexando" ? (
                              <RotateCw className="spin" size={12} style={{ marginRight: "4px" }} />
                            ) : doc.status === "Indexado" ? (
                              <CheckCircle size={12} style={{ marginRight: "4px" }} />
                            ) : (
                              <AlertCircle size={12} style={{ marginRight: "4px" }} />
                            )}
                            {doc.status}
                          </span>
                        </td>
                        <td>
                          <div className="flex items-center gap-sm">
                            <button
                              className="btn-table-action"
                              onClick={() => handleReindex(doc.id)}
                              disabled={reindexingId === doc.id || doc.status === "Indexando"}
                              title="Re-indexar documento"
                              aria-label="Re-indexar"
                            >
                              <RotateCw size={14} className={reindexingId === doc.id ? "spin" : ""} />
                            </button>
                            
                            <a
                              href={`/admin/documents/${doc.id}/chunks`}
                              className="btn-table-action flex items-center justify-center"
                              title="Ver fragmentos (chunks)"
                              aria-label="Ver fragmentos"
                            >
                              <ChevronRight size={14} />
                            </a>

                            <button
                              className="btn-table-action danger"
                              onClick={() => handleDelete(doc.id)}
                              disabled={doc.status === "Indexando"}
                              title="Eliminar del RAG"
                              aria-label="Eliminar"
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
