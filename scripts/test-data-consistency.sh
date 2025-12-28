#!/bin/bash
# Quick Data Consistency Check
# Verifies Vercel ↔ Cloud Run ↔ Supabase data sync

cd "$(dirname "$0")/.."

echo "=== Data Consistency Check ==="
echo ""

# 1. Server count
V=$(jq '.dataPoints[0].servers | length' public/hourly-data/hour-00.json 2>/dev/null || echo "?")
C=$(jq '.dataPoints[0].servers | length' cloud-run/ai-engine/data/hourly-data/hour-00.json 2>/dev/null || echo "?")
echo "[1] Server Count: Vercel=$V, CloudRun=$C"

# 2. First server ID
V_ID=$(jq -r '.dataPoints[0].servers | keys[0]' public/hourly-data/hour-00.json 2>/dev/null)
C_ID=$(jq -r '.dataPoints[0].servers | keys[0]' cloud-run/ai-engine/data/hourly-data/hour-00.json 2>/dev/null)
echo "[2] First ID: Vercel=$V_ID, CloudRun=$C_ID"

# 3. Sample metric
V_CPU=$(jq '.dataPoints[0].servers["web-prd-01"].cpu' public/hourly-data/hour-00.json 2>/dev/null)
C_CPU=$(jq '.dataPoints[0].servers["web-prd-01"].cpu' cloud-run/ai-engine/data/hourly-data/hour-00.json 2>/dev/null)
echo "[3] web-prd-01 CPU: Vercel=$V_CPU, CloudRun=$C_CPU"

# 4. Hash comparison
V_HASH=$(md5sum public/hourly-data/hour-00.json 2>/dev/null | cut -d' ' -f1)
C_HASH=$(md5sum cloud-run/ai-engine/data/hourly-data/hour-00.json 2>/dev/null | cut -d' ' -f1)
echo -n "[4] File Hash: "
[ "$V_HASH" = "$C_HASH" ] && echo "✓ Match" || echo "✗ Differ"

echo ""
# Final result
if [ "$V" = "$C" ] && [ "$V" = "15" ] && [ "$V_ID" = "$C_ID" ] && [ "$V_HASH" = "$C_HASH" ]; then
    echo "=== ✓ PASS: Data synced ==="
    exit 0
else
    echo "=== ✗ FAIL: Run ./scripts/sync-server-data.sh ==="
    exit 1
fi
