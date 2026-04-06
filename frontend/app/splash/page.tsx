"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import styles from "@/styles/pages/splash.module.css";

const slides = [
  {
    icon: "₹",
    title: "Income Management",
    description: "Input your income and choose your preferred currency in a single clean flow.",
  },
  {
    icon: "💳",
    title: "Expense Management",
    description: "Add, update, and organize expenses with checks that keep your balance healthy.",
  },
  {
    icon: "📒",
    title: "Expense Log",
    description: "See a complete transaction log with date, category, and amount in one place.",
  },
  {
    icon: "📊",
    title: "Charts & Summary",
    description: "Use pie and bar charts for breakdowns, finance summaries, and total balance clarity.",
  },
  {
    icon: "📤",
    title: "Export, Explain & Report",
    description:
      "Export CSV/Excel/JSON, get expense explanations, and generate downloadable PDF reports.",
  },
];

export default function SplashPage() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionClass, setTransitionClass] = useState("");
  const sectionRef = useRef<HTMLElement | null>(null);
  const targetPointer = useRef({ x: 50, y: 50 });
  const smoothPointer = useRef({ x: 50, y: 50 });
  const exitTimerRef = useRef<number | null>(null);
  const enterTimerRef = useRef<number | null>(null);
  const isLast = activeIndex === slides.length - 1;
  const currentSlide = slides[activeIndex];

  useEffect(() => {
    let frameId = 0;

    const animate = () => {
      const element = sectionRef.current;
      if (!element) {
        frameId = requestAnimationFrame(animate);
        return;
      }

      smoothPointer.current.x += (targetPointer.current.x - smoothPointer.current.x) * 0.14;
      smoothPointer.current.y += (targetPointer.current.y - smoothPointer.current.y) * 0.14;

      const nx = (smoothPointer.current.x - 50) / 50;
      const ny = (smoothPointer.current.y - 50) / 50;

      element.style.setProperty("--mx", `${smoothPointer.current.x}%`);
      element.style.setProperty("--my", `${smoothPointer.current.y}%`);
      element.style.setProperty("--px", `${nx * 14}px`);
      element.style.setProperty("--py", `${ny * 14}px`);

      frameId = requestAnimationFrame(animate);
    };

    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, []);

  useEffect(() => {
    return () => {
      if (exitTimerRef.current !== null) {
        window.clearTimeout(exitTimerRef.current);
      }
      if (enterTimerRef.current !== null) {
        window.clearTimeout(enterTimerRef.current);
      }
    };
  }, []);

  const transitionTo = (targetIndex: number) => {
    if (isTransitioning || targetIndex === activeIndex) {
      return;
    }

    const direction = targetIndex > activeIndex ? "next" : "prev";
    setIsTransitioning(true);
    setTransitionClass(direction === "next" ? styles.slideExitNext : styles.slideExitPrev);

    exitTimerRef.current = window.setTimeout(() => {
      setActiveIndex(targetIndex);
      setTransitionClass(direction === "next" ? styles.slideEnterNext : styles.slideEnterPrev);

      enterTimerRef.current = window.setTimeout(() => {
        setTransitionClass("");
        setIsTransitioning(false);
      }, 420);
    }, 230);
  };

  return (
    <section
      ref={sectionRef}
      className={styles.wrap}
      onMouseMove={(event) => {
        const bounds = event.currentTarget.getBoundingClientRect();
        const x = ((event.clientX - bounds.left) / bounds.width) * 100;
        const y = ((event.clientY - bounds.top) / bounds.height) * 100;
        targetPointer.current = { x, y };
      }}
      onMouseLeave={() => {
        targetPointer.current = { x: 50, y: 50 };
      }}
    >
      <div className={styles.cursorGlow} />
      <div className={styles.cursorDot} />
      <div className={styles.bgGlow} />
      <div className={styles.bgGlowSoft} />
      <div className={styles.sliderShell}>
        <div className={styles.topRail}>
          <div className={styles.progressRail}>
            {slides.map((slide, index) => (
              <span
                key={slide.title}
                className={index <= activeIndex ? styles.progressActive : ""}
              />
            ))}
          </div>
          <span className={styles.stepText}>
            {activeIndex + 1}/{slides.length}
          </span>
        </div>
        <div className={`${styles.slideViewport} ${transitionClass}`}>
          <div className={styles.hero}>
            <div className={styles.featureIconCircle} aria-hidden="true">
              <span>{currentSlide?.icon ?? "₹"}</span>
            </div>
            <p className={styles.brandTag}>FinSage</p>
          </div>

          <h1 className={styles.slideTitle}>
            {currentSlide?.title}
          </h1>
          <p className={styles.slideText}>
            {currentSlide?.description}
          </p>

          {!isLast ? (
            <div className={styles.actionsRow}>
              <button
                type="button"
                className={styles.prevBtn}
                onClick={() => transitionTo(Math.max(activeIndex - 1, 0))}
                disabled={activeIndex === 0 || isTransitioning}
              >
                Prev
              </button>
              <button
                type="button"
                className={styles.nextBtn}
                onClick={() => transitionTo(Math.min(activeIndex + 1, slides.length - 1))}
                disabled={isTransitioning}
              >
                Next
              </button>
            </div>
          ) : (
            <div className={styles.actionsRow}>
              <button
                type="button"
                className={styles.prevBtn}
                onClick={() => transitionTo(Math.max(activeIndex - 1, 0))}
                disabled={isTransitioning}
              >
                Prev
              </button>
              <Link
                href="/login"
                className={`${styles.getStartedBtn} ${isTransitioning ? styles.actionDisabled : ""}`}
                aria-disabled={isTransitioning}
                tabIndex={isTransitioning ? -1 : undefined}
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
