import jwt, { type SignOptions } from "jsonwebtoken";
import env from "../config/env";
import type { AppJwtPayload } from "../types";

const generateToken = (payload: AppJwtPayload): string => {
  if (!env.jwtSecret) {
    throw new Error("JWT_SECRET is not set");
  }

  const options: SignOptions = {
    expiresIn: env.jwtExpiresIn as SignOptions["expiresIn"],
  };

  return jwt.sign(payload, env.jwtSecret, {
    ...options,
  });
};

export default generateToken;
