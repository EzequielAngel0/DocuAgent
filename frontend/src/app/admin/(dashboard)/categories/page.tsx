"use client";

import { useState, useEffect } from "react";
import { FolderPlus, Trash2, Edit2, Folder, Users, Shield, CircleDollarSign, Plus, X } from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
  color: "terracotta" | "bronze" | "oliva" | "carbon";
  iconName: "Users" | "CircleDollarSign" | "Shield" | "Folder";
  docsCount: number;
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Form fields
  const [formName, setFormName] = useState("");
  const [formColor, setFormColor] = useState<Category["color"]>("terracotta");
  const [formIcon, setFormIcon] = useState<Category["iconName"]>("Folder");

  useEffect(() => {
    const savedCats = localStorage.getItem("admin_categories");
    if (savedCats) {
      setCategories(JSON.parse(savedCats));
    } else {
      const initialCats: Category[] = [
        { id: "cat_1", name: "Recursos Humanos", slug: "recursos-humanos", color: "terracotta", iconName: "Users", docsCount: 4 },
        { id: "cat_2", name: "Finanzas", slug: "finanzas", color: "bronze", iconName: "CircleDollarSign", docsCount: 2 },
        { id: "cat_3", name: "Seguridad", slug: "seguridad", color: "oliva", iconName: "Shield", docsCount: 3 },
        { id: "cat_4", name: "General", slug: "general", color: "carbon", iconName: "Folder", docsCount: 5 },
      ];
      setCategories(initialCats);
      localStorage.setItem("admin_categories", JSON.stringify(initialCats));
    }
  }, []);

  const saveCats = (newCats: Category[]) => {
    setCategories(newCats);
    localStorage.setItem("admin_categories", JSON.stringify(newCats));
  };

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
    setFormIcon(cat.iconName);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    const updated = categories.filter((c) => c.id !== id);
    saveCats(updated);
  };

  const handleModalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const slug = formName
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");

    if (editingCategory) {
      // Editar existente
      const updated = categories.map((c) =>
        c.id === editingCategory.id
          ? { ...c, name: formName, slug, color: formColor, iconName: formIcon }
          : c
      );
      saveCats(updated);
    } else {
      // Crear nueva
      const newCat: Category = {
        id: "cat_" + Date.now(),
        name: formName,
        slug,
        color: formColor,
        iconName: formIcon,
        docsCount: 0,
      };
      saveCats([...categories, newCat]);
    }

    setIsModalOpen(false);
  };

  const renderIcon = (name: Category["iconName"], colorClass: string) => {
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
                      {renderIcon(cat.iconName, colorClass)}
                    </div>
                    <span className="category-card-name">{cat.name}</span>
                  </div>
                </div>
                
                <div className="category-card-details">
                  <div className="detail-row flex justify-between">
                    <span className="detail-label">Slug de ruta:</span>
                    <code className="detail-value">/{cat.slug}</code>
                  </div>
                  <div className="detail-row flex justify-between">
                    <span className="detail-label">Documentos:</span>
                    <span className="detail-value" style={{ fontWeight: 600 }}>{cat.docsCount} archivos</span>
                  </div>
                </div>
              </div>

              <div className="category-card-actions flex items-center justify-end gap-sm">
                <button
                  className="btn-table-action"
                  onClick={() => handleOpenEditModal(cat)}
                  title="Editar categoría"
                  aria-label="Editar"
                >
                  <Edit2 size={14} />
                </button>
                <button
                  className="btn-table-action danger"
                  onClick={() => handleDelete(cat.id)}
                  title="Eliminar categoría"
                  aria-label="Eliminar"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL PLANO (CREATE / EDIT) */}
      {isModalOpen && (
        <div className="modal-overlay flex items-center justify-center fade-in">
          <div className="modal-content card slide-up">
            <div className="modal-header flex items-center justify-between">
              <h4>{editingCategory ? "Editar Categoría" : "Crear Categoría"}</h4>
              <button className="btn-icon" onClick={() => setIsModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleModalSubmit} className="modal-form">
              <div className="form-group">
                <label className="form-label">Nombre de Categoría</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ej. Legal, Ventas, TI"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Color de Badge</label>
                <select
                  className="form-input"
                  value={formColor}
                  onChange={(e) => setFormColor(e.target.value as Category["color"])}
                >
                  <option value="terracotta">Terracota (Cálido)</option>
                  <option value="bronze">Bronce (Tierra)</option>
                  <option value="oliva">Oliva (Seco)</option>
                  <option value="carbon">Carbón (Oscuro)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Icono Representativo</label>
                <select
                  className="form-input"
                  value={formIcon}
                  onChange={(e) => setFormIcon(e.target.value as Category["iconName"])}
                >
                  <option value="Folder">Carpeta General</option>
                  <option value="Users">Usuarios / Personal</option>
                  <option value="CircleDollarSign">Moneda / Finanzas</option>
                  <option value="Shield">Escudo / Seguridad</option>
                </select>
              </div>

              <div className="modal-footer flex justify-end gap-sm" style={{ marginTop: "var(--space-md)" }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingCategory ? "Guardar Cambios" : "Crear"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
