# 🔧 MCP 서버 완전 설치 가이드 (2025년판)

> **2025년 8월 17일 기준**  
> **환경**: WSL 2 + Claude Code v1.0.81  
> **상태**: 12개 서버 설치 및 테스트 완료 ✅

## 📋 목차

1. [설치 개요](#설치-개요)
2. [시스템 요구사항](#시스템-요구사항)
3. [사전 준비](#사전-준비)
4. [단계별 설치 가이드](#단계별-설치-가이드)
5. [환경변수 설정](#환경변수-설정)
6. [MCP 설정 파일 생성](#mcp-설정-파일-생성)
7. [설치 검증](#설치-검증)
8. [환경별 최적화](#환경별-최적화)
9. [문제해결](#문제해결) (+ 🚀 자동 복구 스크립트 6종)
10. [사후 관리](#사후-관리)

---

## 🎯 설치 개요

**OpenManager VIBE v5**에서 사용하는 **12개 MCP 서버** 완전 설치 가이드입니다.

### 🎉 설치할 MCP 서버 목록

| 순번 | 서버명 | 유형 | 기능 | 설치 방식 |
|------|--------|------|------|-----------|
| 1 | `filesystem` | NPM | 파일 시스템 직접 조작 | npx |
| 2 | `memory` | NPM | 지식 그래프 관리 | npx |
| 3 | `github` | NPM | GitHub API 통합 | npx |
| 4 | `supabase` | NPM | PostgreSQL DB 관리 | npx |
| 5 | `gcp` | NPM | Google Cloud 관리 | npx |
| 6 | `tavily` | NPM | 웹 검색/크롤링 | npx |
| 7 | `playwright` | NPM | 브라우저 자동화 | npx |
| 8 | `thinking` | NPM | 순차적 사고 처리 | npx |
| 9 | `context7` | NPM | 라이브러리 문서 검색 | npx |
| 10 | `shadcn` | NPM | UI 컴포넌트 관리 | npx |
| 11 | `time` | UVX | 시간대 변환/관리 | uvx |
| 12 | `serena` | SSE | 코드 분석/리팩토링 | SSE 연결 |

**설치 예상 시간**: 15-30분 (환경에 따라 차이)  
**필요 디스크 공간**: ~500MB  
**인터넷 연결**: 필수

---

## 🖥️ 시스템 요구사항

### 🐧 WSL 2 (권장 환경)

**운영체제**:
- Windows 11 Pro/Home + WSL 2
- Ubuntu 22.04 LTS 이상 (WSL 내부)

**하드웨어**:
- RAM: 8GB 이상 (WSL에 4GB 이상 할당)
- 저장공간: 2GB 이상 여유 공간
- CPU: 멀티코어 권장

**소프트웨어**:
- Node.js: v18.0.0 이상 (v22.18.0 권장)
- Python: 3.8 이상
- Git: 2.40.0 이상
- curl, wget: 최신 버전

### 🍎 macOS

**운영체제**: macOS 12.0 (Monterey) 이상  
**하드웨어**: Apple Silicon (M1/M2/M3) 또는 Intel  
**소프트웨어**: Homebrew 권장

### 🪟 Windows (네이티브)

**운영체제**: Windows 10/11 (1903 이상)  
**소프트웨어**: PowerShell 7.0 이상

---

## 🛠️ 사전 준비

### 1. Node.js 설치 및 확인

#### WSL 2 환경

```bash
# Node.js 버전 확인
node --version
npm --version

# v18 미만인 경우 업그레이드
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

# 설치 확인
node --version  # v22.18.0 이상
npm --version   # 10.8.0 이상
```

#### macOS 환경

```bash
# Homebrew로 설치
brew install node@22

# 또는 nvm 사용
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 22
nvm use 22
```

#### Windows 환경

```powershell
# Chocolatey로 설치
choco install nodejs

# 또는 공식 사이트에서 다운로드
# https://nodejs.org/en/download/
```

### 2. Python UV 설치

**UV**는 Python MCP 서버(`time`, `serena`) 실행에 필요합니다.

```bash
# UV 설치 (모든 플랫폼 공통)
curl -LsSf https://astral.sh/uv/install.sh | sh

# 설치 확인
source ~/.bashrc  # 또는 ~/.zshrc
uvx --version     # 0.2.0 이상

# PATH 확인
echo $PATH | grep ".local/bin"  # /home/사용자명/.local/bin이 포함되어야 함
```

### 3. Git 및 기본 도구 설치

```bash
# WSL/Ubuntu
sudo apt update
sudo apt install -y git curl wget jq

# macOS
brew install git curl wget jq

# Windows
choco install git curl wget jq
```

### 4. Claude Code 설치 확인

```bash
# Claude Code 버전 확인
claude --version  # v1.0.81 이상

# 미설치 시 설치
npm install -g @anthropic-ai/claude-code
```

---

## 🚀 단계별 설치 가이드

### 1단계: NPM 기반 MCP 서버 설치 (10개)

**일괄 설치 명령어**:

```bash
# OpenManager VIBE v5 전용 MCP 서버 일괄 설치
npm install -g \
  @modelcontextprotocol/server-filesystem \
  @modelcontextprotocol/server-memory \
  @modelcontextprotocol/server-github \
  @supabase/mcp-server-supabase \
  google-cloud-mcp \
  tavily-mcp \
  @executeautomation/playwright-mcp-server \
  @modelcontextprotocol/server-sequential-thinking \
  @upstash/context7-mcp \
  @magnusrodseth/shadcn-mcp-server
```

**개별 설치 (문제 발생 시)**:

```bash
# 1. Filesystem MCP
npm install -g @modelcontextprotocol/server-filesystem

# 2. Memory MCP
npm install -g @modelcontextprotocol/server-memory

# 3. GitHub MCP
npm install -g @modelcontextprotocol/server-github

# 4. Supabase MCP
npm install -g @supabase/mcp-server-supabase

# 5. Google Cloud MCP
npm install -g google-cloud-mcp

# 6. Tavily MCP
npm install -g tavily-mcp

# 7. Playwright MCP
npm install -g @executeautomation/playwright-mcp-server

# 8. Thinking MCP
npm install -g @modelcontextprotocol/server-sequential-thinking

# 9. Context7 MCP
npm install -g @upstash/context7-mcp

# 10. ShadCN MCP
npm install -g @magnusrodseth/shadcn-mcp-server
```

### 2단계: Python 기반 MCP 서버 준비 (2개)

#### Time MCP 서버

```bash
# 설치 확인 (자동 설치됨)
uvx --help
which uvx  # /home/사용자명/.local/bin/uvx

# 테스트 실행 (선택사항)
uvx mcp-server-time --help
```

#### Serena MCP 서버 (SSE 방식)

```bash
# Serena SSE 모드 테스트
uvx --from git+https://github.com/oraios/serena serena-mcp-server --help

# 프로젝트 디렉토리에서 SSE 서버 시작 (나중에 설정)
cd /path/to/your/project
uvx --from git+https://github.com/oraios/serena serena-mcp-server \
  --transport sse \
  --port 9121 \
  --project .
```

### 3단계: Playwright 브라우저 의존성 설치

```bash
# Playwright 브라우저 설치
npx playwright install chromium firefox webkit

# WSL에서 추가 의존성 설치
sudo apt-get install -y \
  libnspr4 libnss3 libasound2t64 \
  libxss1 libgconf-2-4 libxtst6 \
  libxrandr2 libasound2 libpangocairo-1.0-0 \
  libatk1.0-0 libcairo-gobject2 libgtk-3-0 \
  libgdk-pixbuf2.0-0

# 설치 확인
npx playwright --version
```

### 4단계: GCP CLI 설정 (GCP MCP용)

```bash
# WSL에서 Google Cloud SDK 설치
curl https://packages.cloud.google.com/apt/doc/apt-key.gpg | sudo apt-key add -
echo "deb https://packages.cloud.google.com/apt cloud-sdk main" | sudo tee -a /etc/apt/sources.list.d/google-cloud-sdk.list
sudo apt-get update && sudo apt-get install google-cloud-cli

# 인증 설정
gcloud auth application-default login
gcloud config set project your-project-id

# WSL 브라우저 연동 (필수)
sudo apt install -y wslu
export BROWSER=wslview
```

---

## 🔑 환경변수 설정

### 필수 API 키 준비

다음 서비스들의 API 키를 미리 준비하세요:

| 서비스 | API 키 이름 | 발급 방법 |
|--------|-------------|-----------|
| GitHub | `GITHUB_PERSONAL_ACCESS_TOKEN` | [GitHub Settings → Developer settings → Personal access tokens](https://github.com/settings/tokens) |
| Supabase | `SUPABASE_ACCESS_TOKEN` | [Supabase Dashboard → Settings → API](https://supabase.com/dashboard) |
| Tavily | `TAVILY_API_KEY` | [Tavily API Console](https://tavily.com/) |
| Upstash Redis | `UPSTASH_REDIS_REST_URL`<br>`UPSTASH_REDIS_REST_TOKEN` | [Upstash Console](https://console.upstash.com/) |

### 환경변수 파일 생성

#### 프로젝트 루트에 `.env.local` 생성

```bash
# /path/to/your/project/.env.local
GITHUB_PERSONAL_ACCESS_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx
SUPABASE_PROJECT_ID=your-project-id
SUPABASE_ACCESS_TOKEN=sbp_xxxxxxxxxxxxxxxxxxxx
TAVILY_API_KEY=tvly-xxxxxxxxxxxxxxxxxxxx
UPSTASH_REDIS_REST_URL=https://xxxxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=AXXXXXXxxxxxxxxxxxxxxx
GCP_PROJECT_ID=your-gcp-project-id
```

#### 환경변수 로드

```bash
# 현재 세션에 환경변수 로드
source .env.local

# 또는 export 방식
export $(cat .env.local | grep -v '^#' | xargs)

# 확인
echo $GITHUB_PERSONAL_ACCESS_TOKEN
echo $SUPABASE_ACCESS_TOKEN
echo $TAVILY_API_KEY
```

#### 영구 설정 (선택사항)

```bash
# ~/.bashrc 또는 ~/.zshrc에 추가
echo 'source /path/to/your/project/.env.local' >> ~/.bashrc
source ~/.bashrc
```

---

## 📝 MCP 설정 파일 생성

### 프로젝트 루트에 `.mcp.json` 생성

완전한 12개 서버 설정:

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "/absolute/path/to/your/project"
      ]
    },
    "memory": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-memory"
      ]
    },
    "github": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-github"
      ],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_PERSONAL_ACCESS_TOKEN}"
      }
    },
    "supabase": {
      "command": "npx",
      "args": [
        "-y",
        "@supabase/mcp-server-supabase@latest",
        "--project-ref",
        "${SUPABASE_PROJECT_ID}"
      ],
      "env": {
        "SUPABASE_ACCESS_TOKEN": "${SUPABASE_ACCESS_TOKEN}"
      }
    },
    "gcp": {
      "command": "npx",
      "args": [
        "-y",
        "google-cloud-mcp"
      ],
      "env": {
        "GOOGLE_CLOUD_PROJECT": "${GCP_PROJECT_ID}",
        "PATH": "${PATH}:/home/사용자명/google-cloud-sdk/bin"
      }
    },
    "tavily": {
      "command": "npx",
      "args": [
        "-y",
        "tavily-mcp"
      ],
      "env": {
        "TAVILY_API_KEY": "${TAVILY_API_KEY}"
      }
    },
    "playwright": {
      "command": "npx",
      "args": [
        "-y",
        "@executeautomation/playwright-mcp-server"
      ]
    },
    "thinking": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-sequential-thinking"
      ]
    },
    "context7": {
      "command": "npx",
      "args": [
        "-y",
        "@upstash/context7-mcp"
      ],
      "env": {
        "UPSTASH_REDIS_REST_URL": "${UPSTASH_REDIS_REST_URL}",
        "UPSTASH_REDIS_REST_TOKEN": "${UPSTASH_REDIS_REST_TOKEN}"
      }
    },
    "shadcn": {
      "command": "npx",
      "args": [
        "-y",
        "@magnusrodseth/shadcn-mcp-server"
      ]
    },
    "time": {
      "command": "/home/사용자명/.local/bin/uvx",
      "args": [
        "mcp-server-time"
      ]
    },
    "serena": {
      "type": "sse",
      "url": "http://localhost:9121/sse"
    }
  }
}
```

### 🔧 설정 파일 수정 요점

1. **파일 경로**: `filesystem` 서버의 경로를 실제 프로젝트 절대 경로로 수정
2. **사용자명**: `time` 서버의 uvx 경로에서 사용자명 수정
3. **환경변수**: `${변수명}` 형식으로 참조 (실제 실행 시 확장됨)

### 자동 설정 스크립트 (선택사항)

```bash
# 자동 설정 스크립트 생성
cat > setup-mcp-config.sh << 'EOF'
#!/bin/bash

PROJECT_ROOT=$(pwd)
USER_HOME=$HOME
USERNAME=$(whoami)

echo "🔧 MCP 설정 파일 자동 생성"
echo "프로젝트 경로: $PROJECT_ROOT"
echo "사용자명: $USERNAME"

# .mcp.json 생성
cat > .mcp.json << EOL
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "$PROJECT_ROOT"]
    },
    "memory": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"]
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "\${GITHUB_PERSONAL_ACCESS_TOKEN}"
      }
    },
    "supabase": {
      "command": "npx",
      "args": ["-y", "@supabase/mcp-server-supabase@latest", "--project-ref", "\${SUPABASE_PROJECT_ID}"],
      "env": {
        "SUPABASE_ACCESS_TOKEN": "\${SUPABASE_ACCESS_TOKEN}"
      }
    },
    "gcp": {
      "command": "npx",
      "args": ["-y", "google-cloud-mcp"],
      "env": {
        "GOOGLE_CLOUD_PROJECT": "\${GCP_PROJECT_ID}",
        "PATH": "\${PATH}:$USER_HOME/google-cloud-sdk/bin"
      }
    },
    "tavily": {
      "command": "npx",
      "args": ["-y", "tavily-mcp"],
      "env": {
        "TAVILY_API_KEY": "\${TAVILY_API_KEY}"
      }
    },
    "playwright": {
      "command": "npx",
      "args": ["-y", "@executeautomation/playwright-mcp-server"]
    },
    "thinking": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"]
    },
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp"],
      "env": {
        "UPSTASH_REDIS_REST_URL": "\${UPSTASH_REDIS_REST_URL}",
        "UPSTASH_REDIS_REST_TOKEN": "\${UPSTASH_REDIS_REST_TOKEN}"
      }
    },
    "shadcn": {
      "command": "npx",
      "args": ["-y", "@magnusrodseth/shadcn-mcp-server"]
    },
    "time": {
      "command": "$USER_HOME/.local/bin/uvx",
      "args": ["mcp-server-time"]
    },
    "serena": {
      "type": "sse",
      "url": "http://localhost:9121/sse"
    }
  }
}
EOL

echo "✅ .mcp.json 생성 완료"
echo "📍 파일 위치: $PROJECT_ROOT/.mcp.json"

# JSON 형식 검증
if jq . .mcp.json > /dev/null 2>&1; then
    echo "✅ JSON 형식 유효"
else
    echo "❌ JSON 형식 오류"
    exit 1
fi

EOF

chmod +x setup-mcp-config.sh
./setup-mcp-config.sh
```

---

## ✅ 설치 검증

### 1단계: Serena SSE 서버 시작

```bash
# 터미널 1에서 Serena SSE 서버 시작
uvx --from git+https://github.com/oraios/serena serena-mcp-server \
  --transport sse \
  --port 9121 \
  --project $(pwd)

# 성공 메시지 확인 (예시)
# SSE endpoint available at: http://localhost:9121/sse
# MCP server with 25 tools ready
```

### 2단계: Claude Code에서 MCP 서버 확인

```bash
# 터미널 2에서 Claude Code 시작
claude

# Claude Code 내에서 MCP 상태 확인
/mcp

# 또는 bash에서 확인
claude mcp list
```

### 3단계: 기대 결과

**정상적인 출력 예시**:

```
✅ filesystem: Connected
✅ memory: Connected
✅ github: Connected  
✅ supabase: Connected
✅ gcp: Connected
✅ tavily: Connected
✅ playwright: Connected
✅ thinking: Connected
✅ context7: Connected
✅ shadcn: Connected
✅ time: Connected
✅ serena: Connected (SSE)

12/12 servers connected successfully
```

### 4단계: 개별 서버 기능 테스트

#### Filesystem 테스트

```typescript
// Claude Code에서 실행
await mcp__filesystem__list_directory({ path: '.' });
```

#### Memory 테스트

```typescript
await mcp__memory__create_entities({
  entities: [{
    name: 'InstallTest',
    entityType: 'Test',
    observations: ['MCP 설치 테스트 완료']
  }]
});
```

#### GitHub 테스트

```typescript
await mcp__github__search_repositories({
  query: 'test',
  perPage: 1
});
```

#### Supabase 테스트

```typescript
await mcp__supabase__list_tables();
```

#### Time 테스트

```typescript
await mcp__time__get_current_time({
  timezone: 'Asia/Seoul'
});
```

#### Serena 테스트

```typescript
await mcp__serena__list_dir({
  relative_path: '.',
  recursive: false
});
```

### 5단계: 종합 테스트 스크립트

```bash
# 종합 테스트 스크립트 생성
cat > test-all-mcp-servers.sh << 'EOF'
#!/bin/bash

echo "🧪 MCP 서버 종합 테스트 시작"
echo "============================="

# Claude Code 실행 확인
if ! command -v claude &> /dev/null; then
    echo "❌ Claude Code가 설치되지 않음"
    exit 1
fi

# MCP 서버 상태 확인
echo "📊 MCP 서버 상태 확인..."
claude_output=$(claude mcp list 2>/dev/null)

if echo "$claude_output" | grep -q "12.*connected"; then
    echo "✅ 12개 서버 모두 연결됨"
else
    echo "⚠️ 일부 서버 연결 실패"
    echo "$claude_output"
fi

# 환경변수 확인
echo ""
echo "🔐 환경변수 확인..."
env_vars=("GITHUB_PERSONAL_ACCESS_TOKEN" "SUPABASE_ACCESS_TOKEN" "TAVILY_API_KEY")

for var in "${env_vars[@]}"; do
    if [ -n "${!var}" ]; then
        echo "✅ $var 설정됨"
    else
        echo "❌ $var 누락"
    fi
done

# 필요한 명령어 확인
echo ""
echo "🛠️ 도구 확인..."
commands=("node" "npm" "uvx" "jq" "curl")

for cmd in "${commands[@]}"; do
    if command -v "$cmd" &> /dev/null; then
        echo "✅ $cmd: $(command -v $cmd)"
    else
        echo "❌ $cmd 누락"
    fi
done

# Serena SSE 서버 확인
echo ""
echo "🌐 Serena SSE 서버 확인..."
if curl -s http://localhost:9121/sse | head -1 | grep -q "data:"; then
    echo "✅ Serena SSE 서버 실행 중"
else
    echo "❌ Serena SSE 서버 다운"
    echo "🔧 수동 시작: uvx --from git+https://github.com/oraios/serena serena-mcp-server --transport sse --port 9121 --project ."
fi

echo ""
echo "🎯 테스트 완료!"
EOF

chmod +x test-all-mcp-servers.sh
./test-all-mcp-servers.sh
```

---

## 🎯 환경별 최적화

### WSL 2 최적화

#### 메모리 및 CPU 할당

```ini
# C:\Users\사용자명\.wslconfig
[wsl2]
memory=8GB
processors=4
swap=2GB
localhostForwarding=true
```

#### WSL 재시작

```powershell
# Windows PowerShell에서
wsl --shutdown
wsl
```

#### Node.js 성능 최적화

```bash
# WSL 내부에서
echo 'export NODE_OPTIONS="--max-old-space-size=4096"' >> ~/.bashrc
source ~/.bashrc
```

### macOS 최적화

#### Homebrew 최적화

```bash
# Homebrew 업데이트
brew update && brew upgrade

# Node.js 최적화
echo 'export NODE_OPTIONS="--max-old-space-size=4096"' >> ~/.zshrc
source ~/.zshrc
```

### Windows 최적화

#### PowerShell 최적화

```powershell
# PowerShell 실행 정책 설정
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Node.js 메모리 최적화
$env:NODE_OPTIONS="--max-old-space-size=4096"
```

---

## 🚨 문제해결

### 자주 발생하는 문제

#### 1. "No MCP servers configured" 오류

**증상**: Claude Code에서 MCP 서버를 인식하지 못함

**해결책**:

```bash
# 1. 설정 파일 위치 확인
ls -la .mcp.json

# 2. JSON 형식 검증
cat .mcp.json | jq .

# 3. Claude Code 재시작
claude --reload
```

#### 2. 환경변수 로드 실패

**증상**: API 키가 필요한 서버들의 인증 실패

**해결책**:

```bash
# 1. 환경변수 확인
echo $GITHUB_PERSONAL_ACCESS_TOKEN
echo $SUPABASE_ACCESS_TOKEN
echo $TAVILY_API_KEY

# 2. 환경변수 재로드
source .env.local

# 3. 수동 설정
export GITHUB_PERSONAL_ACCESS_TOKEN="your-token-here"
export SUPABASE_ACCESS_TOKEN="your-token-here"
export TAVILY_API_KEY="your-key-here"
```

#### 3. Serena SSE 연결 실패

**증상**: Serena MCP 서버 연결 타임아웃

**해결책**:

```bash
# 1. SSE 서버 수동 시작
uvx --from git+https://github.com/oraios/serena serena-mcp-server \
  --transport sse \
  --port 9121 \
  --project $(pwd)

# 2. 포트 사용 확인
lsof -i :9121

# 3. 연결 테스트
curl -s http://localhost:9121/sse | head -3
```

#### 4. Playwright 브라우저 실행 실패

**증상**: Playwright MCP 서버에서 브라우저 실행 오류

**해결책**:

```bash
# WSL에서 추가 의존성 설치
sudo apt-get update
sudo apt-get install -y \
  libnspr4 libnss3 libasound2t64 \
  libxss1 libgconf-2-4 libxtst6 \
  libxrandr2 libasound2 libpangocairo-1.0-0 \
  libatk1.0-0 libcairo-gobject2 libgtk-3-0 \
  libgdk-pixbuf2.0-0

# Playwright 브라우저 재설치
npx playwright install --with-deps
```

#### 5. GCP 인증 실패

**증상**: GCP MCP 서버 인증 오류

**해결책**:

```bash
# 1. Google Cloud SDK 인증
gcloud auth application-default login

# 2. 프로젝트 설정
gcloud config set project your-project-id

# 3. WSL 브라우저 연동
sudo apt install -y wslu
export BROWSER=wslview
```

#### 6. NPM 글로벌 패키지 권한 오류

**증상**: npm install -g 시 권한 오류

**해결책**:

```bash
# 1. npm 글로벌 디렉토리 변경
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc

# 2. 패키지 재설치
npm install -g @modelcontextprotocol/server-filesystem
```

### 환경변수 경고 메시지 이해

**현상**: `.mcp.json`에서 `${환경변수명}` 참조 시 "Missing environment variables" 경고 표시

**중요**: 이 경고는 **정상적인 동작**입니다! 🎯

**원인**: Claude Code가 설정 파일을 검증하는 시점에서는 환경변수 참조를 인식하지 못하지만, 실제 MCP 서버 실행 시에는 올바르게 환경변수가 확장됩니다.

**확인 방법**: MCP 서버가 실제로 연결되는지 확인

```bash
# 모든 서버가 ✓ Connected로 표시되면 정상 작동
claude mcp list
```

### 성능 최적화

#### MCP 서버 시작 시간 최적화

```bash
# 1. NPM 캐시 최적화
npm cache clean --force
npm cache verify

# 2. uvx 캐시 활용
uvx --help  # 첫 실행 시 캐시 생성

# 3. Serena 캐시 생성 (첫 실행)
uvx --from git+https://github.com/oraios/serena serena-mcp-server --help
```

#### 동시 실행 서버 수 제한

```bash
# 메모리 부족 시 일부 서버만 활성화
# .mcp.json에서 불필요한 서버 주석 처리

# 필수 서버만 (예시)
# filesystem, memory, github, supabase만 활성화
```

### 🚀 자동 복구 스크립트 활용

**OpenManager VIBE v5**에는 MCP 관련 문제를 자동으로 해결하는 **6개의 전문 복구 스크립트**가 포함되어 있습니다.

#### 📦 복구 스크립트 개요

| 스크립트 | 기능 | 사용 시점 | 실행 시간 |
|----------|------|-----------|-----------|
| **🏆 mcp-master-recovery.sh** | 원클릭 통합 복구 | **모든 MCP 문제** | 5-15분 |
| **🔧 mcp-recovery-complete.sh** | 종합 MCP 복구 | 서버 연결 실패 | 3-10분 |
| **🔐 mcp-env-recovery.sh** | 환경변수 복구 | 인증 실패 | 1-3분 |
| **🤖 serena-auto-recovery.sh** | Serena SSE 복구 | Serena 타임아웃 | 1-2분 |
| **📦 mcp-dependencies-installer.sh** | 의존성 재설치 | 패키지 오류 | 5-10분 |
| **💾 mcp-config-backup.sh** | 설정 백업/복구 | 설정 손상 | 1-2분 |

#### 🏆 마스터 복구 스크립트 (권장)

**가장 강력한 원클릭 해결책** - 모든 MCP 문제를 자동 진단하고 최적 복구 전략을 선택합니다.

```bash
# 🚀 원클릭 완전 복구 (가장 추천)
./scripts/mcp-master-recovery.sh

# 🔍 진단만 실행 (복구 없이)
./scripts/mcp-master-recovery.sh --diagnose-only

# 🔧 대화형 복구 (단계별 확인)
./scripts/mcp-master-recovery.sh --interactive

# 📊 상세 로그와 함께 실행
./scripts/mcp-master-recovery.sh --verbose
```

**특징**:
- ✅ **AI 기반 지능형 진단**: 5가지 문제 유형 자동 감지
- ✅ **단계별 복구**: 백업 → 진단 → 복구 → 검증
- ✅ **롤백 지원**: 문제 발생 시 자동 원복
- ✅ **5개 서브시스템 통합**: 모든 복구 도구 오케스트레이션

#### 🎯 시나리오별 복구 가이드

##### 1. **"모든 MCP 서버가 연결되지 않음" 문제**

```bash
# 🏆 마스터 복구 (추천)
./scripts/mcp-master-recovery.sh

# 또는 개별 복구
./scripts/mcp-recovery-complete.sh --auto
```

##### 2. **"환경변수 인증 실패" 문제**

```bash
# 🔐 기존 암호화 시스템 활용 (우선 권장)
./scripts/mcp-env-recovery.sh --auto

# 🔧 대화형 환경변수 설정
./scripts/mcp-env-recovery.sh --interactive

# 🧪 연결 테스트만 실행
./scripts/mcp-env-recovery.sh --test
```

##### 3. **"Serena MCP 타임아웃" 문제**

```bash
# 🤖 Serena SSE 자동 복구
./scripts/serena-auto-recovery.sh

# 🔍 Serena 상태 확인
./scripts/serena-auto-recovery.sh --status

# 🛠️ SSE 서버 수동 재시작
./scripts/serena-auto-recovery.sh --restart
```

##### 4. **"의존성 패키지 오류" 문제**

```bash
# 📦 모든 의존성 재설치 (병렬 처리)
./scripts/mcp-dependencies-installer.sh --reinstall

# 🔍 설치 상태만 확인
./scripts/mcp-dependencies-installer.sh --check

# ⚡ 빠른 설치 (필수만)
./scripts/mcp-dependencies-installer.sh --essential-only
```

##### 5. **"설정 파일 손상" 문제**

```bash
# 💾 설정 파일 백업 생성
./scripts/mcp-config-backup.sh --backup

# 🔄 최신 백업으로 복구
./scripts/mcp-config-backup.sh --restore

# 📋 백업 목록 확인
./scripts/mcp-config-backup.sh --list
```

#### 🔧 고급 복구 옵션

##### 완전 초기화 (주의!)

```bash
# ⚠️ 주의: 모든 MCP 설정을 초기화하고 재설치
./scripts/mcp-master-recovery.sh --full-reset

# 확인 메시지
echo "⚠️ 이 작업은 다음을 수행합니다:"
echo "  1. 모든 MCP 서버 설정 초기화"
echo "  2. 의존성 패키지 완전 재설치" 
echo "  3. 환경변수 재설정"
echo "  4. Claude Code 재시작"
```

##### 로그 및 진단 정보

```bash
# 📊 복구 로그 확인
ls -la ./logs/mcp-master-recovery-*.log

# 🔍 상세 진단 리포트
./scripts/mcp-master-recovery.sh --generate-report

# 🧹 로그 정리 (30일 이상)
find ./logs/ -name "mcp-*.log" -mtime +30 -delete
```

#### 💡 복구 스크립트 활용 팁

1. **🚀 일반적인 문제**: `mcp-master-recovery.sh` 먼저 실행
2. **🔐 환경변수 문제**: 기존 암호화 시스템(`scripts/core/env-manager.mjs`) 우선 활용
3. **⚡ 빠른 해결**: 각 스크립트의 `--auto` 옵션 사용
4. **🛡️ 안전한 복구**: 먼저 `--backup` 실행 후 복구 진행
5. **📊 문제 분석**: `--verbose` 옵션으로 상세 로그 확인

#### ⚠️ 주의사항

- **백업 권장**: 복구 실행 전 설정 백업 생성
- **네트워크 연결**: 의존성 설치를 위해 인터넷 연결 필요
- **권한 확인**: 일부 스크립트는 sudo 권한 필요할 수 있음
- **Claude Code 재시작**: 복구 완료 후 Claude Code 재시작 권장

---

## 🔧 사후 관리

### 일일 점검

```bash
# MCP 서버 상태 확인
claude mcp list

# Serena SSE 서버 상태
curl -s http://localhost:9121/sse | head -1

# 환경변수 확인
env | grep -E "(GITHUB|SUPABASE|TAVILY|UPSTASH)"
```

### 주간 유지보수

```bash
# NPM 패키지 업데이트
npm update -g @modelcontextprotocol/server-filesystem
npm update -g @supabase/mcp-server-supabase
npm update -g google-cloud-mcp

# uvx 캐시 정리
uvx cache clean

# Claude Code 업데이트
npm update -g @anthropic-ai/claude-code
```

### 로그 관리

```bash
# MCP 로그 위치 확인
ls -la ~/.claude/logs/

# 로그 정리 (30일 이상)
find ~/.claude/logs/ -name "*.log" -mtime +30 -delete

# Serena 로그 확인
tail -f /tmp/serena-*.log
```

### 백업 및 복원

```bash
# 설정 백업
cp .mcp.json .mcp.json.backup
cp .env.local .env.local.backup

# 전체 환경 백업 스크립트
cat > backup-mcp-env.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="mcp-backup-$(date +%Y%m%d)"
mkdir -p "$BACKUP_DIR"

# 설정 파일 백업
cp .mcp.json "$BACKUP_DIR/"
cp .env.local "$BACKUP_DIR/" 2>/dev/null || true

# 설치된 패키지 목록
npm list -g --depth=0 > "$BACKUP_DIR/npm-global-packages.txt"
uvx list > "$BACKUP_DIR/uvx-packages.txt" 2>/dev/null || true

# 환경변수
env | grep -E "(GITHUB|SUPABASE|TAVILY|UPSTASH|GCP)" > "$BACKUP_DIR/environment.txt"

echo "✅ 백업 완료: $BACKUP_DIR"
EOF

chmod +x backup-mcp-env.sh
```

---

## 🎉 설치 완료

축하합니다! **12개 MCP 서버 설치가 완료**되었습니다.

### 다음 단계

1. **[MCP 활용 가이드](../MCP-GUIDE.md)** 참조하여 실제 사용법 학습
2. **[고급 활용 가이드](mcp-tools-reference.md)** 참조하여 전문 기능 활용
3. **[성능 최적화](../performance/performance-optimization-complete-guide.md)** 적용

### 문제 발생 시

1. **[문제해결 가이드](../TROUBLESHOOTING.md)** 참조
2. **Claude Code 커뮤니티** 질문
3. **GitHub Issues** 제보

**최종 검증**: 2025년 8월 17일 KST  
**테스트 환경**: WSL 2 + Ubuntu 24.04 LTS + Claude Code v1.0.81  
**상태**: 12개 서버 100% 정상 설치 및 동작 확인 ✅

---

**🚀 OpenManager VIBE v5에서 MCP의 모든 기능을 활용해보세요!**