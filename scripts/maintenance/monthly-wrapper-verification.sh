#!/bin/bash

###############################################################################
# Monthly AI Wrapper Verification Automation
#
# 목적: 월간 정기 wrapper 검증 자동화 (크론 스케줄 호환)
# 버전: 1.0.0
# 날짜: 2025-11-08
# 스케줄: 매월 1일 오전 9시 (KST)
# 크론: 0 9 1 * * /path/to/monthly-wrapper-verification.sh
###############################################################################

set -euo pipefail

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 프로젝트 루트 자동 결정 (포터블)
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

# 설정
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
YEAR_MONTH=$(date +%Y-%m)
MONTHLY_REPORT_DIR="${PROJECT_ROOT}/logs/monthly-verification"
MONTHLY_REPORT_FILE="${MONTHLY_REPORT_DIR}/${YEAR_MONTH}-wrapper-verification.md"
VERIFICATION_SCRIPT="${PROJECT_ROOT}/scripts/ai-wrappers/wrapper-verification-suite.sh"

# 재시도 설정
MAX_RETRIES=3
RETRY_DELAY=300  # 5분 (초 단위)

# 알림 설정 (옵션)
ENABLE_NOTIFICATIONS=false  # true로 변경 시 알림 활성화
NOTIFICATION_EMAIL=""       # 알림 받을 이메일 (옵션)

# 출력 디렉터리 생성
mkdir -p "$MONTHLY_REPORT_DIR"

###############################################################################
# Functions
###############################################################################

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] INFO: $1" >> "${MONTHLY_REPORT_DIR}/automation.log"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] SUCCESS: $1" >> "${MONTHLY_REPORT_DIR}/automation.log"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1" >> "${MONTHLY_REPORT_DIR}/automation.log"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] WARNING: $1" >> "${MONTHLY_REPORT_DIR}/automation.log"
}

print_header() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

send_notification() {
    local subject="$1"
    local message="$2"
    
    if [[ "$ENABLE_NOTIFICATIONS" == "true" ]] && [[ -n "$NOTIFICATION_EMAIL" ]]; then
        # 이메일 알림 (mail 명령어 필요)
        if command -v mail >/dev/null 2>&1; then
            echo "$message" | mail -s "$subject" "$NOTIFICATION_EMAIL"
            log_info "알림 전송: $subject"
        else
            log_warning "mail 명령어 없음 - 알림 건너뜀"
        fi
    fi
}

run_verification_with_retry() {
    local attempt=1
    local max_attempts=$MAX_RETRIES
    local temp_report=""
    
    while [[ $attempt -le $max_attempts ]]; do
        log_info "검증 시도 $attempt/$max_attempts"
        
        # wrapper-verification-suite.sh 실행
        if "$VERIFICATION_SCRIPT" > /tmp/verification-output-${TIMESTAMP}.txt 2>&1; then
            log_success "검증 성공 (시도 $attempt)"
            
            # 가장 최근 생성된 보고서 찾기
            temp_report=$(find /tmp -name "verification-report.md" -type f -printf '%T@ %p\n' 2>/dev/null | sort -n | tail -1 | cut -d' ' -f2-)
            
            if [[ -f "$temp_report" ]]; then
                # 월간 보고서로 복사
                cp "$temp_report" "$MONTHLY_REPORT_FILE"
                log_success "월간 보고서 생성: $MONTHLY_REPORT_FILE"
                
                # 성공 알림
                send_notification \
                    "✅ Monthly Wrapper Verification Passed ($YEAR_MONTH)" \
                    "월간 wrapper 검증이 성공적으로 완료되었습니다.\n\n보고서: $MONTHLY_REPORT_FILE"
                
                return 0
            else
                log_error "보고서 파일 찾기 실패"
                return 1
            fi
        else
            local exit_code=$?
            log_error "검증 실패 (시도 $attempt, exit code: $exit_code)"
            
            if [[ $attempt -lt $max_attempts ]]; then
                log_warning "${RETRY_DELAY}초 후 재시도..."
                sleep "$RETRY_DELAY"
                attempt=$((attempt + 1))
            else
                log_error "최대 재시도 횟수 초과 ($max_attempts)"
                
                # 실패 알림
                send_notification \
                    "❌ Monthly Wrapper Verification Failed ($YEAR_MONTH)" \
                    "월간 wrapper 검증이 $max_attempts번 시도 후 실패했습니다.\n\n로그: ${MONTHLY_REPORT_DIR}/automation.log"
                
                return 1
            fi
        fi
    done
}

generate_trend_report() {
    local trend_file="${MONTHLY_REPORT_DIR}/trend-report.md"
    
    log_info "트렌드 보고서 생성 중..."
    
    cat > "$trend_file" <<EOF
# AI Wrapper Monthly Verification Trend Report

**생성일**: $(date '+%Y-%m-%d %H:%M:%S')
**기간**: 과거 12개월

---

## 📈 월별 성공률 추이

| 월 | 총 테스트 | 통과 | 실패 | 성공률 |
|----|----------|------|------|--------|
EOF

    # 과거 12개월 보고서 스캔
    for i in {11..0}; do
        local month=$(date -d "$i months ago" +%Y-%m)
        local report="${MONTHLY_REPORT_DIR}/${month}-wrapper-verification.md"
        
        if [[ -f "$report" ]]; then
            # 보고서에서 통계 추출
            local total=$(grep "총 테스트:" "$report" | grep -oP '\d+' | head -1)
            local passed=$(grep "통과:" "$report" | grep -oP '\d+' | head -1)
            local failed=$(grep "실패:" "$report" | grep -oP '\d+' | head -1)
            local rate=$(grep "성공률:" "$report" | grep -oP '\d+\.\d+' | head -1)
            
            echo "| $month | ${total:-N/A} | ${passed:-N/A} | ${failed:-N/A} | ${rate:-N/A}% |" >> "$trend_file"
        else
            echo "| $month | - | - | - | - |" >> "$trend_file"
        fi
    done
    
    cat >> "$trend_file" <<EOF

---

## 🎯 분석

### 성공률 평균
- **목표**: 90%+ (권장)
- **현재**: 위 테이블 참조

### 권장 조치
- 성공률 < 80%: wrapper 타임아웃 재검토 필요
- 연속 실패 2회+: 긴급 조치 필요 (AI CLI 도구 점검)
- 특정 wrapper 반복 실패: 해당 wrapper 로그 상세 분석

---

## 📁 월간 보고서

EOF

    # 월간 보고서 목록
    for report in $(ls -t "${MONTHLY_REPORT_DIR}"/*-wrapper-verification.md 2>/dev/null | head -12); do
        local basename=$(basename "$report")
        echo "- [$basename]($report)" >> "$trend_file"
    done
    
    log_success "트렌드 보고서 생성 완료: $trend_file"
}

###############################################################################
# Main Execution
###############################################################################

print_header "월간 AI Wrapper 검증 자동화 v1.0.0"

echo -e "${BLUE}🗓️  검증 일자: ${YELLOW}$(date '+%Y-%m-%d %H:%M:%S')${NC}"
echo -e "${BLUE}📁 보고서 디렉토리: ${YELLOW}$MONTHLY_REPORT_DIR${NC}"
echo -e "${BLUE}📋 보고서 파일: ${YELLOW}$MONTHLY_REPORT_FILE${NC}"
echo ""

# 검증 스크립트 존재 확인
if [[ ! -f "$VERIFICATION_SCRIPT" ]]; then
    log_error "검증 스크립트 없음: $VERIFICATION_SCRIPT"
    exit 1
fi

# 검증 실행 (재시도 포함)
print_header "검증 실행"
if run_verification_with_retry; then
    log_success "월간 검증 완료"
    
    # 트렌드 보고서 생성
    print_header "트렌드 분석"
    generate_trend_report
    
    print_header "완료"
    echo -e "${GREEN}✅ 월간 검증이 성공적으로 완료되었습니다${NC}"
    echo -e "${BLUE}📋 보고서: ${YELLOW}$MONTHLY_REPORT_FILE${NC}"
    echo -e "${BLUE}📊 트렌드: ${YELLOW}${MONTHLY_REPORT_DIR}/trend-report.md${NC}"
    
    exit 0
else
    log_error "월간 검증 실패"
    
    print_header "실패"
    echo -e "${RED}❌ 월간 검증이 실패했습니다${NC}"
    echo -e "${BLUE}📋 로그: ${YELLOW}${MONTHLY_REPORT_DIR}/automation.log${NC}"
    
    exit 1
fi
