"""Validación de firma de archivos (magic bytes) en uploads.

Complementa la allowlist de extensiones: verifica que el contenido real del
archivo coincida con su extensión, para frenar archivos disfrazados.
"""

# Firmas binarias conocidas por extensión (primeros bytes del archivo).
_SIGNATURES: dict[str, list[bytes]] = {
    ".pdf": [b"%PDF-"],
    ".docx": [b"PK\x03\x04"],  # OOXML = contenedor ZIP
    ".xlsx": [b"PK\x03\x04"],
    ".xls": [b"\xd0\xcf\x11\xe0"],  # OLE2 compound file
}

# Formatos de texto: no tienen firma fiable; se valida que no sean binarios.
_TEXT_EXTS = {".csv", ".md", ".txt", ".html", ".json"}


def validate_file_signature(path: str, ext: str) -> bool:
    """True si el contenido del archivo es coherente con su extensión."""
    ext = ext.lower()

    if ext in _SIGNATURES:
        with open(path, "rb") as f:
            head = f.read(8)
        return any(head.startswith(sig) for sig in _SIGNATURES[ext])

    if ext in _TEXT_EXTS:
        # Heurística: un byte nulo en el primer KB delata contenido binario.
        with open(path, "rb") as f:
            chunk = f.read(1024)
        return b"\x00" not in chunk

    # Extensión no contemplada aquí: se delega a la allowlist previa.
    return True
