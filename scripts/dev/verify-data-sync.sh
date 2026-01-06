#!/bin/bash
# Verify SSOT data sync between Vercel and Cloud Run

echo "🔍 Verifying SSOT data sync..."

VERCEL_DIR="public/hourly-data"
CLOUDRUN_DIR="cloud-run/ai-engine/data/hourly-data"

if ! diff -q "$VERCEL_DIR" "$CLOUDRUN_DIR" > /dev/null 2>&1; then
  echo "❌ Data mismatch detected!"
  echo ""
  echo "Run: npx tsx scripts/data/sync-hourly-data.ts"
  echo "Then commit both directories."
  exit 1
fi

echo "✅ SSOT data in sync (24 files identical)"
exit 0
