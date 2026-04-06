import { NudgeBanner } from "@/components/NudgeBanner";

interface LearningItem {
  id: string;
  title: string;
  description: string;
}

const learningItems: LearningItem[] = [
  {
    id: "l1",
    title: "50/30/20 Rule",
    description:
      "Use 50% of income for needs, 30% for wants, and 20% for savings/investments.",
  },
  {
    id: "l2",
    title: "Build an Emergency Fund",
    description:
      "Start with one month of expenses, then grow toward 3-6 months for safety.",
  },
  {
    id: "l3",
    title: "Automate Investments",
    description:
      "Automating SIPs or recurring investments helps build wealth consistently over time.",
  },
];

export default function LearnPage() {
  return (
    <section className="grid">
      <div>
        <h1 className="section-title">Learn Finance</h1>
        <p className="section-subtitle">
          Bite-sized guidance to improve financial habits.
        </p>
      </div>

      <NudgeBanner
        title="Consistency beats intensity"
        message="Small, repeated savings decisions usually outperform occasional big efforts."
      />

      <div className="grid grid-3">
        {learningItems.map((item) => (
          <article key={item.id} className="panel learn-card">
            <h3>{item.title}</h3>
            <p className="section-subtitle" style={{ marginTop: "0.45rem", marginBottom: 0 }}>
              {item.description}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
