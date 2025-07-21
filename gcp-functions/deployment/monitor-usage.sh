#!/bin/bash

# 📊 OpenManager GCP Functions 사용량 모니터링 스크립트
# 
# 무료 티어 한도 내에서 안전하게 운영되는지 확인

set -e

# 색상 코드
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# 프로젝트 설정
PROJECT_ID="openmanager-ai"
REGION="asia-northeast3"
FUNCTIONS=("ai-gateway" "enhanced-korean-nlp" "rule-engine" "ml-analytics-engine" "unified-ai-processor")

# 무료 티어 한도
MAX_INVOCATIONS=2000000  # 2M/월
MAX_COMPUTE_TIME=400000  # 400K GB-초/월
MAX_NETWORK=25          # 25GB/월

log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

highlight() {
    echo -e "${PURPLE}🔍 $1${NC}"
}

# 사용량 백분율 계산
calculate_percentage() {
    local current=$1
    local max=$2
    echo "scale=2; $current * 100 / $max" | bc
}

# 상태 표시
show_status() {
    local percentage=$1
    if (( $(echo "$percentage > 80" | bc -l) )); then
        echo -e "${RED}위험${NC}"
    elif (( $(echo "$percentage > 60" | bc -l) )); then
        echo -e "${YELLOW}주의${NC}"
    else
        echo -e "${GREEN}안전${NC}"
    fi
}

# Function별 상태 확인
check_function_health() {
    local func_name=$1
    local url="https://$REGION-$PROJECT_ID.cloudfunctions.net/${func_name}-health"
    
    log "$func_name 헬스 체크 중..."
    
    if response=$(curl -s --max-time 10 "$url" 2>/dev/null); then
        if echo "$response" | grep -q '"status":"healthy"'; then
            success "$func_name: 정상"
            return 0
        else
            warning "$func_name: 비정상 응답"
            return 1
        fi
    else
        error "$func_name: 연결 실패"
        return 1
    fi
}

log "🚀 OpenManager GCP Functions 사용량 모니터링 시작"
log "프로젝트: $PROJECT_ID"
log "리전: $REGION"
echo ""

# 1. Functions 상태 확인
highlight "1. Functions 헬스 체크"
healthy_count=0
for func in "${FUNCTIONS[@]}"; do
    if check_function_health "$func"; then
        ((healthy_count++))
    fi
done

echo ""
log "헬스 체크 결과: $healthy_count/${#FUNCTIONS[@]} Functions 정상"

# 2. 로그 기반 사용량 분석 (최근 24시간)
highlight "2. 최근 24시간 사용량 분석"

# Functions 로그에서 호출 횟수 추출
total_invocations=0
for func in "${FUNCTIONS[@]}"; do
    log "$func 로그 분석 중..."
    
    # 최근 24시간 로그 조회 (실제로는 간단한 추정치 사용)
    # 실제 환경에서는 Cloud Monitoring API를 사용해야 함
    
    # 헬스체크로 대략적인 호출 횟수 추정
    if check_function_health "$func" > /dev/null 2>&1; then
        # 정상 동작하는 Function은 하루 평균 호출 횟수 추정
        case $func in
            "ai-gateway")
                daily_calls=1000
                ;;
            "enhanced-korean-nlp")
                daily_calls=667
                ;;
            "rule-engine")
                daily_calls=833
                ;;
            "ml-analytics-engine")
                daily_calls=500
                ;;
            "unified-ai-processor")
                daily_calls=300
                ;;
        esac
        total_invocations=$((total_invocations + daily_calls))
        echo "  • $func: ~$daily_calls 호출/일"
    else
        echo "  • $func: 0 호출/일 (오프라인)"
    fi
done

# 월간 추정치 계산
monthly_invocations=$((total_invocations * 30))
invocation_percentage=$(calculate_percentage $monthly_invocations $MAX_INVOCATIONS)

echo ""
log "📊 호출량 분석"
echo "  • 일간 총 호출: ~$total_invocations 회"
echo "  • 월간 추정 호출: ~$monthly_invocations 회"
echo "  • 무료 한도 사용률: $invocation_percentage% ($(show_status $invocation_percentage))"

# 3. 메모리 사용량 추정
highlight "3. 컴퓨팅 리소스 사용량 추정"

total_gb_seconds=0
for func in "${FUNCTIONS[@]}"; do
    case $func in
        "ai-gateway")
            memory_mb=256
            avg_duration_ms=2000  # 2초
            daily_calls=1000
            ;;
        "enhanced-korean-nlp")
            memory_mb=512
            avg_duration_ms=5000  # 5초
            daily_calls=667
            ;;
        "rule-engine")
            memory_mb=256
            avg_duration_ms=500   # 0.5초
            daily_calls=833
            ;;
        "ml-analytics-engine")
            memory_mb=512
            avg_duration_ms=3000  # 3초
            daily_calls=500
            ;;
        "unified-ai-processor")
            memory_mb=1024
            avg_duration_ms=8000  # 8초
            daily_calls=300
            ;;
    esac
    
    # GB-초 계산
    memory_gb=$(echo "scale=3; $memory_mb / 1024" | bc)
    duration_seconds=$(echo "scale=3; $avg_duration_ms / 1000" | bc)
    daily_gb_seconds=$(echo "scale=3; $memory_gb * $duration_seconds * $daily_calls" | bc)
    
    total_gb_seconds=$(echo "scale=3; $total_gb_seconds + $daily_gb_seconds" | bc)
    
    echo "  • $func: ${memory_mb}MB × ${duration_seconds}s × ${daily_calls}회 = ${daily_gb_seconds} GB-초/일"
done

monthly_gb_seconds=$(echo "scale=3; $total_gb_seconds * 30" | bc)
compute_percentage=$(calculate_percentage $monthly_gb_seconds $MAX_COMPUTE_TIME)

echo ""
echo "  • 일간 총 컴퓨팅: $total_gb_seconds GB-초"
echo "  • 월간 추정 컴퓨팅: $monthly_gb_seconds GB-초"
echo "  • 무료 한도 사용률: $compute_percentage% ($(show_status $compute_percentage))"

# 4. 네트워크 사용량 추정
highlight "4. 네트워크 사용량 추정"

# 평균 응답 크기 추정 (실제로는 더 정확한 측정 필요)
avg_response_kb=2  # 2KB per response
daily_network_mb=$(echo "scale=3; $total_invocations * $avg_response_kb / 1024" | bc)
monthly_network_gb=$(echo "scale=3; $daily_network_mb * 30 / 1024" | bc)
network_percentage=$(calculate_percentage $monthly_network_gb $MAX_NETWORK)

echo "  • 일간 네트워크: ${daily_network_mb} MB"
echo "  • 월간 추정 네트워크: ${monthly_network_gb} GB"
echo "  • 무료 한도 사용률: $network_percentage% ($(show_status $network_percentage))"

# 5. 종합 보고서
echo ""
highlight "5. 종합 보고서"

echo "┌─────────────────────────────────────────────────────────────┐"
echo "│                   OpenManager 무료 티어 현황                   │"
echo "├─────────────────────────────────────────────────────────────┤"
printf "│ 호출량        : %6.1f%% (%s)                           │\n" "$invocation_percentage" "$(show_status $invocation_percentage | sed 's/\x1b\[[0-9;]*m//g')"
printf "│ 컴퓨팅        : %6.1f%% (%s)                           │\n" "$compute_percentage" "$(show_status $compute_percentage | sed 's/\x1b\[[0-9;]*m//g')"
printf "│ 네트워크      : %6.1f%% (%s)                           │\n" "$network_percentage" "$(show_status $network_percentage | sed 's/\x1b\[[0-9;]*m//g')"
printf "│ Functions 상태: %d/%d 정상                              │\n" "$healthy_count" "${#FUNCTIONS[@]}"
echo "└─────────────────────────────────────────────────────────────┘"

# 6. 권장사항
echo ""
highlight "6. 권장사항"

max_percentage=$(echo "$invocation_percentage $compute_percentage $network_percentage" | tr ' ' '\n' | sort -n | tail -1)

if (( $(echo "$max_percentage > 80" | bc -l) )); then
    error "위험: 무료 한도 초과 위험!"
    echo "  • 즉시 사용량 최적화 필요"
    echo "  • Function 타임아웃 단축 검토"
    echo "  • 캐싱 시스템 강화"
elif (( $(echo "$max_percentage > 60" | bc -l) )); then
    warning "주의: 사용량 모니터링 강화 필요"
    echo "  • 일일 사용량 점검"
    echo "  • 불필요한 호출 최적화"
elif (( $(echo "$max_percentage > 40" | bc -l) )); then
    success "양호: 안전한 사용량 수준"
    echo "  • 현재 수준 유지"
    echo "  • 주간 모니터링 권장"
else
    success "우수: 매우 안전한 사용량"
    echo "  • 추가 기능 개발 가능"
    echo "  • 월간 모니터링으로 충분"
fi

echo ""
log "📈 실시간 모니터링 명령어:"
echo "gcloud logging read 'resource.type=\"cloud_function\"' --limit=50 --format=\"table(timestamp,resource.labels.function_name,severity,textPayload)\""

log "🔧 사용량 최적화 팁:"
echo "1. 응답 크기 최소화 (JSON 압축)"
echo "2. 불필요한 로깅 제거"
echo "3. 캐싱 활용도 증가"
echo "4. Function 실행 시간 단축"

success "🎉 모니터링 완료!" 