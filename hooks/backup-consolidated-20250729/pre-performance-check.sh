#!/bin/bash

# PreToolUse Hook: 빌드/배포 전 성능 체크
# 트리거: npm run build, vercel deploy, npm run dev
# 파일: hooks/pre-performance-check.sh

set -euo pipefail

# 공통 함수 로드
source "$(dirname "$0")/shared-functions.sh"

# 인자 확인
COMMAND="${1:-npm run build}"
HOOK_NAME="pre-performance-check"

log_info "빌드/배포 명령 감지: $COMMAND"

# 성능 지표 초기화
BUNDLE_SIZE_MB=0
NODE_MODULES_SIZE_MB=0
SOURCE_FILES_COUNT=0
LARGE_FILES_COUNT=0
BUILD_TIME_ESTIMATE=0

# 프로젝트 크기 분석
analyze_project_size() {
    log_info "프로젝트 크기 분석 중..."
    
    # node_modules 크기 확인
    if [ -d "node_modules" ]; then
        NODE_MODULES_SIZE_MB=$(du -sm node_modules 2>/dev/null | cut -f1 || echo "0")
        log_info "node_modules 크기: ${NODE_MODULES_SIZE_MB}MB"
        
        if [ "$NODE_MODULES_SIZE_MB" -gt 500 ]; then
            log_warning "node_modules가 너무 큽니다 (${NODE_MODULES_SIZE_MB}MB)"
        fi
    fi
    
    # 소스 파일 수 확인
    SOURCE_FILES_COUNT=$(find src -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) 2>/dev/null | wc -l || echo "0")
    log_info "소스 파일 수: $SOURCE_FILES_COUNT"
    
    # 대용량 파일 확인 (1MB 이상)
    LARGE_FILES=$(find src public -type f -size +1M 2>/dev/null || true)
    if [ -n "$LARGE_FILES" ]; then
        LARGE_FILES_COUNT=$(echo "$LARGE_FILES" | wc -l)
        log_warning "1MB 이상 대용량 파일 ${LARGE_FILES_COUNT}개 발견:"
        echo "$LARGE_FILES" | head -5
    fi
    
    # 빌드 시간 예상 (매우 단순한 추정)
    BUILD_TIME_ESTIMATE=$((SOURCE_FILES_COUNT / 10 + NODE_MODULES_SIZE_MB / 100))
    log_info "예상 빌드 시간: 약 ${BUILD_TIME_ESTIMATE}초"
}

# 기존 빌드 결과 확인
check_existing_build() {
    if [ -d "dist" ] || [ -d ".next" ] || [ -d "build" ]; then
        log_info "기존 빌드 결과 발견"
        
        # 빌드 폴더 크기 확인
        for dir in dist .next build; do
            if [ -d "$dir" ]; then
                BUNDLE_SIZE_MB=$(du -sm "$dir" 2>/dev/null | cut -f1 || echo "0")
                log_info "$dir 크기: ${BUNDLE_SIZE_MB}MB"
                
                if [ "$BUNDLE_SIZE_MB" -gt 50 ]; then
                    log_warning "번들 크기가 큽니다 (${BUNDLE_SIZE_MB}MB)"
                fi
            fi
        done
    fi
}

# Next.js 특화 검사
check_nextjs_performance() {
    if [ -f "next.config.js" ] || [ -f "next.config.mjs" ]; then
        log_info "Next.js 프로젝트 감지"
        
        # app 디렉토리 크기 확인
        if [ -d "src/app" ]; then
            APP_SIZE=$(du -sm src/app 2>/dev/null | cut -f1 || echo "0")
            log_info "app 디렉토리 크기: ${APP_SIZE}MB"
        fi
        
        # public 디렉토리의 이미지 최적화 필요성 확인
        if [ -d "public" ]; then
            UNOPTIMIZED_IMAGES=$(find public -type f \( -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" \) -size +200k 2>/dev/null | wc -l || echo "0")
            if [ "$UNOPTIMIZED_IMAGES" -gt 0 ]; then
                log_warning "최적화되지 않은 이미지 ${UNOPTIMIZED_IMAGES}개 발견 (200KB 이상)"
            fi
        fi
    fi
}

# 성능 분석 실행
analyze_project_size
check_existing_build
check_nextjs_performance

# 성능 문제 감지 시 ux-performance-optimizer 호출
PERFORMANCE_ISSUES=false
ISSUES_FOUND=""

# 번들 크기 체크
if [ "$BUNDLE_SIZE_MB" -gt 50 ]; then
    PERFORMANCE_ISSUES=true
    ISSUES_FOUND="${ISSUES_FOUND}\n- 번들 크기 과대: ${BUNDLE_SIZE_MB}MB (권장: <50MB)"
fi

# 빌드 시간 체크
if [ "$BUILD_TIME_ESTIMATE" -gt 60 ]; then
    PERFORMANCE_ISSUES=true
    ISSUES_FOUND="${ISSUES_FOUND}\n- 예상 빌드 시간 과다: ${BUILD_TIME_ESTIMATE}초"
fi

# 대용량 파일 체크
if [ "$LARGE_FILES_COUNT" -gt 5 ]; then
    PERFORMANCE_ISSUES=true
    ISSUES_FOUND="${ISSUES_FOUND}\n- 대용량 파일 과다: ${LARGE_FILES_COUNT}개"
fi

# 성능 문제 발견 시 처리
if [ "$PERFORMANCE_ISSUES" = true ]; then
    log_warning "성능 문제 감지 - ux-performance-optimizer 권장"
    
    PERFORMANCE_PROMPT=$(create_subagent_prompt "ux-performance-optimizer" \
        "빌드/배포 전 성능 최적화" \
        "" \
        "$(cat << EOF
빌드 명령: $COMMAND
프로젝트 분석 결과:
- 소스 파일 수: $SOURCE_FILES_COUNT
- node_modules 크기: ${NODE_MODULES_SIZE_MB}MB
- 번들 크기: ${BUNDLE_SIZE_MB}MB
- 예상 빌드 시간: ${BUILD_TIME_ESTIMATE}초

발견된 문제:
$ISSUES_FOUND

다음 최적화 작업을 수행해주세요:
1. 번들 크기 분석 및 최적화
   - Tree shaking 적용
   - Code splitting 구현
   - Dynamic imports 활용
   - 불필요한 의존성 제거

2. 이미지 최적화
   - Next.js Image 컴포넌트 사용
   - WebP 형식 변환
   - 적절한 크기 조정

3. 빌드 성능 개선
   - 캐시 활용
   - 병렬 처리
   - 불필요한 빌드 단계 제거

4. Core Web Vitals 목표
   - LCP < 2.5초
   - FID < 100ms
   - CLS < 0.1

주의사항:
- 기존 파일을 수정하기 전에 반드시 Read 도구로 먼저 읽어주세요
- 최적화 후 기능이 정상 작동하는지 확인하세요
- 무료 티어 한계를 고려하여 최적화하세요
EOF
)")
    
    # 이슈 생성
    create_issue_file "performance-optimization-needed" \
        "빌드/배포 전 성능 최적화 필요" \
        "$PERFORMANCE_PROMPT" \
        "high"
    
    # 심각한 성능 문제면 빌드 차단 고려
    if [ "$BUNDLE_SIZE_MB" -gt 100 ] || [ "$BUILD_TIME_ESTIMATE" -gt 300 ]; then
        log_error "심각한 성능 문제 - 빌드 전 최적화 강력 권장"
        
        echo ""
        echo "⚠️  경고: 심각한 성능 문제가 감지되었습니다!"
        echo "   번들 크기: ${BUNDLE_SIZE_MB}MB"
        echo "   예상 빌드 시간: ${BUILD_TIME_ESTIMATE}초"
        echo ""
        echo "계속하시겠습니까? (y/N): "
        read -r CONTINUE_BUILD
        
        if [[ ! "$CONTINUE_BUILD" =~ ^[Yy]$ ]]; then
            log_error "사용자가 빌드를 취소했습니다"
            exit $EXIT_BLOCKED
        fi
    else
        suggest_subagent "ux-performance-optimizer" "성능 최적화"
    fi
fi

# Vercel 배포 시 추가 체크
if [[ "$COMMAND" =~ vercel ]]; then
    log_info "Vercel 배포 감지 - 무료 티어 한계 확인"
    
    # 월간 대역폭 사용량 추정 (매우 단순한 계산)
    ESTIMATED_MONTHLY_BANDWIDTH_GB=$((BUNDLE_SIZE_MB * 1000 / 1024))  # 1000 요청 가정
    
    if [ "$ESTIMATED_MONTHLY_BANDWIDTH_GB" -gt 100 ]; then
        log_warning "예상 월간 대역폭이 Vercel 무료 티어 한계(100GB)에 근접합니다"
        
        create_issue_file "vercel-free-tier-warning" \
            "Vercel 무료 티어 한계 경고" \
            "예상 월간 대역폭: ${ESTIMATED_MONTHLY_BANDWIDTH_GB}GB\n무료 티어 한계: 100GB\n\n번들 크기를 줄이거나 CDN을 활용하세요." \
            "high"
    fi
fi

# 성능 메트릭 기록
record_performance_metric "pre_build_bundle_size_mb" "$BUNDLE_SIZE_MB"
record_performance_metric "pre_build_source_files" "$SOURCE_FILES_COUNT"
record_performance_metric "pre_build_node_modules_mb" "$NODE_MODULES_SIZE_MB"

# audit 로그
write_audit_log "$HOOK_NAME" "performance-check-completed" \
    "{\"command\": \"$COMMAND\", \"bundle_size_mb\": $BUNDLE_SIZE_MB, \"issues_found\": $PERFORMANCE_ISSUES}"

log_success "성능 체크 완료"
exit $EXIT_SUCCESS