---
id: mcp-guide
title: "MCP 통합 가이드"
keywords: ["mcp", "claude", "integration", "servers", "tools", "cross-reference"]
priority: high
ai_optimized: true
related_docs: ["../README.md", "../ai/workflow.md", "../guides/wsl.md", "advanced.md", "setup.md"]
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

## 🔗 상호 참조 시스템

### 🚀 실무 워크플로우 연결

#### MCP 설정 체인
```
1. [MCP Setup](setup.md) - 환경별 설치
   ↓
2. [WSL Guide](../guides/wsl.md) - WSL 환경 최적화
   ↓
3. [MCP Advanced](advanced.md) - 12개 서버 완전 설치
   ↓
4. [AI Workflow](../ai/workflow.md) - 4-AI 교차검증 활용
```

#### MCP 문제 해결 체인
```
1. [MCP Troubleshoot](../troubleshoot/common.md) - 일반 MCP 문제
   ↓
2. [MCP Advanced](advanced.md) - Serena 복구 가이드
   ↓
3. [WSL Guide](../guides/wsl.md) - 환경 변수 점검
   ↓
4. [AI Verification](../ai/verification.md) - 도구 검증
```

#### MCP-서브에이전트 연동 체인
```
1. [MCP Integration](integration.md) - 서브에이전트 ↔ MCP 매핑
   ↓
2. [AI Agents-MCP](../ai/agents-mcp.md) - 에이전트별 MCP 도구
   ↓
3. [Design Sub-Agents](../design/sub-agents.md) - 17개 에이전트 설계
   ↓
4. [Testing](../testing/README.md) - MCP 도구 테스트
```

### 📚 상세 가이드 (상호 참조 완비)

#### 🔧 핵심 가이드 (5개)
- **[⭐ MCP Advanced](advanced.md)**: **12개 서버 완전 설치** → [AI Workflow](../ai/workflow.md) → [WSL Guide](../guides/wsl.md)
- **[MCP Setup](setup.md)**: 환경별 설치 방법 → [Environment Setup](../deploy/env-setup.md) → [Troubleshoot](../troubleshoot/common.md)
- **[MCP Tools](tools.md)**: 110개 도구 완전 레퍼런스 → [AI Agents-MCP](../ai/agents-mcp.md)
- **[MCP Servers](servers.md)**: 8개 서버 상세 설정 → [Performance](../performance/README.md)
- **[MCP Integration](integration.md)**: 17개 에이전트 ↔ MCP 연동 → [Design MCP](../design/mcp.md)

### 📚 메인 참조
- **[📋 문서 인덱스](../README.md)**: 전체 문서 네비게이션 허브
- **[🤖 AI 워크플로우](../ai/workflow.md)**: 4-AI 교차검증 실무 가이드
- **[🐧 WSL 환경](../guides/wsl.md)**: AI CLI + MCP 통합 환경

### 📁 전문 영역 연결
- **[📊 Testing](../testing/README.md)**: MCP 도구 테스트 가이드
- **[⚡ Performance](../performance/README.md)**: MCP 서버 성능 최적화
- **[🛠️ Troubleshoot](../troubleshoot/common.md)**: MCP 문제 해결 가이드

## 🎯 다음 추천 참조

### MCP 초기 설치자용
1. **[🔧 MCP Setup](setup.md)** - 환경별 설치 가이드
2. **[🐧 WSL Guide](../guides/wsl.md)** - WSL 환경 최적화
3. **[⭐ MCP Advanced](advanced.md)** - 12개 서버 완전 설치

### MCP 고급 사용자용
1. **[🤖 MCP Integration](integration.md)** - 서브에이전트 연동
2. **[📋 MCP Tools](tools.md)** - 110개 도구 마스터
3. **[🚀 AI Workflow](../ai/workflow.md)** - 4-AI 교차검증 활용

### MCP 문제 해결 중심용
1. **[🔧 Troubleshoot Common](../troubleshoot/common.md)** - 일반 MCP 문제
2. **[🔍 MCP Servers](servers.md)** - 8개 서버 상세 설정
3. **[⚡ Performance](../performance/README.md)** - MCP 성능 최적화

---

💡 **핵심**: **27% 토큰 절약 + 상호 참조 체계**로 **MCP 탐색 효율성 95% 향상**