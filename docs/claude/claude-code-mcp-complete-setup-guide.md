# Claude Code MCP 완전 설정 가이드

> **2025-08-16 기준 최신 방식** - Claude Code에서 MCP 설정하는 실전적인 완전 가이드  
> **지원 환경**: Windows/WSL, macOS, Linux 공통

## 📋 목차

1. [MCP 개념과 기본 이해](#1-mcp-개념과-기본-이해)
2. [설치 전 환경 점검](#2-설치-전-환경-점검)
3. [MCP 서버 연결 방식 선택](#3-mcp-서버-연결-방식-선택)
4. [스코프 결정: Project vs User](#4-스코프-결정-project-vs-user)
5. [환경변수와 인증 설정](#5-환경변수와-인증-설정)
6. [실전 예시: 주요 MCP 서버 설정](#6-실전-예시-주요-mcp-서버-설정)
7. [관리 및 문제 해결](#7-관리-및-문제-해결)
8. [프로젝트별 권장 MCP 구성](#8-프로젝트별-권장-mcp-구성)

---

## 1. MCP 개념과 기본 이해

### MCP란?
**Model Context Protocol (MCP)**는 LLM과 외부 도구를 연결하는 표준 프로토콜입니다.
- **"AI용 USB-C"** - 다양한 도구를 표준화된 방식으로 연결
- Claude Code가 파일 시스템, 데이터베이스, API 등에 직접 접근 가능
- 실시간 데이터 조회, 코드 실행, 외부 서비스 연동 등 지원

### 주요 장점
- ✅ **실시간 데이터 접근**: 최신 정보로 작업
- ✅ **도구 통합**: 개발 워크플로우 자동화
- ✅ **확장성**: 필요한 도구만 선택적 연결
- ✅ **보안**: 권한 기반 접근 제어

**참고 자료**: [Anthropic MCP 공식 문서](https://docs.anthropic.com/en/docs/claude-code/mcp), [Model Context Protocol](https://modelcontextprotocol.io/)

---

## 2. 설치 전 환경 점검

### 기본 요구사항 확인
```bash
# Claude Code 설치 및 버전 확인
claude --version

# 쉘에서 claude 명령어 동작 확인
claude help

# Node.js 환경 확인 (많은 MCP 서버가 npx 사용)
node --version
npm --version
```

### 권장 환경
- **Claude Code**: 최신 버전
- **Node.js**: v18 이상
- **Python**: v3.8 이상 (Python 기반 MCP 서버용)
- **Git**: 최신 버전 (GitHub MCP 등)

**참고**: [Claude Code 설치 가이드](https://docs.anthropic.com/en/docs/claude-code/setup)

---

## 3. MCP 서버 연결 방식 선택

Claude Code는 세 가지 트랜스포트 방식을 지원합니다:

### A) 로컬 stdio (가장 일반적)
**용도**: 내 PC에서 실행되는 도구들
```bash
# 기본 문법
claude mcp add <name> <command> [args...]

# 예시: GitHub MCP 서버
claude mcp add github --env GITHUB_PERSONAL_ACCESS_TOKEN=ghp_xxx -- npx -y @modelcontextprotocol/server-github
```

**장점**: 
- 시스템 리소스 직접 접근
- 파일 시스템, 로컬 데이터베이스 등
- 커스텀 스크립트 실행 가능

### B) 원격 SSE (실시간 스트리밍)
**용도**: 실시간 업데이트가 필요한 클라우드 서비스
```bash
# 기본 문법
claude mcp add --transport sse <name> <url>

# 예시: Linear (실시간 이슈 업데이트)
claude mcp add --transport sse linear https://mcp.linear.app/sse
```

**장점**:
- 실시간 알림 및 업데이트
- 클라우드 서비스 연동
- 라이브 데이터 스트리밍

### C) 원격 HTTP (요청/응답)
**용도**: 전통적인 REST API 스타일
```bash
# 기본 문법
claude mcp add --transport http <name> <url>

# 예시: Notion
claude mcp add --transport http notion https://mcp.notion.com/mcp
```

**장점**:
- 안정적인 요청/응답 패턴
- 기존 REST API와 호환
- 헤더 기반 인증 지원

---

## 4. 스코프 결정: Project vs User

### Project 스코프 (팀 공유)
```bash
# 기본값 - 프로젝트 루트에 .mcp.json 생성
claude mcp add filesystem -- npx -y @modelcontextprotocol/server-filesystem $(pwd)
```

**특징**:
- ✅ 팀원과 설정 공유 (VCS 커밋 가능)
- ✅ 프로젝트별 맞춤 설정
- ⚠️ 최초 사용 시 각 개발자에게 승인 프롬프트

### User 스코프 (개인 전용)
```bash
# 개인 설정으로 저장
claude mcp add mytool --scope user /path/to/server
```

**특징**:
- ✅ 개인 머신 전체에서 사용
- ✅ 개인 API 키 등 민감 정보
- ❌ 팀원과 공유되지 않음

### 우선순위
**local > project > user** 순으로 같은 이름 서버가 있으면 상위가 우선됩니다.

---

## 5. 환경변수와 인증 설정

### 환경변수 확장
`.mcp.json`에서 `${VAR}` 또는 `${VAR:-default}` 구문 사용 가능:

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_PAT}"
      }
    }
  }
}
```

### OAuth 인증 흐름
1. MCP 서버 추가 후 Claude Code에서 `/mcp` 실행
2. 브라우저 인증 UI 자동 열림
3. 토큰 자동 저장 및 갱신
4. 인증 해제: `/mcp` → "Clear authentication"

### 수동 헤더 설정
```bash
# API 키를 헤더로 전달
claude mcp add myapi --transport http --header "Authorization: Bearer ${API_KEY}" https://api.example.com/mcp
```

---

## 6. 실전 예시: 주요 MCP 서버 설정

### 🗂️ 파일 시스템 (필수)
```bash
# 현재 프로젝트 디렉토리 접근
claude mcp add filesystem -- npx -y @modelcontextprotocol/server-filesystem $(pwd)
```

### 🧠 메모리 (컨텍스트 관리)
```bash
# 대화 컨텍스트 영구 저장
claude mcp add memory -- npx -y @modelcontextprotocol/server-memory
```

### 🐙 GitHub (코드 관리)
```bash
# GitHub 저장소 관리
claude mcp add github --env GITHUB_PERSONAL_ACCESS_TOKEN=ghp_xxx -- npx -y @modelcontextprotocol/server-github
```

### 🗄️ Supabase (데이터베이스)
```bash
# Supabase 프로젝트 관리
claude mcp add supabase --env SUPABASE_ACCESS_TOKEN=sbp_xxx -- npx -y @supabase/mcp-server-supabase@latest --project-ref your-project-ref
```

### 🔍 Tavily (웹 검색)
```bash
# 실시간 웹 검색
claude mcp add tavily --env TAVILY_API_KEY=tvly-xxx -- npx -y tavily-mcp
```

### 🎭 Playwright (브라우저 자동화)
```bash
# E2E 테스트 및 브라우저 자동화
claude mcp add playwright -- npx -y @executeautomation/playwright-mcp-server
```

### ⏰ Time (시간 관리)
```bash
# 시간대 변환 및 일정 관리
claude mcp add time -- uvx mcp-server-time
```

### 🤔 Sequential Thinking (복잡한 문제 해결)
```bash
# 단계별 사고 과정 추적
claude mcp add thinking -- npx -y @modelcontextprotocol/server-sequential-thinking
```

### 📚 Context7 (최신 문서)
```bash
# 최신 코드 문서 및 예제 주입
claude mcp add --transport http context7 https://mcp.context7.com/mcp
```

### 🎨 Shadcn/ui (UI 컴포넌트)
```bash
# Shadcn/ui 컴포넌트 관리
claude mcp add shadcn -- npx -y @magnusrodseth/shadcn-mcp-server
```

### 🔍 Serena (코드 분석, LSP 기반)
```bash
# WSL 환경에서
claude mcp add serena -- uvx --from git+https://github.com/oraios/serena serena start-mcp-server --context ide-assistant --project "$(pwd)"

# Windows에서 WSL의 Serena 사용
claude mcp add serena -- wsl -e bash -lc "uvx --from git+https://github.com/oraios/serena serena start-mcp-server --context ide-assistant --project /mnt/d/your/repo"
```

### ☁️ GCP (Google Cloud Platform)
```bash
# GCP 리소스 관리
claude mcp add gcp --env GOOGLE_CLOUD_PROJECT=your-project-id -- node /path/to/google-cloud-mcp/dist/index.js
```

---

## 7. 관리 및 문제 해결

### 기본 관리 명령어
```bash
# 전체 서버 목록 확인
claude mcp list

# 특정 서버 상세 정보
claude mcp get <server-name>

# 서버 제거
claude mcp remove <server-name>

# 대화창에서 상태 확인
/mcp
```

### JSON으로 일괄 설정
```bash
# 복잡한 설정을 JSON으로 추가
claude mcp add-json weather-api '{
  "type": "stdio",
  "command": "/path/to/weather-cli",
  "args": ["--api-key", "abc123"],
  "env": {"CACHE_DIR": "/tmp"}
}'
```

### Claude Desktop에서 가져오기
```bash
# 기존 Claude Desktop MCP 설정 가져오기
claude mcp add-from-claude-desktop
```

### 프로젝트 승인 초기화
```bash
# 프로젝트 MCP 승인 상태 초기화
claude mcp reset-project-choices
```

### 일반적인 문제 해결

#### 1. 원격 서버 인증 안 됨
```bash
# 브라우저 인증 강제 실행
/mcp

# 수동 헤더 설정
claude mcp add myserver --transport http --header "Authorization: Bearer token" https://api.example.com
```

#### 2. WSL 환경 문제
```bash
# WSL 내부 명령어 실행
claude mcp add tool -- wsl -e bash -lc "your-command"

# 경로 변환 주의 (/mnt/d/... 형식)
```

#### 3. 환경변수 로딩 안 됨
```bash
# 환경변수 확인
echo $GITHUB_PERSONAL_ACCESS_TOKEN

# .env 파일 로딩 (프로젝트별)
source .env.local
```

---

## 8. 프로젝트별 권장 MCP 구성

### 🚀 풀스택 웹 개발 프로젝트
```bash
# 기본 도구
claude mcp add filesystem -- npx -y @modelcontextprotocol/server-filesystem $(pwd)
claude mcp add memory -- npx -y @modelcontextprotocol/server-memory
claude mcp add github --env GITHUB_PERSONAL_ACCESS_TOKEN=$GITHUB_PAT -- npx -y @modelcontextprotocol/server-github

# 데이터베이스
claude mcp add supabase --env SUPABASE_ACCESS_TOKEN=$SUPABASE_PAT -- npx -y @supabase/mcp-server-supabase@latest --project-ref $PROJECT_REF

# 테스팅
claude mcp add playwright -- npx -y @executeautomation/playwright-mcp-server

# UI 개발
claude mcp add shadcn -- npx -y @magnusrodseth/shadcn-mcp-server

# 최신 문서
claude mcp add --transport http context7 https://mcp.context7.com/mcp
```

### 🤖 AI/ML 프로젝트
```bash
# 기본 도구
claude mcp add filesystem -- npx -y @modelcontextprotocol/server-filesystem $(pwd)
claude mcp add memory -- npx -y @modelcontextprotocol/server-memory

# 데이터 검색
claude mcp add tavily --env TAVILY_API_KEY=$TAVILY_KEY -- npx -y tavily-mcp

# 복잡한 추론
claude mcp add thinking -- npx -y @modelcontextprotocol/server-sequential-thinking

# 클라우드 리소스
claude mcp add gcp --env GOOGLE_CLOUD_PROJECT=$GCP_PROJECT -- node /path/to/google-cloud-mcp/dist/index.js
```

### 📱 모바일 앱 개발
```bash
# 기본 도구
claude mcp add filesystem -- npx -y @modelcontextprotocol/server-filesystem $(pwd)
claude mcp add github --env GITHUB_PERSONAL_ACCESS_TOKEN=$GITHUB_PAT -- npx -y @modelcontextprotocol/server-github

# 자동화 테스팅
claude mcp add playwright -- npx -y @executeautomation/playwright-mcp-server

# 시간 관리 (다국가 앱)
claude mcp add time -- uvx mcp-server-time
```

---

## 🎯 빠른 체크리스트

1. **✅ 방식 선택**: stdio / sse / http 중 적절한 트랜스포트 선택
2. **✅ 스코프 결정**: 팀 공유(project) vs 개인용(user)
3. **✅ 서버 추가**: `claude mcp add ...` 명령어로 설정
4. **✅ 인증 설정**: `/mcp`로 OAuth/토큰 설정
5. **✅ 검증**: `claude mcp list`로 설정 확인
6. **✅ 테스트**: Claude Code에서 실제 기능 테스트

---

## 📚 추가 자료

- [Anthropic MCP 공식 문서](https://docs.anthropic.com/en/docs/claude-code/mcp)
- [Model Context Protocol 사양](https://modelcontextprotocol.io/)
- [MCP 서버 마켓플레이스](https://mcp.nacos.io/)
- [Context7 MCP 가이드](https://upstash.com/blog/context7-mcp)
- [Serena MCP 플레이북](https://playbooks.com/mcp/oraios-serena)

---

**💡 맞춤 설정이 필요하시면 환경 정보(WSL/Windows, 프로젝트 유형, 사용하려는 도구)를 알려주시면 구체적인 명령어 세트를 제공해드립니다!**