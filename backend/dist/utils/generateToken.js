"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = __importDefault(require("../config/env"));
const generateToken = (payload) => {
    if (!env_1.default.jwtSecret) {
        throw new Error("JWT_SECRET is not set");
    }
    const options = {
        expiresIn: env_1.default.jwtExpiresIn,
    };
    return jsonwebtoken_1.default.sign(payload, env_1.default.jwtSecret, {
        ...options,
    });
};
exports.default = generateToken;
