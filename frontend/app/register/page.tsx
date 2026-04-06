"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { loginUser, registerUser } from "@/lib/api";
import styles from "@/styles/pages/login.module.css";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
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

    if (!name.trim() || !email.trim() || password.length < 8) {
      setError("Enter a valid name, email, and password with at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      await registerUser(name, email, password);
      const login = await loginUser(email, password);
      router.push(login.user.onboardingCompleted ? "/dashboard" : "/onboarding");
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Registration failed.");
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
          <h1>Create account</h1>
          <p>Register to start your smart financial journey with FinSage.</p>
        </div>

        <div className={styles.formArea}>
          <label>
            <span>Name</span>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Your full name"
              autoComplete="name"
            />
          </label>

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
              placeholder="Minimum 8 characters"
              autoComplete="new-password"
            />
          </label>

          {error && <p className={styles.error}>{error}</p>}

          <button type="submit" className={styles.primaryAction} disabled={loading}>
            {loading ? "Creating account..." : "Register"}
          </button>

          <p className={styles.foot}>
            Already registered? <Link href="/login">Sign in</Link>
          </p>
        </div>
      </form>
    </section>
  );
}
