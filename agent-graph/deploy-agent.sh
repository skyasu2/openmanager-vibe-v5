#!/bin/bash
# deploy-agent.sh - Deploy agent-graph to Google Cloud Run from WSL

set -e # Exit on error

# Configuration
SERVICE_NAME="openmanager-agent-graph"
PROJECT_ID=$(gcloud config get-value project)
REGION="asia-northeast3" # Seoul Region (Low Latency)

if [ -z "$PROJECT_ID" ]; then
  echo "❌ Error: No Google Cloud Project ID found. Run 'gcloud init' first."
  exit 1
fi

echo "🚀 Starting Deployment Pipeline for [$SERVICE_NAME]..."
echo "📍 Project: $PROJECT_ID | Region: $REGION"

# 1. Build & Submit using Cloud Build (Easiest way from WSL without local Docker daemon issues)
# This zips the source and builds it remotely on Google Cloud
echo "📦 Building and Pushing Container Image (via Cloud Build)..."
gcloud builds submit --tag "gcr.io/$PROJECT_ID/$SERVICE_NAME" .

# 2. Deploy to Cloud Run
echo "🚀 Deploying to Cloud Run..."
gcloud run deploy "$SERVICE_NAME" \
  --image "gcr.io/$PROJECT_ID/$SERVICE_NAME" \
  --region "$REGION" \
  --platform managed \
  --allow-unauthenticated \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 1 \
  --set-env-vars NODE_ENV=production

echo "✅ Deployment Complete!"
echo "📡 Service URL:"
gcloud run services describe "$SERVICE_NAME" --platform managed --region "$REGION" --format "value(status.url)"
