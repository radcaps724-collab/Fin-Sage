# FinSage – Voice-Based Personal Finance Tracker

FinSage is a voice-first financial assistant that enables users to track their expenses and income using natural spoken commands. The system processes voice input, categorizes transactions intelligently, and provides meaningful insights into spending behavior.

## 🚀 Features
- 🎙️ Voice-based transaction entry (expense/income)
- 🧠 NLP-powered parsing of spoken commands
- 📊 Automatic categorization of transactions
- 📈 Visual insights and spending analytics
- 💡 Smart nudges for better financial habits
- 📚 Built-in financial education module

## 🏗️ Tech Stack

### Mobile (Frontend)
- React Native (Expo)
- TypeScript
- Custom UI Components

### Backend
- FastAPI (Python)
- NLP processing (Claude API / custom logic)
- Supabase (Database)

## 📂 Project Structure
- `mobile/` – React Native app
- `backend/` – FastAPI server
- `services/` – NLP, categorization, nudges
- `db/` – Supabase integration

## 🎯 Goal
To simplify personal finance management by making it as easy as speaking.

## 📌 Future Scope
- Multi-language voice support
- AI-powered financial planning
- Budget predictions
- Personalized financial coaching

## Backend + ML Starter Setup

### Backend (`backend/`)
1. Copy env file:
   - `cp .env.example .env` (or create `.env` manually on Windows)
2. Install dependencies:
   - `npm install`
3. Start in development:
   - `npm run dev`
4. Required env values:
   - `MONGO_URI`
   - `JWT_SECRET`
   - `CORS_ORIGIN`
   - `ML_SERVICE_URL`

### ML Service (`ml/`)
1. Create and activate virtual environment (recommended).
2. Install dependencies:
   - `pip install -r requirements.txt`
3. Run service:
   - `uvicorn main:app --host 0.0.0.0 --port 8000 --reload`

### API Endpoints
- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/user/profile` (Bearer token required)
- `POST /api/user/onboarding` (Bearer token required)
- `POST /api/user/voice/process` (Bearer token required; forwards text to ML service)
- `POST /process-voice` (ML service endpoint)
