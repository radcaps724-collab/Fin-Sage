import { ApiError, asApiError } from "@/lib/api-errors";
import { getSupabaseServer } from "@/lib/supabase-server";
import { errorResponse, successResponse } from "@/lib/api-response";
import { requireAuthUser } from "@/lib/auth";
import type { Transaction } from "@/types/models";

type TransactionRecord = Omit<Transaction, "_id"> & {
  id?: string | number;
  _id?: string | number;
  user_id?: string;
  created_at?: string;
};

interface CategorySummary {
  category: string;
  total: number;
}

export async function GET(request: Request) {
  try {
    const supabaseServer = getSupabaseServer();
    const user = requireAuthUser(request);
    const { data: transactions, error } = await supabaseServer
      .from("transactions")
      .select("*")
      .eq("user_id", user.userId);

    if (error) {
      throw new ApiError(error.message, 500, "SUPABASE_QUERY_FAILED");
    }

    const rows = (transactions ?? []) as TransactionRecord[];

    const totalIncome = rows
      .filter((item) => item.type === "income")
      .reduce((sum, item) => sum + item.amount, 0);
    const totalExpenses = rows
      .filter((item) => item.type === "expense")
      .reduce((sum, item) => sum + item.amount, 0);
    const savingsRate =
      totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;

    const byCategory = rows
      .filter((item) => item.type === "expense")
      .reduce<Record<string, number>>((acc, item) => {
        acc[item.category] = (acc[item.category] ?? 0) + item.amount;
        return acc;
      }, {});

    const categoryRows: CategorySummary[] = Object.entries(byCategory).map(
      ([category, total]) => ({ category, total })
    );
    categoryRows.sort((a, b) => b.total - a.total);

    const topCategory = categoryRows[0]?.category ?? "N/A";
    const monthlyTrendMap = rows.reduce<Record<string, number>>((acc, item) => {
      if (item.type !== "expense") {
        return acc;
      }
      const date = new Date(item.date);
      const monthKey = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
      acc[monthKey] = (acc[monthKey] ?? 0) + item.amount;
      return acc;
    }, {});

    const barSeries = Object.entries(monthlyTrendMap)
      .sort(([monthA], [monthB]) => monthA.localeCompare(monthB))
      .slice(-6)
      .map(([monthKey, value]) => {
        const [year, month] = monthKey.split("-");
        const label = new Date(`${year}-${month}-01T00:00:00.000Z`).toLocaleDateString(
          "en-US",
          {
            month: "short",
          }
        );
        return { label, value };
      });
    const pieSeries = categoryRows.map((item) => ({
      label: item.category,
      value: item.total,
    }));

    const suggestions: string[] = [];
    if (totalExpenses > totalIncome && totalIncome > 0) {
      suggestions.push("You are overspending this period. Reduce discretionary categories by 10-15%.");
    }
    if (topCategory !== "N/A") {
      suggestions.push(`Your highest spend is ${topCategory}. Set a category cap and weekly review.`);
    }
    if (savingsRate < 20) {
      suggestions.push("Target a 20% savings rate by auto-transferring funds right after income.");
    }
    if (suggestions.length === 0) {
      suggestions.push("Great balance so far. Keep tracking consistently for stronger long-term trends.");
    }

    return successResponse({
      totalIncome,
      totalExpenses,
      savingsRate,
      topCategory,
      barSeries,
      pieSeries,
      suggestions,
    });
  } catch (error) {
    const apiError = asApiError(error);
    return errorResponse(apiError.message, apiError.code, apiError.status);
  }
}
