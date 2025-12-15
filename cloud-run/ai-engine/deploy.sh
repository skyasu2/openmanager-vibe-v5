#!/bin/bash

# Configuration
PROJECT_ID=$(gcloud config get-value project)
SERVICE_NAME="ai-engine"
REGION="asia-northeast3" # Default region
IMAGE_TAG="gcr.io/$PROJECT_ID/$SERVICE_NAME:v1"

echo "🚀 Deploying $SERVICE_NAME to Google Cloud Run..."
echo "Project: $PROJECT_ID"
echo "Region: $REGION"

# Deploy directly from source
# Ensure we are deploying the ai-engine directory
# We cd into the directory to avoid WSL/Windows path issues with gcloud
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "🚀 Deploying service from source at: $(pwd)"

gcloud run deploy $SERVICE_NAME \
  --source . \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --min-instances 0 \
  --max-instances 5 \
  --concurrency 80 \
  --cpu 1 \
  --memory 1Gi \
  --no-cpu-throttling

if [ $? -eq 0 ]; then
    echo "✅ Deployment successful!"
    echo "URL: $(gcloud run services describe $SERVICE_NAME --platform managed --region $REGION --format 'value(status.url)')"
else
    echo "❌ Deployment failed"
    exit 1
fi
