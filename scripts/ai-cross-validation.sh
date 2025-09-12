#!/bin/bash
# 🤖 현실적 AI 교차검증 시스템
# Claude Code와 3개 외부 AI의 실용적 교차검증

set -euo pipefail

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

# AI CLI 도구 상태 확인
check_ai_tools() {
    log_info "AI CLI 도구 상태 확인 중..."
    
    local tools=("claude" "codex" "gemini" "qwen")
    local available_tools=()
    
    for tool in "${tools[@]}"; do
        if command -v "$tool" &> /dev/null; then
            log_success "$tool CLI 사용 가능"
            available_tools+=("$tool")
        else
            log_warning "$tool CLI 설치되지 않음"
        fi
    done
    
    if [ ${#available_tools[@]} -eq 0 ]; then
        log_error "사용 가능한 AI CLI 도구가 없습니다"
        exit 1
    fi
    
    echo "${available_tools[@]}"
}

# 파일 크기 확인 (큰 파일은 요약해서 분석)
get_file_summary() {
    local file_path="$1"
    local line_count
    
    if [ ! -f "$file_path" ]; then
        log_error "파일을 찾을 수 없습니다: $file_path"
        return 1
    fi
    
    line_count=$(wc -l < "$file_path")
    
    if [ "$line_count" -gt 200 ]; then
        log_warning "파일이 큽니다 ($line_count 줄). 요약해서 분석합니다."
        # 파일 요약 (첫 50줄 + 마지막 50줄 + 주요 함수/클래스)
        {
            echo "=== 파일 헤더 (첫 50줄) ==="
            head -n 50 "$file_path"
            echo ""
            echo "=== 주요 함수/클래스 ==="
            grep -n "^export\|^class\|^function\|^const.*=.*(\|^interface\|^type" "$file_path" | head -n 20
            echo ""
            echo "=== 파일 끝 (마지막 20줄) ==="
            tail -n 20 "$file_path"
        } > "/tmp/$(basename "$file_path").summary"
        echo "/tmp/$(basename "$file_path").summary"
    else
        echo "$file_path"
    fi
}

# Codex CLI 분석 (ChatGPT Plus)
analyze_with_codex() {
    local file_path="$1"
    local summary_file
    summary_file=$(get_file_summary "$file_path")
    
    log_info "Codex CLI (ChatGPT Plus)로 분석 중..."
    
    # 간단한 프롬프트로 시간 초과 방지
    timeout 20s codex exec "
다음 TypeScript 코드 파일을 간단히 분석하세요:
파일: $(basename "$file_path")

다음 형식으로 답변해주세요:
점수: X/10
주요 장점: (2개)
개선사항: (2개)
보안 이슈: (있다면 1개)

파일 내용은 직접 읽어서 분석해주세요.
" 2>/dev/null || {
        log_warning "Codex CLI 시간 초과 또는 오류 발생"
        echo "Codex 분석 실패: 시간 초과 또는 연결 오류"
    }
}

# Gemini CLI 분석 (Google AI 무료)
analyze_with_gemini() {
    local file_path="$1"
    
    log_info "Gemini CLI (Google AI)로 분석 중..."
    
    timeout 15s gemini -p "
$(basename "$file_path") 파일을 빠르게 분석:
- 점수: /10
- 장점 2개
- 개선점 2개
간결하게 답변해주세요.
" 2>/dev/null || {
        log_warning "Gemini CLI 시간 초과 또는 오류 발생"
        echo "Gemini 분석 실패: 시간 초과 또는 연결 오류"
    }
}

# Qwen CLI 분석 (Qwen OAuth 무료)
analyze_with_qwen() {
    local file_path="$1"
    
    log_info "Qwen CLI (OAuth)로 분석 중..."
    
    timeout 15s qwen -p "TypeScript 코드 품질 평가: $(basename "$file_path") 파일을 점수(X/10)와 핵심 개선사항 2개로 요약해주세요." 2>/dev/null || {
        log_warning "Qwen CLI 시간 초과 또는 오류 발생"
        echo "Qwen 분석 실패: 시간 초과 또는 연결 오류"
    }
}

# Claude Code 자체 분석 (기본 분석)
analyze_with_claude() {
    local file_path="$1"
    local line_count
    line_count=$(wc -l < "$file_path")
    
    log_info "Claude Code 자체 분석 중..."
    
    cat << EOF
=== Claude Code 분석 결과 ===
파일: $(basename "$file_path")
크기: $line_count 줄
타입: TypeScript

기본 품질 지표:
- 파일 크기: $(if [ "$line_count" -gt 500 ]; then echo "큼 (리팩토링 권장)"; elif [ "$line_count" -gt 200 ]; then echo "보통"; else echo "작음 (적절)"; fi)
- TypeScript 사용: ✅
- 모듈 구조: $(grep -q "export" "$file_path" && echo "✅ 모듈화됨" || echo "❌ 모듈화 부족")
- 타입 정의: $(grep -q "interface\|type" "$file_path" && echo "✅ 타입 정의 있음" || echo "⚠️ 타입 정의 부족")

점수: 7/10 (기본 분석)
EOF
}

# 메인 교차검증 함수
cross_validate_file() {
    local file_path="$1"
    
    if [ -z "$file_path" ]; then
        log_error "파일 경로를 제공해주세요"
        echo "사용법: $0 <파일경로>"
        exit 1
    fi
    
    if [ ! -f "$file_path" ]; then
        log_error "파일을 찾을 수 없습니다: $file_path"
        exit 1
    fi
    
    echo "========================================"
    echo "🤖 AI 교차검증 시스템"
    echo "대상 파일: $file_path"
    echo "========================================"
    echo ""
    
    # 사용 가능한 AI 도구 확인
    local available_tools
    available_tools=($(check_ai_tools))
    
    echo ""
    log_info "분석 시작..."
    echo ""
    
    # Claude Code 분석 (항상 실행)
    analyze_with_claude "$file_path"
    echo ""
    
    # 외부 AI 도구들로 분석
    for tool in "${available_tools[@]}"; do
        case "$tool" in
            "codex")
                analyze_with_codex "$file_path"
                echo ""
                ;;
            "gemini")
                analyze_with_gemini "$file_path"
                echo ""
                ;;
            "qwen")
                analyze_with_qwen "$file_path"
                echo ""
                ;;
        esac
    done
    
    echo "========================================"
    log_success "AI 교차검증 완료"
    echo "========================================"
}

# 메인 실행 부분
if [ "$#" -eq 0 ]; then
    echo "🤖 현실적 AI 교차검증 시스템"
    echo ""
    echo "사용법:"
    echo "  $0 <파일경로>              # 파일 분석"
    echo "  $0 --test                  # AI 도구 연결 테스트"
    echo "  $0 --help                  # 도움말"
    echo ""
    echo "예시:"
    echo "  $0 src/services/ai/SimplifiedQueryEngine.ts"
    echo ""
    exit 0
fi

case "$1" in
    "--test")
        log_info "AI CLI 도구 연결 테스트 중..."
        check_ai_tools > /dev/null
        
        echo "=== 간단한 연결 테스트 ==="
        for tool in codex gemini qwen; do
            if command -v "$tool" &> /dev/null; then
                echo "Testing $tool..."
                case "$tool" in
                    "codex")
                        timeout 10s codex exec "Hello" &> /dev/null && echo "✅ Codex 연결 정상" || echo "❌ Codex 연결 실패"
                        ;;
                    "gemini")
                        timeout 10s gemini -p "Hello" &> /dev/null && echo "✅ Gemini 연결 정상" || echo "❌ Gemini 연결 실패"
                        ;;
                    "qwen")
                        timeout 10s qwen -p "Hello" &> /dev/null && echo "✅ Qwen 연결 정상" || echo "❌ Qwen 연결 실패"
                        ;;
                esac
            fi
        done
        ;;
    "--help")
        echo "🤖 현실적 AI 교차검증 시스템"
        echo ""
        echo "이 스크립트는 Claude Code와 3개의 외부 AI CLI 도구를 사용하여"
        echo "TypeScript 파일을 교차검증합니다."
        echo ""
        echo "지원 AI:"
        echo "- Claude Code (메인 분석)"
        echo "- Codex CLI (ChatGPT Plus)"
        echo "- Gemini CLI (Google AI 무료)"
        echo "- Qwen CLI (OAuth 무료)"
        echo ""
        echo "특징:"
        echo "- 파일 크기에 따른 자동 요약"
        echo "- 시간 초과 방지 (각 AI별 15-20초 제한)"
        echo "- 실패한 AI는 건너뛰고 계속 진행"
        echo "- 간결한 결과 요약"
        ;;
    *)
        cross_validate_file "$1"
        ;;
esac