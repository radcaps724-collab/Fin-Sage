import { formatCurrency } from "@/lib/format";
import styles from "@/styles/components/SpendingChart.module.css";

export interface SpendingSeriesItem {
  label: string;
  value: number;
}

export interface SpendingChartProps {
  title?: string;
  data: SpendingSeriesItem[];
  variant: "bar" | "pie";
}

export function SpendingChart({ title, data, variant }: SpendingChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const placeholderHeights = [82, 56, 72, 44];

  return (
    <section className={styles.panel}>
      <h2 className={styles.title}>{title}</h2>

      <div className={`${styles.chart} ${variant === "bar" ? styles.chartBar : styles.chartPie}`}>
        {data.length === 0 && variant === "bar" &&
          placeholderHeights.map((height, index) => (
            <div key={`placeholder-${index}`} className={styles.barWrap}>
              <strong>--</strong>
              <div className={`${styles.bar} ${styles.barPlaceholder}`} style={{ height: `${height}%` }} />
              <span>Waiting</span>
            </div>
          ))}

        {data.length === 0 && variant === "pie" && (
          <>
            <div className={`${styles.pieRow} ${styles.pieRowPlaceholder}`}>
              <div>
                <strong>Transaction data pending</strong>
                <span>Add entries to unlock category mix</span>
              </div>
              <span>--</span>
            </div>
            <div className={`${styles.pieRow} ${styles.pieRowPlaceholder}`}>
              <div>
                <strong>Insights will appear here</strong>
                <span>Charts render as soon as categories are available</span>
              </div>
              <span>--</span>
            </div>
          </>
        )}

        {data.length > 0 && variant === "bar" &&
          data.map((item) => {
            const height = total > 0 ? Math.max((item.value / total) * 100, 12) : 12;
            return (
              <div key={item.label} className={styles.barWrap}>
                <strong>{formatCurrency(item.value)}</strong>
                <div className={styles.bar} style={{ height: `${height}%` }} />
                <span>{item.label}</span>
              </div>
            );
          })}

        {data.length > 0 && variant === "pie" &&
          data.map((item) => {
            const percent = total > 0 ? Math.round((item.value / total) * 100) : 0;
            return (
              <div key={item.label} className={styles.pieRow}>
                <div>
                  <strong>{item.label}</strong>
                  <span>{formatCurrency(item.value)}</span>
                </div>
                <span>{percent}%</span>
              </div>
            );
          })}
      </div>
    </section>
  );
}
