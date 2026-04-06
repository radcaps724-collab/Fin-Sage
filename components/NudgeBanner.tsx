export interface NudgeBannerProps {
  title: string;
  message: string;
}

export function NudgeBanner({ title, message }: NudgeBannerProps) {
  return (
    <section className="panel banner">
      <span className="badge">Smart Nudge</span>
      <h3 style={{ marginTop: "0.6rem", marginBottom: "0.35rem" }}>{title}</h3>
      <p className="section-subtitle" style={{ marginBottom: 0 }}>
        {message}
      </p>
    </section>
  );
}
