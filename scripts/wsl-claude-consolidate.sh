#!/bin/bash

# WSL Claude 설정 통합 스크립트
# 글로벌 설정을 프로젝트 로컬로 실제 이동/통합

set -e

PROJECT_DIR="/mnt/d/cursor/openmanager-vibe-v5"
GLOBAL_CLAUDE="$HOME/.claude"
LOCAL_CLAUDE="$PROJECT_DIR/.claude"

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🔧 WSL Claude 설정 통합 스크립트"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${YELLOW}⚠️  주의: 이 스크립트는 글로벌 설정을 프로젝트로 이동합니다${NC}"
echo "   글로벌: $GLOBAL_CLAUDE"
echo "   로컬:  $LOCAL_CLAUDE"
echo ""
read -p "계속하시겠습니까? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}취소됨${NC}"
    exit 1
fi
echo ""

# 1. 백업 생성
BACKUP_DIR="$LOCAL_CLAUDE/backup-global-$(date +%Y%m%d-%H%M%S)"
echo "📦 글로벌 설정 백업 중..."
if [ -d "$GLOBAL_CLAUDE" ]; then
    mkdir -p "$BACKUP_DIR"
    cp -r "$GLOBAL_CLAUDE"/* "$BACKUP_DIR/" 2>/dev/null || true
    echo "✅ 백업 완료: $BACKUP_DIR"
fi

# 2. 인증 정보 통합
if [ -f "$GLOBAL_CLAUDE/.credentials.json" ]; then
    echo "🔑 인증 정보 통합..."
    cp "$GLOBAL_CLAUDE/.credentials.json" "$LOCAL_CLAUDE/.credentials.json"
    chmod 600 "$LOCAL_CLAUDE/.credentials.json"
    echo "✅ 인증 정보 통합 완료"
fi

# 3. shell-snapshots 정리
echo "🧹 스냅샷 파일 정리 중..."
SNAPSHOT_COUNT=$(find "$LOCAL_CLAUDE/shell-snapshots" -name "*.sh" 2>/dev/null | wc -l)
if [ "$SNAPSHOT_COUNT" -gt 100 ]; then
    echo "   발견된 스냅샷: $SNAPSHOT_COUNT개"
    # 7일 이상된 스냅샷 삭제
    find "$LOCAL_CLAUDE/shell-snapshots" -name "*.sh" -mtime +7 -delete 2>/dev/null || true
    NEW_COUNT=$(find "$LOCAL_CLAUDE/shell-snapshots" -name "*.sh" 2>/dev/null | wc -l)
    echo "✅ 정리 완료: $((SNAPSHOT_COUNT - NEW_COUNT))개 삭제, $NEW_COUNT개 유지"
fi

# 4. MCP 설정 준비
echo "🤖 MCP 설정 준비..."
MCP_CONFIG="$LOCAL_CLAUDE/mcp-config.json"
if [ ! -f "$MCP_CONFIG" ]; then
    cat > "$MCP_CONFIG" << 'EOF'
{
  "mcpServers": {
    "filesystem": {
      "command": "node",
      "args": ["./mcp-servers/filesystem.js"],
      "env": {
        "ALLOWED_PATHS": "/mnt/d/cursor/openmanager-vibe-v5"
      }
    }
  },
  "subagents": {
    "docs-organizer": {
      "enabled": true,
      "config": "./claude-project.json"
    }
  }
}
EOF
    echo "✅ MCP 설정 파일 생성: $MCP_CONFIG"
fi

# 5. 환경 변수 설정
echo "🌍 환경 변수 설정..."
BASHRC_MARKER="# Claude Code WSL Settings"
if ! grep -q "$BASHRC_MARKER" ~/.bashrc; then
    cat >> ~/.bashrc << EOF

$BASHRC_MARKER
export CLAUDE_HOME="$LOCAL_CLAUDE"
export CLAUDE_PROJECT_ROOT="$PROJECT_DIR"
export CLAUDE_MCP_CONFIG="$LOCAL_CLAUDE/mcp-config.json"
alias claude-status='ls -la $LOCAL_CLAUDE'
alias claude-clean='find $LOCAL_CLAUDE/shell-snapshots -name "*.sh" -mtime +7 -delete'
EOF
    echo "✅ ~/.bashrc 업데이트 완료"
fi

# 6. 글로벌 설정 파일 이동 및 통합
echo "📦 글로벌 설정 이동 중..."
if [ -d "$GLOBAL_CLAUDE" ]; then
    # projects 디렉토리 통합
    if [ -d "$GLOBAL_CLAUDE/projects" ]; then
        echo "   프로젝트 데이터 통합..."
        cp -rn "$GLOBAL_CLAUDE/projects/"* "$LOCAL_CLAUDE/projects/" 2>/dev/null || true
    fi
    
    # todos 디렉토리 통합
    if [ -d "$GLOBAL_CLAUDE/todos" ]; then
        echo "   Todo 데이터 통합..."
        mkdir -p "$LOCAL_CLAUDE/todos"
        cp -rn "$GLOBAL_CLAUDE/todos/"* "$LOCAL_CLAUDE/todos/" 2>/dev/null || true
    fi
    
    # statsig 디렉토리 통합
    if [ -d "$GLOBAL_CLAUDE/statsig" ]; then
        echo "   통계 데이터 통합..."
        mkdir -p "$LOCAL_CLAUDE/statsig"
        cp -rn "$GLOBAL_CLAUDE/statsig/"* "$LOCAL_CLAUDE/statsig/" 2>/dev/null || true
    fi
    
    # 글로벌 shell-snapshots 정리 후 이동
    if [ -d "$GLOBAL_CLAUDE/shell-snapshots" ]; then
        echo "   글로벌 스냅샷 정리 및 이동..."
        # 최근 7일 내 스냅샷만 복사
        find "$GLOBAL_CLAUDE/shell-snapshots" -name "*.sh" -mtime -7 -exec cp {} "$LOCAL_CLAUDE/shell-snapshots/" \; 2>/dev/null || true
    fi
    
    # 글로벌 디렉토리 제거 (백업은 이미 완료)
    echo "   글로벌 디렉토리 정리..."
    rm -rf "$GLOBAL_CLAUDE"
    echo "✅ 글로벌 설정을 프로젝트로 통합 완료"
else
    echo "ℹ️  글로벌 설정 없음 (이미 통합된 상태)"
fi

# 7. 권한 설정
echo "🔒 권한 설정..."
chmod 700 "$LOCAL_CLAUDE"
chmod 600 "$LOCAL_CLAUDE"/.credentials.json 2>/dev/null || true
chmod 644 "$LOCAL_CLAUDE"/settings*.json 2>/dev/null || true

# 8. 통합 검증
echo "🔍 통합 검증 중..."
VERIFICATION_PASSED=true

# 필수 파일 확인
if [ ! -f "$LOCAL_CLAUDE/.credentials.json" ]; then
    echo -e "${YELLOW}⚠️  인증 파일 없음 (첫 실행 시 생성됨)${NC}"
fi

if [ ! -d "$LOCAL_CLAUDE/projects" ]; then
    echo -e "${RED}❌ projects 디렉토리 없음${NC}"
    VERIFICATION_PASSED=false
fi

# 9. 통합 로그 생성
LOG_FILE="$LOCAL_CLAUDE/consolidation-$(date +%Y%m%d-%H%M%S).log"
cat > "$LOG_FILE" << EOF
=== WSL Claude 설정 통합 로그 ===
실행 시간: $(date)
글로벌 경로: $GLOBAL_CLAUDE (제거됨)
로컬 경로: $LOCAL_CLAUDE
백업 경로: $BACKUP_DIR
스냅샷 정리: $(find "$LOCAL_CLAUDE/shell-snapshots" -name "*.sh" 2>/dev/null | wc -l)개 유지
EOF

# 10. 최종 상태 확인
echo ""
echo "📊 통합 결과:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ 프로젝트 Claude 디렉토리: $LOCAL_CLAUDE${NC}"
echo -e "${GREEN}✅ 스냅샷 파일: $(find "$LOCAL_CLAUDE/shell-snapshots" -name "*.sh" 2>/dev/null | wc -l)개${NC}"
echo -e "${GREEN}✅ 설정 파일: $(ls -1 "$LOCAL_CLAUDE"/*.json 2>/dev/null | wc -l)개${NC}"
echo -e "${GREEN}✅ 백업 위치: $BACKUP_DIR${NC}"
echo -e "${GREEN}✅ 로그 파일: $LOG_FILE${NC}"

if [ "$VERIFICATION_PASSED" = true ]; then
    echo ""
    echo -e "${GREEN}🎉 통합 완료!${NC}"
    echo ""
    echo "다음 단계:"
    echo "1. 새 터미널 열기 또는: source ~/.bashrc"
    echo "2. 상태 확인: claude-status"
    echo "3. 스냅샷 정리: claude-clean"
else
    echo ""
    echo -e "${YELLOW}⚠️  일부 검증 실패 - 로그 확인 필요${NC}"
fi