"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.protect = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = __importDefault(require("../config/env"));
const User_1 = __importDefault(require("../models/User"));
const isJwtPayload = (value) => typeof value !== "string" && typeof value.userId === "string";
const protect = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res.status(401).json({ message: "Unauthorized: token required" });
        return;
    }
    const token = authHeader.split(" ")[1];
    try {
        const decoded = jsonwebtoken_1.default.verify(token, env_1.default.jwtSecret);
        if (!isJwtPayload(decoded)) {
            res.status(401).json({ message: "Unauthorized: invalid token" });
            return;
        }
        const user = await User_1.default.findById(decoded.userId);
        if (!user) {
            res.status(401).json({ message: "Unauthorized: user not found" });
            return;
        }
        req.user = user;
        next();
    }
    catch {
        res.status(401).json({ message: "Unauthorized: invalid token" });
    }
};
exports.protect = protect;
