"""Shared backend logic for voice assistant and HTTP APIs."""

from __future__ import annotations

import datetime
import json
import os
import re
import urllib.error
import urllib.request
from typing import Any

try:
    import ollama
except Exception:
    ollama = None
from sqlalchemy import Column, DateTime, Float, Integer, String, Text, create_engine, func
from sqlalchemy.orm import declarative_base, sessionmaker

OLLAMA_MODEL = "mistral"
ANTHROPIC_MODEL = os.getenv("ANTHROPIC_MODEL", "claude-3-5-haiku-latest")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "finance.db")

engine = create_engine(f"sqlite:///{DB_PATH}", echo=False)
Base = declarative_base()
Session = sessionmaker(bind=engine)


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True)
    date = Column(DateTime, default=datetime.datetime.utcnow)
    tx_type = Column(String(20))
    amount = Column(Float)
    category = Column(String(50))
    description = Column(Text)
    person = Column(String(100))


class InputEvent(Base):
    __tablename__ = "input_events"

    id = Column(Integer, primary_key=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    confirmed_at = Column(DateTime, nullable=True)
    source = Column(String(20), nullable=False)
    status = Column(String(20), nullable=False, default="parsed")
    raw_text = Column(Text, nullable=False)
    normalized_text = Column(Text, nullable=False)
    parser = Column(String(20), nullable=False)
    interpreted_intent = Column(String(40), nullable=True)
    parsed_payload = Column(Text, nullable=True)
    result_message = Column(Text, nullable=True)


Base.metadata.create_all(engine)


def _ensure_transactions_schema() -> None:
    with engine.begin() as connection:
        rows = connection.exec_driver_sql("PRAGMA table_info(transactions)").fetchall()
        column_names = {row[1] for row in rows}
        if "person" not in column_names:
            connection.exec_driver_sql("ALTER TABLE transactions ADD COLUMN person TEXT")


def _ensure_input_events_schema() -> None:
    with engine.begin() as connection:
        rows = connection.exec_driver_sql("PRAGMA table_info(input_events)").fetchall()
        if not rows:
            return
        column_names = {row[1] for row in rows}
        if "confirmed_at" not in column_names:
            connection.exec_driver_sql("ALTER TABLE input_events ADD COLUMN confirmed_at DATETIME")
        if "status" not in column_names:
            connection.exec_driver_sql("ALTER TABLE input_events ADD COLUMN status TEXT DEFAULT 'parsed'")


_ensure_transactions_schema()
_ensure_input_events_schema()

SYSTEM_PROMPT = """You are a personal finance assistant for an Indian user. Currency = Indian Rupees (Rs).

CATEGORIES: Food, Transport, Rent, Salary, Investments, Gold, Entertainment, Utilities, Shopping, Medical, Other

Return ONE valid JSON object. No markdown, no explanation, pure JSON only.
If a person's name is mentioned (e.g. "paid Rahul 500"), capture it in the "person" field.

Examples:

User: "spent 250 on lunch today"
{"intent":"log_transaction","transaction":{"type":"expense","amount":250,"category":"Food","description":"lunch","person":null},"query":null}

User: "paid Rahul 500 for transport"
{"intent":"log_transaction","transaction":{"type":"expense","amount":500,"category":"Transport","description":"paid Rahul","person":"Rahul"},"query":null}

User: "received 5000 from Priya"
{"intent":"log_transaction","transaction":{"type":"income","amount":5000,"category":"Other","description":"received from Priya","person":"Priya"},"query":null}

User: "got salary of 50000"
{"intent":"log_transaction","transaction":{"type":"income","amount":50000,"category":"Salary","description":"monthly salary","person":null},"query":null}

User: "paid 1200 electricity bill"
{"intent":"log_transaction","transaction":{"type":"expense","amount":1200,"category":"Utilities","description":"electricity bill","person":null},"query":null}

User: "how much did I spend this month"
{"intent":"get_insights","transaction":null,"query":"monthly spending summary"}

User: "what are my top expenses"
{"intent":"get_insights","transaction":null,"query":"top expense categories"}

User: "how much did I pay Rahul"
{"intent":"get_insights","transaction":null,"query":"person:Rahul"}

If unclear: {"intent":"unknown","transaction":null,"query":null}"""


def parse_with_llm(text: str) -> tuple[dict[str, Any], str]:
    anthropic_result = _parse_with_anthropic(text)
    if anthropic_result is not None:
        return anthropic_result, "anthropic"

    if ollama is None:
        return _fallback_parse(text), "fallback"

    try:
        resp = ollama.chat(
            model=OLLAMA_MODEL,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": text},
            ],
            options={"temperature": 0, "num_predict": 200},
        )
        content = resp["message"]["content"].strip()
        match = re.search(r"\{.*\}", content, re.DOTALL)
        if match:
            return json.loads(match.group()), "ollama"
    except Exception:
        return _fallback_parse(text), "fallback"
    return {"intent": "unknown", "transaction": None, "query": None}, "fallback"


def _parse_with_anthropic(text: str) -> dict[str, Any] | None:
    if not ANTHROPIC_API_KEY:
        return None

    body = {
        "model": ANTHROPIC_MODEL,
        "max_tokens": 300,
        "temperature": 0,
        "system": SYSTEM_PROMPT,
        "messages": [{"role": "user", "content": text}],
    }

    request = urllib.request.Request(
        "https://api.anthropic.com/v1/messages",
        data=json.dumps(body).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "x-api-key": ANTHROPIC_API_KEY,
            "anthropic-version": "2023-06-01",
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(request, timeout=20) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except (TimeoutError, urllib.error.URLError, urllib.error.HTTPError, json.JSONDecodeError):
        return None

    content = payload.get("content", [])
    text_parts: list[str] = []
    if isinstance(content, list):
        for part in content:
            if isinstance(part, dict) and part.get("type") == "text":
                text_value = part.get("text")
                if isinstance(text_value, str):
                    text_parts.append(text_value)

    raw_text = "\n".join(text_parts).strip()
    if not raw_text:
        return None

    match = re.search(r"\{.*\}", raw_text, re.DOTALL)
    if not match:
        return None

    try:
        parsed = json.loads(match.group())
    except json.JSONDecodeError:
        return None

    if not isinstance(parsed, dict):
        return None

    return parsed


def _fallback_parse(text: str) -> dict[str, Any]:
    lowered = text.lower()

    if any(word in lowered for word in ("how much", "top", "spending", "insight", "week", "month")):
        query = "monthly spending summary"
        if "top" in lowered:
            query = "top expense categories"
        if "week" in lowered:
            query = "last week"
        return {"intent": "get_insights", "transaction": None, "query": query}

    amount_match = re.search(r"(\d+(?:\.\d+)?)", lowered)
    if amount_match and any(word in lowered for word in ("spent", "spend", "paid", "bought", "received", "salary", "income", "earned")):
        amount = float(amount_match.group(1))
        tx_type = "income" if any(word in lowered for word in ("received", "salary", "income", "earned")) else "expense"
        category = "Salary" if "salary" in lowered else ("Food" if "food" in lowered or "lunch" in lowered else "Other")
        return {
            "intent": "log_transaction",
            "transaction": {
                "type": tx_type,
                "amount": amount,
                "category": category,
                "description": text.strip(),
                "person": None,
            },
            "query": None,
        }

    return {"intent": "unknown", "transaction": None, "query": None}


def _record_input_event(source: str, raw_text: str, normalized_text: str) -> int:
    session = Session()
    try:
        item = InputEvent(
            source=source,
            status="parsed",
            raw_text=raw_text,
            normalized_text=normalized_text,
            parser="pending",
        )
        session.add(item)
        session.commit()
        session.refresh(item)
        return int(item.id)
    finally:
        session.close()


def _update_input_event(
    event_id: int,
    *,
    parser: str,
    intent: str,
    parsed_payload: dict[str, Any],
    result_message: str,
) -> None:
    session = Session()
    try:
        item = session.get(InputEvent, event_id)
        if not item:
            return
        item.parser = parser
        item.interpreted_intent = intent
        item.parsed_payload = json.dumps(parsed_payload, ensure_ascii=False)
        item.result_message = result_message
        session.commit()
    finally:
        session.close()


def confirm_input_event(
    input_id: int,
    confirmed: bool,
    transaction: dict[str, Any] | None = None,
) -> dict[str, Any]:
    session = Session()
    try:
        item = session.get(InputEvent, input_id)
        if not item:
            return {"confirmed": False, "message": "Input event not found."}

        if not confirmed:
            item.status = "rejected"
            item.confirmed_at = datetime.datetime.utcnow()
            session.commit()
            return {"confirmed": False, "message": "Transaction discarded by user."}

        tx_payload: dict[str, Any]
        if isinstance(transaction, dict):
            tx_payload = transaction
        elif item.parsed_payload:
            try:
                parsed = json.loads(item.parsed_payload)
                tx_payload = parsed.get("transaction") if isinstance(parsed, dict) else None
            except json.JSONDecodeError:
                tx_payload = None  # type: ignore[assignment]
        else:
            tx_payload = None  # type: ignore[assignment]

        if not isinstance(tx_payload, dict):
            return {"confirmed": False, "message": "No transaction found to confirm."}

        log_transaction(tx_payload)
        item.status = "confirmed"
        item.confirmed_at = datetime.datetime.utcnow()
        item.result_message = "Transaction confirmed and saved."
        session.commit()
        return {"confirmed": True, "message": "Transaction confirmed and saved."}
    finally:
        session.close()


def log_transaction(tx: dict[str, Any]) -> None:
    session = Session()
    try:
        session.add(
            Transaction(
                tx_type=tx["type"],
                amount=float(tx["amount"]),
                category=tx["category"],
                description=tx.get("description", ""),
                person=tx.get("person") or None,
            )
        )
        session.commit()
    finally:
        session.close()


def monthly_summary() -> str:
    session = Session()
    try:
        now = datetime.datetime.utcnow()
        start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        txns = session.query(Transaction).filter(Transaction.date >= start).all()
    finally:
        session.close()

    if not txns:
        return "No transactions recorded this month yet."

    exp = sum(t.amount for t in txns if t.tx_type == "expense")
    inc = sum(t.amount for t in txns if t.tx_type == "income")
    cats: dict[str, float] = {}
    for txn in txns:
        if txn.tx_type == "expense":
            cats[txn.category] = cats.get(txn.category, 0) + txn.amount
    top = sorted(cats.items(), key=lambda item: item[1], reverse=True)[:3]
    top_str = ", ".join(f"{cat} Rs {amt:.0f}" for cat, amt in top) or "none"
    return (
        f"This month: income Rs {inc:.0f}, expenses Rs {exp:.0f}, "
        f"balance Rs {inc - exp:.0f}. Top spending: {top_str}."
    )


def weekly_summary() -> str:
    session = Session()
    try:
        week_ago = datetime.datetime.utcnow() - datetime.timedelta(days=7)
        txns = session.query(Transaction).filter(Transaction.date >= week_ago).all()
    finally:
        session.close()

    if not txns:
        return "No transactions in the last 7 days."

    exp = sum(t.amount for t in txns if t.tx_type == "expense")
    inc = sum(t.amount for t in txns if t.tx_type == "income")
    return f"Last 7 days: income Rs {inc:.0f}, expenses Rs {exp:.0f}."


def top_categories() -> str:
    session = Session()
    try:
        now = datetime.datetime.utcnow()
        start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        rows = (
            session.query(Transaction.category, func.sum(Transaction.amount).label("total"))
            .filter(Transaction.date >= start, Transaction.tx_type == "expense")
            .group_by(Transaction.category)
            .order_by(func.sum(Transaction.amount).desc())
            .limit(5)
            .all()
        )
    finally:
        session.close()

    if not rows:
        return "No expenses this month."
    return "Top categories this month: " + ", ".join(
        f"{row.category} Rs {row.total:.0f}" for row in rows
    ) + "."


def person_summary(name: str) -> str:
    session = Session()
    try:
        txns = session.query(Transaction).filter(Transaction.person.ilike(f"%{name}%")).all()
    finally:
        session.close()

    if not txns:
        return f"No transactions found involving {name}."
    total = sum(t.amount for t in txns)
    count = len(txns)
    return f"Found {count} transactions involving {name}, totalling Rs {total:.0f}."


def get_insights(query: str | None) -> str:
    q = (query or "").lower()
    if q.startswith("person:"):
        return person_summary(q.split("person:", 1)[1].strip())
    if any(word in q for word in ("week", "7 day", "last week")):
        return weekly_summary()
    if any(word in q for word in ("top", "most", "highest", "category")):
        return top_categories()
    return monthly_summary()


def process_text(text: str, source: str = "speech") -> dict[str, Any]:
    normalized_text = text.strip()
    safe_source = source if source in {"speech", "manual"} else "manual"
    input_id = _record_input_event(safe_source, text, normalized_text)

    parsed, parser_used = parse_with_llm(normalized_text)
    intent = parsed.get("intent", "unknown")

    if intent == "log_transaction" and parsed.get("transaction"):
        tx = parsed["transaction"]
        result = {
            "intent": "log_transaction",
            "message": "Transaction parsed. Please confirm to save.",
            "transaction": tx,
            "insight": None,
            "input_id": input_id,
            "requires_confirmation": True,
        }
        _update_input_event(
            input_id,
            parser=parser_used,
            intent="log_transaction",
            parsed_payload=parsed,
            result_message=result["message"],
        )
        return result

    if intent == "get_insights":
        summary = get_insights(parsed.get("query"))
        result = {
            "intent": "get_insights",
            "message": summary,
            "transaction": None,
            "insight": summary,
            "input_id": input_id,
            "requires_confirmation": False,
        }
        _update_input_event(
            input_id,
            parser=parser_used,
            intent="get_insights",
            parsed_payload=parsed,
            result_message=summary,
        )
        return result

    result = {
        "intent": "unknown",
        "message": "Could not understand request. Try logging an expense or asking for insights.",
        "transaction": None,
        "insight": None,
        "input_id": input_id,
        "requires_confirmation": False,
    }
    _update_input_event(
        input_id,
        parser=parser_used,
        intent="unknown",
        parsed_payload=parsed,
        result_message=result["message"],
    )
    return result


def list_transactions(limit: int = 20) -> list[dict[str, Any]]:
    safe_limit = min(max(limit, 1), 200)
    session = Session()
    try:
        rows = session.query(Transaction).order_by(Transaction.date.desc()).limit(safe_limit).all()
    finally:
        session.close()

    return [
        {
            "id": row.id,
            "date": row.date.isoformat() if row.date else None,
            "type": row.tx_type,
            "amount": row.amount,
            "category": row.category,
            "description": row.description,
            "person": row.person,
        }
        for row in rows
    ]
