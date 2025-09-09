---
id: mcp-guide
title: "MCP 통합 가이드"
keywords: ["mcp", "claude", "integration", "servers", "tools"]
priority: high
ai_optimized: true
updated: "2025-09-09"
---

# 🔌 MCP 통합 가이드

**Model Context Protocol**: 8개 서버, 70+ 도구로 Claude 27% 토큰 절약

## 📊 현재 상태 (8개 서버)

| 서버 | 도구 수 | 상태 | 주요 기능 |
|------|---------|------|----------|
| **memory** | 6개 | ✅ | 지식 그래프, 컨텍스트 관리 |
| **supabase** | 12개 | ✅ | PostgreSQL, RLS, 실시간 DB |
| **playwright** | 15개 | ✅ | 브라우저 자동화, E2E 테스트 |
| **time** | 2개 | ✅ | 시간대 변환, 타임스탬프 |
| **context7** | 3개 | ✅ | 라이브러리 문서 검색 |
| **serena** | 25개 | ✅ | 코드 분석, 심볼 조작 |
| **sequential-thinking** | 1개 | ✅ | 순차적 사고 처리 |
| **shadcn-ui** | 46개 | ✅ | UI 컴포넌트 라이브러리 |

**총 110개 도구** | **27% 토큰 절약** | **8개 서버 완전 작동**

## 🚀 빠른 시작

### 설치 확인
```bash
# MCP 서버 상태 확인
claude mcp list

# 환경변수 확인
echo $SUPABASE_ACCESS_TOKEN
echo $UPSTASH_REDIS_REST_URL
```

### 주요 도구 테스트
```typescript
// Knowledge Graph
await mcp__memory__create_entities({
  entities: [{ name: 'Test', entityType: 'Demo', observations: ['MCP 테스트'] }]
});

// Database
await mcp__supabase__list_tables();

// Time
await mcp__time__get_current_time({ timezone: 'Asia/Seoul' });

// UI Components  
await mcp__shadcn_ui__list_components();
```

## 📋 핵심 서버별 활용

### 🧠 Memory (지식 관리)
- `create_entities`: 프로젝트 지식 저장
- `search`: 컨텍스트 기반 검색
- `add_relations`: 엔티티 간 관계 설정

### 🐘 Supabase (데이터베이스)
- `run_sql`: 직접 SQL 실행
- `list_tables`: 테이블 구조 확인
- `search_tables`: 스키마 검색

### 🎭 Playwright (브라우저)
- `navigate`: 페이지 이동
- `screenshot`: 스크린샷 촬영
- `get_page_content`: DOM 내용 추출

### ⏰ Time (시간 처리)
- `get_current_time`: 특정 시간대 현재 시간
- `convert_time`: 시간대 간 변환

### 🔍 Serena (코드 분석)
- `activate_project`: 프로젝트 활성화 (필수)
- `find_file`: 파일 패턴 검색
- `get_symbols_overview`: 코드 심볼 분석

### 🎨 ShadCN UI (컴포넌트)
- `list_components`: 46개 컴포넌트 목록
- `get_component`: 컴포넌트 소스 코드
- `list_blocks`: 55개 블록 템플릿

## ⚠️ 제거된 서버

다음 서버들은 최적화를 위해 제거되었습니다:

- **filesystem**: 기본 파일 도구 (Read, Write)로 대체
- **github**: 기본 git 명령어로 대체  
- **gcp**: 기본 bash 도구로 대체
- **tavily**: 웹 검색 불필요

**결과**: 27% 토큰 절약, 안정성 향상

## 🔧 문제 해결

### 연결 실패
```bash
# Claude Code 재시작
claude --reload

# 환경변수 재로드  
source .env.local
```

### Serena 사용법
```typescript
// 1. 반드시 프로젝트 활성화 필요
await mcp__serena__activate_project({ project: 'openmanager-vibe-v5' });

// 2. 이후 25개 도구 사용 가능
await mcp__serena__list_dir({ relative_path: '.', recursive: false });
```

### 성능 최적화
- 필요한 서버만 활성화
- 환경변수 올바른 설정
- Claude Code 정기 재시작

## 📚 상세 가이드

- **[설치 가이드](setup.md)**: 환경별 설치 방법
- **[도구 레퍼런스](tools.md)**: 110개 도구 완전 레퍼런스
- **[서버 관리](servers.md)**: 8개 서버 상세 설정
- **[서브에이전트 연동](integration.md)**: 17개 에이전트와 MCP 연동

**27% 토큰 절약**: MCP 도구로 효율적 개발 지원