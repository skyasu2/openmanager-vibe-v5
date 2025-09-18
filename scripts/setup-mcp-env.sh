#!/bin/bash

# 🚀 MCP 서버 환경변수 자동 설정 스크립트
# OpenManager VIBE v5 - Claude Code MCP 서버 환경변수 자동 로드

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 MCP 환경변수 자동 설정 시작...${NC}"
echo "======================================="

# 프로젝트 루트 경로 확인
PROJECT_ROOT="/mnt/d/cursor/openmanager-vibe-v5"
ENV_LOCAL_FILE="$PROJECT_ROOT/.env.local"

if [ ! -f "$ENV_LOCAL_FILE" ]; then
    echo -e "${RED}❌ .env.local 파일을 찾을 수 없습니다: $ENV_LOCAL_FILE${NC}"
    exit 1
fi

echo -e "${GREEN}✅ .env.local 파일 발견: $ENV_LOCAL_FILE${NC}"

# MCP 관련 환경변수 추출 및 export
echo -e "${BLUE}📋 환경변수 로드 중...${NC}"

# Context7 API 키 로드
export_context7() {
    local api_key=$(grep "^CONTEXT7_API_KEY=" "$ENV_LOCAL_FILE" | cut -d'=' -f2-)

    if [ -n "$api_key" ]; then
        export CONTEXT7_API_KEY="$api_key"
        echo -e "${GREEN}  ✅ CONTEXT7_API_KEY 설정됨${NC}"
    else
        echo -e "${YELLOW}  ⚠️  CONTEXT7_API_KEY 없음${NC}"
    fi
}

# Context7 (Upstash) 환경변수
export_upstash() {
    local url_val=$(grep "^UPSTASH_REDIS_REST_URL=" "$ENV_LOCAL_FILE" | cut -d'=' -f2-)
    local token_val=$(grep "^UPSTASH_REDIS_REST_TOKEN=" "$ENV_LOCAL_FILE" | cut -d'=' -f2-)
    local kv_url_val=$(grep "^KV_REST_API_URL=" "$ENV_LOCAL_FILE" | cut -d'=' -f2-)
    local kv_token_val=$(grep "^KV_REST_API_TOKEN=" "$ENV_LOCAL_FILE" | cut -d'=' -f2-)
    
    # UPSTASH_REDIS_REST_* 형식 우선
    if [ -n "$url_val" ]; then
        export UPSTASH_REDIS_REST_URL="$url_val"
        echo -e "${GREEN}  ✅ UPSTASH_REDIS_REST_URL 설정됨${NC}"
    elif [ -n "$kv_url_val" ]; then
        export UPSTASH_REDIS_REST_URL="$kv_url_val"
        echo -e "${GREEN}  ✅ UPSTASH_REDIS_REST_URL 설정됨 (KV_REST_API_URL에서)${NC}"
    else
        echo -e "${YELLOW}  ⚠️  UPSTASH_REDIS_REST_URL 없음${NC}"
    fi
    
    if [ -n "$token_val" ]; then
        export UPSTASH_REDIS_REST_TOKEN="$token_val"
        echo -e "${GREEN}  ✅ UPSTASH_REDIS_REST_TOKEN 설정됨${NC}"
    elif [ -n "$kv_token_val" ]; then
        export UPSTASH_REDIS_REST_TOKEN="$kv_token_val"
        echo -e "${GREEN}  ✅ UPSTASH_REDIS_REST_TOKEN 설정됨 (KV_REST_API_TOKEN에서)${NC}"
    else
        echo -e "${YELLOW}  ⚠️  UPSTASH_REDIS_REST_TOKEN 없음${NC}"
    fi
    
    # KV_REST_API_* 형식도 export (Context7이 이것을 사용할 경우 대비)
    if [ -n "$kv_url_val" ]; then
        export KV_REST_API_URL="$kv_url_val"
        echo -e "${GREEN}  ✅ KV_REST_API_URL 설정됨${NC}"
    fi
    
    if [ -n "$kv_token_val" ]; then
        export KV_REST_API_TOKEN="$kv_token_val"
        echo -e "${GREEN}  ✅ KV_REST_API_TOKEN 설정됨${NC}"
    fi
}

# Supabase 환경변수
export_supabase() {
    local url_val=$(grep "^SUPABASE_URL=" "$ENV_LOCAL_FILE" | cut -d'=' -f2-)
    local anon_key_val=$(grep "^NEXT_PUBLIC_SUPABASE_ANON_KEY=" "$ENV_LOCAL_FILE" | cut -d'=' -f2-)
    local service_key_val=$(grep "^SUPABASE_SERVICE_ROLE_KEY=" "$ENV_LOCAL_FILE" | cut -d'=' -f2-)
    local access_token_val=$(grep "^SUPABASE_ACCESS_TOKEN=" "$ENV_LOCAL_FILE" | cut -d'=' -f2-)
    
    if [ -n "$url_val" ]; then
        export SUPABASE_URL="$url_val"
        echo -e "${GREEN}  ✅ SUPABASE_URL 설정됨${NC}"
    fi
    
    if [ -n "$anon_key_val" ]; then
        export SUPABASE_ANON_KEY="$anon_key_val"  # MCP가 읽을 키 이름
        echo -e "${GREEN}  ✅ SUPABASE_ANON_KEY 설정됨${NC}"
    else
        echo -e "${YELLOW}  ⚠️  SUPABASE_ANON_KEY 없음${NC}"
    fi
    
    if [ -n "$service_key_val" ]; then
        export SUPABASE_SERVICE_ROLE_KEY="$service_key_val"
        echo -e "${GREEN}  ✅ SUPABASE_SERVICE_ROLE_KEY 설정됨${NC}"
    fi
    
    if [ -n "$access_token_val" ]; then
        export SUPABASE_ACCESS_TOKEN="$access_token_val"
        echo -e "${GREEN}  ✅ SUPABASE_ACCESS_TOKEN 설정됨${NC}"
    fi
}

# Vercel 환경변수
export_vercel() {
    local token_val=$(grep "^VERCEL_TOKEN=" "$ENV_LOCAL_FILE" | cut -d'=' -f2-)
    
    if [ -n "$token_val" ]; then
        export VERCEL_TOKEN="$token_val"
        echo -e "${GREEN}  ✅ VERCEL_TOKEN 설정됨${NC}"
    else
        echo -e "${YELLOW}  ⚠️  VERCEL_TOKEN 없음 - Vercel MCP 서버 사용 불가${NC}"
    fi
}

# 환경변수 로드 실행
echo -e "${BLUE}🔧 Context7 API 키:${NC}"
export_context7

echo -e "${BLUE}🔧 Context7 (Upstash) 환경변수:${NC}"
export_upstash

echo -e "${BLUE}🔧 Supabase 환경변수:${NC}"
export_supabase

echo -e "${BLUE}🔧 Vercel 환경변수:${NC}"
export_vercel

# 추가 MCP 관련 환경변수 설정
echo -e "${BLUE}🔧 추가 MCP 설정:${NC}"
export MCP_TIMEOUT=300000
export UV_THREADPOOL_SIZE=16
export NODE_OPTIONS="--dns-result-order=ipv4first --max-old-space-size=8192"
echo -e "${GREEN}  ✅ MCP 타임아웃 및 성능 설정 완료${NC}"

# .bashrc에 자동 로드 설정 추가
BASHRC_FILE="$HOME/.bashrc"
MCP_ENV_LOADER="# OpenManager VIBE v5 - MCP 환경변수 자동 로드
if [ -f \"$PROJECT_ROOT/scripts/setup-mcp-env.sh\" ]; then
    source \"$PROJECT_ROOT/scripts/setup-mcp-env.sh\" > /dev/null 2>&1
fi"

echo -e "${BLUE}📝 .bashrc 자동 로드 설정 중...${NC}"

if ! grep -q "OpenManager VIBE v5 - MCP 환경변수" "$BASHRC_FILE"; then
    echo "" >> "$BASHRC_FILE"
    echo "$MCP_ENV_LOADER" >> "$BASHRC_FILE"
    echo -e "${GREEN}✅ .bashrc에 자동 로드 설정 추가됨${NC}"
else
    echo -e "${YELLOW}⚠️  .bashrc에 이미 설정되어 있음${NC}"
fi

echo -e "${GREEN}🎉 MCP 환경변수 설정 완료!${NC}"
echo ""
echo -e "${BLUE}📋 다음 단계:${NC}"
echo "1. 새 터미널 세션에서 자동으로 환경변수가 로드됩니다"
echo "2. 현재 세션에서 즉시 적용하려면: source ~/.bashrc"
echo "3. VERCEL_TOKEN이 없다면 https://vercel.com/account/tokens에서 생성하세요"
echo "4. MCP 서버를 재시작하세요: claude mcp list"