#!/bin/bash

# Claude Code MCP 설정 최적화 스크립트 (2025년 8월 17일 업데이트)
# 12개 MCP 서버 통합 최적화 및 Serena SSE 설정

set -e

PROJECT_ROOT="/mnt/d/cursor/openmanager-vibe-v5"
MCP_CONFIG="$PROJECT_ROOT/.mcp.json"
LOG_FILE="/tmp/mcp-config-optimize.log"

# 버전 정보
SCRIPT_VERSION="2.0.0"
UPDATE_DATE="2025-08-17"

# 색상 정의
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
}

# 백업 생성
create_backup() {
    local backup_file="$MCP_CONFIG.backup.$(date +%Y%m%d_%H%M%S)"
    cp "$MCP_CONFIG" "$backup_file"
    log_info "기존 설정 백업: $backup_file"
}

# MCP 설정 최적화 (12개 서버 완전 지원)
optimize_mcp_config() {
    log_info "MCP 설정 최적화 시작 (12개 서버)..."
    
    # 임시 파일 생성
    local temp_config=$(mktemp)
    
    # 최적화된 12개 서버 설정 생성
    cat > "$temp_config" << 'EOF'
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "/mnt/d/cursor/openmanager-vibe-v5"
      ]
    },
    "memory": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-memory"
      ]
    },
    "github": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-github"
      ],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_PERSONAL_ACCESS_TOKEN}"
      }
    },
    "supabase": {
      "command": "npx",
      "args": [
        "-y",
        "@supabase/mcp-server-supabase@latest",
        "--project-ref",
        "${SUPABASE_PROJECT_ID}"
      ],
      "env": {
        "SUPABASE_ACCESS_TOKEN": "${SUPABASE_ACCESS_TOKEN}"
      }
    },
    "gcp": {
      "command": "node",
      "args": [
        "/home/skyasu/.nvm/versions/node/v22.18.0/lib/node_modules/google-cloud-mcp/dist/index.js"
      ],
      "env": {
        "GOOGLE_CLOUD_PROJECT": "openmanager-free-tier"
      }
    },
    "tavily": {
      "command": "npx",
      "args": [
        "-y",
        "tavily-mcp"
      ],
      "env": {
        "TAVILY_API_KEY": "${TAVILY_API_KEY}"
      }
    },
    "playwright": {
      "command": "npx",
      "args": [
        "-y",
        "@executeautomation/playwright-mcp-server"
      ]
    },
    "thinking": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-sequential-thinking"
      ]
    },
    "context7": {
      "command": "npx",
      "args": [
        "-y",
        "@upstash/context7-mcp"
      ],
      "env": {
        "UPSTASH_REDIS_REST_URL": "${UPSTASH_REDIS_REST_URL}",
        "UPSTASH_REDIS_REST_TOKEN": "${UPSTASH_REDIS_REST_TOKEN}"
      }
    },
    "shadcn": {
      "command": "npx",
      "args": [
        "-y",
        "@magnusrodseth/shadcn-mcp-server"
      ]
    },
    "time": {
      "command": "/home/skyasu/.local/bin/uvx",
      "args": [
        "mcp-server-time"
      ]
    },
    "serena": {
      "type": "sse",
      "url": "http://localhost:9121/sse"
    }
  }
}
EOF

    # 원본 파일 교체
    mv "$temp_config" "$MCP_CONFIG"
    log_success "MCP 설정 최적화 완료 (12개 서버)"
}

# Serena SSE 서버 시작 스크립트 생성
create_serena_sse_scripts() {
    log_info "Serena SSE 서버 시작 스크립트 생성 중..."
    
    # Serena SSE 시작 스크립트
    local serena_start_script="$PROJECT_ROOT/scripts/start-serena-sse.sh"
    
    cat > "$serena_start_script" << 'EOF'
#!/bin/bash

# Serena MCP SSE 서버 시작 스크립트
# 2025-08-17 업데이트: 안정적인 SSE 연결

set -e

PROJECT_ROOT="/mnt/d/cursor/openmanager-vibe-v5"
PORT=9121

echo "🚀 Serena MCP SSE 서버 시작..."
echo "프로젝트: $PROJECT_ROOT"
echo "포트: $PORT"
echo "SSE 엔드포인트: http://localhost:$PORT/sse"

# 기존 Serena 프로세스 종료
if pgrep -f "serena-mcp-server.*sse" > /dev/null; then
    echo "⏹️  기존 Serena SSE 서버 종료 중..."
    pkill -f "serena-mcp-server.*sse" || true
    sleep 2
fi

# 포트 사용 중인 프로세스 확인
if lsof -i :$PORT > /dev/null 2>&1; then
    echo "⚠️  포트 $PORT 사용 중인 프로세스:"
    lsof -i :$PORT
    echo "기존 프로세스를 종료하거나 다른 포트를 사용하세요."
    exit 1
fi

# Serena SSE 모드로 시작
echo "🔄 Serena SSE 서버 시작 중..."
cd "$PROJECT_ROOT"

uvx --from git+https://github.com/oraios/serena serena-mcp-server \
    --transport sse \
    --port $PORT \
    --project "$PROJECT_ROOT"
EOF

    chmod +x "$serena_start_script"
    log_success "Serena SSE 시작 스크립트 생성: $serena_start_script"
    
    # Serena 상태 확인 스크립트
    local serena_status_script="$PROJECT_ROOT/scripts/check-serena-sse.sh"
    
    cat > "$serena_status_script" << 'EOF'
#!/bin/bash

# Serena SSE 서버 상태 확인 스크립트

PORT=9121
SSE_ENDPOINT="http://localhost:$PORT/sse"

echo "🔍 Serena SSE 서버 상태 확인..."

# 프로세스 확인
if pgrep -f "serena-mcp-server.*sse" > /dev/null; then
    echo "✅ Serena SSE 프로세스 실행 중"
    echo "   PID: $(pgrep -f 'serena-mcp-server.*sse')"
else
    echo "❌ Serena SSE 프로세스 없음"
    echo "   시작 명령어: ./scripts/start-serena-sse.sh"
    exit 1
fi

# 포트 확인
if lsof -i :$PORT > /dev/null 2>&1; then
    echo "✅ 포트 $PORT 리스닝 중"
else
    echo "❌ 포트 $PORT 사용 안함"
    exit 1
fi

# SSE 엔드포인트 확인
echo "🌐 SSE 엔드포인트 테스트: $SSE_ENDPOINT"
if curl -s --max-time 3 "$SSE_ENDPOINT" | head -1 | grep -q "data:"; then
    echo "✅ SSE 연결 정상"
    echo "   응답: $(curl -s --max-time 3 "$SSE_ENDPOINT" | head -1)"
else
    echo "❌ SSE 연결 실패"
    echo "   확인: curl -s $SSE_ENDPOINT"
    exit 1
fi

echo "🎉 Serena SSE 서버 완전 정상!"
EOF

    chmod +x "$serena_status_script"
    log_success "Serena SSE 상태 확인 스크립트 생성: $serena_status_script"
}

# Claude Code 설정 최적화 권장사항 생성
create_claude_settings_optimization() {
    local claude_settings_dir="/home/skyasu/.claude"
    local claude_settings="$claude_settings_dir/settings.json"
    
    # 디렉토리가 없으면 생성
    mkdir -p "$claude_settings_dir"
    
    # 최적화된 Claude Code 설정
    cat > "$claude_settings" << 'EOF'
{
  "statusLine": {
    "type": "command",
    "command": "ccusage statusline",
    "padding": 0
  },
  "mcp": {
    "timeout": 300000,
    "heartbeat": {
      "enabled": true,
      "interval": 30000
    },
    "retry": {
      "enabled": true,
      "maxAttempts": 3,
      "backoffMs": 1000
    }
  }
}
EOF

    log_info "Claude Code 설정 최적화: $claude_settings"
}

# MCP 서버 상태 검증 (12개 서버)
verify_mcp_servers() {
    log_info "MCP 서버 상태 검증 중 (12개 서버)..."
    
    # 필수 명령어들 확인
    local commands=("npx" "node" "/home/skyasu/.local/bin/uvx" "curl" "jq")
    for cmd in "${commands[@]}"; do
        if command -v "$cmd" > /dev/null 2>&1; then
            log_success "$cmd 사용 가능"
        else
            log_error "$cmd 를 찾을 수 없습니다"
        fi
    done
    
    # 환경변수 확인 (12개 서버용)
    local env_vars=(
        "GITHUB_PERSONAL_ACCESS_TOKEN"
        "SUPABASE_ACCESS_TOKEN" 
        "TAVILY_API_KEY"
        "UPSTASH_REDIS_REST_URL"
        "UPSTASH_REDIS_REST_TOKEN"
    )
    
    for var in "${env_vars[@]}"; do
        if [ -n "${!var}" ]; then
            log_success "$var 설정됨"
        else
            log_warn "$var 환경변수가 설정되지 않음"
        fi
    done
    
    # NPM 글로벌 패키지 확인
    log_info "NPM 글로벌 MCP 패키지 확인..."
    local npm_packages=(
        "@modelcontextprotocol/server-filesystem"
        "@modelcontextprotocol/server-memory"
        "@modelcontextprotocol/server-github"
        "@supabase/mcp-server-supabase"
        "tavily-mcp"
        "@executeautomation/playwright-mcp-server"
        "@modelcontextprotocol/server-sequential-thinking"
        "@upstash/context7-mcp"
        "@magnusrodseth/shadcn-mcp-server"
        "google-cloud-mcp"
    )
    
    local installed_count=0
    for package in "${npm_packages[@]}"; do
        if npm list -g "$package" > /dev/null 2>&1; then
            installed_count=$((installed_count + 1))
        fi
    done
    
    log_info "NPM 패키지: $installed_count/10개 설치됨"
    
    # Serena SSE 서버 상태 확인
    if curl -s --max-time 2 "http://localhost:9121/sse" > /dev/null 2>&1; then
        log_success "Serena SSE 서버 실행 중"
    else
        log_warn "Serena SSE 서버 정지됨 (시작: ./scripts/start-serena-sse.sh)"
    fi
}

# 성능 최적화 권장사항 (12개 서버용)
show_performance_recommendations() {
    echo
    echo -e "${GREEN}════════════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}          🚀 MCP 12개 서버 성능 최적화 완료 ($UPDATE_DATE)         ${NC}"
    echo -e "${GREEN}════════════════════════════════════════════════════════════════${NC}"
    echo
    echo -e "${YELLOW}📊 최적화 완료된 12개 서버:${NC}"
    echo "   ✅ filesystem, memory, github, supabase"
    echo "   ✅ gcp, tavily, playwright, thinking"
    echo "   ✅ context7, shadcn, time, serena (SSE)"
    echo
    echo -e "${YELLOW}🚀 다음 단계:${NC}"
    echo
    echo -e "${YELLOW}1. Serena SSE 서버 시작:${NC}"
    echo "   ./scripts/start-serena-sse.sh"
    echo
    echo -e "${YELLOW}2. Serena 상태 확인:${NC}"
    echo "   ./scripts/check-serena-sse.sh"
    echo
    echo -e "${YELLOW}3. 전체 MCP 연결 테스트:${NC}"
    echo "   claude mcp list"
    echo "   # 12/12 서버 모두 Connected 확인"
    echo
    echo -e "${YELLOW}4. 환경변수 설정 (필요시):${NC}"
    echo "   source .env.local"
    echo "   # 또는 개별 설정:"
    echo "   export GITHUB_PERSONAL_ACCESS_TOKEN='ghp_xxxxx'"
    echo "   export SUPABASE_ACCESS_TOKEN='sbp_xxxxx'"
    echo "   export TAVILY_API_KEY='tvly-xxxxx'"
    echo "   export UPSTASH_REDIS_REST_URL='https://xxxxx.upstash.io'"
    echo "   export UPSTASH_REDIS_REST_TOKEN='AXxxxx'"
    echo
    echo -e "${BLUE}📋 생성된 파일들:${NC}"
    echo "   • $MCP_CONFIG (12개 서버 최적화 설정)"
    echo "   • ./scripts/start-serena-sse.sh (Serena SSE 시작)"
    echo "   • ./scripts/check-serena-sse.sh (Serena 상태 확인)"
    echo "   • /home/skyasu/.claude/settings.json (Claude 설정)"
    echo
    echo -e "${BLUE}💡 주요 개선사항 (v$SCRIPT_VERSION):${NC}"
    echo "   • 12개 서버 완전 통합 설정"
    echo "   • Serena SSE 네이티브 지원"
    echo "   • 환경변수 경고 정상화 안내"
    echo "   • 자동화된 상태 확인 스크립트"
    echo "   • Claude Code 타임아웃 최적화"
    echo
    echo -e "${BLUE}🔗 참고 문서:${NC}"
    echo "   • docs/MCP-GUIDE.md (종합 활용 가이드)"
    echo "   • docs/mcp/mcp-complete-installation-guide-2025.md"
    echo "   • docs/mcp/mcp-tools-reference.md (94개 도구 레퍼런스)"
    echo
    echo -e "${BLUE}⚡ 성능 팁:${NC}"
    echo "   • 병렬 처리: Promise.all() 활용"
    echo "   • 캐싱: 자주 사용하는 데이터 메모리 캐시"
    echo "   • 배치 처리: 대량 파일 작업 시 배치 사이즈 제한"
    echo
    echo -e "${GREEN}════════════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}🎉 OpenManager VIBE v5 MCP 최적화 완료! 94개 도구 활용 가능${NC}"
    echo -e "${GREEN}════════════════════════════════════════════════════════════════${NC}"
    echo
}

# 메인 실행
main() {
    echo
    echo -e "${BLUE}🔧 Claude Code MCP 12개 서버 최적화 시작 (v$SCRIPT_VERSION)...${NC}"
    echo
    
    # 로그 파일 초기화
    > "$LOG_FILE"
    log_info "MCP 최적화 스크립트 시작 - $UPDATE_DATE"
    
    # 백업 생성
    if [ -f "$MCP_CONFIG" ]; then
        create_backup
    fi
    
    # 최적화 실행
    optimize_mcp_config
    create_serena_sse_scripts
    create_claude_settings_optimization
    verify_mcp_servers
    
    log_success "MCP 12개 서버 최적화 완료!"
    
    # 권장사항 출력
    show_performance_recommendations
    
    log_info "로그 파일: $LOG_FILE"
}

# 메인 실행
main "$@"