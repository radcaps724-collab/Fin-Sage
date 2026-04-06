"use client";

import { useEffect, useState } from "react";
import { getCurrentUser, getOnboardingStatus } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import type { OnboardingProfile } from "@/types/models";
import styles from "@/styles/pages/profile.module.css";

export default function ProfilePage() {
  const [profile, setProfile] = useState<{ name: string; email: string } | null>(null);
  const [onboarding, setOnboarding] = useState<OnboardingProfile | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const [me, onboardingState] = await Promise.all([
          getCurrentUser(),
          getOnboardingStatus(),
        ]);

        if (cancelled) {
          return;
        }

        setProfile({ name: me.name, email: me.email });
        setOnboarding(onboardingState.profile);
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load profile.");
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className={styles.section}>
      <div className={styles.hero}>
        <div>
          <span className={styles.badge}>Profile</span>
          <h1>Your account and onboarding context.</h1>
          <p className={styles.subtitle}>
            This is the user profile currently feeding the dashboard, transaction layer, and
            insight generation.
          </p>
        </div>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.grid}>
        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2>Account</h2>
            <p>Core login identity stored for your current session.</p>
          </div>
          <div className={styles.infoGrid}>
            <div>
              <span>Name</span>
              <strong>{profile?.name ?? "Loading..."}</strong>
            </div>
            <div>
              <span>Email</span>
              <strong>{profile?.email ?? "Loading..."}</strong>
            </div>
          </div>
        </article>

        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2>Onboarding details</h2>
            <p>The answers FinSage is using right now for personalization.</p>
          </div>
          <div className={styles.infoGrid}>
            <div>
              <span>Age</span>
              <strong>{onboarding?.age ?? "--"}</strong>
            </div>
            <div>
              <span>Occupation</span>
              <strong>{onboarding?.occupation ?? "--"}</strong>
            </div>
            <div>
              <span>Dependents</span>
              <strong>{onboarding?.dependents ?? "--"}</strong>
            </div>
            <div>
              <span>Currency</span>
              <strong>{onboarding?.currency ?? "--"}</strong>
            </div>
            <div>
              <span>Income</span>
              <strong>{formatCurrency(onboarding?.monthlyIncome ?? 0, onboarding?.currency)}</strong>
            </div>
            <div>
              <span>Fixed commitments</span>
              <strong>
                {formatCurrency(onboarding?.fixedCommitments ?? 0, onboarding?.currency)}
              </strong>
            </div>
            <div>
              <span>Monthly budget</span>
              <strong>
                {onboarding?.hasMonthlyBudget
                  ? formatCurrency(onboarding.monthlyBudget ?? 0, onboarding.currency)
                  : "No budget set"}
              </strong>
            </div>
            <div>
              <span>Spending style</span>
              <strong>{onboarding?.spendingStyle ?? "--"}</strong>
            </div>
            <div>
              <span>Overspend area</span>
              <strong>{onboarding?.overspendArea ?? "--"}</strong>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
