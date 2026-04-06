import styles from "@/styles/components/LoadingSplash.module.css";

export function LoadingSplash({ label = "Loading FinSage..." }: { label?: string }) {
  return (
    <section className={styles.wrap}>
      <div className={styles.glow} />
      <div className={styles.card}>
        <picture>
          <source srcSet="/Logolight.png" media="(prefers-color-scheme: dark)" />
          <img src="/Logodark.png" alt="FinSage logo" className={styles.logo} />
        </picture>
        <h1>FinSage</h1>
        <p>{label}</p>
        <div className={styles.spinner} />
      </div>
    </section>
  );
}
