import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { ApiError, asApiError } from "@/lib/api-errors";
import { parseJsonBody, errorResponse, successResponse } from "@/lib/api-response";
import { AUTH_COOKIE_NAME, BACKEND_AUTH_COOKIE_NAME, signAuthToken } from "@/lib/auth";
import { verifyPassword } from "@/lib/password";
import type { User } from "@/types/models";

const BACKEND_BASE_URL =
  process.env.BACKEND_URL ?? process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:5000";
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

    let payload: {
      message?: string;
      token?: string;
      user?: { id: string; name: string; email: string };
    } = {};
    let backendAvailable = false;

    try {
      const upstream = await fetch(`${BACKEND_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });

      if (upstream.ok) {
        payload = (await upstream.json()) as typeof payload;
        backendAvailable = Boolean(payload.token && payload.user);
      } else {
        backendAvailable = false;
      }
    } catch {
      backendAvailable = false;
    }

    if (!backendAvailable) {
      const client = await clientPromise;
      const db = client.db(DATABASE_NAME);
      const user = await db
        .collection<UserRecord>("users")
        .findOne({ email: email.trim().toLowerCase() });

      if (!user || typeof user.password !== "string" || !verifyPassword(password, user.password)) {
        throw new ApiError("Invalid credentials", 401, "BACKEND_LOGIN_FAILED");
      }

      payload = {
        user: {
          id: user._id.toHexString(),
          name: user.name,
          email: user.email,
        },
      };
    }

    const token = signAuthToken({
      userId: payload.user!.id,
      email: payload.user!.email,
      name: payload.user!.name,
      backendToken: payload.token,
    });

    const response = successResponse({
      user: {
        _id: payload.user!.id,
        name: payload.user!.name,
        email: payload.user!.email,
        onboardingCompleted: false,
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

    if (payload.token) {
      response.cookies.set({
        name: BACKEND_AUTH_COOKIE_NAME,
        value: payload.token,
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });
    }

    return response;
  } catch (error) {
    const apiError = asApiError(error);
    return errorResponse(apiError.message, apiError.code, apiError.status);
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.set({
    name: BACKEND_AUTH_COOKIE_NAME,
    value: "",
    path: "/",
    expires: new Date(0),
  });
  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: "",
    path: "/",
    expires: new Date(0),
  });
  return response;
}
