"""Indexa los documentos de ejemplo de `documents/` en Qdrant + PostgreSQL.

Recorre las subcarpetas (rh, finanzas, seguridad, general), las mapea a
categorías y registra cada archivo evitando duplicados por nombre.

Uso:  python -m app.scripts.seed_documents
"""

import asyncio
import os
import uuid

from sqlalchemy.future import select

from app.db.session import SessionLocal
from app.ingestion import index_document
from app.models import Category, Document

DOCUMENTS_DIR = os.path.abspath(os.path.join(os.getcwd(), "documents"))

CATEGORIES_DATA = [
    {
        "id": "cat_rh",
        "name": "Recursos Humanos",
        "slug": "recursos-humanos",
        "color": "terracotta",
        "icon_name": "Users",
        "folder": "rh",
    },
    {
        "id": "cat_fin",
        "name": "Finanzas",
        "slug": "finanzas",
        "color": "bronze",
        "icon_name": "Coins",
        "folder": "finanzas",
    },
    {
        "id": "cat_seg",
        "name": "Seguridad e Higiene",
        "slug": "seguridad",
        "color": "oliva",
        "icon_name": "ShieldAlert",
        "folder": "seguridad",
    },
    {
        "id": "cat_gen",
        "name": "General",
        "slug": "general",
        "color": "carbón",
        "icon_name": "Folder",
        "folder": "general",
    },
]


async def seed() -> None:
    print("=== Carga e indexación de documentos de ejemplo ===")
    async with SessionLocal() as db:
        cat_map = {}
        for c_data in CATEGORIES_DATA:
            result = await db.execute(select(Category).where(Category.name == c_data["name"]))
            cat = result.scalars().first()
            if not cat:
                cat = Category(
                    id=c_data["id"],
                    name=c_data["name"],
                    slug=c_data["slug"],
                    color=c_data["color"],
                    icon_name=c_data["icon_name"],
                )
                db.add(cat)
                await db.commit()
                await db.refresh(cat)
            cat_map[c_data["folder"]] = cat

        if not os.path.exists(DOCUMENTS_DIR):
            print(f"Carpeta de documentos no encontrada: {DOCUMENTS_DIR}")
            return

        for root, _dirs, files in os.walk(DOCUMENTS_DIR):
            folder_name = os.path.basename(root)
            category = cat_map.get(folder_name)
            if not category:
                continue
            for file_name in files:
                file_path = os.path.join(root, file_name)
                existing = await db.execute(select(Document).where(Document.name == file_name))
                if existing.scalars().first():
                    print(f"'{file_name}' ya registrado. Omitiendo.")
                    continue

                print(f"Indexando: {file_name} (Categoría: {category.name})...")
                try:
                    doc_id = f"doc_{uuid.uuid4().hex[:8]}"
                    chunks_count = index_document(doc_id, file_name, file_path, category.name)
                    db.add(
                        Document(
                            id=doc_id,
                            name=file_name,
                            file_path=file_path,
                            category_id=category.id,
                            chunks_count=chunks_count,
                            status="Indexado",
                        )
                    )
                    await db.commit()
                    print(f"OK: '{file_name}' -> {chunks_count} chunks.")
                except Exception as exc:  # noqa: BLE001
                    print(f"ERROR al indexar '{file_name}': {exc}")


if __name__ == "__main__":
    asyncio.run(seed())
