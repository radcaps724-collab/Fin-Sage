import { NextResponse } from "next/server";

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    message: string;
    code: string;
  };
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export function successResponse<T>(data: T, status = 200) {
  return NextResponse.json<ApiSuccessResponse<T>>(
    {
      success: true,
      data,
    },
    { status }
  );
}

export function errorResponse(
  message: string,
  code = "INTERNAL_ERROR",
  status = 500
) {
  return NextResponse.json<ApiErrorResponse>(
    {
      success: false,
      error: {
        message,
        code,
      },
    },
    { status }
  );
}

export async function parseJsonBody<T>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    throw new Error("Invalid JSON body");
  }
}
