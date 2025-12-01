---
id: mcp-advanced
title: MCP 실전 가이드
description: 12개 MCP 서버 완전 설치와 Serena AI 교차검증 해결
keywords: [MCP, 서버, 설치, Serena, AI검증, 복구스크립트]
ai_optimized: true
priority: critical
related_docs: ["../ai/workflow.md", "../environment/guides/wsl.md", "../environment/troubleshooting/common.md", "setup.md", "../README.md"]
updated: "2025-09-09"
---

# 🔧 MCP 실전 가이드

**12개 MCP 서버 완전 설치 및 운영 가이드**

## 🎯 핵심 현황

**설치 현황**: ✅ 11/12 정상 작동 (GitHub 토큰 문제만)
**검증 환경**: WSL 2 + Claude Code v1.0.108
**해결 완료**: Serena MCP AI 교차검증 기반 완전 해결

## 📊 MCP 서버 상태

| 서버 | 타입 | 설치 | 상태 | 특징 |
|------|------|------|------|------|
| `filesystem` | NPM | npx | ✅ Connected | 파일 시스템 직접 조작 |
| `memory` | NPM | npx | ✅ Connected | 지식 그래프 관리 |
| `github` | NPM | npx | ❌ Bad credentials | GitHub API (토큰 문제) |
| `supabase` | NPM | npx | ✅ Connected | PostgreSQL DB 관리 |
| `gcp` | NPM | node | ✅ Connected | Google Cloud 관리 |
| `tavily` | NPM | npx | ✅ Connected | 웹 검색/크롤링 |
| `playwright` | NPM | npx | ✅ Connected | 브라우저 자동화 |
| `context7` | NPM | npx | ✅ Connected | 라이브러리 문서 |
| `time` | UVX | uvx | ✅ Connected | 시간대 변환/관리 |
| `serena` | SSE | uvx | ✅ Connected | 25개 코드 분석 도구 |
| `sequential-thinking` | NPM | npx | ✅ Connected | 순차적 사고 처리 |
| `shadcn-ui` | NPM | npx | ✅ Connected | UI 컴포넌트 v4 |

## 🚀 빠른 설치 (필수)

### 1-라인 일괄 설치

```bash
npm install -g @modelcontextprotocol/server-filesystem @modelcontextprotocol/server-memory @modelcontextprotocol/server-github @supabase/mcp-server-supabase google-cloud-mcp tavily-mcp @executeautomation/playwright-mcp-server @modelcontextprotocol/server-sequential-thinking @upstash/context7-mcp @magnusrodseth/shadcn-mcp-server && curl -LsSf https://astral.sh/uv/install.sh | sh
```

### 환경변수 설정

```bash
# .env.local 필수 환경변수
GITHUB_PERSONAL_ACCESS_TOKEN=ghp_xxxx
SUPABASE_ACCESS_TOKEN=sbp_xxxx
TAVILY_API_KEY=tvly-xxxx
UPSTASH_REDIS_REST_URL=https://xxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=AXXXxxxx
GCP_PROJECT_ID=your-project-id
```

## 🤖 Serena MCP 완전 해결 (AI 교차검증 기반)

**문제**: Serena MCP 타임아웃 및 통신 오류
**해결**: AI 3개 협업으로 근본 원인 해결

### AI 교차검증 결과

#### Gemini AI (8.5/10): 핵심 원인 발견
- **발견**: Interactive output이 JSON-RPC 통신 간섭
- **해결**: `--enable-web-dashboard false`, `--enable-gui-log-window false`

#### Codex AI (7.8/10): 실무 안정성
- **기여**: 타임아웃 최적화 (30초), 버퍼링 비활성화
- **추가**: `PYTHONUNBUFFERED=1`, 에러 로그 최적화

#### Qwen AI (9.2/10): 환경변수 최적화
- **완성**: `TERM=dumb`, `NO_COLOR=1`, `SERENA_LOG_LEVEL=ERROR`
- **결과**: 25개 도구 100% 정상 작동

### 최종 설정 (.mcp.json)

```json
"serena": {
  "command": "/home/사용자명/.local/bin/uvx",
  "args": [
    "--from", "git+https://github.com/oraios/serena",
    "serena-mcp-server",
    "--enable-web-dashboard", "false",
    "--enable-gui-log-window", "false", 
    "--log-level", "ERROR",
    "--tool-timeout", "30"
  ],
  "env": {
    "PYTHONUNBUFFERED": "1",
    "PYTHONDONTWRITEBYTECODE": "1",
    "TERM": "dumb",
    "NO_COLOR": "1",
    "SERENA_LOG_LEVEL": "ERROR"
  }
}
```

### Serena 25개 도구 활용

```typescript
// 1. 프로젝트 활성화 (필수)
await mcp__serena__activate_project({ project: 'openmanager-vibe-v5' });

// 2. 파일 검색 (246개 TSX 파일)
await mcp__serena__find_file({ file_mask: '*.tsx', relative_path: 'src' });

// 3. 패턴 검색 (useState 패턴)
await mcp__serena__search_for_pattern({ 
  substring_pattern: 'useState', 
  relative_path: 'src/app/main' 
});

// 4. 심볼 개요 (함수/인터페이스 12개)
await mcp__serena__get_symbols_overview({ 
  relative_path: 'src/lib/supabase-auth.ts' 
});
```

## 🔐 GitHub 토큰 해결

### 토큰 재생성
1. https://github.com/settings/tokens/new
2. 권한: `repo`, `workflow`, `write:packages`
3. `.env.local` 업데이트: `GITHUB_PERSONAL_ACCESS_TOKEN=ghp_새토큰`

### Claude Code 재시작
```bash
pkill -f claude
claude
claude mcp list  # 연결 확인
```

## 🚀 자동 복구 스크립트 (6종)

### 마스터 복구 (원클릭 해결)
```bash
# 모든 MCP 문제 자동 해결
./scripts/mcp-master-recovery.sh

# 진단만 실행
./scripts/mcp-master-recovery.sh --diagnose-only

# 대화형 복구
./scripts/mcp-master-recovery.sh --interactive
```

### 전문 복구 도구

| 스크립트 | 기능 | 실행 시간 | 사용 시점 |
|----------|------|-----------|----------|
| `mcp-recovery-complete.sh` | 종합 MCP 복구 | 3-10분 | 서버 연결 실패 |
| `mcp-env-recovery.sh` | 환경변수 복구 | 1-3분 | 인증 실패 |
| `serena-auto-recovery.sh` | Serena 복구 | 1-2분 | Serena 타임아웃 |
| `mcp-dependencies-installer.sh` | 의존성 재설치 | 5-10분 | 패키지 오류 |
| `mcp-config-backup.sh` | 설정 백업/복구 | 1-2분 | 설정 손상 |

### 시나리오별 해결

```bash
# 환경변수 문제
./scripts/mcp-env-recovery.sh --auto

# Serena 타임아웃
./scripts/serena-auto-recovery.sh

# 의존성 문제  
./scripts/mcp-dependencies-installer.sh --reinstall

# 설정 백업
./scripts/mcp-config-backup.sh --backup
```

## ⚡ WSL 최적화 설정

### .mcp.json 완전 템플릿

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/절대경로/프로젝트"]
    },
    "memory": {
      "command": "npx", 
      "args": ["-y", "@modelcontextprotocol/server-memory"]
    },
    "supabase": {
      "command": "npx",
      "args": ["-y", "@supabase/mcp-server-supabase@latest", "--project-ref", "${SUPABASE_PROJECT_ID}"],
      "env": {"SUPABASE_ACCESS_TOKEN": "${SUPABASE_ACCESS_TOKEN}"}
    },
    "time": {
      "command": "/home/사용자명/.local/bin/uvx",
      "args": ["mcp-server-time"]
    },
    "serena": {
      "command": "/home/사용자명/.local/bin/uvx", 
      "args": ["--from", "git+https://github.com/oraios/serena", "serena-mcp-server", "--enable-web-dashboard", "false", "--enable-gui-log-window", "false", "--log-level", "ERROR", "--tool-timeout", "30"],
      "env": {
        "PYTHONUNBUFFERED": "1",
        "PYTHONDONTWRITEBYTECODE": "1", 
        "TERM": "dumb",
        "NO_COLOR": "1",
        "SERENA_LOG_LEVEL": "ERROR"
      }
    }
  }
}
```

## 🔍 실시간 상태 확인

```bash
# MCP 서버 상태
claude mcp list

# 개별 서버 테스트
await mcp__serena__activate_project({ project: 'openmanager-vibe-v5' });
await mcp__memory__create_entities({ entities: [{ name: 'Test', entityType: 'Test' }] });
await mcp__time__get_current_time({ timezone: 'Asia/Seoul' });

# 환경변수 확인
env | grep -E "(GITHUB|SUPABASE|TAVILY)"
```

## 🎯 성과

- **설치 시간**: 15-30분 (자동화 시 10분)
- **성공률**: 11/12 서버 정상 (92%)
- **도구 수**: 100+ 개 MCP 도구 활용 가능
- **AI 교차검증**: Serena MCP 100% 해결 완료
- **자동 복구**: 6종 복구 스크립트로 신속 문제 해결

**검증 완료**: 2025-08-20 WSL 2 + Ubuntu + Claude Code v1.0.84

---

## 🔗 다음 추천 참조 문서

### 🚀 MCP 활용 워크플로우 시작
1. **[🤖 AI Workflow](../ai/workflow.md)** - 4-AI 교차검증과 MCP 도구 연동
2. **[🐧 WSL Guide](../environment/guides/wsl.md)** - WSL 환경 최적화 (MCP 안정성 필수)
3. **[🛠️ Troubleshoot](../environment/troubleshooting/common.md)** - MCP 서버 문제 해결 가이드

### 🔧 MCP 시스템 심화 학습
1. **[📋 MCP Setup](setup.md)** - 환경별 초기 설치 가이드
2. **[🔍 MCP Tools](tools.md)** - 110개 도구 완전 레퍼런스
3. **[🤖 MCP Integration](integration.md)** - 서브에이전트와 MCP 연동

### ⚡ 성능 및 최적화 체인
1. **[⚡ Performance](../performance/README.md)** - MCP 서버 성능 최적화
2. **[📊 Testing](../environment/testing/README.md)** - MCP 도구 테스트 가이드  
3. **[🎨 UI Components](../ui/components.md)** - shadcn-ui MCP 46개 컴포넌트

### 🏗️ 설계 및 아키텍처
1. **[🏛️ Design MCP](../design/mcp.md)** - MCP 아키텍처 설계도
2. **[🤖 Design Sub-Agents](../design/sub-agents.md)** - 12개 서브에이전트 ↔ MCP 매핑  
3. **[🗄️ Database](../db/schema.md)** - Supabase MCP 연동

### 📚 메인 허브
- **[📋 문서 인덱스](../README.md)** - 전체 56개 문서 네비게이션
- **[📁 프로젝트 가이드](../../CLAUDE.md)** - OpenManager VIBE 완전 가이드

💡 **핵심**: **AI 교차검증 + 12개 MCP 서버**로 **27% 토큰 절약** 달성