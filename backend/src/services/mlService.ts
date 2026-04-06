import axios from "axios";
import env from "../config/env";
import ApiError from "../utils/apiError";
import type { MlVoiceResponse } from "../types";

const mlClient = axios.create({
  baseURL: env.mlServiceUrl,
  timeout: 5000,
});

export const processVoiceText = async (text: string): Promise<MlVoiceResponse> => {
  try {
    const response = await mlClient.post<MlVoiceResponse>("/process-voice", { text });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw new ApiError(
        502,
        `ML service error: ${error.response.status} ${error.response.statusText}`
      );
    }

    throw new ApiError(502, "ML service unavailable");
  }
};
