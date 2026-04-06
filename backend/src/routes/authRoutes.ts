import { Router } from "express";
import { body } from "express-validator";
import { login, signup } from "../controllers/authController";
import { validateRequest } from "../middleware/errorMiddleware";

const router = Router();

router.post(
  "/signup",
  [
    body("name").trim().isLength({ min: 2, max: 80 }),
    body("email").isEmail().normalizeEmail(),
    body("password").isLength({ min: 8 }),
    body("monthlyIncome").isFloat({ min: 0 }),
    body("financialGoals").optional().isArray(),
    validateRequest,
  ],
  signup
);

router.post(
  "/login",
  [body("email").isEmail().normalizeEmail(), body("password").notEmpty(), validateRequest],
  login
);

export default router;
