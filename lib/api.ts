export const BASE_URL = process.env.NEXT_PUBLIC_API_URL;
import type {
  CreateTransactionInput,
  Transaction,
  User,
} from "@/types/models";

export interface ParsedTransactionResponse {
  amount: number;
  category: string;
  type: "income" | "expense";
}

export interface VoiceTextRequest {
  text: string;
}

export interface InsightPoint {
  label: string;
  value: number;
}

export interface InsightSummary {
  totalIncome: number;
  totalExpenses: number;
  savingsRate: number;
  topCategory: string;
  spendingSeries: InsightPoint[];
}

export type { User, Transaction };

interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

interface ApiErrorResponse {
  success: false;
  error: string | { message: string; code?: string };
}

type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

const getApiUrl = (path: string): string => {
  if (!BASE_URL) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured");
  }
  return `${BASE_URL}${path}`;
};

async function parseApiResponse<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as ApiResponse<T>;

  if (!response.ok || !payload.success) {
    const errorMessage =
      "error" in payload
        ? typeof payload.error === "string"
          ? payload.error
          : payload.error.message
        : `Request failed (${response.status})`;
    throw new Error(errorMessage);
  }

  return payload.data;
}

export async function sendVoiceText(
  text: string
): Promise<ParsedTransactionResponse> {
  const payload: VoiceTextRequest = { text };
  const response = await fetch(getApiUrl("/voice/parse"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Voice parse failed (${response.status})`);
  }

  return (await response.json()) as ParsedTransactionResponse;
}

export async function getInsights(): Promise<InsightSummary> {
  const response = await fetch(getApiUrl("/insights"), {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Insights fetch failed (${response.status})`);
  }

  return (await response.json()) as InsightSummary;
}

export async function getUsers(): Promise<User[]> {
  const response = await fetch(getApiUrl("/api/admin/users"), {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
  });

  return parseApiResponse<User[]>(response);
}

export async function getAllTransactions(): Promise<Transaction[]> {
  const response = await fetch(getApiUrl("/api/admin/transactions"), {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
  });

  return parseApiResponse<Transaction[]>(response);
}

export async function createUser(name: string, email: string): Promise<User> {
  const response = await fetch(getApiUrl("/api/users"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ name, email }),
  });

  return parseApiResponse<User>(response);
}

export async function createTransaction(
  data: CreateTransactionInput
): Promise<Transaction> {
  const response = await fetch(getApiUrl("/api/transactions"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(data),
  });

  return parseApiResponse<Transaction>(response);
}

export async function getTransactions(): Promise<Transaction[]> {
  const response = await fetch(getApiUrl("/api/transactions"), {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
  });

  return parseApiResponse<Transaction[]>(response);
}

export async function getAdminTransactions(): Promise<Transaction[]> {
  return getAllTransactions();
}
