import { TransactionCard, type Transaction } from "@/components/TransactionCard";

const sampleTransactions: Transaction[] = [
  {
    id: "t-101",
    title: "Grocery Store",
    category: "Food",
    amount: 82.4,
    currency: "$",
    type: "expense",
    date: "Apr 05, 2026",
  },
  {
    id: "t-102",
    title: "Monthly Salary",
    category: "Income",
    amount: 4250,
    currency: "$",
    type: "income",
    date: "Apr 01, 2026",
  },
  {
    id: "t-103",
    title: "Ride Share",
    category: "Transport",
    amount: 18.6,
    currency: "$",
    type: "expense",
    date: "Apr 04, 2026",
  },
];

export default function TransactionsPage() {
  return (
    <section>
      <h1 className="section-title">Transactions</h1>
      <p className="section-subtitle">
        Clean, searchable timeline of income and expenses.
      </p>
      <div className="grid">
        {sampleTransactions.map((transaction) => (
          <TransactionCard key={transaction.id} transaction={transaction} />
        ))}
      </div>
    </section>
  );
}
