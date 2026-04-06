import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { ApiError, asApiError } from "@/lib/api-errors";
import { errorResponse, parseJsonBody, successResponse } from "@/lib/api-response";
import { requireAuthUser } from "@/lib/auth";
import type {
  OnboardingInput,
  Occupation,
  OverspendArea,
  SpendingStyle,
  User,
} from "@/types/models";

const DATABASE_NAME = "finsage";
type UserRecord = Omit<User, "_id"> & { _id: ObjectId };
type OnboardingRecord = OnboardingInput & {
  userId: string;
  createdAt: string;
  updatedAt: string;
};

const OCCUPATIONS: Occupation[] = [
  "Student",
  "Salaried",
  "Self-employed",
  "Business owner",
];
const SPENDING_STYLES: SpendingStyle[] = ["Careful", "Balanced", "Impulsive"];
const OVERSPEND_AREAS: OverspendArea[] = [
  "Food",
  "Shopping",
  "Entertainment",
  "Transport",
  "Don't know",
];

const isNonNegativeNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value >= 0;

export async function GET(request: Request) {
  try {
    const auth = requireAuthUser(request);
    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);

    const data = await db
      .collection<OnboardingRecord>("onboardingProfiles")
      .findOne({ userId: auth.userId });

    return successResponse({
      completed: Boolean(data),
      profile: data ?? null,
    });
  } catch (error) {
    const apiError = asApiError(error);
    return errorResponse(apiError.message, apiError.code, apiError.status);
  }
}

export async function POST(request: Request) {
  try {
    const auth = requireAuthUser(request);
    const body = await parseJsonBody<Partial<OnboardingInput>>(request);

    const name = body.name;
    const occupation = body.occupation;
    const currency = body.currency;
    const spendingStyle = body.spendingStyle;
    const overspendArea = body.overspendArea;

    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof occupation !== "string" ||
      !occupation.trim() ||
      typeof currency !== "string" ||
      !currency.trim() ||
      typeof spendingStyle !== "string" ||
      !spendingStyle.trim() ||
      typeof overspendArea !== "string" ||
      !overspendArea.trim()
    ) {
      throw new ApiError("Missing required onboarding fields", 400, "VALIDATION_ERROR");
    }

    const age = body.age;
    const dependents = body.dependents;
    const monthlyIncome = body.monthlyIncome;
    const fixedCommitments = body.fixedCommitments;
    const hasMonthlyBudget = body.hasMonthlyBudget;
    const monthlyBudget = body.monthlyBudget;

    if (
      typeof age !== "number" ||
      !Number.isInteger(age) ||
      age < 13 ||
      age > 120 ||
      typeof dependents !== "number" ||
      !Number.isInteger(dependents) ||
      dependents < 0 ||
      !isNonNegativeNumber(monthlyIncome) ||
      !isNonNegativeNumber(fixedCommitments) ||
      typeof hasMonthlyBudget !== "boolean"
    ) {
      throw new ApiError("Invalid onboarding fields", 400, "VALIDATION_ERROR");
    }

    if (!OCCUPATIONS.includes(occupation as Occupation)) {
      throw new ApiError("Unsupported occupation value", 400, "VALIDATION_ERROR");
    }

    if (!SPENDING_STYLES.includes(spendingStyle as SpendingStyle)) {
      throw new ApiError("Unsupported spending style", 400, "VALIDATION_ERROR");
    }

    if (!OVERSPEND_AREAS.includes(overspendArea as OverspendArea)) {
      throw new ApiError("Unsupported overspend area", 400, "VALIDATION_ERROR");
    }

    const normalizedCurrency = currency.trim().toUpperCase();
    if (!/^[A-Z]{3}$/.test(normalizedCurrency)) {
      throw new ApiError("Currency must be a valid 3-letter code", 400, "VALIDATION_ERROR");
    }

    if (
      hasMonthlyBudget &&
      (!isNonNegativeNumber(monthlyBudget) || monthlyBudget === 0)
    ) {
      throw new ApiError("Provide a monthly budget amount", 400, "VALIDATION_ERROR");
    }

    const now = new Date().toISOString();
    const payload: OnboardingRecord = {
      userId: auth.userId,
      name: name.trim(),
      age,
      occupation: occupation as OnboardingInput["occupation"],
      dependents,
      monthlyIncome,
      fixedCommitments,
      currency: normalizedCurrency,
      spendingStyle: spendingStyle as OnboardingInput["spendingStyle"],
      hasMonthlyBudget,
      monthlyBudget: hasMonthlyBudget ? monthlyBudget : undefined,
      overspendArea: overspendArea as OnboardingInput["overspendArea"],
      createdAt: now,
      updatedAt: now,
    };

    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    await db.collection<OnboardingRecord>("onboardingProfiles").updateOne(
      { userId: auth.userId },
      { $set: payload },
      { upsert: true }
    );
    await db
      .collection<UserRecord>("users")
      .updateOne(
        { _id: new ObjectId(auth.userId) },
        {
          $set: {
            name: payload.name,
            onboardingCompleted: true,
          } as Partial<UserRecord>,
        }
      );

    return successResponse({ saved: true });
  } catch (error) {
    const apiError = asApiError(error);
    return errorResponse(apiError.message, apiError.code, apiError.status);
  }
}
