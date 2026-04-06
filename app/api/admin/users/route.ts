import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { asApiError } from "@/lib/api-errors";
import { errorResponse, successResponse } from "@/lib/api-response";
import type { User } from "@/types/models";

const DATABASE_NAME = "finsage";

const mapUser = (doc: Omit<User, "_id"> & { _id: ObjectId }): User => ({
  ...doc,
  _id: doc._id.toHexString(),
});

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);

    const docs = await db
      .collection<Omit<User, "_id"> & { _id: ObjectId }>("users")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    return successResponse(docs.map(mapUser));
  } catch (error) {
    const apiError = asApiError(error);
    return errorResponse(apiError.message, apiError.code, apiError.status);
  }
}
