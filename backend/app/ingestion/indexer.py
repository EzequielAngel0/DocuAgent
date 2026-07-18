"""Orquestador de ingesta: extraer → limpiar → chunkear → embeber → indexar.

Punto de entrada usado por el endpoint de subida (tarea de fondo) y por el
script de seed.
"""

import uuid
from typing import Any

from app.core.logging import get_logger
from app.ingestion.chunker import chunk_text
from app.ingestion.cleaner import clean_text
from app.ingestion.extractors import DocumentExtractor
from app.rag import embeddings
from app.rag.vector_store import vector_store

logger = get_logger(__name__)


def index_document(document_id: str, document_name: str, file_path: str, category_name: str) -> int:
    """Indexa un documento en Qdrant y devuelve el número de chunks creados."""
    vector_store.ensure_collection()

    text = clean_text(DocumentExtractor.extract_text(file_path))
    chunks_meta = chunk_text(text)
    if not chunks_meta:
        logger.warning("ingestion_empty_document", document_id=document_id)
        return 0

    vectors = embeddings.embed_documents([c["content"] for c in chunks_meta])

    chunks: list[dict[str, Any]] = []
    for chunk in chunks_meta:
        chunks.append(
            {
                "point_id": str(uuid.uuid4()),
                "payload": {
                    "document_id": document_id,
                    "document_name": document_name,
                    "category": category_name,
                    "page": chunk["page"],
                    "content": chunk["content"],
                },
            }
        )

    count = vector_store.upsert_chunks(chunks, vectors)
    logger.info(
        "ingestion_indexed",
        document_id=document_id,
        document_name=document_name,
        chunks=count,
    )
    return count


def delete_document_vectors(document_id: str) -> None:
    vector_store.delete_by_document(document_id)
