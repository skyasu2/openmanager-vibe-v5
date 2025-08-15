#!/bin/bash

# ========================================
# WSL 자동 수정 스크립트
# ========================================
# 목적: WSL 호환성 문제들을 자동으로 수정합니다.
# 사용법: bash scripts/wsl-auto-fix.sh
# ========================================

set -e

echo "🔧 WSL 호환성 문제 자동 수정을 시작합니다..."

# ========================================
# 1. Git 설정 수정
# ========================================
echo ""
echo "🔧 Git 설정 수정..."

# core.autocrlf를 input으로 설정
current_autocrlf=$(git config --global core.autocrlf 2>/dev/null || echo "")
if [ "$current_autocrlf" != "input" ]; then
    git config --global core.autocrlf input
    echo "  ✅ Git core.autocrlf를 'input'으로 설정했습니다."
else
    echo "  ✅ Git core.autocrlf가 이미 올바르게 설정되어 있습니다."
fi

# core.filemode 설정 (파일 권한 변경 감지)
git config --global core.filemode true
echo "  ✅ Git core.filemode를 true로 설정했습니다."

# ========================================
# 2. 파일 권한 수정
# ========================================
echo ""
echo "🔐 파일 권한 수정..."

# 스크립트 파일들에 실행 권한 부여
find . -name "*.sh" -type f -exec chmod +x {} \; 2>/dev/null || true
echo "  ✅ 모든 .sh 파일에 실행 권한을 부여했습니다."

# .husky 파일들에 실행 권한 부여
if [ -d ".husky" ]; then
    find .husky -type f -exec chmod +x {} \; 2>/dev/null || true
    echo "  ✅ .husky 파일들에 실행 권한을 부여했습니다."
fi

# 현재 스크립트에도 실행 권한 부여
chmod +x scripts/wsl-*.sh 2>/dev/null || true
chmod +x scripts/wsl-*.js 2>/dev/null || true

# ========================================
# 3. 줄바꿈 문자 수정
# ========================================
echo ""
echo "📝 줄바꿈 문자 수정..."

# dos2unix가 설치되어 있는지 확인
if command -v dos2unix &> /dev/null; then
    # .sh 파일들의 줄바꿈 문자를 LF로 변경
    find . -name "*.sh" -type f -exec dos2unix {} \; 2>/dev/null || true
    echo "  ✅ 스크립트 파일들의 줄바꿈 문자를 LF로 변경했습니다."
    
    # .husky 파일들도 변경
    if [ -d ".husky" ]; then
        find .husky -type f -exec dos2unix {} \; 2>/dev/null || true
        echo "  ✅ .husky 파일들의 줄바꿈 문자를 LF로 변경했습니다."
    fi
else
    echo "  ⚠️  dos2unix가 설치되지 않았습니다. 수동으로 줄바꿈 문자를 확인하세요."
    echo "     설치 방법: sudo apt-get install dos2unix"
fi

# ========================================
# 4. 환경 변수 파일 생성
# ========================================
echo ""
echo "🌍 환경 변수 파일 설정..."

if [ ! -f ".env.local" ]; then
    if [ -f ".env.local.template" ]; then
        cp .env.local.template .env.local
        echo "  ✅ .env.local.template을 .env.local로 복사했습니다."
        echo "  ⚠️  .env.local 파일의 실제 값들을 설정해주세요."
    else
        echo "  ⚠️  .env.local.template 파일이 없습니다."
    fi
else
    echo "  ✅ .env.local 파일이 이미 존재합니다."
fi

# ========================================
# 5. Node.js 환경 확인 및 설정
# ========================================
echo ""
echo "🔧 Node.js 환경 설정..."

# .nvmrc 파일이 있고 nvm이 설치되어 있다면 Node.js 버전 맞추기
if [ -f ".nvmrc" ] && command -v nvm &> /dev/null; then
    NODE_VERSION=$(cat .nvmrc)
    echo "  🔍 .nvmrc에서 요구하는 Node.js 버전: $NODE_VERSION"
    
    # nvm 초기화 (필요한 경우)
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    
    if nvm use $NODE_VERSION 2>/dev/null; then
        echo "  ✅ Node.js $NODE_VERSION 사용 중"
    else
        echo "  📦 Node.js $NODE_VERSION 설치 중..."
        nvm install $NODE_VERSION
        nvm use $NODE_VERSION
        echo "  ✅ Node.js $NODE_VERSION 설치 및 사용 설정 완료"
    fi
elif [ -f ".nvmrc" ]; then
    echo "  ⚠️  nvm이 설치되지 않았습니다. Node.js 버전 관리를 위해 nvm 설치를 권장합니다."
    echo "     설치 방법: curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash"
fi

# ========================================
# 6. 의존성 설치
# ========================================
echo ""
echo "📦 의존성 확인..."

if [ -f "package.json" ] && [ ! -d "node_modules" ]; then
    echo "  📦 의존성 설치 중..."
    npm install
    echo "  ✅ 의존성 설치 완료"
elif [ -f "package.json" ]; then
    echo "  ✅ node_modules가 이미 존재합니다."
    
    # package-lock.json이 없다면 생성
    if [ ! -f "package-lock.json" ]; then
        echo "  📦 package-lock.json 생성 중..."
        npm install --package-lock-only
        echo "  ✅ package-lock.json 생성 완료"
    fi
fi

# ========================================
# 7. 빌드 캐시 정리
# ========================================
echo ""
echo "🧹 빌드 캐시 정리..."

# 기존 빌드 캐시 제거
if [ -d ".next" ]; then
    rm -rf .next
    echo "  ✅ .next 캐시 정리 완료"
fi

if [ -d "node_modules/.cache" ]; then
    rm -rf node_modules/.cache
    echo "  ✅ node_modules 캐시 정리 완료"
fi

if [ -f ".eslintcache" ]; then
    rm -f .eslintcache
    echo "  ✅ ESLint 캐시 정리 완료"
fi

# ========================================
# 8. WSL 특화 설정
# ========================================
echo ""
echo "🐧 WSL 특화 설정..."

# WSL 환경 변수 설정 (현재 세션용)
if [[ "$PWD" == /mnt/* ]]; then
    echo "  ✅ WSL 마운트 경로에서 실행 중입니다."
    
    # Windows 경로 변환 테스트
    WINDOWS_PATH=$(echo "$PWD" | sed 's|/mnt/\([a-z]\)|\U\1:|' | sed 's|/|\\|g')
    echo "  📂 Windows 경로: $WINDOWS_PATH"
    
    # WSL 환경 변수 설정
    export WSL_PROJECT_PATH="$PWD"
    export WINDOWS_PROJECT_PATH="$WINDOWS_PATH"
    
    echo "  ✅ WSL 환경 변수 설정 완료"
fi

# ========================================
# 9. 검증 테스트
# ========================================
echo ""
echo "🧪 수정 사항 검증..."

# TypeScript 컴파일 테스트
if command -v npm &> /dev/null && [ -f "package.json" ]; then
    echo "  🔍 TypeScript 타입 체크..."
    if npm run type-check > /dev/null 2>&1; then
        echo "  ✅ TypeScript 타입 체크 통과"
    else
        echo "  ⚠️  TypeScript 타입 체크에서 오류가 있습니다. 수동 확인이 필요합니다."
    fi
fi

# Git 상태 확인
echo "  🔍 Git 상태 확인..."
if git status > /dev/null 2>&1; then
    echo "  ✅ Git 저장소 상태 정상"
else
    echo "  ⚠️  Git 저장소 상태에 문제가 있을 수 있습니다."
fi

# ========================================
# 10. 완료 및 권장사항
# ========================================
echo ""
echo "🎉 WSL 호환성 문제 자동 수정이 완료되었습니다!"
echo ""
echo "📝 다음 단계:"
echo "  1. 터미널을 재시작하거나 'source ~/.bashrc'를 실행하세요"
echo "  2. .env.local 파일의 실제 값들을 설정하세요"
echo "  3. 'npm run dev'로 개발 서버를 시작해보세요"
echo "  4. 'node scripts/wsl-compatibility-check.js'로 최종 확인하세요"
echo ""
echo "🔧 유용한 명령어들:"
echo "  - npm run dev                              : 개발 서버 시작"
echo "  - node scripts/wsl-compatibility-check.js  : 호환성 재검사"
echo "  - node scripts/wsl-path-converter.js --test : 경로 변환 테스트"
echo "  - bash scripts/wsl-environment-setup.sh    : 전체 환경 재설정"
echo ""
echo "⚠️  주의사항:"
echo "  - Windows와 WSL 간 파일 공유 시 성능 차이가 있을 수 있습니다"
echo "  - node_modules는 WSL 내부에서 설치하는 것이 성능상 유리합니다"
echo "  - Git 커밋 시 줄바꿈 문자 변경으로 인한 diff가 발생할 수 있습니다"
echo ""