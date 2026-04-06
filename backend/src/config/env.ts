import dotenv from "dotenv";

dotenv.config();

interface EnvConfig {
  nodeEnv: string;
  port: number;
  mongoUri: string;
  jwtSecret: string;
  jwtExpiresIn: string;
  corsOrigin: string;
  mlServiceUrl: string;
}

const env: EnvConfig = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT) || 5000,
  mongoUri: process.env.MONGO_URI || "",
  jwtSecret: process.env.JWT_SECRET || "",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:3000",
  mlServiceUrl: process.env.ML_SERVICE_URL || "http://localhost:8000",
};

export default env;
