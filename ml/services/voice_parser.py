from utils.constants import EXPENSE_KEYWORDS, INCOME_KEYWORDS, KNOWN_CATEGORIES
from utils.patterns import AMOUNT_PATTERN


def detect_intent(text: str) -> str:
    lowered = text.lower()
    if any(word in lowered for word in EXPENSE_KEYWORDS):
        return "add_expense"
    if any(word in lowered for word in INCOME_KEYWORDS):
        return "add_income"
    return "unknown"


def detect_amount(text: str):
    match = AMOUNT_PATTERN.search(text)
    if not match:
        return None
    value = float(match.group(1))
    if value.is_integer():
        return int(value)
    return value


def detect_category(text: str, intent: str):
    lowered = text.lower()
    for category, keywords in KNOWN_CATEGORIES.items():
        if any(keyword in lowered for keyword in keywords):
            if intent == "add_expense" and category in {"salary", "freelance"}:
                continue
            if intent == "add_income" and category not in {"salary", "freelance"}:
                continue
            return category
    return "other"


def parse_voice_text(text: str) -> dict:
    intent = detect_intent(text)
    amount = detect_amount(text)
    category = detect_category(text, intent)

    return {
        "intent": intent,
        "amount": amount,
        "category": category
    }
