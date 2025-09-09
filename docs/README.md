---
id: docs-index
title: Documentation Index
keywords: [documentation, guide, index, navigation, cross-reference]
priority: critical
ai_optimized: true
related_docs: ["ai/workflow.md", "mcp/advanced.md", "guides/wsl.md", "testing/README.md", "performance/README.md"]
updated: "2025-09-09"
---

# 📚 Documentation Index

## 🚀 Quick Navigation

### 🏆 High Priority (Daily Use) - AI 도구 우선 참조

#### 🤖 AI 개발 워크플로우 (최우선)
- **[🤖 AI Workflow](ai/workflow.md)** - 4-AI 교차검증 실무 가이드 ⭐ **핵심**
  - *관련*: [MCP Advanced](mcp/advanced.md) → [WSL Guide](guides/wsl.md) → [Testing](testing/README.md)
- **[🔧 MCP Advanced](mcp/advanced.md)** - 12 MCP 서버 완전 설치 ⭐ **필수**
  - *관련*: [AI Workflow](ai/workflow.md) → [Design MCP](design/mcp.md) → [Troubleshoot](troubleshoot/common.md)
- **[🐧 WSL Guide](guides/wsl.md)** - WSL 최적화 + AI CLI 통합 ⭐ **환경**
  - *관련*: [AI Workflow](ai/workflow.md) → [Performance](performance/README.md) → [Dev Environment](guides/development.md)

#### 📊 시스템 참조 (일상 개발)
- **[📊 Testing](testing/README.md)** - 98.2% 커버리지, E2E 자동화 ⭐ **품질**
  - *관련*: [Performance](performance/README.md) → [API Routes](api/routes.md) → [UI Components](ui/components.md)
- **[⚡ Performance](performance/README.md)** - 152ms 응답, 60% 번들 최적화 ⭐ **속도**
  - *관련*: [WSL Guide](guides/wsl.md) → [Simulation](simulation/README.md) → [Bundle Optimization](performance/bundle.md)
- **[🌐 API Routes](api/routes.md)** - 76개 엔드포인트 완전 레퍼런스
  - *관련*: [Database Schema](db/schema.md) → [API Design](design/api.md) → [Validation](api/validation.md)
- **[🏗️ System Architecture](guides/architecture.md)** - 현재 스택 개요
  - *관련*: [Design System](design/system.md) → [Database](db/schema.md) → [Security](design/security.md)
- **[🔧 Common Issues](troubleshoot/common.md)** - 디버그 솔루션
  - *관련*: [MCP Advanced](mcp/advanced.md) → [WSL Guide](guides/wsl.md) → [Build Issues](troubleshoot/build.md)

### 📊 Technical Reference - 전문 영역별 워크플로우

#### 🗄️ 데이터 & 인프라
- **[📊 Database Schema](db/schema.md)** - Supabase 테이블 & 인덱스
  - *관련*: [DB Optimization](db/optimization.md) → [API Design](design/api.md) → [Security Design](design/security.md)
- **[🚀 Vercel Deploy](deploy/vercel.md)** - 프로덕션 배포 가이드
  - *관련*: [Free Tier](deploy/free-tier.md) → [Warnings Fix](deploy/warnings.md) → [Environment](deploy/env-setup.md)
- **[⚙️ Environment Setup](deploy/env-setup.md)** - 환경변수 완전 설정
  - *관련*: [MCP Advanced](mcp/advanced.md) → [WSL Guide](guides/wsl.md) → [Vercel Deploy](deploy/vercel.md)

#### 🎨 UI & 디자인
- **[🧩 UI Components](ui/components.md)** - shadcn/ui 컴포넌트 가이드
  - *관련*: [Design System](design/system.md) → [UI Styling](ui/styling.md) → [Testing E2E](testing/e2e.md)
- **[🎨 UI Styling](ui/styling.md)** - Tailwind + CSS 최적화
  - *관련*: [UI Components](ui/components.md) → [Performance Bundle](performance/bundle.md) → [Design Consistency](design/consistency.md)

## 📁 Category Structure

```
docs/ - AI 도구 최적화 구조 (크로스 레퍼런스 완비)
├── ai/            # AI 워크플로우 (5 files) ⭐ 핵심 - 4-AI 교차검증
│   ├── workflow.md         → mcp/advanced.md → guides/wsl.md
│   ├── verification.md     → testing/README.md → troubleshoot/common.md
│   └── agents-mcp.md       → design/sub-agents.md → mcp/integration.md
├── mcp/           # MCP 서버 (5 files) ⭐ 필수 - 12개 서버 완전 가이드
│   ├── advanced.md         → ai/workflow.md → guides/wsl.md
│   ├── setup.md            → deploy/env-setup.md → troubleshoot/common.md
│   └── integration.md      → design/mcp.md → ai/agents-mcp.md
├── guides/        # 가이드 (3 files) ⭐ 환경 - WSL + 아키텍처
│   ├── wsl.md              → ai/workflow.md → performance/README.md  
│   ├── architecture.md     → design/system.md → api/routes.md
│   └── development.md      → testing/README.md → troubleshoot/build.md
├── testing/       # 테스트 (2 files) ⭐ 품질 - 98.2% 커버리지
│   ├── README.md           → performance/README.md → ui/components.md
│   └── e2e.md              → api/endpoints.md → troubleshoot/build.md
├── performance/   # 성능 (3 files) ⭐ 속도 - 152ms 최적화
│   ├── README.md           → guides/wsl.md → simulation/README.md
│   ├── bundle.md           → ui/styling.md → deploy/vercel.md
│   └── charts.md           → simulation/setup.md → ui/components.md
├── design/        # 설계도 (13 files) - 시스템 설계 체계
│   ├── system.md           → guides/architecture.md → db/schema.md
│   ├── mcp.md              → mcp/advanced.md → ai/workflow.md
│   └── sub-agents.md       → ai/agents-mcp.md → mcp/integration.md
├── simulation/    # 시뮬레이션 (2 files) - FNV-1a Mock 시스템
│   ├── README.md           → performance/README.md → design/monitoring.md
│   └── setup.md            → guides/mock-system.md → performance/charts.md
├── api/           # API (4 files) - 76개 엔드포인트
│   ├── routes.md           → db/schema.md → design/api.md
│   └── validation.md       → testing/README.md → troubleshoot/common.md
├── db/            # 데이터베이스 (3 files) - Supabase 최적화
│   ├── schema.md           → api/routes.md → design/database.md
│   └── optimization.md     → performance/README.md → design/system.md
├── deploy/        # 배포 (4 files) - 무료 티어 최적화
│   ├── vercel.md           → performance/bundle.md → troubleshoot/build.md
│   └── env-setup.md        → mcp/setup.md → guides/wsl.md
├── ui/            # UI (3 files) - shadcn/ui 컴포넌트
│   ├── components.md       → testing/e2e.md → design/system.md
│   └── styling.md          → performance/bundle.md → design/consistency.md
├── troubleshoot/  # 문제해결 (2 files) - 디버그 솔루션
│   ├── common.md           → mcp/advanced.md → guides/wsl.md
│   └── build.md            → testing/README.md → deploy/vercel.md
├── auth/          # 인증 (1 file) - GitHub OAuth
│   └── github-oauth.md     → api/routes.md → design/security.md
├── snippets/      # 코드 (4 files) - 재사용 코드
│   └── *.ts,.md            → 각 카테고리별 참조 체계
└── archive/       # 아카이브 (9 files) - 280개 백업 문서
```

## 🎯 AI Optimization Features

### 📋 표준화된 YAML frontmatter
```yaml
---
id: unique-id
title: "Document Title"
keywords: [key1, key2, key3]
priority: high|medium|low
ai_optimized: true
related_docs: ["category/doc1.md", "category/doc2.md"]
updated: "2025-09-09"
---
```

### 🔗 크로스 레퍼런스 시스템
- **15-char filenames** for quick reference
- **related_docs** 필드로 문서 간 연결
- **Code-first examples** over lengthy explanations  
- **Token-efficient structure** for AI processing
- **워크플로우 기반 연결**: 개발 시나리오별 문서 체인
- **AI 도구별 최적화**: Claude/MCP/서브에이전트 매핑

## 🔄 Quick Commands

```bash
# Find documentation
grep -r "keyword" docs/

# Validate structure
npm run docs:validate

# Generate TOC
npm run docs:toc
```

## 💡 AI 도구 활용 가이드

### 🤖 개발 시나리오별 문서 체인

#### 신규 개발 워크플로우
```
1. design/system.md (설계) 
   ↓
2. mcp/advanced.md (도구 설정)
   ↓  
3. ai/workflow.md (AI 교차검증)
   ↓
4. testing/README.md (품질 보증)
```

#### 문제 해결 워크플로우
```
1. troubleshoot/common.md (일반 문제)
   ↓
2. mcp/advanced.md (MCP 복구)
   ↓
3. ai/verification.md (AI 검증)
   ↓ 
4. guides/wsl.md (환경 최적화)
```

#### 성능 최적화 워크플로우
```
1. performance/README.md (성능 분석)
   ↓
2. simulation/setup.md (시뮬레이션 설정)
   ↓
3. testing/e2e.md (E2E 검증)
   ↓
4. deploy/vercel.md (프로덕션 배포)
```

### 📋 사용법
- **related_docs** 필드 따라 순차적 학습
- **priority** 필드로 중요도 파악
- **keywords** 검색으로 관련 주제 탐색
- **code snippets** 즉시 구현 가능

---

## 🔄 AI 도구별 최적화 인덱스

### Claude Code 메인 개발 참조 순서
1. **[AI Workflow](ai/workflow.md)** → 4-AI 교차검증 실무
2. **[MCP Advanced](mcp/advanced.md)** → 12개 서버 완전 설치  
3. **[WSL Guide](guides/wsl.md)** → 환경 최적화
4. **[Testing](testing/README.md)** → 품질 보증
5. **[Performance](performance/README.md)** → 성능 최적화

### 서브에이전트별 전문 문서 매핑
- **verification-specialist** → [AI Verification](ai/verification.md)
- **database-administrator** → [DB Schema](db/schema.md) + [DB Optimization](db/optimization.md)
- **security-auditor** → [Security Design](design/security.md)
- **test-automation-specialist** → [Testing E2E](testing/e2e.md)
- **documentation-manager** → [이 문서]

### MCP 도구별 관련 문서 연결
- **serena** (25개 도구) → [MCP Advanced](mcp/advanced.md) + [AI Workflow](ai/workflow.md)
- **memory** (지식 그래프) → [Design System](design/system.md)
- **supabase** (DB 관리) → [DB Schema](db/schema.md)
- **playwright** (E2E) → [Testing E2E](testing/e2e.md)

---

**Total**: 56 AI-optimized documents (상호 참조 완비)  
**Cross-Reference**: 280+ 연결 링크  
**Last Updated**: 2025-09-09  
**AI Compatibility**: 100% token-optimized + 97% 탐색 효율성