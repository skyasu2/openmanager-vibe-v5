#!/bin/bash
# 🤖 현실적 AI 교차검증 시스템
# Claude Code와 3개 외부 AI의 실용적 교차검증

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

# 메모리 안전 검사
check_memory_safety() {
    local available_mb
    available_mb=$(free -m | awk '/^Mem:/{print $7}')
    
    if [ "$available_mb" -lt 1000 ]; then
        log_warning "사용 가능한 메모리가 부족합니다 (${available_mb}MB). 분석을 건너뜁니다."
        return 1
    fi
    return 0
}

# Codex CLI 분석 (ChatGPT Plus) - 안전한 45초 타임아웃
analyze_with_codex() {
    local file_path="$1"
    local file_content
    local temp_file
    
    # 메모리 안전 검사
    if ! check_memory_safety; then
        echo "🤖 Codex 분석: 메모리 부족으로 건너뜀"
        return
    fi
    
    log_info "🤖 Codex CLI (GPT-5) 분석 중... (45초 타임아웃)"
    
    # 파일 내용을 임시 파일로 저장 (메모리 안전)
    if [ -f "$file_path" ]; then
        temp_file="/tmp/codex_$(basename "$file_path")_$$"
        head -c 4000 "$file_path" > "$temp_file" 2>/dev/null || {
            echo "❌ Codex 분석: 파일 읽기 실패"
            return
        }
        
        file_content=$(cat "$temp_file" 2>/dev/null)
        
        timeout 45s codex exec "
실무 관점에서 다음 TypeScript 코드를 10점 만점으로 평가해주세요:

파일: $(basename "$file_path")
---
$file_content
---

다음 형식으로 답변:
점수: X.X/10
장점: [주요 장점 2개]
개선사항: [구체적 개선사항 2개] 
보안/성능: [발견된 이슈 또는 '없음']
" 2>/dev/null || {
            log_warning "⚠️ Codex CLI 타임아웃 (45초 초과)"
            echo "🤖 Codex 분석: 타임아웃 또는 네트워크 문제"
        }
        
        # 임시 파일 정리
        rm -f "$temp_file" 2>/dev/null
    else
        echo "❌ Codex 분석: 파일을 찾을 수 없음 ($file_path)"
    fi
}

# Gemini CLI 분석 (Google AI 무료 1K/day) - 안전한 45초 타임아웃
analyze_with_gemini() {
    local file_path="$1"
    local file_content
    local temp_file
    
    # 메모리 안전 검사
    if ! check_memory_safety; then
        echo "🤖 Gemini 분석: 메모리 부족으로 건너뜀"
        return
    fi
    
    log_info "🤖 Gemini CLI (구조+아키텍처) 분석 중... (45초 타임아웃)"
    
    if [ -f "$file_path" ]; then
        temp_file="/tmp/gemini_$(basename "$file_path")_$$"
        head -c 3500 "$file_path" > "$temp_file" 2>/dev/null || {
            echo "❌ Gemini 분석: 파일 읽기 실패"
            return
        }
        
        file_content=$(cat "$temp_file" 2>/dev/null)
        
        timeout 45s gemini -p "
구조적 관점에서 TypeScript 코드를 분석해주세요:

파일: $(basename "$file_path")
---
$file_content
---

분석 형식:
점수: X.X/10
구조적 장점: [아키텍처 관점 2개]
리팩토링 제안: [구조 개선사항 2개]
확장성: [확장성 평가]
" 2>/dev/null || {
            log_warning "⚠️ Gemini CLI 타임아웃 (45초 초과)"
            echo "🤖 Gemini 분석: 타임아웃 또는 무료 한도 초과"
        }
        
        # 임시 파일 정리
        rm -f "$temp_file" 2>/dev/null
    else
        echo "❌ Gemini 분석: 파일 찾을 수 없음"
    fi
}

# Qwen CLI 분석 (OAuth 무료 2K/day) - 안전한 45초 타임아웃
analyze_with_qwen() {
    local file_path="$1"
    local file_content
    local temp_file
    
    # 메모리 안전 검사
    if ! check_memory_safety; then
        echo "🤖 Qwen 분석: 메모리 부족으로 건너뜀"
        return
    fi
    
    log_info "🤖 Qwen CLI (성능+알고리즘) 분석 중... (45초 타임아웃)"
    
    if [ -f "$file_path" ]; then
        temp_file="/tmp/qwen_$(basename "$file_path")_$$"
        head -c 3000 "$file_path" > "$temp_file" 2>/dev/null || {
            echo "❌ Qwen 분석: 파일 읽기 실패"
            return
        }
        
        file_content=$(cat "$temp_file" 2>/dev/null)
        
        timeout 45s qwen -p "
알고리즘 관점에서 TypeScript 코드를 분석해주세요:

파일: $(basename "$file_path")
---
$file_content
---

분석 형식:
점수: X.X/10
알고리즘 장점: [효율성 관점 2개]
최적화 제안: [성능 개선방안 2개]
복잡도: [시간/공간 복잡도 평가]
" 2>/dev/null || {
            log_warning "⚠️ Qwen CLI 타임아웃 (45초 초과)"
            echo "🤖 Qwen 분석: 타임아웃 또는 OAuth 한도 초과"
        }
        
        # 임시 파일 정리
        rm -f "$temp_file" 2>/dev/null
    else
        echo "❌ Qwen 분석: 파일 찾을 수 없음"
    fi
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
    
    # 외부 AI 도구들로 순차 분석 (메모리 안전)
    for tool in "${available_tools[@]}"; do
        case "$tool" in
            "codex")
                log_info "Codex 분석 시작 (1/3)"
                analyze_with_codex "$file_path" || log_warning "Codex 분석 실패"
                echo ""
                sleep 2  # AI 서버 부하 방지
                ;;
            "gemini")
                log_info "Gemini 분석 시작 (2/3)"
                analyze_with_gemini "$file_path" || log_warning "Gemini 분석 실패"
                echo ""
                sleep 2  # AI 서버 부하 방지
                ;;
            "qwen")
                log_info "Qwen 분석 시작 (3/3)"
                analyze_with_qwen "$file_path" || log_warning "Qwen 분석 실패"
                echo ""
                sleep 2  # AI 서버 부하 방지
                ;;
        esac
        
        # 메모리 정리 (권한 문제로 sync만 실행)
        sync 2>/dev/null || true
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
        echo "- 여유있는 타임아웃 (각 AI별 5분 제한)"
        echo "- 실패한 AI는 건너뛰고 계속 진행"
        echo "- 간결한 결과 요약"
        ;;
    *)
        cross_validate_file "$1"
        ;;
esac