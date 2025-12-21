#!/bin/bash

# AI Review Core Functions - v6.10.0
# AI 리뷰 실행 함수들 (Codex, Gemini, Qwen - Claude 제거됨)
#
# v6.10.0 (2025-12-19): 문서/테스트 업데이트 평가 항목 추가 (프롬프트 강화)
# v6.9.2 (2025-12-08): handle_review_success() 헬퍼 함수 추출 (DRY)
# v6.9.1 (2025-12-08): 1:1:1 순환 버그 수정 + Claude 완전 제거
# - 3-AI 순환: codex → gemini → qwen → codex
# - 상호 폴백: 각 AI 실패 시 다른 두 AI로 순차 폴백
# - 🆕 set_last_ai를 성공 후에만 호출 (1:1:1 균등분배 보장)
# - 🆕 Claude 완전 제거 (Claude Code 세션 내 자기 호출 불가)

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
5. **문서/테스트 업데이트 필요성**: 새 함수/클래스에 테스트 필요한지, API/설정 변경에 문서 업데이트 필요한지 평가
6. **종합 평가**: 점수 (1-10) 및 승인 여부 (승인/조건부 승인/거부)

**출력 형식**:
- 📌 각 항목을 명확히 구분하여 상세히 작성
- 💡 구체적인 코드 위치 및 개선 코드(Snippet) 필수 제공
- 📚 문서/테스트 관련 권장사항이 있다면 명시
- ⭐ 종합 의견 및 결론

**참고**: 위 검증 결과는 실제 실행 결과입니다. 문서/테스트 검증 경고가 있다면 반드시 검토해주세요."

    # Codex 실행 (wrapper 사용)
    local codex_output
    local codex_exit_code=0

    if codex_output=$(bash "$PROJECT_ROOT/scripts/ai-wrappers/codex-wrapper.sh" "$query"); then
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
5. **문서/테스트 업데이트 필요성**: 새 함수/클래스에 테스트 필요한지, API/설정 변경에 문서 업데이트 필요한지 평가
6. **종합 평가**: 점수 (1-10) 및 승인 여부 (승인/조건부 승인/거부)

**출력 형식**:
- 📌 각 항목을 명확히 구분하여 상세히 작성
- 💡 구체적인 코드 위치 및 개선 코드(Snippet) 필수 제공
- 📚 문서/테스트 관련 권장사항이 있다면 명시
- ⭐ 종합 의견 및 결론

**참고**: 위 검증 결과는 실제 실행 결과입니다. 문서/테스트 검증 경고가 있다면 반드시 검토해주세요."

    # Gemini 실행 (wrapper 사용) - Codex/Qwen과 동일한 패턴
    local gemini_output
    local gemini_exit_code=0

    if gemini_output=$(bash "$PROJECT_ROOT/scripts/ai-wrappers/gemini-wrapper.sh" "$query"); then
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
5. **문서/테스트 업데이트 필요성**: 새 함수/클래스에 테스트 필요한지, API/설정 변경에 문서 업데이트 필요한지 평가
6. **종합 평가**: 점수 (1-10) 및 승인 여부 (승인/조건부 승인/거부)

**출력 형식**:
- 📌 각 항목을 명확히 구분하여 상세히 작성
- 💡 구체적인 코드 위치 및 개선 코드(Snippet) 필수 제공
- 📚 문서/테스트 관련 권장사항이 있다면 명시
- ⭐ 종합 의견 및 결론

**참고**: 위 검증 결과는 실제 실행 결과입니다. 문서/테스트 검증 경고가 있다면 반드시 검토해주세요."

    # Qwen 실행 (wrapper 사용)
    local qwen_output
    local qwen_exit_code=0

    if qwen_output=$(bash "$PROJECT_ROOT/scripts/ai-wrappers/qwen-wrapper.sh" "$query"); then
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
# Claude Code 리뷰 함수 (v6.7.0: 올바른 CLI 호출 방식으로 복원)
# ============================================================================
# v6.7.0 (2025-12-07): CLI 호출 방식 수정
#   - 이전 (잘못됨): echo "$query" | claude -p "Code Reviewer"
#   - 현재 (올바름): claude -p "$query"
# ============================================================================

try_claude_review() {
    local changes="$1"

    log_ai_engine "🟢 Claude Code 리뷰 시도 중..."

    # Claude CLI 존재 확인
    if ! command -v claude >/dev/null 2>&1; then
        log_error "Claude CLI가 설치되지 않았습니다"
        return 1
    fi

    # Claude 쿼리 생성 (다른 AI와 동일한 프롬프트)
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

    # Claude CLI 실행 (v6.7.0: 올바른 사용법 - query를 -p 옵션에 직접 전달)
    local claude_output
    local claude_exit_code=0

    # 타임아웃 120초 (Claude는 빠르므로 Codex/Gemini보다 짧게)
    if claude_output=$(timeout 120 claude -p "$query" 2>&1); then
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
# [ARCHIVED] 이전 Claude Code 서브에이전트 함수 (파일 기반 방식)
# ============================================================================
# 이 함수는 더 이상 사용되지 않습니다 (v6.6.0에서 deprecated, v6.7.0에서 archived)
# try_claude_review()가 올바른 CLI 호출 방식을 사용합니다
# ============================================================================

_archived_claude_code_review_with_subagent() {
    local changes="$1"

    log_ai_engine "🤖 Claude Code 스킬 기반 리뷰 시작 (ai-code-review)..."

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
# 🤖 Claude Code: ai-code-review 스킬 활용

⚠️ **중요**: 다음 명령어로 스킬을 호출하세요:

```
Skill ai-code-review
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

    # v6.7.0: Claude 복원 (CLI 호출 방식 수정)
    case "$ai_name" in
        codex)
            try_codex_review "$changes"
            ;;
        gemini)
            try_gemini_review "$changes"
            ;;
        claude)
            try_claude_review "$changes"
            ;;
        qwen)
            try_qwen_review "$changes"
            ;;
        *)
            log_error "알 수 없는 AI: $ai_name"
            return 1
            ;;
    esac
}

# v6.7.0: 즉시 폴백용 함수 (Primary → Qwen → Claude)
# - Primary(codex/gemini) 실패 시 → 즉시 Qwen
# - Claude(Primary) 실패 시 → Qwen (Claude는 이미 실패)
# - Qwen 실패 시 → Claude (Primary가 Claude가 아닌 경우만)
# - v6.7.0 (2025-12-07): Claude CLI 올바른 사용법으로 복원
get_immediate_fallback() {
    local failed_ai="$1"
    local primary_ai="${2:-}"  # Optional: 원래 Primary AI

    case "$failed_ai" in
        codex|gemini)
            echo "qwen"    # Primary(codex/gemini) 실패 → 즉시 Qwen
            ;;
        claude)
            echo "qwen"    # Primary(claude) 실패 → Qwen
            ;;
        qwen)
            # Qwen 실패 → Claude (단, Primary가 Claude가 아닌 경우)
            if [ "$primary_ai" != "claude" ]; then
                echo "claude"
            else
                echo ""    # Primary가 Claude였으면 더 이상 폴백 없음
            fi
            ;;
        *)
            echo ""        # 기타 실패 → 폴백 없음
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

# 🆕 v6.9.2: 리뷰 성공 처리 헬퍼 (DRY 원칙)
# - 반복되는 성공 로직을 단일 함수로 통합
# - Gemini 코드 리뷰 제안 반영 (2025-12-08)
handle_review_success() {
    local ai="$1"
    local output="$2"
    local message="${3:-리뷰 성공}"

    log_success "${ai^^} ${message}!"
    increment_ai_counter "$ai"
    set_last_ai "$ai"  # v6.9.1: 성공한 AI만 저장
    AI_ENGINE="$ai"

    # 성공 시 보류 중인 리뷰 클리어
    if check_pending_reviews; then
        clear_pending_reviews
    fi

    echo "$output"
}

# v6.9.0: 3-AI 1:1:1 순환 + 상호 폴백 체인
# - 순번: codex → gemini → qwen (3-AI 순환, Claude 제외)
# - 선택 즉시 rotation 진행 (성공/실패 관계없이 1:1:1 보장)
# - 실패 시 폴백 체인: 각 AI는 다른 두 AI로 순차 폴백
#   - codex 실패 → gemini → qwen
#   - gemini 실패 → qwen → codex
#   - qwen 실패 → codex → gemini
# - v6.9.0 (2025-12-08): Claude 제거 (Claude Code 내부 자기 호출 불가)
run_ai_review() {
    local changes="$1"
    local review_output=""

    # 임시 파일 초기화
    rm -f /tmp/ai_engine_auto_review

    # 1단계: 순서 기반으로 Primary AI 선택 (codex → gemini → qwen 3-AI 순환)
    local primary_ai=$(select_primary_ai)
    log_info "🎯 Primary AI: ${primary_ai^^} (3-AI 순번: codex→gemini→qwen)"

    # 🆕 v6.9.1: 성공한 AI만 last_ai에 저장 (1:1:1 균등분배 보장)
    # - 이전 (v6.3.0): 선택 즉시 저장 → 폴백 성공 시 같은 AI 두 번 선택 문제
    # - 현재 (v6.9.1): 리뷰 성공 후 저장 → 실제 사용된 AI 기반 순환

    # 폴백 AI 결정 (각 AI는 다른 AI로 폴백)
    # codex → gemini → qwen → codex
    local fallback1="" fallback2=""
    case "$primary_ai" in
        codex)
            fallback1="gemini"
            fallback2="qwen"
            ;;
        gemini)
            fallback1="qwen"
            fallback2="codex"
            ;;
        qwen)
            fallback1="codex"
            fallback2="gemini"
            ;;
    esac

    # 2단계: Primary AI 시도
    if review_output=$(run_single_ai_review "$primary_ai" "$changes"); then
        handle_review_success "$primary_ai" "$review_output" "리뷰 성공"
        return 0
    fi

    log_warning "Primary AI (${primary_ai^^}) 실패 → 폴백 1차: ${fallback1^^}"

    # 3단계: 폴백 1차 시도
    log_info "🔄 폴백 1차: ${fallback1^^}"

    if review_output=$(run_single_ai_review "$fallback1" "$changes"); then
        handle_review_success "$fallback1" "$review_output" "폴백 성공"
        return 0
    fi

    log_warning "폴백 1차 (${fallback1^^}) 실패 → 폴백 2차: ${fallback2^^}"

    # 4단계: 폴백 2차 시도
    log_info "🔄 폴백 2차: ${fallback2^^}"

    if review_output=$(run_single_ai_review "$fallback2" "$changes"); then
        handle_review_success "$fallback2" "$review_output" "최종 폴백 성공"
        return 0
    fi

    # 5단계: 모든 AI 실패 → 지연 보상
    local current_commit=$(git -C "$PROJECT_ROOT" log -1 --format=%h 2>/dev/null || echo "unknown")
    save_pending_review "$current_commit"

    log_error "❌ 모든 AI 리뷰 실패 (${primary_ai^^}→${fallback1^^}→${fallback2^^}) - 다음 커밋 때 보상 리뷰 예정"
    rm -f /tmp/ai_engine_auto_review
    return 1
}
