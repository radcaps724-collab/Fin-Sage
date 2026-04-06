import { createHmac, timingSafeEqual } from "crypto";
import { ApiError } from "@/lib/api-errors";

export const AUTH_COOKIE_NAME = "token";

interface AuthTokenPayload {
  userId: string;
  email: string;
  name: string;
  exp: number;
}

const getSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new ApiError("Missing JWT_SECRET configuration", 500, "CONFIG_ERROR");
  }
  return secret;
};

const base64UrlEncode = (value: string): string =>
  Buffer.from(value)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

const base64UrlDecode = (value: string): string => {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "===".slice((normalized.length + 3) % 4);
  return Buffer.from(padded, "base64").toString("utf8");
};

const sign = (value: string): string =>
  createHmac("sha256", getSecret())
    .update(value)
    .digest("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

export const signAuthToken = (payload: {
  userId: string;
  email: string;
  name: string;
}): string => {
  const header = base64UrlEncode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7;
  const body = base64UrlEncode(JSON.stringify({ ...payload, exp }));
  const message = `${header}.${body}`;
  const signature = sign(message);
  return `${message}.${signature}`;
};

export const verifyAuthToken = (token: string): AuthTokenPayload => {
  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new ApiError("Invalid token format", 401, "AUTH_INVALID_TOKEN");
  }

  const [header, body, signature] = parts;
  const expectedSignature = sign(`${header}.${body}`);
  const sigA = Buffer.from(signature);
  const sigB = Buffer.from(expectedSignature);

  if (sigA.length !== sigB.length || !timingSafeEqual(sigA, sigB)) {
    throw new ApiError("Invalid token signature", 401, "AUTH_INVALID_TOKEN");
  }

  const payload = JSON.parse(base64UrlDecode(body)) as AuthTokenPayload;
  if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) {
    throw new ApiError("Token expired", 401, "AUTH_TOKEN_EXPIRED");
  }

  if (!payload.userId || !payload.email || !payload.name) {
    throw new ApiError("Invalid token payload", 401, "AUTH_INVALID_TOKEN");
  }

  return payload;
};

export const getTokenFromRequest = (request: Request): string => {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const tokenCookie = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${AUTH_COOKIE_NAME}=`));

  if (tokenCookie) {
    return tokenCookie.replace(`${AUTH_COOKIE_NAME}=`, "");
  }

  throw new ApiError("Authentication required", 401, "AUTH_REQUIRED");
};

export const requireAuthUser = (request: Request): AuthTokenPayload =>
  verifyAuthToken(getTokenFromRequest(request));
