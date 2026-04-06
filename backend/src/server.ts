import app from "./app";
import connectDB from "./config/db";
import env from "./config/env";

const startServer = async (): Promise<void> => {
  try {
    await connectDB();
    app.listen(env.port, () => {
      console.log(`Backend running on port ${env.port}`);
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown startup error";
    console.error("Server startup failed:", message);
    process.exit(1);
  }
};

void startServer();
