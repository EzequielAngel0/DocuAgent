"""Chunking semántico con seguimiento de página.

Divide el texto por párrafos/oraciones acumulando hasta `chunk_size`
caracteres (sin partir oraciones cuando es posible), con un solapamiento de
`chunk_overlap` caracteres entre fragmentos contiguos para no perder
contexto en los bordes. Cada fragmento conserva la página de origen.
"""
import re
from typing import Any, Dict, List

from app.core.config import settings

_PAGE_MARKER = re.compile(r"^\[Página\s+(\d+)\]$")
# Cortes de oración para ES/EN/PT manteniendo el signo de puntuación.
_SENTENCE_SPLIT = re.compile(r"(?<=[.!?])\s+")


def _split_sentences(paragraph: str) -> List[str]:
    parts = _SENTENCE_SPLIT.split(paragraph.strip())
    return [p.strip() for p in parts if p.strip()]


def chunk_text(
    text: str,
    chunk_size: int | None = None,
    chunk_overlap: int | None = None,
) -> List[Dict[str, Any]]:
    chunk_size = chunk_size or settings.CHUNK_MAX_SIZE
    chunk_overlap = chunk_overlap or settings.CHUNK_OVERLAP

    chunks: List[Dict[str, Any]] = []
    current_page = 1
    buffer = ""
    buffer_page = 1

    def flush() -> None:
        nonlocal buffer, buffer_page
        content = buffer.strip()
        if content:
            chunks.append({"content": content, "page": buffer_page})
        buffer = ""

    for raw_line in text.split("\n"):
        line = raw_line.strip()

        marker = _PAGE_MARKER.match(line)
        if marker:
            current_page = int(marker.group(1))
            continue

        if not line:
            continue

        if not buffer:
            buffer_page = current_page

        for sentence in _split_sentences(line) or [line]:
            candidate = f"{buffer} {sentence}".strip() if buffer else sentence
            if len(candidate) <= chunk_size:
                buffer = candidate
            else:
                # Cerrar el fragmento actual y arrancar el siguiente con
                # un solapamiento tomado del final del buffer previo.
                tail = buffer[-chunk_overlap:] if chunk_overlap and buffer else ""
                flush()
                buffer_page = current_page
                buffer = f"{tail} {sentence}".strip() if tail else sentence

    flush()
    return chunks
