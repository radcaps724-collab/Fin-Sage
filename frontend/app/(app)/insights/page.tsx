"use client";

import { useEffect, useState } from "react";
import { NudgeBanner } from "@/components/NudgeBanner";
import { SpendingChart } from "@/components/SpendingChart";
import { getInsights, getOnboardingStatus, type InsightSummary } from "@/lib/api";
import { formatCurrency, formatPercent } from "@/lib/format";
import type { OnboardingProfile } from "@/types/models";
import styles from "@/styles/pages/insights.module.css";

const fallbackInsights: InsightSummary = {
  totalIncome: 0,
  totalExpenses: 0,
  savingsRate: 0,
  topCategory: "N/A",
  barSeries: [],
  pieSeries: [],
  suggestions: [],
};

export default function InsightsPage() {
  const [profile, setProfile] = useState<OnboardingProfile | null>(null);
  const [insights, setInsights] = useState<InsightSummary>(fallbackInsights);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const [insightData, onboarding] = await Promise.all([
          getInsights(),
          getOnboardingStatus(),
        ]);

        if (cancelled) {
          return;
        }

        setInsights(insightData);
        setProfile(onboarding.profile);
      } catch (fetchError) {
        if (!cancelled) {
          setError(
            fetchError instanceof Error ? fetchError.message : "Unable to load insights."
          );
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  const budgetUsage =
    profile?.hasMonthlyBudget && (profile.monthlyBudget ?? 0) > 0
      ? (insights.totalExpenses / (profile.monthlyBudget ?? 1)) * 100
      : null;

  return (
    <section className={styles.section}>
      <div className={styles.hero}>
        <div>
          <span className={styles.badge}>Insights</span>
          <h1>Readable signals, not just raw numbers.</h1>
          <p className={styles.subtitle}>
            These visual summaries come straight from your saved transactions and onboarding
            preferences, so the next ML layer already has the right base structure.
          </p>
        </div>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.metricsGrid}>
        <article className={styles.metric}>
          <span>Total income</span>
          <strong>{formatCurrency(insights.totalIncome, profile?.currency)}</strong>
        </article>
        <article className={styles.metric}>
          <span>Total expenses</span>
          <strong>{formatCurrency(insights.totalExpenses, profile?.currency)}</strong>
        </article>
        <article className={styles.metric}>
          <span>Savings rate</span>
          <strong>{formatPercent(insights.savingsRate)}</strong>
        </article>
        <article className={styles.metric}>
          <span>Top spend category</span>
          <strong>{insights.topCategory}</strong>
        </article>
      </div>

      <div className={styles.summaryGrid}>
        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2>Behaviour context</h2>
            <p>Using your onboarding answers to interpret the numbers with the right lens.</p>
          </div>
          <div className={styles.contextGrid}>
            <div>
              <span>Spending style</span>
              <strong>{profile?.spendingStyle ?? "Balanced"}</strong>
            </div>
            <div>
              <span>Overspend area</span>
              <strong>{profile?.overspendArea ?? "Don't know"}</strong>
            </div>
            <div>
              <span>Monthly budget</span>
              <strong>
                {profile?.hasMonthlyBudget
                  ? formatCurrency(profile.monthlyBudget ?? 0, profile.currency)
                  : "Not set"}
              </strong>
            </div>
            <div>
              <span>Budget used</span>
              <strong>{budgetUsage === null ? "No budget yet" : formatPercent(budgetUsage)}</strong>
            </div>
          </div>
        </article>

        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2>Suggestions</h2>
            <p>Short, action-oriented nudges generated from your current transaction history.</p>
          </div>
          <div className={styles.nudges}>
            {insights.suggestions.length === 0 ? (
              <p className={styles.emptyState}>Save a few transactions to unlock stronger suggestions.</p>
            ) : (
              insights.suggestions.map((suggestion) => (
                <NudgeBanner key={suggestion} title="AI suggestion" message={suggestion} />
              ))
            )}
          </div>
        </article>
      </div>

      <div className={styles.chartGrid}>
        <SpendingChart variant="bar" title="Monthly expense trend" data={insights.barSeries} />
        <SpendingChart variant="pie" title="Category comparison" data={insights.pieSeries} />
      </div>
    </section>
  );
}
