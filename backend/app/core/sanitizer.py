"""Sanitización y detección de prompt injection en la entrada del usuario.

Primera línea de defensa del pipeline RAG. No sustituye al *system prompt*
blindado ni al validador post-generación: es una capa más (defensa en
profundidad). Trabaja sobre la consulta cruda antes de embeber/recuperar.
"""
import re
from typing import List

# Patrones heurísticos de inyección frecuentes (ES/EN/PT). Conservadores
# para minimizar falsos positivos en preguntas legítimas.
_INJECTION_PATTERNS: List[re.Pattern] = [
    re.compile(r"ignor[ae]\s+(todas?\s+)?(las?\s+)?instruc", re.IGNORECASE),
    re.compile(r"ignore\s+(all\s+)?(previous|above)\s+instruct", re.IGNORECASE),
    re.compile(r"olvida\s+(todo|las\s+instrucciones)", re.IGNORECASE),
    re.compile(r"disregard\s+(all\s+)?(previous|prior)", re.IGNORECASE),
    re.compile(r"system\s*prompt", re.IGNORECASE),
    re.compile(r"(act[uú]a|comp[oó]rtate)\s+como\s+(si\s+)?", re.IGNORECASE),
    re.compile(r"\b(jailbreak|DAN mode|developer mode)\b", re.IGNORECASE),
    re.compile(r"revela\s+(tu|el)\s+(prompt|sistema|configuraci[oó]n)", re.IGNORECASE),
    re.compile(r"reveal\s+your\s+(prompt|system|instructions)", re.IGNORECASE),
    re.compile(r"</?(system|assistant|user)>", re.IGNORECASE),
]

# Caracteres de control / delimitadores que no deben llegar al prompt.
_CONTROL_CHARS = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]")

MAX_QUERY_LEN = 2000


def detect_injection(text: str) -> bool:
    """True si la entrada coincide con algún patrón de inyección conocido."""
    return any(p.search(text) for p in _INJECTION_PATTERNS)


def sanitize_query(text: str) -> str:
    """Normaliza la consulta del usuario para uso seguro en el prompt.

    - Elimina caracteres de control.
    - Colapsa espacios en blanco.
    - Trunca a una longitud máxima razonable.
    No lanza excepción: la detección dura se hace con `detect_injection`.
    """
    if not text:
        return ""
    cleaned = _CONTROL_CHARS.sub(" ", text)
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    return cleaned[:MAX_QUERY_LEN]
