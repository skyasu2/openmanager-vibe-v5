#!/bin/bash

# ==============================================================================
# Cloud Run Deployment Script (AI Engine)
# ==============================================================================

set -e # Exit on error

# Configuration
SERVICE_NAME="ai-engine"
# IMPORTANT: asia-northeast1 is the production region (used by Vercel)
# Do NOT change to asia-northeast3 (old region, deprecated)
REGION="asia-northeast1"
PROJECT_ID=$(gcloud config get-value project)

if [ -z "$PROJECT_ID" ]; then
  echo "❌ Error: No Google Cloud Project selected."
  echo "Run 'gcloud config set project [PROJECT_ID]' first."
  exit 1
fi

# Image Tagging (Timestamp + Short SHA)
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
SHORT_SHA=$(git rev-parse --short HEAD 2>/dev/null || echo "manual")
TAG="v-${TIMESTAMP}-${SHORT_SHA}"
IMAGE_URI="gcr.io/${PROJECT_ID}/${SERVICE_NAME}:${TAG}"

echo "=============================================================================="
echo "🚀 Starting Deployment for: $SERVICE_NAME"
echo "   Project: $PROJECT_ID"
echo "   Region:  $REGION"
echo "   Image:   $IMAGE_URI"
echo "=============================================================================="

# Ensure script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# 1. Build Container Image (Cloud Build)
echo ""
echo "📦 Building Container Image..."
gcloud builds submit --tag "$IMAGE_URI" .

if [ $? -ne 0 ]; then
  echo "❌ Build failed. Aborting."
  exit 1
fi

# 2. Deploy to Cloud Run
echo ""
echo "🚀 Deploying to Cloud Run..."
gcloud run deploy "$SERVICE_NAME" \
  --image "$IMAGE_URI" \
  --platform managed \
  --region "$REGION" \
  --allow-unauthenticated \
  --min-instances 0 \
  --max-instances 5 \
  --concurrency 80 \
  --cpu 1 \
  --memory 1Gi \
  --no-cpu-throttling \
  --set-env-vars "NODE_ENV=production" \
  --set-secrets "GEMINI_API_KEY_PRIMARY=google-ai-api-key:latest" \
  --set-secrets "GEMINI_API_KEY_SECONDARY=google-ai-api-key-2:latest" \
  --set-secrets "GROQ_API_KEY=groq-api-key:latest" \
  --set-secrets "SUPABASE_URL=supabase-url:latest" \
  --set-secrets "SUPABASE_SERVICE_ROLE_KEY=supabase-service-role-key:latest" \
  --set-secrets "SUPABASE_DIRECT_URL=supabase-direct-url:latest" \
  --set-secrets "CLOUD_RUN_API_SECRET=cloud-run-api-secret:latest"

if [ $? -eq 0 ]; then
    SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --platform managed --region $REGION --format 'value(status.url)')
    echo ""
    echo "✅ Deployment Successful!"
    echo "🌍 Service URL: $SERVICE_URL"
    echo "=============================================================================="
else
    echo ""
    echo "❌ Deployment Failed."
    exit 1
fi

