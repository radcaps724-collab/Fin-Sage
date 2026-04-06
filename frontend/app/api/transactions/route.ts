import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { ApiError, asApiError } from "@/lib/api-errors";
import { errorResponse, parseJsonBody, successResponse } from "@/lib/api-response";
import { requireAuthUser } from "@/lib/auth";
import type { CreateTransactionInput, Transaction } from "@/types/models";

const DATABASE_NAME = "finsage";
type TransactionRecord = Omit<Transaction, "_id"> & { _id: ObjectId };

const normalizeCategory = (value: string): string =>
  value
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");

const mapTransaction = (
  doc: TransactionRecord
): Transaction => ({
  ...doc,
  _id: doc._id.toHexString(),
});

export async function POST(request: Request) {
  try {
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
    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);

    const payload: Omit<Transaction, "_id"> = {
      userId: user.userId,
      type,
      amount,
      category: normalizeCategory(category),
      date: new Date(date).toISOString(),
      description: description.trim(),
      createdAt,
    };

    const insertResult = await db.collection<Omit<Transaction, "_id">>("transactions").insertOne(payload);
    const insertedDoc = await db
      .collection<TransactionRecord>("transactions")
      .findOne({ _id: insertResult.insertedId });

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
    const user = requireAuthUser(request);
    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    const url = new URL(request.url);
    const categoryFilter = url.searchParams.get("category")?.trim();
    const dateFilter = url.searchParams.get("date")?.trim();

    const query: Record<string, unknown> = { userId: user.userId };
    if (categoryFilter) {
      query.category = normalizeCategory(categoryFilter);
    }
    if (dateFilter) {
      const start = new Date(`${dateFilter}T00:00:00.000Z`);
      const end = new Date(`${dateFilter}T23:59:59.999Z`);
      if (!Number.isNaN(start.getTime())) {
        query.date = {
          $gte: start.toISOString(),
          $lte: end.toISOString(),
        };
      }
    }

    const docs = await db
      .collection<TransactionRecord>("transactions")
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    return successResponse(docs.map(mapTransaction));
  } catch (error) {
    const apiError = asApiError(error);
    return errorResponse(apiError.message, apiError.code, apiError.status);
  }
}
