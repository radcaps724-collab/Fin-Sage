import { Router } from "express";
import { body } from "express-validator";
import { getProfile, onboarding, parseVoiceText } from "../controllers/userController";
import { protect } from "../middleware/authMiddleware";
import { validateRequest } from "../middleware/errorMiddleware";

const router = Router();

router.get("/profile", protect, getProfile);

router.post(
  "/onboarding",
  [
    protect,
    body("name").optional().trim().isLength({ min: 2, max: 80 }),
    body("monthlyIncome").optional().isFloat({ min: 0 }),
    body("financialGoals").optional().isArray(),
    validateRequest,
  ],
  onboarding
);

router.post(
  "/voice/process",
  [protect, body("text").isString().trim().isLength({ min: 2 }), validateRequest],
  parseVoiceText
);

export default router;
