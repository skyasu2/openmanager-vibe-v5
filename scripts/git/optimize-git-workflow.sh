#!/bin/bash

# 🚀 Git 워크플로우 최적화 스크립트 v1.0
# OpenManager VIBE v5용 Git 설정 최적화

set -e

echo "🚀 Git 워크플로우 최적화를 시작합니다..."

# 1️⃣ Git 기본 설정 최적화
echo "📋 Git 기본 설정을 최적화합니다..."

# 푸시 기본 전략: simple (현재 브랜치만 푸시)
git config push.default simple

# 풀 전략: 리베이스 우선 (깔끔한 히스토리)
git config pull.rebase true

# 자동 프루닝: 원격에서 삭제된 브랜치 로컬에서도 정리
git config fetch.prune true

# 자동 스테이징 방지 (안전성 확보)
git config push.autoSetupRemote false

# 브랜치 기본 이름 설정 (이미 main이지만 명시)
git config init.defaultBranch main

# 2️⃣ 성능 및 편의성 설정
echo "⚡ Git 성능을 최적화합니다..."

# 대용량 파일 처리 개선
git config core.preloadindex true
git config core.fscache true

# 병렬 처리 활용 (WSL 환경 최적화)
git config pack.threads 0

# 압축 레벨 조정 (성능 vs 공간 균형)
git config pack.compression 6

# 3️⃣ WSL 환경 최적화
echo "🐧 WSL 환경에 최적화된 설정을 적용합니다..."

# 파일 권한 처리 (WSL-Windows 호환성)
git config core.filemode false

# 줄바꿈 설정 (Linux LF 우선)
git config core.autocrlf input
git config core.eol lf

# 대소문자 구분 (Linux 방식)
git config core.ignorecase false

# 4️⃣ 보안 및 인증 설정
echo "🔐 보안 설정을 강화합니다..."

# HTTPS 인증 캐시 (1시간)
git config credential.helper 'cache --timeout=3600'

# GPG 서명 확인 (보안 강화)
git config commit.gpgsign false  # 개발 편의성 우선

# 5️⃣ 편의성 별칭 설정
echo "⚡ 편의성 별칭을 설정합니다..."

git config alias.st status
git config alias.co checkout
git config alias.br branch
git config alias.ci commit
git config alias.unstage 'reset HEAD --'
git config alias.last 'log -1 HEAD'
git config alias.visual '!gitk'

# 고급 별칭
git config alias.adog 'log --all --decorate --oneline --graph'
git config alias.pushf 'push --force-with-lease'
git config alias.uncommit 'reset --soft HEAD~1'
git config alias.amend 'commit --amend --no-edit'

# 6️⃣ 원격 연결 상태 검증 및 최적화
echo "🌐 원격 연결을 최적화합니다..."

# 원격 정보 갱신
git fetch origin --prune

# 기본 브랜치 추적 설정 확인
git branch --set-upstream-to=origin/main main 2>/dev/null || echo "✅ 이미 설정됨"

# 7️⃣ 최종 검증
echo "🔍 설정을 검증합니다..."

echo "📊 현재 Git 설정:"
echo "  - push.default: $(git config --get push.default)"
echo "  - pull.rebase: $(git config --get pull.rebase)"
echo "  - fetch.prune: $(git config --get fetch.prune)"
echo "  - core.autocrlf: $(git config --get core.autocrlf)"
echo "  - core.filemode: $(git config --get core.filemode)"

# 원격 연결 테스트
echo "🌐 원격 연결 테스트:"
if git ls-remote origin HEAD >/dev/null 2>&1; then
    echo "  ✅ 원격 저장소 연결 정상"
else
    echo "  ❌ 원격 저장소 연결 실패"
    exit 1
fi

# 상태 확인
echo "📋 현재 상태:"
git status --porcelain | wc -l | xargs -I {} echo "  - 변경된 파일: {} 개"
git log --oneline -1 | xargs -I {} echo "  - 최근 커밋: {}"

echo ""
echo "🎉 Git 워크플로우 최적화 완료!"
echo ""
echo "💡 새로운 기능:"
echo "   - git st (status)"
echo "   - git adog (그래프 로그)"
echo "   - git pushf (안전한 강제 푸시)"
echo "   - git amend (커밋 메시지 수정)"
echo ""
echo "🚀 이제 매끄러운 Git 워크플로우를 즐기세요!"