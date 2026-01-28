#!/bin/bash

# AI Review Core Functions - v8.0.0
# Claude Code 단독 코드 리뷰 시스템
#
# v8.0.0 (2026-01-28): Claude Code 단독 시스템으로 전환
#   - Codex/Gemini 제거 → Claude Code CLI만 사용
#   - 외부 AI 의존성 완전 제거
#   - 더 빠르고 일관된 리뷰 품질
#
# v7.2.1 (2026-01-15): 오탐 방지 규칙 범위 조정
# v7.2.0 (2026-01-15): 오탐 방지 규칙 추가
# v7.1.0 (2026-01-07): 레거시 코드 제거 + 주석 버그 수정
# v7.0.0 (2026-01-07): Qwen 제거 - 2-AI 시스템으로 단순화

# ============================================================================
# Claude Code 리뷰 함수 (v8.0.0: Primary & Only)
# ============================================================================

try_claude_review() {
    local changes="$1"

    log_ai_engine "🟢 Claude Code 리뷰 시작..."

    # Claude CLI 존재 확인
    if ! command -v claude >/dev/null 2>&1; then
        log_error "Claude CLI가 설치되지 않았습니다"
        log_info "설치: npm install -g @anthropic-ai/claude-code"
        return 1
    fi

    # Claude 쿼리 생성
    local query="다음 Git 변경사항을 **Senior Full-Stack Developer**로서 실무 관점에서 독립적으로 완벽하게 리뷰해주세요.

**당신의 역할**:
- **목표**: 이 변경사항 하나만으로도 배포 가능한 수준인지 검증
- **범위**: 로직, 아키텍처, 성능, 보안, 스타일 등 **모든 영역**을 포괄적으로 검토
- **기준**: \"내가 이 코드를 승인하고 배포할 수 있는가?\"

## 🔍 실시간 검증 결과 (${VERIFY_TIMESTAMP:-N/A})

\`\`\`
ESLint: ${LINT_SUMMARY:-실행 안 됨}
TypeScript: ${TS_SUMMARY:-실행 안 됨}
\`\`\`

**검증 로그 저장 위치**:
- ESLint: ${LINT_LOG:-N/A}
- TypeScript: ${TS_LOG:-N/A}

## ⚠️ 문서/테스트 검증 경고
$(cat logs/doc-validation-warning.txt 2>/dev/null || echo "없음")

---

$changes

**리뷰 요청 사항 (전체 영역 필수 검토)**:
1. **버그 및 정합성**: 런타임 에러, 비즈니스 로직 오류, 엣지 케이스
2. **코드 품질 및 구조**: 가독성, 모듈 분리, 유지보수성, 아키텍처 일관성
3. **성능 및 효율성**: 불필요한 연산, 메모리 누수, 리소스 최적화
4. **보안 및 안정성**: 보안 취약점, 에러 처리, 타입 안전성(TypeScript)
5. **문서/테스트 업데이트 필요성**: 새 함수/클래스에 테스트 필요한지, API/설정 변경에 문서 업데이트 필요한지 평가
6. **종합 평가**: 점수 (1-10) 및 승인 여부 (승인/조건부 승인/거부)

**⛔ 리뷰 제외 (오탐 방지)**:
- hooks/, scripts/ 파일에 테스트 부재 지적 금지
- \`catch { /* ignore */ }\` 등은 의도적 사용으로 간주 (단, 데이터 손실/보안 위험은 지적)
- .md는 코드 품질 평가 대상 아님
- .json, .yaml은 스타일/포맷 지적 제외 (보안/동작 영향은 리뷰)

**출력 형식**:
- 📌 각 항목을 명확히 구분하여 상세히 작성
- 💡 구체적인 코드 위치 및 개선 코드(Snippet) 필수 제공
- 📚 문서/테스트 관련 권장사항이 있다면 명시
- ⭐ 종합 의견 및 결론

**참고**: 위 검증 결과는 실제 실행 결과입니다. 이를 바탕으로 리뷰해주세요."

    # Claude CLI 실행
    local claude_output
    local claude_exit_code=0

    # 타임아웃 180초 (충분한 분석 시간)
    if claude_output=$(timeout 180 claude -p "$query" 2>&1); then
        echo "claude" > /tmp/ai_engine_auto_review
        echo "$claude_output"
        return 0
    else
        claude_exit_code=$?
        log_error "Claude 리뷰 실패 (Exit code: $claude_exit_code)"
        return 1
    fi
}

# ============================================================================
# [REMOVED v8.0.0] Codex/Gemini 리뷰 함수 - 외부 AI 제거됨
# try_codex_review, try_gemini_review
# 제거 사유: Claude Code 단독 시스템으로 전환
# ============================================================================

# ============================================================================
# AI 리뷰 실행 (v8.0.0: Claude Code 단독)
# ============================================================================

# 지연 보상 파일 경로
PENDING_REVIEWS_FILE="$PROJECT_ROOT/logs/code-reviews/.pending-reviews"

# AI별 리뷰 함수 매핑 (v8.0.0: Claude 단독)
run_single_ai_review() {
    local ai_name="$1"
    local changes="$2"

    case "$ai_name" in
        claude)
            try_claude_review "$changes"
            ;;
        *)
            log_error "지원되지 않는 AI: $ai_name (Claude만 지원)"
            return 1
            ;;
    esac
}

# 실패한 커밋 저장 (다음 커밋 때 보상)
save_pending_review() {
    local commit_hash="$1"
    echo "$commit_hash" >> "$PENDING_REVIEWS_FILE"
    log_warning "📝 실패한 커밋 저장: $commit_hash (다음 커밋 때 보상 리뷰)"
}

# 보류 중인 리뷰 확인 및 처리
check_pending_reviews() {
    if [ -f "$PENDING_REVIEWS_FILE" ]; then
        local pending=$(cat "$PENDING_REVIEWS_FILE" 2>/dev/null | tr '\n' ' ')
        if [ -n "$pending" ]; then
            log_info "📋 이전 실패 커밋 발견: $pending"
            return 0
        fi
    fi
    return 1
}

# 보류 중인 리뷰 클리어
clear_pending_reviews() {
    rm -f "$PENDING_REVIEWS_FILE"
    log_success "✅ 보류 중인 리뷰 클리어 완료"
}

# 리뷰 성공 처리 헬퍼
handle_review_success() {
    local ai="$1"
    local output="$2"
    local message="${3:-리뷰 성공}"

    log_success "${ai^^} ${message}!"
    increment_ai_counter "$ai"
    set_last_ai "$ai"
    AI_ENGINE="$ai"

    # 성공 시 보류 중인 리뷰 클리어
    if check_pending_reviews; then
        clear_pending_reviews
    fi

    echo "$output"
}

# v8.0.0: Claude Code 단독 리뷰 실행
run_ai_review() {
    local changes="$1"
    local review_output=""

    # 임시 파일 초기화
    rm -f /tmp/ai_engine_auto_review

    log_info "🎯 Claude Code 리뷰 실행"

    # Claude 리뷰 시도
    if review_output=$(run_single_ai_review "claude" "$changes"); then
        handle_review_success "claude" "$review_output" "리뷰 성공"
        return 0
    fi

    # Claude 실패 시 지연 보상
    local current_commit=$(git -C "$PROJECT_ROOT" log -1 --format=%h 2>/dev/null || echo "unknown")
    save_pending_review "$current_commit"

    log_error "❌ Claude Code 리뷰 실패 - 다음 커밋 때 보상 리뷰 예정"
    rm -f /tmp/ai_engine_auto_review
    return 1
}
