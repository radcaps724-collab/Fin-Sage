"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { SpendingChart } from "@/components/SpendingChart";
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

  const analytics = useMemo(() => {
    const expenseTransactions = transactions.filter((item) => item.type === "expense");
    const incomeTransactions = transactions.filter((item) => item.type === "income");

    const avgExpense =
      expenseTransactions.length > 0 ? metrics.expenses / expenseTransactions.length : 0;
    const avgIncome = incomeTransactions.length > 0 ? metrics.income / incomeTransactions.length : 0;

    const categoryTotals = expenseTransactions.reduce<Record<string, number>>((acc, item) => {
      acc[item.category] = (acc[item.category] ?? 0) + item.amount;
      return acc;
    }, {});

    const categoryRanking = Object.entries(categoryTotals)
      .map(([category, total]) => ({ category, total }))
      .sort((a, b) => b.total - a.total);

    const topCategory = categoryRanking[0];
    const topCategoryShare =
      metrics.expenses > 0 && topCategory ? (topCategory.total / metrics.expenses) * 100 : 0;

    const monthlyExpenseSummary = expenseTransactions.reduce<Record<string, number>>((acc, item) => {
      const month = item.date.slice(0, 7);
      acc[month] = (acc[month] ?? 0) + item.amount;
      return acc;
    }, {});

    const trendSeries = Object.entries(monthlyExpenseSummary)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-6)
      .map(([month, value]) => ({
        label: month,
        value,
      }));

    const savingsRate = metrics.income > 0 ? (metrics.balance / metrics.income) * 100 : 0;

    return {
      avgExpense,
      avgIncome,
      categoryRanking,
      topCategoryShare,
      trendSeries,
      savingsRate,
    };
  }, [metrics.balance, metrics.expenses, metrics.income, transactions]);

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
          <small>{analytics.savingsRate.toFixed(1)}% savings efficiency</small>
        </article>
        <article className={styles.metric}>
          <span>Total income</span>
          <strong>{formatCurrency(metrics.income, currency)}</strong>
          <small>Avg entry {formatCurrency(analytics.avgIncome, currency)}</small>
        </article>
        <article className={styles.metric}>
          <span>Total expenses</span>
          <strong>{formatCurrency(metrics.expenses, currency)}</strong>
          <small>Avg entry {formatCurrency(analytics.avgExpense, currency)}</small>
        </article>
        <article className={styles.metric}>
          <span>Fixed commitments</span>
          <strong>{metrics.commitmentsShare.toFixed(1)}%</strong>
          <small>of declared monthly income</small>
        </article>
      </div>

      <div className={styles.contentGrid}>
        <SpendingChart variant="bar" title="Expense trend (last 6 months)" data={analytics.trendSeries} />
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

        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2>Top spending categories</h2>
            <p>Simple ranking of where most of your expenses go.</p>
          </div>
          <div className={styles.rankingList}>
            {analytics.categoryRanking.length === 0 ? (
              <p className={styles.emptyState}>No expense categories yet.</p>
            ) : (
              analytics.categoryRanking.slice(0, 5).map((item, index) => (
                <div key={item.category} className={styles.rankingRow}>
                  <div>
                    <span className={styles.rankBadge}>#{index + 1}</span>
                    <strong>{item.category}</strong>
                  </div>
                  <div className={styles.rankingMeta}>
                    <strong>{formatCurrency(item.total, currency)}</strong>
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
