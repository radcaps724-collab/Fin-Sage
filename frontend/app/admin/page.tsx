import { AdminHeader } from "@/components/admin/AdminHeader";
import { StatsCard } from "@/components/admin/StatsCard";

const dashboardStats = {
  totalUsers: 1284,
  totalTransactions: 9462,
  totalExpenses: 184320.75,
};

export default function AdminDashboardPage() {
  return (
    <section className="grid">
      <AdminHeader
        title="Admin Dashboard"
        subtitle="Platform-level overview and operational metrics."
      />

      <div className="grid grid-3">
        <StatsCard label="Total Users" value={dashboardStats.totalUsers} />
        <StatsCard
          label="Total Transactions"
          value={dashboardStats.totalTransactions}
        />
        <StatsCard
          label="Total Expenses"
          value={`$${dashboardStats.totalExpenses.toFixed(2)}`}
          hint="Aggregated expenses from all users"
        />
      </div>
    </section>
  );
}
