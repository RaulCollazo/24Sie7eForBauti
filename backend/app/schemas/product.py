from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.schemas.category import CategoryRead


class ProductBase(BaseModel):
    name: str = Field(min_length=1)
    sku: str | None = None
    category_id: int | None = None
    price: float = 0
    stock: int = 0
    image: str | None = None
    is_favorite: bool = False

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("El nombre no puede estar vacío")
        return value


class ProductCreate(ProductBase):
    price: float = Field(default=0, ge=0)
    stock: int = Field(default=0, ge=0)


class ProductUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1)
    sku: str | None = None
    category_id: int | None = None
    price: float | None = None
    stock: int | None = None
    image: str | None = None
    is_favorite: bool | None = None

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str | None) -> str | None:
        if value is None:
            return None
        value = value.strip()
        if not value:
            raise ValueError("El nombre no puede estar vacío")
        return value


class ProductRead(ProductBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    category: CategoryRead | None = None


class ProductImageFromUrl(BaseModel):
    url: str


class ProductImageRead(BaseModel):
    image: str
