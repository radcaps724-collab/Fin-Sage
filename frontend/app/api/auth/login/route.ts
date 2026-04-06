import { NextResponse } from "next/server";
import { ApiError, asApiError } from "@/lib/api-errors";
import { parseJsonBody, errorResponse, successResponse } from "@/lib/api-response";
import { AUTH_COOKIE_NAME, BACKEND_AUTH_COOKIE_NAME, signAuthToken } from "@/lib/auth";

const BACKEND_BASE_URL =
  process.env.BACKEND_URL ?? process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:5000";

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

    let upstream: Response;
    try {
      upstream = await fetch(`${BACKEND_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });
    } catch {
      throw new ApiError(
        `Auth backend unavailable at ${BACKEND_BASE_URL}`,
        502,
        "BACKEND_UNAVAILABLE"
      );
    }

    let payload: {
      message?: string;
      token?: string;
      user?: { id: string; name: string; email: string };
    } = {};

    try {
      payload = (await upstream.json()) as typeof payload;
    } catch {
      if (!upstream.ok) {
        throw new ApiError(
          `Auth backend error (${upstream.status})`,
          upstream.status,
          "BACKEND_LOGIN_FAILED"
        );
      }
    }

    if (!upstream.ok || !payload.token || !payload.user) {
      throw new ApiError(
        payload.message || "Invalid credentials",
        upstream.status || 401,
        "BACKEND_LOGIN_FAILED"
      );
    }

    const token = signAuthToken({
      userId: payload.user.id,
      email: payload.user.email,
      name: payload.user.name,
    });

    const response = successResponse({
      user: {
        _id: payload.user.id,
        name: payload.user.name,
        email: payload.user.email,
        onboardingCompleted: true,
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

    response.cookies.set({
      name: BACKEND_AUTH_COOKIE_NAME,
      value: payload.token,
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
