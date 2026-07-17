"""Gestión de documentos: subida (validada), reindexado, borrado e inspección.

La subida valida extensión y tamaño, persiste el archivo y dispara la
indexación vectorial en una tarea de fondo para no bloquear la respuesta.
"""

import os
import uuid

from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    File,
    Form,
    HTTPException,
    UploadFile,
)
from sqlalchemy import update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.api.deps import get_current_user
from app.core.config import settings
from app.core.logging import get_logger
from app.core.validation import is_safe_archive, validate_file_signature
from app.db.session import SessionLocal, get_db
from app.ingestion import delete_document_vectors, index_document
from app.models import AdminUser, Category, ChunkInspectorResponse, Document, DocumentResponse
from app.rag.vector_store import vector_store

router = APIRouter()
logger = get_logger(__name__)

UPLOAD_DIR = os.path.abspath(settings.UPLOAD_DIR)
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_EXTENSIONS = {
    ".pdf",
    ".docx",
    ".xlsx",
    ".xls",
    ".csv",
    ".md",
    ".txt",
    ".html",
    ".json",
}


async def process_document_task(
    document_id: str, document_name: str, file_path: str, category_name: str
) -> None:
    """Tarea de fondo: indexa el documento y actualiza su estado en BD."""
    async with SessionLocal() as db:
        try:
            chunks_count = index_document(document_id, document_name, file_path, category_name)
            await db.execute(
                update(Document)
                .where(Document.id == document_id)
                .values(status="Indexado", chunks_count=chunks_count)
            )
            await db.commit()
        except Exception as exc:  # noqa: BLE001
            logger.error("document_indexing_failed", document_id=document_id, error=str(exc))
            await db.execute(
                update(Document).where(Document.id == document_id).values(status="Fallo")
            )
            await db.commit()


async def _save_upload(file: UploadFile, dest_path: str, max_bytes: int) -> None:
    """Guarda el archivo en disco abortando si excede el tamaño máximo."""
    size = 0
    with open(dest_path, "wb") as buffer:
        while chunk := await file.read(1024 * 1024):
            size += len(chunk)
            if size > max_bytes:
                buffer.close()
                os.remove(dest_path)
                raise HTTPException(
                    status_code=413,
                    detail=f"El archivo excede el máximo de {settings.MAX_FILE_SIZE_MB} MB.",
                )
            buffer.write(chunk)


@router.get("/documents", response_model=list[DocumentResponse])
async def list_documents(
    db: AsyncSession = Depends(get_db),
    current_user: AdminUser = Depends(get_current_user),
):
    result = await db.execute(select(Document).order_by(Document.uploaded_at.desc()))
    return result.scalars().all()


@router.post("/documents/upload", response_model=DocumentResponse)
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    category_id: str = Form(...),
    db: AsyncSession = Depends(get_db),
    current_user: AdminUser = Depends(get_current_user),
):
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=415, detail=f"Formato no soportado: {ext or 'desconocido'}."
        )

    cat_result = await db.execute(select(Category).where(Category.id == category_id))
    category = cat_result.scalars().first()
    if not category:
        raise HTTPException(status_code=400, detail="Categoría seleccionada no existe.")

    doc_id = f"doc_{uuid.uuid4().hex[:8]}"
    saved_path = os.path.join(UPLOAD_DIR, f"{doc_id}{ext}")
    await _save_upload(file, saved_path, settings.MAX_FILE_SIZE_MB * 1024 * 1024)

    # Verificar magic bytes: el contenido debe coincidir con la extensión.
    if not validate_file_signature(saved_path, ext):
        os.remove(saved_path)
        raise HTTPException(
            status_code=415, detail="El contenido del archivo no coincide con su extensión."
        )

    # Anti zip-bomb para OOXML (docx/xlsx son contenedores ZIP).
    if ext in (".docx", ".xlsx") and not is_safe_archive(saved_path):
        os.remove(saved_path)
        raise HTTPException(
            status_code=413, detail="El archivo comprimido es demasiado grande al descomprimir."
        )

    new_doc = Document(
        id=doc_id,
        name=file.filename,
        file_path=saved_path,
        category_id=category_id,
        chunks_count=0,
        status="Indexando",
    )
    db.add(new_doc)
    await db.commit()
    await db.refresh(new_doc)

    background_tasks.add_task(
        process_document_task, doc_id, file.filename, saved_path, category.name
    )
    return new_doc


@router.post("/documents/{id}/reindex", response_model=DocumentResponse)
async def reindex_document(
    id: str,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: AdminUser = Depends(get_current_user),
):
    result = await db.execute(select(Document).where(Document.id == id))
    doc = result.scalars().first()
    if not doc:
        raise HTTPException(status_code=404, detail="Documento no encontrado.")

    cat_result = await db.execute(select(Category).where(Category.id == doc.category_id))
    category = cat_result.scalars().first()
    category_name = category.name if category else "General"

    doc.status = "Indexando"
    await db.commit()

    delete_document_vectors(id)
    background_tasks.add_task(process_document_task, id, doc.name, doc.file_path, category_name)
    return doc


@router.delete("/documents/{id}")
async def delete_document(
    id: str,
    db: AsyncSession = Depends(get_db),
    current_user: AdminUser = Depends(get_current_user),
):
    result = await db.execute(select(Document).where(Document.id == id))
    doc = result.scalars().first()
    if not doc:
        raise HTTPException(status_code=404, detail="Documento no encontrado.")

    if os.path.exists(doc.file_path):
        try:
            os.remove(doc.file_path)
        except OSError as exc:
            logger.warning("document_file_delete_failed", path=doc.file_path, error=str(exc))

    delete_document_vectors(id)
    await db.delete(doc)
    await db.commit()
    return {"detail": "Documento eliminado con éxito."}


@router.get("/documents/{id}/chunks", response_model=list[ChunkInspectorResponse])
async def inspect_document_chunks(
    id: str,
    db: AsyncSession = Depends(get_db),
    current_user: AdminUser = Depends(get_current_user),
):
    """Devuelve los fragmentos del documento almacenados en Qdrant."""
    result = await db.execute(select(Document).where(Document.id == id))
    doc = result.scalars().first()
    if not doc:
        raise HTTPException(status_code=404, detail="Documento no encontrado.")

    try:
        points = vector_store.scroll_by_document(id, limit=100, with_vectors=True)
    except Exception as exc:  # noqa: BLE001
        logger.error("qdrant_scroll_failed", document_id=id, error=str(exc))
        raise HTTPException(status_code=500, detail="Error al leer la base vectorial.") from exc

    chunks = [
        {
            "id": str(point.id),
            "content": point.payload.get("content", ""),
            "page": point.payload.get("page", 1),
            "category": point.payload.get("category", "General"),
            "document_name": point.payload.get("document_name", doc.name),
            # Solo las primeras 5 dimensiones, a modo ilustrativo.
            "vector": list(point.vector[:5]) if point.vector else [],
        }
        for point in points
    ]
    chunks.sort(key=lambda c: c["page"])
    return chunks
