import { ApiError, asApiError } from "@/lib/api-errors";
import { errorResponse, parseJsonBody, successResponse } from "@/lib/api-response";

interface ConfirmBody {
  inputId: number;
  confirmed?: boolean;
  transaction?: {
    type: "expense" | "income";
    amount: number;
    category: string;
    description: string;
    person?: string | null;
  };
}

const FASTAPI_BASE_URL =
  process.env.FASTAPI_URL ?? process.env.NEXT_PUBLIC_FASTAPI_URL ?? "http://localhost:8000";

export async function POST(request: Request) {
  try {
    const body = await parseJsonBody<Partial<ConfirmBody>>(request);
    const inputId = body.inputId;
    if (typeof inputId !== "number" || !Number.isFinite(inputId)) {
      throw new ApiError("inputId is required", 400, "VALIDATION_ERROR");
    }

    const upstream = await fetch(`${FASTAPI_BASE_URL}/api/process/confirm`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        input_id: inputId,
        confirmed: body.confirmed !== false,
        transaction: body.transaction,
      }),
    });

    const payload = (await upstream.json()) as { confirmed?: boolean; message?: string };
    if (!upstream.ok) {
      throw new ApiError(payload.message || "Confirmation failed", upstream.status, "VOICE_CONFIRM_ERROR");
    }

    return successResponse({
      confirmed: Boolean(payload.confirmed),
      message: payload.message ?? "Confirmation completed.",
    });
  } catch (error) {
    const apiError = asApiError(error);
    return errorResponse(apiError.message, apiError.code, apiError.status);
  }
}