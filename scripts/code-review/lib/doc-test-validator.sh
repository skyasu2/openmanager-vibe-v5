#!/bin/bash

# doc-test-validator.sh - v1.1.0
# 코드 변경에 따른 문서/테스트 업데이트 필요성 검증
#
# 목적: 코드 변경 시 관련 문서와 테스트가 함께 업데이트되어야 하는지 분석
# 출력: logs/doc-validation-warning.txt
#
# v1.1.0 (2026-01-10): False Positive 개선
#   - Release 커밋 자동 스킵 (chore(release))
#   - 버전 파일 제외 (versions.ts, version/route.ts)
#   - 단순 상수값 변경 제외
#
# v1.0.0 (2025-12-19): 초기 버전
#   - 새 함수/클래스 추가 시 테스트 필요 여부 감지
#   - API 변경 시 문서 업데이트 필요 여부 감지
#   - 설정 파일 변경 시 문서 업데이트 필요 여부 감지

set -euo pipefail

# 프로젝트 루트
PROJECT_ROOT="${PROJECT_ROOT:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)}"
OUTPUT_FILE="$PROJECT_ROOT/logs/doc-validation-warning.txt"

# 로그 디렉토리 확인
mkdir -p "$(dirname "$OUTPUT_FILE")"

# 초기화
> "$OUTPUT_FILE"

# Release 커밋 여부 확인
is_release_commit() {
    local commit_hash="${1:-HEAD}"
    local commit_msg=$(git -C "$PROJECT_ROOT" log -1 --format="%s" "$commit_hash" 2>/dev/null || echo "")

    # chore(release) 또는 release: 패턴 매칭
    if [[ "$commit_msg" =~ ^chore\(release\): ]] || [[ "$commit_msg" =~ ^release: ]]; then
        return 0  # Release 커밋
    fi
    return 1  # 일반 커밋
}

# 버전/설정 전용 파일 여부 확인 (테스트 불필요)
is_version_only_file() {
    local file="$1"
    # 버전 정보만 포함된 파일 (테스트 경고 제외 대상)
    [[ "$file" =~ versions?\.ts$ ]] || \
    [[ "$file" =~ /version/route\.ts$ ]] || \
    [[ "$file" =~ manifest\.json$ ]] || \
    [[ "$file" =~ package(-lock)?\.json$ ]] || \
    [[ "$file" =~ CHANGELOG\.md$ ]]
}

# 변경된 파일 가져오기 (staged 또는 최근 커밋)
get_changed_files() {
    local commit_hash="${1:-HEAD}"

    # staged 파일 우선
    local staged=$(git -C "$PROJECT_ROOT" diff --cached --name-only 2>/dev/null)
    if [ -n "$staged" ]; then
        echo "$staged"
        return
    fi

    # 최근 커밋 변경 파일
    git -C "$PROJECT_ROOT" diff-tree --no-commit-id --name-only -r "$commit_hash" 2>/dev/null || true
}

# 코드 파일인지 확인
is_code_file() {
    local file="$1"
    [[ "$file" =~ \.(ts|tsx|js|jsx|py|go|rs|java|cs)$ ]]
}

# 테스트 파일인지 확인
is_test_file() {
    local file="$1"
    [[ "$file" =~ \.(test|spec)\.(ts|tsx|js|jsx)$ ]] || \
    [[ "$file" =~ ^tests?/ ]] || \
    [[ "$file" =~ __tests__/ ]]
}

# 문서 파일인지 확인
is_doc_file() {
    local file="$1"
    [[ "$file" =~ \.(md|txt|rst)$ ]] || \
    [[ "$file" =~ ^docs/ ]] || \
    [[ "$file" =~ README ]]
}

# 설정 파일인지 확인
is_config_file() {
    local file="$1"
    [[ "$file" =~ \.(json|yaml|yml|toml|env)$ ]] || \
    [[ "$file" =~ ^config/ ]] || \
    [[ "$file" =~ next\.config ]] || \
    [[ "$file" =~ package\.json ]]
}

# API 관련 파일인지 확인
is_api_file() {
    local file="$1"
    [[ "$file" =~ ^src/app/api/ ]] || \
    [[ "$file" =~ /routes?/ ]] || \
    [[ "$file" =~ /endpoints?/ ]]
}

# 새로운 함수/클래스 추가 감지
detect_new_symbols() {
    local file="$1"
    local commit_hash="${2:-HEAD}"

    if ! is_code_file "$file" || is_test_file "$file"; then
        return
    fi

    # 추가된 라인에서 함수/클래스 정의 찾기
    local added_lines=$(git -C "$PROJECT_ROOT" diff-tree -p "$commit_hash" -- "$file" 2>/dev/null | grep '^+' | grep -v '^+++')

    local new_functions=$(echo "$added_lines" | grep -E '^\+\s*(export\s+)?(async\s+)?function\s+\w+|^\+\s*(export\s+)?const\s+\w+\s*=\s*(async\s+)?\(' | head -5 || true)
    local new_classes=$(echo "$added_lines" | grep -E '^\+\s*(export\s+)?class\s+\w+' | head -3 || true)
    local new_interfaces=$(echo "$added_lines" | grep -E '^\+\s*(export\s+)?(interface|type)\s+\w+' | head -3 || true)

    if [ -n "$new_functions" ] || [ -n "$new_classes" ]; then
        echo "$file"
    fi
}

# 대응하는 테스트 파일 존재 여부 확인
find_test_file() {
    local code_file="$1"
    local base_name=$(basename "$code_file" | sed -E 's/\.(ts|tsx|js|jsx)$//')
    local dir_name=$(dirname "$code_file")

    # Co-located test (같은 디렉토리)
    local colocated="${dir_name}/${base_name}.test.ts"
    local colocated_tsx="${dir_name}/${base_name}.test.tsx"

    # __tests__ 디렉토리
    local tests_dir="${dir_name}/__tests__/${base_name}.test.ts"

    # tests/ 디렉토리
    local root_tests="tests/unit/${dir_name#src/}/${base_name}.test.ts"

    if [ -f "$PROJECT_ROOT/$colocated" ] || \
       [ -f "$PROJECT_ROOT/$colocated_tsx" ] || \
       [ -f "$PROJECT_ROOT/$tests_dir" ] || \
       [ -f "$PROJECT_ROOT/$root_tests" ]; then
        return 0  # 테스트 존재
    fi
    return 1  # 테스트 없음
}

# 메인 분석 로직
analyze_changes() {
    local commit_hash="${1:-HEAD}"

    # Release 커밋은 스킵 (버전 메타데이터만 변경)
    if is_release_commit "$commit_hash"; then
        echo "✅ Release 커밋 - 문서/테스트 검증 스킵 (버전 메타데이터만 변경)" >> "$OUTPUT_FILE"
        return
    fi

    local changed_files=$(get_changed_files "$commit_hash")

    if [ -z "$changed_files" ]; then
        echo "변경된 파일 없음" >> "$OUTPUT_FILE"
        return
    fi

    local needs_test_update=()
    local needs_doc_update=()
    local api_changes=()
    local config_changes=()
    local code_only_changes=()
    local has_test_changes=false
    local has_doc_changes=false

    # 파일 분류
    while IFS= read -r file; do
        [ -z "$file" ] && continue

        if is_test_file "$file"; then
            has_test_changes=true
        elif is_doc_file "$file"; then
            has_doc_changes=true
        elif is_api_file "$file"; then
            api_changes+=("$file")
            code_only_changes+=("$file")
        elif is_config_file "$file"; then
            config_changes+=("$file")
        elif is_code_file "$file"; then
            code_only_changes+=("$file")

            # 버전 전용 파일은 테스트 경고 제외
            if is_version_only_file "$file"; then
                continue
            fi

            # 새 심볼 추가 감지
            if detect_new_symbols "$file" "$commit_hash" >/dev/null; then
                # 대응 테스트 파일 확인
                if ! find_test_file "$file"; then
                    needs_test_update+=("$file")
                fi
            fi
        fi
    done <<< "$changed_files"

    # 경고 메시지 생성
    local warnings=""

    # 1. 테스트 업데이트 필요 여부
    if [ ${#needs_test_update[@]} -gt 0 ] && [ "$has_test_changes" = false ]; then
        warnings+="### 🧪 테스트 추가/업데이트 권장\n\n"
        warnings+="새로운 함수/클래스가 추가되었으나 관련 테스트가 없습니다:\n"
        for file in "${needs_test_update[@]}"; do
            warnings+="- \`$file\`\n"
        done
        warnings+="\n**권장사항**: 단위 테스트 또는 통합 테스트 추가를 고려하세요.\n\n"
    fi

    # 2. API 변경 시 문서 업데이트 권장
    if [ ${#api_changes[@]} -gt 0 ] && [ "$has_doc_changes" = false ]; then
        warnings+="### 📚 API 문서 업데이트 권장\n\n"
        warnings+="API 관련 파일이 변경되었으나 문서 업데이트가 없습니다:\n"
        for file in "${api_changes[@]}"; do
            warnings+="- \`$file\`\n"
        done
        warnings+="\n**권장사항**: API 문서(docs/api/) 또는 README 업데이트를 고려하세요.\n\n"
    fi

    # 3. 설정 파일 변경 시 문서 업데이트 권장
    if [ ${#config_changes[@]} -gt 0 ] && [ "$has_doc_changes" = false ]; then
        warnings+="### ⚙️ 설정 문서 업데이트 권장\n\n"
        warnings+="설정 파일이 변경되었습니다:\n"
        for file in "${config_changes[@]}"; do
            warnings+="- \`$file\`\n"
        done
        warnings+="\n**권장사항**: 설정 관련 문서 업데이트를 고려하세요.\n\n"
    fi

    # 4. 코드만 변경되고 테스트/문서 없는 경우
    if [ ${#code_only_changes[@]} -gt 0 ] && [ "$has_test_changes" = false ] && [ "$has_doc_changes" = false ]; then
        warnings+="### ℹ️ 변경 분석 요약\n\n"
        warnings+="- 코드 파일 변경: ${#code_only_changes[@]}개\n"
        warnings+="- 테스트 변경: 없음\n"
        warnings+="- 문서 변경: 없음\n\n"
        warnings+="**AI 리뷰어에게**: 이 변경사항에 대해 다음을 평가해주세요:\n"
        warnings+="1. 테스트 커버리지가 충분한가?\n"
        warnings+="2. 관련 문서(README, JSDoc 등) 업데이트가 필요한가?\n"
    fi

    # 경고가 있으면 출력
    if [ -n "$warnings" ]; then
        echo -e "$warnings" >> "$OUTPUT_FILE"
    else
        echo "✅ 문서/테스트 검증 통과 (변경사항에 적절한 테스트/문서 포함)" >> "$OUTPUT_FILE"
    fi
}

# 실행
main() {
    local commit_hash="${1:-HEAD}"
    analyze_changes "$commit_hash"
}

# 직접 실행 시
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
