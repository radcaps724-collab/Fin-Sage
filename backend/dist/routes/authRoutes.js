"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const authController_1 = require("../controllers/authController");
const errorMiddleware_1 = require("../middleware/errorMiddleware");
const router = (0, express_1.Router)();
router.post("/signup", [
    (0, express_validator_1.body)("name").trim().isLength({ min: 2, max: 80 }),
    (0, express_validator_1.body)("email").isEmail().normalizeEmail(),
    (0, express_validator_1.body)("password").isLength({ min: 8 }),
    (0, express_validator_1.body)("monthlyIncome").isFloat({ min: 0 }),
    (0, express_validator_1.body)("financialGoals").optional().isArray(),
    errorMiddleware_1.validateRequest,
], authController_1.signup);
router.post("/login", [(0, express_validator_1.body)("email").isEmail().normalizeEmail(), (0, express_validator_1.body)("password").notEmpty(), errorMiddleware_1.validateRequest], authController_1.login);
exports.default = router;
