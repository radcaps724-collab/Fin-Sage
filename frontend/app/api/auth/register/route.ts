import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { ApiError, asApiError } from "@/lib/api-errors";
import { parseJsonBody, errorResponse, successResponse } from "@/lib/api-response";
import { hashPassword } from "@/lib/password";
import type { User } from "@/types/models";

const DATABASE_NAME = "finsage";
type UserRecord = Omit<User, "_id"> & { _id: ObjectId };

interface RegisterBody {
  name: string;
  email: string;
  password: string;
}

export async function POST(request: Request) {
  try {
    const body = await parseJsonBody<Partial<RegisterBody>>(request);
    const { name, email, password } = body;

    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof email !== "string" ||
      !email.trim() ||
      typeof password !== "string" ||
      password.length < 6
    ) {
      throw new ApiError("Invalid registration payload", 400, "VALIDATION_ERROR");
    }

    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await db
      .collection<UserRecord>("users")
      .findOne({ email: normalizedEmail });
    if (existingUser) {
      throw new ApiError("Email already registered", 409, "DUPLICATE_EMAIL");
    }

    const createdAt = new Date().toISOString();
    await db.collection<Omit<User, "_id">>("users").insertOne({
      name: name.trim(),
      email: normalizedEmail,
      password: hashPassword(password),
      onboardingCompleted: false,
      createdAt,
    });

    return successResponse({ success: true }, 201);
  } catch (error) {
    const apiError = asApiError(error);
    return errorResponse(apiError.message, apiError.code, apiError.status);
  }
}
