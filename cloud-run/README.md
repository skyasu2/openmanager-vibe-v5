# Cloud Run Deployment Guide

This directory contains the AI Engine microservice for OpenManager VIBE.

## Services

- **`ai-engine`**: Node.js LangGraph Supervisor for multi-agent orchestration (Gemini + Groq)

> **Note**: Rust ML service was removed in v5.84.0. All ML features (anomaly detection, trend prediction) are now handled by TypeScript within the AI Engine.

## 🚀 Deployment Instructions

### Prerequisites
- Google Cloud CLI (`gcloud`) installed and authenticated.
- Project ID set: `gcloud config set project [YOUR_PROJECT_ID]`

### Deploy AI Engine

```bash
cd ai-engine
gcloud run deploy ai-engine \
  --source . \
  --platform managed \
  --region asia-northeast1 \
  --allow-unauthenticated \
  --memory 2Gi \
  --cpu 2 \
  --set-secrets="GOOGLE_API_KEY=GOOGLE_API_KEY:latest" \
  --set-secrets="GROQ_API_KEY=GROQ_API_KEY:latest" \
  --set-secrets="SUPABASE_URL=SUPABASE_URL:latest" \
  --set-secrets="SUPABASE_SERVICE_ROLE_KEY=SUPABASE_SERVICE_ROLE_KEY:latest" \
  --set-secrets="CLOUD_RUN_API_SECRET=CLOUD_RUN_API_SECRET:latest"
```

### Verify
Check the health endpoint:
- AI Engine: `[AI_URL]/health` -> `{"status":"ok"}`

## 🛠️ Local Development (Docker Compose)

Run locally without deploying:

```bash
docker-compose up --build
```
- AI Engine: http://localhost:8080

## ML Features (TypeScript)

| Feature | Implementation | Location |
|---------|---------------|----------|
| Anomaly Detection | 6-hour moving average + 2σ | `src/lib/ai/monitoring/SimpleAnomalyDetector.ts` |
| Trend Prediction | Linear Regression | `src/lib/ai/monitoring/TrendPredictor.ts` |
