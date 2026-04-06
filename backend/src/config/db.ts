import mongoose from "mongoose";
import env from "./env";

const connectDB = async (): Promise<void> => {
  if (!env.mongoUri) {
    throw new Error("MONGO_URI is not set");
  }

  await mongoose.connect(env.mongoUri);
};

export default connectDB;
