import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { ApiError, asApiError } from "@/lib/api-errors";
import { errorResponse, parseJsonBody, successResponse } from "@/lib/api-response";
import type { CreateUserInput, User } from "@/types/models";

const DATABASE_NAME = "finsage";

const mapUser = (doc: Omit<User, "_id"> & { _id: ObjectId }): User => ({
  ...doc,
  _id: doc._id.toHexString(),
});

export async function POST(request: Request) {
  try {
    const body = await parseJsonBody<Partial<CreateUserInput>>(request);
    const { name, email } = body;

    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof email !== "string" ||
      !email.trim()
    ) {
      throw new ApiError("Invalid user payload", 400, "VALIDATION_ERROR");
    }

    const createdAt = new Date().toISOString();
    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);

    const payload: Omit<User, "_id"> = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      createdAt,
    };

    const insertResult = await db.collection<Omit<User, "_id">>("users").insertOne(payload);
    const insertedDoc = await db
      .collection<Omit<User, "_id"> & { _id: ObjectId }>("users")
      .findOne({ _id: insertResult.insertedId });

    if (!insertedDoc) {
      throw new ApiError(
        "Failed to fetch inserted user",
        500,
        "INSERT_FETCH_FAILED"
      );
    }

    return successResponse(mapUser(insertedDoc), 201);
  } catch (error) {
    const apiError = asApiError(error);
    return errorResponse(apiError.message, apiError.code, apiError.status);
  }
}
