from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.core.database import get_db
from app.models import Product, Sale, SaleItem
from app.schemas.sale import SaleCreate, SaleRead

router = APIRouter(prefix="/sales", tags=["sales"])


@router.get("", response_model=list[SaleRead])
def list_sales(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 50,
) -> list[Sale]:
    stmt = (
        select(Sale)
        .options(selectinload(Sale.items))
        .order_by(Sale.created_at.desc(), Sale.id.desc())
        .offset(skip)
        .limit(limit)
    )
    return list(db.scalars(stmt))


@router.get("/{sale_id}", response_model=SaleRead)
def get_sale(sale_id: int, db: Session = Depends(get_db)) -> Sale:
    sale = db.scalar(
        select(Sale).options(selectinload(Sale.items)).where(Sale.id == sale_id)
    )
    if sale is None:
        raise HTTPException(status_code=404, detail="Venta no encontrada")
    return sale


@router.post("", response_model=SaleRead, status_code=201)
def create_sale(payload: SaleCreate, db: Session = Depends(get_db)) -> Sale:
    if not payload.items:
        raise HTTPException(status_code=400, detail="La venta no tiene ítems")

    subtotal = 0.0
    # Validate items and compute subtotal
    products: dict[int, Product] = {}
    for item in payload.items:
        product = db.get(Product, item.product_id)
        if product is None:
            raise HTTPException(
                status_code=404,
                detail=f"Producto {item.product_id} no encontrado",
            )
        if item.quantity < 1:
            raise HTTPException(status_code=400, detail="Cantidad inválida")
        if product.stock < item.quantity:
            raise HTTPException(
                status_code=400,
                detail=f"Stock insuficiente para {product.name}",
            )
        line = float(product.price) * item.quantity
        subtotal += line
        products[product.id] = product

    discount = float(payload.discount or 0)
    tax_rate = float(payload.tax_rate or 0.21)
    tax = round((subtotal - discount) * tax_rate, 2)
    total = round((subtotal - discount) + tax, 2)

    # Get next sale number
    last_number = db.scalar(select(func.max(Sale.number))) or 0
    sale = Sale(
        number=last_number + 1,
        payment_method=payload.payment_method or "Efectivo",
        customer=payload.customer,
        subtotal=round(subtotal, 2),
        discount=discount,
        tax=tax,
        total=total,
        status="completed",
    )
    db.add(sale)
    db.flush()

    for item in payload.items:
        product = products[item.product_id]
        unit_price = float(product.price)
        line_sub = round(unit_price * item.quantity, 2)
        sale_item = SaleItem(
            sale_id=sale.id,
            product_id=product.id,
            product_name=product.name,
            quantity=item.quantity,
            unit_price=unit_price,
            subtotal=line_sub,
        )
        db.add(sale_item)
        product.stock -= item.quantity

    db.add(sale)
    db.commit()
    db.refresh(sale)
    sale = db.scalar(
        select(Sale).options(selectinload(Sale.items)).where(Sale.id == sale.id)
    )
    return sale  # type: ignore[return-value]
