# 🐧 WSL MCP 완전 설정 가이드

> **통합 완료**: WSL 환경 특화 + Claude Code MCP 설정 통합  
> **대상 환경**: WSL 2 (Ubuntu 24.04 LTS) + Claude Code v1.0.81+  
> **업데이트**: 2025년 8월 16일

## 📋 목차

1. [WSL MCP 개요](#wsl-mcp-개요)
2. [환경 준비](#환경-준비)
3. [환경변수 설정](#환경변수-설정)
4. [MCP 서버 설정](#mcp-서버-설정)
5. [실전 설정 예시](#실전-설정-예시)
6. [문제 해결](#문제-해결)
7. [성능 최적화](#성능-최적화)

## 🎯 WSL MCP 개요

### WSL에서 MCP를 사용하는 이유

- **네이티브 Linux 환경**: 더 안정적인 Node.js/Python 패키지 관리
- **환경변수 격리**: Windows와 독립적인 보안 환경
- **개발 도구 통합**: Linux 기반 개발 도구와 완벽 호환
- **성능 최적화**: WSL 2의 향상된 성능으로 빠른 MCP 응답

### Claude Code와 WSL 통합 장점

```
Windows Host
    ↓ (경량 통신)
WSL 2 Ubuntu
    ├── Claude Code (Native)
    ├── MCP Servers (11개)
    ├── Node.js/Python 환경
    └── 프로젝트 파일들
```

## ⚙️ 환경 준비

### 1. WSL 기본 설정 확인

```bash
# WSL 버전 확인
wsl --version
# WSL 2 사용 권장

# Ubuntu 버전 확인
lsb_release -a
# Ubuntu 24.04 LTS 권장

# 기본 패키지 업데이트
sudo apt update && sudo apt upgrade -y
```

### 2. Node.js 환경 설정

```bash
# Node.js v22+ 설치 (권장)
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

# 버전 확인
node --version  # v22.18.0+
npm --version   # 10.0.0+

# 글로벌 패키지 권한 설정
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
```

### 3. Python 환경 설정 (UV 권장)

```bash
# UV 설치 (Python 패키지 관리)
curl -LsSf https://astral.sh/uv/install.sh | sh
source ~/.bashrc

# 버전 확인
uvx --version  # 0.8.8+

# UV 권한 설정
sudo chown -R $USER:$USER ~/.local/share/uv
```

### 4. Claude Code 설치

```bash
# Claude Code WSL 설치
npm install -g @anthropic-ai/claude-code

# 설치 확인
claude --version  # v1.0.81+
claude help

# WSL 환경 최적화
claude configure --environment wsl
```

## 🔐 환경변수 설정

### WSL 환경변수 문제점과 해결

**문제**: Windows 환경변수가 WSL에서 자동으로 사용되지 않음  
**해결**: WSL 내부에서 독립적인 환경변수 설정

### 1. 영구 환경변수 설정 (권장)

```bash
# ~/.bashrc 편집
nano ~/.bashrc

# 파일 끝에 MCP 환경변수 추가
export GITHUB_PERSONAL_ACCESS_TOKEN="ghp_your_actual_token"
export SUPABASE_PROJECT_ID="vnswjnltnhpsueosfhmw"
export SUPABASE_ACCESS_TOKEN="sbp_your_actual_token"
export TAVILY_API_KEY="tvly-your_actual_key"
export UPSTASH_REDIS_REST_URL="https://your-redis.upstash.io"
export UPSTASH_REDIS_REST_TOKEN="your_actual_token"
export GOOGLE_AI_API_KEY="AIzaSyABC...DEF123"

# 변경사항 적용
source ~/.bashrc

# 설정 확인
env | grep -E "(GITHUB|SUPABASE|TAVILY|UPSTASH|GOOGLE)"
```

### 2. 보안 강화 설정

```bash
# .bashrc 파일 권한 보안 설정
chmod 600 ~/.bashrc

# 환경변수 파일 분리 (선택사항)
touch ~/.env.mcp
chmod 600 ~/.env.mcp

# .env.mcp 파일에 환경변수 작성
echo 'export GITHUB_PERSONAL_ACCESS_TOKEN="ghp_token"' >> ~/.env.mcp
echo 'export SUPABASE_ACCESS_TOKEN="sbp_token"' >> ~/.env.mcp

# .bashrc에서 로드
echo 'source ~/.env.mcp' >> ~/.bashrc
source ~/.bashrc
```

### 3. 프로젝트별 환경변수

```bash
# 프로젝트 디렉토리에서 .env 파일 생성
cd /mnt/d/cursor/openmanager-vibe-v5
touch .env.local
chmod 600 .env.local

# Claude Code가 자동으로 .env 파일 인식
# 프로젝트 스코프 MCP 설정 시 자동 적용
```

## 🔧 MCP 서버 설정

### 설정 방식 이해

#### 스코프 옵션

```bash
# 프로젝트별 설정 (권장)
claude mcp add --scope project server_name -- command

# 사용자 전체 설정
claude mcp add --scope user server_name -- command

# 로컬 임시 설정
claude mcp add --scope local server_name -- command
```

#### 명령어 형식

```bash
# 기본 형식
claude mcp add <name> [옵션] -- <실행명령어>

# 환경변수 포함
claude mcp add <name> --env KEY=value -- <실행명령어>

# JSON 설정 (복잡한 설정용)
claude mcp add-json <name> '{"command":"cmd","args":["arg1","arg2"]}'
```

### WSL 최적화 명령어

#### NPX 기반 서버 (JavaScript)

```bash
# Filesystem (프로젝트 파일 접근)
claude mcp add filesystem --scope project -- npx -y @modelcontextprotocol/server-filesystem /mnt/d/cursor/openmanager-vibe-v5

# Memory (지식 그래프)
claude mcp add memory --scope project -- npx -y @modelcontextprotocol/server-memory

# GitHub (저장소 관리)
claude mcp add github --scope project --env GITHUB_PERSONAL_ACCESS_TOKEN="$GITHUB_PERSONAL_ACCESS_TOKEN" -- npx -y @modelcontextprotocol/server-github

# Playwright (브라우저 자동화)
claude mcp add playwright --scope project -- npx -y @modelcontextprotocol/server-playwright

# Supabase (데이터베이스)
claude mcp add supabase --scope project --env SUPABASE_ACCESS_TOKEN="$SUPABASE_ACCESS_TOKEN" -- npx -y @supabase/mcp-server-supabase@latest --project-ref "$SUPABASE_PROJECT_ID"
```

#### UVX 기반 서버 (Python)

```bash
# Sequential Thinking (복잡한 추론)
claude mcp add sequential-thinking --scope project -- uvx mcp-server-sequential-thinking

# Serena (코드 분석) - JSON 방식 권장
claude mcp add-json "serena" '{"command":"uvx","args":["--from","git+https://github.com/oraios/serena","serena-mcp-server"]}'
```

#### 전용 서버들

```bash
# Time (시간 변환)
claude mcp add time --scope project -- npx -y @modelcontextprotocol/server-time

# Shadcn-UI (UI 컴포넌트)
claude mcp add shadcn-ui --scope project -- npx -y @modelcontextprotocol/server-shadcn-ui

# Context7 (문서 검색)
claude mcp add context7 --scope project -- npx -y @context7/mcp-server

# Tavily (웹 검색) - Remote 방식 권장
claude mcp add tavily-mcp --scope project --env TAVILY_API_KEY="$TAVILY_API_KEY" -- npx -y mcp-remote https://mcp.tavily.com/mcp/

# GCP (클라우드 리소스)
claude mcp add gcp --scope project --env GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account.json" -- npx -y @google-cloud/mcp-server
```

## 💡 실전 설정 예시

### 전체 MCP 서버 일괄 설정 스크립트

```bash
#!/bin/bash
# setup-mcp-wsl.sh

echo "🚀 WSL에서 MCP 서버 설정 시작..."

# 환경변수 확인
check_env() {
    local var_name=$1
    if [ -z "${!var_name}" ]; then
        echo "❌ $var_name 환경변수가 설정되지 않았습니다."
        return 1
    else
        echo "✅ $var_name 환경변수 확인됨"
        return 0
    fi
}

# 필수 환경변수 확인
echo "📋 환경변수 확인 중..."
check_env "GITHUB_PERSONAL_ACCESS_TOKEN"
check_env "SUPABASE_ACCESS_TOKEN"
check_env "SUPABASE_PROJECT_ID"
check_env "TAVILY_API_KEY"

# 기존 MCP 서버 제거 (클린 설치)
echo "🧹 기존 MCP 서버 정리 중..."
claude mcp list 2>/dev/null | grep -E "^[a-zA-Z]" | while read server; do
    claude mcp remove "$server" 2>/dev/null || true
done

# 프로젝트 경로 설정
PROJECT_PATH="/mnt/d/cursor/openmanager-vibe-v5"

echo "📦 MCP 서버 설치 중..."

# 1. Filesystem (필수)
echo "📁 Filesystem MCP 설정..."
claude mcp add filesystem --scope project -- npx -y @modelcontextprotocol/server-filesystem "$PROJECT_PATH"

# 2. Memory (필수)
echo "🧠 Memory MCP 설정..."
claude mcp add memory --scope project -- npx -y @modelcontextprotocol/server-memory

# 3. GitHub (필수)
echo "🐙 GitHub MCP 설정..."
claude mcp add github --scope project --env GITHUB_PERSONAL_ACCESS_TOKEN="$GITHUB_PERSONAL_ACCESS_TOKEN" -- npx -y @modelcontextprotocol/server-github

# 4. Supabase (데이터베이스)
echo "🗄️ Supabase MCP 설정..."
claude mcp add supabase --scope project --env SUPABASE_ACCESS_TOKEN="$SUPABASE_ACCESS_TOKEN" -- npx -y @supabase/mcp-server-supabase@latest --project-ref "$SUPABASE_PROJECT_ID"

# 5. Playwright (브라우저 자동화)
echo "🎭 Playwright MCP 설정..."
claude mcp add playwright --scope project -- npx -y @modelcontextprotocol/server-playwright

# 6. Sequential Thinking (추론)
echo "🤔 Sequential Thinking MCP 설정..."
claude mcp add sequential-thinking --scope project -- uvx mcp-server-sequential-thinking

# 7. Time (시간 관리)
echo "⏰ Time MCP 설정..."
claude mcp add time --scope project -- npx -y @modelcontextprotocol/server-time

# 8. Shadcn-UI (UI 컴포넌트)
echo "🎨 Shadcn-UI MCP 설정..."
claude mcp add shadcn-ui --scope project -- npx -y @modelcontextprotocol/server-shadcn-ui

# 9. Context7 (문서 검색)
echo "📚 Context7 MCP 설정..."
claude mcp add context7 --scope project -- npx -y @context7/mcp-server

# 10. Tavily (웹 검색)
echo "🔍 Tavily MCP 설정..."
claude mcp add tavily-mcp --scope project --env TAVILY_API_KEY="$TAVILY_API_KEY" -- npx -y mcp-remote https://mcp.tavily.com/mcp/

# 11. Serena (코드 분석)
echo "🔬 Serena MCP 설정..."
claude mcp add-json "serena" '{"command":"uvx","args":["--from","git+https://github.com/oraios/serena","serena-mcp-server"]}'

echo "✅ MCP 서버 설정 완료!"

# 설정 확인
echo "📋 설정된 MCP 서버 목록:"
claude mcp list

echo "🎉 WSL MCP 설정이 완료되었습니다!"
```

### 스크립트 실행

```bash
# 스크립트 실행 권한 부여
chmod +x setup-mcp-wsl.sh

# 스크립트 실행
./setup-mcp-wsl.sh
```

## 🚨 문제 해결

### 일반적인 문제들

#### 1. 환경변수 인식 문제

**증상**: MCP 서버는 연결되지만 API 키 오류 발생

**해결법**:

```bash
# 환경변수 다시 로드
source ~/.bashrc

# Claude Code 재시작
claude logout
claude login

# 환경변수 직접 확인
echo $GITHUB_PERSONAL_ACCESS_TOKEN | head -c 20  # 앞 20자리만 확인
```

#### 2. NPX 패키지 권한 문제

**증상**: `EACCES: permission denied` 오류

**해결법**:

```bash
# NPM 글로벌 디렉토리 권한 수정
sudo chown -R $USER:$USER ~/.npm-global
sudo chown -R $USER:$USER ~/.npm

# NPX 캐시 클리어
npx clear-npx-cache
```

#### 3. UV 관련 문제

**증상**: `uvx: command not found`

**해결법**:

```bash
# UV 재설치
curl -LsSf https://astral.sh/uv/install.sh | sh
source ~/.bashrc

# PATH 확인
echo $PATH | grep -o "[^:]*uv[^:]*"

# 수동 PATH 추가 (필요시)
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

#### 4. MCP 서버 연결 실패

**증상**: `Status: ✗ Failed to connect`

**해결법**:

```bash
# 개별 서버 제거 후 재설정
claude mcp remove problematic-server
claude mcp add problematic-server --scope project -- correct-command

# 로그 확인 (가능한 경우)
claude mcp logs problematic-server

# 수동 실행 테스트
npx -y @modelcontextprotocol/server-filesystem --help
```

### 디버깅 명령어

```bash
# MCP 서버 상태 확인
claude mcp list

# 개별 서버 상세 확인
claude mcp get server-name

# 환경변수 확인
env | grep -E "(GITHUB|SUPABASE|TAVILY)"

# Node.js/Python 환경 확인
which node && node --version
which uvx && uvx --version

# 네트워크 연결 확인
curl -I https://registry.npmjs.org/
ping pypi.org
```

## ⚡ 성능 최적화

### 1. WSL 리소스 최적화

```bash
# WSL 메모리 최적화 (Windows PowerShell에서)
# C:\Users\$USER\.wslconfig 파일 생성
[wsl2]
memory=10GB
processors=8
swap=8GB
localhostForwarding=true
```

### 2. MCP 서버 캐싱

```bash
# NPX 캐시 최적화
npm config set cache ~/.npm-cache --global
npm config set prefer-online true --global

# UV 캐시 최적화
export UV_CACHE_DIR=~/.cache/uv
```

### 3. 네트워크 최적화

```bash
# DNS 최적화
echo "nameserver 8.8.8.8" | sudo tee -a /etc/resolv.conf
echo "nameserver 1.1.1.1" | sudo tee -a /etc/resolv.conf

# 네트워크 프로파일 최적화
sudo sysctl -w net.core.rmem_default=262144
sudo sysctl -w net.core.rmem_max=16777216
```

### 4. 자동 업데이트 스크립트

```bash
#!/bin/bash
# update-mcp-servers.sh

echo "🔄 MCP 서버 업데이트 중..."

# NPX 기반 서버 업데이트
for server in filesystem memory github playwright time shadcn-ui context7; do
    echo "📦 $server 업데이트 중..."
    claude mcp remove "$server" 2>/dev/null || true
    # 각 서버별 최신 설정으로 재설치
done

# UV 기반 서버 업데이트
uvx --upgrade mcp-server-sequential-thinking

echo "✅ MCP 서버 업데이트 완료!"
claude mcp list
```

## 📊 모니터링 및 관리

### MCP 서버 상태 모니터링

```bash
#!/bin/bash
# mcp-health-check.sh

echo "🏥 MCP 서버 헬스체크..."

# 각 서버 상태 확인
claude mcp list | while IFS= read -r line; do
    if [[ $line =~ ^[[:space:]]*([^[:space:]]+)[[:space:]]+([^[:space:]]+) ]]; then
        server="${BASH_REMATCH[1]}"
        status="${BASH_REMATCH[2]}"

        if [[ $status == "✓" ]]; then
            echo "✅ $server: 정상"
        else
            echo "❌ $server: 문제 발생"
            # 자동 복구 시도
            echo "🔧 $server 복구 시도 중..."
            claude mcp remove "$server" 2>/dev/null
            # 복구 로직 추가 필요
        fi
    fi
done
```

---

## 💡 WSL MCP 모범 사례

### 권장 사항

1. **환경변수 관리**: ~/.env.mcp 파일로 분리하여 보안 강화
2. **스코프 설정**: 프로젝트별 설정으로 격리 유지
3. **정기 업데이트**: 월 1회 MCP 서버 업데이트
4. **백업**: MCP 설정 백업 스크립트 활용
5. **모니터링**: 정기적인 헬스체크 수행

### 피해야 할 것들

1. ❌ Windows 환경변수에 의존
2. ❌ 글로벌 스코프 남용
3. ❌ 환경변수 평문 저장 (권한 설정 무시)
4. ❌ 네트워크 연결 없이 원격 MCP 설정
5. ❌ 오래된 버전의 MCP 서버 사용

이 가이드를 통해 WSL 환경에서 Claude Code MCP를 완벽하게 설정하고 활용할 수 있습니다. 문제가 발생하면 단계별로 확인하여 해결하세요.
