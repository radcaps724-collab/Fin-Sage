"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const asyncHandler = (fn) => {
    return (req, res, next) => {
        void Promise.resolve(fn(req, res, next)).catch(next);
    };
};
exports.default = asyncHandler;
