#!/bin/bash

# ===============================================
# MCP 서버 자동 복구 메커니즘 스크립트
# OpenManager VIBE v5 - Agent Coordinator
# ===============================================

set -e

# 색상 코드
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# 설정
RECOVERY_LOG="mcp_recovery_$(date +%Y%m%d).log"
MAX_RETRY_COUNT=3
RECOVERY_TIMEOUT=30
HEALTH_CHECK_INTERVAL=5

# 로그 함수
log_info() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${BLUE}[RECOVERY $timestamp]${NC} $1" | tee -a "$RECOVERY_LOG"
}

log_success() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${GREEN}[SUCCESS $timestamp]${NC} $1" | tee -a "$RECOVERY_LOG"
}

log_warning() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${YELLOW}[WARNING $timestamp]${NC} $1" | tee -a "$RECOVERY_LOG"
}

log_error() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${RED}[ERROR $timestamp]${NC} $1" | tee -a "$RECOVERY_LOG"
}

# MCP 서버 연결 상태 확인
check_server_health() {
    local server_name="$1"
    
    if timeout 10s claude mcp list 2>/dev/null | grep -q "${server_name}.*Connected"; then
        return 0  # 연결됨
    else
        return 1  # 연결 안됨
    fi
}

# Claude API 재시작
restart_claude_api() {
    log_info "🔄 Claude API 재시작 시도..."
    
    if command -v claude &> /dev/null; then
        # Claude API 재시작
        if claude api restart 2>/dev/null; then
            log_success "Claude API 재시작 완료"
            sleep 5  # 재시작 대기
            return 0
        else
            log_error "Claude API 재시작 실패"
            return 1
        fi
    else
        log_error "Claude CLI를 찾을 수 없습니다"
        return 1
    fi
}

# 특정 MCP 서버 재연결
reconnect_server() {
    local server_name="$1"
    local retry_count=0
    
    log_info "🔌 ${server_name} MCP 서버 재연결 시도..."
    
    while [[ $retry_count -lt $MAX_RETRY_COUNT ]]; do
        retry_count=$((retry_count + 1))
        log_info "재시도 ${retry_count}/${MAX_RETRY_COUNT}: ${server_name}"
        
        # 서버별 특별 처리
        case "$server_name" in
            "serena")
                # serena는 Git 의존성 문제로 특별 처리
                log_warning "serena 서버는 폴백 모드로 전환"
                activate_serena_fallback
                return 0
                ;;
            "filesystem")
                # filesystem 서버 재설정
                if claude mcp remove filesystem 2>/dev/null && \
                   claude mcp add filesystem npx -- -y @modelcontextprotocol/server-filesystem@latest /mnt/d/cursor/openmanager-vibe-v5; then
                    log_success "${server_name} 재연결 성공"
                    return 0
                fi
                ;;
            "supabase")
                # supabase 환경변수 확인 후 재연결
                if [[ -z "$SUPABASE_URL" ]] || [[ -z "$SUPABASE_SERVICE_ROLE_KEY" ]]; then
                    log_error "Supabase 환경변수 누락"
                    return 1
                fi
                
                if claude mcp remove supabase 2>/dev/null && \
                   claude mcp add supabase npx -e SUPABASE_URL="$SUPABASE_URL" -e SUPABASE_SERVICE_ROLE_KEY="$SUPABASE_SERVICE_ROLE_KEY" -- -y @supabase/mcp-server-supabase@latest --project-ref="${SUPABASE_URL##*/}"; then
                    log_success "${server_name} 재연결 성공"
                    return 0
                fi
                ;;
            *)
                # 일반 서버 재연결 시도
                sleep $((retry_count * 2))  # 백오프 지연
                
                if check_server_health "$server_name"; then
                    log_success "${server_name} 자동 복구됨"
                    return 0
                fi
                ;;
        esac
        
        sleep $HEALTH_CHECK_INTERVAL
    done
    
    log_error "${server_name} 복구 실패 (${MAX_RETRY_COUNT}회 시도)"
    return 1
}

# serena 폴백 메커니즘 활성화
activate_serena_fallback() {
    log_info "🔧 serena 폴백 메커니즘 활성화..."
    
    # 폴백 우선순위: context7 → github
    local fallback_servers=("context7" "github")
    
    for fallback in "${fallback_servers[@]}"; do
        if check_server_health "$fallback"; then
            log_success "폴백 서버 활성화: $fallback"
            
            # 폴백 설정 파일 업데이트
            cat > "/tmp/active_serena_fallback.json" << EOF
{
  "active_fallback": "$fallback",
  "activated_at": "$(date '+%Y-%m-%d %H:%M:%S')",
  "reason": "serena MCP 서버 연결 실패",
  "capabilities": {
    "context7": ["라이브러리 문서 분석", "코드 참조 검색"],
    "github": ["저장소 코드 분석", "PR/이슈 관리"]
  }
}
EOF
            return 0
        fi
    done
    
    log_error "모든 폴백 서버 연결 실패"
    return 1
}

# 시스템 리소스 확인
check_system_resources() {
    log_info "💻 시스템 리소스 확인..."
    
    # 메모리 사용량 확인
    local memory_usage=$(free | awk 'NR==2{printf "%.1f", $3*100/$2}')
    log_info "메모리 사용률: ${memory_usage}%"
    
    if (( $(echo "$memory_usage > 90" | bc -l) )); then
        log_warning "높은 메모리 사용률 감지: ${memory_usage}%"
        
        # Node.js 프로세스 정리
        if pgrep -f "node.*mcp" > /dev/null; then
            log_info "MCP 관련 Node.js 프로세스 정리 시도..."
            pkill -f "node.*mcp" || true
            sleep 3
        fi
    fi
    
    # 디스크 공간 확인
    local disk_usage=$(df /tmp | awk 'NR==2{print $5}' | sed 's/%//')
    log_info "임시 디스크 사용률: ${disk_usage}%"
    
    if [[ $disk_usage -gt 90 ]]; then
        log_warning "디스크 공간 부족: ${disk_usage}%"
        
        # 임시 파일 정리
        find /tmp -name "mcp_*" -mtime +1 -delete 2>/dev/null || true
        log_info "오래된 MCP 임시 파일 정리 완료"
    fi
}

# 환경변수 검증
validate_environment() {
    log_info "🔍 MCP 환경변수 검증..."
    
    local required_vars=(
        "GITHUB_PERSONAL_ACCESS_TOKEN"
        "SUPABASE_URL"
        "SUPABASE_SERVICE_ROLE_KEY"
        "UPSTASH_REDIS_REST_URL"
        "UPSTASH_REDIS_REST_TOKEN"
    )
    
    local missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var}" ]]; then
            missing_vars+=("$var")
        fi
    done
    
    if [[ ${#missing_vars[@]} -gt 0 ]]; then
        log_error "누락된 환경변수: ${missing_vars[*]}"
        
        # .env.local 파일 확인
        if [[ -f ".env.local" ]]; then
            log_info ".env.local 파일에서 환경변수 로드 시도..."
            source .env.local
            log_success "환경변수 로드 완료"
        else
            log_error ".env.local 파일을 찾을 수 없습니다"
            return 1
        fi
    else
        log_success "모든 필수 환경변수 확인됨"
    fi
    
    return 0
}

# 포트 충돌 해결
resolve_port_conflicts() {
    log_info "🔌 포트 충돌 해결..."
    
    # MCP 서버가 사용할 수 있는 포트 범위에서 충돌 확인
    local mcp_ports=(3001 3002 3003 3004 3005)
    
    for port in "${mcp_ports[@]}"; do
        if netstat -tuln 2>/dev/null | grep -q ":${port} "; then
            local pid=$(lsof -ti:$port 2>/dev/null || echo "")
            if [[ -n "$pid" ]]; then
                log_warning "포트 $port 충돌 감지 (PID: $pid)"
                
                # MCP 관련 프로세스가 아니면 종료하지 않음
                local process_name=$(ps -p "$pid" -o comm= 2>/dev/null || echo "unknown")
                if [[ "$process_name" == *"node"* ]] || [[ "$process_name" == *"mcp"* ]]; then
                    log_info "MCP 관련 프로세스 종료: $pid"
                    kill -TERM "$pid" 2>/dev/null || true
                    sleep 2
                fi
            fi
        fi
    done
}

# 전체 시스템 복구 프로세스
full_system_recovery() {
    log_info "🚨 전체 시스템 복구 프로세스 시작..."
    
    # 1단계: 시스템 리소스 확인
    check_system_resources
    
    # 2단계: 환경변수 검증
    if ! validate_environment; then
        log_error "환경변수 검증 실패 - 복구 중단"
        return 1
    fi
    
    # 3단계: 포트 충돌 해결
    resolve_port_conflicts
    
    # 4단계: Claude API 재시작
    if ! restart_claude_api; then
        log_error "Claude API 재시작 실패"
        return 1
    fi
    
    # 5단계: 핵심 MCP 서버 복구
    local critical_servers=("filesystem" "memory" "supabase" "github")
    local recovery_success=0
    
    for server in "${critical_servers[@]}"; do
        if ! check_server_health "$server"; then
            log_warning "핵심 서버 연결 실패: $server"
            
            if reconnect_server "$server"; then
                recovery_success=$((recovery_success + 1))
            fi
        else
            log_success "핵심 서버 정상: $server"
            recovery_success=$((recovery_success + 1))
        fi
    done
    
    # 6단계: 선택 서버 복구
    local optional_servers=("tavily-mcp" "context7" "sequential-thinking" "playwright" "time" "serena")
    
    for server in "${optional_servers[@]}"; do
        if ! check_server_health "$server"; then
            log_info "선택 서버 복구 시도: $server"
            reconnect_server "$server" &  # 백그라운드에서 복구
        fi
    done
    
    # 복구 결과 평가
    local success_rate=$((recovery_success * 100 / ${#critical_servers[@]}))
    
    if [[ $success_rate -ge 75 ]]; then
        log_success "시스템 복구 완료 (성공률: ${success_rate}%)"
        return 0
    else
        log_error "시스템 복구 불완전 (성공률: ${success_rate}%)"
        return 1
    fi
}

# 복구 후 검증
post_recovery_validation() {
    log_info "✅ 복구 후 검증 시작..."
    
    sleep 10  # 서버 안정화 대기
    
    local validation_results=()
    local servers=("filesystem" "memory" "github" "supabase" "tavily-mcp" "context7")
    
    for server in "${servers[@]}"; do
        if check_server_health "$server"; then
            validation_results+=("✅ $server")
        else
            validation_results+=("❌ $server")
        fi
    done
    
    # 검증 결과 출력
    log_info "복구 검증 결과:"
    for result in "${validation_results[@]}"; do
        log_info "  $result"
    done
    
    # 성공률 계산
    local success_count=$(printf '%s\n' "${validation_results[@]}" | grep -c "✅" || echo "0")
    local total_count=${#validation_results[@]}
    local final_success_rate=$((success_count * 100 / total_count))
    
    log_info "최종 성공률: ${final_success_rate}%"
    
    return $final_success_rate
}

# 복구 리포트 생성
generate_recovery_report() {
    local report_file="mcp_recovery_report_$(date +%Y%m%d_%H%M%S).md"
    
    cat > "$report_file" << EOF
# MCP 서버 자동 복구 리포트

**실행일시**: $(date '+%Y-%m-%d %H:%M:%S')
**복구 로그**: $RECOVERY_LOG
**복구 모드**: 자동 복구

## 🚨 복구 트리거

- **원인**: MCP 서버 연결 불안정 또는 응답 지연
- **감지 시간**: $(date '+%Y-%m-%d %H:%M:%S')
- **자동 복구 활성화**: ✅

## 🔧 복구 단계

### 1단계: 시스템 리소스 확인
- 메모리 사용률 점검
- 디스크 공간 확인  
- 프로세스 정리

### 2단계: 환경변수 검증
- 필수 환경변수 존재 확인
- .env.local 파일 로드
- MCP 서버별 설정 검증

### 3단계: 포트 충돌 해결
- MCP 서버 포트 범위 스캔
- 충돌 프로세스 식별 및 정리
- 포트 가용성 확보

### 4단계: Claude API 재시작
- Claude CLI 상태 확인
- API 서비스 재시작
- 연결 안정화 대기

### 5단계: 핵심 서버 복구
- filesystem, memory, supabase, github
- 서버별 맞춤 복구 전략 적용
- 재연결 성공 여부 검증

### 6단계: 선택 서버 복구
- tavily-mcp, context7, sequential-thinking 등
- 백그라운드 복구로 시간 단축
- 폴백 메커니즘 활성화

## 📊 복구 결과

EOF
    
    # 실제 복구 결과를 로그에서 추출
    if [[ -f "$RECOVERY_LOG" ]]; then
        echo "### 복구 성공 서버" >> "$report_file"
        grep "재연결 성공\|자동 복구됨" "$RECOVERY_LOG" | sed 's/^/- /' >> "$report_file"
        echo "" >> "$report_file"
        
        echo "### 복구 실패 서버" >> "$report_file"  
        grep "복구 실패" "$RECOVERY_LOG" | sed 's/^/- /' >> "$report_file"
        echo "" >> "$report_file"
    fi
    
    cat >> "$report_file" << EOF
## 🔄 폴백 메커니즘

### serena MCP 폴백
- **상태**: $(if [[ -f "/tmp/active_serena_fallback.json" ]]; then echo "활성화"; else echo "비활성화"; fi)
- **폴백 서버**: context7, github
- **분석 능력**: 라이브러리 문서 + 저장소 코드 분석

## 📋 후속 조치

1. **모니터링 강화**: 복구된 서버들의 안정성 지속 관찰
2. **성능 최적화**: 응답시간 개선 및 부하 분산 조정  
3. **폴백 검증**: serena 대체 메커니즘 성능 테스트
4. **예방 조치**: 정기적인 헬스 체크 및 사전 경고 시스템

## 📞 문의

복구 과정에서 문제가 지속되면 다음 명령어 실행:
\`\`\`bash
# 수동 복구
./scripts/mcp/auto-recovery.sh

# 전체 MCP 재설정
./scripts/mcp/reset.sh

# 성능 모니터링 재시작
./scripts/mcp/monitor-performance.sh
\`\`\`
EOF

    log_success "복구 리포트 생성: $report_file"
}

# 메인 복구 함수
main() {
    echo "=================================================================="
    echo "🚨 MCP 서버 자동 복구 메커니즘"
    echo "OpenManager VIBE v5 - Agent Coordinator"
    echo "=================================================================="
    
    log_info "자동 복구 프로세스 시작..."
    
    # 복구 모드 확인
    case "${1:-full}" in
        "full")
            if full_system_recovery; then
                local success_rate=$(post_recovery_validation)
                
                if [[ $success_rate -ge 75 ]]; then
                    log_success "🎉 자동 복구 완료 (성공률: ${success_rate}%)"
                else
                    log_warning "⚠️  부분 복구 완료 (성공률: ${success_rate}%)"
                fi
            else
                log_error "❌ 자동 복구 실패"
                exit 1
            fi
            ;;
        "quick")
            log_info "빠른 복구 모드"
            restart_claude_api
            sleep 5
            post_recovery_validation
            ;;
        "server")
            if [[ -n "$2" ]]; then
                log_info "단일 서버 복구: $2"
                reconnect_server "$2"
            else
                log_error "서버명을 지정해주세요: $0 server <서버명>"
                exit 1
            fi
            ;;
        "help")
            echo "사용법: $0 [full|quick|server <서버명>|help]"
            echo ""
            echo "모드:"
            echo "  full        전체 시스템 복구 (기본값)"
            echo "  quick       Claude API 재시작만"
            echo "  server      특정 서버만 복구"
            echo "  help        도움말 표시"
            echo ""
            echo "예시:"
            echo "  $0                    # 전체 복구"
            echo "  $0 quick             # 빠른 복구"
            echo "  $0 server filesystem # filesystem 서버만 복구"
            exit 0
            ;;
        *)
            log_error "알 수 없는 모드: $1"
            exit 1
            ;;
    esac
    
    # 복구 리포트 생성
    generate_recovery_report
    
    echo "=================================================================="
    log_success "🔧 자동 복구 메커니즘 완료"
    echo "=================================================================="
}

# 스크립트 종료 시 정리
cleanup() {
    log_info "복구 프로세스 정리 중..."
    
    # 백그라운드 프로세스 정리
    jobs -p | xargs -r kill 2>/dev/null || true
    
    exit 0
}

# 신호 처리
trap cleanup INT TERM

# 스크립트 실행
main "$@"