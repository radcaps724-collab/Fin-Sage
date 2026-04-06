"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const morgan_1 = __importDefault(require("morgan"));
const env_1 = __importDefault(require("./config/env"));
const errorMiddleware_1 = require("./middleware/errorMiddleware");
const routes_1 = __importDefault(require("./routes"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)({
    origin: env_1.default.corsOrigin.split(",").map((origin) => origin.trim()),
    credentials: true,
}));
app.use(express_1.default.json({ limit: "1mb" }));
app.use((0, morgan_1.default)(env_1.default.nodeEnv === "production" ? "combined" : "dev"));
app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
});
app.use("/api", routes_1.default);
app.use(errorMiddleware_1.notFound);
app.use(errorMiddleware_1.errorHandler);
exports.default = app;
