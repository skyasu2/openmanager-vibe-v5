#!/bin/bash
# =============================================================================
# Server Data Synchronization Script
# =============================================================================
#
# Purpose: Vercel JSON을 SSOT로 하여 Cloud Run 및 Supabase 동기화
#
# Usage:
#   ./scripts/sync-server-data.sh           # 전체 동기화
#   ./scripts/sync-server-data.sh json      # JSON만 복사
#   ./scripts/sync-server-data.sh supabase  # Supabase만 동기화
#
# Data Flow:
#   public/hourly-data/hour-XX.json (SSOT)
#       ↓ copy
#   cloud-run/ai-engine/data/hourly-data/hour-XX.json
#       ↓ read by
#   scenario-loader.ts, fixed-24h-metrics.ts
#
# =============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Paths
SOURCE_DIR="$PROJECT_ROOT/public/hourly-data"
TARGET_DIR="$PROJECT_ROOT/cloud-run/ai-engine/data/hourly-data"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Server Data Synchronization Script${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# =============================================================================
# Function: Sync JSON files
# =============================================================================
sync_json_files() {
    echo -e "${YELLOW}[1/2] JSON 파일 동기화 중...${NC}"

    if [ ! -d "$SOURCE_DIR" ]; then
        echo -e "${RED}Error: Source directory not found: $SOURCE_DIR${NC}"
        exit 1
    fi

    # Create target directory if not exists
    mkdir -p "$TARGET_DIR"

    # Count files
    FILE_COUNT=$(ls -1 "$SOURCE_DIR"/hour-*.json 2>/dev/null | wc -l)

    if [ "$FILE_COUNT" -eq 0 ]; then
        echo -e "${RED}Error: No hour-XX.json files found in $SOURCE_DIR${NC}"
        exit 1
    fi

    # Copy files
    cp -v "$SOURCE_DIR"/hour-*.json "$TARGET_DIR/" 2>/dev/null || {
        echo -e "${RED}Error: Failed to copy files${NC}"
        exit 1
    }

    echo -e "${GREEN}✓ $FILE_COUNT JSON 파일 복사 완료${NC}"
    echo ""
}

# =============================================================================
# Function: Display server IDs from JSON
# =============================================================================
show_server_ids() {
    echo -e "${YELLOW}[2/2] 서버 ID 목록 (JSON 기준):${NC}"

    if command -v jq &> /dev/null; then
        jq -r '.dataPoints[0].servers | keys[]' "$SOURCE_DIR/hour-00.json" 2>/dev/null | sort
    else
        grep -o '"id":"[^"]*"' "$SOURCE_DIR/hour-00.json" | head -20 | sed 's/"id":"//g' | sed 's/"//g' | sort -u
    fi

    echo ""
}

# =============================================================================
# Function: Generate Supabase sync SQL
# =============================================================================
generate_supabase_sql() {
    echo -e "${YELLOW}Supabase 동기화 SQL 생성 중...${NC}"

    SQL_FILE="$PROJECT_ROOT/supabase/migrations/$(date +%Y%m%d)_sync_servers_from_json.sql"

    # Check if jq is available
    if ! command -v jq &> /dev/null; then
        echo -e "${RED}Error: jq is required for SQL generation${NC}"
        echo "Install with: sudo apt install jq"
        exit 1
    fi

    cat > "$SQL_FILE" << 'HEADER'
-- Auto-generated: Sync servers table with Vercel JSON
-- Source: public/hourly-data/hour-00.json
-- Generated: $(date)

-- 1. Clear related tables (FK constraints)
DELETE FROM server_alerts;
DELETE FROM server_metrics;

-- 2. Clear servers
DELETE FROM servers;

-- 3. Insert servers from JSON
INSERT INTO servers (id, name, hostname, type, location, environment, provider, os, ip) VALUES
HEADER

    # Extract server data and generate SQL
    jq -r '.dataPoints[0].servers | to_entries[] | "  (\x27\(.key)\x27, \x27\(.value.name)\x27, \x27\(.value.hostname)\x27, \x27\(.value.type)\x27, \x27\(.value.location)\x27, \x27\(.value.environment)\x27, \x27AWS\x27, \x27\(.value.os)\x27, \x27\(.value.ip)\x27),"' "$SOURCE_DIR/hour-00.json" | sed '$ s/,$/;/' >> "$SQL_FILE"

    echo "" >> "$SQL_FILE"
    echo "-- Verify" >> "$SQL_FILE"
    echo "SELECT COUNT(*) as server_count FROM servers;" >> "$SQL_FILE"

    echo -e "${GREEN}✓ SQL 파일 생성: $SQL_FILE${NC}"
    echo ""
}

# =============================================================================
# Main
# =============================================================================
case "${1:-all}" in
    json)
        sync_json_files
        show_server_ids
        ;;
    supabase)
        generate_supabase_sql
        echo -e "${YELLOW}Supabase 동기화는 다음 명령으로 실행:${NC}"
        echo "  npx supabase db push"
        echo "  또는 Supabase MCP를 통해 직접 실행"
        ;;
    all|*)
        sync_json_files
        show_server_ids
        generate_supabase_sql
        ;;
esac

echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}  동기화 완료!${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo "SSOT: public/hourly-data/hour-XX.json"
echo "Cloud Run: cloud-run/ai-engine/data/hourly-data/"
echo "Supabase: servers 테이블 (15개 서버)"
echo ""
