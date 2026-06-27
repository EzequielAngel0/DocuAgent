import os
import asyncio
import uuid
from sqlalchemy.future import select
from app.db.session import SessionLocal
from app.db.models import Category, Document
from app.services.rag_pipeline import index_document

DOCUMENTS_DIR = os.path.abspath(os.path.join(os.getcwd(), "documents"))

async def seed():
    print("=== Iniciando Carga e Indexación de Documentos de Ejemplo ===")
    async with SessionLocal() as db:
        # 1. Asegurar categorías
        cat_map = {}
        categories_data = [
            {"id": "cat_rh", "name": "Recursos Humanos", "slug": "recursos-humanos", "color": "terracotta", "icon_name": "Users", "folder": "rh"},
            {"id": "cat_fin", "name": "Finanzas", "slug": "finanzas", "color": "bronze", "icon_name": "Coins", "folder": "finanzas"},
            {"id": "cat_seg", "name": "Seguridad e Higiene", "slug": "seguridad", "color": "oliva", "icon_name": "ShieldAlert", "folder": "seguridad"},
            {"id": "cat_gen", "name": "General", "slug": "general", "color": "carbón", "icon_name": "Folder", "folder": "general"},
        ]

        for c_data in categories_data:
            result = await db.execute(select(Category).where(Category.name == c_data["name"]))
            cat = result.scalars().first()
            if not cat:
                cat = Category(
                    id=c_data["id"],
                    name=c_data["name"],
                    slug=c_data["slug"],
                    color=c_data["color"],
                    icon_name=c_data["icon_name"]
                )
                db.add(cat)
                await db.commit()
                await db.refresh(cat)
            cat_map[c_data["folder"]] = cat

        # 2. Recorrer la carpeta de documentos e indexar
        if not os.path.exists(DOCUMENTS_DIR):
            print(f"Carpeta de documentos no encontrada: {DOCUMENTS_DIR}")
            return

        for root, dirs, files in os.walk(DOCUMENTS_DIR):
            folder_name = os.path.basename(root)
            if folder_name in cat_map:
                category = cat_map[folder_name]
                for file_name in files:
                    file_path = os.path.join(root, file_name)
                    doc_id = f"doc_{uuid.uuid4().hex[:8]}"
                    
                    # Verificar si ya existe un documento con el mismo nombre
                    existing_doc = await db.execute(select(Document).where(Document.name == file_name))
                    if existing_doc.scalars().first():
                        print(f"El documento '{file_name}' ya se encuentra registrado. Omitiendo.")
                        continue

                    print(f"Indexando en Qdrant y PostgreSQL: {file_name} (Categoría: {category.name})...")
                    try:
                        chunks_count = index_document(doc_id, file_name, file_path, category.name)
                        new_doc = Document(
                            id=doc_id,
                            name=file_name,
                            file_path=file_path,
                            category_id=category.id,
                            chunks_count=chunks_count,
                            status="Indexado"
                        )
                        db.add(new_doc)
                        await db.commit()
                        print(f"✅ Exitoso: '{file_name}' con {chunks_count} chunks.")
                    except Exception as e:
                        print(f"❌ Error al indexar '{file_name}': {e}")

if __name__ == "__main__":
    asyncio.run(seed())
