import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { ApiError, asApiError } from "@/lib/api-errors";
import { parseJsonBody, errorResponse, successResponse } from "@/lib/api-response";
import { AUTH_COOKIE_NAME, signAuthToken } from "@/lib/auth";
import { verifyPassword } from "@/lib/password";
import type { User } from "@/types/models";

const DATABASE_NAME = "finsage";
type UserRecord = Omit<User, "_id"> & { _id: ObjectId };

interface LoginBody {
  email: string;
  password: string;
}

export async function POST(request: Request) {
  try {
    const body = await parseJsonBody<Partial<LoginBody>>(request);
    const { email, password } = body;

    if (
      typeof email !== "string" ||
      !email.trim() ||
      typeof password !== "string" ||
      !password
    ) {
      throw new ApiError("Invalid login payload", 400, "VALIDATION_ERROR");
    }

    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    const normalizedEmail = email.trim().toLowerCase();
    const user = await db.collection<UserRecord>("users").findOne({ email: normalizedEmail });
    if (!user) {
      throw new ApiError("User not found", 400, "USER_NOT_FOUND");
    }

    const hashedPassword = user.password;
    if (typeof hashedPassword !== "string") {
      throw new ApiError("Corrupted user credentials", 500, "USER_DATA_INVALID");
    }

    const isMatch = verifyPassword(password, hashedPassword);
    if (!isMatch) {
      throw new ApiError("Invalid credentials", 400, "INVALID_CREDENTIALS");
    }

    const token = signAuthToken({
      userId: user._id.toHexString(),
      email: user.email,
      name: user.name,
    });

    const response = successResponse({
      user: {
        _id: user._id.toHexString(),
        name: user.name,
        email: user.email,
        onboardingCompleted: Boolean(user.onboardingCompleted),
      },
    });

    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    const apiError = asApiError(error);
    return errorResponse(apiError.message, apiError.code, apiError.status);
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: "",
    path: "/",
    expires: new Date(0),
  });
  return response;
}
