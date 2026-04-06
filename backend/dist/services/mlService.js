"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processVoiceText = void 0;
const axios_1 = __importDefault(require("axios"));
const env_1 = __importDefault(require("../config/env"));
const apiError_1 = __importDefault(require("../utils/apiError"));
const mlClient = axios_1.default.create({
    baseURL: env_1.default.mlServiceUrl,
    timeout: 5000,
});
const processVoiceText = async (text) => {
    try {
        const response = await mlClient.post("/process-voice", { text });
        return response.data;
    }
    catch (error) {
        if (axios_1.default.isAxiosError(error) && error.response) {
            throw new apiError_1.default(502, `ML service error: ${error.response.status} ${error.response.statusText}`);
        }
        throw new apiError_1.default(502, "ML service unavailable");
    }
};
exports.processVoiceText = processVoiceText;
