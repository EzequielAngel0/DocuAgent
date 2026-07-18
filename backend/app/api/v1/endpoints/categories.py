"""CRUD de categorías (protegido salvo el listado, usado por el chat público)."""

import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models import AdminUser, Category, CategoryCreate, CategoryResponse, CategoryUpdate

router = APIRouter()

_DEFAULT_CATEGORIES = [
    {
        "id": "cat_1",
        "name": "Recursos Humanos",
        "slug": "recursos-humanos",
        "color": "terracotta",
        "icon_name": "Users",
    },
    {
        "id": "cat_2",
        "name": "Finanzas",
        "slug": "finanzas",
        "color": "bronze",
        "icon_name": "Coins",
    },
    {
        "id": "cat_3",
        "name": "Seguridad e Higiene",
        "slug": "seguridad",
        "color": "oliva",
        "icon_name": "ShieldAlert",
    },
    {"id": "cat_4", "name": "General", "slug": "general", "color": "carbón", "icon_name": "Folder"},
]


@router.get("/categories", response_model=list[CategoryResponse])
async def list_categories(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Category).order_by(Category.name))
    categories = result.scalars().all()

    if not categories:
        for c in _DEFAULT_CATEGORIES:
            db.add(Category(**c))
        await db.commit()
        result = await db.execute(select(Category).order_by(Category.name))
        categories = result.scalars().all()

    return categories


@router.post("/categories", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
async def create_category(
    cat_data: CategoryCreate,
    db: AsyncSession = Depends(get_db),
    current_user: AdminUser = Depends(get_current_user),
):
    new_cat = Category(id=f"cat_{uuid.uuid4().hex[:8]}", **cat_data.model_dump())
    db.add(new_cat)
    await db.commit()
    await db.refresh(new_cat)
    return new_cat


@router.put("/categories/{id}", response_model=CategoryResponse)
async def update_category(
    id: str,
    cat_data: CategoryUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: AdminUser = Depends(get_current_user),
):
    result = await db.execute(select(Category).where(Category.id == id))
    category = result.scalars().first()
    if not category:
        raise HTTPException(status_code=404, detail="Categoría no encontrada.")

    for key, val in cat_data.model_dump(exclude_unset=True).items():
        setattr(category, key, val)
    await db.commit()
    await db.refresh(category)
    return category


@router.delete("/categories/{id}")
async def delete_category(
    id: str,
    db: AsyncSession = Depends(get_db),
    current_user: AdminUser = Depends(get_current_user),
):
    result = await db.execute(select(Category).where(Category.id == id))
    category = result.scalars().first()
    if not category:
        raise HTTPException(status_code=404, detail="Categoría no encontrada.")

    await db.delete(category)
    await db.commit()
    return {"detail": "Categoría eliminada con éxito."}
