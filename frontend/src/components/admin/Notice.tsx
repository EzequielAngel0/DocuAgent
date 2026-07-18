"use client";

import { CheckCircle, AlertCircle, X } from "lucide-react";

export type NoticeKind = "error" | "success";

interface NoticeProps {
  kind: NoticeKind;
  message: string;
  onClose: () => void;
}

// Aviso en línea con el estilo del proyecto (reemplaza window.alert).
export default function Notice({ kind, message, onClose }: NoticeProps) {
  return (
    <div className={`admin-notice ${kind} flex items-center justify-between`}>
      <span className="flex items-center" style={{ gap: "8px" }}>
        {kind === "error" ? <AlertCircle size={16} /> : <CheckCircle size={16} />}
        {message}
      </span>
      <button className="btn-icon" onClick={onClose} aria-label="Cerrar aviso">
        <X size={15} />
      </button>
    </div>
  );
}
