"use client";

import { AlertTriangle, X } from "lucide-react";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

// Diálogo de confirmación con el estilo del proyecto (reemplaza window.confirm).
export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirmar",
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div
        className="modal-content"
        style={{ maxWidth: "440px" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header flex items-center justify-between">
          <h4 className="flex items-center" style={{ gap: "8px" }}>
            <AlertTriangle size={18} className={danger ? "icon-terracotta" : "icon-bronze"} />
            {title}
          </h4>
          <button className="btn-close-modal" onClick={onCancel} aria-label="Cerrar">
            <X size={18} />
          </button>
        </div>

        <p style={{ color: "var(--text-secondary)", marginBottom: "var(--space-lg)" }}>
          {message}
        </p>

        <div className="modal-footer flex justify-end gap-sm">
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            Cancelar
          </button>
          <button
            type="button"
            className={`btn ${danger ? "btn-danger" : "btn-primary"}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
