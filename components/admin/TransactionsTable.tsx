import type { Transaction } from "@/lib/api";

export interface TransactionsTableProps {
  transactions: Transaction[];
}

export function TransactionsTable({ transactions }: TransactionsTableProps) {
  return (
    <div className="panel admin-table-wrap">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Amount</th>
            <th>Category</th>
            <th>Type</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {transactions.length === 0 ? (
            <tr>
              <td colSpan={4} className="admin-table-empty">
                No transactions found.
              </td>
            </tr>
          ) : (
            transactions.map((transaction) => (
              <tr key={transaction._id}>
                <td>{transaction.amount.toFixed(2)}</td>
                <td>{transaction.category}</td>
                <td style={{ textTransform: "capitalize" }}>{transaction.type}</td>
                <td>{new Date(transaction.createdAt).toLocaleDateString()}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
