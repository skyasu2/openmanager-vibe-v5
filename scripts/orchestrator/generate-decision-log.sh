#!/bin/bash

# Decision Log Template Generator for Multi-AI Cross-Verification
# 버전: v1.0.0
# 날짜: 2025-11-08
# 목적: Phase 4 - orchestrator에서 TEMPLATE.md 포맷 Decision Log 자동 생성

set -euo pipefail

# 프로젝트 루트 자동 결정 (포터블)
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 로그 함수
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

# 도움말
usage() {
    cat << EOF
${CYAN}📝 Decision Log Template Generator v1.0.0${NC}

${YELLOW}⚠️  이 스크립트는 orchestrator Phase 4에서 자동 호출됩니다${NC}
${YELLOW}   사용자는 직접 실행보다 orchestrator를 통해 사용합니다${NC}

사용 방법:
  $0 --topic "주제" --context "상황 설명" [옵션]

필수 파라미터:
  --topic TOPIC          Decision Log 주제 (예: "Node.js v24 사용")
  --context CONTEXT      상황 설명 (예: "package.json vs 실제 버전 불일치")

선택적 파라미터:
  --output OUTPUT        출력 파일 경로 (기본: logs/ai-decisions/YYYY-MM-DD-[slug].md)
  --codex FILE          Codex 결과 파일 (기본: /tmp/codex_result.txt)
  --gemini FILE         Gemini 결과 파일 (기본: /tmp/gemini_result.txt)
  --qwen FILE           Qwen 결과 파일 (기본: /tmp/qwen_result.txt)
  --dry-run             실제 파일 생성 없이 미리보기만

예시:
  $0 --topic "Gemini timeout 통일" --context "300초 vs 600초 선택"
  
  # orchestrator Phase 4 통합 예시:
  ./generate-decision-log.sh \\
    --topic "\${DECISION_TOPIC}" \\
    --context "\${DECISION_CONTEXT}" \\
    --codex /tmp/codex_result.txt \\
    --gemini /tmp/gemini_result.txt \\
    --qwen /tmp/qwen_result.txt

특징:
  ✅ TEMPLATE.md 포맷 자동 생성
  ✅ 3-AI 의견 자동 파싱 (핵심 주장, 근거, 추천 사항)
  ✅ 합의/충돌 자동 감지
  ✅ 실행 시간 자동 추출
  ✅ 파일명 slug 자동 생성

출력 위치:
  logs/ai-decisions/YYYY-MM-DD-[topic-slug].md

참고:
  - TEMPLATE.md 구조 기반
  - 2025-10-25-monitoring-cleanup-3ai-analysis.md 실제 사례 기반
  - 2025-11-03-node-v24-usage-decision.md 검증 완료
EOF
    exit 1
}

# 파라미터 파싱
TOPIC=""
CONTEXT=""
OUTPUT=""
CODEX_FILE="/tmp/codex_result.txt"
GEMINI_FILE="/tmp/gemini_result.txt"
QWEN_FILE="/tmp/qwen_result.txt"
DRY_RUN=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --topic)
            TOPIC="$2"
            shift 2
            ;;
        --context)
            CONTEXT="$2"
            shift 2
            ;;
        --output)
            OUTPUT="$2"
            shift 2
            ;;
        --codex)
            CODEX_FILE="$2"
            shift 2
            ;;
        --gemini)
            GEMINI_FILE="$2"
            shift 2
            ;;
        --qwen)
            QWEN_FILE="$2"
            shift 2
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        -h|--help)
            usage
            ;;
        *)
            echo "알 수 없는 옵션: $1" >&2
            usage
            ;;
    esac
done

# 필수 파라미터 확인
if [ -z "$TOPIC" ]; then
    log_error "--topic 파라미터가 필요합니다"
    usage
fi

if [ -z "$CONTEXT" ]; then
    log_error "--context 파라미터가 필요합니다"
    usage
fi

# AI 결과 파일 존재 확인 (존재하는 파일만 검증)
# 참고: orchestrator에서 --skip-* 플래그 사용 시 일부 파일 생략 가능
AI_FILES_FOUND=0
AI_FILES_CHECKED=0

for file_var in CODEX_FILE GEMINI_FILE QWEN_FILE; do
    file_path="${!file_var}"

    # 기본 경로(/tmp/*_result.txt)가 아닌 경우에만 검증 (orchestrator가 명시적으로 전달한 파일)
    # 또는 기본 경로이지만 실제 존재하는 경우 (직접 실행 시)
    if [[ "$file_path" != "/tmp/"*"_result.txt" ]] || [ -f "$file_path" ]; then
        AI_FILES_CHECKED=$((AI_FILES_CHECKED + 1))
        if [ -f "$file_path" ]; then
            AI_FILES_FOUND=$((AI_FILES_FOUND + 1))
            log_info "✓ AI 결과 파일 확인: $file_path"
        else
            log_error "AI 결과 파일이 없습니다: $file_path"
            exit 1
        fi
    fi
done

# 최소 1개 이상의 AI 결과 파일 필요
if [ "$AI_FILES_FOUND" -eq 0 ]; then
    log_error "최소 1개 이상의 AI 결과 파일이 필요합니다"
    log_error "제공된 파일: --codex $CODEX_FILE --gemini $GEMINI_FILE --qwen $QWEN_FILE"
    exit 1
fi

log_success "AI 결과 파일 검증 완료 ($AI_FILES_FOUND/$AI_FILES_CHECKED 파일 확인됨)"

log_info "🚀 Decision Log 생성 시작..."

# 날짜 및 파일명 slug 생성
DATE=$(date +%Y-%m-%d)
SLUG=$(echo "$TOPIC" | tr '[:upper:]' '[:lower:]' | sed 's/ /-/g' | sed 's/[^a-z0-9-]//g')

# 출력 파일 경로 결정
if [ -z "$OUTPUT" ]; then
    OUTPUT="${PROJECT_ROOT}/logs/ai-decisions/${DATE}-${SLUG}.md"
fi

log_info "📄 출력 파일: $OUTPUT"

# AI 의견 파싱 함수
parse_ai_opinion() {
    local ai_name="$1"
    local file="$2"
    local perspective="$3"
    
    # 실행 시간 추출 (wrapper 로그에서)
    local duration="정보 없음"
    if grep -q "실행 성공" "$file" 2>/dev/null; then
        duration=$(grep -oP '실행 성공 \(\K[0-9]+' "$file" || echo "정보 없음")
        if [ "$duration" != "정보 없음" ]; then
            duration="${duration}초"
        fi
    fi
    
    # 핵심 주장 추출 (첫 3줄의 요약 또는 명시적 "핵심 주장" 섹션)
    local claim=""
    if grep -q "핵심 주장" "$file" 2>/dev/null; then
        claim=$(awk '/핵심 주장/,/근거/ {if (!/핵심 주장/ && !/근거/) print}' "$file" | sed 's/^[[:space:]]*//' | head -3 | paste -sd ' ')
    else
        claim=$(head -5 "$file" | grep -v "^#" | grep -v "^$" | head -1 | sed 's/^[[:space:]]*//')
    fi
    
    # 근거 추출
    local reasoning=""
    if grep -q "근거" "$file" 2>/dev/null; then
        reasoning=$(awk '/근거/,/추천/ {if (!/근거/ && !/추천/) print}' "$file" | sed 's/^[[:space:]]*//' | head -3 | paste -sd ' ')
    else
        reasoning=$(head -10 "$file" | grep -v "^#" | grep -v "^$" | sed -n '2,4p' | paste -sd ' ')
    fi
    
    # 추천 사항 추출
    local recommendations=""
    if grep -q "추천" "$file" 2>/dev/null; then
        recommendations=$(awk '/추천/,/^$/ {if (!/추천/) print}' "$file" | sed 's/^[[:space:]]*//' | head -3 | paste -sd ' ')
    else
        recommendations=$(tail -5 "$file" | grep -v "^#" | grep -v "^$" | head -2 | paste -sd ' ')
    fi
    
    # 기본값 설정 (빈 값 방지)
    claim=${claim:-"파일에서 핵심 주장을 추출할 수 없습니다"}
    reasoning=${reasoning:-"파일에서 근거를 추출할 수 없습니다"}
    recommendations=${recommendations:-"파일에서 추천 사항을 추출할 수 없습니다"}
    
    cat << EOF

### $ai_name ($perspective) - $duration

**핵심 주장**:
$claim

**근거**:
$reasoning

**추천 사항**:
$recommendations
EOF
}

# 합의/충돌 감지 함수
detect_consensus_and_conflicts() {
    local codex_file="$1"
    local gemini_file="$2"
    local qwen_file="$3"
    
    # 키워드 기반 합의 감지 (간단한 구현)
    local codex_keywords=$(grep -oP '\b(권장|추천|제안|승인|동의)\b' "$codex_file" 2>/dev/null | sort -u | paste -sd ',' || echo "")
    local gemini_keywords=$(grep -oP '\b(권장|추천|제안|승인|동의)\b' "$gemini_file" 2>/dev/null | sort -u | paste -sd ',' || echo "")
    local qwen_keywords=$(grep -oP '\b(권장|추천|제안|승인|동의)\b' "$qwen_file" 2>/dev/null | sort -u | paste -sd ',' || echo "")
    
    # 충돌 감지 (반대, 경고 키워드)
    local codex_conflicts=$(grep -oP '\b(반대|경고|위험|문제|우려)\b' "$codex_file" 2>/dev/null | sort -u | paste -sd ',' || echo "")
    local gemini_conflicts=$(grep -oP '\b(반대|경고|위험|문제|우려)\b' "$gemini_file" 2>/dev/null | sort -u | paste -sd ',' || echo "")
    local qwen_conflicts=$(grep -oP '\b(반대|경고|위험|문제|우려)\b' "$qwen_file" 2>/dev/null | sort -u | paste -sd ',' || echo "")
    
    cat << EOF

## ⚖️ 합의점과 충돌점

### ✅ 합의

- 3-AI 분석 결과 자동 추출 필요 (수동 검토 권장)
- 키워드 감지: Codex ($codex_keywords), Gemini ($gemini_keywords), Qwen ($qwen_keywords)

### ⚠️ 충돌

- 충돌 키워드 감지: Codex ($codex_conflicts), Gemini ($gemini_conflicts), Qwen ($qwen_conflicts)
- **주의**: 자동 감지 한계 - 실제 의견 차이는 수동 검토 필요
EOF
}

# Decision Log 생성
generate_decision_log() {
    local topic="$1"
    local context="$2"
    local output="$3"
    
    log_info "📝 TEMPLATE.md 포맷 기반 Decision Log 생성 중..."
    
    # 실행 시간 계산 (wrapper 로그에서)
    local codex_time=$(grep -oP '실행 성공 \(\K[0-9]+' "$CODEX_FILE" 2>/dev/null || echo "0")
    local gemini_time=$(grep -oP '실행 성공 \(\K[0-9]+' "$GEMINI_FILE" 2>/dev/null || echo "0")
    local qwen_time=$(grep -oP '실행 성공 \(\K[0-9]+' "$QWEN_FILE" 2>/dev/null || echo "0")
    local total_time=$((codex_time + gemini_time + qwen_time))
    
    cat > "$output" << EOF
# $topic - AI 교차검증 의사결정

**날짜**: $DATE
**상황**: $context
**검증 방법**: Codex + Gemini + Qwen 병렬 분석
**총 실행 시간**: ${total_time}초 (Codex ${codex_time}초 + Gemini ${gemini_time}초 + Qwen ${qwen_time}초)

---

## 🤖 AI 의견 요약
$(parse_ai_opinion "📊 Codex" "$CODEX_FILE" "실무 관점")
$(parse_ai_opinion "📐 Gemini" "$GEMINI_FILE" "아키텍처 관점")
$(parse_ai_opinion "⚡ Qwen" "$QWEN_FILE" "성능 관점")

---
$(detect_consensus_and_conflicts "$CODEX_FILE" "$GEMINI_FILE" "$QWEN_FILE")

---

## 🎯 최종 결정

**채택된 방안**: [자동 생성 불가 - 수동 입력 필요]

**근거**:
- [이유 1 - 수동 입력 필요]
- [이유 2 - 수동 입력 필요]

**기각된 의견**: [있다면 수동 입력 필요]
- [왜 기각했는지 - 수동 입력 필요]

---

## 📝 실행 내역

**즉시 실행**:
- [ ] [작업 1 - 수동 입력 필요]
- [ ] [작업 2 - 수동 입력 필요]

**향후 계획**:
- [ ] [작업 3 - 수동 입력 필요]
- [ ] [작업 4 - 수동 입력 필요]

**참고 사항**:
- [추가 정보 - 수동 입력 필요]

---

**작성**: generate-decision-log.sh v1.0.0 (자동 생성)
**검증**: 3-AI 교차검증 (Codex + Gemini + Qwen)
**최종 편집**: [Claude Code - 수동 보완 필요]
EOF
    
    log_success "Decision Log 생성 완료: $output"
}

# 메인 실행
main() {
    if [ "$DRY_RUN" = true ]; then
        log_warning "🔍 Dry-run 모드: 파일 생성 없이 미리보기만"
        OUTPUT="/tmp/decision-log-preview.md"
    fi
    
    # Decision Log 생성
    generate_decision_log "$TOPIC" "$CONTEXT" "$OUTPUT"
    
    if [ "$DRY_RUN" = true ]; then
        log_info "📖 미리보기:"
        cat "$OUTPUT"
        rm -f "$OUTPUT"
    else
        log_success "✅ 완료: $OUTPUT"
        log_info "📝 다음 단계:"
        echo "  1. 생성된 파일을 열어 '최종 결정' 섹션 수동 작성"
        echo "  2. '실행 내역' 섹션 수동 작성"
        echo "  3. '합의점과 충돌점' 섹션 수동 검토 및 보완"
        echo "  4. AI 의견 자동 파싱 결과 검토 및 수정"
    fi
}

main "$@"
