"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const env_1 = __importDefault(require("./env"));
const connectDB = async () => {
    if (!env_1.default.mongoUri) {
        throw new Error("MONGO_URI is not set");
    }
    await mongoose_1.default.connect(env_1.default.mongoUri);
};
exports.default = connectDB;
