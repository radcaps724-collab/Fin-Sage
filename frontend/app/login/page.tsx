"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { loginUser } from "@/lib/api";
import styles from "@/styles/pages/login.module.css";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
    <section className={styles.authPage}>
      <div className={styles.authLayout}>
        <div className={styles.authIntro}>
          <span className={styles.badge}>Personal finance assistant</span>
          <h1>Welcome back to a calmer money flow.</h1>
          <p>
            Login first, then FinSage will take you through a quick onboarding so your
            dashboard, voice capture, and insights match your real financial life.
          </p>
          <div className={styles.points}>
            <div>
              <strong>10 quick questions</strong>
              <span>Name, age, work, dependents, income, budget, and spending habits.</span>
            </div>
            <div>
              <strong>Voice-first logging</strong>
              <span>Speak a transaction, save it, and let Mongo-backed insights update instantly.</span>
            </div>
            <div>
              <strong>Built for production</strong>
              <span>Secure cookie sessions, typed APIs, and a cleaner onboarding-to-dashboard flow.</span>
            </div>
          </div>
        </div>

        <form className={styles.authPanel} onSubmit={submit}>
          <div className={styles.panelHeader}>
            <span className={styles.kicker}>Sign in</span>
            <h2>Continue your finance journey</h2>
            <p>Use the same email and password you registered with.</p>
          </div>

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

          <button type="submit" disabled={loading}>
            {loading ? "Signing you in..." : "Login"}
          </button>

          <p className={styles.foot}>
            New here? <Link href="/register">Create an account</Link>
          </p>
        </form>
      </div>
    </section>
  );
}
