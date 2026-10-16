from datetime import datetime

from pydantic import BaseModel, ConfigDict


class SaleItemCreate(BaseModel):
    product_id: int
    quantity: int = 1


class SaleItemRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    product_id: int | None
    product_name: str
    quantity: int
    unit_price: float
    subtotal: float


class SaleCreate(BaseModel):
    payment_method: str = "Efectivo"
    customer: str | None = None
    discount: float = 0
    tax_rate: float = 0.21
    items: list[SaleItemCreate]


class SaleRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    number: int
    created_at: datetime
    payment_method: str
    customer: str | None
    subtotal: float
    discount: float
    tax: float
    total: float
    status: str
    items: list[SaleItemRead]
