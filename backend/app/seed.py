from __future__ import annotations

import sys
from pathlib import Path

from sqlalchemy import select

from app.core.database import SessionLocal
from app.models import Category, Product

CATEGORIES = [
    "Heladería",
    "Insumos",
    "Bebidas",
    "Golosinas",
    "Picadas",
    "Rotisería",
]

FIGMA_IMAGES: dict[str, str] = {
    "PAP-LAY": "img_b9f02c5dceef.png",
    "LEC-ILO-1L": "img_9fd395a5da3f.png",
    "SPR-2L": "img_48a58a71e210.png",
    "YER-PLA-1K": "img_9930626184d8.png",
}

OLD_WRONG_IMAGES: dict[str, str] = {
    "HEL-VAN-1KG": "/assets/products/img_021c631cefde.png",
    "CON-OBL-50": "/assets/products/img_1481875b94ba.png",
    "COC-225L": "/assets/products/img_25b7d6a6ec18.png",
    "ALF-HAV-CH": "/assets/products/img_2a97f75c4c23.png",
    "DDL-5KG": "/assets/products/img_35c12ac20f74.png",
    "LEC-ILO-1L": "/assets/products/img_48fb0979b0fb.png",
    "PAP-LAY": "/assets/products/img_64f235632917.png",
    "SPR-2L": "/assets/products/img_ff9fd75f4987.png",
    "YER-PLA-1K": "/assets/products/img_fc2731f31997.png",
}

SAMPLES: list[dict[str, object]] = [
    {
        "name": "Helado de Vainilla 1KG",
        "sku": "HEL-VAN-1KG",
        "category": "Heladería",
        "price": 4500.0,
        "stock": 20,
    },
    {
        "name": "Conos de Oblea x50",
        "sku": "CON-OBL-50",
        "category": "Insumos",
        "price": 1200.0,
        "stock": 50,
    },
    {
        "name": "Coca-Cola 2.25L",
        "sku": "COC-225L",
        "category": "Bebidas",
        "price": 2100.0,
        "stock": 0,
    },
    {
        "name": "Alfajor Havanna Chocolate",
        "sku": "ALF-HAV-CH",
        "category": "Golosinas",
        "price": 850.0,
        "stock": 100,
    },
    {
        "name": "Dulce de Leche 5KG",
        "sku": "DDL-5KG",
        "category": "Insumos",
        "price": 18000.0,
        "stock": 3,
    },
    {
        "name": "Leche Iloly x 1lt",
        "sku": "LEC-ILO-1L",
        "category": "Bebidas",
        "price": 1700.0,
        "stock": 40,
    },
    {
        "name": "Papas Fritas Lays",
        "sku": "PAP-LAY",
        "category": "Picadas",
        "price": 4000.0,
        "stock": 30,
    },
    {
        "name": "Sprite x 2 lts",
        "sku": "SPR-2L",
        "category": "Bebidas",
        "price": 3000.0,
        "stock": 25,
    },
    {
        "name": "Yerba Playadito x kg",
        "sku": "YER-PLA-1K",
        "category": "Bebidas",
        "price": 1200.0,
        "stock": 60,
    },
]


def _asset_dirs() -> list[Path]:
    if getattr(sys, "frozen", False):
        base = Path(getattr(sys, "_MEIPASS", Path(sys.executable).parent))
        return [base / "frontend" / "dist" / "assets" / "products"]
    root = Path(__file__).resolve().parents[2]
    return [
        root / "frontend" / "public" / "assets" / "products",
        root / "frontend" / "dist" / "assets" / "products",
    ]


def _pick(filename: str) -> str | None:
    for directory in _asset_dirs():
        if (directory / filename).is_file():
            return f"/assets/products/{filename}"
    return None


def _seed_image(sku: str) -> str | None:
    filename = FIGMA_IMAGES.get(sku)
    return _pick(filename) if filename else None


def seed_data() -> None:
    with SessionLocal() as db:
        cat_map: dict[str, Category] = {}
        for c in CATEGORIES:
            exists = db.scalar(select(Category).where(Category.name == c))
            if exists is None:
                exists = Category(name=c)
                db.add(exists)
            cat_map[c] = exists
        db.commit()

        for s in SAMPLES:
            sku = str(s["sku"])
            desired = _seed_image(sku)
            cat_name = str(s["category"])
            product = db.scalar(select(Product).where(Product.sku == sku))
            if product is None:
                db.add(
                    Product(
                        name=str(s["name"]),
                        sku=sku,
                        category_id=cat_map[cat_name].id if cat_name in cat_map else None,
                        price=float(s["price"]),
                        stock=int(s["stock"]),
                        image=desired,
                    )
                )
            elif product.image is None or product.image == OLD_WRONG_IMAGES.get(sku):
                product.image = desired
        db.commit()
