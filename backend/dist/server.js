"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const db_1 = __importDefault(require("./config/db"));
const env_1 = __importDefault(require("./config/env"));
const startServer = async () => {
    try {
        await (0, db_1.default)();
        app_1.default.listen(env_1.default.port, () => {
            console.log(`Backend running on port ${env_1.default.port}`);
        });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Unknown startup error";
        console.error("Server startup failed:", message);
        process.exit(1);
    }
};
void startServer();
