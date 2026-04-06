export class ApiError extends Error {
  status: number;
  code: string;

  constructor(message: string, status = 500, code = "INTERNAL_ERROR") {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

export const asApiError = (error: unknown): ApiError => {
  if (error instanceof ApiError) {
    return error;
  }

  if (error instanceof Error && error.message === "Invalid JSON body") {
    return new ApiError("Invalid JSON payload", 400, "INVALID_JSON");
  }

  if (error instanceof Error) {
    return new ApiError(error.message, 500, "INTERNAL_ERROR");
  }

  return new ApiError("Unexpected server error", 500, "INTERNAL_ERROR");
};
