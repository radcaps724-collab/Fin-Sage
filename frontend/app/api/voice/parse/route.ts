import { ApiError, asApiError } from "@/lib/api-errors";
import { errorResponse, parseJsonBody, successResponse } from "@/lib/api-response";

interface VoiceBody {
  text: string;
  source?: "speech" | "manual";
}

interface VoiceParseResponse {
  intent: "log_transaction" | "get_insights" | "unknown" | string;
  message: string;
  transaction: {
    type: "expense" | "income";
    amount: number;
    category: string;
    description: string;
    person?: string | null;
  } | null;
  insight: string | null;
  query?: string | null;
  input_id?: number | null;
  inputId?: number | null;
  source?: "speech" | "manual";
  requires_confirmation?: boolean;
  requiresConfirmation?: boolean;
}

const FASTAPI_BASE_URL =
  process.env.FASTAPI_URL ?? process.env.NEXT_PUBLIC_FASTAPI_URL ?? "http://localhost:8000";

export async function POST(request: Request) {
  try {
    const body = await parseJsonBody<Partial<VoiceBody>>(request);
    const text = body.text;
    if (typeof text !== "string" || !text.trim()) {
      throw new ApiError("Voice text is required", 400, "VALIDATION_ERROR");
    }

    const source = body.source === "manual" ? "manual" : "speech";

    const upstream = await fetch(`${FASTAPI_BASE_URL}/api/process`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ text: text.trim(), source }),
    });

    const payload = (await upstream.json()) as VoiceParseResponse | { message?: string; error?: string };

    if (!upstream.ok) {
      throw new ApiError(
        ("message" in payload && payload.message) ||
          ("error" in payload && payload.error) ||
          "Voice service request failed",
        upstream.status,
        "VOICE_PROXY_ERROR"
      );
    }

    const responsePayload: VoiceParseResponse =
      "intent" in payload && payload.intent === "log_transaction" && payload.transaction
        ? {
            intent: payload.intent,
            message: payload.message,
            transaction: {
              ...payload.transaction,
              date: new Date().toISOString().slice(0, 10),
            },
            insight: payload.insight ?? null,
            query: payload.query ?? null,
            inputId:
              "input_id" in payload && typeof payload.input_id === "number"
                ? payload.input_id
                : "inputId" in payload && typeof payload.inputId === "number"
                  ? payload.inputId
                  : null,
            requiresConfirmation:
              "requires_confirmation" in payload && typeof payload.requires_confirmation === "boolean"
                ? payload.requires_confirmation
                : "requiresConfirmation" in payload && typeof payload.requiresConfirmation === "boolean"
                  ? payload.requiresConfirmation
                  : true,
            source,
          }
        : {
            intent:
              "intent" in payload && typeof payload.intent === "string"
                ? payload.intent
                : "unknown",
            message:
              "message" in payload && typeof payload.message === "string"
                ? payload.message
                : "Voice request completed.",
            transaction: null,
            insight: "insight" in payload && typeof payload.insight === "string" ? payload.insight : null,
            query: "query" in payload && typeof payload.query === "string" ? payload.query : null,
            inputId:
              "input_id" in payload && typeof payload.input_id === "number"
                ? payload.input_id
                : "inputId" in payload && typeof payload.inputId === "number"
                  ? payload.inputId
                  : null,
            requiresConfirmation:
              "requires_confirmation" in payload && typeof payload.requires_confirmation === "boolean"
                ? payload.requires_confirmation
                : "requiresConfirmation" in payload && typeof payload.requiresConfirmation === "boolean"
                  ? payload.requiresConfirmation
                  : false,
            source,
          };

    return successResponse(responsePayload);
  } catch (error) {
    const apiError = asApiError(error);
    return errorResponse(apiError.message, apiError.code, apiError.status);
  }
}
