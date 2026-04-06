export interface SpendingSeriesItem {
  label: string;
  value: number;
}

export interface SpendingChartProps {
  title?: string;
  data: SpendingSeriesItem[];
}

export function SpendingChart({
  title = "Monthly Spending Overview",
  data,
}: SpendingChartProps) {
  return (
    <section className="panel banner">
      <h2 className="section-title">{title}</h2>
      <p className="section-subtitle">
        Placeholder chart component. Wire to your charting library later.
      </p>
      <div className="chart-placeholder">
        {data.length} categories loaded. Visual chart placeholder.
      </div>
    </section>
  );
}
