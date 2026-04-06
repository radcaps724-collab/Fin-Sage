import type { Request } from "express";
import type { UserDocument } from "../models/User";

export interface AppJwtPayload {
  userId: string;
  iat?: number;
  exp?: number;
}

export interface AuthenticatedRequest extends Request {
  user: UserDocument;
}

export interface SignupBody {
  name: string;
  email: string;
  password: string;
  monthlyIncome: number;
  financialGoals?: string[];
}

export interface LoginBody {
  email: string;
  password: string;
}

export interface OnboardingBody {
  name?: string;
  monthlyIncome?: number;
  financialGoals?: string[];
}

export interface VoiceProcessBody {
  text: string;
}

export interface MlVoiceResponse {
  [key: string]: unknown;
}
