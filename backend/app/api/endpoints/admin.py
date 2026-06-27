import os
import shutil
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import update, delete

from app.core.config import settings
from app.db.session import get_db
from app.db.models import AdminUser, Category, Document, AuditLog
from app.db.schemas import (
    CategoryResponse, CategoryCreate, CategoryUpdate,
    DocumentResponse, ChunkInspectorResponse, AuditLogResponse, FeedbackUpdateRequest
)
from app.api.deps import get_current_user
from app.services.rag_pipeline import index_document, delete_document_vectors, qdrant_client

router = APIRouter()

# Carpeta local para almacenar temporalmente los archivos cargados
UPLOAD_DIR = os.path.join(os.getcwd(), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# ============================================================
# Tarea de fondo para indexar documentos (BackgroundTasks)
# ============================================================
async def process_document_task(document_id: str, document_name: str, file_path: str, category_name: str):
    """Tarea asíncrona de fondo que extrae texto, calcula embeddings e indexa en Qdrant.
    """
    # Abrir sesión de BD de forma manual ya que se ejecuta fuera del request cycle
    from app.db.session import SessionLocal
    async with SessionLocal() as db:
        try:
            # Ejecutar el indexado vectorial
            chunks_count = index_document(document_id, document_name, file_path, category_name)
            
            # Actualizar estado a indexado
            await db.execute(
                update(Document)
                .where(Document.id == document_id)
                .values(status="Indexado", chunks_count=chunks_count)
            )
            await db.commit()
        except Exception as e:
            print(f"Error procesando documento {document_name}: {e}")
            await db.execute(
                update(Document)
                .where(Document.id == document_id)
                .values(status="Fallo")
            )
            await db.commit()

# ============================================================
# CRUD CATEGORÍAS
# ============================================================
@router.get("/categories", response_model=List[CategoryResponse])
async def list_categories(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Category).order_by(Category.name))
    categories = result.scalars().all()
    
    # Sembrar categorías por defecto si la tabla está vacía
    if not categories:
        default_cats = [
            Category(id="cat_1", name="Recursos Humanos", slug="recursos-humanos", color="terracotta", icon_name="Users"),
            Category(id="cat_2", name="Finanzas", slug="finanzas", color="bronze", icon_name="Coins"),
            Category(id="cat_3", name="Seguridad e Higiene", slug="seguridad", color="oliva", icon_name="ShieldAlert"),
            Category(id="cat_4", name="General", slug="general", color="carbón", icon_name="Folder"),
        ]
        for c in default_cats:
            db.add(c)
        await db.commit()
        result = await db.execute(select(Category).order_by(Category.name))
        categories = result.scalars().all()
        
    return categories

@router.post("/categories", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
async def create_category(
    cat_data: CategoryCreate,
    db: AsyncSession = Depends(get_db),
    current_user: AdminUser = Depends(get_current_user)
):
    # Generar slug si está repetido o sanitizar
    cat_id = f"cat_{uuid.uuid4().hex[:8]}"
    new_cat = Category(
        id=cat_id,
        name=cat_data.name,
        slug=cat_data.slug,
        color=cat_data.color,
        icon_name=cat_data.icon_name
    )
    db.add(new_cat)
    await db.commit()
    await db.refresh(new_cat)
    return new_cat

@router.put("/categories/{id}", response_model=CategoryResponse)
async def update_category(
    id: str,
    cat_data: CategoryUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: AdminUser = Depends(get_current_user)
):
    result = await db.execute(select(Category).where(Category.id == id))
    category = result.scalars().first()
    if not category:
        raise HTTPException(status_code=404, detail="Categoría no encontrada.")
        
    update_data = cat_data.model_dump(exclude_unset=True)
    for key, val in update_data.items():
        setattr(category, key, val)
        
    await db.commit()
    await db.refresh(category)
    return category

@router.delete("/categories/{id}")
async def delete_category(
    id: str,
    db: AsyncSession = Depends(get_db),
    current_user: AdminUser = Depends(get_current_user)
):
    result = await db.execute(select(Category).where(Category.id == id))
    category = result.scalars().first()
    if not category:
        raise HTTPException(status_code=404, detail="Categoría no encontrada.")
        
    await db.delete(category)
    await db.commit()
    return {"detail": "Categoría eliminada con éxito."}

# ============================================================
# GESTIÓN DE DOCUMENTOS
# ============================================================
@router.get("/documents", response_model=List[DocumentResponse])
async def list_documents(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Document).order_by(Document.uploaded_at.desc()))
    return result.scalars().all()

@router.post("/documents/upload", response_model=DocumentResponse)
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    category_id: str = Form(...),
    db: AsyncSession = Depends(get_db),
    current_user: AdminUser = Depends(get_current_user)
):
    # Validar que exista la categoría
    cat_result = await db.execute(select(Category).where(Category.id == category_id))
    category = cat_result.scalars().first()
    if not category:
        raise HTTPException(status_code=400, detail="Categoría seleccionada no existe.")
        
    # Guardar archivo físicamente
    doc_id = f"doc_{uuid.uuid4().hex[:8]}"
    file_ext = os.path.splitext(file.filename)[1]
    saved_filename = f"{doc_id}{file_ext}"
    saved_file_path = os.path.join(UPLOAD_DIR, saved_filename)
    
    with open(saved_file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # Crear registro en base de datos
    new_doc = Document(
        id=doc_id,
        name=file.filename,
        file_path=saved_file_path,
        category_id=category_id,
        chunks_count=0,
        status="Indexando"
    )
    db.add(new_doc)
    await db.commit()
    await db.refresh(new_doc)
    
    # Disparar tarea en segundo plano para procesar e indexar vectorialmente en Qdrant
    background_tasks.add_task(
        process_document_task,
        doc_id,
        file.filename,
        saved_file_path,
        category.name
    )
    
    return new_doc

@router.post("/documents/{id}/reindex", response_model=DocumentResponse)
async def reindex_document_endpoint(
    id: str,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: AdminUser = Depends(get_current_user)
):
    result = await db.execute(select(Document).where(Document.id == id))
    doc = result.scalars().first()
    if not doc:
        raise HTTPException(status_code=404, detail="Documento no encontrado.")
        
    cat_result = await db.execute(select(Category).where(Category.id == doc.category_id))
    category = cat_result.scalars().first()
    category_name = category.name if category else "General"
    
    # Cambiar estado a indexando
    doc.status = "Indexando"
    await db.commit()
    
    # Eliminar primero vectores existentes
    delete_document_vectors(id)
    
    # Disparar tarea de fondo
    background_tasks.add_task(
        process_document_task,
        id,
        doc.name,
        doc.file_path,
        category_name
    )
    
    return doc

@router.delete("/documents/{id}")
async def delete_document(
    id: str,
    db: AsyncSession = Depends(get_db),
    current_user: AdminUser = Depends(get_current_user)
):
    result = await db.execute(select(Document).where(Document.id == id))
    doc = result.scalars().first()
    if not doc:
        raise HTTPException(status_code=404, detail="Documento no encontrado.")
        
    # 1. Eliminar archivo físico
    if os.path.exists(doc.file_path):
        try:
            os.remove(doc.file_path)
        except Exception as e:
            print(f"Error al eliminar archivo {doc.file_path}: {e}")
            
    # 2. Eliminar vectores de Qdrant
    delete_document_vectors(id)
    
    # 3. Eliminar registro en base de datos
    await db.delete(doc)
    await db.commit()
    
    return {"detail": "Documento eliminado con éxito."}

# ============================================================
# INSPECCIÓN DE CHUNKS VECTORIALES
# ============================================================
@router.get("/documents/{id}/chunks", response_model=List[ChunkInspectorResponse])
async def inspect_document_chunks(
    id: str,
    db: AsyncSession = Depends(get_db),
    current_user: AdminUser = Depends(get_current_user)
):
    """Obtiene los fragmentos (chunks) y embeddings del documento almacenados en Qdrant.
    """
    # Validar existencia del documento
    result = await db.execute(select(Document).where(Document.id == id))
    doc = result.scalars().first()
    if not doc:
        raise HTTPException(status_code=404, detail="Documento no encontrado.")
        
    # Obtener puntos desde Qdrant mediante un filtro por document_id
    try:
        scroll_filter = qdrant_client.models.Filter(
            must=[
                qdrant_client.models.FieldCondition(
                    key="document_id",
                    match=qdrant_client.models.MatchValue(value=id)
                )
            ]
        )
        
        scroll_result, _ = qdrant_client.scroll(
            collection_name=settings.QDRANT_COLLECTION,
            scroll_filter=scroll_filter,
            limit=100,
            with_payload=True,
            with_vectors=True,
        )
        
        inspector_chunks = []
        for point in scroll_result:
            # Truncar o tomar solo las primeras 5 dimensiones del embedding para optimizar tamaño
            vector_dims = point.vector[:5] if point.vector else []
            
            inspector_chunks.append({
                "id": str(point.id),
                "content": point.payload.get("content", ""),
                "page": point.payload.get("page", 1),
                "category": point.payload.get("category", "General"),
                "document_name": point.payload.get("document_name", doc.name),
                "vector": vector_dims,  # primeras 5 dimensiones representativas
            })
            
        # Ordenar por página
        inspector_chunks.sort(key=lambda x: x["page"])
        return inspector_chunks
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error al leer de la base de datos vectorial: {e}"
        )

# ============================================================
# HISTORIAL Y AUDITORÍA
# ============================================================
@router.get("/history", response_model=List[AuditLogResponse])
async def get_history(
    search: Optional[str] = None,
    category: Optional[str] = None,
    rating: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: AdminUser = Depends(get_current_user)
):
    query_stmt = select(AuditLog)
    
    # Aplicar filtros dinámicos
    if search:
        query_stmt = query_stmt.where(
            AuditLog.query.icontains(search) | AuditLog.response.icontains(search)
        )
    if category:
        query_stmt = query_stmt.where(AuditLog.category == category)
    if rating:
        if rating == "positive":
            query_stmt = query_stmt.where(AuditLog.feedback == "positive")
        elif rating == "negative":
            query_stmt = query_stmt.where(AuditLog.feedback == "negative")
        elif rating == "unrated":
            query_stmt = query_stmt.where(AuditLog.feedback.is_(None))
            
    query_stmt = query_stmt.order_by(AuditLog.created_at.desc())
    result = await db.execute(query_stmt)
    return result.scalars().all()


@router.post("/history/{id}/feedback")
async def update_feedback(
    id: int,
    feedback_data: FeedbackUpdateRequest,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(AuditLog).where(AuditLog.id == id))
    log = result.scalars().first()
    if not log:
        raise HTTPException(status_code=404, detail="Registro de auditoría no encontrado.")
        
    log.feedback = feedback_data.feedback if feedback_data.feedback != "none" else None
    await db.commit()
    return {"detail": "Feedback registrado correctamente."}

