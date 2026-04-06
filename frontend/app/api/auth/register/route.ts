import { ApiError, asApiError } from "@/lib/api-errors";
import { parseJsonBody, errorResponse, successResponse } from "@/lib/api-response";

interface RegisterBody {
  name: string;
  email: string;
  password: string;
}

const BACKEND_BASE_URL =
  process.env.BACKEND_URL ?? process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:5000";

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
      password.length < 8
    ) {
      throw new ApiError("Invalid registration payload", 400, "VALIDATION_ERROR");
    }

    let upstream: Response;
    try {
      upstream = await fetch(`${BACKEND_BASE_URL}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          monthlyIncome: 0,
          financialGoals: [],
        }),
      });
    } catch {
      throw new ApiError(
        `Auth backend unavailable at ${BACKEND_BASE_URL}`,
        502,
        "BACKEND_UNAVAILABLE"
      );
    }

    let payload: { message?: string } = {};
    try {
      payload = (await upstream.json()) as { message?: string };
    } catch {
      if (!upstream.ok) {
        throw new ApiError(
          `Auth backend error (${upstream.status})`,
          upstream.status,
          "BACKEND_SIGNUP_FAILED"
        );
      }
    }
    if (!upstream.ok) {
      throw new ApiError(
        payload.message || "Registration failed",
        upstream.status,
        "BACKEND_SIGNUP_FAILED"
      );
    }

    return successResponse({ success: true }, 201);
  } catch (error) {
    const apiError = asApiError(error);
    return errorResponse(apiError.message, apiError.code, apiError.status);
  }
}
