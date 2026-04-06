export interface Transaction {
  id: string;
  title: string;
  category: string;
  amount: number;
  currency: string;
  type: "income" | "expense";
  date: string;
}

export interface TransactionCardProps {
  transaction: Transaction;
}

export function TransactionCard({ transaction }: TransactionCardProps) {
  const sign = transaction.type === "expense" ? "-" : "+";

  return (
    <article className="panel transaction-card">
      <div className="transaction-meta">
        <h3>{transaction.title}</h3>
        <p>
          {transaction.category} • {transaction.date}
        </p>
      </div>
      <p className={`amount ${transaction.type}`}>
        {sign}
        {transaction.currency}
        {transaction.amount.toFixed(2)}
      </p>
    </article>
  );
}
