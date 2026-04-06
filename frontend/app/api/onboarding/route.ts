import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { asApiError } from "@/lib/api-errors";
import { errorResponse, parseJsonBody, successResponse } from "@/lib/api-response";
import { getBackendTokenFromRequest, requireAuthUser } from "@/lib/auth";
import type { OnboardingInput, OnboardingProfile } from "@/types/models";

const BACKEND_BASE_URL =
  process.env.BACKEND_URL ?? process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:5000";
const DATABASE_NAME = "finsage";

type OnboardingRecord = OnboardingProfile & { _id: ObjectId };

const mapOnboarding = (doc: OnboardingRecord): OnboardingProfile => ({
  userId: doc.userId,
  name: doc.name,
  age: doc.age,
  occupation: doc.occupation,
  dependents: doc.dependents,
  monthlyIncome: doc.monthlyIncome,
  fixedCommitments: doc.fixedCommitments,
  currency: doc.currency,
  spendingStyle: doc.spendingStyle,
  hasMonthlyBudget: doc.hasMonthlyBudget,
  monthlyBudget: doc.monthlyBudget,
  overspendArea: doc.overspendArea,
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt,
});

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
    const user = requireAuthUser(request);
    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    const localProfile = await db
      .collection<OnboardingRecord>("onboardingProfiles")
      .findOne({ userId: user.userId });

    let backendCompleted = false;
    let backendName: string | undefined;
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
        backendCompleted =
          typeof payload.user.monthlyIncome === "number" && payload.user.monthlyIncome > 0;
        backendName = payload.user.name;
      }
    } catch {
      // Fall back to local onboarding profile when backend token is unavailable.
    }

    const profile = localProfile ? mapOnboarding(localProfile) : null;

    return successResponse({
      completed: Boolean(profile) || backendCompleted,
      profile:
        profile ??
        (backendName
          ? {
              userId: user.userId,
              name: backendName,
              age: 22,
              occupation: "Student",
              dependents: 0,
              monthlyIncome: 0,
              fixedCommitments: 0,
              currency: "INR",
              spendingStyle: "Balanced",
              hasMonthlyBudget: false,
              monthlyBudget: undefined,
              overspendArea: "Don't know",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }
          : null),
    });
  } catch (error) {
    const apiError = asApiError(error);
    return errorResponse(apiError.message, apiError.code, apiError.status);
  }
}

export async function POST(request: Request) {
  try {
    const user = requireAuthUser(request);
    const body = await parseJsonBody<Partial<OnboardingInput>>(request);

    const now = new Date().toISOString();
    const profile: OnboardingProfile = {
      userId: user.userId,
      name: typeof body.name === "string" ? body.name.trim() : user.name,
      age: typeof body.age === "number" && Number.isFinite(body.age) ? Math.max(body.age, 13) : 22,
      occupation:
        body.occupation === "Student" ||
        body.occupation === "Salaried" ||
        body.occupation === "Self-employed" ||
        body.occupation === "Business owner"
          ? body.occupation
          : "Student",
      dependents:
        typeof body.dependents === "number" && Number.isFinite(body.dependents)
          ? Math.max(0, body.dependents)
          : 0,
      monthlyIncome:
        typeof body.monthlyIncome === "number" && Number.isFinite(body.monthlyIncome)
          ? Math.max(0, body.monthlyIncome)
          : 0,
      fixedCommitments:
        typeof body.fixedCommitments === "number" && Number.isFinite(body.fixedCommitments)
          ? Math.max(0, body.fixedCommitments)
          : 0,
      currency: typeof body.currency === "string" && body.currency.trim().length === 3
        ? body.currency.trim().toUpperCase()
        : "INR",
      spendingStyle:
        body.spendingStyle === "Careful" ||
        body.spendingStyle === "Balanced" ||
        body.spendingStyle === "Impulsive"
          ? body.spendingStyle
          : "Balanced",
      hasMonthlyBudget: Boolean(body.hasMonthlyBudget),
      monthlyBudget:
        typeof body.monthlyBudget === "number" && Number.isFinite(body.monthlyBudget)
          ? Math.max(0, body.monthlyBudget)
          : undefined,
      overspendArea:
        body.overspendArea === "Food" ||
        body.overspendArea === "Shopping" ||
        body.overspendArea === "Entertainment" ||
        body.overspendArea === "Transport" ||
        body.overspendArea === "Don't know"
          ? body.overspendArea
          : "Don't know",
      createdAt: now,
      updatedAt: now,
    };

    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    const existing = await db
      .collection<OnboardingRecord>("onboardingProfiles")
      .findOne({ userId: user.userId });

    await db.collection<OnboardingProfile>("onboardingProfiles").updateOne(
      { userId: user.userId },
      {
        $set: {
          ...profile,
          createdAt: existing?.createdAt ?? now,
          updatedAt: now,
        },
      },
      { upsert: true }
    );

    const goals = [body.spendingStyle, body.overspendArea]
      .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
      .map((item) => item.trim());

    let backendSynced = false;
    try {
      const backendToken = getBackendTokenFromRequest(request);
      const upstream = await fetch(`${BACKEND_BASE_URL}/api/user/onboarding`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${backendToken}`,
        },
        body: JSON.stringify({
          name: profile.name,
          monthlyIncome: profile.monthlyIncome,
          financialGoals: goals,
        }),
      });
      backendSynced = upstream.ok;
    } catch {
      backendSynced = false;
    }

    return successResponse({ saved: true, backendSynced });
  } catch (error) {
    const apiError = asApiError(error);
    return errorResponse(apiError.message, apiError.code, apiError.status);
  }
}
