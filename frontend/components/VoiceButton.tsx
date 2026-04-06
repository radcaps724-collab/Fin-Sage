"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
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
  floating?: boolean;
}

export function VoiceButton({
  onTranscript,
  onLiveTranscript,
  floating = false,
}: VoiceButtonProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported] = useState(
    () =>
      typeof window === "undefined" ||
      Boolean(window.SpeechRecognition ?? window.webkitSpeechRecognition)
  );
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const handleTranscript = useEffectEvent(onTranscript);
  const handleLiveTranscript = useEffectEvent((text: string) => {
    onLiveTranscript?.(text);
  });

  useEffect(() => {
    const SpeechRecognitionCtor =
      window.SpeechRecognition ?? window.webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) {
      return;
    }

    const recognition = new SpeechRecognitionCtor();
    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onresult = (event) => {
      const liveTranscript = Array.from(event.results)
        .map((result) => result[0]?.transcript ?? "")
        .join(" ")
        .trim();
      handleLiveTranscript(liveTranscript);

      const finalTranscript = Array.from(event.results)
        .filter((result) => result.isFinal)
        .map((result) => result[0]?.transcript ?? "")
        .join(" ")
        .trim();

      if (finalTranscript) {
        handleTranscript(finalTranscript);
      }
    };

    recognition.onerror = () => {
      setIsListening(false);
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
    if (!recognitionRef.current) {
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
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
      className={`${styles.button} ${floating ? styles.floating : ""} ${isListening ? styles.listening : ""}`}
      aria-label={isListening ? "Stop listening" : "Start listening"}
      onClick={handleClick}
    >
      <span className={styles.label}>{isListening ? "Stop" : "Talk"}</span>
    </button>
  );
}
