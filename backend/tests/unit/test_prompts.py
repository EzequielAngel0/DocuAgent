from app.agent.prompts import (
    FALLBACK_MESSAGE,
    build_context,
    build_system_prompt,
)


def test_system_prompt_incluye_reglas_y_delimitadores():
    prompt = build_system_prompt("CONTEXTO_DE_PRUEBA")
    assert "NUNCA" in prompt
    assert "<contexto>" in prompt and "</contexto>" in prompt
    assert "CONTEXTO_DE_PRUEBA" in prompt


def test_build_context_numera_y_referencia_documentos():
    chunks = [
        {"document_name": "doc_a.pdf", "page": 2, "content": "Contenido A"},
        {"document_name": "doc_b.pdf", "page": 5, "content": "Contenido B"},
    ]
    ctx = build_context(chunks)
    assert "[1] Documento: doc_a.pdf" in ctx
    assert "[2] Documento: doc_b.pdf" in ctx
    assert "Página 5" in ctx


def test_fallback_message_no_vacio():
    assert FALLBACK_MESSAGE and "no encontré" in FALLBACK_MESSAGE.lower()
