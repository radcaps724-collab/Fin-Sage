"""
Finance Insights Viewer
========================
Run separately to see all your logged data + analysis.
Usage:  python insights.py
"""

import datetime, os
from sqlalchemy import create_engine, func
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy import Column, Integer, Float, String, DateTime, Text

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "finance.db")
engine  = create_engine(f'sqlite:///{DB_PATH}', echo=False)
Base    = declarative_base()
Session = sessionmaker(bind=engine)

class Transaction(Base):
    __tablename__ = 'transactions'
    id          = Column(Integer, primary_key=True)
    date        = Column(DateTime)
    tx_type     = Column(String(20))
    amount      = Column(Float)
    category    = Column(String(50))
    description = Column(Text)

Base.metadata.create_all(engine)

def line(char="─", n=52):
    print(char * n)

def show_insights():
    s   = Session()
    now = datetime.datetime.utcnow()

    # ── All time totals ──────────────────────────────────────
    all_txns = s.query(Transaction).order_by(Transaction.date.desc()).all()
    if not all_txns:
        print("No transactions recorded yet. Start the assistant and log some!")
        return

    line("═")
    print("  💰  FINANCE INSIGHTS REPORT")
    line("═")

    total_inc = sum(t.amount for t in all_txns if t.tx_type == 'income')
    total_exp = sum(t.amount for t in all_txns if t.tx_type == 'expense')
    print(f"\n  ALL TIME")
    print(f"  Total Income   : Rs {total_inc:>10,.0f}")
    print(f"  Total Expenses : Rs {total_exp:>10,.0f}")
    print(f"  Net Balance    : Rs {total_inc - total_exp:>10,.0f}")

    # ── This month ───────────────────────────────────────────
    start_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    month_txns  = [t for t in all_txns if t.date >= start_month]
    if month_txns:
        m_inc = sum(t.amount for t in month_txns if t.tx_type == 'income')
        m_exp = sum(t.amount for t in month_txns if t.tx_type == 'expense')
        print(f"\n  THIS MONTH  ({now.strftime('%B %Y')})")
        print(f"  Income   : Rs {m_inc:>10,.0f}")
        print(f"  Expenses : Rs {m_exp:>10,.0f}")
        print(f"  Balance  : Rs {m_inc - m_exp:>10,.0f}")

    # ── Category breakdown ───────────────────────────────────
    line()
    print("  EXPENSE BREAKDOWN BY CATEGORY (this month)")
    line()
    rows = (s.query(Transaction.category,
                    func.sum(Transaction.amount).label('total'),
                    func.count(Transaction.id).label('count'))
             .filter(Transaction.date >= start_month,
                     Transaction.tx_type == 'expense')
             .group_by(Transaction.category)
             .order_by(func.sum(Transaction.amount).desc())
             .all())
    if rows:
        for r in rows:
            bar = "█" * int(r.total / max(rw.total for rw in rows) * 20)
            print(f"  {r.category:<15} Rs {r.total:>8,.0f}  {bar} ({r.count} txn)")
    else:
        print("  No expenses this month.")

    # ── Last 10 transactions ─────────────────────────────────
    line()
    print("  LAST 10 TRANSACTIONS")
    line()
    for t in all_txns[:10]:
        icon = "↑" if t.tx_type == 'income' else "↓"
        d    = t.date.strftime("%d %b %H:%M")
        desc = (t.description[:20] + "…") if len(t.description or "") > 20 else (t.description or "")
        print(f"  {icon} {d}  {t.category:<14} Rs {t.amount:>8,.0f}  {desc}")

    # ── Weekly trend (last 4 weeks) ──────────────────────────
    line()
    print("  WEEKLY SPENDING (last 4 weeks)")
    line()
    for week in range(4):
        w_end   = now - datetime.timedelta(days=week * 7)
        w_start = w_end - datetime.timedelta(days=7)
        wt      = [t for t in all_txns
                   if w_start <= t.date <= w_end and t.tx_type == 'expense']
        total   = sum(t.amount for t in wt)
        label   = w_start.strftime("%d %b") + " – " + w_end.strftime("%d %b")
        bar     = "█" * min(int(total / 1000), 30) if total else ""
        print(f"  {label}  Rs {total:>8,.0f}  {bar}")

    line("═")
    s.close()

if __name__ == "__main__":
    show_insights()
