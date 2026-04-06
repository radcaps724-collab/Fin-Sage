"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = exports.signup = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const User_1 = __importDefault(require("../models/User"));
const apiError_1 = __importDefault(require("../utils/apiError"));
const asyncHandler_1 = __importDefault(require("../utils/asyncHandler"));
const generateToken_1 = __importDefault(require("../utils/generateToken"));
const sanitizeUser = (user) => ({
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    monthlyIncome: user.monthlyIncome,
    financialGoals: user.financialGoals,
});
exports.signup = (0, asyncHandler_1.default)(async (req, res) => {
    const { name, email, password, monthlyIncome, financialGoals } = req.body;
    const existingUser = await User_1.default.findOne({ email });
    if (existingUser) {
        throw new apiError_1.default(409, "Email already in use");
    }
    const hashedPassword = await bcryptjs_1.default.hash(password, 12);
    const user = await User_1.default.create({
        name,
        email,
        password: hashedPassword,
        monthlyIncome,
        financialGoals: Array.isArray(financialGoals) ? financialGoals : [],
    });
    const token = (0, generateToken_1.default)({ userId: user._id.toString() });
    res.status(201).json({
        message: "User created successfully",
        token,
        user: sanitizeUser(user),
    });
});
exports.login = (0, asyncHandler_1.default)(async (req, res) => {
    const { email, password } = req.body;
    const user = await User_1.default.findOne({ email }).select("+password");
    if (!user) {
        throw new apiError_1.default(401, "Invalid email or password");
    }
    const isMatch = await bcryptjs_1.default.compare(password, user.password);
    if (!isMatch) {
        throw new apiError_1.default(401, "Invalid email or password");
    }
    const token = (0, generateToken_1.default)({ userId: user._id.toString() });
    res.status(200).json({
        message: "Login successful",
        token,
        user: sanitizeUser(user),
    });
});
