import { ApiError, asApiError } from "@/lib/api-errors";
import { errorResponse, parseJsonBody, successResponse } from "@/lib/api-response";
import { requireAuthUser } from "@/lib/auth";

type TransactionType = "expense" | "income";

const CATEGORY_KEYWORDS: Array<{ category: string; keywords: string[] }> = [
  {
    category: "Food",
    keywords: ["food", "lunch", "dinner", "breakfast", "restaurant", "cafe", "groceries"],
  },
  {
    category: "Transport",
    keywords: ["travel", "trip", "flight", "train", "taxi", "uber", "bus", "metro", "fuel"],
  },
  {
    category: "Shopping",
    keywords: ["shopping", "shoes", "clothes", "mall", "amazon", "flipkart"],
  },
  {
    category: "Bills",
    keywords: ["bill", "electricity", "water", "internet", "rent", "gas"],
  },
  {
    category: "Health",
    keywords: ["hospital", "medicine", "doctor", "pharmacy", "health"],
  },
  {
    category: "Entertainment",
    keywords: ["movie", "netflix", "spotify", "game", "concert"],
  },
  {
    category: "Salary",
    keywords: ["salary", "bonus", "payout", "credited"],
  },
];

const resolveType = (text: string): TransactionType => {
  const lower = text.toLowerCase();
  if (/\b(received|earned|salary|income|got|credited|bonus)\b/.test(lower)) {
    return "income";
  }
  return "expense";
};

const resolveCategory = (text: string): string => {
  const lower = text.toLowerCase();
  const match = CATEGORY_KEYWORDS.find((entry) =>
    entry.keywords.some((keyword) => lower.includes(keyword))
  );
  return match?.category ?? "Other";
};

const resolveAmount = (text: string): number => {
  const amountMatch = text.match(/(\d[\d,]*(?:\.\d{1,2})?)/);
  if (!amountMatch) {
    throw new ApiError("Unable to detect transaction amount", 400, "PARSE_AMOUNT");
  }
  return Number(amountMatch[1].replace(/,/g, ""));
};

const resolveDate = (text: string): string => {
  const lower = text.toLowerCase();
  const today = new Date();
  if (lower.includes("yesterday")) {
    today.setDate(today.getDate() - 1);
  } else if (lower.includes("tomorrow")) {
    today.setDate(today.getDate() + 1);
  }
  return today.toISOString().slice(0, 10);
};

const createInsight = (category: string, type: TransactionType, amount: number): string => {
  if (type === "expense" && amount > 5000) {
    return "This is a high-value expense. Tag it now and review if it was planned or emotional.";
  }
  if (category === "Shopping" && type === "expense") {
    return "Shopping tends to snowball. A category cap will make your insights much sharper.";
  }
  if (category === "Food" && type === "expense") {
    return "Food spend can creep up quietly. Compare dine-out spend against your weekly target.";
  }
  if (type === "income") {
    return "Great income entry. Move a fixed share to savings before the next expense cycle starts.";
  }
  return "Saved consistently, this category will become one of your clearest monthly spending signals.";
};

interface VoiceBody {
  text: string;
}

export async function POST(request: Request) {
  try {
    requireAuthUser(request);
    const body = await parseJsonBody<Partial<VoiceBody>>(request);
    const text = body.text;
    if (typeof text !== "string" || !text.trim()) {
      throw new ApiError("Voice text is required", 400, "VALIDATION_ERROR");
    }

    const cleaned = text.trim();
    const type = resolveType(cleaned);
    const amount = resolveAmount(cleaned);
    const category = resolveCategory(cleaned);
    const date = resolveDate(cleaned);
    const description = cleaned;

    return successResponse({
      transaction: { type, amount, category, date, description },
      insight: createInsight(category, type, amount),
    });
  } catch (error) {
    const apiError = asApiError(error);
    return errorResponse(apiError.message, apiError.code, apiError.status);
  }
}
