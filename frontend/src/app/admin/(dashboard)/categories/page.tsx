"use client";

import { useState, useEffect } from "react";
import { FolderPlus, Trash2, Edit2, Folder, Users, Shield, CircleDollarSign, Plus, X } from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
  color: string;
  icon_name: string;
  docsCount?: number;
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Form fields
  const [formName, setFormName] = useState("");
  const [formColor, setFormColor] = useState("terracotta");
  const [formIcon, setFormIcon] = useState("Folder");

  // Cargar categorías y documentos para calcular conteos
  const loadCategories = async () => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
    const token = document.cookie
      .split("; ")
      .find((row) => row.startsWith("auth_token="))
      ?.split("=")[1];

    try {
      // 1. Cargar categorías
      const catsRes = await fetch(`${baseUrl}/admin/categories`, {
        headers: { "Authorization": `Bearer ${token || ""}` }
      });
      if (!catsRes.ok) throw new Error("Error al obtener categorías.");
      const cats = await catsRes.json();

      // 2. Cargar documentos para calcular docsCount
      const docsRes = await fetch(`${baseUrl}/admin/documents`, {
        headers: { "Authorization": `Bearer ${token || ""}` }
      });
      let docs: any[] = [];
      if (docsRes.ok) {
        docs = await docsRes.json();
      }

      // Mapear con conteos de documentos reales
      const enrichedCats = cats.map((cat: Category) => {
        const count = docs.filter((d: any) => d.category_id === cat.id).length;
        return { ...cat, docsCount: count };
      });

      setCategories(enrichedCats);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleOpenCreateModal = () => {
    setEditingCategory(null);
    setFormName("");
    setFormColor("terracotta");
    setFormIcon("Folder");
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (cat: Category) => {
    setEditingCategory(cat);
    setFormName(cat.name);
    setFormColor(cat.color);
    setFormIcon(cat.icon_name);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar esta categoría? Se borrarán sus documentos asociados.")) return;

    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
    const token = document.cookie
      .split("; ")
      .find((row) => row.startsWith("auth_token="))
      ?.split("=")[1];

    try {
      const res = await fetch(`${baseUrl}/admin/categories/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token || ""}`
        }
      });
      if (res.ok) {
        setCategories((prev) => prev.filter((c) => c.id !== id));
      } else {
        alert("No se pudo eliminar la categoría.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const slug = formName
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");

    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
    const token = document.cookie
      .split("; ")
      .find((row) => row.startsWith("auth_token="))
      ?.split("=")[1];

    try {
      if (editingCategory) {
        // Editar categoría
        const res = await fetch(`${baseUrl}/admin/categories/${editingCategory.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token || ""}`
          },
          body: JSON.stringify({
            name: formName,
            slug: slug,
            color: formColor,
            icon_name: formIcon
          })
        });

        if (res.ok) {
          const updated = await res.json();
          setCategories((prev) =>
            prev.map((c) => (c.id === editingCategory.id ? { ...c, ...updated } : c))
          );
        }
      } else {
        // Crear categoría
        const res = await fetch(`${baseUrl}/admin/categories`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token || ""}`
          },
          body: JSON.stringify({
            name: formName,
            slug: slug,
            color: formColor,
            icon_name: formIcon
          })
        });

        if (res.ok) {
          const newCat = await res.json();
          setCategories((prev) => [...prev, { ...newCat, docsCount: 0 }]);
        }
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const renderIcon = (name: string, colorClass: string) => {
    const size = 18;
    switch (name) {
      case "Users":
        return <Users size={size} className={colorClass} />;
      case "CircleDollarSign":
        return <CircleDollarSign size={size} className={colorClass} />;
      case "Shield":
        return <Shield size={size} className={colorClass} />;
      default:
        return <Folder size={size} className={colorClass} />;
    }
  };

  return (
    <div className="categories-page-wrapper fade-in">
      <div className="page-header flex items-center justify-between">
        <div>
          <h3 className="section-title">Categorías Organizacionales</h3>
          <p className="section-desc">Estructura la información empresarial dividiendo tus documentos por área o departamento.</p>
        </div>
        <button className="btn btn-primary flex items-center" onClick={handleOpenCreateModal}>
          <Plus size={16} style={{ marginRight: "6px" }} />
          Nueva Categoría
        </button>
      </div>

      {/* GRID DE CATEGORIAS */}
      <div className="categories-grid" style={{ marginTop: "var(--space-md)" }}>
        {categories.map((cat) => {
          const colorClass = `icon-${cat.color}`;
          return (
            <div key={cat.id} className="card category-card flex flex-col justify-between">
              <div>
                <div className="category-card-header flex items-center justify-between">
                  <div className="category-icon-title flex items-center">
                    <div className={`category-card-icon-wrapper ${cat.color}`}>
                      {renderIcon(cat.icon_name, colorClass)}
                    </div>
                    <h5 className="category-name">{cat.name}</h5>
                  </div>
                  <div className="category-actions">
                    <button className="btn btn-action" onClick={() => handleOpenEditModal(cat)} title="Editar categoría">
                      <Edit2 size={12} />
                    </button>
                    <button className="btn btn-action danger" onClick={() => handleDelete(cat.id)} title="Eliminar categoría">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
                <div className="category-card-body" style={{ marginTop: "var(--space-sm)" }}>
                  <p className="category-slug">Ruta: <code>/{cat.slug}</code></p>
                </div>
              </div>
              <div className="category-card-footer flex items-center justify-between">
                <span className="category-docs-count">{cat.docsCount} documentos</span>
                <span className={`category-color-dot ${cat.color}`}></span>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL CREAR / EDITAR */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content fade-in" style={{ maxWidth: "450px" }}>
            <div className="modal-header flex items-center justify-between">
              <h4>{editingCategory ? "Editar Categoría" : "Nueva Categoría"}</h4>
              <button className="btn-close-modal" onClick={() => setIsModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleModalSubmit}>
              <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)" }}>
                <div className="form-group">
                  <label className="form-label">Nombre del Área</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ej. Recursos Humanos"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Color Temático</label>
                  <select className="form-input" value={formColor} onChange={(e) => setFormColor(e.target.value)}>
                    <option value="terracotta">Terracota</option>
                    <option value="bronze">Bronce</option>
                    <option value="oliva">Oliva</option>
                    <option value="carbon">Carbón</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Icono Representativo</label>
                  <select className="form-input" value={formIcon} onChange={(e) => setFormIcon(e.target.value)}>
                    <option value="Folder">Carpeta (General)</option>
                    <option value="Users">Usuarios (Recursos Humanos)</option>
                    <option value="CircleDollarSign">Dinero (Finanzas)</option>
                    <option value="Shield">Escudo (Seguridad)</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer flex justify-end gap-sm" style={{ marginTop: "var(--space-md)" }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingCategory ? "Guardar Cambios" : "Crear Categoría"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
