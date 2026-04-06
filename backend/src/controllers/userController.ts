import type { Response } from "express";
import User from "../models/User";
import { processVoiceText } from "../services/mlService";
import type { AuthenticatedRequest, OnboardingBody, VoiceProcessBody } from "../types";
import ApiError from "../utils/apiError";
import asyncHandler from "../utils/asyncHandler";

export const getProfile = asyncHandler<AuthenticatedRequest>(
  async (req, res: Response) => {
    res.status(200).json({
      user: {
        id: req.user._id.toString(),
        name: req.user.name,
        email: req.user.email,
        monthlyIncome: req.user.monthlyIncome,
        financialGoals: req.user.financialGoals,
      },
    });
  }
);

export const onboarding = asyncHandler<AuthenticatedRequest & { body: OnboardingBody }>(
  async (req, res: Response) => {
    const { name, monthlyIncome, financialGoals } = req.body;

    const updatePayload: Partial<OnboardingBody> = {};

    if (name !== undefined) updatePayload.name = name;
    if (monthlyIncome !== undefined) updatePayload.monthlyIncome = monthlyIncome;
    if (financialGoals !== undefined) updatePayload.financialGoals = financialGoals;

    const updatedUser = await User.findByIdAndUpdate(req.user._id, updatePayload, {
      new: true,
      runValidators: true,
    });

    if (!updatedUser) {
      throw new ApiError(404, "User not found");
    }

    res.status(200).json({
      message: "Onboarding data updated",
      user: {
        id: updatedUser._id.toString(),
        name: updatedUser.name,
        email: updatedUser.email,
        monthlyIncome: updatedUser.monthlyIncome,
        financialGoals: updatedUser.financialGoals,
      },
    });
  }
);

export const parseVoiceText = asyncHandler<AuthenticatedRequest & { body: VoiceProcessBody }>(
  async (req, res: Response) => {
    const parsed = await processVoiceText(req.body.text);
    res.status(200).json(parsed);
  }
);
