"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { loginUser } from "@/lib/api";
import styles from "@/styles/pages/login.module.css";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const sectionRef = useRef<HTMLElement | null>(null);
  const targetPointer = useRef({ x: 50, y: 50 });
  const smoothPointer = useRef({ x: 50, y: 50 });
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [logoBroken, setLogoBroken] = useState(false);

  useEffect(() => {
    const rootTheme = document.documentElement.getAttribute("data-theme");
    setTheme(rootTheme === "light" ? "light" : "dark");
  }, []);

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

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Email and password are required.");
      return;
    }

    setLoading(true);
    try {
      const result = await loginUser(email, password);
      router.push(result.user.onboardingCompleted ? "/dashboard" : "/onboarding");
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section
      ref={sectionRef}
      className={styles.authPage}
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
      <div className={styles.bgGlowPrimary} />
      <div className={styles.bgGlowSecondary} />
      <div className={styles.bgGlowTertiary} />
      <form className={styles.loginShell} onSubmit={submit}>
        <div className={styles.hero}>
          {logoBroken ? (
            <div className={styles.logoFallback}>FS</div>
          ) : (
            <img
              src={theme === "light" ? "/Logodark.png" : "/Logolight.png"}
              alt="FinSage logo"
              className={styles.logoImage}
              onError={() => setLogoBroken(true)}
            />
          )}
          <h1>Sign in</h1>
          <p>Sign in to continue your smart financial journey with FinSage.</p>
        </div>

        <div className={styles.formArea}>
          <label>
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </label>

          <label>
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password"
            />
          </label>

          {error && <p className={styles.error}>{error}</p>}

          <button type="submit" className={styles.primaryAction} disabled={loading}>
            {loading ? "Signing you in..." : "Login"}
          </button>

          <p className={styles.foot}>
            New here? <Link href="/register">Register</Link>
          </p>
        </div>
      </form>
    </section>
  );
}
