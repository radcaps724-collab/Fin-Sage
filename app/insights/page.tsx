"use client";

import { useEffect, useState } from "react";
import { NudgeBanner } from "@/components/NudgeBanner";
import { SpendingChart } from "@/components/SpendingChart";
import { getInsights, type InsightSummary } from "@/lib/api";

const fallbackInsights: InsightSummary = {
  totalIncome: 0,
  totalExpenses: 0,
  savingsRate: 0,
  topCategory: "N/A",
  spendingSeries: [],
};

export default function InsightsPage() {
  const [insights, setInsights] = useState<InsightSummary>(fallbackInsights);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    let isMounted = true;
    const fetchInsights = async () => {
      try {
        const data = await getInsights();
        if (isMounted) {
          setInsights(data);
        }
      } catch (fetchError) {
        if (isMounted) {
          setError(
            fetchError instanceof Error
              ? fetchError.message
              : "Unable to load insights."
          );
        }
      }
    };
    void fetchInsights();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section className="grid" style={{ gap: "1rem" }}>
      <div>
        <h1 className="section-title">Financial Insights</h1>
        <p className="section-subtitle">
          Smart summaries to help improve spending behavior.
        </p>
      </div>

      {error && <p style={{ color: "var(--danger)" }}>{error}</p>}

      <div className="grid grid-3">
        <article className="panel banner">
          <p className="section-subtitle" style={{ marginBottom: "0.35rem" }}>
            Total Income
          </p>
          <h3>{insights.totalIncome.toFixed(2)}</h3>
        </article>
        <article className="panel banner">
          <p className="section-subtitle" style={{ marginBottom: "0.35rem" }}>
            Total Expenses
          </p>
          <h3>{insights.totalExpenses.toFixed(2)}</h3>
        </article>
        <article className="panel banner">
          <p className="section-subtitle" style={{ marginBottom: "0.35rem" }}>
            Savings Rate
          </p>
          <h3>{insights.savingsRate.toFixed(1)}%</h3>
        </article>
      </div>

      <SpendingChart data={insights.spendingSeries} />

      <NudgeBanner
        title="Keep your biggest category in check"
        message={`Your top spending category is ${insights.topCategory}. Set a weekly limit and track it with voice entries.`}
      />
    </section>
  );
}
