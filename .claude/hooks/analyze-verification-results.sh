#!/bin/bash

# AI 교차 검증 결과 분석 및 의사결정 시스템
# 사용법: ./analyze-verification-results.sh <results_file>

set -e

RESULTS_FILE="${1:-/tmp/ai-verification-results.txt}"
DECISION_LOG=".claude/verification-decisions.log"
REPORTS_DIR=".claude/verification-reports"

# 보고서 디렉토리 생성
mkdir -p "$REPORTS_DIR"

# 로그 함수
log_decision() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$DECISION_LOG"
}

# 점수 추출 및 검증
extract_scores() {
    local result_text="$1"
    
    # 10점 만점 점수 추출 (정규식 패턴)
    local score=$(echo "$result_text" | grep -oE '[0-9]+(\.[0-9]+)?/10|[0-9]+(\.[0-9]+)?\s*점|점수.*[0-9]+(\.[0-9]+)?|Score:.*[0-9]+(\.[0-9]+)?' | head -1 | grep -oE '[0-9]+(\.[0-9]+)?' || echo "0")
    
    # 점수가 10을 초과하면 10으로 제한
    if (( $(echo "$score > 10" | bc -l 2>/dev/null || echo 0) )); then
        score="10"
    fi
    
    echo "$score"
}

# 보안 이슈 탐지
detect_security_issues() {
    local result_text="$1"
    
    # 보안 관련 키워드 탐지
    if echo "$result_text" | grep -iE "(security|보안|vulnerability|취약점|exploit|injection|XSS|CSRF|authentication|인증|authorization|인가)" >/dev/null; then
        return 0  # 보안 이슈 발견
    else
        return 1  # 보안 이슈 없음
    fi
}

# 종합 의사결정
make_decision() {
    local file_path="$1"
    local claude_score="$2"
    local ai_scores=("${@:3}")  # 나머지 모든 인자는 AI 점수들
    
    # 평균 점수 계산
    local total_score=$claude_score
    local count=1
    
    for score in "${ai_scores[@]}"; do
        if [[ -n "$score" && "$score" != "0" ]]; then
            total_score=$(echo "$total_score + $score" | bc -l)
            ((count++))
        fi
    done
    
    local avg_score=$(echo "scale=2; $total_score / $count" | bc -l)
    
    # 의사결정 규칙
    local decision=""
    local confidence=""
    
    if (( $(echo "$avg_score >= 8.5" | bc -l) )); then
        decision="✅ 자동 승인"
        confidence="HIGH"
    elif (( $(echo "$avg_score >= 6.0" | bc -l) )); then
        decision="⚠️ 조건부 승인"
        confidence="MEDIUM"
    else
        decision="❌ 재작업 필요"
        confidence="LOW"
    fi
    
    # 보안 이슈가 있으면 무조건 거절
    if detect_security_issues "$(cat "$RESULTS_FILE")"; then
        decision="🚨 보안 이슈로 인한 즉시 거절"
        confidence="CRITICAL"
    fi
    
    # 결과 출력
    cat << EOF
📊 AI 교차 검증 결과 분석

📁 대상 파일: $file_path
🎯 평균 점수: $avg_score/10
📈 참여 AI: $count개
🔍 신뢰도: $confidence

📋 개별 점수:
  - Claude: $claude_score/10
$(for i in "${!ai_scores[@]}"; do
  if [[ -n "${ai_scores[$i]}" && "${ai_scores[$i]}" != "0" ]]; then
    echo "  - AI-$((i+1)): ${ai_scores[$i]}/10"
  fi
done)

🎯 최종 결정: $decision

EOF

    # 로그 기록
    log_decision "파일: $file_path | 평균: $avg_score | 결정: $decision | 신뢰도: $confidence"
    
    # 상세 보고서 생성
    local report_file="$REPORTS_DIR/$(basename "$file_path")_$(date +%Y%m%d_%H%M%S).md"
    generate_detailed_report "$file_path" "$avg_score" "$decision" "$confidence" > "$report_file"
    
    echo "📄 상세 보고서: $report_file"
    
    return 0
}

# 상세 보고서 생성
generate_detailed_report() {
    local file_path="$1"
    local avg_score="$2" 
    local decision="$3"
    local confidence="$4"
    
    cat << EOF
# AI 교차 검증 상세 보고서

## 📋 기본 정보
- **파일**: \`$file_path\`
- **검증 일시**: $(date '+%Y-%m-%d %H:%M:%S')
- **평균 점수**: $avg_score/10
- **신뢰도**: $confidence

## 🎯 최종 결정
$decision

## 📊 상세 분석

### AI 검토 결과
\`\`\`
$(cat "$RESULTS_FILE" 2>/dev/null || echo "결과 파일을 읽을 수 없습니다")
\`\`\`

### 권장 사항
EOF

    case "$decision" in
        *"자동 승인"*)
            echo "- ✅ 코드 품질이 우수합니다. 배포 가능합니다."
            echo "- 🚀 다음 단계로 진행하시기 바랍니다."
            ;;
        *"조건부 승인"*)
            echo "- ⚠️ 일부 개선사항이 발견되었습니다."
            echo "- 🔧 제안된 개선사항을 검토 후 적용을 고려하세요."
            echo "- 📝 중요한 문제가 없다면 배포 가능합니다."
            ;;
        *"재작업 필요"*)
            echo "- ❌ 코드 품질 개선이 필요합니다."
            echo "- 🛠️ AI가 제시한 문제점들을 해결하세요."
            echo "- 🔄 개선 후 재검토를 받으시기 바랍니다."
            ;;
        *"보안 이슈"*)
            echo "- 🚨 **즉시 수정 필요**: 보안 취약점이 발견되었습니다."
            echo "- 🔒 배포를 중단하고 보안 문제를 해결하세요."
            echo "- 👨‍💻 보안 전문가의 추가 검토를 권장합니다."
            ;;
    esac
}

# 메인 실행
if [[ ! -f "$RESULTS_FILE" ]]; then
    echo "❌ 결과 파일을 찾을 수 없습니다: $RESULTS_FILE"
    exit 1
fi

# 파일 경로는 결과 파일에서 추출하거나 인자로 받음
FILE_PATH="${2:-unknown_file}"

# 임시로 더미 점수들 생성 (실제로는 결과 파일에서 파싱)
CLAUDE_SCORE=$(extract_scores "$(head -20 "$RESULTS_FILE")")
AI_SCORES=(
    $(extract_scores "$(sed -n '21,40p' "$RESULTS_FILE")")
    $(extract_scores "$(sed -n '41,60p' "$RESULTS_FILE")")
    $(extract_scores "$(tail -20 "$RESULTS_FILE")")
)

# 최종 의사결정 실행
make_decision "$FILE_PATH" "$CLAUDE_SCORE" "${AI_SCORES[@]}"