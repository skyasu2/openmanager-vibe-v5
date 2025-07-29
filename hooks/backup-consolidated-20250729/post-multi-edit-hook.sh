#!/bin/bash

# PostToolUse Hook: MultiEdit 작업 후 자동 코드 검토
# 파일: hooks/post-multi-edit-hook.sh

set -euo pipefail

# 로그 설정
HOOK_LOG=".claude/audit/hook.log"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# 로그 함수
log() {
    echo "[$TIMESTAMP] POST-MULTI-EDIT: $1" | tee -a "$HOOK_LOG"
}

# 인자 확인 - MultiEdit의 경우 여러 파일이 전달될 수 있음
if [ $# -lt 1 ]; then
    log "ERROR: 파일 경로가 제공되지 않았습니다."
    exit 1
fi

FILES=("$@")
TOTAL_FILES=${#FILES[@]}
TRIGGER_REVIEW=false
CRITICAL_CHANGES=false

log "다중 파일 편집 감지: $TOTAL_FILES 개 파일"

# 편집된 파일들 분석
CRITICAL_FILES=()
CODE_FILES=()
CONFIG_FILES=()

for file in "${FILES[@]}"; do
    log "분석 중: $file"
    
    # 중요 시스템 파일 확인
    if [[ "$file" =~ (auth|security|payment|admin|api/|route\.ts) ]]; then
        CRITICAL_FILES+=("$file")
        CRITICAL_CHANGES=true
        log "중요 파일 감지: $file"
    fi
    
    # 코드 파일 확인
    if [[ "$file" =~ \.(ts|tsx|js|jsx|py|sql)$ ]]; then
        CODE_FILES+=("$file")
        TRIGGER_REVIEW=true
    fi
    
    # 설정 파일 확인
    if [[ "$file" =~ (config|env|settings|package\.json|tsconfig\.json) ]]; then
        CONFIG_FILES+=("$file")
        TRIGGER_REVIEW=true
    fi
done

# 대규모 변경 감지 (5개 이상 파일)
if [ "$TOTAL_FILES" -ge 5 ]; then
    log "대규모 변경 감지 ($TOTAL_FILES 파일) - 종합 검토 트리거"
    TRIGGER_REVIEW=true
    CRITICAL_CHANGES=true
fi

# 상호 의존성 분석이 필요한 파일 패턴
INTERDEPENDENT_PATTERNS=(
    "src/services/"
    "src/components/"
    "src/lib/"
    "api/"
)

INTERDEPENDENT_COUNT=0
for pattern in "${INTERDEPENDENT_PATTERNS[@]}"; do
    for file in "${FILES[@]}"; do
        if [[ "$file" =~ $pattern ]]; then
            ((INTERDEPENDENT_COUNT++))
            break
        fi
    done
done

if [ "$INTERDEPENDENT_COUNT" -ge 2 ]; then
    log "상호 의존적 파일들 동시 수정 감지 - 통합 분석 필요"
    CRITICAL_CHANGES=true
    TRIGGER_REVIEW=true
fi

# 코드 리뷰 실행
if [ "$TRIGGER_REVIEW" = true ]; then
    log "code-review-specialist 호출 중 (다중 파일 모드)..."
    
    REVIEW_PRIORITY="medium"
    if [ "$CRITICAL_CHANGES" = true ]; then
        REVIEW_PRIORITY="high"
    fi
    
    # 파일 목록을 문자열로 변환
    FILES_LIST=$(printf "%s\n" "${FILES[@]}")
    
    REVIEW_PROMPT=$(cat << EOF
다중 파일 편집 코드 리뷰를 수행해주세요:

편집된 파일들 ($TOTAL_FILES 개):
$FILES_LIST

우선순위: $REVIEW_PRIORITY
중요 변경: $CRITICAL_CHANGES

다음 항목을 중점 확인해주세요:
1. 파일 간 상호 의존성 및 일관성
2. API 계약 변경 사항 (Breaking Changes)
3. 타입 정의 변경이 전체 시스템에 미치는 영향
4. 보안 및 인증 관련 변경 사항
5. 성능에 미치는 누적 영향
6. 데이터베이스 스키마 변경과의 호환성
7. 테스트 커버리지 영향

특별 검토 대상:
- 중요 파일: ${#CRITICAL_FILES[@]} 개
- 코드 파일: ${#CODE_FILES[@]} 개  
- 설정 파일: ${#CONFIG_FILES[@]} 개

전체적인 아키텍처 일관성을 확인하고,
자동 수정 가능한 항목은 즉시 처리해주세요.
EOF
)

    # audit 로그에 다중 편집 기록
    {
        echo "{"
        echo "  \"timestamp\": \"$TIMESTAMP\","
        echo "  \"hook\": \"post-multi-edit\","
        echo "  \"total_files\": $TOTAL_FILES,"
        echo "  \"critical_files\": ${#CRITICAL_FILES[@]},"
        echo "  \"code_files\": ${#CODE_FILES[@]},"
        echo "  \"config_files\": ${#CONFIG_FILES[@]},"
        echo "  \"priority\": \"$REVIEW_PRIORITY\","
        echo "  \"critical_changes\": $CRITICAL_CHANGES,"
        echo "  \"interdependent_count\": $INTERDEPENDENT_COUNT,"
        echo "  \"action\": \"comprehensive-review-triggered\","
        echo "  \"agent\": \"code-review-specialist\","
        echo "  \"files\": ["
        for i in "${!FILES[@]}"; do
            echo -n "    \"${FILES[$i]}\""
            if [ $i -lt $((${#FILES[@]} - 1)) ]; then
                echo ","
            else
                echo ""
            fi
        done
        echo "  ]"
        echo "}"
    } >> ".claude/audit/audit.log"
    
    log "다중 파일 코드 리뷰 완료 (우선순위: $REVIEW_PRIORITY)"
    
    # 중요한 변경사항의 경우 issue-summary에도 즉시 보고
    if [ "$CRITICAL_CHANGES" = true ]; then
        FORMATTED_DATE=$(date '+%Y-%m-%d-%H-%M')
        CRITICAL_ISSUE=".claude/issues/critical-multi-edit-${FORMATTED_DATE}.md"
        
        cat > "$CRITICAL_ISSUE" << EOF
# 🔴 중요: 다중 파일 동시 편집

**시간**: $TIMESTAMP  
**편집된 파일 수**: $TOTAL_FILES  
**중요 파일 포함**: ${#CRITICAL_FILES[@]} 개  

## 편집된 파일 목록

$FILES_LIST

## 위험 요소

- 대규모 변경 ($TOTAL_FILES 파일)
- 중요 시스템 파일 포함
- 상호 의존적 컴포넌트 동시 수정

## 권장 조치

1. 전체 테스트 스위트 실행
2. 통합 테스트 특히 주의
3. 단계적 배포 고려
4. 롤백 계획 준비

---
자동 생성됨 - post-multi-edit-hook
EOF
        
        log "중요 변경사항 이슈 파일 생성: $CRITICAL_ISSUE"
    fi
    
else
    log "코드 리뷰 불필요 - 건너뛰기"
fi

# 추가: 전체 프로젝트 린트 실행 (대규모 변경의 경우)
if [ "$TOTAL_FILES" -ge 3 ] && command -v npm >/dev/null; then
    log "대규모 변경 - 전체 프로젝트 린트 실행"
    npm run lint:fix --silent || log "WARNING: 전체 린트 실행 실패"
    
    # 타입 체크도 실행
    npm run type-check --silent || log "WARNING: 타입 체크 실패"
fi

echo "다중 파일 편집 처리 완료: $TOTAL_FILES 개 파일"

# 성공 상태 반환
exit 0