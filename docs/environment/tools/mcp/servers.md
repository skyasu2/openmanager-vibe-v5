---
id: mcp-servers
title: 'MCP 서버 관리 가이드'
keywords: ['mcp', 'servers', 'management', 'configuration']
priority: high
ai_optimized: true
updated: '2025-09-15'
---

# 🔧 MCP 서버 관리 가이드

**9개 서버 완전 관리**: 설정, 최적화, 문제 해결

## 📊 활성 서버 현황

### 🏆 Tier 1: 핵심 서버 (5개)

| 서버          | 유형 | 상태 | 특징                       |
| ------------- | ---- | ---- | -------------------------- |
| **memory**    | NPM  | ✅   | 지식 그래프, 컨텍스트 관리 |
| **supabase**  | NPM  | ✅   | PostgreSQL, RLS, 실시간 DB |
| **serena**    | UVX  | ✅   | 25개 코드 분석 도구        |
| **shadcn-ui** | NPM  | ✅   | 46개 UI 컴포넌트           |
| **vercel**    | HTTP | ✅   | 배포 관리, 사용량 모니터링 |

### 🥈 Tier 2: 전문 서버 (4개)

| 서버                    | 유형 | 상태 | 특징                      |
| ----------------------- | ---- | ---- | ------------------------- |
| **playwright**          | NPM  | ✅   | 15개 브라우저 자동화 도구 |
| **time**                | UVX  | ✅   | 시간대 변환, 타임스탬프   |
| **context7**            | NPM  | ✅   | 라이브러리 문서 검색      |
| **sequential-thinking** | NPM  | ✅   | 순차적 사고 처리          |

## 🔧 서버별 설정

### Memory MCP

```json
{
  "memory": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-memory"],
    "env": {}
  }
}
```

**특징**: 환경변수 불필요, 즉시 작동, 로컬 지식 저장

### Supabase MCP

```json
{
  "supabase": {
    "command": "npx",
    "args": [
      "-y",
      "@supabase/mcp-server-supabase",
      "--project-ref",
      "${SUPABASE_PROJECT_ID}"
    ],
    "env": {
      "SUPABASE_ACCESS_TOKEN": "${SUPABASE_ACCESS_TOKEN}"
    }
  }
}
```

**필수 환경변수**: `SUPABASE_PROJECT_ID`, `SUPABASE_ACCESS_TOKEN`

### Serena MCP (uvx 방식)

```json
{
  "serena": {
    "command": "/home/$USER/.local/bin/uvx",
    "args": [
      "--from",
      "git+https://github.com/oraios/serena",
      "serena-mcp-server",
      "--enable-web-dashboard",
      "false",
      "--log-level",
      "ERROR"
    ],
    "env": {
      "PYTHONUNBUFFERED": "1",
      "NO_COLOR": "1"
    }
  }
}
```

**특징**: AI 교차검증으로 최적화 완료, 25개 도구 안정 작동

### ShadCN UI MCP

```json
{
  "shadcn-ui": {
    "command": "npx",
    "args": ["-y", "@magnusrodseth/shadcn-mcp-server"],
    "env": {}
  }
}
```

**특징**: 46개 컴포넌트 + 55개 블록, 환경변수 불필요

### Playwright MCP

```json
{
  "playwright": {
    "command": "npx",
    "args": ["-y", "@executeautomation/playwright-mcp-server"],
    "env": {}
  }
}
```

**의존성**: `npx playwright install chromium` 필요

### Time MCP

```json
{
  "time": {
    "command": "/home/$USER/.local/bin/uvx",
    "args": ["mcp-server-time"],
    "env": {}
  }
}
```

**특징**: uvx 방식, 환경변수 불필요, 시간대 변환

### Context7 MCP

```json
{
  "context7": {
    "command": "npx",
    "args": ["-y", "@upstash/context7-mcp"],
    "env": {
      "UPSTASH_REDIS_REST_URL": "${UPSTASH_REDIS_REST_URL}",
      "UPSTASH_REDIS_REST_TOKEN": "${UPSTASH_REDIS_REST_TOKEN}"
    }
  }
}
```

**필수 환경변수**: Upstash Redis URL/Token

### Sequential Thinking MCP

```json
{
  "sequential-thinking": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"],
    "env": {}
  }
}
```

**특징**: 환경변수 불필요, 순차적 사고 처리

### Vercel MCP (신규 추가 2025-09-14)

```json
{
  "vercel": {
    "transport": "http",
    "url": "https://mcp.vercel.com"
  }
}
```

**특징**: HTTP 기반, OAuth 인증, 베르셀 프로젝트 관리
**기능**: 배포 상태 모니터링, 로그 분석, 사용량 추적

## 🚫 제거된 서버 (4개)

### 최적화로 제거

| 서버           | 제거 이유              | 대체 방안                    |
| -------------- | ---------------------- | ---------------------------- |
| **filesystem** | 기본 파일 도구로 충분  | Read, Write, Edit, MultiEdit |
| **github**     | 기본 git 명령어로 충분 | `git` 명령어 직접 사용       |
| **gcp**        | 기본 bash 도구로 충분  | `gcloud` CLI 직접 사용       |
| **tavily**     | 웹 검색 불필요         | 프로젝트 내 데이터 중심      |

**결과**: 토큰 27% 절약, 안정성 향상

## 🔄 서버 관리 명령어

### 상태 확인

```bash
# 전체 서버 상태
claude mcp list

# 개별 서버 연결 테스트
claude mcp test memory
claude mcp test supabase
```

### 서버 재시작

```bash
# Claude Code 완전 재시작
pkill -f claude && claude

# 특정 서버만 재시작 (Claude 내에서)
/mcp restart supabase
```

### 로그 확인

```bash
# MCP 로그 위치
ls -la ~/.claude/logs/mcp-*.log

# 실시간 로그 모니터링
tail -f ~/.claude/logs/mcp-server.log
```

## 🔧 문제 해결

### 1. 연결 실패 (일반적)

```bash
# 환경변수 확인
source .env.local
env | grep -E "(SUPABASE|UPSTASH)"

# 설정 파일 검증
cat .mcp.json | jq .

# Claude Code 재시작
claude --reload
```

### 2. Supabase 인증 실패

```bash
# 토큰 유효성 확인
curl -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  "https://api.supabase.com/v1/projects"

# Project ID 확인
echo $SUPABASE_PROJECT_ID
```

### 3. Serena 타임아웃

```bash
# uvx 경로 확인
which uvx  # /home/$USER/.local/bin/uvx

# 직접 실행 테스트
uvx --from git+https://github.com/oraios/serena serena-mcp-server --help

# 프로젝트 활성화 필수
await mcp__serena__activate_project({ project: 'your-project' });
```

### 4. Playwright 브라우저 에러

```bash
# 브라우저 재설치
npx playwright install --with-deps chromium

# WSL 의존성 설치
sudo apt install -y libgconf-2-4 libxss1 libgtk-3-0
```

### 5. Context7 Redis 연결 실패

```bash
# Redis URL 테스트
curl -X POST "$UPSTASH_REDIS_REST_URL/ping" \
  -H "Authorization: Bearer $UPSTASH_REDIS_REST_TOKEN"
```

## ⚡ 성능 최적화

### 서버 선택적 활성화

```json
// 개발 환경 (.mcp.development.json)
{
  "mcpServers": {
    "memory": { /* 지식 관리 - 항상 필요 */ },
    "serena": { /* 코드 분석 - 개발 시 */ },
    "shadcn-ui": { /* UI 개발 시 */ }
    // 나머지는 필요시에만
  }
}

// 프로덕션 환경 (.mcp.production.json)
{
  "mcpServers": {
    "memory": { /* 지식 저장 */ },
    "supabase": { /* 데이터베이스 */ },
    "playwright": { /* E2E 테스트 */ }
  }
}
```

### 메모리 최적화

```bash
# WSL 메모리 설정
echo "[wsl2]
memory=8GB
processors=4
swap=2GB" > /mnt/c/Users/$USER/.wslconfig

# WSL 재시작
wsl --shutdown && wsl
```

### 캐시 관리

```bash
# NPM 캐시 최적화
npm cache clean --force
npm cache verify

# uvx 캐시 정리
uvx cache clean
```

## 📊 모니터링

### 서버 헬스 체크 스크립트

```bash
#!/bin/bash
# mcp-health-check.sh

echo "🔧 MCP 서버 헬스 체크"
echo "===================="

servers=("memory" "supabase" "serena" "shadcn-ui" "playwright" "time" "context7" "sequential-thinking")

for server in "${servers[@]}"; do
  if claude mcp test "$server" 2>/dev/null | grep -q "✓"; then
    echo "✅ $server: 정상"
  else
    echo "❌ $server: 연결 실패"
  fi
done

echo "🎯 헬스 체크 완료"
```

### 자동 복구 스크립트

```bash
#!/bin/bash
# mcp-auto-recovery.sh

echo "🚀 MCP 자동 복구 시작"

# 1. 환경변수 재로드
if [ -f .env.local ]; then
  source .env.local
  echo "✅ 환경변수 로드"
fi

# 2. Claude Code 재시작
pkill -f claude
sleep 2
nohup claude > /dev/null 2>&1 &
echo "✅ Claude Code 재시작"

# 3. 연결 상태 확인
sleep 5
connected=$(claude mcp list 2>/dev/null | grep -c "✓")
total=8

echo "📊 연결 상태: $connected/$total 서버"

if [ "$connected" -eq "$total" ]; then
  echo "🎉 모든 서버 정상 연결"
else
  echo "⚠️ 일부 서버 연결 실패 - 수동 확인 필요"
fi
```

## 🎯 베스트 프랙티스

### 1. 환경변수 관리

- `.env.local` 파일로 중앙 관리
- Git에서 제외 (`.gitignore` 추가)
- 정기적 토큰 갱신

### 2. 서버 활용 순서

1. **Memory**: 컨텍스트 저장/검색
2. **Serena**: 프로젝트 분석 (activate_project 먼저)
3. **ShadCN**: UI 컴포넌트 생성
4. **Supabase**: 데이터베이스 작업
5. **Playwright**: 브라우저 테스트

### 3. 성능 관리

- 불필요한 서버 비활성화
- 정기적 캐시 정리
- 메모리 사용량 모니터링

**8개 서버 완전 관리** | **27% 토큰 절약** | **안정적 운영**
