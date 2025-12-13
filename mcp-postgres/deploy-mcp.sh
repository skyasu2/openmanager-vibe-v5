#!/bin/bash
set -e

SERVICE_NAME="openmanager-mcp-postgres"
PROJECT_ID=$(gcloud config get-value project)
REGION="asia-northeast3"

echo "🚀 Deploying MCP: $SERVICE_NAME"

# Build & Deploy
gcloud builds submit --tag "gcr.io/$PROJECT_ID/$SERVICE_NAME" .
gcloud run deploy "$SERVICE_NAME" \
  --image "gcr.io/$PROJECT_ID/$SERVICE_NAME" \
  --region "$REGION" \
  --platform managed \
  --allow-unauthenticated \
  --set-env-vars DATABASE_URL="YOUR_SUPABASE_CONNECTION_STRING"

echo "✅ MCP Deployed!"
