#!/bin/bash

# PostToolUse Hook: 문서 작성/수정 후 구조 검증 및 품질 개선
# 트리거: *.md 파일 Write/Edit
# 파일: hooks/post-doc-hook.sh

set -euo pipefail

# 공통 함수 로드
source "$(dirname "$0")/shared-functions.sh"

# 인자 확인
if [ $# -lt 1 ]; then
    log_error "파일 경로가 제공되지 않았습니다."
    exit 1
fi

FILE_PATH="$1"
OPERATION="${2:-edit}"  # "write" or "edit"
HOOK_NAME="post-doc"

log_info "문서 파일 $OPERATION 감지: $FILE_PATH"

# 루트 디렉토리 .md 파일 수 확인
ROOT_MD_COUNT=$(find . -maxdepth 1 -name "*.md" -type f | wc -l)
ROOT_MD_FILES=$(find . -maxdepth 1 -name "*.md" -type f | sort)

# JBGE 원칙 검사 (루트에 4-6개 파일만 허용)
if [ "$ROOT_MD_COUNT" -gt 6 ]; then
    log_error "📚 JBGE 원칙 위반! 루트에 ${ROOT_MD_COUNT}개 .md 파일 (최대 6개 허용)"
    
    # doc-structure-guardian 자동 호출
    STRUCTURE_PROMPT=$(create_subagent_prompt "doc-structure-guardian" \
        "문서 구조 정리 및 JBGE 원칙 적용" \
        "" \
        "$(cat << EOF
현재 루트 디렉토리의 .md 파일 수: $ROOT_MD_COUNT
최대 허용: 6개 (JBGE 원칙)

현재 파일 목록:
$ROOT_MD_FILES

다음 작업을 수행해주세요:
1. 필수 파일 확인 (README, CHANGELOG, CLAUDE, GEMINI)
2. 불필요한 파일을 /docs 디렉토리로 이동
3. 중복 문서 병합
4. 30일 이상 사용하지 않은 문서 아카이빙
5. 문서 간 DRY 원칙 적용

주의사항:
- 파일을 이동/삭제하기 전에 반드시 Read 도구로 내용을 확인하세요
- 중요한 정보가 손실되지 않도록 주의하세요
- 이동된 파일에 대한 참조를 업데이트하세요
EOF
)")
    
    # 이슈 생성
    create_issue_file "doc-structure-violation" \
        "문서 구조 JBGE 원칙 위반" \
        "$STRUCTURE_PROMPT" \
        "high"
    
    # doc-structure-guardian으로 위임
    delegate_to_subagent "doc-structure-guardian" "문서 구조 정리"
fi

# 새 문서 생성 시 내용 보강 제안
if [ "$OPERATION" = "write" ] && [ -f "$FILE_PATH" ]; then
    FILE_SIZE=$(wc -c < "$FILE_PATH" 2>/dev/null || echo "0")
    
    # 파일이 너무 작으면 (100바이트 미만) 내용 보강 제안
    if [ "$FILE_SIZE" -lt 100 ]; then
        log_warning "📝 새 문서가 너무 짧습니다. 내용 보강 권장"
        
        DOC_PROMPT=$(create_subagent_prompt "doc-writer-researcher" \
            "문서 내용 연구 및 보강" \
            "$FILE_PATH" \
            "$(cat << EOF
새로 생성된 문서가 매우 짧습니다 (${FILE_SIZE} 바이트).

다음 작업을 수행해주세요:
1. 문서의 목적과 대상 독자 파악
2. 관련 정보 웹 검색 및 수집
3. 프로젝트 컨텍스트에 맞는 내용 작성
4. 적절한 섹션 구조 생성
5. 예제 코드나 다이어그램 추가 (필요시)

문서 유형별 권장 구조:
- README: 프로젝트 소개, 설치, 사용법, 기여 가이드
- API 문서: 엔드포인트, 파라미터, 응답, 예제
- 가이드: 개요, 단계별 설명, 주의사항, FAQ
- CHANGELOG: 버전, 날짜, 변경사항 (Added/Changed/Fixed/Removed)

주의사항:
- 기존 파일을 수정하기 전에 반드시 Read 도구로 먼저 읽어주세요
- 프로젝트의 기존 문서 스타일을 따라주세요
- 중복 내용이 없도록 다른 문서와 비교하세요
EOF
)")
        
        suggest_subagent "doc-writer-researcher" "문서 내용 보강"
    fi
fi

# 특정 문서 타입별 검증
case "$(basename "$FILE_PATH")" in
    "README.md")
        log_info "README.md 수정 감지 - 필수 섹션 확인"
        # README 필수 섹션 체크 (실제 구현 시 파일 내용 분석 필요)
        ;;
    
    "CHANGELOG.md")
        log_info "CHANGELOG.md 수정 감지 - 형식 검증"
        # Keep a Changelog 형식 준수 확인
        ;;
    
    "CLAUDE.md"|"GEMINI.md")
        log_info "AI 지침 문서 수정 감지 - 중요 변경사항"
        create_issue_file "ai-instructions-changed" \
            "AI 지침 문서 변경" \
            "$(basename "$FILE_PATH") 파일이 수정되었습니다. 모든 AI 에이전트가 새로운 지침을 따르도록 확인하세요." \
            "high"
        ;;
esac

# 문서 중복 검사 (간단한 버전)
if [ "$OPERATION" = "write" ]; then
    FILE_NAME=$(basename "$FILE_PATH" .md)
    SIMILAR_FILES=$(find . -name "*${FILE_NAME}*.md" -type f | grep -v "$FILE_PATH" || true)
    
    if [ -n "$SIMILAR_FILES" ]; then
        log_warning "유사한 이름의 문서 발견:"
        echo "$SIMILAR_FILES"
        
        create_issue_file "potential-doc-duplication" \
            "문서 중복 가능성" \
            "새 문서: $FILE_PATH\n\n유사한 파일들:\n$SIMILAR_FILES\n\n중복 여부를 확인하고 필요시 병합하세요." \
            "medium"
    fi
fi

# /docs 디렉토리가 없는데 루트에 문서가 많으면 생성 제안
if [ "$ROOT_MD_COUNT" -gt 4 ] && [ ! -d "docs" ]; then
    log_warning "/docs 디렉토리 생성을 권장합니다"
    echo "다음 명령으로 docs 디렉토리를 생성하세요:"
    echo "mkdir -p docs"
fi

# 문서 품질 메트릭 기록
write_audit_log "$HOOK_NAME" "doc-processed" \
    "{\"file\": \"$FILE_PATH\", \"operation\": \"$OPERATION\", \"root_md_count\": $ROOT_MD_COUNT}"

log_success "문서 훅 처리 완료"
exit $EXIT_SUCCESS