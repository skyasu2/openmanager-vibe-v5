#!/bin/bash
# 🤖 Gemini Wrapper - Google AI 무료 아키텍처 분석 전문가
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

# Gemini CLI 분석 (기존 ai-cross-validation.sh 패턴과 동일)
analyze_with_gemini() {
    local file_path="$1"
    local file_content
    local temp_file
    
    # 메모리 안전 검사
    if ! check_memory_safety; then
        echo "🤖 Gemini 분석: 메모리 부족으로 건너뜀"
        return
    fi
    
    log_info "🤖 Gemini CLI (구조+아키텍처) 분석 중... (30초 타임아웃)"
    
    if [ -f "$file_path" ]; then
        temp_file="/tmp/gemini_$(basename "$file_path")_$$"
        head -c 2000 "$file_path" > "$temp_file" 2>/dev/null || {
            echo "❌ Gemini 분석: 파일 읽기 실패"
            return
        }
        
        file_content=$(cat "$temp_file" 2>/dev/null)
        
        timeout 30s gemini -p "TypeScript 파일 $(basename "$file_path") 아키텍처 점수(10점)와 개선점 1개 간단히" 2>/dev/null || {
            log_warning "⚠️ Gemini CLI 타임아웃 (30초 초과)"
            echo "🤖 Gemini 분석: 타임아웃 또는 무료 한도 초과"
        }
        
        # 임시 파일 정리
        rm -f "$temp_file" 2>/dev/null
    else
        echo "❌ Gemini 분석: 파일 찾을 수 없음"
    fi
}

# 도움말 표시
show_help() {
    cat << EOF
🧠 Gemini Wrapper - Google AI 무료 아키텍처 분석

사용법:
  $0 <파일경로>
  $0 -h | --help

예시:
  $0 src/components/ServerCard.tsx
  $0 src/lib/architecture.ts

특징:
  • Google AI 무료 서비스
  • 가중치: 0.98 (높은 신뢰도)
  • 1,000회/일 무료 한도
  • 아키텍처 구조 분석 전문
  • 30초 타임아웃
  • 2KB 파일 크기 제한

분석 영역:
  • 모듈 구조 및 책임 분리
  • 디자인 패턴 적용성
  • 확장성 및 재사용성
  • 의존성 관리

요구사항:
  • gemini CLI 설치 및 인증
  • Google 계정 로그인 (API 사용 금지)
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
    
    # Gemini CLI 확인
    if ! command -v gemini >/dev/null 2>&1; then
        log_error "Gemini CLI를 찾을 수 없습니다"
        echo "설치: npm install -g @google/gemini-cli"
        echo "인증: gemini auth (Google 계정 필요)"
        exit 1
    fi
    
    # 파일 존재 확인
    if [[ ! -f "$file_path" ]]; then
        log_error "파일을 찾을 수 없습니다: $file_path"
        exit 1
    fi
    
    log_info "🚀 Gemini Wrapper 시작"
    echo "파일: $file_path"
    echo "가중치: 0.98 (구조 분석 전문)"
    echo "한도: 1,000회/일 무료"
    echo ""
    
    # 분석 실행
    analyze_with_gemini "$file_path"
    
    log_success "Gemini 분석 완료"
}

# 함수 export (다른 스크립트에서 사용 가능)
if [[ "${BASH_SOURCE[0]}" != "${0}" ]]; then
    # 소스되는 경우 함수만 export
    export -f analyze_with_gemini
    export -f check_memory_safety
    export -f log_info log_success log_warning log_error
else
    # 직접 실행되는 경우 main 함수 호출
    main "$@"
fi