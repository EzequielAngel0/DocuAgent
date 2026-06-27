"use client";

import { useState } from "react";
import { Link2, FileText, ChevronDown, ChevronUp } from "lucide-react";

export interface Citation {
  documentName: string;
  page: string;
  category: string;
  excerpt: string;
}

interface SourceCitationsProps {
  citations: Citation[];
}

export default function SourceCitations({ citations }: SourceCitationsProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!citations || citations.length === 0) return null;

  return (
    <div className="message-citations-wrapper">
      <button 
        className="message-citations-toggle" 
        onClick={() => setIsOpen(!isOpen)}
      >
        <Link2 size={12} style={{ marginRight: "6px" }} />
        <span>Ver {citations.length} fuentes citadas</span>
        {isOpen ? <ChevronUp size={12} style={{ marginLeft: "auto" }} /> : <ChevronDown size={12} style={{ marginLeft: "auto" }} />}
      </button>

      {isOpen && (
        <ul className="citations-list fade-in">
          {citations.map((cite, idx) => (
            <li key={idx} className="citation-item">
              <div className="citation-header">
                <FileText size={12} className="citation-file-icon" />
                <span className="citation-filename">{cite.documentName}</span>
                <span className="citation-badge-page">{cite.page}</span>
                <span className="citation-badge-category">{cite.category}</span>
              </div>
              <p className="citation-excerpt">
                "{cite.excerpt}"
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
