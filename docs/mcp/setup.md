---
id: mcp-setup
title: "MCP 설치 가이드"
keywords: ["mcp", "installation", "setup", "environment"]
priority: high
ai_optimized: true
updated: "2025-09-09"
---

# 🔧 MCP 설치 가이드

**8개 서버 빠른 설치**: WSL 2 + Node.js 22 + uvx

## ⚡ 빠른 설치

### 1. 의존성 설치
```bash
# Node.js 22.x 설치
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

# UV Python 도구 설치
curl -LsSf https://astral.sh/uv/install.sh | sh
source ~/.bashrc
```

### 2. MCP 서버 설치 (NPM)
```bash
# 6개 NPM 서버 일괄 설치
npm install -g \
  @modelcontextprotocol/server-memory \
  @supabase/mcp-server-supabase \
  @executeautomation/playwright-mcp-server \
  @modelcontextprotocol/server-sequential-thinking \
  @upstash/context7-mcp \
  @magnusrodseth/shadcn-mcp-server

# Playwright 브라우저 설치
npx playwright install chromium
```

### 3. 환경변수 설정
```bash
# .env.local 생성
cat > .env.local << EOF
SUPABASE_PROJECT_ID=your-project-id
SUPABASE_ACCESS_TOKEN=sbp_xxxxxxxxxxxxxxxxxxxx
UPSTASH_REDIS_REST_URL=https://xxxxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=AXXXXXXxxxxxxxxxxxxxxx
EOF

# 환경변수 로드
source .env.local
```

### 4. MCP 설정 파일 생성
```bash
# .mcp.json 자동 생성
cat > .mcp.json << 'EOF'
{
  "mcpServers": {
    "memory": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"]
    },
    "supabase": {
      "command": "npx", 
      "args": ["-y", "@supabase/mcp-server-supabase", "--project-ref", "${SUPABASE_PROJECT_ID}"],
      "env": { "SUPABASE_ACCESS_TOKEN": "${SUPABASE_ACCESS_TOKEN}" }
    },
    "playwright": {
      "command": "npx",
      "args": ["-y", "@executeautomation/playwright-mcp-server"]
    },
    "time": {
      "command": "/home/$USER/.local/bin/uvx",
      "args": ["mcp-server-time"]
    },
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp"],
      "env": {
        "UPSTASH_REDIS_REST_URL": "${UPSTASH_REDIS_REST_URL}",
        "UPSTASH_REDIS_REST_TOKEN": "${UPSTASH_REDIS_REST_TOKEN}"
      }
    },
    "serena": {
      "command": "/home/$USER/.local/bin/uvx",
      "args": ["--from", "git+https://github.com/oraios/serena", "serena-mcp-server"],
      "env": { "PYTHONUNBUFFERED": "1", "NO_COLOR": "1" }
    },
    "sequential-thinking": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"]
    },
    "shadcn-ui": {
      "command": "npx", 
      "args": ["-y", "@magnusrodseth/shadcn-mcp-server"]
    }
  }
}
EOF
```

### 5. 설치 검증
```bash
# Claude Code에서 확인
claude mcp list

# 기대 결과: 8/8 servers connected ✅
```

## 🛠️ 환경별 설치

### WSL 2 (권장)
```bash
# WSL Ubuntu 22.04 LTS
# 메모리: 8GB+ 권장
# 스왑: 4GB 설정

# 추가 의존성
sudo apt install -y curl wget jq git
```

### macOS
```bash  
# Homebrew 설치
brew install node@22 curl wget jq

# UV 설치
curl -LsSf https://astral.sh/uv/install.sh | sh
```

### Windows (네이티브)
```powershell
# Chocolatey로 설치
choco install nodejs python3

# UV 설치 (PowerShell)
powershell -c "irm https://astral.sh/uv/install.ps1 | iex"
```

## 🔐 API 키 설정

### Supabase
1. [Supabase Dashboard](https://supabase.com/dashboard) 접속
2. Settings → API → Service Role Key 복사
3. Project ID 확인

### Upstash Redis (Context7)
1. [Upstash Console](https://console.upstash.com/) 접속  
2. Redis → Create Database → Copy URL/Token
3. 무료 티어: 10K 요청/일

## ⚠️ 문제 해결

### 연결 실패
```bash
# 환경변수 확인
env | grep -E "(SUPABASE|UPSTASH)"

# Claude Code 재시작
pkill -f claude && claude
```

### Serena 타임아웃
```bash
# uvx 경로 확인
which uvx  # /home/$USER/.local/bin/uvx

# 프로젝트 활성화 필수
await mcp__serena__activate_project({ project: 'your-project-name' });
```

### Playwright 브라우저 에러
```bash
# 브라우저 재설치
npx playwright install --with-deps chromium

# WSL 의존성
sudo apt install -y libgconf-2-4 libxss1
```

## 🚀 최적화

### 서버 선택적 활성화
```json
// 필수 서버만 (.mcp.json)
{
  "mcpServers": {
    "memory": { /* 지식 관리 - 필수 */ },
    "supabase": { /* 데이터베이스 - 필수 */ },
    "time": { /* 시간 처리 - 자주 사용 */ }
    // 나머지는 필요시에만 주석 해제
  }
}
```

### 캐시 최적화
```bash
# NPM 캐시 정리
npm cache clean --force

# uvx 캐시 활용  
uvx --help  # 첫 실행시 캐시 생성
```

### 메모리 관리
```bash
# WSL 메모리 설정 (.wslconfig)
[wsl2]
memory=8GB
processors=4
swap=2GB
```

## 📊 설치 검증 스크립트

```bash
#!/bin/bash
# 종합 검증 스크립트

echo "🔧 MCP 설치 상태 확인"
echo "===================="

# 도구 확인
for cmd in node npm uvx claude jq; do
  if command -v $cmd &> /dev/null; then
    echo "✅ $cmd: $(command -v $cmd)"
  else
    echo "❌ $cmd 설치 필요"
  fi
done

# 환경변수 확인
echo -e "\n🔐 환경변수 상태"
for var in SUPABASE_ACCESS_TOKEN UPSTASH_REDIS_REST_URL; do
  if [ -n "${!var}" ]; then
    echo "✅ $var 설정됨"
  else  
    echo "❌ $var 필요"
  fi
done

# MCP 서버 상태
echo -e "\n📊 MCP 서버 연결 상태"
if command -v claude &> /dev/null; then
  claude mcp list 2>/dev/null | head -20
else
  echo "❌ Claude Code 설치 필요"
fi

echo -e "\n🎯 설치 검증 완료"
```

**설치 시간**: 10-15분 | **디스크 용량**: ~300MB | **8개 서버 완전 작동**