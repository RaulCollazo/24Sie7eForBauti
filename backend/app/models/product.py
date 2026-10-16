from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.category import Category
    from app.models.sale import SaleItem


class Product(Base):
    __tablename__ = "products"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120), index=True)
    sku: Mapped[str | None] = mapped_column(String(40), unique=True, index=True)
    category_id: Mapped[int | None] = mapped_column(ForeignKey("categories.id"))
    price: Mapped[float] = mapped_column(Numeric(12, 2), default=0)
    stock: Mapped[int] = mapped_column(default=0)
    image: Mapped[str | None] = mapped_column(String(255))
    is_favorite: Mapped[bool] = mapped_column(default=False)

    category: Mapped["Category | None"] = relationship(back_populates="products")
    sale_items: Mapped[list["SaleItem"]] = relationship(back_populates="product")
