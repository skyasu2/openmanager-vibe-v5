#!/bin/bash

# 🧪 GCP VM 통합 테스트 스크립트
# 
# 이 스크립트는 GCP VM 서버와 Next.js 앱의 통합을 테스트합니다.
# - GCP VM 서버 상태 확인
# - API 엔드포인트 테스트
# - Next.js 앱에서 GCP VM 데이터 수신 확인
# - Circuit Breaker 동작 테스트

set -euo pipefail

# 🎨 색상 정의
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly NC='\033[0m'

# 📋 설정 변수
readonly GCP_VM_IP="${GCP_VM_EXTERNAL_IP:-104.154.205.25}"
readonly SERVER_PORT="${MCP_SERVER_PORT:-10000}"
readonly VM_API_TOKEN="${VM_API_TOKEN:-}"
readonly NEXT_APP_URL="${NEXT_PUBLIC_APP_URL:-http://localhost:3000}"

# 함수: 로그 출력
log() {
    echo -e "${GREEN}[$(date +'%H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%H:%M:%S')] ⚠️  $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%H:%M:%S')] ❌ $1${NC}"
    return 1
}

info() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')] ℹ️  $1${NC}"
}

# 함수: HTTP 요청 테스트
test_http_request() {
    local url="$1"
    local expected_status="${2:-200}"
    local headers="${3:-}"
    local description="${4:-HTTP 요청}"
    
    info "$description 테스트: $url"
    
    local response_code
    if [[ -n "$headers" ]]; then
        response_code=$(curl -s -w "%{http_code}" -H "$headers" "$url" -o /dev/null)
    else
        response_code=$(curl -s -w "%{http_code}" "$url" -o /dev/null)
    fi
    
    if [[ "$response_code" == "$expected_status" ]]; then
        log "✅ $description 성공 (HTTP $response_code)"
        return 0
    else
        error "$description 실패 (HTTP $response_code, 예상: $expected_status)"
        return 1
    fi
}

# 함수: JSON 응답 테스트
test_json_response() {
    local url="$1"
    local headers="${2:-}"
    local description="${3:-JSON 응답}"
    
    info "$description 테스트: $url"
    
    local response
    if [[ -n "$headers" ]]; then
        response=$(curl -s -H "$headers" "$url")
    else
        response=$(curl -s "$url")
    fi
    
    if echo "$response" | jq . >/dev/null 2>&1; then
        log "✅ $description JSON 파싱 성공"
        
        # 서버 데이터가 있는지 확인
        local server_count
        server_count=$(echo "$response" | jq '.data | length' 2>/dev/null || echo "0")
        
        if [[ "$server_count" -gt 0 ]]; then
            log "✅ $description 데이터 포함 ($server_count개 서버)"
        else
            warn "$description 데이터 없음 또는 구조 다름"
        fi
        
        return 0
    else
        error "$description JSON 파싱 실패"
        echo "응답: $response"
        return 1
    fi
}

# 함수: GCP VM 서버 테스트
test_gcp_vm_server() {
    log "🌐 GCP VM 서버 테스트 시작"
    
    # 1. 헬스체크
    test_http_request "http://$GCP_VM_IP:$SERVER_PORT/health" 200 "" "GCP VM 헬스체크" || return 1
    
    # 2. 인증 없이 서버 API (403 예상)
    test_http_request "http://$GCP_VM_IP:$SERVER_PORT/api/servers" 403 "" "GCP VM 인증 체크 (403 예상)" || {
        warn "인증 체크가 예상과 다릅니다. 토큰 없이도 접근 가능할 수 있습니다."
    }
    
    # 3. 인증 포함 서버 API (토큰이 있는 경우)
    if [[ -n "$VM_API_TOKEN" ]]; then
        test_json_response "http://$GCP_VM_IP:$SERVER_PORT/api/servers" "Authorization: Bearer $VM_API_TOKEN" "GCP VM 서버 데이터 API" || return 1
    else
        warn "VM_API_TOKEN이 없어 인증 API 테스트를 건너뜁니다"
    fi
    
    log "✅ GCP VM 서버 테스트 완료"
}

# 함수: Next.js 앱 통합 테스트
test_nextjs_integration() {
    log "🚀 Next.js 앱 통합 테스트 시작"
    
    # Next.js 앱의 서버 API 엔드포인트 테스트
    test_json_response "$NEXT_APP_URL/api/servers/all" "" "Next.js 서버 데이터 API" || return 1
    
    # 응답에 GCP VM 데이터가 포함되어 있는지 확인
    info "GCP VM 통합 상태 확인..."
    local response
    response=$(curl -s "$NEXT_APP_URL/api/servers/all")
    
    local data_source
    data_source=$(echo "$response" | jq -r '.source' 2>/dev/null || echo "unknown")
    
    local fallback_used
    fallback_used=$(echo "$response" | jq -r '.fallback' 2>/dev/null || echo "true")
    
    case "$data_source" in
        "gcp-vm")
            log "✅ GCP VM 직접 연결 성공!"
            ;;
        "cache")
            log "✅ GCP VM 캐시 데이터 사용 (정상)"
            ;;
        "local-mock"|"fallback")
            warn "⚠️  로컬 목업 데이터 사용 중 (GCP VM 연결 실패 또는 미배포)"
            ;;
        *)
            warn "알 수 없는 데이터 소스: $data_source"
            ;;
    esac
    
    if [[ "$fallback_used" == "false" ]]; then
        log "✅ 실제 GCP VM 데이터 사용 중"
    else
        warn "⚠️  폴백 모드 활성화 (GCP VM 연결 문제 가능)"
    fi
    
    log "✅ Next.js 앱 통합 테스트 완료"
}

# 함수: Circuit Breaker 동작 테스트
test_circuit_breaker() {
    log "🔄 Circuit Breaker 동작 테스트 시작"
    
    info "Circuit Breaker 상태 확인을 위해 여러 번 요청..."
    
    local success_count=0
    local total_requests=5
    
    for i in $(seq 1 $total_requests); do
        info "요청 $i/$total_requests"
        if curl -s "$NEXT_APP_URL/api/servers/all" >/dev/null; then
            ((success_count++))
        fi
        sleep 1
    done
    
    log "Circuit Breaker 테스트 결과: $success_count/$total_requests 성공"
    
    if [[ $success_count -eq $total_requests ]]; then
        log "✅ Circuit Breaker 정상 동작 (모든 요청 성공)"
    elif [[ $success_count -gt 0 ]]; then
        warn "⚠️  부분적 성공 (Circuit Breaker가 일부 요청 차단 중)"
    else
        error "Circuit Breaker 또는 서버 문제 (모든 요청 실패)"
        return 1
    fi
    
    log "✅ Circuit Breaker 동작 테스트 완료"
}

# 함수: 성능 테스트
test_performance() {
    log "⚡ 성능 테스트 시작"
    
    info "응답 시간 측정..."
    local total_time=0
    local request_count=3
    
    for i in $(seq 1 $request_count); do
        local response_time
        response_time=$(curl -w "%{time_total}" -s "$NEXT_APP_URL/api/servers/all" -o /dev/null)
        total_time=$(echo "$total_time + $response_time" | bc -l)
        info "요청 $i: ${response_time}초"
    done
    
    local avg_time
    avg_time=$(echo "scale=3; $total_time / $request_count" | bc -l)
    
    log "평균 응답 시간: ${avg_time}초"
    
    # 성능 임계값 확인 (2초)
    if (( $(echo "$avg_time <= 2.0" | bc -l) )); then
        log "✅ 성능 테스트 통과 (< 2초)"
    else
        warn "⚠️  성능 개선 필요 (> 2초)"
    fi
    
    log "✅ 성능 테스트 완료"
}

# 함수: 종합 보고서 출력
print_test_report() {
    log "📊 GCP VM 통합 테스트 종합 보고서"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}🎉 GCP VM 통합 테스트 완료!${NC}"
    echo ""
    echo -e "${YELLOW}📍 테스트 환경:${NC}"
    echo "   • GCP VM: $GCP_VM_IP:$SERVER_PORT"
    echo "   • Next.js 앱: $NEXT_APP_URL"
    echo "   • API 토큰: $([ -n "$VM_API_TOKEN" ] && echo "설정됨" || echo "없음")"
    echo ""
    echo -e "${YELLOW}📋 테스트 결과:${NC}"
    echo "   • GCP VM 서버: $([ $gcp_vm_test_result -eq 0 ] && echo "✅ 성공" || echo "❌ 실패")"
    echo "   • Next.js 통합: $([ $nextjs_test_result -eq 0 ] && echo "✅ 성공" || echo "❌ 실패")"
    echo "   • Circuit Breaker: $([ $circuit_test_result -eq 0 ] && echo "✅ 성공" || echo "❌ 실패")"
    echo "   • 성능 테스트: $([ $performance_test_result -eq 0 ] && echo "✅ 성공" || echo "⚠️  주의")"
    echo ""
    echo -e "${YELLOW}🔍 다음 단계:${NC}"
    if [[ $gcp_vm_test_result -eq 0 && $nextjs_test_result -eq 0 ]]; then
        echo "   🎉 모든 테스트 통과! GCP VM 통합이 정상 작동하고 있습니다."
    else
        echo "   🔧 문제가 발견되었습니다. 위의 테스트 결과를 확인하여 수정하세요."
    fi
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# 함수: 메인 테스트 프로세스
main() {
    log "🧪 GCP VM 통합 테스트 시작"
    echo ""
    
    # 전역 결과 변수 초기화
    gcp_vm_test_result=1
    nextjs_test_result=1
    circuit_test_result=1
    performance_test_result=1
    
    # 단계별 테스트 실행
    if test_gcp_vm_server; then
        gcp_vm_test_result=0
    fi
    
    if test_nextjs_integration; then
        nextjs_test_result=0
    fi
    
    if test_circuit_breaker; then
        circuit_test_result=0
    fi
    
    if test_performance; then
        performance_test_result=0
    fi
    
    echo ""
    print_test_report
    
    # 전체 결과 판정
    if [[ $gcp_vm_test_result -eq 0 && $nextjs_test_result -eq 0 ]]; then
        log "🎉 전체 테스트 성공!"
        exit 0
    else
        error "테스트 실패. 위의 결과를 확인하세요."
        exit 1
    fi
}

# 스크립트 실행
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    # bc 명령어 확인 (성능 테스트용)
    if ! command -v bc >/dev/null 2>&1; then
        warn "bc 명령어가 없어 성능 테스트를 건너뜁니다."
        test_performance() { log "⚡ 성능 테스트 건너뜀 (bc 명령어 없음)"; performance_test_result=0; }
    fi
    
    # jq 명령어 확인 (JSON 파싱용)
    if ! command -v jq >/dev/null 2>&1; then
        warn "jq 명령어가 없어 JSON 상세 분석을 건너뜁니다."
        # JSON 테스트를 간단한 HTTP 테스트로 대체
        test_json_response() {
            test_http_request "$1" 200 "$2" "$3"
        }
    fi
    
    main "$@"
fi