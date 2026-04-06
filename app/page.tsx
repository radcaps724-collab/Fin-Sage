"use client";

import { useState } from "react";
import { VoiceButton } from "@/components/VoiceButton";
import {
  sendVoiceText,
  type ParsedTransactionResponse,
} from "@/lib/api";

export default function HomePage() {
  const [recognizedText, setRecognizedText] = useState<string>("");
  const [parsed, setParsed] = useState<ParsedTransactionResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleTranscript = async (text: string) => {
    setRecognizedText(text);
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const response = await sendVoiceText(text);
      setParsed(response);
    } catch (error) {
      setParsed(null);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to parse your voice transaction."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="voice-wrap">
      <div className="panel voice-panel">
        <span className="badge">Voice-first tracking</span>
        <h1 className="section-title" style={{ marginTop: "0.8rem" }}>
          Speak your transaction naturally
        </h1>
        <p className="section-subtitle">
          Example: "Spent 450 rupees on groceries."
        </p>

        <VoiceButton onTranscript={handleTranscript} />

        <div className="recognized-text">
          {recognizedText
            ? `Recognized: "${recognizedText}"`
            : "Tap the mic button and start speaking."}
        </div>

        {isSubmitting && (
          <p className="section-subtitle" style={{ marginTop: "0.8rem" }}>
            Sending transcript to backend...
          </p>
        )}

        {errorMessage && (
          <p
            className="section-subtitle"
            style={{ marginTop: "0.8rem", color: "var(--danger)" }}
          >
            {errorMessage}
          </p>
        )}

        {parsed && (
          <div className="response-grid">
            <article className="stat-card">
              <p>Amount</p>
              <h4>{parsed.amount}</h4>
            </article>
            <article className="stat-card">
              <p>Category</p>
              <h4>{parsed.category}</h4>
            </article>
            <article className="stat-card">
              <p>Type</p>
              <h4 style={{ textTransform: "capitalize" }}>{parsed.type}</h4>
            </article>
          </div>
        )}
      </div>
    </section>
  );
}
