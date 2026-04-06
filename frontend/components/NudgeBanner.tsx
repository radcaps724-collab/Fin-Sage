import styles from "@/styles/components/NudgeBanner.module.css";

export interface NudgeBannerProps {
  title: string;
  message: string;
}

export function NudgeBanner({ title, message }: NudgeBannerProps) {
  return (
    <section className={styles.card}>
      <span className={styles.badge}>Smart Nudge</span>
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.message}>{message}</p>
    </section>
  );
}
