import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { ApiError, asApiError } from "@/lib/api-errors";
import { errorResponse, parseJsonBody, successResponse } from "@/lib/api-response";
import type { CreateTransactionInput, Transaction } from "@/types/models";

const DATABASE_NAME = "finsage";

const mapTransaction = (
  doc: Omit<Transaction, "_id"> & { _id: ObjectId }
): Transaction => ({
  ...doc,
  _id: doc._id.toHexString(),
});

export async function POST(request: Request) {
  try {
    const body = await parseJsonBody<Partial<CreateTransactionInput>>(request);
    const { amount, category, type, userId } = body;

    if (
      typeof amount !== "number" ||
      !Number.isFinite(amount) ||
      typeof category !== "string" ||
      !category.trim() ||
      (type !== "income" && type !== "expense") ||
      typeof userId !== "string" ||
      !userId.trim()
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
      userId: userId.trim(),
      amount,
      category: category.trim(),
      type,
      createdAt,
    };

    const insertResult = await db.collection<Omit<Transaction, "_id">>("transactions").insertOne(payload);
    const insertedDoc = await db
      .collection<Omit<Transaction, "_id"> & { _id: ObjectId }>("transactions")
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

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);

    const docs = await db
      .collection<Omit<Transaction, "_id"> & { _id: ObjectId }>("transactions")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    return successResponse(docs.map(mapTransaction));
  } catch (error) {
    const apiError = asApiError(error);
    return errorResponse(apiError.message, apiError.code, apiError.status);
  }
}
