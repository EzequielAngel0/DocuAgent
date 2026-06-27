import uuid
from typing import List, Dict, Any, Optional
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct, Filter, FieldCondition, MatchValue
import cohere

from app.core.config import settings
from app.services.extractor import DocumentExtractor

# Inicializar clientes
qdrant_client = QdrantClient(
    host=settings.QDRANT_HOST,
    port=settings.QDRANT_PORT,
    api_key=settings.QDRANT_API_KEY if settings.QDRANT_API_KEY else None,
)

cohere_client = cohere.Client(
    api_key=settings.COHERE_API_KEY if settings.COHERE_API_KEY else "mock_cohere_key",
)

def create_collection_if_not_exists():
    """Crea la colección en Qdrant si no existe.

    El modelo Cohere embed-multilingual-v3.0 genera vectores de 1024 dimensiones.
    """
    collection = settings.QDRANT_COLLECTION
    try:
        collections_response = qdrant_client.get_collections()
        existing_collections = [c.name for c in collections_response.collections]
        if collection not in existing_collections:
            # Cohere v3 embeddings tienen 1024 dimensiones
            qdrant_client.create_collection(
                collection_name=collection,
                vectors_config=VectorParams(size=1024, distance=Distance.COSINE),
            )
            print(f"Colección Qdrant '{collection}' creada exitosamente.")
    except Exception as e:
        print(f"Error al verificar/crear colección Qdrant: {e}")

def chunk_text(text: str, chunk_size: int = 700, chunk_overlap: int = 150) -> List[Dict[str, Any]]:
    """Fragmenta un texto de manera recursiva e inteligente.

    Intenta preservar el metadato de página '[Página X]' que extrae el extractor de PDF.
    """
    chunks = []
    lines = text.split("\n")
    current_page = 1
    current_chunk = ""
    
    for line in lines:
        # Detectar indicador de página
        if line.strip().startswith("[Página ") and line.strip().endswith("]"):
            try:
                current_page = int(line.replace("[Página ", "").replace("]", ""))
            except ValueError:
                pass
            continue
            
        if len(current_chunk) + len(line) < chunk_size:
            current_chunk += line + "\n"
        else:
            if current_chunk.strip():
                chunks.append({
                    "content": current_chunk.strip(),
                    "page": current_page
                })
            # Solapamiento básico usando palabras del final del chunk anterior
            words = current_chunk.split()
            overlap_words = words[-max(1, int(chunk_overlap / 6)):] if words else []
            current_chunk = " ".join(overlap_words) + "\n" + line + "\n"
            
    if current_chunk.strip():
        chunks.append({
            "content": current_chunk.strip(),
            "page": current_page
        })
        
    return chunks

def index_document(document_id: str, document_name: str, file_path: str, category_name: str) -> int:
    """Extrae, fragmenta, vectoriza e indexa un documento en Qdrant.
    """
    create_collection_if_not_exists()
    
    # 1. Extraer texto del documento
    text = DocumentExtractor.extract_text(file_path)
    
    # 2. Fragmentar texto
    chunks_meta = chunk_text(text)
    if not chunks_meta:
        return 0
        
    # 3. Vectorizar fragmentos en lotes (batch) para optimizar rendimiento de la API
    texts_to_embed = [c["content"] for c in chunks_meta]
    
    # Cohere requiere input_type='search_document' al indexar
    embed_response = cohere_client.embed(
        texts=texts_to_embed,
        model=settings.COHERE_EMBED_MODEL,
        input_type="search_document"
    )
    embeddings = embed_response.embeddings
    
    # 4. Construir puntos para Qdrant
    points = []
    for idx, (chunk, embedding) in enumerate(zip(chunks_meta, embeddings)):
        point_id = str(uuid.uuid4())
        point = PointStruct(
            id=point_id,
            vector=embedding,
            payload={
                "document_id": document_id,
                "document_name": document_name,
                "category": category_name,
                "page": chunk["page"],
                "content": chunk["content"],
            }
        )
        points.append(point)
        
    # 5. Cargar en Qdrant
    qdrant_client.upsert(
        collection_name=settings.QDRANT_COLLECTION,
        points=points,
    )
    
    return len(points)

def delete_document_vectors(document_id: str):
    """Elimina todos los vectores asociados a un ID de documento en Qdrant.
    """
    try:
        qdrant_client.delete(
            collection_name=settings.QDRANT_COLLECTION,
            points_selector=Filter(
                must=[
                    FieldCondition(
                        key="document_id",
                        match=MatchValue(value=document_id)
                    )
                ]
            )
        )
    except Exception as e:
        print(f"Error al eliminar vectores de documento {document_id}: {e}")

def hybrid_search_and_rerank(query: str, category_filter: Optional[str] = None) -> List[Dict[str, Any]]:
    """Realiza una búsqueda híbrida utilizando embeddings de Cohere y reordenamiento semántico.
    """
    create_collection_if_not_exists()
    
    # 1. Vectorizar consulta (input_type='search_query')
    embed_response = cohere_client.embed(
        texts=[query],
        model=settings.COHERE_EMBED_MODEL,
        input_type="search_query"
    )
    query_vector = embed_response.embeddings[0]
    
    # 2. Configurar filtros por categoría (si se especifica)
    search_filter = None
    if category_filter:
        search_filter = Filter(
            must=[
                FieldCondition(
                    key="category",
                    match=MatchValue(value=category_filter)
                )
            ]
        )
        
    # 3. Buscar en Qdrant (Recuperar Top K candidatos)
    search_results = qdrant_client.search(
        collection_name=settings.QDRANT_COLLECTION,
        query_vector=query_vector,
        query_filter=search_filter,
        limit=settings.RETRIEVAL_TOP_K,
        with_payload=True,
    )
    
    if not search_results:
        return []
        
    # 4. Aplicar Cohere Rerank
    documents_to_rerank = [r.payload["content"] for r in search_results]
    
    rerank_response = cohere_client.rerank(
        query=query,
        documents=documents_to_rerank,
        model=settings.COHERE_RERANK_MODEL,
        top_n=settings.RERANK_TOP_N,
    )
    
    # 5. Filtrar candidatos por umbral de confianza y retornar metadatos completos
    filtered_results = []
    for rank_item in rerank_response.results:
        confidence = float(rank_item.relevance_score)
        
        # Filtrar si no pasa el umbral de confianza
        if confidence >= settings.CONFIDENCE_THRESHOLD:
            original_match = search_results[rank_item.index]
            filtered_results.append({
                "content": original_match.payload["content"],
                "document_id": original_match.payload["document_id"],
                "document_name": original_match.payload["document_name"],
                "category": original_match.payload["category"],
                "page": original_match.payload["page"],
                "confidence": round(confidence * 100, 1),  # en porcentaje (ej: 87.5%)
            })
            
    return filtered_results
