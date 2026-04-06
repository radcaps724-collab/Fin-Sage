import { asApiError } from "@/lib/api-errors";
import { errorResponse, successResponse } from "@/lib/api-response";
import { requireAuthUser } from "@/lib/auth";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import type { User } from "@/types/models";

const DATABASE_NAME = "finsage";
type UserRecord = Omit<User, "_id"> & { _id: ObjectId };

export async function GET(request: Request) {
  try {
    const user = requireAuthUser(request);
    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    const userRecord = await db
      .collection<UserRecord>("users")
      .findOne({ _id: new ObjectId(user.userId) });

    return successResponse({
      userId: user.userId,
      email: userRecord?.email ?? user.email,
      name: userRecord?.name ?? user.name,
      onboardingCompleted: Boolean(userRecord?.onboardingCompleted),
    });
  } catch (error) {
    const apiError = asApiError(error);
    return errorResponse(apiError.message, apiError.code, apiError.status);
  }
}
