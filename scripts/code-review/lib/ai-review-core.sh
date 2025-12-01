#!/bin/bash

# AI Review Core Functions - v6.0.0
# AI 리뷰 실행 함수들 (Codex, Gemini, Qwen, Claude)
#
# v6.0.0 (2025-12-01): 단순화된 폴백 시스템
# - 4단계 폴백 → 1회 재시도 + 지연 보상
# - Primary 실패 시 1회만 다른 AI로 재시도
# - 그래도 실패하면 .pending-reviews에 저장 → 다음 커밋 때 보상
# - 코드 복잡도 대폭 감소 (500줄 → 200줄)

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

    if codex_output=$("$PROJECT_ROOT/scripts/ai-subagents/codex-wrapper.sh" "$query" 2>&1); then
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

    # Gemini 실행 (직접 호출 + stderr 필터링) - Option 1
    local gemini_output
    local temp_stdout=$(mktemp)
    local temp_stderr=$(mktemp)

    # 함수 종료 시 임시 파일 자동 정리 (인터럽트 포함)
    trap 'rm -f "$temp_stdout" "$temp_stderr"' RETURN

    # Gemini 실행: stdout과 stderr 분리
    if echo "$query" | gemini --model gemini-2.5-pro > "$temp_stdout" 2> "$temp_stderr"; then
        # stderr 필터링: 무해한 에러 메시지 제거 (단일 정규식)
        local filtered_errors=$(grep -vE "\[ImportProcessor\]|Loaded cached credentials|Got it|Attempt .* failed:" "$temp_stderr")

        # stdout 읽기
        gemini_output=$(cat "$temp_stdout")

        # 실제 출력이 있는지 확인 (공백 제거 후)
        if [ -n "$(echo "$gemini_output" | tr -d '[:space:]')" ]; then
            echo "gemini" > /tmp/ai_engine_auto_review
            echo "$gemini_output"
            return 0
        fi
    fi

    # 실패 (trap이 자동으로 cleanup 수행)
    log_error "Gemini 리뷰 실패"
    return 1
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

    if qwen_output=$("$PROJECT_ROOT/scripts/ai-subagents/qwen-wrapper.sh" "$query" 2>&1); then
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

# 1회 재시도용 Secondary AI 선택
get_retry_ai() {
    local primary="$1"
    case "$primary" in
        codex) echo "gemini" ;;
        gemini) echo "qwen" ;;
        qwen) echo "claude" ;;
        claude) echo "codex" ;;
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

run_ai_review() {
    local changes="$1"
    local review_output=""
    local is_retry="${2:-false}"  # 재시도 여부

    # 임시 파일 초기화
    rm -f /tmp/ai_engine_auto_review

    # 1단계: 1:1:1:1 비율로 Primary AI 선택
    local primary_ai=$(select_primary_ai)
    log_info "🎯 Primary AI: ${primary_ai^^} (1:1:1:1 균등 분배)"

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

    log_warning "Primary AI (${primary_ai^^}) 실패"

    # 3단계: 1회만 재시도 (다른 AI로)
    if [ "$is_retry" = "false" ]; then
        local retry_ai=$(get_retry_ai "$primary_ai")
        log_info "🔄 1회 재시도: ${retry_ai^^}"

        if review_output=$(run_single_ai_review "$retry_ai" "$changes"); then
            log_success "${retry_ai^^} 재시도 성공!"
            increment_ai_counter "$retry_ai"
            AI_ENGINE="$retry_ai"

            # 성공 시 보류 중인 리뷰 클리어
            if check_pending_reviews; then
                clear_pending_reviews
            fi

            echo "$review_output"
            return 0
        fi

        log_warning "재시도 AI (${retry_ai^^})도 실패"
    fi

    # 4단계: 실패 시 지연 보상 (다음 커밋 때 처리)
    local current_commit=$(git -C "$PROJECT_ROOT" log -1 --format=%h 2>/dev/null || echo "unknown")
    save_pending_review "$current_commit"

    log_error "❌ AI 리뷰 실패 - 다음 커밋 때 보상 리뷰 예정"
    rm -f /tmp/ai_engine_auto_review
    return 1
}
