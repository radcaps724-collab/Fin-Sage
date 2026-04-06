import clientPromise from "@/lib/mongodb";
import { ApiError, asApiError } from "@/lib/api-errors";
import { parseJsonBody, errorResponse, successResponse } from "@/lib/api-response";
import type { User } from "@/types/models";
import { hashPassword } from "@/lib/password";

interface RegisterBody {
  name: string;
  email: string;
  password: string;
}

const BACKEND_BASE_URL =
  process.env.BACKEND_URL ?? process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:5000";
const DATABASE_NAME = "finsage";

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

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedName = name.trim();
    let backendSynced = false;

    try {
      const upstream = await fetch(`${BACKEND_BASE_URL}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          name: normalizedName,
          email: normalizedEmail,
          password,
          monthlyIncome: 0,
          financialGoals: [],
        }),
      });

      if (!upstream.ok) {
        const payload = (await upstream.json().catch(() => ({ message: "" }))) as {
          message?: string;
        };
        if (upstream.status !== 409) {
          // Keep local registration path available when backend is unavailable.
          backendSynced = false;
        } else {
          throw new ApiError(payload.message || "Email already registered", 409, "DUPLICATE_EMAIL");
        }
      } else {
        backendSynced = true;
      }
    } catch {
      backendSynced = false;
    }

    const createdAt = new Date().toISOString();
    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    const existing = await db.collection<Omit<User, "_id">>("users").findOne({ email: normalizedEmail });
    if (existing) {
      throw new ApiError("Email already registered", 409, "DUPLICATE_EMAIL");
    }

    await db.collection<Omit<User, "_id">>("users").insertOne({
      name: normalizedName,
      email: normalizedEmail,
      password: hashPassword(password),
      createdAt,
    });

    return successResponse({ success: true, backendSynced }, 201);
  } catch (error) {
    const apiError = asApiError(error);
    return errorResponse(apiError.message, apiError.code, apiError.status);
  }
}
