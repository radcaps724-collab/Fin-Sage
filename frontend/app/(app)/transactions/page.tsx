"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { VoiceButton } from "@/components/VoiceButton";
import {
  confirmVoiceTransaction,
  createTransaction,
  getOnboardingStatus,
  getTransactions,
  sendVoiceText,
  type VoiceProcessResult,
  type Transaction,
} from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/format";
import type { OnboardingProfile } from "@/types/models";
import styles from "@/styles/pages/transactions.module.css";

const today = new Date().toISOString().slice(0, 10);

export default function TransactionsPage() {
  const [profile, setProfile] = useState<OnboardingProfile | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [liveTranscript, setLiveTranscript] = useState("");
  const [manualText, setManualText] = useState("");
  const [voiceResult, setVoiceResult] = useState<VoiceProcessResult | null>(null);
  const [insight, setInsight] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isParsing, setIsParsing] = useState(false);

  const [type, setType] = useState<"income" | "expense">("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState(today);
  const [description, setDescription] = useState("");

  const deferredCategoryFilter = useDeferredValue(categoryFilter);
  const deferredDateFilter = useDeferredValue(dateFilter);

  useEffect(() => {
    let cancelled = false;

    const loadProfile = async () => {
      try {
        const onboarding = await getOnboardingStatus();
        if (!cancelled) {
          setProfile(onboarding.profile);
        }
      } catch {
        if (!cancelled) {
          setProfile(null);
        }
      }
    };

    void loadProfile();

    return () => {
      cancelled = true;
    };
  }, []);

  const loadTransactions = async (categoryValue?: string, dateValue?: string) => {
    const data = await getTransactions({
      category: categoryValue || undefined,
      date: dateValue || undefined,
    });
    setTransactions(data);
  };

  useEffect(() => {
    let cancelled = false;

    const fetchTransactions = async () => {
      try {
        const data = await getTransactions({
          category: deferredCategoryFilter || undefined,
          date: deferredDateFilter || undefined,
        });
        if (!cancelled) {
          setTransactions(data);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error ? loadError.message : "Failed to load transactions."
          );
        }
      }
    };

    void fetchTransactions();

    return () => {
      cancelled = true;
    };
  }, [deferredCategoryFilter, deferredDateFilter]);

  const applyVoiceResult = (parsed: VoiceProcessResult) => {
    setVoiceResult(parsed);

    if (parsed.intent === "log_transaction" && parsed.transaction) {
      const transactionDate = today;
      setType(parsed.transaction.type);
      setAmount(parsed.transaction.amount.toString());
      setCategory(
        typeof parsed.transaction.category === "string" ? parsed.transaction.category : ""
      );
      setDate(transactionDate);
      setDescription(
        typeof parsed.transaction.description === "string"
          ? parsed.transaction.description
          : ""
      );
      setInsight(parsed.insight ?? parsed.message);
      setStatus(parsed.message || "Voice entry parsed. Review it or save it immediately.");
      return;
    }

    if (parsed.insight) {
      setInsight(parsed.insight);
    }
    setStatus(parsed.message || "Voice request completed.");
  };

  const applyVoiceTranscript = async (text: string) => {
    setError("");
    setStatus("");
    setIsParsing(true);
    setManualText(text);

    try {
      const parsed = await sendVoiceText(text, "speech");
      applyVoiceResult(parsed);
    } catch (voiceError) {
      setError(voiceError instanceof Error ? voiceError.message : "Unable to parse voice input.");
    } finally {
      setIsParsing(false);
    }
  };

  const interpretManualText = async () => {
    const text = manualText.trim();
    if (!text) {
      setError("Type a transaction or insight request first.");
      return;
    }

    setError("");
    setStatus("");
    setIsParsing(true);

    try {
      const parsed = await sendVoiceText(text, "manual");
      applyVoiceResult(parsed);
    } catch (manualError) {
      setError(manualError instanceof Error ? manualError.message : "Unable to interpret manual text.");
    } finally {
      setIsParsing(false);
    }
  };

  const saveTransaction = async () => {
    setError("");
    setStatus("");

    const safeCategory = typeof category === "string" ? category.trim() : "";
    const safeDescription = typeof description === "string" ? description.trim() : "";
    const parsedAmount = Number(amount);
    if (
      !Number.isFinite(parsedAmount) ||
      parsedAmount <= 0 ||
      !safeCategory ||
      !safeDescription
    ) {
      setError("Provide a valid amount, category, and description before saving.");
      return;
    }

    setIsSaving(true);
    try {
      if (
        voiceResult?.intent === "log_transaction" &&
        typeof voiceResult.inputId === "number" &&
        voiceResult.requiresConfirmation !== false
      ) {
        const confirmResult = await confirmVoiceTransaction({
          inputId: voiceResult.inputId,
          confirmed: true,
          transaction: {
            type,
            amount: parsedAmount,
            category: safeCategory,
            description: safeDescription,
            person: voiceResult.transaction?.person ?? null,
          },
        });

        if (!confirmResult.confirmed) {
          throw new Error(confirmResult.message || "Transaction was not confirmed.");
        }
      }

      await createTransaction({
        type,
        amount: parsedAmount,
        category: safeCategory,
        date,
        description: safeDescription,
      });

      setVoiceResult(null);
      setLiveTranscript("");
      setInsight("");
      setAmount("");
      setCategory("");
      setDescription("");
      setDate(today);
      setType("expense");
      setStatus("Transaction saved successfully. Insights will reflect it automatically.");
      await loadTransactions(deferredCategoryFilter, deferredDateFilter);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to save transaction.");
    } finally {
      setIsSaving(false);
    }
  };

  const submitTransaction = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await saveTransaction();
  };

  const categories = useMemo(
    () => Array.from(new Set(transactions.map((item) => item.category))).sort(),
    [transactions]
  );

  const totals = useMemo(() => {
    const income = transactions
      .filter((item) => item.type === "income")
      .reduce((sum, item) => sum + item.amount, 0);
    const expenses = transactions
      .filter((item) => item.type === "expense")
      .reduce((sum, item) => sum + item.amount, 0);
    return {
      income,
      expenses,
      entries: transactions.length,
    };
  }, [transactions]);

  const currency = profile?.currency;

  return (
    <section className={styles.section}>
      <div className={styles.hero}>
        <div>
          <span className={styles.badge}>Transactions</span>
          <h1>Capture money movement the moment it happens.</h1>
          <p className={styles.subtitle}>
            Use voice for fast entry, then save to MongoDB. Your dashboard and insights update
            from the same transaction stream.
          </p>
        </div>
      </div>

      <div className={styles.metricsGrid}>
        <article className={styles.metric}>
          <span>Entries</span>
          <strong>{totals.entries}</strong>
        </article>
        <article className={styles.metric}>
          <span>Income</span>
          <strong>{formatCurrency(totals.income, currency)}</strong>
        </article>
        <article className={styles.metric}>
          <span>Expenses</span>
          <strong>{formatCurrency(totals.expenses, currency)}</strong>
        </article>
      </div>

      <div className={styles.composerGrid}>
        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2>Voice assistant</h2>
            <p>Tap talk, say the transaction naturally, then save the parsed result.</p>
          </div>

          <div className={styles.voiceDock}>
            <VoiceButton
              onTranscript={applyVoiceTranscript}
              onLiveTranscript={setLiveTranscript}
              onError={setError}
            />
            <div className={styles.voiceText}>
              <strong>{isParsing ? "Listening for a usable transaction..." : "Talk to FinSage"}</strong>
              <span>
                Try: <em>I spent 450 on food yesterday</em> or <em>Salary credited 52000 today</em>.
              </span>
            </div>
          </div>

          <div className={styles.manualInterpreter}>
            <input
              type="text"
              value={manualText}
              onChange={(event) => setManualText(event.target.value)}
              placeholder="Type a command: I spent 350 on food"
              aria-label="Manual command input"
            />
            <button
              type="button"
              className={styles.secondaryAction}
              onClick={interpretManualText}
              disabled={isParsing}
            >
              {isParsing ? "Interpreting..." : "Interpret text"}
            </button>
          </div>

          {liveTranscript && <p className={styles.recognized}>Live transcript: {liveTranscript}</p>}
          {status && <p className={styles.status}>{status}</p>}
          {insight && <p className={styles.insight}>{insight}</p>}
          {error && <p className={styles.error}>{error}</p>}

          {voiceResult && (
            <div className={styles.previewGrid}>
              {voiceResult.transaction ? (
                <>
                  <div>
                    <span>Type</span>
                    <strong>{voiceResult.transaction.type}</strong>
                  </div>
                  <div>
                    <span>Category</span>
                    <strong>{voiceResult.transaction.category}</strong>
                  </div>
                  <div>
                    <span>Amount</span>
                    <strong>{formatCurrency(voiceResult.transaction.amount, currency)}</strong>
                  </div>
                  <div>
                    <span>Date</span>
                    <strong>{formatDate(date)}</strong>
                  </div>
                </>
              ) : (
                <div>
                  <span>Intent</span>
                  <strong>{voiceResult.intent}</strong>
                </div>
              )}
            </div>
          )}

          {voiceResult && (
            <button
              type="button"
              className={styles.primaryAction}
              onClick={saveTransaction}
              disabled={isSaving}
            >
              {isSaving ? "Saving transaction..." : "Save voice transaction"}
            </button>
          )}
        </article>

        <form className={styles.panel} onSubmit={submitTransaction}>
          <div className={styles.panelHeader}>
            <h2>Manual entry</h2>
            <p>Edit the parsed values or add a transaction manually.</p>
          </div>

          <div className={styles.formGrid}>
            <label>
              <span>Type</span>
              <select value={type} onChange={(event) => setType(event.target.value as "income" | "expense")}>
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            </label>
            <label>
              <span>Amount</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={amount ?? ""}
                onChange={(event) => setAmount(event.target.value)}
              />
            </label>
            <label>
              <span>Category</span>
              <input value={category ?? ""} onChange={(event) => setCategory(event.target.value)} />
            </label>
            <label>
              <span>Date</span>
              <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
            </label>
            <label className={styles.fullWidth}>
              <span>Description</span>
              <input
                value={description ?? ""}
                onChange={(event) => setDescription(event.target.value)}
              />
            </label>
          </div>

          <button type="submit" className={styles.primaryAction} disabled={isSaving}>
            {isSaving ? "Saving transaction..." : "Save transaction"}
          </button>
        </form>
      </div>

      <div className={styles.filters}>
        <label>
          <span>Date</span>
          <input
            type="date"
            value={dateFilter}
            onChange={(event) => setDateFilter(event.target.value)}
          />
        </label>
        <label>
          <span>Category</span>
          <select
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
          >
            <option value="">All categories</option>
            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
      </div>

      <article className={styles.panel}>
        <div className={styles.panelHeader}>
          <h2>Saved transactions</h2>
          <p>Filtered, formatted, and ready for the insights engine.</p>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Category</th>
                <th>Description</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className={styles.empty}>
                    No transactions found for the current filters.
                  </td>
                </tr>
              ) : (
                transactions.map((item) => (
                  <tr key={item._id}>
                    <td>{formatDate(item.date)}</td>
                    <td className={styles.capitalize}>{item.type}</td>
                    <td>{item.category}</td>
                    <td>{item.description}</td>
                    <td
                      className={
                        item.type === "expense" ? styles.amountExpense : styles.amountIncome
                      }
                    >
                      {formatCurrency(item.amount, currency)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
}
