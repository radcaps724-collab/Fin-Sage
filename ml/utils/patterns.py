import re

AMOUNT_PATTERN = re.compile(r"(?:rs\.?|inr|₹|\$)?\s*(\d+(?:\.\d{1,2})?)", re.IGNORECASE)
