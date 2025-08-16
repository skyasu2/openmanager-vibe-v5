<!--
===========================================
CODEX 관리용 문서 (AGENTS.md)
===========================================
이 파일은 ChatGPT Codex CLI 설정 및 관리를 위한 전용 문서입니다.
Codex 에이전트 구성, 명령어, 환경 설정 등을 포함합니다.
===========================================
-->

# AGENTS.md - Codex CLI Configuration

> **Codex CLI 설정 및 에이전트 관리 문서**  
> **Language Policy: Korean-first communication**  
> **Last Updated**: 2025-08-16 | **Environment**: Windows + WSL 2

## 🎯 Codex Quick Start

```bash
# Codex 상태 확인
codex status
codex agents list

# 에이전트 실행
codex run "데이터베이스 최적화 분석"
codex execute --agent database "성능 튜닝"

# 프로젝트 분석
codex analyze --type full
codex review --files "src/**/*.ts"
```

## ⚙️ Codex CLI 환경 설정

### 기본 설정
```bash
# 프로젝트 루트 설정
export CODEX_PROJECT_ROOT="/mnt/d/cursor/openmanager-vibe-v5"

# 언어 설정 (한국어 우선)
export CODEX_LANGUAGE="ko-KR"
export CODEX_LOCALE="ko_KR.UTF-8"

# Codex 작업 디렉토리
export CODEX_WORKSPACE="$CODEX_PROJECT_ROOT"
export CODEX_CONFIG_DIR="$CODEX_PROJECT_ROOT/.codex"

# 로그 설정
export CODEX_LOG_LEVEL="info"
export CODEX_LOG_FILE="$CODEX_PROJECT_ROOT/logs/codex.log"
```

## 🤖 Codex 에이전트 구성

### 활성 에이전트 목록
```yaml
# .codex/agents.yml
agents:
  database:
    name: "Database Administrator"
    description: "Supabase PostgreSQL 관리 전문"
    capabilities: ["query-optimization", "schema-design", "performance-tuning"]
    
  frontend:
    name: "Frontend Developer"
    description: "Next.js + TypeScript 개발"
    capabilities: ["component-design", "state-management", "ui-optimization"]
    
  backend:
    name: "Backend Engineer"
    description: "API 및 서버 로직 개발"
    capabilities: ["api-design", "middleware", "authentication"]
    
  testing:
    name: "Test Automation"
    description: "Vitest + Playwright 테스트"
    capabilities: ["unit-testing", "e2e-testing", "test-coverage"]
```

## 📁 Codex 프로젝트 구조

### Codex 설정 파일
```
/mnt/d/cursor/openmanager-vibe-v5/
├── AGENTS.md (이 파일 - Codex 설정)
├── .env.local (환경변수)
└── .codex/
    ├── config.json (Codex 기본 설정)
    ├── agents.yml (에이전트 정의)
    ├── prompts/ (프롬프트 템플릿)
    │   ├── database.md
    │   ├── frontend.md
    │   ├── backend.md
    │   └── testing.md
    └── logs/
        └── codex.log (실행 로그)
```

## 📋 Codex 명령어 사용법

### 기본 명령어
```bash
# 프로젝트 초기화
codex init --project "openmanager-vibe-v5"

# 에이전트 실행
codex run --agent database --task "성능 분석"
codex run --agent frontend --task "컴포넌트 최적화"

# 코드 분석
codex analyze --path "src/" --type "typescript"
codex review --files "*.ts,*.tsx" --focus "performance"

# 문서 생성
codex docs --generate --format "markdown"
codex docs --update --section "api"
```

### 고급 명령어
```bash
# 멀티 에이전트 협업
codex collaborate --agents "frontend,backend" --task "API 통합"

# 자동 리팩토링
codex refactor --target "src/components" --pattern "hooks"

# 테스트 자동 생성
codex test --generate --coverage 80

# 성능 모니터링
codex monitor --metrics "response-time,memory" --duration "1h"
```

## 🔧 Codex 설정 관리

### 기본 설정 (.codex/config.json)
```json
{
  "project": {
    "name": "openmanager-vibe-v5",
    "language": "ko-KR",
    "framework": "nextjs",
    "typescript": true
  },
  "agents": {
    "default_timeout": 300,
    "max_concurrent": 4,
    "auto_save": true
  },
  "output": {
    "format": "markdown",
    "language": "korean",
    "include_code": true
  }
}
```

### 에이전트 프롬프트 템플릿
```markdown
# .codex/prompts/database.md
당신은 Supabase PostgreSQL 전문 데이터베이스 관리자입니다.
- 한국어로 응답해주세요
- 성능 최적화에 집중하세요
- 실행 가능한 SQL 쿼리를 제공하세요
- 보안 모범 사례를 준수하세요
```

## 📊 Codex 모니터링

### 실행 상태 확인
```bash
# Codex 서비스 상태
codex status --detailed

# 에이전트 활동 로그
codex logs --agent database --last 24h

# 성능 메트릭
codex metrics --export json
```

### 로그 분석
```bash
# 에러 로그 필터링
codex logs --level error --since "1 hour ago"

# 성공률 통계
codex stats --period daily --metric success_rate
```

---

**💡 Codex CLI 전용 설정 문서**  
**🌏 한국어 우선 개발 환경**  
**🤖 ChatGPT Codex Integration**