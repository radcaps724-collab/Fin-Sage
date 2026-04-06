import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { ApiError, asApiError } from "@/lib/api-errors";
import { errorResponse, parseJsonBody, successResponse } from "@/lib/api-response";
import type { CreateUserInput, User } from "@/types/models";
import { hashPassword } from "@/lib/password";

const DATABASE_NAME = "finsage";
type UserRecord = Omit<User, "_id"> & { _id: ObjectId };

const mapUser = (doc: UserRecord): User => ({
  _id: doc._id.toHexString(),
  name: doc.name,
  email: doc.email,
  createdAt: doc.createdAt,
});

export async function POST(request: Request) {
  try {
    const body = await parseJsonBody<Partial<CreateUserInput>>(request);
    const { name, email, password } = body;

    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof email !== "string" ||
      !email.trim() ||
      typeof password !== "string" ||
      password.length < 6
    ) {
      throw new ApiError("Invalid user payload", 400, "VALIDATION_ERROR");
    }

    const createdAt = new Date().toISOString();
    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    const normalizedEmail = email.trim().toLowerCase();
    const existing = await db
      .collection<UserRecord>("users")
      .findOne({ email: normalizedEmail });
    if (existing) {
      throw new ApiError("Email already registered", 409, "DUPLICATE_EMAIL");
    }

    const payload: Omit<User, "_id"> = {
      name: name.trim(),
      email: normalizedEmail,
      password: hashPassword(password),
      createdAt,
    };

    const insertResult = await db.collection<Omit<User, "_id">>("users").insertOne(payload);
    const insertedDoc = await db
      .collection<UserRecord>("users")
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
