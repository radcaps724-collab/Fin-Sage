"use client";

import { useEffect, useRef, useState } from "react";
import { transcribeVoiceText } from "@/lib/api";
import styles from "@/styles/components/VoiceButton.module.css";

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionStatic;
    webkitSpeechRecognition?: SpeechRecognitionStatic;
  }
}

interface VoiceRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface VoiceRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognitionInstance {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: VoiceRecognitionEvent) => void) | null;
  onerror: ((event: VoiceRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

interface SpeechRecognitionStatic {
  new (): SpeechRecognitionInstance;
}

export interface VoiceButtonProps {
  onTranscript: (text: string) => void;
  onLiveTranscript?: (text: string) => void;
  onError?: (message: string) => void;
  floating?: boolean;
}

export function VoiceButton({
  onTranscript,
  onLiveTranscript,
  onError,
  floating = false,
}: VoiceButtonProps) {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const onTranscriptRef = useRef(onTranscript);
  const onLiveTranscriptRef = useRef(onLiveTranscript);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onTranscriptRef.current = onTranscript;
    onLiveTranscriptRef.current = onLiveTranscript;
    onErrorRef.current = onError;
  }, [onError, onLiveTranscript, onTranscript]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const SpeechRecognitionCtor =
      window.SpeechRecognition ?? window.webkitSpeechRecognition;

    setIsSupported(Boolean(SpeechRecognitionCtor));

    if (!SpeechRecognitionCtor) {
      return;
    }

    const recognition = new SpeechRecognitionCtor();
    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onresult = async (event) => {
      const liveTranscript = Array.from(event.results)
        .map((result) => result[0]?.transcript ?? "")
        .join(" ")
        .trim();
      onLiveTranscriptRef.current?.(liveTranscript);

      const finalTranscript = Array.from(event.results)
        .filter((result) => result.isFinal)
        .map((result) => result[0]?.transcript ?? "")
        .join(" ")
        .trim();

      if (finalTranscript) {
        setIsProcessing(true);
        try {
          const transcribed = await transcribeVoiceText(finalTranscript);
          onTranscriptRef.current(transcribed.text);
        } catch (error) {
          onTranscriptRef.current(finalTranscript);
          onErrorRef.current?.(
            error instanceof Error
              ? error.message
              : "Could not normalize speech input. Using raw transcript."
          );
        } finally {
          setIsProcessing(false);
        }
      }
    };

    recognition.onerror = () => {
      setIsListening(false);
      setIsProcessing(false);
      onErrorRef.current?.("Speech recognition failed. Please try again.");
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
      recognitionRef.current = null;
    };
  }, []);

  const handleClick = () => {
    const recognition = recognitionRef.current;
    if (!recognition) {
      return;
    }

    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      try {
        recognition.start();
        setIsListening(true);
      } catch {
        // Some browsers throw if start() is called while already active.
        setIsListening(false);
        onErrorRef.current?.("Microphone could not be started. Check mic permissions.");
      }
    }
  };

  if (!isSupported) {
    return (
      <div className={styles.unsupported}>
        Speech recognition is not supported in this browser.
      </div>
    );
  }

  return (
    <button
      type="button"
      className={`${styles.button} ${floating ? styles.floating : ""} ${isListening || isProcessing ? styles.listening : ""}`}
      aria-label={isListening ? "Stop listening" : isProcessing ? "Processing speech" : "Start listening"}
      onClick={handleClick}
      disabled={isProcessing}
    >
      <span className={styles.label}>{isListening ? "Stop" : isProcessing ? "Processing" : "Talk"}</span>
    </button>
  );
}
