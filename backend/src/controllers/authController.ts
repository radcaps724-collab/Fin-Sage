import bcrypt from "bcryptjs";
import type { Request, Response } from "express";
import User, { type UserDocument } from "../models/User";
import type { LoginBody, SignupBody } from "../types";
import ApiError from "../utils/apiError";
import asyncHandler from "../utils/asyncHandler";
import generateToken from "../utils/generateToken";

const sanitizeUser = (user: UserDocument) => ({
  id: user._id.toString(),
  name: user.name,
  email: user.email,
  monthlyIncome: user.monthlyIncome,
  financialGoals: user.financialGoals,
});

export const signup = asyncHandler<Request<Record<string, never>, unknown, SignupBody>>(
  async (req, res: Response) => {
    const { name, email, password, monthlyIncome, financialGoals } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new ApiError(409, "Email already in use");
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      monthlyIncome,
      financialGoals: Array.isArray(financialGoals) ? financialGoals : [],
    });

    const token = generateToken({ userId: user._id.toString() });

    res.status(201).json({
      message: "User created successfully",
      token,
      user: sanitizeUser(user),
    });
  }
);

export const login = asyncHandler<Request<Record<string, never>, unknown, LoginBody>>(
  async (req, res: Response) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      throw new ApiError(401, "Invalid email or password");
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new ApiError(401, "Invalid email or password");
    }

    const token = generateToken({ userId: user._id.toString() });

    res.status(200).json({
      message: "Login successful",
      token,
      user: sanitizeUser(user),
    });
  }
);
