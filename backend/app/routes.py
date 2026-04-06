from __future__ import annotations

from typing import Literal

from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.core_logic import confirm_input_event, get_insights, list_transactions, process_text

router = APIRouter()


class ProcessRequest(BaseModel):
	text: str = Field(..., min_length=1)
	source: Literal["speech", "manual"] = "speech"


class ProcessResponse(BaseModel):
	intent: str
	message: str
	transaction: dict | None = None
	insight: str | None = None
	input_id: int | None = None
	requires_confirmation: bool = False


class ConfirmRequest(BaseModel):
	input_id: int
	confirmed: bool = True
	transaction: dict | None = None


@router.post("/process", response_model=ProcessResponse)
async def process(payload: ProcessRequest) -> ProcessResponse:
    result = process_text(payload.text, source=payload.source)
    return ProcessResponse(**result)


@router.post("/process/confirm")
async def confirm_process(payload: ConfirmRequest) -> dict:
	return confirm_input_event(
		payload.input_id,
		payload.confirmed,
		payload.transaction,
	)


@router.get("/insights")
async def insights(query: str = "monthly spending summary") -> dict:
	return {"query": query, "summary": get_insights(query)}


@router.get("/transactions")
async def transactions(limit: int = 20) -> dict:
	items = list_transactions(limit=limit)
	return {"count": len(items), "items": items}

