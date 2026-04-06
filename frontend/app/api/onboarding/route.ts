import { ApiError, asApiError } from "@/lib/api-errors";
import { errorResponse, parseJsonBody, successResponse } from "@/lib/api-response";
import { getBackendTokenFromRequest, requireAuthUser } from "@/lib/auth";
import type { OnboardingInput } from "@/types/models";

const BACKEND_BASE_URL =
  process.env.BACKEND_URL ?? process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:5000";

interface BackendProfileResponse {
  user: {
    id: string;
    name: string;
    email: string;
    monthlyIncome?: number;
    financialGoals?: string[];
  };
}

export async function GET(request: Request) {
  try {
    const backendToken = getBackendTokenFromRequest(request);

    const upstream = await fetch(`${BACKEND_BASE_URL}/api/user/profile`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${backendToken}`,
      },
      cache: "no-store",
    });

    const payload = (await upstream.json()) as
      | BackendProfileResponse
      | { message?: string };

    if (!upstream.ok || !("user" in payload)) {
      throw new ApiError(
        ("message" in payload && payload.message) || "Failed to load onboarding status",
        upstream.status,
        "BACKEND_PROFILE_FAILED"
      );
    }

    return successResponse({
      completed: typeof payload.user.monthlyIncome === "number" && payload.user.monthlyIncome > 0,
      profile: null,
    });
  } catch (error) {
    const apiError = asApiError(error);
    return errorResponse(apiError.message, apiError.code, apiError.status);
  }
}

export async function POST(request: Request) {
  try {
    requireAuthUser(request);
    const backendToken = getBackendTokenFromRequest(request);
    const body = await parseJsonBody<Partial<OnboardingInput>>(request);

    const goals = [body.spendingStyle, body.overspendArea]
      .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
      .map((item) => item.trim());

    const upstream = await fetch(`${BACKEND_BASE_URL}/api/user/onboarding`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${backendToken}`,
      },
      body: JSON.stringify({
        name: typeof body.name === "string" ? body.name.trim() : undefined,
        monthlyIncome:
          typeof body.monthlyIncome === "number" && Number.isFinite(body.monthlyIncome)
            ? body.monthlyIncome
            : undefined,
        financialGoals: goals,
      }),
    });

    const payload = (await upstream.json()) as { message?: string };
    if (!upstream.ok) {
      throw new ApiError(
        payload.message || "Failed to save onboarding",
        upstream.status,
        "BACKEND_ONBOARDING_FAILED"
      );
    }

    return successResponse({ saved: true });
  } catch (error) {
    const apiError = asApiError(error);
    return errorResponse(apiError.message, apiError.code, apiError.status);
  }
}
