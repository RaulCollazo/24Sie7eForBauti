from pydantic import BaseModel, ConfigDict

from app.schemas.category import CategoryRead


class ProductBase(BaseModel):
    name: str
    sku: str | None = None
    category_id: int | None = None
    price: float = 0
    stock: int = 0
    image: str | None = None
    is_favorite: bool = False


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: str | None = None
    sku: str | None = None
    category_id: int | None = None
    price: float | None = None
    stock: int | None = None
    image: str | None = None
    is_favorite: bool | None = None


class ProductRead(ProductBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    category: CategoryRead | None = None
