import type { ErrorRequestHandler, RequestHandler } from "express";
import { validationResult } from "express-validator";

interface HttpError extends Error {
  statusCode?: number;
}

export const notFound: RequestHandler = (req, _res, next) => {
  const error: HttpError = new Error(`Route not found: ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

export const validateRequest: RequestHandler = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    res.status(400).json({
      message: "Validation error",
      errors: errors.array(),
    });
    return;
  }

  next();
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, next) => {
  const error = err as HttpError;
  const statusCode = error.statusCode || 500;
  const message = error.message || "Internal server error";

  if (res.headersSent) {
    next(err);
    return;
  }

  res.status(statusCode).json({ message });
};
