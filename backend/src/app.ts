import cors from "cors";
import express from "express";
import morgan from "morgan";
import env from "./config/env";
import { errorHandler, notFound } from "./middleware/errorMiddleware";
import apiRoutes from "./routes";

const app = express();

app.use(
  cors({
    origin: env.corsOrigin.split(",").map((origin) => origin.trim()),
    credentials: true,
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(morgan(env.nodeEnv === "production" ? "combined" : "dev"));

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api", apiRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
