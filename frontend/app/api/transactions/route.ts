import { ApiError, asApiError } from "@/lib/api-errors";
import { errorResponse, parseJsonBody, successResponse } from "@/lib/api-response";
import { requireAuthUser } from "@/lib/auth";
import { getSupabaseServer } from "@/lib/supabase-server";
import type { CreateTransactionInput, Transaction } from "@/types/models";

type SupabaseTransactionRow = {
  id?: string | number;
  _id?: string | number;
  user_id?: string;
  userId?: string;
  type: "income" | "expense";
  amount: number;
  category: string;
  date: string;
  description: string;
  created_at?: string;
  createdAt?: string;
};

const normalizeCategory = (value: string): string =>
  value
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");

const mapTransaction = (row: SupabaseTransactionRow): Transaction => ({
  _id: String(row.id ?? row._id ?? ""),
  userId: row.user_id ?? row.userId ?? "",
  type: row.type,
  amount: row.amount,
  category: row.category,
  date: row.date,
  description: row.description,
  createdAt: row.created_at ?? row.createdAt ?? new Date().toISOString(),
});

export async function POST(request: Request) {
  try {
    const supabaseServer = getSupabaseServer();
    const user = requireAuthUser(request);
    const body = await parseJsonBody<Partial<CreateTransactionInput>>(request);
    const { amount, category, type, date, description } = body;

    if (
      typeof amount !== "number" ||
      !Number.isFinite(amount) ||
      typeof category !== "string" ||
      !category.trim() ||
      (type !== "income" && type !== "expense") ||
      typeof date !== "string" ||
      Number.isNaN(new Date(date).getTime()) ||
      typeof description !== "string" ||
      !description.trim()
    ) {
      throw new ApiError(
        "Invalid transaction payload",
        400,
        "VALIDATION_ERROR"
      );
    }

    const createdAt = new Date().toISOString();

    const payload = {
      user_id: user.userId,
      type,
      amount,
      category: normalizeCategory(category),
      date: new Date(date).toISOString(),
      description: description.trim(),
      created_at: createdAt,
    };

    const { data: insertedDoc, error } = await supabaseServer
      .from("transactions")
      .insert(payload)
      .select("*")
      .single();

    if (error) {
      throw new ApiError(error.message, 500, "SUPABASE_INSERT_FAILED");
    }

    if (!insertedDoc) {
      throw new ApiError(
        "Failed to fetch inserted transaction",
        500,
        "INSERT_FETCH_FAILED"
      );
    }

    return successResponse(mapTransaction(insertedDoc), 201);
  } catch (error) {
    const apiError = asApiError(error);
    return errorResponse(apiError.message, apiError.code, apiError.status);
  }
}

export async function GET(request: Request) {
  try {
    const supabaseServer = getSupabaseServer();
    const user = requireAuthUser(request);
    const url = new URL(request.url);
    const categoryFilter = url.searchParams.get("category")?.trim();
    const dateFilter = url.searchParams.get("date")?.trim();

    let query = supabaseServer
      .from("transactions")
      .select("*")
      .eq("user_id", user.userId)
      .order("created_at", { ascending: false });

    if (categoryFilter) {
      query = query.eq("category", normalizeCategory(categoryFilter));
    }

    if (dateFilter) {
      const start = new Date(`${dateFilter}T00:00:00.000Z`);
      const end = new Date(`${dateFilter}T23:59:59.999Z`);
      if (!Number.isNaN(start.getTime())) {
        query = query.gte("date", start.toISOString()).lte("date", end.toISOString());
      }
    }

    const { data: docs, error } = await query;
    if (error) {
      throw new ApiError(error.message, 500, "SUPABASE_QUERY_FAILED");
    }

    return successResponse((docs ?? []).map((item) => mapTransaction(item as SupabaseTransactionRow)));
  } catch (error) {
    const apiError = asApiError(error);
    return errorResponse(apiError.message, apiError.code, apiError.status);
  }
}
