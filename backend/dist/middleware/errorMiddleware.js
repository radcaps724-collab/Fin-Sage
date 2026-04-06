"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.validateRequest = exports.notFound = void 0;
const express_validator_1 = require("express-validator");
const notFound = (req, _res, next) => {
    const error = new Error(`Route not found: ${req.originalUrl}`);
    error.statusCode = 404;
    next(error);
};
exports.notFound = notFound;
const validateRequest = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        res.status(400).json({
            message: "Validation error",
            errors: errors.array(),
        });
        return;
    }
    next();
};
exports.validateRequest = validateRequest;
const errorHandler = (err, _req, res, next) => {
    const error = err;
    const statusCode = error.statusCode || 500;
    const message = error.message || "Internal server error";
    if (res.headersSent) {
        next(err);
        return;
    }
    res.status(statusCode).json({ message });
};
exports.errorHandler = errorHandler;
