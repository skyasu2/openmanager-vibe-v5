#!/bin/bash
# 🤖 Qwen Wrapper - OAuth 무료 성능 최적화 전문가
# 기존 ai-cross-validation.sh 패턴 호환 독립 실행

set -uo pipefail

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 로깅 함수
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# 메모리 안전 검사
check_memory_safety() {
    local available_mb
    available_mb=$(free -m | awk '/^Mem:/{print $7}')
    
    if [ "$available_mb" -lt 500 ]; then
        log_warning "사용 가능한 메모리가 부족합니다 (${available_mb}MB). 분석을 건너뜁니다."
        return 1
    fi
    return 0
}

# Qwen CLI 분석 (기존 ai-cross-validation.sh 패턴과 동일)
analyze_with_qwen() {
    local file_path="$1"
    local file_content
    local temp_file
    
    # 메모리 안전 검사
    if ! check_memory_safety; then
        echo "🤖 Qwen 분석: 메모리 부족으로 건너뜀"
        return
    fi
    
    log_info "🤖 Qwen CLI (성능+알고리즘) 분석 중... (60초 타임아웃)"
    
    if [ -f "$file_path" ]; then
        temp_file="/tmp/qwen_$(basename "$file_path")_$$"
        head -c 1500 "$file_path" > "$temp_file" 2>/dev/null || {
            echo "❌ Qwen 분석: 파일 읽기 실패"
            return
        }
        
        file_content=$(cat "$temp_file" 2>/dev/null)
        
        timeout 60s qwen -p "TypeScript $(basename "$file_path") 성능 점수(10점)와 최적화 제안 1개" 2>/dev/null || {
            log_warning "⚠️ Qwen CLI 타임아웃 (60초 초과)"
            echo "🤖 Qwen 분석: 타임아웃 또는 OAuth 한도 초과"
        }
        
        # 임시 파일 정리
        rm -f "$temp_file" 2>/dev/null
    else
        echo "❌ Qwen 분석: 파일 찾을 수 없음"
    fi
}

# 도움말 표시
show_help() {
    cat << EOF
⚡ Qwen Wrapper - OAuth 무료 성능 최적화 전문가

사용법:
  $0 <파일경로>
  $0 -h | --help

예시:
  $0 src/utils/data-processing.ts
  $0 src/hooks/useOptimization.ts

특징:
  • Qwen OAuth 무료 서비스
  • 가중치: 0.97 (알고리즘 분석)
  • 2,000회/일 무료 한도
  • 성능 최적화 전문
  • 60초 타임아웃
  • 1.5KB 파일 크기 제한

분석 영역:
  • 시간/공간 복잡도 분석
  • 알고리즘 최적화 기회
  • 메모리 사용 효율성
  • 병렬 처리 가능성
  • 반복문 최적화

요구사항:
  • qwen CLI 설치 및 인증
  • OAuth 계정 로그인 (API 사용 금지)
  • 500MB+ 여유 메모리
EOF
}

# 메인 함수
main() {
    local file_path="$1"
    
    # 인수 확인
    if [[ "$#" -eq 0 ]] || [[ "$1" == "-h" ]] || [[ "$1" == "--help" ]]; then
        show_help
        exit 0
    fi
    
    # Qwen CLI 확인
    if ! command -v qwen >/dev/null 2>&1; then
        log_error "Qwen CLI를 찾을 수 없습니다"
        echo "설치: npm install -g qwen-cli"
        echo "인증: qwen auth (OAuth 계정 필요)"
        exit 1
    fi
    
    # 파일 존재 확인
    if [[ ! -f "$file_path" ]]; then
        log_error "파일을 찾을 수 없습니다: $file_path"
        exit 1
    fi
    
    log_info "🚀 Qwen Wrapper 시작"
    echo "파일: $file_path"
    echo "가중치: 0.97 (성능 분석 전문)"
    echo "한도: 2,000회/일 OAuth 무료"
    echo ""
    
    # 분석 실행
    analyze_with_qwen "$file_path"
    
    log_success "Qwen 분석 완료"
}

# 함수 export (다른 스크립트에서 사용 가능)
if [[ "${BASH_SOURCE[0]}" != "${0}" ]]; then
    # 소스되는 경우 함수만 export
    export -f analyze_with_qwen
    export -f check_memory_safety
    export -f log_info log_success log_warning log_error
else
    # 직접 실행되는 경우 main 함수 호출
    main "$@"
fi