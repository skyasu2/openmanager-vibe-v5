#!/bin/bash

# 통합 배포 도구
# 
# 통합된 기능:
# - emergency-deploy.sh
# - emergency-vercel-crisis.sh
# - deploy-with-redis.mjs
# - git-push-helper.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

check_prerequisites() {
    log_info "필수 도구 확인 중..."
    
    # Git 확인
    if ! command -v git &> /dev/null; then
        log_error "Git이 설치되지 않았습니다."
        exit 1
    fi
    
    # Node.js 확인
    if ! command -v node &> /dev/null; then
        log_error "Node.js가 설치되지 않았습니다."
        exit 1
    fi
    
    # Vercel CLI 확인
    if ! command -v vercel &> /dev/null; then
        log_warning "Vercel CLI가 설치되지 않았습니다. npm install -g vercel로 설치하세요."
    fi
    
    log_success "필수 도구 확인 완료"
}

check_git_status() {
    log_info "Git 상태 확인 중..."
    
    # 작업 디렉토리가 깨끗한지 확인
    if [ -n "$(git status --porcelain)" ]; then
        log_warning "작업 디렉토리에 변경사항이 있습니다."
        git status --short
        
        read -p "계속 진행하시겠습니까? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "배포 취소됨"
            exit 0
        fi
    fi
    
    log_success "Git 상태 확인 완료"
}

run_tests() {
    log_info "테스트 실행 중..."
    
    # TypeScript 컴파일 체크
    if npm run type-check 2>/dev/null; then
        log_success "TypeScript 타입 체크 통과"
    else
        log_warning "TypeScript 타입 체크 실패 (계속 진행)"
    fi
    
    # 린트 체크
    if npm run lint 2>/dev/null; then
        log_success "린트 체크 통과"
    else
        log_warning "린트 체크 실패 (계속 진행)"
    fi
    
    # 유닛 테스트 (있는 경우)
    if npm test 2>/dev/null; then
        log_success "테스트 통과"
    else
        log_warning "테스트 실패 또는 테스트 없음 (계속 진행)"
    fi
}

build_project() {
    log_info "프로젝트 빌드 중..."
    
    # 의존성 설치
    npm ci
    
    # 프로젝트 빌드
    if npm run build; then
        log_success "빌드 완료"
    else
        log_error "빌드 실패"
        exit 1
    fi
}

commit_changes() {
    local commit_message="$1"
    
    if [ -z "$commit_message" ]; then
        commit_message="🚀 배포 준비: $(date '+%Y-%m-%d %H:%M:%S')"
    fi
    
    log_info "변경사항 커밋 중..."
    
    git add -A
    
    if [ -n "$(git diff --staged)" ]; then
        git commit -m "$commit_message

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"
        log_success "커밋 완료: $commit_message"
    else
        log_info "커밋할 변경사항이 없습니다."
    fi
}

deploy_to_vercel() {
    log_info "Vercel 배포 시작..."
    
    if command -v vercel &> /dev/null; then
        # 프로덕션 배포
        if vercel --prod --yes; then
            log_success "Vercel 배포 완료"
        else
            log_error "Vercel 배포 실패"
            exit 1
        fi
    else
        log_warning "Vercel CLI가 없어 수동 배포가 필요합니다."
        log_info "Git push 후 자동 배포됩니다."
    fi
}

push_to_git() {
    log_info "Git push 중..."
    
    local current_branch=$(git branch --show-current)
    
    if git push origin "$current_branch"; then
        log_success "Git push 완료 ($current_branch)"
    else
        log_error "Git push 실패"
        exit 1
    fi
}

emergency_deploy() {
    log_warning "🚨 응급 배포 모드"
    log_info "빠른 배포를 위해 일부 검사를 건너뜁니다."
    
    check_prerequisites
    
    # 최소한의 체크만 수행
    log_info "응급 빌드 중..."
    npm run build || {
        log_error "빌드 실패 - 응급 배포 중단"
        exit 1
    }
    
    commit_changes "🚨 Emergency deploy: $(date '+%Y-%m-%d %H:%M:%S')"
    push_to_git
    deploy_to_vercel
    
    log_success "🚨 응급 배포 완료!"
}

normal_deploy() {
    log_info "🚀 일반 배포 시작"
    
    check_prerequisites
    check_git_status
    run_tests
    build_project
    
    local commit_message="$1"
    commit_changes "$commit_message"
    push_to_git
    deploy_to_vercel
    
    log_success "🚀 배포 완료!"
}

rollback_deploy() {
    log_warning "🔄 롤백 시작"
    
    # 이전 커밋으로 되돌리기
    local last_commit=$(git log --oneline -2 | tail -n 1 | cut -d' ' -f1)
    
    read -p "이전 커밋 ($last_commit)으로 롤백하시겠습니까? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git reset --hard "$last_commit"
        push_to_git
        deploy_to_vercel
        log_success "🔄 롤백 완료!"
    else
        log_info "롤백 취소됨"
    fi
}

show_help() {
    echo "🚀 통합 배포 도구 사용법:"
    echo ""
    echo "  $0 deploy [메시지]     # 일반 배포 (테스트 + 빌드 + 배포)"
    echo "  $0 emergency          # 응급 배포 (최소 검사만)"
    echo "  $0 rollback           # 이전 버전으로 롤백"
    echo "  $0 test               # 테스트만 실행"
    echo "  $0 build              # 빌드만 실행"
    echo "  $0 push [메시지]       # 커밋 + Push만"
    echo ""
    echo "예시:"
    echo "  $0 deploy \"새 기능 추가\""
    echo "  $0 emergency"
    echo "  $0 push \"버그 수정\""
}

# 메인 로직
case "$1" in
    "deploy")
        normal_deploy "$2"
        ;;
    "emergency")
        emergency_deploy
        ;;
    "rollback")
        rollback_deploy
        ;;
    "test")
        run_tests
        ;;
    "build")
        build_project
        ;;
    "push")
        check_prerequisites
        commit_changes "$2"
        push_to_git
        ;;
    "help"|"-h"|"--help")
        show_help
        ;;
    *)
        log_error "알 수 없는 명령어: $1"
        echo ""
        show_help
        exit 1
        ;;
esac