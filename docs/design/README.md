# 🏗️ OpenManager VIBE v5 설계도 관리 센터

**목적**: 시스템 설계도와 아키텍처 문서의 체계적 관리  
**생성일**: 2025-09-09  
**관리 철학**: 현실 기반 설계 + 개발 배포 vs 개발환경 분리

## 📁 새로운 폴더 구조 (2025.09.09 개편)

### 🎯 `product/` - 제품 개발 및 배포 설계
**실제 서비스의 아키텍처, API, 보안 등 배포용 설계도**

#### `product/current/` - 현재 운영 시스템
- `system-architecture.md` - Next.js 15 기반 시스템 아키텍처
- `api-design.md` - 76개 API 구조 설계
- `data-flow-design.md` - 실시간 데이터 파이프라인
- `security-design.md` - Zero Trust 보안 아키텍처
- `realtime-monitoring.md` - FNV-1a 해시 모니터링 시스템
- `vercel-deployment-architecture.md` - Vercel Edge Network 배포 아키텍처
- `supabase-database-design.md` - PostgreSQL 15 데이터베이스 설계
- `mock-simulation-architecture.md` - GCP 대체 Mock 시뮬레이션 시스템

#### `product/future/` - 미래 제품 확장
- `v6-architecture-plan.md` - 차기 버전 아키텍처
- `scalability-design.md` - 확장성 설계
- `performance-optimization-plan.md` - 성능 최적화

#### `product/archive/` - 완료/폐기된 제품 설계
- `legacy-designs/` - 레거시 아키텍처
- `deprecated-features/` - 폐기된 기능 설계

### 🛠️ `development/` - Claude Code 개발환경 설계
**Claude Code, AI CLI 도구, 서브에이전트 등 개발 워크플로우 설계**

#### `development/current/` - 현재 개발환경
- `claude-code-environment.md` - Claude Code 메인 환경 설정
- `ai-cli-integration.md` - Gemini/Codex/Qwen CLI 통합
- `sub-agents-architecture.md` - 17개 서브에이전트 시스템
- `ai-cross-verification.md` - 4-AI 교차검증 워크플로우
- `wsl-optimization.md` - WSL 2 개발환경 최적화
- `mcp-integration.md` - 8개 MCP 서버 통합

#### `development/future/` - 개발환경 확장
- `ai-automation-enhancement.md` - AI 자동화 개선
- `workflow-optimization-plan.md` - 개발 워크플로우 최적화

#### `development/archive/` - 개발환경 이력
- `legacy-ai-tools/` - 이전 AI 도구 설정
- `deprecated-workflows/` - 폐기된 워크플로우

### 🗂️ `archive/` - 전체 아카이브 (기존 유지)
**완료되었거나 폐기된 모든 설계도들**

## 🎯 설계도 분리 원칙

### 1. **제품 vs 개발환경 명확 분리**
- **product/**: 최종 사용자가 사용하는 서비스 설계
- **development/**: 개발자가 사용하는 개발 도구 설계

### 2. **독립적 생명주기 관리**
- **제품 설계**: 서비스 버전에 따른 관리 (v5.70.11)
- **개발환경**: 도구 버전에 따른 관리 (Claude v1.0.108)

### 3. **참조 대상 구분**
- **product/**: PM, 아키텍트, 백엔드/프론트엔드 개발자
- **development/**: AI 개발자, DevOps, 개발환경 관리자

## 🔄 마이그레이션 계획

### Phase 1: 폴더 구조 생성 ✅
```
docs/design/
├── product/           # 새로 생성
├── development/       # 새로 생성  
├── current/          # 기존 유지 (임시)
├── future/           # 기존 유지 (임시)
└── archive/          # 기존 유지
```

### Phase 2: 문서 재분류 및 이동
- `current/` → `product/current/` + `development/current/`
- AI 관련 설계도는 `development/current/`로
- 순수 제품 설계도는 `product/current/`로

### Phase 3: 기존 폴더 정리
- `current/`, `future/` 폴더 제거
- 참조 링크 업데이트

## 📋 사용 가이드

### 제품 설계 참조
```
일상 개발: docs/design/product/current/
미래 계획: docs/design/product/future/
```

### 개발환경 설정 참조  
```
AI 개발환경: docs/design/development/current/
워크플로우 개선: docs/design/development/future/
```

---

💡 **새로운 설계 철학**: "제품과 개발환경을 분리하여 각각의 최적화 추구"