---
id: docs-index
title: Documentation Index
keywords: [documentation, guide, index, navigation, cross-reference]
priority: critical
ai_optimized: true
related_docs:
  [
    'ai/README.md',
    'development/README.md',
    'testing/README.md',
    'architecture/README.md',
  ]
updated: '2025-11-20'
---

# 📚 Documentation Index

OpenManager VIBE v5 문서 인덱스입니다. AI 기반 개발 워크플로우에 최적화되어 있습니다.

## 🚀 빠른 시작

### 🏆 필수 가이드

- **[🚀 빠른 시작](../README.md#-빠른-시작)**: 5분 만에 프로젝트 시작하기
- **[🤖 AI 시스템](ai/README.md)**: Multi-AI 교차검증 시스템 가이드
- **[🛠️ 개발 환경](development/README.md)**: WSL2 + Claude Code + MCP 서버 설정
- **[🧪 테스트 전략](testing/README.md)**: Vercel 중심 E2E 테스트 (98.2% 통과율)
- **[🏗️ 시스템 아키텍처](architecture/README.md)**: 기술 스택 및 구조 개요

### 🗄️ 주요 기술 문서

- **[🌐 API 엔드포인트](architecture/api/endpoints.md)**: 76+ API 라우트 레퍼런스
- **[📊 데이터베이스](architecture/db/schema.md)**: Supabase PostgreSQL 스키마
- **[🚀 배포 가이드](deploy/README.md)**: Vercel 무료 티어 배포
- **[🔒 보안 표준](security/README.md)**: 보안 프로토콜 및 모범 사례
- **[✍️ 코딩 표준](standards/typescript-rules.md)**: TypeScript strict 모드 규칙

## 📂 문서 구조

```
docs/
├── ai/                    # AI 시스템 (Multi-AI, 교차검증)
├── architecture/          # 시스템 아키텍처
│   ├── api/              # API 설계
│   ├── db/               # 데이터베이스
│   └── decisions/        # ADR (Architecture Decision Records)
├── development/           # 개발 환경 설정
│   └── mcp/              # MCP 서버 가이드
├── testing/              # 테스트 전략 및 가이드
├── deploy/               # 배포 가이드
├── security/             # 보안 표준
├── standards/            # 코딩 표준
├── troubleshooting/      # 문제 해결
├── archive/              # 아카이브 (과거 보고서)
│   ├── lint-reports-2025-11/  # Lint 개선 보고서
│   └── ai-verifications/      # AI 검증 히스토리
└── temp/                 # 임시 작업 파일
```

## 🎯 AI 최적화 기능

### 📋 표준화된 YAML frontmatter

```yaml
---
id: unique-id
title: 'Document Title'
keywords: [key1, key2, key3]
priority: high|medium|low
ai_optimized: true
related_docs: ['category/doc1.md']
updated: '2025-11-20'
---
```

### 🔗 문서 간 연결

- **15자 이하 파일명**: 빠른 참조
- **`related_docs`**: 관련 문서 연결
- **코드 우선 예제**: 긴 설명보다 실용적 코드
- **토큰 효율적 구조**: AI 처리 최적화

## 🔄 빠른 명령어

```bash
# 문서 검색
grep -r "keyword" docs/

# Lint 검사
npm run lint

# 테스트 실행
npm run test:quick

# E2E 테스트 (Vercel)
npm run test:vercel:e2e
```

## 🤖 AI 교차검증 시스템

### 사용 가능한 AI 도구

1. **Claude Code** (메인) - 코드 작성 및 리팩토링
2. **Codex CLI** - 코드 분석 및 검증
3. **Gemini CLI** - 대안 검증
4. **Qwen CLI** - 추가 검증

자세한 내용: [AI 시스템 가이드](ai/README.md)

## 📊 프로젝트 현황

- **버전**: 5.79.1
- **TypeScript**: strict 모드, 타입 오류 0개
- **테스트**: E2E 98.2% 통과율
- **Lint**: 316개 경고 (491개에서 35.6% 개선)
- **배포**: Vercel 무료 티어

자세한 현황: [status.md](status.md)

## 🔧 유지보수

### 문서 업데이트 원칙

1. **실제 상태만 기록**: 확인 가능한 정보만 유지
2. **날짜 명시**: `updated` 필드 업데이트
3. **아카이브 활용**: 오래된 보고서는 `archive/`로 이동
4. **간결성 유지**: 핵심 정보 위주

### 최근 업데이트

- **2025-11-20**: 문서 구조 최적화, LINT 보고서 아카이브
- **2025-11-18**: ESLint 경고 35.6% 개선 (491→316)
- **2025-11-16**: AI 시스템 문서 통합

## 📞 지원

- **이슈**: GitHub Issues
- **문서 개선**: Pull Request 환영
- **질문**: Discussions 활용

---

**📖 학습용 프로젝트**: 실제 서버 없이 모니터링 시스템 구현 연습  
**🎯 적합한 대상**: DevOps 학습자, 포트폴리오 제작자  
**🚀 시작하기**: [QUICK-START.md](QUICK-START.md)


### 🚀 4-AI Integrated Collaboration System

**✅ Practical Solution Implemented** - Claude Max + Codex + Gemini + Qwen

#### 📊 3-Level System

- **Level 1** (Under 50 lines): Claude alone → Instant result
- **Level 2** (50-200 lines): Claude + Codex(GPT-5) → 30-60 seconds
- **Level 3** (Over 200 lines): Claude + Codex + Gemini + Qwen → 45-90 seconds

#### 🎯 AI Specializations (Weighted)

- **Codex CLI (0.99)**: Practical code review, bug detection
- **Gemini CLI (0.98)**: Architecture analysis, structural improvements
- **Qwen CLI (0.97)**: Performance optimization, algorithm analysis

## 🎲 Mock Simulation System

### 🎯 FNV-1a Hash-Based Server Metric Generation

**Replaces GCP VMs Entirely** - $57/month → $0 monthly cost + 300% improvement in AI analysis quality

#### 🔬 Core Architecture

- **Deterministic Metrics**: `Math.random()` replaced with FNV-1a hash for deterministic generation.
- **10 Server Types**: Specialized profiles for web (2), database (3), api (4), and cache (1).
- **15+ Failure Scenarios**: Simulates traffic spikes (15%), DDoS (3%), memory leaks (8%), etc.
- **CPU-Memory Correlation**: Realistic 0.6 coefficient.

#### 📊 Performance vs. GCP VMs

| Metric          | GCP VM (Old)    | Mock Simulation (Current)  | Savings/Gain |
| --------------- | --------------- | -------------------------- | ------------ |
| **Monthly Cost**| $57             | $0                         | 100% savings |
| **Stability**   | 99.5% (VM failures) | 99.95% (Code-based)        | 0.45% gain   |
| **Scalability** | 1 VM limit      | Unlimited server simulation| Unlimited    |
| **Response Time**| Unstable          | Consistent 272ms           | Stabilized   |
| **AI Analysis** | Simple metrics    | Failure scenarios + metadata | 300% better  |

#### 🛠️ Usage

```bash
# Run in mock mode
npm run dev:mock

# Check mock status
npm run mock:status

# Check free tier usage
npm run check:usage
```

---

**Status**: Documentation has been refactored and unified.
**Last Updated**: 2025-11-20
**AI Compatibility**: 100% token-optimized
