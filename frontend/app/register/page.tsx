"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { registerUser } from "@/lib/api";
import styles from "@/styles/pages/register.module.css";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
      router.push("/login");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className={styles.authPage}>
      <div className={styles.authLayout}>
        <div className={styles.authIntro}>
          <span className={styles.badge}>Set up FinSage</span>
          <h1>Create your account and start tracking smarter.</h1>
          <p>
            Once your account is ready, you&apos;ll log in and answer a short onboarding session
            so the app can tailor budgets, nudges, and insights around your real context.
          </p>
          <div className={styles.points}>
            <div>
              <strong>Fast start</strong>
              <span>Only your name, email, and password are needed to create the account.</span>
            </div>
            <div>
              <strong>Guided onboarding</strong>
              <span>Income, commitments, spending style, and overspend areas come next.</span>
            </div>
            <div>
              <strong>Insights that learn</strong>
              <span>Your future ML and Python layers can build directly on the same Mongo history.</span>
            </div>
          </div>
        </div>

        <form className={styles.authPanel} onSubmit={submit}>
          <div className={styles.panelHeader}>
            <span className={styles.kicker}>Create account</span>
            <h2>Open your FinSage workspace</h2>
            <p>You can log in right after this and continue to onboarding.</p>
          </div>

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

          <button type="submit" disabled={loading}>
            {loading ? "Creating account..." : "Register"}
          </button>

          <p className={styles.foot}>
            Already registered? <Link href="/login">Sign in</Link>
          </p>
        </form>
      </div>
    </section>
  );
}
