"""Pipeline de ingesta de documentos."""
from app.ingestion.chunker import chunk_text
from app.ingestion.extractors import DocumentExtractor
from app.ingestion.indexer import delete_document_vectors, index_document

__all__ = [
    "DocumentExtractor",
    "chunk_text",
    "index_document",
    "delete_document_vectors",
]
