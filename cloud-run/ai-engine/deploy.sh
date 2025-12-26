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
  --set-secrets "GOOGLE_AI_CONFIG=google-ai-config:latest,LANGFUSE_CONFIG=langfuse-config:latest,SUPABASE_CONFIG=supabase-config:latest,GROQ_API_KEY=groq-api-key:latest,CLOUD_RUN_API_SECRET=cloud-run-api-secret:latest,MISTRAL_API_KEY=mistral-api-key:latest"

if [ $? -eq 0 ]; then
    SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --platform managed --region $REGION --format 'value(status.url)')
    echo ""
    echo "✅ Deployment Successful!"
    echo "🌍 Service URL: $SERVICE_URL"
    echo "=============================================================================="

    # 3. Cleanup old images and sources (keep latest 3)
    # Note: Cleanup failures are non-critical and won't affect deployment success
    echo ""
    echo "🧹 Cleaning up old images and sources..."

    # Cleanup old container images (keep latest 3)
    KEEP_IMAGES=3
    OLD_DIGESTS=$(gcloud container images list-tags "gcr.io/${PROJECT_ID}/${SERVICE_NAME}" \
      --format="value(digest)" --sort-by=~timestamp 2>/dev/null | tail -n +$((KEEP_IMAGES + 1)))

    if [ -n "$OLD_DIGESTS" ]; then
      echo "   Deleting old container images..."
      DELETE_COUNT=0
      for digest in $OLD_DIGESTS; do
        gcloud container images delete "gcr.io/${PROJECT_ID}/${SERVICE_NAME}@${digest}" \
          --quiet --force-delete-tags 2>/dev/null && ((DELETE_COUNT++)) &
      done
      wait
      echo "   ✅ Old images deleted ($DELETE_COUNT processed)"
    else
      echo "   ✅ No old images to delete"
    fi

    # Cleanup old Cloud Build sources (keep latest 10)
    KEEP_SOURCES=10
    BUCKET_NAME="${PROJECT_ID}_cloudbuild"

    # Check if bucket exists before attempting cleanup
    if gsutil ls "gs://${BUCKET_NAME}/" >/dev/null 2>&1; then
      OLD_SOURCES=$(gsutil ls -l "gs://${BUCKET_NAME}/source/" 2>/dev/null | \
        grep -v "TOTAL:" | sort -k2 -r | tail -n +$((KEEP_SOURCES + 1)) | awk '{print $3}')

      SOURCE_COUNT=$(echo "$OLD_SOURCES" | grep -c "gs://" 2>/dev/null || echo 0)
      if [ "$SOURCE_COUNT" -gt 0 ]; then
        echo "   Deleting $SOURCE_COUNT old build sources..."
        echo "$OLD_SOURCES" | xargs -P 10 gsutil rm 2>/dev/null || echo "   ⚠️  Some sources could not be deleted"
        echo "   ✅ Old build sources cleanup completed"
      else
        echo "   ✅ No old build sources to delete"
      fi
    else
      echo "   ⚠️  Cloud Build bucket not found, skipping source cleanup"
    fi

    echo "=============================================================================="
    echo "📊 Storage Cleanup Summary:"
    echo "   - Container images: kept latest $KEEP_IMAGES"
    echo "   - Build sources: kept latest $KEEP_SOURCES"
    echo "=============================================================================="
else
    echo ""
    echo "❌ Deployment Failed."
    exit 1
fi

