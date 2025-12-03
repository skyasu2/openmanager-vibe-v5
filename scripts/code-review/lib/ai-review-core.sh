#!/bin/bash

# AI Review Core Functions - v6.4.0
# AI 리뷰 실행 함수들 (Codex, Gemini, Qwen, Claude)
#
# v6.4.0 (2025-12-03): Rate Limit 감지 통합 + 초기 상태 버그 수정
# - 순번: codex → gemini → claude (순환)
# - 🆕 Gemini/Qwen Rate Limit 감지 통합
# - 🆕 초기 상태: last_ai=claude → 첫 선택 codex
# - 폴백 체인: Primary(codex/gemini/claude) → Qwen → Claude(절대 최종)

# ============================================================================
# Codex 리뷰 함수
# ============================================================================

try_codex_review() {
    local changes="$1"

    log_ai_engine "🚀 Codex 코드 리뷰 시도 중..."

    # Codex 쿼리 생성 (Independent Practical Reviewer)
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
5. **종합 평가**: 점수 (1-10) 및 승인 여부 (승인/조건부 승인/거부)

**출력 형식**:
- 📌 각 항목을 명확히 구분하여 상세히 작성
- 💡 구체적인 코드 위치 및 개선 코드(Snippet) 필수 제공
- ⭐ 종합 의견 및 결론

**참고**: 위 검증 결과는 실제 실행 결과입니다. 이를 바탕으로 리뷰해주세요."

    # Codex 실행 (wrapper 사용)
    local codex_output
    local codex_exit_code=0

    if codex_output=$(bash "$PROJECT_ROOT/scripts/ai-subagents/codex-wrapper.sh" "$query"); then
        # Rate limit 체크
        if detect_codex_rate_limit "$codex_output"; then
            log_warning "Codex 사용량 제한 감지 (Rate limit or quota exceeded)"
            return 1  # 실패 반환 → Gemini로 폴백
        fi

        # 파일 디스크립터를 통해 AI_ENGINE 전파
        echo "codex" > /tmp/ai_engine_auto_review
        echo "$codex_output"
        return 0
    else
        codex_exit_code=$?
        log_error "Codex 리뷰 실패 (Exit code: $codex_exit_code)"
        return 1
    fi
}

# ============================================================================
# Gemini 리뷰 함수
# ============================================================================

try_gemini_review() {
    local changes="$1"

    log_ai_engine "🟣 Gemini 코드 리뷰 시도 중..."

    # Gemini 쿼리 생성 (Independent Practical Reviewer)
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
5. **종합 평가**: 점수 (1-10) 및 승인 여부 (승인/조건부 승인/거부)

**출력 형식**:
- 📌 각 항목을 명확히 구분하여 상세히 작성
- 💡 구체적인 코드 위치 및 개선 코드(Snippet) 필수 제공
- ⭐ 종합 의견 및 결론

**참고**: 위 검증 결과는 실제 실행 결과입니다. 이를 바탕으로 리뷰해주세요."

    # Gemini 실행 (wrapper 사용) - Codex/Qwen과 동일한 패턴
    local gemini_output
    local gemini_exit_code=0

    if gemini_output=$(bash "$PROJECT_ROOT/scripts/ai-subagents/gemini-wrapper.sh" "$query"); then
        # Rate limit 체크 (v6.4.0)
        if detect_gemini_rate_limit "$gemini_output"; then
            log_warning "Gemini 사용량 제한 감지 (Rate limit or quota exceeded)"
            return 1  # 실패 반환 → Qwen으로 폴백
        fi

        # 파일 디스크립터를 통해 AI_ENGINE 전파
        echo "gemini" > /tmp/ai_engine_auto_review
        echo "$gemini_output"
        return 0
    else
        gemini_exit_code=$?
        log_error "Gemini 리뷰 실패 (Exit code: $gemini_exit_code)"
        return 1
    fi
}

# ============================================================================
# Qwen 리뷰 함수 (v5.0.0 신규)
# ============================================================================

try_qwen_review() {
    local changes="$1"

    log_ai_engine "🟡 Qwen 코드 리뷰 시도 중..."

    # Qwen 쿼리 생성 (Independent Practical Reviewer)
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
5. **종합 평가**: 점수 (1-10) 및 승인 여부 (승인/조건부 승인/거부)

**출력 형식**:
- 📌 각 항목을 명확히 구분하여 상세히 작성
- 💡 구체적인 코드 위치 및 개선 코드(Snippet) 필수 제공
- ⭐ 종합 의견 및 결론

**참고**: 위 검증 결과는 실제 실행 결과입니다. 이를 바탕으로 리뷰해주세요."

    # Qwen 실행 (wrapper 사용)
    local qwen_output
    local qwen_exit_code=0

    if qwen_output=$(bash "$PROJECT_ROOT/scripts/ai-subagents/qwen-wrapper.sh" "$query"); then
        # Rate limit 체크 (v6.4.0)
        if detect_qwen_rate_limit "$qwen_output"; then
            log_warning "Qwen 사용량 제한 감지 (Rate limit or throttled)"
            return 1  # 실패 반환 → Claude로 폴백
        fi

        # 파일 디스크립터를 통해 AI_ENGINE 전파
        echo "qwen" > /tmp/ai_engine_auto_review
        echo "$qwen_output"
        return 0
    else
        qwen_exit_code=$?
        log_error "Qwen 리뷰 실패 (Exit code: $qwen_exit_code)"
        return 1
    fi
}

# ============================================================================
# Claude Code 서브에이전트 리뷰 함수 (v5.0.0: code-review-specialist 통합)
# ============================================================================

claude_code_review_with_subagent() {
    local changes="$1"

    log_ai_engine "🤖 Claude Code 서브에이전트 리뷰 시작 (code-review-specialist)..."

    # claude 명령어가 있는지 확인
    if command -v claude >/dev/null 2>&1; then
        log_info "Claude CLI 감지됨. 직접 실행을 시도합니다."

        local query="다음 Git 변경사항을 **Senior Full-Stack Developer**로서 실무 관점에서 독립적으로 완벽하게 리뷰해주세요.

        **당신의 역할**:
        - **목표**: 이 변경사항 하나만으로도 배포 가능한 수준인지 검증
        - **범위**: 로직, 아키텍처, 성능, 보안, 스타일 등 **모든 영역**을 포괄적으로 검토
        - **기준**: \"내가 이 코드를 승인하고 배포할 수 있는가?\"

$changes

**리뷰 요청 사항 (전체 영역 필수 검토)**:
1. **버그 및 정합성**: 런타임 에러, 비즈니스 로직 오류, 엣지 케이스
2. **코드 품질 및 구조**: 가독성, 모듈 분리, 유지보수성, 아키텍처 일관성
3. **성능 및 효율성**: 불필요한 연산, 메모리 누수, 리소스 최적화
4. **보안 및 안정성**: 보안 취약점, 에러 처리, 타입 안전성(TypeScript)
5. **종합 평가**: 점수 (1-10) 및 승인 여부 (승인/조건부 승인/거부)

**출력 형식**:
- 📌 각 항목을 명확히 구분하여 상세히 작성
- 💡 구체적인 코드 위치 및 개선 코드(Snippet) 필수 제공
- ⭐ 종합 의견 및 결론"

        # Claude CLI 실행
        local claude_output
        if claude_output=$(echo "$query" | claude -p "Code Reviewer" 2>&1); then
            echo "claude-code-auto" > /tmp/ai_engine_auto_review
            echo "$claude_output"
            return 0
        else
            log_warning "Claude CLI 실행 실패. 파일 기반 방식으로 폴백합니다."
        fi
    fi

    # 변경사항을 임시 파일에 저장하여 Claude Code가 자동으로 감지하도록 함
    local temp_review_request="/tmp/claude_code_review_request_$$.md"
    cat > "$temp_review_request" << 'REQUEST_EOF'
# 🤖 Claude Code: code-review-specialist 서브에이전트 호출

⚠️ **중요**: 다음 명령어로 서브에이전트를 호출하세요:

```
Task code-review-specialist "다음 변경사항을 실무 관점에서 리뷰하세요"
```

---

## 📋 변경사항 정보

**날짜**: $(date '+%Y-%m-%d %H:%M:%S')
**커밋**: `$(git log -1 --format=%h)`
**메시지**: $(git log -1 --format=%s)
**변경 파일**: $(git diff --name-only HEAD~1 HEAD 2>/dev/null | wc -l)개

---

## 📄 변경사항 상세

```diff
REQUEST_EOF

    # 변경사항 추가 (heredoc 외부에서)
    echo "$changes" >> "$temp_review_request"

    # 나머지 내용 추가
    cat >> "$temp_review_request" << 'REQUEST_EOF'
```

---

## 🎯 리뷰 요청 사항 (전체 영역 필수 검토)

다음 Git 변경사항을 **Senior Full-Stack Developer**로서 실무 관점에서 독립적으로 완벽하게 리뷰해주세요:

1. **버그 및 정합성**: 런타임 에러, 비즈니스 로직 오류, 엣지 케이스
2. **코드 품질 및 구조**: 가독성, 모듈 분리, 유지보수성, 아키텍처 일관성
3. **성능 및 효율성**: 불필요한 연산, 메모리 누수, 리소스 최적화
4. **보안 및 안정성**: 보안 취약점, 에러 처리, 타입 안전성(TypeScript)
5. **종합 평가**: 점수 (1-10) 및 승인 여부 (승인/조건부 승인/거부)

**출력 형식**:
- 📌 각 항목을 명확히 구분하여 상세히 작성
- 💡 구체적인 코드 위치 및 개선 코드(Snippet) 필수 제공
- ⭐ 종합 의견 및 결론

---

## 💡 Claude Code 실행 방법

Claude Code가 이 파일을 자동으로 감지하고 리뷰를 시작합니다.

**자동 감지 파일**: \`$temp_review_request\`

REQUEST_EOF

    # Claude Code가 읽을 수 있도록 경로 출력
    local review_output=$(cat << 'OUTPUT_EOF'

## 🤖 Claude Code 자동 리뷰 준비 완료

Codex와 Gemini가 모두 실패했지만, **Claude Code가 자동으로 리뷰를 시작합니다**.

### 📁 리뷰 요청 파일 생성

Claude Code가 다음 파일을 자동으로 감지하여 리뷰를 수행합니다:

OUTPUT_EOF
)

    # 파일 경로 추가
    review_output+=$'\n'"**파일**: \`$temp_review_request\`"$'\n\n'
    review_output+="### 🎯 다음 단계"$'\n\n'
    review_output+="1. Claude Code가 위 파일을 자동으로 감지합니다"$'\n'
    review_output+="2. 파일 내용을 읽고 변경사항을 분석합니다"$'\n'
    review_output+="3. 실무 관점의 코드 리뷰를 자동으로 수행합니다"$'\n'
    review_output+="4. 리뷰 결과를 생성합니다"$'\n\n'
    review_output+="### ⏱️ 예상 소요 시간: 10-20초"$'\n\n'
    review_output+="💡 **자동 실행**: Claude Code가 백그라운드에서 리뷰를 진행합니다."

    # AI_ENGINE 전파
    echo "claude-code-auto" > /tmp/ai_engine_auto_review
    echo "$review_output"

    # 파일 경로를 별도로 저장하여 Claude Code가 감지할 수 있도록
    echo "$temp_review_request" > /tmp/claude_code_review_path

    log_success "리뷰 요청 파일 생성: $temp_review_request"
    log_info "Claude Code가 자동으로 리뷰를 시작합니다..."

    return 0
}

# ============================================================================
# AI 리뷰 실행 (v6.0.0: 단순화 - 1회 재시도 + 지연 보상)
# ============================================================================

# 지연 보상 파일 경로
PENDING_REVIEWS_FILE="$PROJECT_ROOT/logs/code-reviews/.pending-reviews"

# AI별 리뷰 함수 매핑
run_single_ai_review() {
    local ai_name="$1"
    local changes="$2"

    case "$ai_name" in
        codex)
            try_codex_review "$changes"
            ;;
        gemini)
            try_gemini_review "$changes"
            ;;
        qwen)
            try_qwen_review "$changes"
            ;;
        claude)
            claude_code_review_with_subagent "$changes"
            ;;
    esac
}

# v6.2.0: 즉시 폴백용 함수 (Qwen → Claude)
# - Primary 실패 시 다음 순번이 아닌 즉시 Qwen
# - Qwen 실패 시 Claude (절대 최종)
get_immediate_fallback() {
    local failed_ai="$1"

    case "$failed_ai" in
        codex|gemini|claude)
            echo "qwen"    # 어떤 Primary든 실패 → 즉시 Qwen
            ;;
        qwen)
            echo "claude"  # Qwen 실패 → Claude (절대 최종)
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

# v6.3.0: 3-AI 순번 + 즉시 Qwen 폴백 (rotation 즉시 진행)
# - 순번: codex → gemini → claude (순환)
# - 선택 즉시 rotation 진행 (성공/실패 관계없이 1:1:1 보장)
# - 실패 시 즉시 qwen 폴백
# - 폴백 체인: Primary → Qwen → Claude(절대 최종)
run_ai_review() {
    local changes="$1"
    local review_output=""

    # 임시 파일 초기화
    rm -f /tmp/ai_engine_auto_review

    # 1단계: 순서 기반으로 Primary AI 선택 (codex → gemini → claude 순환)
    local primary_ai=$(select_primary_ai)
    log_info "🎯 Primary AI: ${primary_ai^^} (3-AI 순번: codex→gemini→claude)"

    # 🆕 v6.3.0: 선택 즉시 rotation 진행 (1:1:1 균등분배 보장)
    # 성공/실패 관계없이 다음 호출에서는 다음 AI가 선택됨
    set_last_ai "$primary_ai"

    # 2단계: Primary AI 시도
    if review_output=$(run_single_ai_review "$primary_ai" "$changes"); then
        log_success "${primary_ai^^} 리뷰 성공!"
        increment_ai_counter "$primary_ai"
        AI_ENGINE="$primary_ai"

        # 성공 시 보류 중인 리뷰 클리어
        if check_pending_reviews; then
            clear_pending_reviews
        fi

        echo "$review_output"
        return 0
    fi

    log_warning "Primary AI (${primary_ai^^}) 실패 → 즉시 Qwen 폴백"

    # 3단계: 즉시 Qwen 폴백 (다음 순번으로 넘어가지 않음!)
    log_info "🔄 즉시 폴백: QWEN"

    if review_output=$(run_single_ai_review "qwen" "$changes"); then
        log_success "QWEN 즉시 폴백 성공!"
        increment_ai_counter "qwen"
        # Qwen은 last_ai에 저장하지 않음 (폴백 전용, 순번에 영향 없음)
        AI_ENGINE="qwen"

        # 성공 시 보류 중인 리뷰 클리어
        if check_pending_reviews; then
            clear_pending_reviews
        fi

        echo "$review_output"
        return 0
    fi

    log_warning "QWEN 폴백 실패 → Claude 절대 최종 폴백"

    # 4단계: 절대 최종 폴백 (Claude)
    log_info "🔄 절대 최종 폴백: CLAUDE"

    if review_output=$(run_single_ai_review "claude" "$changes"); then
        log_success "CLAUDE 절대 최종 폴백 성공!"
        increment_ai_counter "claude"
        # Claude도 last_ai에 저장하지 않음 (폴백 전용)
        AI_ENGINE="claude"

        # 성공 시 보류 중인 리뷰 클리어
        if check_pending_reviews; then
            clear_pending_reviews
        fi

        echo "$review_output"
        return 0
    fi

    # 5단계: 모든 AI 실패 → 지연 보상
    local current_commit=$(git -C "$PROJECT_ROOT" log -1 --format=%h 2>/dev/null || echo "unknown")
    save_pending_review "$current_commit"

    log_error "❌ 모든 AI 리뷰 실패 (${primary_ai^^}, Qwen, Claude) - 다음 커밋 때 보상 리뷰 예정"
    rm -f /tmp/ai_engine_auto_review
    return 1
}
