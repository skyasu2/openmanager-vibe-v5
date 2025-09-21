# 🔧 OpenManager VIBE v5 개발환경 자동 설정

**대상**: 새로운 WSL 환경 또는 개발환경 초기화

## 🚀 원클릭 환경 설정

### 기본 개발환경 설정 스크립트
```bash
#!/bin/bash
# 파일: scripts/setup-dev-environment.sh

echo "🚀 OpenManager VIBE v5 개발환경 설정 시작..."

# Node.js 버전 확인 및 설치 (v22.19.0)
echo "📦 Node.js 환경 확인..."
if ! command -v node &> /dev/null || [[ $(node -v) != "v22.19.0" ]]; then
    echo "Node.js v22.19.0 설치 중..."
    curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# npm 업데이트 (v11.6.0+)
echo "📦 npm 업데이트..."
npm install -g npm@latest

# AI CLI 도구 설치
echo "🤖 AI CLI 도구 설치..."
npm install -g @google/generative-ai-cli    # Gemini CLI
npm install -g qwen-cli                      # Qwen CLI
npm install -g @openai/cli                   # Codex CLI

# Claude Code 설치 확인
echo "🎯 Claude Code 확인..."
if ! command -v claude &> /dev/null; then
    echo "⚠️ Claude Code를 수동으로 설치하세요: https://claude.ai/code"
fi

# Node.js 메모리 최적화 설정
echo "⚡ Node.js 메모리 최적화..."
echo 'export NODE_OPTIONS="--max-old-space-size=12288"' >> ~/.bashrc

# 프로젝트 의존성 설치
echo "📋 프로젝트 의존성 설치..."
npm install

# MCP 환경변수 로드
echo "🔌 MCP 환경 설정..."
if [ -f "./scripts/setup-mcp-env.sh" ]; then
    source ./scripts/setup-mcp-env.sh
fi

echo "✅ 개발환경 설정 완료!"
echo "🔄 터미널을 재시작하거나 'source ~/.bashrc'를 실행하세요."
```

### WSL 메모리 최적화 설정
```bash
#!/bin/bash
# 파일: scripts/optimize-wsl-memory.sh

echo "🐧 WSL 메모리 최적화 설정..."

# .wslconfig 백업
if [ -f "/mnt/c/Users/$USER/.wslconfig" ]; then
    cp "/mnt/c/Users/$USER/.wslconfig" "/mnt/c/Users/$USER/.wslconfig.backup"
    echo "📋 기존 .wslconfig 백업 완료"
fi

# 최적화된 .wslconfig 생성
cat > "/mnt/c/Users/$USER/.wslconfig" << 'EOF'
[wsl2]
# 메모리 설정 (19GB - MCP 서버 최적화)
memory=19GB
swap=10GB

# 프로세서 설정
processors=8

# 네트워킹 (MCP 서버 호환성)
networkingMode=mirrored
dnsTunneling=true
autoProxy=true

# 성능 최적화
autoMemoryReclaim=gradual
sparseVhd=true
guiApplications=true
EOF

echo "✅ WSL 설정 최적화 완료!"
echo "🔄 'wsl --shutdown' 후 WSL을 재시작하세요."
```

## 🔍 환경 검증 스크립트

### 전체 환경 상태 점검
```bash
#!/bin/bash
# 파일: scripts/check-environment.sh

echo "🔍 OpenManager VIBE v5 환경 상태 점검..."
echo "================================================"

# 기본 도구 버전 확인
echo "📦 기본 도구 버전:"
echo "Node.js: $(node --version)"
echo "npm: $(npm --version)"
echo "Claude: $(claude --version 2>/dev/null || echo '❌ 미설치')"

# AI CLI 도구 확인
echo ""
echo "🤖 AI CLI 도구 상태:"
echo "Gemini: $(which gemini >/dev/null && echo '✅ 설치됨' || echo '❌ 미설치')"
echo "Qwen: $(which qwen >/dev/null && echo '✅ 설치됨' || echo '❌ 미설치')"
echo "Codex: $(which codex >/dev/null && echo '✅ 설치됨' || echo '❌ 미설치')"

# 메모리 상태 확인
echo ""
echo "💾 메모리 상태:"
free -h | head -2

# MCP 서버 상태 확인
echo ""
echo "🔌 MCP 서버 상태:"
if command -v claude &> /dev/null; then
    claude mcp list 2>/dev/null | grep -E "(Connected|✓)" | wc -l | xargs echo "연결된 서버:"
else
    echo "❌ Claude Code 미설치로 MCP 상태 확인 불가"
fi

# 프로젝트 의존성 확인
echo ""
echo "📋 프로젝트 상태:"
if [ -f "package.json" ]; then
    echo "✅ package.json 존재"
    if [ -d "node_modules" ]; then
        echo "✅ node_modules 설치됨"
    else
        echo "❌ node_modules 없음 - 'npm install' 실행 필요"
    fi
else
    echo "❌ package.json 없음 - 프로젝트 루트가 아님"
fi

echo ""
echo "================================================"
echo "🎯 종합 상태: $([ -f "package.json" ] && [ -d "node_modules" ] && command -v node &>/dev/null && echo '✅ 정상' || echo '⚠️ 설정 필요')"
```

## 🛠️ 개발 도구 자동화

### 빠른 개발 시작 스크립트
```bash
#!/bin/bash
# 파일: scripts/dev-start.sh

echo "🚀 OpenManager VIBE v5 개발 시작..."

# 환경 체크
if ! command -v node &> /dev/null; then
    echo "❌ Node.js가 설치되지 않았습니다."
    exit 1
fi

# MCP 서버 상태 확인
echo "🔌 MCP 서버 상태 확인..."
if command -v claude &> /dev/null; then
    claude mcp list > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo "✅ MCP 서버 정상"
    else
        echo "⚠️ MCP 서버 재시작 중..."
        source ./scripts/setup-mcp-env.sh
    fi
fi

# 의존성 확인
if [ ! -d "node_modules" ]; then
    echo "📦 의존성 설치 중..."
    npm install
fi

# 개발 서버 시작
echo "🎯 개발 서버 시작..."
npm run dev
```

### AI 도구 연결 테스트
```bash
#!/bin/bash
# 파일: scripts/test-ai-tools.sh

echo "🤖 AI 도구 연결 테스트..."

# Claude Code 테스트
echo "1. Claude Code 테스트:"
if claude --version > /dev/null 2>&1; then
    echo "   ✅ Claude Code 정상 ($(claude --version))"
else
    echo "   ❌ Claude Code 연결 실패"
fi

# Gemini CLI 테스트
echo "2. Gemini CLI 테스트:"
if timeout 10 gemini "Hello" > /dev/null 2>&1; then
    echo "   ✅ Gemini CLI 정상"
else
    echo "   ❌ Gemini CLI 연결 실패 또는 타임아웃"
fi

# Qwen CLI 테스트
echo "3. Qwen CLI 테스트:"
if timeout 10 qwen -p "test" > /dev/null 2>&1; then
    echo "   ✅ Qwen CLI 정상"
else
    echo "   ❌ Qwen CLI 연결 실패 또는 타임아웃"
fi

# Codex CLI 테스트
echo "4. Codex CLI 테스트:"
if codex auth status > /dev/null 2>&1; then
    echo "   ✅ Codex CLI 정상"
else
    echo "   ❌ Codex CLI 인증 필요 - 'codex auth login' 실행"
fi

echo "🎯 테스트 완료!"
```

## 📋 사용법

### 신규 환경 설정
```bash
# 1. 기본 환경 설정
chmod +x scripts/setup-dev-environment.sh
./scripts/setup-dev-environment.sh

# 2. WSL 메모리 최적화 (선택사항)
chmod +x scripts/optimize-wsl-memory.sh
./scripts/optimize-wsl-memory.sh

# 3. 환경 검증
chmod +x scripts/check-environment.sh
./scripts/check-environment.sh
```

### 일상적인 개발 워크플로우
```bash
# 매일 개발 시작 시
./scripts/dev-start.sh

# AI 도구 연결 문제 시
./scripts/test-ai-tools.sh

# 전체 환경 점검 시
./scripts/check-environment.sh
```

---

💡 **팁**: 이 스크립트들은 WSL 2 + Ubuntu 환경을 기준으로 작성되었습니다. 다른 환경에서는 적절히 수정하세요.

⚠️ **주의**: WSL 설정 변경 후에는 반드시 `wsl --shutdown` 후 재시작하세요.