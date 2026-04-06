"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getCurrentUser, getOnboardingStatus, getTransactions, type Transaction } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/format";
import type { OnboardingProfile } from "@/types/models";
import styles from "@/styles/pages/dashboard.module.css";

export default function DashboardPage() {
  const [userName, setUserName] = useState("there");
  const [profile, setProfile] = useState<OnboardingProfile | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const [me, onboarding, transactionData] = await Promise.all([
          getCurrentUser(),
          getOnboardingStatus(),
          getTransactions(),
        ]);

        if (cancelled) {
          return;
        }

        setUserName(me.name);
        setProfile(onboarding.profile);
        setTransactions(transactionData);
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load dashboard.");
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  const metrics = useMemo(() => {
    const income = transactions
      .filter((item) => item.type === "income")
      .reduce((sum, item) => sum + item.amount, 0);
    const expenses = transactions
      .filter((item) => item.type === "expense")
      .reduce((sum, item) => sum + item.amount, 0);
    const balance = income - expenses;
    const commitmentsShare =
      profile && profile.monthlyIncome > 0
        ? (profile.fixedCommitments / profile.monthlyIncome) * 100
        : 0;
    const budgetUsage =
      profile?.hasMonthlyBudget && (profile.monthlyBudget ?? 0) > 0
        ? (expenses / (profile.monthlyBudget ?? 1)) * 100
        : null;

    return {
      income,
      expenses,
      balance,
      commitmentsShare,
      budgetUsage,
    };
  }, [profile, transactions]);

  const recentTransactions = transactions.slice(0, 5);
  const currency = profile?.currency;

  return (
    <section className={styles.section}>
      <div className={styles.hero}>
        <div>
          <span className={styles.badge}>Financial cockpit</span>
          <h1>Hi {userName.split(" ")[0] || "there"}, here&apos;s your money picture.</h1>
          <p className={styles.subtitle}>
            FinSage now knows your income context, commitments, and spending style. Every
            transaction you save will sharpen the insights from here onward.
          </p>
        </div>
        <div className={styles.heroActions}>
          <Link href="/transactions" className={styles.primaryAction}>
            Add transaction
          </Link>
          <Link href="/insights" className={styles.secondaryAction}>
            View insights
          </Link>
        </div>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.metricsGrid}>
        <article className={styles.metric}>
          <span>Net balance</span>
          <strong>{formatCurrency(metrics.balance, currency)}</strong>
        </article>
        <article className={styles.metric}>
          <span>Total income</span>
          <strong>{formatCurrency(metrics.income, currency)}</strong>
        </article>
        <article className={styles.metric}>
          <span>Total expenses</span>
          <strong>{formatCurrency(metrics.expenses, currency)}</strong>
        </article>
        <article className={styles.metric}>
          <span>Fixed commitments</span>
          <strong>{metrics.commitmentsShare.toFixed(1)}%</strong>
        </article>
      </div>

      <div className={styles.contentGrid}>
        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2>Your onboarding snapshot</h2>
            <p>This is the context powering your current recommendations.</p>
          </div>
          <div className={styles.detailGrid}>
            <div>
              <span>Occupation</span>
              <strong>{profile?.occupation ?? "Not set yet"}</strong>
            </div>
            <div>
              <span>Dependents</span>
              <strong>{profile?.dependents ?? 0}</strong>
            </div>
            <div>
              <span>Spending style</span>
              <strong>{profile?.spendingStyle ?? "Balanced"}</strong>
            </div>
            <div>
              <span>Overspend area</span>
              <strong>{profile?.overspendArea ?? "Don't know"}</strong>
            </div>
            <div>
              <span>Monthly commitments</span>
              <strong>{formatCurrency(profile?.fixedCommitments ?? 0, currency)}</strong>
            </div>
            <div>
              <span>Budget status</span>
              <strong>
                {metrics.budgetUsage === null
                  ? "No budget set"
                  : `${metrics.budgetUsage.toFixed(1)}% used`}
              </strong>
            </div>
          </div>
        </article>

        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2>Recent activity</h2>
            <p>Your latest saved transactions from MongoDB.</p>
          </div>
          <div className={styles.activityList}>
            {recentTransactions.length === 0 ? (
              <p className={styles.emptyState}>
                No transactions yet. Head to the transactions page and log one with voice or
                manually.
              </p>
            ) : (
              recentTransactions.map((transaction) => (
                <div key={transaction._id} className={styles.activityRow}>
                  <div>
                    <strong>{transaction.category}</strong>
                    <span>{transaction.description}</span>
                  </div>
                  <div className={styles.activityMeta}>
                    <strong>{formatCurrency(transaction.amount, currency)}</strong>
                    <span>{formatDate(transaction.date)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </article>
      </div>
    </section>
  );
}
