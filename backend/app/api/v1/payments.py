from uuid import uuid4

import httpx
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from app.core.config import settings

router = APIRouter(prefix="/payments", tags=["payments"])

MP_API_URL = "https://api.mercadopago.com"


class PreferenceCreate(BaseModel):
    amount: float = Field(gt=0)
    description: str = "Venta 24Sie7e"
    external_reference: str | None = None


class PreferenceRead(BaseModel):
    preference_id: str
    init_point: str
    external_reference: str


class PaymentStatusRead(BaseModel):
    status: str
    payment_id: int | None = None


def _headers() -> dict[str, str]:
    if not settings.mp_access_token:
        raise HTTPException(
            status_code=503,
            detail="MP_ACCESS_TOKEN no configurado en el backend",
        )
    return {
        "Authorization": f"Bearer {settings.mp_access_token}",
        "Content-Type": "application/json",
    }


def _init_point(data: dict) -> str | None:
    if settings.mp_environment == "sandbox":
        return data.get("sandbox_init_point") or data.get("init_point")
    return data.get("init_point") or data.get("sandbox_init_point")


@router.post("/mp/preference", response_model=PreferenceRead)
async def create_mp_preference(payload: PreferenceCreate) -> PreferenceRead:
    reference = payload.external_reference or f"poc-{uuid4().hex}"

    body: dict = {
        "items": [
            {
                "title": payload.description,
                "quantity": 1,
                "currency_id": settings.mp_currency,
                "unit_price": round(float(payload.amount), 2),
            }
        ],
        "external_reference": reference,
    }
    if settings.mp_notification_url:
        body["notification_url"] = settings.mp_notification_url

    async with httpx.AsyncClient(timeout=15) as client:
        response = await client.post(
            f"{MP_API_URL}/checkout/preferences",
            headers=_headers(),
            json=body,
        )

    if response.status_code >= 400:
        raise HTTPException(
            status_code=502,
            detail=f"Error de Mercado Pago: {response.text}",
        )

    data = response.json()
    init_point = _init_point(data)
    if not init_point:
        raise HTTPException(
            status_code=502,
            detail="Mercado Pago no devolvió un init_point",
        )

    return PreferenceRead(
        preference_id=str(data.get("id", "")),
        init_point=init_point,
        external_reference=reference,
    )


@router.get("/mp/status", response_model=PaymentStatusRead)
async def get_mp_status(reference: str = Query(..., min_length=1)) -> PaymentStatusRead:
    async with httpx.AsyncClient(timeout=15) as client:
        response = await client.get(
            f"{MP_API_URL}/v1/payments/search",
            headers=_headers(),
            params={
                "external_reference": reference,
                "sort": "date_created",
                "criteria": "desc",
            },
        )

    if response.status_code >= 400:
        raise HTTPException(
            status_code=502,
            detail=f"Error de Mercado Pago: {response.text}",
        )

    results = response.json().get("results") or []
    if not results:
        return PaymentStatusRead(status="pending")

    payment = results[0]
    return PaymentStatusRead(
        status=str(payment.get("status", "pending")),
        payment_id=payment.get("id"),
    )
