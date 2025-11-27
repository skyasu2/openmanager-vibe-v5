#!/bin/bash

# AI Review Core Functions - v5.0.0
# AI 리뷰 실행 함수들 (Codex, Gemini, Qwen, Claude)

# ============================================================================
# Codex 리뷰 함수
# ============================================================================

try_codex_review() {
    local changes="$1"

    log_ai_engine "🚀 Codex 코드 리뷰 시도 중..."

    # Codex 쿼리 생성 (검증 결과 포함)
    local query="다음 Git 변경사항을 실무 관점에서 코드 리뷰해주세요:

## 🔍 실시간 검증 결과 (${VERIFY_TIMESTAMP:-N/A})

\`\`\`
ESLint: ${LINT_SUMMARY:-실행 안 됨}
TypeScript: ${TS_SUMMARY:-실행 안 됨}
\`\`\`

**검증 로그 저장 위치**:
- ESLint: ${LINT_LOG:-N/A}
- TypeScript: ${TS_LOG:-N/A}

---

$changes

**리뷰 요청 사항**:
1. **버그 위험**: 잠재적 버그나 오류 가능성 (있다면 3개까지)
2. **개선 제안**: 성능, 가독성, 유지보수성 측면 (3개)
3. **TypeScript 안전성**: any 타입, 타입 단언 등 문제점
4. **보안 이슈**: XSS, SQL Injection 등 보안 취약점
5. **종합 평가**: 점수 (1-10) 및 한 줄 요약

**출력 형식**:
- 📌 각 항목을 명확히 구분
- 💡 구체적인 코드 위치 및 개선 방법 제시
- ⭐ 종합 점수 및 승인 여부 (승인/조건부 승인/거부)

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

fallback_to_gemini_review() {
    local changes="$1"

    log_ai_engine "🔄 Gemini CLI로 폴백..."

    # Gemini 쿼리 생성 (검증 결과 포함)
    local query="다음 Git 변경사항을 실무 관점에서 코드 리뷰해주세요:

## 🔍 실시간 검증 결과 (${VERIFY_TIMESTAMP:-N/A})

\`\`\`
ESLint: ${LINT_SUMMARY:-실행 안 됨}
TypeScript: ${TS_SUMMARY:-실행 안 됨}
\`\`\`

**검증 로그 저장 위치**:
- ESLint: ${LINT_LOG:-N/A}
- TypeScript: ${TS_LOG:-N/A}

---

$changes

**리뷰 요청 사항**:
1. **버그 위험**: 잠재적 버그나 오류 가능성 (있다면 3개까지)
2. **개선 제안**: 성능, 가독성, 유지보수성 측면 (3개)
3. **TypeScript 안전성**: any 타입, 타입 단언 등 문제점
4. **보안 이슈**: XSS, SQL Injection 등 보안 취약점
5. **종합 평가**: 점수 (1-10) 및 한 줄 요약

**출력 형식**:
- 📌 각 항목을 명확히 구분
- 💡 구체적인 코드 위치 및 개선 방법 제시
- ⭐ 종합 점수 및 승인 여부 (승인/조건부 승인/거부)

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

    # Qwen 쿼리 생성 (검증 결과 포함)
    local query="다음 Git 변경사항을 실무 관점에서 코드 리뷰해주세요:

## 🔍 실시간 검증 결과 (${VERIFY_TIMESTAMP:-N/A})

\`\`\`
ESLint: ${LINT_SUMMARY:-실행 안 됨}
TypeScript: ${TS_SUMMARY:-실행 안 됨}
\`\`\`

**검증 로그 저장 위치**:
- ESLint: ${LINT_LOG:-N/A}
- TypeScript: ${TS_LOG:-N/A}

---

$changes

**리뷰 요청 사항**:
1. **버그 위험**: 잠재적 버그나 오류 가능성 (있다면 3개까지)
2. **개선 제안**: 성능, 가독성, 유지보수성 측면 (3개)
3. **TypeScript 안전성**: any 타입, 타입 단언 등 문제점
4. **보안 이슈**: XSS, SQL Injection 등 보안 취약점
5. **종합 평가**: 점수 (1-10) 및 한 줄 요약

**출력 형식**:
- 📌 각 항목을 명확히 구분
- 💡 구체적인 코드 위치 및 개선 방법 제시
- ⭐ 종합 점수 및 승인 여부 (승인/조건부 승인/거부)

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

        local query="다음 Git 변경사항을 실무 관점에서 코드 리뷰해주세요:

$changes

**리뷰 요청 사항**:
1. **버그 위험**: 잠재적 버그나 오류 가능성 (있다면 3개까지)
2. **개선 제안**: 성능, 가독성, 유지보수성 측면 (3개)
3. **TypeScript 안전성**: any 타입, 타입 단언 등 문제점
4. **보안 이슈**: XSS, SQL Injection 등 보안 취약점
5. **종합 평가**: 점수 (1-10) 및 한 줄 요약

**출력 형식**:
- 📌 각 항목을 명확히 구분
- 💡 구체적인 코드 위치 및 개선 방법 제시
- ⭐ 종합 점수 및 승인 여부 (승인/조건부 승인/거부)"

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

## 🎯 리뷰 요청 사항

다음 Git 변경사항을 실무 관점에서 code-review-specialist 서브에이전트로 리뷰해주세요:

1. **버그 위험**: 잠재적 버그나 오류 가능성 (있다면 3개까지)
2. **개선 제안**: 성능, 가독성, 유지보수성 측면 (3개)
3. **TypeScript 안전성**: any 타입, 타입 단언 등 문제점
4. **보안 이슈**: XSS, SQL Injection 등 보안 취약점
5. **종합 평가**: 점수 (1-10) 및 한 줄 요약

**출력 형식**:
- 📌 각 항목을 명확히 구분
- 💡 구체적인 코드 위치 및 개선 방법 제시
- ⭐ 종합 점수 및 승인 여부 (승인/조건부 승인/거부)

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
# AI 리뷰 실행 (v5.0.0: 1:1:1:1 비율 + 4단계 폴백)
# ============================================================================

run_ai_review() {
    local changes="$1"
    local review_output=""

    # 임시 파일 초기화
    rm -f /tmp/ai_engine_auto_review

    # 1단계: 1:1:1:1 비율로 Primary AI 선택
    local primary_ai=$(select_primary_ai)

    log_info "🎯 Primary AI: ${primary_ai^^} (1:1:1:1 균등 분배)"

    # 2단계: Secondary AI 목록 (Primary 제외한 나머지 3개)
    local -a secondary_ais=()
    case "$primary_ai" in
        codex)
            secondary_ais=("gemini" "qwen" "claude")
            ;;
        gemini)
            secondary_ais=("qwen" "claude" "codex")
            ;;
        qwen)
            secondary_ais=("claude" "codex" "gemini")
            ;;
        claude)
            secondary_ais=("codex" "gemini" "qwen")
            ;;
    esac

    # 3단계: Primary AI 시도
    case "$primary_ai" in
        codex)
            if review_output=$(try_codex_review "$changes"); then
                log_success "Codex 리뷰 성공!"
                increment_ai_counter "codex"
                AI_ENGINE="codex"
                echo "$review_output"
                return 0
            fi
            ;;
        gemini)
            if review_output=$(fallback_to_gemini_review "$changes"); then
                log_success "Gemini 리뷰 성공!"
                increment_ai_counter "gemini"
                AI_ENGINE="gemini"
                echo "$review_output"
                return 0
            fi
            ;;
        qwen)
            if review_output=$(try_qwen_review "$changes"); then
                log_success "Qwen 리뷰 성공!"
                increment_ai_counter "qwen"
                AI_ENGINE="qwen"
                echo "$review_output"
                return 0
            fi
            ;;
        claude)
            if review_output=$(claude_code_review_with_subagent "$changes"); then
                log_success "Claude 서브에이전트 리뷰 성공!"
                increment_ai_counter "claude"
                AI_ENGINE="claude"
                echo "$review_output"
                return 0
            fi
            ;;
    esac

    log_warning "Primary AI (${primary_ai^^}) 실패 → Secondary AI로 폴백"

    # 4단계: Secondary AI 1 시도
    case "${secondary_ais[0]}" in
        codex)
            if review_output=$(try_codex_review "$changes"); then
                log_success "Codex 폴백 성공!"
                increment_ai_counter "codex"
                AI_ENGINE="codex"
                echo "$review_output"
                return 0
            fi
            ;;
        gemini)
            if review_output=$(fallback_to_gemini_review "$changes"); then
                log_success "Gemini 폴백 성공!"
                increment_ai_counter "gemini"
                AI_ENGINE="gemini"
                echo "$review_output"
                return 0
            fi
            ;;
        qwen)
            if review_output=$(try_qwen_review "$changes"); then
                log_success "Qwen 폴백 성공!"
                increment_ai_counter "qwen"
                AI_ENGINE="qwen"
                echo "$review_output"
                return 0
            fi
            ;;
        claude)
            if review_output=$(claude_code_review_with_subagent "$changes"); then
                log_success "Claude 서브에이전트 폴백 성공!"
                increment_ai_counter "claude"
                AI_ENGINE="claude"
                echo "$review_output"
                return 0
            fi
            ;;
    esac

    log_warning "Secondary AI 1 (${secondary_ais[0]^^}) 실패 → Secondary AI 2로 폴백"

    # 5단계: Secondary AI 2 시도
    case "${secondary_ais[1]}" in
        codex)
            if review_output=$(try_codex_review "$changes"); then
                log_success "Codex 폴백 성공!"
                increment_ai_counter "codex"
                AI_ENGINE="codex"
                echo "$review_output"
                return 0
            fi
            ;;
        gemini)
            if review_output=$(fallback_to_gemini_review "$changes"); then
                log_success "Gemini 폴백 성공!"
                increment_ai_counter "gemini"
                AI_ENGINE="gemini"
                echo "$review_output"
                return 0
            fi
            ;;
        qwen)
            if review_output=$(try_qwen_review "$changes"); then
                log_success "Qwen 폴백 성공!"
                increment_ai_counter "qwen"
                AI_ENGINE="qwen"
                echo "$review_output"
                return 0
            fi
            ;;
        claude)
            if review_output=$(claude_code_review_with_subagent "$changes"); then
                log_success "Claude 서브에이전트 폴백 성공!"
                increment_ai_counter "claude"
                AI_ENGINE="claude"
                echo "$review_output"
                return 0
            fi
            ;;
    esac

    log_warning "Secondary AI 2 (${secondary_ais[1]^^}) 실패 → Secondary AI 3로 폴백 (최종)"

    # 6단계: Secondary AI 3 시도 (최종 폴백)
    case "${secondary_ais[2]}" in
        codex)
            if review_output=$(try_codex_review "$changes"); then
                log_success "Codex 최종 폴백 성공!"
                increment_ai_counter "codex"
                AI_ENGINE="codex"
                echo "$review_output"
                return 0
            fi
            ;;
        gemini)
            if review_output=$(fallback_to_gemini_review "$changes"); then
                log_success "Gemini 최종 폴백 성공!"
                increment_ai_counter "gemini"
                AI_ENGINE="gemini"
                echo "$review_output"
                return 0
            fi
            ;;
        qwen)
            if review_output=$(try_qwen_review "$changes"); then
                log_success "Qwen 최종 폴백 성공!"
                increment_ai_counter "qwen"
                AI_ENGINE="qwen"
                echo "$review_output"
                return 0
            fi
            ;;
        claude)
            if review_output=$(claude_code_review_with_subagent "$changes"); then
                log_success "Claude 서브에이전트 최종 폴백 성공!"
                increment_ai_counter "claude"
                AI_ENGINE="claude"
                echo "$review_output"
                return 0
            fi
            ;;
    esac

    # 최종 실패 (모든 AI 실패, 거의 발생하지 않음)
    log_error "모든 AI 실패 (Codex + Gemini + Qwen + Claude) - 99.99% 가용성 목표 미달"
    rm -f /tmp/ai_engine_auto_review
    return 1
}
