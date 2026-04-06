"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const userController_1 = require("../controllers/userController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const errorMiddleware_1 = require("../middleware/errorMiddleware");
const router = (0, express_1.Router)();
router.get("/profile", authMiddleware_1.protect, userController_1.getProfile);
router.post("/onboarding", [
    authMiddleware_1.protect,
    (0, express_validator_1.body)("name").optional().trim().isLength({ min: 2, max: 80 }),
    (0, express_validator_1.body)("monthlyIncome").optional().isFloat({ min: 0 }),
    (0, express_validator_1.body)("financialGoals").optional().isArray(),
    errorMiddleware_1.validateRequest,
], userController_1.onboarding);
router.post("/voice/process", [authMiddleware_1.protect, (0, express_validator_1.body)("text").isString().trim().isLength({ min: 2 }), errorMiddleware_1.validateRequest], userController_1.parseVoiceText);
exports.default = router;
