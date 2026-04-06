import type {
  CreateTransactionInput,
  OnboardingInput,
  OnboardingProfile,
  Transaction,
  User,
} from "@/types/models";

export interface AuthUser {
  _id: string;
  name: string;
  email: string;
  onboardingCompleted: boolean;
}

export interface ParsedVoiceTransaction {
  type: "expense" | "income";
  amount: number;
  category: string;
  description: string;
  person?: string | null;
}

export interface VoiceProcessResult {
  intent: "log_transaction" | "get_insights" | "unknown" | string;
  message: string;
  transaction: ParsedVoiceTransaction | null;
  insight: string | null;
  query?: string | null;
  inputId?: number | null;
  source?: "speech" | "manual";
  requiresConfirmation?: boolean;
}

export interface SpeechToTextResult {
  text: string;
  source: "browser";
  language: string;
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
  barSeries: InsightPoint[];
  pieSeries: InsightPoint[];
  suggestions: string[];
}

export interface MeResponse {
  userId: string;
  email: string;
  name: string;
  onboardingCompleted: boolean;
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
const API_BASE = process.env.NEXT_PUBLIC_USE_PROXY === "true" ? "/proxy" : "";

const authHeaders = (): HeadersInit => ({});

async function parseApiResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    const fallbackText = await response.text();
    throw new Error(
      `Unexpected server response: ${fallbackText.slice(0, 120) || "Non-JSON response"}`
    );
  }

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

export async function registerUser(
  name: string,
  email: string,
  password: string
): Promise<{ success: true }> {
  const response = await fetch(`${API_BASE}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ name, email, password }),
  });
  return parseApiResponse<{ success: true }>(response);
}

export async function loginUser(
  email: string,
  password: string
): Promise<{ user: AuthUser }> {
  const response = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, password }),
  });
  return parseApiResponse<{ user: AuthUser }>(response);
}

export async function logoutUser(): Promise<void> {
  await fetch(`${API_BASE}/api/auth/login`, {
    method: "DELETE",
    headers: { Accept: "application/json" },
    credentials: "include",
  });
}

export async function getCurrentUser(): Promise<MeResponse> {
  const response = await fetch(`${API_BASE}/api/auth/me`, {
    method: "GET",
    headers: { Accept: "application/json", ...authHeaders() },
    credentials: "include",
    cache: "no-store",
  });
  return parseApiResponse<MeResponse>(response);
}

export async function getOnboardingStatus(): Promise<{
  completed: boolean;
  profile: OnboardingProfile | null;
}> {
  const response = await fetch(`${API_BASE}/api/onboarding`, {
    method: "GET",
    headers: { Accept: "application/json", ...authHeaders() },
    credentials: "include",
    cache: "no-store",
  });
  return parseApiResponse<{
    completed: boolean;
    profile: OnboardingProfile | null;
  }>(response);
}

export async function submitOnboarding(data: OnboardingInput): Promise<{ saved: true }> {
  const response = await fetch(`${API_BASE}/api/onboarding`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...authHeaders(),
    },
    credentials: "include",
    body: JSON.stringify(data),
  });
  return parseApiResponse<{ saved: true }>(response);
}

export async function sendVoiceText(
  text: string,
  source: "speech" | "manual" = "speech"
): Promise<VoiceProcessResult> {
  const response = await fetch(`${API_BASE}/api/voice/parse`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    credentials: "include",
    body: JSON.stringify({ text, source }),
  });
  return parseApiResponse<VoiceProcessResult>(response);
}

export async function confirmVoiceTransaction(input: {
  inputId: number;
  confirmed?: boolean;
  transaction?: ParsedVoiceTransaction;
}): Promise<{ confirmed: boolean; message: string }> {
  const response = await fetch(`${API_BASE}/api/voice/confirm`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    credentials: "include",
    body: JSON.stringify(input),
  });
  return parseApiResponse<{ confirmed: boolean; message: string }>(response);
}

export async function transcribeVoiceText(text: string): Promise<SpeechToTextResult> {
  const response = await fetch(`${API_BASE}/api/voice/transcribe`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    credentials: "include",
    body: JSON.stringify({ text }),
  });
  return parseApiResponse<SpeechToTextResult>(response);
}

export async function createTransaction(
  data: CreateTransactionInput
): Promise<Transaction> {
  const response = await fetch(`${API_BASE}/api/transactions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...authHeaders(),
    },
    credentials: "include",
    body: JSON.stringify(data),
  });
  return parseApiResponse<Transaction>(response);
}

export async function getTransactions(params?: {
  category?: string;
  date?: string;
}): Promise<Transaction[]> {
  const search = new URLSearchParams();
  if (params?.category) {
    search.set("category", params.category);
  }
  if (params?.date) {
    search.set("date", params.date);
  }
  const suffix = search.toString() ? `?${search.toString()}` : "";

  const response = await fetch(`${API_BASE}/api/transactions${suffix}`, {
    method: "GET",
    headers: { Accept: "application/json", ...authHeaders() },
    credentials: "include",
    cache: "no-store",
  });
  return parseApiResponse<Transaction[]>(response);
}

export async function getInsights(): Promise<InsightSummary> {
  const response = await fetch(`${API_BASE}/api/insights`, {
    method: "GET",
    headers: { Accept: "application/json", ...authHeaders() },
    credentials: "include",
    cache: "no-store",
  });
  return parseApiResponse<InsightSummary>(response);
}

export async function getUsers(): Promise<User[]> {
  const response = await fetch(`${API_BASE}/api/admin/users`, {
    method: "GET",
    headers: { Accept: "application/json", ...authHeaders() },
    credentials: "include",
    cache: "no-store",
  });
  return parseApiResponse<User[]>(response);
}

export async function getAllTransactions(): Promise<Transaction[]> {
  const response = await fetch(`${API_BASE}/api/admin/transactions`, {
    method: "GET",
    headers: { Accept: "application/json", ...authHeaders() },
    credentials: "include",
    cache: "no-store",
  });
  return parseApiResponse<Transaction[]>(response);
}
