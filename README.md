# 🌐 OpenManager VIBE v5.65.3

> **AI 기반 실시간 서버 모니터링 플랫폼** - 100% 무료 운영, 2-5x 성능 향상, 엔터프라이즈급 품질

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js%2015-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![GCP Functions](https://img.shields.io/badge/GCP%20Functions-4285F4?style=for-the-badge&logo=google-cloud&logoColor=white)](https://cloud.google.com/functions)
[![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com/)

## 🎯 프로젝트 개요

**OpenManager VIBE v5**는 AI 기반 실시간 서버 모니터링 플랫폼으로, 100% 무료 운영하면서도 엔터프라이즈급 성능을 제공합니다.

### 주요 특징

- **실시간 모니터링**: 15초 간격 자동 업데이트
- **AI 기반 분석**: 이상 징후 자동 감지 및 예측
- **무료 운영**: Vercel, GCP, Supabase 무료 티어 활용
- **높은 성능**: 152ms 응답 시간, 99.95% 가동률

### 🏗️ 기술 스택

- **Frontend**: Next.js 14.2.4 (App Router), React 18.2.0, TypeScript, Tailwind CSS
- **Backend**: Edge Runtime, GCP Functions (Python 3.11), Supabase
- **Database**: PostgreSQL (Supabase) + pgVector, Upstash Redis
- **AI/ML**: Google AI Studio (Gemini 2.0), Supabase RAG, Korean NLP
- **DevOps**: Vercel, GitHub Actions, GCP
- **Package Manager**: npm (Node.js 22+)

## 🚀 Getting Started

### Prerequisites

- Node.js v22.15.1 이상
- npm 10.x 이상
- Git

### Quick Start

```bash
# 1. 저장소 클론
git clone https://github.com/yourusername/openmanager-vibe-v5.git
cd openmanager-vibe-v5

# 2. 의존성 설치
npm install

# 3. 환경 설정
cp env.local.template .env.local
# .env.local 파일을 열어 필요한 환경 변수 설정

# 4. 개발 서버 실행
npm run dev
# http://localhost:3000 에서 확인
```

### 환경 변수 설정

최소 필요 환경 변수:

```bash
# Supabase (필수)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Google AI (선택)
GOOGLE_AI_API_KEY=your_google_ai_api_key

# GitHub OAuth (선택)
GITHUB_ID=your_github_oauth_id
GITHUB_SECRET=your_github_oauth_secret
```

상세 설정은 [환경 설정 가이드](./docs/setup/ENV-SETUP-QUICKSTART.md)를 참조하세요.

## 🚀 주요 기능

```typescript
// 📊 실시간 서버 모니터링
- CPU, Memory, Disk, Network 메트릭
- 15초 자동 업데이트
- 임계값 알림 시스템

// 🤖 AI 기반 분석
- 이상 징후 자동 감지
- 성능 예측 및 추천
- 자연어 질의 처리

// 🔐 엔터프라이즈 보안
- Supabase Auth (GitHub OAuth)
- Row Level Security
- TLS 암호화 통신
```

## 💡 핵심 혁신

### 1. **템플릿 기반 아키텍처**

실시간 연산을 사전 생성된 템플릿으로 대체하여 99% 성능 향상

### 2. **동적 메트릭 시스템**

런타임에 메트릭 추가/삭제 가능한 유연한 구조

### 3. **무료 티어 최적화**

Vercel, GCP, Supabase 무료 티어만으로 완전한 서비스 구현

### 4. **GCP Functions 통합** 🚀 NEW

- **Python 3.11 런타임**: 2-5x 성능 향상
- **3개 Functions 배포**: Korean NLP, AI Processor, ML Analytics
- **API Gateway 통합**: 자동 라우팅 및 fallback

### 5. **TypeScript 완전 타입 안전성** ✨ NEW

- **Phase 1-3 완료**: 모든 타입 오류 해결
- **통합 타입 시스템**: unified.ts로 중앙 집중화
- **타입 가드 함수**: 런타임 타입 안전성 보장

## 📊 성능 측정 기준

### 측정 환경

- **프로덕션**: Vercel Edge Runtime (미국 서부)
- **테스트 도구**: Lighthouse, Vercel Analytics
- **측정 주기**: 매일 오전 9시 (KST)

### 주요 지표

| 지표                 | 목표    | 현재   | 측정 방법        |
| -------------------- | ------- | ------ | ---------------- |
| **응답 시간 (p95)**  | < 200ms | 152ms  | Vercel Analytics |
| **Lighthouse Score** | 90+     | 95     | Chrome DevTools  |
| **번들 크기**        | < 150KB | 137KB  | next build 분석  |
| **Uptime**           | 99.9%   | 99.95% | 30일 평균        |
| **메모리 사용량**    | < 4GB   | 3.2GB  | Node.js 프로세스 |

### 성능 검증 방법

```bash
# 로컬에서 성능 측정
npm run analyze:performance

# Lighthouse 점수 확인
npm run lighthouse

# 번들 크기 분석
npm run analyze:bundle
```

## 📚 문서

상세한 기술 문서는 [`/docs`](./docs) 디렉토리를 참조하세요:

### 🏗️ 아키텍처 및 시스템

- [시스템 아키텍처](./docs/system-architecture.md)
- [AI 시스템 통합 가이드](./docs/ai-system-unified-guide.md) ✨ 최신
- [GCP Functions 완전 가이드](./docs/gcp-complete-guide.md)

### 🔧 개발 가이드

- [개발 가이드](./docs/development-guide.md)
- [개발 도구 통합](./docs/development-tools.md)
- [TypeScript 개선 가이드](./docs/typescript-improvement-guide.md)
- [테스팅 가이드](./docs/testing-guide.md)

### 🔒 보안 및 운영

- [보안 완전 가이드](./docs/security-complete-guide.md)
- [배포 완전 가이드](./docs/deployment-complete-guide.md)
- [메모리 최적화 가이드](./docs/memory-optimization-guide.md)

### 🔐 인증 및 문제 해결

- [OAuth 성공 사례 분석](./docs/oauth-success-analysis.md) 🎉 최신
- [OAuth 문제 해결 가이드](./docs/troubleshooting/oauth-issues.md) ✅ 검증됨

### 🤖 AI 도구 및 통합

- [Gemini 개발 도구 v5](./docs/gemini-dev-tools-v5-guide.md) 🚀 최신
- [Claude Code MCP 설정 2025](./docs/claude-code-mcp-setup-2025.md) 🆕 최신

## 🏆 프로젝트 하이라이트

- **100% 무료 운영**: 모든 서비스를 무료 티어로 구현
- **엔터프라이즈급 품질**: 99.95% 가동률, 152ms 응답 시간
- **실시간 AI 분석**: 이상 징후 자동 감지 및 예측
- **완전한 타입 안전성**: TypeScript strict mode, 0개 타입 오류

상세한 기술적 성과는 [CLAUDE.md](./CLAUDE.md#-프로젝트-핵심-성과)를 참조하세요.

---

## 📚 문서화

### 서브 에이전트

- [Claude Sub-agents 공식 문서](https://docs.anthropic.com/en/docs/claude-code/sub-agents) - Claude의 서브 에이전트 기능에 대한 공식 문서입니다. 서브 에이전트를 활용한 협업 워크플로우와 설정 방법을 확인하세요.
- [Claude MCP (Model Control Protocol) 문서](https://docs.anthropic.com/en/docs/claude-code/mcp) - Claude의 MCP 기능에 대한 공식 문서입니다. MCP를 통한 모델 제어 및 확장 방법을 확인하세요.

## 라이선스

<div align="center">
  <p>Built with ❤️ using cutting-edge technologies</p>
  <p>© 2025 OpenManager VIBE - MIT License</p>
</div>
