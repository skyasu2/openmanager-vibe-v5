# Cloud Run Deployment Guide

This directory contains the microservices for the OpenManager VIBE AI Engine.

## Services

1.  **`rust-inference`**: Rust-based ML service for heavy computation (Linfa Clustering, Anomaly Detection).
2.  **`ai-engine`**: Node.js LangGraph Supervisor for agent orchestration.

## 🚀 Deployment Instructions

### Prerequisites
- Google Cloud CLI (`gcloud`) installed and authenticated.
- Project ID set: `gcloud config set project [YOUR_PROJECT_ID]`

### Step 1: Deploy Rust ML Service
This service must be deployed first to obtain its URL.

```bash
cd rust-inference
gcloud run deploy rust-inference \
  --source . \
  --platform managed \
  --region asia-northeast3 \
  --allow-unauthenticated \
  --memory 512Mi \
  --cpu 1
```

**Note the URL** from the output (e.g., `https://rust-inference-xyz.run.app`).

### Step 2: Deploy AI Engine
Update the `RUST_ML_SERVICE_URL` with the URL from Step 1.

```bash
cd ../ai-engine
gcloud run deploy ai-engine \
  --source . \
  --platform managed \
  --region asia-northeast3 \
  --allow-unauthenticated \
  --memory 2Gi \
  --cpu 2 \
  --set-env-vars="RUST_ML_SERVICE_URL=[URL_FROM_STEP_1]" \
  --set-env-vars="GOOGLE_GENERATIVE_AI_API_KEY=[YOUR_KEY]" \
  --set-env-vars="SUPABASE_URL=[YOUR_SB_URL]" \
  --set-env-vars="SUPABASE_SERVICE_ROLE_KEY=[YOUR_SB_KEY]"
```

### Step 3: Verify
Check the health endpoints:
- Rust: `[RUST_URL]/health` -> `ok`
- AI Engine: `[AI_URL]/health` -> `ok`

## 🛠️ Local Development (Docker Compose)
You can run both services locally without deploying.

```bash
docker-compose up --build
```
- AI Engine: http://localhost:8080
- Rust ML: http://localhost:8081
