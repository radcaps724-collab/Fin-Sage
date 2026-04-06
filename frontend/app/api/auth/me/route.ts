import clientPromise from "@/lib/mongodb";
import { asApiError } from "@/lib/api-errors";
import { errorResponse, successResponse } from "@/lib/api-response";
import { getBackendTokenFromRequest, requireAuthUser } from "@/lib/auth";

const BACKEND_BASE_URL =
  process.env.BACKEND_URL ?? process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:5000";
const DATABASE_NAME = "finsage";

interface BackendProfileResponse {
  user: {
    id: string;
    email: string;
    name: string;
    monthlyIncome?: number;
  };
}

export async function GET(request: Request) {
  try {
    const localUser = requireAuthUser(request);
    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    const localOnboarding = await db
      .collection<{ userId: string }>("onboardingProfiles")
      .findOne({ userId: localUser.userId });

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

      if (upstream.ok && "user" in payload) {
        return successResponse({
          userId: payload.user.id || localUser.userId,
          email: payload.user.email || localUser.email,
          name: payload.user.name || localUser.name,
          onboardingCompleted:
            typeof payload.user.monthlyIncome === "number" || Boolean(localOnboarding),
        });
      }
    } catch {
      // Fall back to local session/profile below
    }

    return successResponse({
      userId: localUser.userId,
      email: localUser.email,
      name: localUser.name,
      onboardingCompleted: Boolean(localOnboarding),
    });
  } catch (error) {
    const apiError = asApiError(error);
    return errorResponse(apiError.message, apiError.code, apiError.status);
  }
}
