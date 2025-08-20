#!/bin/bash

# 🚀 안전한 GitHub 푸시 스크립트
# 하드코딩 없이 환경변수를 활용한 안전한 Git 인증

set -e  # 오류 발생시 즉시 종료

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

# .env.local에서 환경변수 로드
if [ -f ".env.local" ]; then
    log_info ".env.local 파일에서 환경변수 로드 중..."
    set -o allexport
    source .env.local
    set +o allexport
else
    log_error ".env.local 파일을 찾을 수 없습니다."
    exit 1
fi

# GitHub 토큰 확인
if [ -z "$GITHUB_PERSONAL_ACCESS_TOKEN" ]; then
    log_error "GITHUB_PERSONAL_ACCESS_TOKEN 환경변수가 설정되지 않았습니다."
    log_info "다음 중 하나를 .env.local에 설정하세요:"
    log_info "  - GITHUB_PERSONAL_ACCESS_TOKEN"
    log_info "  - GITHUB_TOKEN"
    log_info "  - GIT_TOKEN"
    exit 1
fi

# 토큰 길이 검증 (GitHub PAT는 보통 40자)
TOKEN_LENGTH=${#GITHUB_PERSONAL_ACCESS_TOKEN}
if [ $TOKEN_LENGTH -lt 30 ]; then
    log_error "GitHub 토큰이 너무 짧습니다 (${TOKEN_LENGTH}자). 올바른 토큰인지 확인하세요."
    exit 1
fi

# 현재 브랜치 확인
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
TARGET_BRANCH=${1:-$CURRENT_BRANCH}

log_info "현재 브랜치: $CURRENT_BRANCH"
log_info "푸시 대상 브랜치: $TARGET_BRANCH"

# Git 상태 확인
if [ -n "$(git status --porcelain)" ]; then
    log_warning "커밋되지 않은 변경사항이 있습니다."
    git status --short
    echo ""
fi

# Git remote URL이 깨끗한지 확인
REMOTE_URL=$(git remote get-url origin)
if [[ $REMOTE_URL == *"@"* ]] && [[ $REMOTE_URL == *"ghp_"* ]]; then
    log_warning "Git remote URL에 토큰이 하드코딩되어 있습니다. 정리합니다..."
    git remote set-url origin https://github.com/skyasu2/openmanager-vibe-v5.git
    log_success "Git remote URL 정리 완료"
fi

# Git credential 설정 확인 및 개선
CREDENTIAL_HELPER=$(git config credential.helper)
if [ "$CREDENTIAL_HELPER" = "store" ]; then
    log_warning "credential.helper가 'store'로 설정되어 있습니다. 보안을 위해 'cache'로 변경합니다..."
    git config --global credential.helper cache
    log_success "credential.helper를 'cache'로 변경완료 (15분간 메모리 캐시)"
fi

# 푸시 실행
log_info "GitHub에 푸시 시작..."

# 환경변수 설정으로 Git이 자동으로 인증 정보를 사용하도록 함
export GIT_USERNAME="skyasu2"
export GIT_PASSWORD="$GITHUB_PERSONAL_ACCESS_TOKEN"

# Git askpass 헬퍼 설정 (임시)
cat > /tmp/git-askpass-helper.sh << 'EOF'
#!/bin/bash
case "$1" in
    Username*) echo $GIT_USERNAME ;;
    Password*) echo $GIT_PASSWORD ;;
esac
EOF
chmod +x /tmp/git-askpass-helper.sh
export GIT_ASKPASS="/tmp/git-askpass-helper.sh"

# 푸시 실행
if HUSKY=0 git push origin $TARGET_BRANCH; then
    log_success "✨ GitHub 푸시 성공!"
    log_info "브랜치: $TARGET_BRANCH"
    
    # 최근 커밋 정보 표시
    log_info "푸시된 커밋:"
    git log --oneline -1
    
else
    EXIT_CODE=$?
    log_error "GitHub 푸시 실패 (종료 코드: $EXIT_CODE)"
    
    # 일반적인 실패 원인과 해결책 제시
    echo ""
    log_info "일반적인 해결 방법:"
    log_info "1. GitHub 토큰이 유효한지 확인"
    log_info "2. 저장소 권한이 있는지 확인"
    log_info "3. 브랜치가 보호되어 있지 않은지 확인"
    log_info "4. 네트워크 연결 상태 확인"
    
    # 토큰 정보 (앞 4자리만)
    log_info "현재 사용 중인 토큰: ${GITHUB_PERSONAL_ACCESS_TOKEN:0:4}... (${TOKEN_LENGTH}자)"
    
    exit $EXIT_CODE
fi

# 임시 파일 정리
rm -f /tmp/git-askpass-helper.sh
unset GIT_ASKPASS
unset GIT_USERNAME  
unset GIT_PASSWORD

log_success "🎉 안전한 GitHub 푸시 완료!"