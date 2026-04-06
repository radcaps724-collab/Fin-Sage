import { ApiError, asApiError } from "@/lib/api-errors";
import { errorResponse, parseJsonBody, successResponse } from "@/lib/api-response";

interface TranscribeBody {
  text: string;
}

export async function POST(request: Request) {
  try {
    const body = await parseJsonBody<Partial<TranscribeBody>>(request);
    const text = body.text;

    if (typeof text !== "string" || !text.trim()) {
      throw new ApiError("Speech text is required", 400, "VALIDATION_ERROR");
    }

    const normalizedText = text.replace(/\s+/g, " ").trim();

    if (normalizedText.length < 2) {
      throw new ApiError("Speech text is too short", 400, "VALIDATION_ERROR");
    }

    return successResponse({
      text: normalizedText,
      source: "browser",
      language: "en-US",
    });
  } catch (error) {
    const apiError = asApiError(error);
    return errorResponse(apiError.message, apiError.code, apiError.status);
  }
}
