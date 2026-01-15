#!/bin/bash

# AI Review Split Functions - v9.0.0
# 분할 리뷰 및 리포트 생성 함수들
# v9.0.0: pending/history 구조 + Claude Code 자동 평가 지원

# ============================================================================
# 리뷰 리포트 생성 함수
# ============================================================================

generate_review_report() {
    local changes="$1"
    local ai_review="$2"

    # AI 엔진 이름을 파일명에 포함 (v9.0.0: pending/ 디렉토리에 저장)
    mkdir -p "$REVIEW_DIR/pending"
    REVIEW_FILE="$REVIEW_DIR/pending/review-${AI_ENGINE}-$TODAY-$TIMESTAMP.md"

    log_info "📝 리뷰 리포트 생성 중... (AI: $AI_ENGINE)"

    # AI 엔진 이모지 선택 (v5.0.0: qwen, claude 추가)
    local ai_emoji="🤖"
    [ "$AI_ENGINE" = "codex" ] && ai_emoji="🚀"
    [ "$AI_ENGINE" = "gemini" ] && ai_emoji="✨"
    [ "$AI_ENGINE" = "qwen" ] && ai_emoji="🟡"
    [ "$AI_ENGINE" = "claude" ] && ai_emoji="🧠"
    [ "$AI_ENGINE" = "claude-code-subagent" ] && ai_emoji="🧠"

    cat > "$REVIEW_FILE" << EOF
# $ai_emoji AI 자동 코드 리뷰 리포트 (Engine: ${AI_ENGINE^^})

**날짜**: $TODAY $TIMESTAMP
**커밋**: \`$(git log -1 --format=%h)\`
**브랜치**: \`$(git branch --show-current)\`
**AI 엔진**: **${AI_ENGINE^^}**

---

## 🔍 실시간 검증 결과 (${VERIFY_TIMESTAMP:-N/A})

\`\`\`
ESLint: ${LINT_SUMMARY:-실행 안 됨}
TypeScript: ${TS_SUMMARY:-실행 안 됨}
\`\`\`

**검증 로그 파일**:
- ESLint: \`${LINT_LOG:-N/A}\`
- TypeScript: \`${TS_LOG:-N/A}\`

---

## 📊 변경사항 요약

$changes

---

## $ai_emoji AI 리뷰 결과

$ai_review

---

## 📋 체크리스트

- [ ] 버그 위험 사항 확인 완료
- [ ] 개선 제안 검토 완료
- [ ] TypeScript 안전성 확인 완료
- [ ] 보안 이슈 확인 완료
- [ ] 종합 평가 확인 완료

## 🚨 오탐(False Positive) 기록

<!-- 거부/저점수가 오탐인 경우 아래에 기록 -->
<!-- 예시: - [x] limit 검증 이슈: Mock 핸들러라 실제 영향 없음 -->


---

**생성 시간**: $(date '+%Y-%m-%d %H:%M:%S')
**리뷰 파일**: \`$REVIEW_FILE\`
**AI 엔진**: ${AI_ENGINE^^}
EOF

    log_success "리뷰 리포트 생성 완료: $REVIEW_FILE"
}

# ============================================================================
# 리뷰 결과 요약 출력 함수
# ============================================================================

show_review_summary() {
    local review_file="$1"

    # AI 엔진 색상 선택 (v5.0.0: qwen, claude 추가)
    local engine_color="${CYAN}"
    [ "$AI_ENGINE" = "codex" ] && engine_color="${GREEN}"
    [ "$AI_ENGINE" = "gemini" ] && engine_color="${MAGENTA}"
    [ "$AI_ENGINE" = "qwen" ] && engine_color="${YELLOW}"
    [ "$AI_ENGINE" = "claude" ] && engine_color="${BLUE}"
    [ "$AI_ENGINE" = "claude-code-subagent" ] && engine_color="${BLUE}"

    echo ""
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}📋 AI 코드 리뷰 완료${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "${engine_color}🤖 사용된 AI 엔진: ${AI_ENGINE^^}${NC}"
    echo -e "${BLUE}📂 리뷰 파일: $review_file${NC}"
    echo ""
    echo -e "${YELLOW}💡 다음 단계:${NC}"
    echo "  1️⃣  Claude Code 자동 평가: /ai-code-review"
    echo "  2️⃣  또는 수동 확인: cat $review_file"
    echo ""
    echo -e "${GREEN}📝 평가 완료 시 자동으로:${NC}"
    echo "  - 리뷰 파일 → history/ 이동"
    echo "  - 점수 + 한줄평가 → .evaluation-log 기록"
    echo ""
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

# ============================================================================
# 분할 리뷰 실행 함수 (v5.0.0: 10개 파일 초과 시 자동 분할)
# ============================================================================

split_and_review() {
    local changed_files_list="$1"  # 파일명 리스트 (줄바꿈 구분)

    local file_count=$(echo "$changed_files_list" | grep -c '^' 2>/dev/null || echo "0")

    log_info "📊 변경사항 분석: 총 ${file_count}개 파일"

    # 파일 개수 체크
    if [ "$file_count" -le "$MAX_FILES_PER_REVIEW" ]; then
        log_info "✅ 일반 리뷰 수행 (${file_count}개 ≤ ${MAX_FILES_PER_REVIEW}개)"

        # 일반 리뷰 (전체 파일)
        local all_changes
        if ! all_changes=$(collect_changes); then
            return 1
        fi

        local review_output
        if review_output=$(run_ai_review "$all_changes"); then
            # Subshell에서 실행되므로 임시 파일에서 AI 엔진 이름 읽기
            if [ -f /tmp/ai_engine_auto_review ]; then
                AI_ENGINE=$(cat /tmp/ai_engine_auto_review)
            fi
            
            generate_review_report "$all_changes" "$review_output"
            show_review_summary "$REVIEW_FILE"
            return 0
        fi
        return 1
    fi

    # 파일 개수 초과 → 분할 리뷰
    log_warning "⚠️  임계값 초과 (${file_count}개 > ${MAX_FILES_PER_REVIEW}개) → 분할 리뷰 수행"

    # 파일을 그룹으로 나눔 (MAX_FILES_PER_REVIEW개씩)
    local -a file_groups=()
    local current_group=""
    local count=0

    while IFS= read -r file; do
        if [ -z "$file" ]; then
            continue
        fi

        current_group="${current_group}${file}"$'\n'
        count=$((count + 1))

        if [ $count -ge "$MAX_FILES_PER_REVIEW" ]; then
            file_groups+=("$current_group")
            current_group=""
            count=0
        fi
    done <<< "$changed_files_list"

    # 남은 파일 추가
    if [ -n "$current_group" ]; then
        file_groups+=("$current_group")
    fi

    local total_parts=${#file_groups[@]}
    log_info "🔄 분할 계획: ${total_parts}개 파트 (파트당 최대 ${MAX_FILES_PER_REVIEW}개 파일)"

    # 각 파트마다 리뷰 수행
    local part=1
    local part_timestamp=$(date +%H-%M-%S)

    for group in "${file_groups[@]}"; do
        echo ""
        log_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        log_info "🚀 Part ${part}/${total_parts} 리뷰 시작"
        log_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

        # 그룹별 변경사항 수집
        local group_changes
        if ! group_changes=$(collect_changes_for_files "$group"); then
            log_error "Part ${part} 변경사항 수집 실패"
            part=$((part + 1))
            continue
        fi

        # AI 리뷰 실행
        local group_review
        if group_review=$(run_ai_review "$group_changes"); then
            # Subshell에서 실행되므로 임시 파일에서 AI 엔진 이름 읽기
            if [ -f /tmp/ai_engine_auto_review ]; then
                AI_ENGINE=$(cat /tmp/ai_engine_auto_review)
            fi

            # 리뷰 파일 생성 (part 번호 포함) - v9.0.0: pending/에 저장
            mkdir -p "$REVIEW_DIR/pending"
            local part_review_file="$REVIEW_DIR/pending/review-${AI_ENGINE}-part${part}-$TODAY-$part_timestamp.md"
            REVIEW_FILE="$part_review_file"

            # 리포트 생성 (part 정보 추가)
            generate_review_report "$group_changes" "$group_review"

            log_success "✅ Part ${part} 리뷰 완료: $(basename "$part_review_file")"
        else
            log_error "❌ Part ${part} 리뷰 실패"
        fi

        part=$((part + 1))
    done

    echo ""
    log_success "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    log_success "✅ 전체 분할 리뷰 완료 (${total_parts}개 파트)"
    log_success "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    # 최종 요약
    echo ""
    echo -e "${CYAN}📋 분할 리뷰 요약${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}📂 총 파일: ${file_count}개${NC}"
    echo -e "${BLUE}📦 총 파트: ${total_parts}개${NC}"
    echo -e "${BLUE}📁 리뷰 디렉토리: $REVIEW_DIR${NC}"
    echo -e "${YELLOW}💡 리뷰 파일: review-*-part*-$TODAY-$part_timestamp.md${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""

    return 0
}
