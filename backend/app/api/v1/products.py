from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.images import MAX_IMAGE_BYTES, ImageError, download_image, save_image
from app.models import Category, Product
from app.schemas.product import (
    ProductCreate,
    ProductImageFromUrl,
    ProductImageRead,
    ProductRead,
    ProductUpdate,
)

router = APIRouter(prefix="/products", tags=["products"])


@router.get("", response_model=list[ProductRead])
def list_products(
    db: Session = Depends(get_db),
    q: str | None = Query(None),
    category_id: int | None = Query(None),
    favorites: bool | None = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
) -> list[Product]:
    stmt = select(Product).order_by(Product.id)
    if q:
        stmt = stmt.where(Product.name.ilike(f"%{q}%"))
    if category_id is not None:
        stmt = stmt.where(Product.category_id == category_id)
    if favorites is True:
        stmt = stmt.where(Product.is_favorite.is_(True))
    return list(db.scalars(stmt.offset(skip).limit(limit)))


@router.post("/images/upload", response_model=ProductImageRead, status_code=201)
def upload_product_image(file: UploadFile = File(...)) -> ProductImageRead:
    data = file.file.read(MAX_IMAGE_BYTES + 1)
    try:
        image = save_image(data, file.content_type)
    except ImageError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return ProductImageRead(image=image)


@router.post("/images/from-url", response_model=ProductImageRead, status_code=201)
def download_product_image(payload: ProductImageFromUrl) -> ProductImageRead:
    try:
        image = download_image(payload.url)
    except ImageError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return ProductImageRead(image=image)


@router.get("/{product_id}", response_model=ProductRead)
def get_product(product_id: int, db: Session = Depends(get_db)) -> Product:
    product = db.get(Product, product_id)
    if product is None:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return product


@router.post("", response_model=ProductRead, status_code=201)
def create_product(payload: ProductCreate, db: Session = Depends(get_db)) -> Product:
    if payload.category_id is not None:
        if db.get(Category, payload.category_id) is None:
            raise HTTPException(status_code=404, detail="Categoría no encontrada")
    if payload.sku:
        exists = db.scalar(select(Product).where(Product.sku == payload.sku))
        if exists:
            raise HTTPException(status_code=409, detail="SKU ya existe")
    product = Product(**payload.model_dump())
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


@router.put("/{product_id}", response_model=ProductRead)
def update_product(
    product_id: int, payload: ProductUpdate, db: Session = Depends(get_db)
) -> Product:
    product = db.get(Product, product_id)
    if product is None:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    data = payload.model_dump(exclude_unset=True)
    if "category_id" in data and data["category_id"] is not None:
        if db.get(Category, data["category_id"]) is None:
            raise HTTPException(status_code=404, detail="Categoría no encontrada")
    if "sku" in data and data["sku"]:
        exists = db.scalar(
            select(Product).where(Product.sku == data["sku"], Product.id != product_id)
        )
        if exists:
            raise HTTPException(status_code=409, detail="SKU ya existe")
    for key, value in data.items():
        setattr(product, key, value)
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


@router.delete("/{product_id}", status_code=204)
def delete_product(product_id: int, db: Session = Depends(get_db)) -> None:
    product = db.get(Product, product_id)
    if product is None:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    db.delete(product)
    db.commit()
