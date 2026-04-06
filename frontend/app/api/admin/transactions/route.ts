import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { asApiError } from "@/lib/api-errors";
import { errorResponse, successResponse } from "@/lib/api-response";
import type { Transaction } from "@/types/models";

const DATABASE_NAME = "finsage";
type TransactionRecord = Omit<Transaction, "_id"> & { _id: ObjectId };

const mapTransaction = (
  doc: TransactionRecord
): Transaction => ({
  ...doc,
  _id: doc._id.toHexString(),
});

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);

    const docs = await db
      .collection<TransactionRecord>("transactions")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    return successResponse(docs.map(mapTransaction));
  } catch (error) {
    const apiError = asApiError(error);
    return errorResponse(apiError.message, apiError.code, apiError.status);
  }
}
