"""Limpieza de texto previa al chunking.

Normaliza espacios y saltos de línea SIN destruir los marcadores de página
(`[Página N]`), de los que depende el chunker para rastrear la página.
"""

import re

_CONTROL = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]")
_TRAILING_WS = re.compile(r"[ \t]+(\n)")
_MANY_BLANKS = re.compile(r"\n{3,}")
_DEHYPHENATE = re.compile(r"(\w)-\n(\w)")


def clean_text(text: str) -> str:
    if not text:
        return ""
    text = _CONTROL.sub("", text)
    # Reunir palabras cortadas por guion al final de línea (PDF).
    text = _DEHYPHENATE.sub(r"\1\2", text)
    # Espacios al final de línea y colapso de líneas en blanco repetidas.
    text = _TRAILING_WS.sub(r"\1", text)
    text = _MANY_BLANKS.sub("\n\n", text)
    return text.strip()
