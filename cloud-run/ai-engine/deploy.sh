#!/bin/bash

# ==============================================================================
# Cloud Run Deployment Script (AI Engine)
# ==============================================================================

set -e # Exit on error

# Configuration
SERVICE_NAME="ai-engine"
REGION="asia-northeast3"
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
  --set-env-vars "NODE_ENV=production"

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

