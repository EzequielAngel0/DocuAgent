import pytest
from app.services.rag_pipeline import chunk_text

def test_chunk_text_basic():
    sample_text = "Esta es la primera línea.\nEsta es la segunda línea.\nEsta es la tercera línea."
    chunks = chunk_text(sample_text, chunk_size=100, chunk_overlap=20)
    
    assert len(chunks) > 0
    assert "content" in chunks[0]
    assert "page" in chunks[0]
    assert chunks[0]["page"] == 1

def test_chunk_text_page_tracking():
    sample_text = "[Página 1]\nContenido de la página 1.\n\n[Página 2]\nContenido de la página 2."
    chunks = chunk_text(sample_text, chunk_size=500, chunk_overlap=50)
    
    pages = [c["page"] for c in chunks]
    assert 1 in pages or 2 in pages
