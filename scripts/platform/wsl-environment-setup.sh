#!/bin/bash

# ========================================
# WSL 환경 설정 스크립트
# ========================================
# 목적: Windows에서 WSL로 환경 변경 시 발생할 수 있는 문제들을 사전에 해결
# 사용법: bash scripts/wsl-environment-setup.sh
# ========================================

set -e  # 에러 발생 시 스크립트 중단

echo "🚀 WSL 환경 설정을 시작합니다..."

# ========================================
# 1. 기본 환경 확인
# ========================================
echo "📋 현재 환경 정보:"
echo "  - OS: $(uname -a)"
echo "  - Shell: $SHELL"
echo "  - User: $USER"
echo "  - Home: $HOME"
echo "  - PWD: $PWD"

# ========================================
# 2. Node.js 버전 확인 및 설정
# ========================================
echo ""
echo "🔧 Node.js 환경 설정..."

# .nvmrc에서 Node.js 버전 읽기
if [ -f ".nvmrc" ]; then
    NODE_VERSION=$(cat .nvmrc)
    echo "  - 요구 Node.js 버전: $NODE_VERSION"
    
    # nvm이 설치되어 있는지 확인
    if command -v nvm &> /dev/null; then
        echo "  - nvm 사용하여 Node.js 설정 중..."
        nvm use $NODE_VERSION || nvm install $NODE_VERSION
    elif command -v node &> /dev/null; then
        CURRENT_NODE=$(node --version)
        echo "  - 현재 Node.js 버전: $CURRENT_NODE"
        if [[ "$CURRENT_NODE" != "v$NODE_VERSION" ]]; then
            echo "  ⚠️  Node.js 버전이 다릅니다. nvm 설치를 권장합니다."
        fi
    else
        echo "  ❌ Node.js가 설치되지 않았습니다."
        echo "  📝 Node.js 설치 방법:"
        echo "     curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -"
        echo "     sudo apt-get install -y nodejs"
    fi
else
    echo "  ⚠️  .nvmrc 파일이 없습니다."
fi

# ========================================
# 3. 패키지 매니저 확인
# ========================================
echo ""
echo "📦 패키지 매니저 확인..."

if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    echo "  - npm 버전: $NPM_VERSION"
    
    # package.json에서 요구 npm 버전 확인
    if [ -f "package.json" ]; then
        REQUIRED_NPM=$(grep -o '"npm": ">=.*"' package.json | sed 's/"npm": ">=\(.*\)"/\1/' || echo "")
        if [ ! -z "$REQUIRED_NPM" ]; then
            echo "  - 요구 npm 버전: >=$REQUIRED_NPM"
        fi
    fi
else
    echo "  ❌ npm이 설치되지 않았습니다."
fi

# ========================================
# 4. Git 설정 확인
# ========================================
echo ""
echo "🔧 Git 설정 확인..."

# Git 사용자 정보 확인
GIT_USER=$(git config --global user.name 2>/dev/null || echo "")
GIT_EMAIL=$(git config --global user.email 2>/dev/null || echo "")

if [ -z "$GIT_USER" ] || [ -z "$GIT_EMAIL" ]; then
    echo "  ⚠️  Git 사용자 정보가 설정되지 않았습니다."
    echo "  📝 설정 방법:"
    echo "     git config --global user.name \"Your Name\""
    echo "     git config --global user.email \"your.email@example.com\""
else
    echo "  - Git 사용자: $GIT_USER <$GIT_EMAIL>"
fi

# Git 줄바꿈 설정 확인
GIT_AUTOCRLF=$(git config --global core.autocrlf 2>/dev/null || echo "")
if [ "$GIT_AUTOCRLF" != "input" ]; then
    echo "  🔧 Git 줄바꿈 설정을 WSL에 맞게 조정합니다..."
    git config --global core.autocrlf input
    echo "  ✅ core.autocrlf를 'input'으로 설정했습니다."
fi

# ========================================
# 5. 파일 권한 설정
# ========================================
echo ""
echo "🔐 파일 권한 설정..."

# 실행 가능한 스크립트 파일들에 권한 부여
SCRIPT_FILES=(
    "scripts/*.sh"
    ".husky/*"
    "*.sh"
)

for pattern in "${SCRIPT_FILES[@]}"; do
    for file in $pattern; do
        if [ -f "$file" ] && [ ! -x "$file" ]; then
            chmod +x "$file"
            echo "  ✅ $file에 실행 권한을 부여했습니다."
        fi
    done
done

# ========================================
# 6. 환경 변수 파일 확인
# ========================================
echo ""
echo "🌍 환경 변수 파일 확인..."

if [ ! -f ".env.local" ]; then
    if [ -f ".env.local.template" ]; then
        echo "  📝 .env.local.template을 .env.local로 복사합니다..."
        cp .env.local.template .env.local
        echo "  ⚠️  .env.local 파일의 실제 값들을 설정해주세요."
    else
        echo "  ⚠️  .env.local.template 파일이 없습니다."
    fi
else
    echo "  ✅ .env.local 파일이 존재합니다."
fi

# ========================================
# 7. WSL 특화 설정
# ========================================
echo ""
echo "🐧 WSL 특화 설정..."

# Windows 경로 변환 함수 테스트
if [[ "$PWD" == /mnt/* ]]; then
    echo "  ✅ WSL 환경에서 실행 중입니다."
    
    # Windows 경로 변환 테스트
    WINDOWS_PATH=$(echo "$PWD" | sed 's|/mnt/\([a-z]\)|\U\1:|' | sed 's|/|\\|g')
    echo "  - Windows 경로: $WINDOWS_PATH"
    
    # WSL 배치 파일들 확인
    WSL_BATCH_FILES=("claude-wsl.bat" "ai-cli-wsl.bat" "gemini-wsl.bat" "openai-wsl.bat" "qwen-wsl.bat")
    for batch_file in "${WSL_BATCH_FILES[@]}"; do
        if [ -f "$batch_file" ]; then
            echo "  ✅ $batch_file 존재"
        else
            echo "  ⚠️  $batch_file 없음"
        fi
    done
else
    echo "  ⚠️  WSL 환경이 아닌 것 같습니다."
fi

# ========================================
# 8. 의존성 설치 확인
# ========================================
echo ""
echo "📚 의존성 설치 확인..."

if [ -f "package.json" ] && [ ! -d "node_modules" ]; then
    echo "  📦 node_modules가 없습니다. 의존성을 설치합니다..."
    npm install
elif [ -f "package.json" ]; then
    echo "  ✅ node_modules가 존재합니다."
    
    # package-lock.json 확인
    if [ -f "package-lock.json" ]; then
        echo "  ✅ package-lock.json 존재"
    else
        echo "  ⚠️  package-lock.json이 없습니다. npm install을 실행하세요."
    fi
fi

# ========================================
# 9. 빌드 캐시 정리
# ========================================
echo ""
echo "🧹 빌드 캐시 정리..."

CACHE_DIRS=(".next" "node_modules/.cache" ".eslintcache")
for cache_dir in "${CACHE_DIRS[@]}"; do
    if [ -d "$cache_dir" ]; then
        echo "  🗑️  $cache_dir 정리 중..."
        rm -rf "$cache_dir"
        echo "  ✅ $cache_dir 정리 완료"
    fi
done

# ========================================
# 10. 테스트 실행
# ========================================
echo ""
echo "🧪 기본 테스트 실행..."

# TypeScript 컴파일 테스트
if command -v npm &> /dev/null && [ -f "package.json" ]; then
    echo "  🔍 TypeScript 타입 체크..."
    if npm run type-check > /dev/null 2>&1; then
        echo "  ✅ TypeScript 타입 체크 통과"
    else
        echo "  ⚠️  TypeScript 타입 체크에서 오류가 있습니다."
    fi
    
    # 빠른 린트 테스트
    echo "  🔍 ESLint 빠른 체크..."
    if npm run lint:quick > /dev/null 2>&1; then
        echo "  ✅ ESLint 빠른 체크 통과"
    else
        echo "  ⚠️  ESLint에서 오류가 있습니다."
    fi
fi

# ========================================
# 완료 메시지
# ========================================
echo ""
echo "🎉 WSL 환경 설정이 완료되었습니다!"
echo ""
echo "📝 다음 단계:"
echo "  1. .env.local 파일의 실제 값들을 설정하세요"
echo "  2. npm run dev로 개발 서버를 시작하세요"
echo "  3. 문제가 있다면 위의 경고 메시지들을 확인하세요"
echo ""
echo "🔧 유용한 명령어들:"
echo "  - npm run dev          : 개발 서버 시작"
echo "  - npm run type-check   : TypeScript 타입 체크"
echo "  - npm run lint:quick   : 빠른 린트 체크"
echo "  - npm run test:quick   : 빠른 테스트 실행"
echo ""