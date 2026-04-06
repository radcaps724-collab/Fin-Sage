"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "@/styles/pages/splash.module.css";

export default function SplashPage() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace("/login");
    }, 1800);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <section className={styles.wrap}>
      <div className={styles.glow} />
      <div className={styles.logoCard}>
        <div className={styles.logo}>FS</div>
        <h1>FinSage</h1>
        <p>Smart finance, one voice at a time.</p>
      </div>
    </section>
  );
}
