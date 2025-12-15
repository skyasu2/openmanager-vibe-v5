#!/bin/bash

# Configuration
PROJECT_ID=$(gcloud config get-value project)
SERVICE_NAME="supabase-mcp"
REGION="asia-northeast3"
IMAGE_TAG="gcr.io/$PROJECT_ID/$SERVICE_NAME:v1"

echo "🚀 Deploying $SERVICE_NAME to Google Cloud Run..."
echo "Project: $PROJECT_ID"
echo "Region: $REGION"

# 1. Build
echo "📦 Building container..."
gcloud builds submit --tag $IMAGE_TAG .

if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi

# 2. Deploy
echo "🚀 Deploying service..."
gcloud run deploy $SERVICE_NAME \
  --image $IMAGE_TAG \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --min-instances 0 \
  --max-instances 2 \
  --memory 512Mi \
  --set-env-vars "NODE_ENV=production"

if [ $? -eq 0 ]; then
    echo "✅ Deployment successful!"
    echo "URL: $(gcloud run services describe $SERVICE_NAME --platform managed --region $REGION --format 'value(status.url)')"
else
    echo "❌ Deployment failed"
    exit 1
fi
