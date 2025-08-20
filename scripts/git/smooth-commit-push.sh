#!/bin/bash

# 🚀 매끄러운 커밋/푸시 스크립트 v1.0
# OpenManager VIBE v5용 최적화된 Git 워크플로우

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 도움말 표시
show_help() {
    echo "🚀 매끄러운 Git 워크플로우 도구"
    echo ""
    echo "사용법:"
    echo "  $0 [옵션] \"커밋 메시지\""
    echo ""
    echo "옵션:"
    echo "  -f, --fast      빠른 커밋 (검증 최소화)"
    echo "  -s, --skip      검증 완전 스킵"
    echo "  -n, --no-push   푸시 없이 커밋만"
    echo "  -h, --help      도움말 표시"
    echo ""
    echo "예시:"
    echo "  $0 \"✨ feat: 새로운 기능 추가\""
    echo "  $0 -f \"🐛 fix: 버그 수정\""
    echo "  $0 -s \"📚 docs: 문서 업데이트\""
    echo "  $0 -n \"⚡ perf: 성능 개선\""
}

# 기본값 설정
FAST_MODE=false
SKIP_MODE=false
NO_PUSH=false
COMMIT_MESSAGE=""

# 명령행 인수 처리
while [[ $# -gt 0 ]]; do
    case $1 in
        -f|--fast)
            FAST_MODE=true
            shift
            ;;
        -s|--skip)
            SKIP_MODE=true
            shift
            ;;
        -n|--no-push)
            NO_PUSH=true
            shift
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            if [[ -z "$COMMIT_MESSAGE" ]]; then
                COMMIT_MESSAGE="$1"
            else
                echo -e "${RED}❌ 오류: 커밋 메시지는 하나만 지정할 수 있습니다.${NC}"
                exit 1
            fi
            shift
            ;;
    esac
done

# 커밋 메시지 필수 확인
if [[ -z "$COMMIT_MESSAGE" ]]; then
    echo -e "${RED}❌ 오류: 커밋 메시지를 입력해주세요.${NC}"
    echo ""
    show_help
    exit 1
fi

# 함수 정의
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# 시작 메시지
echo -e "${BLUE}🚀 매끄러운 Git 워크플로우 시작${NC}"
echo "📝 커밋 메시지: $COMMIT_MESSAGE"

if [[ "$FAST_MODE" == true ]]; then
    echo "⚡ 빠른 모드 활성화"
fi

if [[ "$SKIP_MODE" == true ]]; then
    echo "⏭️  검증 스킵 모드 활성화"
fi

if [[ "$NO_PUSH" == true ]]; then
    echo "📦 로컬 커밋만 실행 (푸시 없음)"
fi

echo ""

# 1️⃣ 원격 상태 동기화
log_info "원격 상태를 동기화합니다..."
git fetch origin --prune --quiet

# 현재 브랜치 확인
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
log_info "현재 브랜치: $CURRENT_BRANCH"

# 2️⃣ 변경사항 확인
CHANGED_FILES=$(git diff --cached --name-only | wc -l)
UNSTAGED_FILES=$(git diff --name-only | wc -l)

if [[ $CHANGED_FILES -eq 0 ]]; then
    if [[ $UNSTAGED_FILES -eq 0 ]]; then
        log_warning "변경사항이 없습니다."
        exit 0
    else
        log_info "변경된 파일 ${UNSTAGED_FILES}개를 스테이징합니다..."
        git add .
        CHANGED_FILES=$(git diff --cached --name-only | wc -l)
    fi
fi

log_info "스테이징된 파일: ${CHANGED_FILES}개"

# 3️⃣ Pre-commit 검증 (모드에 따라 다르게)
if [[ "$SKIP_MODE" == true ]]; then
    log_warning "검증을 스킵합니다."
    export HUSKY=0
elif [[ "$FAST_MODE" == true ]]; then
    log_info "빠른 검증을 실행합니다..."
    export PRECOMMIT_FAST=1
else
    log_info "표준 검증을 실행합니다..."
fi

# 4️⃣ 커밋 실행
log_info "커밋을 실행합니다..."
if git commit -m "$COMMIT_MESSAGE"; then
    log_success "커밋이 성공했습니다!"
    COMMIT_HASH=$(git rev-parse --short HEAD)
    log_info "커밋 해시: $COMMIT_HASH"
else
    log_error "커밋이 실패했습니다."
    exit 1
fi

# 5️⃣ 푸시 실행 (옵션에 따라)
if [[ "$NO_PUSH" == true ]]; then
    log_success "로컬 커밋 완료! (푸시 스킵)"
    echo ""
    echo "💡 수동 푸시 방법:"
    echo "   git push origin $CURRENT_BRANCH"
    exit 0
fi

# 원격과의 차이 확인
AHEAD=$(git rev-list --count origin/$CURRENT_BRANCH..$CURRENT_BRANCH 2>/dev/null || echo "1")
BEHIND=$(git rev-list --count $CURRENT_BRANCH..origin/$CURRENT_BRANCH 2>/dev/null || echo "0")

if [[ $BEHIND -gt 0 ]]; then
    log_warning "원격 브랜치가 ${BEHIND}개 커밋 앞서 있습니다."
    log_info "풀을 실행합니다..."
    git pull origin $CURRENT_BRANCH --rebase
fi

# 푸시 실행
log_info "원격으로 푸시합니다..."
if git push origin $CURRENT_BRANCH; then
    log_success "푸시가 성공했습니다!"
else
    log_error "푸시가 실패했습니다."
    echo ""
    echo "💡 수동 해결 방법:"
    echo "   git push origin $CURRENT_BRANCH --force-with-lease  # 안전한 강제 푸시"
    echo "   git pull origin $CURRENT_BRANCH --rebase           # 리베이스 후 재시도"
    exit 1
fi

# 6️⃣ 최종 상태 확인
log_info "최종 상태를 확인합니다..."
git fetch origin --prune --quiet

LOCAL_HASH=$(git rev-parse HEAD)
REMOTE_HASH=$(git rev-parse origin/$CURRENT_BRANCH)

if [[ "$LOCAL_HASH" == "$REMOTE_HASH" ]]; then
    log_success "로컬과 원격이 동기화되었습니다!"
else
    log_warning "로컬과 원격 간에 차이가 있을 수 있습니다."
fi

# 성공 메시지
echo ""
echo -e "${GREEN}🎉 매끄러운 Git 워크플로우 완료!${NC}"
echo ""
echo "📊 결과 요약:"
echo "  - 커밋: $COMMIT_HASH"
echo "  - 브랜치: $CURRENT_BRANCH"
echo "  - 변경 파일: ${CHANGED_FILES}개"
echo "  - 상태: 로컬 ↔️ 원격 동기화됨"
echo ""
echo "🔗 GitHub에서 확인: https://github.com/skyasu2/openmanager-vibe-v5/commit/$COMMIT_HASH"