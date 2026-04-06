from datetime import date, timedelta
from typing import Literal

from fastapi import FastAPI
from pydantic import BaseModel, Field

app = FastAPI(title="Fin-Sage FastAPI Service", version="1.0.0")


class VoiceInput(BaseModel):
    text: str = Field(..., min_length=2)


class Transaction(BaseModel):
    type: Literal["expense", "income"]
    amount: float
    category: str
    date: str
    description: str


class VoiceOutput(BaseModel):
    transaction: Transaction
    insight: str


CATEGORY_KEYWORDS: list[tuple[str, list[str]]] = [
    (
        "Food",
        [
            "food",
            "lunch",
            "dinner",
            "breakfast",
            "restaurant",
            "cafe",
            "groceries",
        ],
    ),
    (
        "Transport",
        ["travel", "trip", "flight", "train", "taxi", "uber", "bus", "metro", "fuel"],
    ),
    (
        "Shopping",
        ["shopping", "shoes", "clothes", "mall", "amazon", "flipkart"],
    ),
    ("Bills", ["bill", "electricity", "water", "internet", "rent", "gas"]),
    ("Health", ["hospital", "medicine", "doctor", "pharmacy", "health"]),
    ("Entertainment", ["movie", "netflix", "spotify", "game", "concert"]),
    ("Salary", ["salary", "bonus", "payout", "credited"]),
]


def resolve_type(text: str) -> Literal["expense", "income"]:
    lower = text.lower()
    income_tokens = ["received", "earned", "salary", "income", "got", "credited", "bonus"]
    if any(token in lower for token in income_tokens):
        return "income"
    return "expense"


def resolve_category(text: str) -> str:
    lower = text.lower()
    for category, keywords in CATEGORY_KEYWORDS:
        if any(keyword in lower for keyword in keywords):
            return category
    return "Other"


def resolve_amount(text: str) -> float:
    number_chars: list[str] = []
    seen_digit = False
    for char in text:
        if char.isdigit() or (char in [",", "."] and seen_digit):
            number_chars.append(char)
            if char.isdigit():
                seen_digit = True
        elif seen_digit:
            break

    if not number_chars:
        raise ValueError("Unable to detect transaction amount")

    cleaned = "".join(number_chars).replace(",", "")
    return float(cleaned)


def resolve_date(text: str) -> str:
    lower = text.lower()
    value = date.today()
    if "yesterday" in lower:
        value = value - timedelta(days=1)
    elif "tomorrow" in lower:
        value = value + timedelta(days=1)
    return value.isoformat()


def create_insight(category: str, tx_type: Literal["expense", "income"], amount: float) -> str:
    if tx_type == "expense" and amount > 5000:
        return "This is a high-value expense. Tag it now and review if it was planned or emotional."
    if category == "Shopping" and tx_type == "expense":
        return "Shopping tends to snowball. A category cap will make your insights much sharper."
    if category == "Food" and tx_type == "expense":
        return "Food spend can creep up quietly. Compare dine-out spend against your weekly target."
    if tx_type == "income":
        return "Great income entry. Move a fixed share to savings before the next expense cycle starts."
    return "Saved consistently, this category will become one of your clearest monthly spending signals."


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/process-voice", response_model=VoiceOutput)
def process_voice(payload: VoiceInput) -> VoiceOutput:
    cleaned = payload.text.strip()
    tx_type = resolve_type(cleaned)
    amount = resolve_amount(cleaned)
    category = resolve_category(cleaned)
    tx_date = resolve_date(cleaned)

    return VoiceOutput(
        transaction=Transaction(
            type=tx_type,
            amount=amount,
            category=category,
            date=tx_date,
            description=cleaned,
        ),
        insight=create_insight(category, tx_type, amount),
    )
