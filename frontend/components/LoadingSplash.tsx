"use client";

import { useEffect, useState } from "react";
import styles from "@/styles/components/LoadingSplash.module.css";

export function LoadingSplash({ label = "Loading FinSage..." }: { label?: string }) {
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  useEffect(() => {
    const updateTheme = () => {
      const rootTheme = document.documentElement.getAttribute("data-theme");
      setTheme(rootTheme === "light" ? "light" : "dark");
    };

    updateTheme();

    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    return () => observer.disconnect();
  }, []);

  return (
    <section className={styles.wrap}>
      <div className={styles.glow} />
      <div className={styles.center}>
        <img
          src={theme === "light" ? "/Logolight.png" : "/Logodark.png"}
          alt="FinSage logo"
          className={styles.logo}
        />
        <h1 className={styles.title}>FinSage</h1>
        <p className={styles.label}>{label}</p>
        <div className={styles.dots} aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      </div>
    </section>
  );
}
