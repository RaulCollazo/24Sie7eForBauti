from __future__ import annotations

import os
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

# Try to map some sample products to known product image hashes in public/assets/products
PRODUCT_ASSETS_DIR = Path(__file__).resolve().parents[2] / "frontend" / "public" / "assets" / "products"
ASSET_NAMES = set(os.listdir(PRODUCT_ASSETS_DIR)) if PRODUCT_ASSETS_DIR.exists() else set()

# Known images from assets (subset) - pick reasonable matches
SAMPLES: list[dict[str, object]] = [
    {
        "name": "Helado de Vainilla 1KG",
        "sku": "HEL-VAN-1KG",
        "category": "Heladería",
        "price": 4500.0,
        "stock": 20,
        "image": _pick("img_021c631cefde.png") if "_pick" in locals() else None,
    },
    {
        "name": "Conos de Oblea x50",
        "sku": "CON-OBL-50",
        "category": "Insumos",
        "price": 1200.0,
        "stock": 50,
        "image": None,
    },
    {
        "name": "Coca-Cola 2.25L",
        "sku": "COC-225L",
        "category": "Bebidas",
        "price": 2100.0,
        "stock": 0,
        "image": None,
    },
    {
        "name": "Alfajor Havanna Chocolate",
        "sku": "ALF-HAV-CH",
        "category": "Golosinas",
        "price": 850.0,
        "stock": 100,
        "image": None,
    },
    {
        "name": "Dulce de Leche 5KG",
        "sku": "DDL-5KG",
        "category": "Insumos",
        "price": 18000.0,
        "stock": 3,
        "image": None,
    },
    {
        "name": "Leche Iloly x 1lt",
        "sku": "LEC-ILO-1L",
        "category": "Bebidas",
        "price": 1700.0,
        "stock": 40,
        "image": None,
    },
    {
        "name": "Papas Fritas Lays",
        "sku": "PAP-LAY",
        "category": "Picadas",
        "price": 4000.0,
        "stock": 30,
        "image": None,
    },
    {
        "name": "Sprite x 2 lts",
        "sku": "SPR-2L",
        "category": "Bebidas",
        "price": 3000.0,
        "stock": 25,
        "image": None,
    },
]


def _pick(name: str) -> str | None:
    return f"/assets/products/{name}" if name in ASSET_NAMES else None


# Rebuild samples with image picking after defining helper
def _build_samples() -> list[dict[str, object]]:
    # Map a few to available assets (best-effort)
    picks = {
        "Helado de Vainilla 1KG": _pick("img_021c631cefde.png"),
        "Coca-Cola 2.25L": _pick("img_25b7d6a6ec18.png"),
        "Alfajor Havanna Chocolate": _pick("img_2a97f75c4c23.png"),
        "Leche Iloly x 1lt": _pick("img_48fb0979b0fb.png"),
        "Papas Fritas Lays": _pick("img_64f235632917.png"),
        "Sprite x 2 lts": _pick("img_ff9fd75f4987.png"),
        "Dulce de Leche 5KG": _pick("img_35c12ac20f74.png"),
        "Conos de Oblea x50": _pick("img_1481875b94ba.png"),
    }
    out: list[dict[str, object]] = []
    for s in [
        {
            "name": "Helado de Vainilla 1KG",
            "sku": "HEL-VAN-1KG",
            "category": "Heladería",
            "price": 4500.0,
            "stock": 20,
            "image": picks.get("Helado de Vainilla 1KG"),
        },
        {
            "name": "Conos de Oblea x50",
            "sku": "CON-OBL-50",
            "category": "Insumos",
            "price": 1200.0,
            "stock": 50,
            "image": picks.get("Conos de Oblea x50"),
        },
        {
            "name": "Coca-Cola 2.25L",
            "sku": "COC-225L",
            "category": "Bebidas",
            "price": 2100.0,
            "stock": 0,
            "image": picks.get("Coca-Cola 2.25L"),
        },
        {
            "name": "Alfajor Havanna Chocolate",
            "sku": "ALF-HAV-CH",
            "category": "Golosinas",
            "price": 850.0,
            "stock": 100,
            "image": picks.get("Alfajor Havanna Chocolate"),
        },
        {
            "name": "Dulce de Leche 5KG",
            "sku": "DDL-5KG",
            "category": "Insumos",
            "price": 18000.0,
            "stock": 3,
            "image": picks.get("Dulce de Leche 5KG"),
        },
        {
            "name": "Leche Iloly x 1lt",
            "sku": "LEC-ILO-1L",
            "category": "Bebidas",
            "price": 1700.0,
            "stock": 40,
            "image": picks.get("Leche Iloly x 1lt"),
        },
        {
            "name": "Papas Fritas Lays",
            "sku": "PAP-LAY",
            "category": "Picadas",
            "price": 4000.0,
            "stock": 30,
            "image": picks.get("Papas Fritas Lays"),
        },
        {
            "name": "Sprite x 2 lts",
            "sku": "SPR-2L",
            "category": "Bebidas",
            "price": 3000.0,
            "stock": 25,
            "image": picks.get("Sprite x 2 lts"),
        },
        {
            "name": "Yerba Playadito x kg",
            "sku": "YER-PLA-1K",
            "category": "Bebidas",
            "price": 1200.0,
            "stock": 60,
            "image": _pick("img_fc2731f31997.png"),
        },
    ]:
        out.append(s)
    return out


SAMPLES_LIST = _build_samples()


def seed_data() -> None:
    with SessionLocal() as db:
        # Seed categories
        cat_map: dict[str, Category] = {}
        for c in CATEGORIES:
            exists = db.scalar(select(Category).where(Category.name == c))
            if exists is None:
                exists = Category(name=c)
                db.add(exists)
            cat_map[c] = exists
        db.commit()

        # Seed products
        for s in SAMPLES_LIST:
            cat_name = str(s["category"])
            exists = db.scalar(select(Product).where(Product.sku == s["sku"]))
            if exists is None:
                product = Product(
                    name=str(s["name"]),
                    sku=str(s["sku"]),
                    category_id=cat_map[cat_name].id if cat_name in cat_map else None,
                    price=float(s["price"]),
                    stock=int(s["stock"]),
                    image=s.get("image") if isinstance(s.get("image"), str) else None,
                )
                db.add(product)
        db.commit()
