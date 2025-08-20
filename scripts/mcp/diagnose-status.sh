#!/bin/bash

# MCP 서버 상태 진단 도구
# 작성일: 2025-08-20
# 용도: MCP 서버 연결 상태 종합 진단 및 문제 해결 가이드

set -e

echo "🔍 MCP 서버 상태 진단 도구 v2.0"
echo "================================"
echo "진단 시작: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

# 색상 코드
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 진단 결과 저장
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0
WARNINGS=0

# 체크 함수
check() {
    local name="$1"
    local command="$2"
    local success_msg="$3"
    local fail_msg="$4"
    
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    echo -n "  $name: "
    
    if eval "$command" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ $success_msg${NC}"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
        return 0
    else
        echo -e "${RED}❌ $fail_msg${NC}"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
        return 1
    fi
}

# 경고 체크 함수
check_warning() {
    local name="$1"
    local command="$2"
    local success_msg="$3"
    local warn_msg="$4"
    
    echo -n "  $name: "
    
    if eval "$command" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ $success_msg${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠️  $warn_msg${NC}"
        WARNINGS=$((WARNINGS + 1))
        return 1
    fi
}

# 1. 환경 확인
echo -e "${BLUE}[1/6] 시스템 환경 확인${NC}"
echo "------------------------"
check "운영체제" "uname -a | grep -E 'Linux|Darwin'" "$(uname -s) $(uname -r)" "지원되지 않는 OS"
check "홈 디렉토리" "[ -d $HOME ]" "$HOME" "홈 디렉토리 없음"
check "작업 디렉토리" "[ -d /mnt/d/cursor/openmanager-vibe-v5 ]" "프로젝트 디렉토리 확인" "프로젝트 디렉토리 없음"
echo ""

# 2. 의존성 확인
echo -e "${BLUE}[2/6] 의존성 확인${NC}"
echo "------------------------"
check "Node.js" "command -v node" "$(node --version 2>/dev/null)" "Node.js 미설치"
check "npm" "command -v npm" "$(npm --version 2>/dev/null)" "npm 미설치"
check "Python3" "command -v python3" "$(python3 --version 2>/dev/null)" "Python3 미설치"
check_warning "uvx" "command -v uvx" "$(uvx --version 2>/dev/null)" "uvx 미설치 (Time, Serena MCP 필요)"
check_warning "GCP CLI" "command -v gcloud" "설치됨" "GCP CLI 미설치 (GCP MCP 필요)"
check_warning "jq" "command -v jq" "$(jq --version 2>/dev/null)" "jq 미설치 (JSON 파싱용)"
echo ""

# 3. 환경변수 확인
echo -e "${BLUE}[3/6] 환경변수 확인${NC}"
echo "------------------------"

# .env.local 파일 존재 확인
if [ -f .env.local ]; then
    echo -e "  .env.local: ${GREEN}✅ 파일 존재${NC}"
    
    # 환경변수 로딩
    export $(grep -v '^#' .env.local | xargs) 2>/dev/null || true
    
    # 필수 환경변수 체크
    check "GitHub Token" "[ ! -z \"\$GITHUB_PERSONAL_ACCESS_TOKEN\" ]" "설정됨 ($(echo $GITHUB_PERSONAL_ACCESS_TOKEN | head -c 10)...)" "미설정"
    check "Supabase Token" "[ ! -z \"\$SUPABASE_ACCESS_TOKEN\" ]" "설정됨" "미설정"
    check "Tavily API Key" "[ ! -z \"\$TAVILY_API_KEY\" ]" "설정됨" "미설정"
    check_warning "Upstash Redis URL" "[ ! -z \"\$UPSTASH_REDIS_REST_URL\" ]" "설정됨" "미설정 (Context7 MCP 필요)"
    check_warning "GCP Project ID" "[ ! -z \"\$GCP_PROJECT_ID\" ]" "설정됨" "미설정 (GCP MCP 필요)"
else
    echo -e "  .env.local: ${RED}❌ 파일 없음${NC}"
    echo -e "  ${YELLOW}→ cp .env.local.example .env.local 실행 필요${NC}"
fi
echo ""

# 4. MCP 설정 파일 확인
echo -e "${BLUE}[4/6] MCP 설정 확인${NC}"
echo "------------------------"

if [ -f .mcp.json ]; then
    echo -e "  .mcp.json: ${GREEN}✅ 파일 존재${NC}"
    
    # 서버 개수 확인
    if command -v jq > /dev/null 2>&1; then
        SERVER_COUNT=$(cat .mcp.json | jq '.mcpServers | length')
        echo -e "  MCP 서버 수: ${GREEN}$SERVER_COUNT개 설정됨${NC}"
        
        # 각 서버 설정 확인
        echo -e "  설정된 서버 목록:"
        cat .mcp.json | jq -r '.mcpServers | keys[]' | while read server; do
            echo -e "    • $server"
        done
    else
        echo -e "  ${YELLOW}⚠️  jq 미설치로 상세 분석 불가${NC}"
    fi
else
    echo -e "  .mcp.json: ${RED}❌ 파일 없음${NC}"
fi
echo ""

# 5. Claude Code 프로세스 확인
echo -e "${BLUE}[5/6] Claude Code 상태${NC}"
echo "------------------------"

if pgrep -f claude > /dev/null; then
    echo -e "  Claude Code: ${GREEN}✅ 실행 중${NC}"
    
    # 프로세스 정보
    CLAUDE_PID=$(pgrep -f claude | head -1)
    echo -e "  프로세스 ID: $CLAUDE_PID"
    
    # MCP 서버 프로세스 확인
    MCP_PROCESSES=$(ps aux | grep -E "(mcp|modelcontext)" | grep -v grep | wc -l)
    echo -e "  MCP 프로세스: ${GREEN}$MCP_PROCESSES개 실행 중${NC}"
else
    echo -e "  Claude Code: ${YELLOW}⚠️  실행되지 않음${NC}"
    echo -e "  ${YELLOW}→ Claude Code 시작 필요${NC}"
fi
echo ""

# 6. 네트워크 연결 테스트
echo -e "${BLUE}[6/6] 외부 서비스 연결 테스트${NC}"
echo "------------------------"

# GitHub API 테스트
if [ ! -z "$GITHUB_PERSONAL_ACCESS_TOKEN" ]; then
    check "GitHub API" "curl -s -H \"Authorization: token $GITHUB_PERSONAL_ACCESS_TOKEN\" https://api.github.com/user | grep -q login" "연결 성공" "연결 실패 (토큰 확인 필요)"
else
    echo -e "  GitHub API: ${YELLOW}⚠️  토큰 미설정으로 테스트 생략${NC}"
fi

# Supabase 연결 테스트
if [ ! -z "$SUPABASE_URL" ]; then
    check_warning "Supabase" "curl -s $SUPABASE_URL/rest/v1/ -o /dev/null" "연결 가능" "연결 불가"
fi
echo ""

# 진단 결과 요약
echo "================================"
echo -e "${BLUE}📊 진단 결과 요약${NC}"
echo "================================"
echo -e "총 검사 항목: $TOTAL_CHECKS"
echo -e "✅ 통과: ${GREEN}$PASSED_CHECKS${NC}"
echo -e "❌ 실패: ${RED}$FAILED_CHECKS${NC}"
echo -e "⚠️  경고: ${YELLOW}$WARNINGS${NC}"

# 성공률 계산
if [ $TOTAL_CHECKS -gt 0 ]; then
    SUCCESS_RATE=$((PASSED_CHECKS * 100 / TOTAL_CHECKS))
    echo -e "성공률: ${GREEN}$SUCCESS_RATE%${NC}"
fi
echo ""

# 권장 조치사항
if [ $FAILED_CHECKS -gt 0 ] || [ $WARNINGS -gt 0 ]; then
    echo "================================"
    echo -e "${YELLOW}💡 권장 조치사항${NC}"
    echo "================================"
    
    if [ $FAILED_CHECKS -gt 0 ]; then
        echo -e "${RED}필수 해결 사항:${NC}"
        echo "1. 실패한 항목들을 우선 해결하세요"
        echo "2. ./install-dependencies.sh 실행으로 의존성 설치"
        echo "3. .env.local 파일 설정 및 source .env.local 실행"
        echo ""
    fi
    
    if [ $WARNINGS -gt 0 ]; then
        echo -e "${YELLOW}선택적 개선사항:${NC}"
        echo "• uvx 설치: curl -LsSf https://astral.sh/uv/install.sh | sh"
        echo "• GCP CLI 설치: https://cloud.google.com/sdk/docs/install"
        echo "• jq 설치: sudo apt-get install jq"
    fi
else
    echo -e "${GREEN}🎉 모든 검사를 통과했습니다!${NC}"
    echo "MCP 서버를 사용할 준비가 완료되었습니다."
fi

echo ""
echo "진단 완료: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""
echo "💡 추가 도움말:"
echo "  • MCP 테스트: ./test-mcp-servers.sh"
echo "  • 자동 복구: ./mcp-auto-recovery.sh"
echo "  • 가이드 문서: docs/mcp/mcp-complete-setup-guide-2025.md"