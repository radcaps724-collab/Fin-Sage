"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseVoiceText = exports.onboarding = exports.getProfile = void 0;
const User_1 = __importDefault(require("../models/User"));
const mlService_1 = require("../services/mlService");
const apiError_1 = __importDefault(require("../utils/apiError"));
const asyncHandler_1 = __importDefault(require("../utils/asyncHandler"));
exports.getProfile = (0, asyncHandler_1.default)(async (req, res) => {
    res.status(200).json({
        user: {
            id: req.user._id.toString(),
            name: req.user.name,
            email: req.user.email,
            monthlyIncome: req.user.monthlyIncome,
            financialGoals: req.user.financialGoals,
        },
    });
});
exports.onboarding = (0, asyncHandler_1.default)(async (req, res) => {
    const { name, monthlyIncome, financialGoals } = req.body;
    const updatePayload = {};
    if (name !== undefined)
        updatePayload.name = name;
    if (monthlyIncome !== undefined)
        updatePayload.monthlyIncome = monthlyIncome;
    if (financialGoals !== undefined)
        updatePayload.financialGoals = financialGoals;
    const updatedUser = await User_1.default.findByIdAndUpdate(req.user._id, updatePayload, {
        new: true,
        runValidators: true,
    });
    if (!updatedUser) {
        throw new apiError_1.default(404, "User not found");
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
});
exports.parseVoiceText = (0, asyncHandler_1.default)(async (req, res) => {
    const parsed = await (0, mlService_1.processVoiceText)(req.body.text);
    res.status(200).json(parsed);
});
