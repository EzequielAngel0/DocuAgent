"""Acceso a la base vectorial Qdrant.

Encapsula la conexión y las operaciones de colección (crear, upsert,
búsqueda con filtro por categoría, borrado y scroll por documento) tras una
única clase. El resto del backend no debe hablar con `qdrant_client`
directamente.
"""

from typing import Any

from qdrant_client import QdrantClient
from qdrant_client.models import (
    Distance,
    FieldCondition,
    Filter,
    MatchValue,
    PointStruct,
    VectorParams,
)

from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)


def _category_filter(category: str | None) -> Filter | None:
    if not category:
        return None
    return Filter(must=[FieldCondition(key="category", match=MatchValue(value=category))])


class VectorStore:
    def __init__(self) -> None:
        self.collection = settings.QDRANT_COLLECTION
        self.client = QdrantClient(
            host=settings.QDRANT_HOST,
            port=settings.QDRANT_PORT,
            api_key=settings.QDRANT_API_KEY or None,
            https=False,
        )

    def ensure_collection(self) -> None:
        try:
            existing = {c.name for c in self.client.get_collections().collections}
            if self.collection not in existing:
                self.client.create_collection(
                    collection_name=self.collection,
                    vectors_config=VectorParams(
                        size=settings.QDRANT_VECTOR_SIZE, distance=Distance.COSINE
                    ),
                )
                logger.info("qdrant_collection_created", collection=self.collection)
        except Exception as exc:  # noqa: BLE001
            logger.error("qdrant_ensure_collection_failed", error=str(exc))

    def upsert_chunks(self, chunks: list[dict[str, Any]], vectors: list[list[float]]) -> int:
        """Inserta fragmentos con su vector y payload. Devuelve cuántos."""
        self.ensure_collection()
        points = [
            PointStruct(id=chunk["point_id"], vector=vector, payload=chunk["payload"])
            for chunk, vector in zip(chunks, vectors, strict=False)
        ]
        if points:
            self.client.upsert(collection_name=self.collection, points=points)
        return len(points)

    def search(
        self, query_vector: list[float], category: str | None, limit: int
    ) -> list[dict[str, Any]]:
        self.ensure_collection()
        results = self.client.search(
            collection_name=self.collection,
            query_vector=query_vector,
            query_filter=_category_filter(category),
            limit=limit,
            with_payload=True,
        )
        return [{"payload": r.payload, "score": r.score} for r in results]

    def delete_by_document(self, document_id: str) -> None:
        try:
            self.client.delete(
                collection_name=self.collection,
                points_selector=Filter(
                    must=[FieldCondition(key="document_id", match=MatchValue(value=document_id))]
                ),
            )
        except Exception as exc:  # noqa: BLE001
            logger.error("qdrant_delete_failed", document_id=document_id, error=str(exc))

    def scroll_by_document(
        self, document_id: str, limit: int = 100, with_vectors: bool = True
    ) -> list[Any]:
        points, _ = self.client.scroll(
            collection_name=self.collection,
            scroll_filter=Filter(
                must=[FieldCondition(key="document_id", match=MatchValue(value=document_id))]
            ),
            limit=limit,
            with_payload=True,
            with_vectors=with_vectors,
        )
        return points


# Singleton compartido en toda la app.
vector_store = VectorStore()
