"use client";

import { useEffect, useState } from "react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { TransactionsTable } from "@/components/admin/TransactionsTable";
import { getAllTransactions, type Transaction } from "@/lib/api";

export default function AdminTransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const fetchTransactions = async () => {
      try {
        const data = await getAllTransactions();
        if (mounted) {
          setTransactions(data);
        }
      } catch (error) {
        if (mounted) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Failed to load transactions."
          );
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    void fetchTransactions();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <section className="grid">
      <AdminHeader
        title="Transactions"
        subtitle="Review all transaction records across users."
      />

      {isLoading && <p className="section-subtitle">Loading transactions...</p>}
      {errorMessage && <p style={{ color: "var(--danger)" }}>{errorMessage}</p>}
      {!isLoading && !errorMessage && (
        <TransactionsTable transactions={transactions} />
      )}
    </section>
  );
}
