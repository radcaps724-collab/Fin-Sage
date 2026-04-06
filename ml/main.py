from fastapi import FastAPI
from pydantic import BaseModel, Field

from services.voice_parser import parse_voice_text

app = FastAPI(title="Fin-Sage ML Service", version="1.0.0")


class VoiceInput(BaseModel):
    text: str = Field(..., min_length=2)


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.post("/process-voice")
def process_voice(payload: VoiceInput):
    return parse_voice_text(payload.text)
