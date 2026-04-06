"""
Voice Finance Assistant
========================
Speech → faster-whisper (Indian names aware) → Ollama LLM → SQLite DB
Run:  python assistant.py
Stop: say "stop" or "exit" or press Ctrl+C
"""

import time, json, datetime, os, re
import pyaudio, numpy as np, pyttsx3, ollama
from faster_whisper import WhisperModel
from sqlalchemy import create_engine, Column, Integer, Float, String, DateTime, Text, func
from sqlalchemy.orm import sessionmaker, declarative_base
# from indian_names import build_whisper_prompt     

# ─────────────────────────── CONFIG ───────────────────────────
OLLAMA_MODEL      = "mistral"   # ollama pull mistral
WHISPER_MODEL     = "small"     # tiny | base | small | medium
DEVICE            = "cpu"       # "cuda" if Nvidia GPU

CHUNK             = 1024
FORMAT            = pyaudio.paInt16
CHANNELS          = 1
RATE              = 16000
SILENCE_THRESHOLD = 400
SILENCE_DURATION  = 1.8
MAX_RECORD_SECS   = 12

DB_PATH           = os.path.join(os.path.dirname(os.path.abspath(__file__)), "finance.db")

# Whisper initial_prompt — biases model toward Indian names & finance terms
# WHISPER_PROMPT    = build_whisper_prompt()

# ─────────────────────────── DATABASE ─────────────────────────
engine  = create_engine(f'sqlite:///{DB_PATH}', echo=False)
Base    = declarative_base()
Session = sessionmaker(bind=engine)

class Transaction(Base):
    __tablename__ = 'transactions'
    id          = Column(Integer, primary_key=True)
    date        = Column(DateTime, default=datetime.datetime.utcnow)
    tx_type     = Column(String(20))
    amount      = Column(Float)
    category    = Column(String(50))
    description = Column(Text)
    person      = Column(String(100))   # NEW: who was involved

Base.metadata.create_all(engine)

# ─────────────────────────── WHISPER ──────────────────────────
print("Loading faster-whisper model...")
asr = WhisperModel(WHISPER_MODEL, device=DEVICE, compute_type="int8")
# print(f"Whisper ready. Names prompt loaded ({len(WHISPER_PROMPT)} chars).\n")

# ─────────────────────────── TTS ──────────────────────────────
tts = pyttsx3.init()
_v  = tts.getProperty('voices')
if _v:
    tts.setProperty('voice', _v[0].id)
tts.setProperty('rate', 158)

def speak(text: str):
    print(f"\n🤖  {text}")
    tts.say(text)
    tts.runAndWait()

# ─────────────────────────── MIC ──────────────────────────────
def rms(data: bytes) -> float:
    s = np.frombuffer(data, dtype=np.int16).astype(np.float32)
    return float(np.sqrt(np.mean(s ** 2))) if len(s) else 0.0

def record_until_silence() -> np.ndarray | None:
    p      = pyaudio.PyAudio()
    stream = p.open(format=FORMAT, channels=CHANNELS, rate=RATE,
                    input=True, frames_per_buffer=CHUNK)
    print("🎤  Listening…")
    frames, silent, started = [], 0, False
    max_c   = int(RATE / CHUNK * MAX_RECORD_SECS)
    need_si = int(RATE / CHUNK * SILENCE_DURATION)

    for _ in range(max_c):
        data  = stream.read(CHUNK, exception_on_overflow=False)
        level = rms(data)
        frames.append(data)
        if level > SILENCE_THRESHOLD:
            started = True
            silent  = 0
        elif started:
            silent += 1
            if silent >= need_si:
                break

    stream.stop_stream(); stream.close(); p.terminate()
    if not started:
        return None

    raw   = b''.join(frames)
    audio = np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768.0
    return audio

# ─────────────────────────── TRANSCRIBE ───────────────────────
def transcribe(audio: np.ndarray) -> str:
    segs, _ = asr.transcribe(
        audio,
        language        = "en",
        beam_size       = 5,
        # initial_prompt  = WHISPER_PROMPT,   # ← Indian names context
        vad_filter      = True,
        vad_parameters  = {"min_silence_duration_ms": 400}
    )
    return " ".join(s.text for s in segs).strip()

# ─────────────────────────── LLM ──────────────────────────────
SYSTEM_PROMPT = """You are a personal finance assistant for an Indian user. Currency = Indian Rupees (Rs).

CATEGORIES: Food, Transport, Rent, Salary, Investments, Gold, Entertainment, Utilities, Shopping, Medical, Other

Return ONE valid JSON object. No markdown, no explanation, pure JSON only.
If a person's name is mentioned (e.g. "paid Rahul 500"), capture it in the "person" field.

Examples:

User: "spent 250 on lunch today"
{"intent":"log_transaction","transaction":{"type":"expense","amount":250,"category":"Food","description":"lunch","person":null},"query":null}

User: "paid Rahul 500 for transport"
{"intent":"log_transaction","transaction":{"type":"expense","amount":500,"category":"Transport","description":"paid Rahul","person":"Rahul"},"query":null}

User: "received 5000 from Priya"
{"intent":"log_transaction","transaction":{"type":"income","amount":5000,"category":"Other","description":"received from Priya","person":"Priya"},"query":null}

User: "got salary of 50000"
{"intent":"log_transaction","transaction":{"type":"income","amount":50000,"category":"Salary","description":"monthly salary","person":null},"query":null}

User: "paid 1200 electricity bill"
{"intent":"log_transaction","transaction":{"type":"expense","amount":1200,"category":"Utilities","description":"electricity bill","person":null},"query":null}

User: "how much did I spend this month"
{"intent":"get_insights","transaction":null,"query":"monthly spending summary"}

User: "what are my top expenses"
{"intent":"get_insights","transaction":null,"query":"top expense categories"}

User: "how much did I pay Rahul"
{"intent":"get_insights","transaction":null,"query":"person:Rahul"}

If unclear: {"intent":"unknown","transaction":null,"query":null}"""

def parse_with_llm(text: str) -> dict:
    try:
        resp    = ollama.chat(
            model   = OLLAMA_MODEL,
            messages= [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user",   "content": text}
            ],
            options = {"temperature": 0, "num_predict": 200}
        )
        content = resp['message']['content'].strip()
        m = re.search(r'\{.*\}', content, re.DOTALL)
        if m:
            return json.loads(m.group())
    except Exception as e:
        print(f"  LLM error: {e}")
    return {"intent": "unknown"}

# ─────────────────────────── DB OPS ───────────────────────────
def log_transaction(tx: dict):
    s = Session()
    s.add(Transaction(
        tx_type     = tx['type'],
        amount      = float(tx['amount']),
        category    = tx['category'],
        description = tx.get('description', ''),
        person      = tx.get('person') or None
    ))
    s.commit(); s.close()

def monthly_summary() -> str:
    s     = Session()
    now   = datetime.datetime.utcnow()
    start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    txns  = s.query(Transaction).filter(Transaction.date >= start).all()
    s.close()
    if not txns:
        return "No transactions recorded this month yet."
    exp = sum(t.amount for t in txns if t.tx_type == 'expense')
    inc = sum(t.amount for t in txns if t.tx_type == 'income')
    cats: dict[str, float] = {}
    for t in txns:
        if t.tx_type == 'expense':
            cats[t.category] = cats.get(t.category, 0) + t.amount
    top = sorted(cats.items(), key=lambda x: x[1], reverse=True)[:3]
    top_str = ", ".join(f"{c} Rs {a:.0f}" for c, a in top) or "none"
    return (f"This month: income Rs {inc:.0f}, expenses Rs {exp:.0f}, "
            f"balance Rs {inc - exp:.0f}. Top spending: {top_str}.")

def weekly_summary() -> str:
    s        = Session()
    week_ago = datetime.datetime.utcnow() - datetime.timedelta(days=7)
    txns     = s.query(Transaction).filter(Transaction.date >= week_ago).all()
    s.close()
    if not txns:
        return "No transactions in the last 7 days."
    exp = sum(t.amount for t in txns if t.tx_type == 'expense')
    inc = sum(t.amount for t in txns if t.tx_type == 'income')
    return f"Last 7 days: income Rs {inc:.0f}, expenses Rs {exp:.0f}."

def top_categories() -> str:
    s     = Session()
    now   = datetime.datetime.utcnow()
    start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    rows  = (s.query(Transaction.category,
                     func.sum(Transaction.amount).label('total'))
              .filter(Transaction.date >= start, Transaction.tx_type == 'expense')
              .group_by(Transaction.category)
              .order_by(func.sum(Transaction.amount).desc())
              .limit(5).all())
    s.close()
    if not rows:
        return "No expenses this month."
    return "Top categories this month: " + ", ".join(f"{r.category} Rs {r.total:.0f}" for r in rows) + "."

def person_summary(name: str) -> str:
    s    = Session()
    txns = s.query(Transaction).filter(
        Transaction.person.ilike(f"%{name}%")
    ).all()
    s.close()
    if not txns:
        return f"No transactions found involving {name}."
    total = sum(t.amount for t in txns)
    count = len(txns)
    return f"Found {count} transactions involving {name}, totalling Rs {total:.0f}."

def get_insights(query: str) -> str:
    q = (query or "").lower()
    if q.startswith("person:"):
        return person_summary(q.split("person:")[1].strip())
    if any(w in q for w in ("week", "7 day", "last week")):
        return weekly_summary()
    if any(w in q for w in ("top", "most", "highest", "category")):
        return top_categories()
    return monthly_summary()

# ─────────────────────────── MAIN ─────────────────────────────
def run():
    speak("Finance assistant ready. Speak naturally. Say stop to quit.")

    while True:
        try:
            audio = record_until_silence()
            if audio is None:
                continue

            print("  Transcribing…")
            text = transcribe(audio)
            if not text or len(text) < 2:
                continue

            print(f"👤  You: {text}")

            if any(w in text.lower() for w in ("stop","exit","quit","bye","goodbye")):
                speak("Goodbye! Data saved.")
                break

            print("  Thinking…")
            parsed = parse_with_llm(text)
            intent = parsed.get("intent")

            if intent == "log_transaction" and parsed.get("transaction"):
                tx   = parsed["transaction"]
                log_transaction(tx)
                who  = f" with {tx['person']}" if tx.get('person') else ""
                desc = tx.get('description', '')
                speak(f"Logged {tx['type']} of Rs {tx['amount']} for {tx['category']}{who}."
                      + (f" {desc}." if desc else "") + " Anything else?")

            elif intent == "get_insights":
                speak(get_insights(parsed.get("query", "")))

            else:
                speak("Didn't catch that. Try: spent 200 on food, or show my spending.")

        except KeyboardInterrupt:
            speak("Shutting down.")
            break
        except Exception as e:
            print(f"  Error: {e}")
            time.sleep(0.3)

if __name__ == "__main__":
    run()
