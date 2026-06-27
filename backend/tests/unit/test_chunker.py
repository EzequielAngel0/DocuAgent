from app.ingestion.chunker import chunk_text


def test_chunk_text_basic():
    sample_text = (
        "Esta es la primera línea.\nEsta es la segunda línea.\n"
        "Esta es la tercera línea."
    )
    chunks = chunk_text(sample_text, chunk_size=100, chunk_overlap=20)

    assert len(chunks) > 0
    assert "content" in chunks[0]
    assert "page" in chunks[0]
    assert chunks[0]["page"] == 1


def test_chunk_text_page_tracking():
    sample_text = (
        "[Página 1]\nContenido de la página 1.\n\n"
        "[Página 2]\nContenido de la página 2."
    )
    chunks = chunk_text(sample_text, chunk_size=500, chunk_overlap=50)

    pages = [c["page"] for c in chunks]
    assert 1 in pages or 2 in pages


def test_chunk_text_respects_max_size():
    # Texto largo de una sola oración por línea para forzar varios chunks.
    long_text = "\n".join(f"Oración número {i} con algo de relleno textual." for i in range(60))
    chunks = chunk_text(long_text, chunk_size=200, chunk_overlap=40)

    assert len(chunks) > 1
    assert all(len(c["content"]) <= 200 + 40 for c in chunks)
