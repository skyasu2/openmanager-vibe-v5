# 🌟 OpenManager VIBE v5

> **AI 기반 서버 모니터링 학습용 토이프로젝트**  
> 포트폴리오 & 실무 연습을 위한 바이브 코딩 프로젝트

[![Next.js](https://img.shields.io/badge/Next.js-15.5.5-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7.3-blue)](https://www.typescriptlang.org/)
[![Vercel](https://img.shields.io/badge/Vercel-Deploy-green)](https://vercel.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-teal)](https://supabase.com/)

## ✨ 핵심 특징

### 🎯 프로젝트 특징
- **AI 연동 실습**: Claude + Codex + Gemini + Qwen 멀티 AI 연동
- **무료 운영**: Vercel + Supabase 무료 티어 활용
- **Mock 시뮬레이션**: 실제 서버 없이 현실적인 모니터링 구현

### 🏗️ 기술 스택
- **Frontend**: Next.js 15 + React 18 + TypeScript (strict)
- **Backend**: Vercel Edge Functions + Supabase PostgreSQL
- **AI Engine**: 2-모드 시스템 (LOCAL/GOOGLE_AI)
- **데이터**: StaticDataLoader v5.71.0 (99.6% CPU 절약)

### 📊 구현 현황
- **TypeScript**: strict 모드 적용, 타입 오류 0개
- **응답시간**: 평균 152ms
- **테스트**: E2E 98.2% 통과율
- **운영비**: 무료 티어 활용으로 $0

## 🚀 빠른 시작

### 필수 준비사항
- Node.js v22+ | npm v10+ | Git

### 5분 설정
```bash
git clone https://github.com/your-username/openmanager-vibe-v5.git
cd openmanager-vibe-v5
npm install
```

환경 변수 설정:
```bash
cp config/templates/env.local.template .env.local
# .env.local에서 SUPABASE_URL, SUPABASE_ANON_KEY 설정
```

개발 서버 실행:
```bash
npm run dev:stable  # 안정화된 서버 (권장)
```

→ **[📚 상세 설정 가이드](./docs/QUICK-START.md)**

## 💡 주요 기능

### 🖥️ 실시간 모니터링
- **10개 서버 시뮬레이션**: web, api, database, cache 등 전문 서버 타입
- **실시간 메트릭**: CPU, Memory, Disk, Network 사용률
- **장애 시나리오**: 15+ 현실적 장애 상황 시뮬레이션

### 🤖 AI 어시스턴트 (2-모드 시스템)
- **LOCAL 모드**: Supabase RAG + GCP Functions (무료)
- **GOOGLE_AI 모드**: Gemini 2.5 고급 분석 (API 키 필요)

### 🔐 PIN 인증 시스템
- **다층 권한 관리**: 관리자/운영자/게스트 차등 접근
- **기본 PIN**: 4231 (변경 가능)

## 🏛️ 아키텍처 개요

### 데이터 플로우
```
사용자 → Next.js Frontend → Vercel Edge Functions
                           ↓
        Supabase PostgreSQL ← StaticDataLoader v5.71.0
                           ↓
        AI 엔진 (LOCAL/GOOGLE_AI) → 실시간 응답
```

### 핵심 구조
- **StaticDataLoader**: 99.6% CPU 절약, 92% 메모리 절약
- **FNV-1a 해시**: 현실적인 서버 메트릭 생성
- **실시간 WebSocket**: Supabase Realtime 활용

## 🧪 개발 및 테스트

### 테스트 전략
```bash
# Vercel 실제 환경 테스트 (권장)
npm run test:vercel:e2e

# 빠른 개발 검증
npm run test:super-fast    # 11초

# 종합 검증
npm run validate:all       # 린트+타입+테스트
```

### 최적화 구현
- **테스트 성능**: 멀티스레드 실행으로 44% 향상
- **AI 연동**: 3-AI 병렬 검증 시스템 구현

## 📚 학습 가치

### 🎓 이 프로젝트로 배울 수 있는 것
- **무료 인프라 구성**: Vercel + Supabase 무료 티어 활용법
- **AI 연동**: 실시간 AI 분석 시스템 구현 방법
- **Mock 데이터**: 실제 서버 없이 현실적인 시뮬레이션 구현
- **TypeScript strict**: 엄격한 타입 시스템 적용 경험
- **E2E 테스트**: Playwright를 활용한 실전 테스트 전략



## 📚 문서 및 가이드

### 📖 사용자 가이드
- **[🚀 빠른 시작](./docs/QUICK-START.md)** - 5분 만에 시작하기
- **[🛠️ 개발 가이드](./docs/DEVELOPMENT.md)** - AI 도구, MCP 서버, WSL 설정
- **[📊 시스템 아키텍처](./docs/design/current/system-architecture-ai.md)** - AI 시스템 아키텍처

### 🔗 전문 문서
- **[📚 전체 문서 인덱스](./docs/README.md)** - 설계, API, 가이드
- **[🤖 AI 시스템](./docs/ai/)** - AI 교차검증 시스템
- **[🧪 테스트 전략](./docs/testing/README.md)** - Vercel 중심 테스트

## 🤝 기여하기

1. **Fork** 이 저장소
2. **개발**: 기능 구현 및 테스트
3. **검증**: `npm run validate:all` 통과 확인
4. **PR 생성**: 상세한 설명과 함께

### 개발 원칙
- **Type-First**: 타입 정의 → 구현 → 리팩토링
- **Side-Effect 고려**: 변경 시 영향 분석
- **AI 활용**: 멀티 AI 도구로 코드 검증

## 📄 라이선스

MIT License - 자유롭게 사용, 수정, 배포 가능

---

## 💭 개발자 노트

이 프로젝트는 학습 목적으로 제작한 토이프로젝트입니다.  
WSL 2 환경에서 Claude Code와 멀티 AI 도구(Codex, Gemini, Qwen)를 활용한 바이브 코딩으로 개발되었습니다.

**개발 환경 상세**: [DEVELOPMENT.md](./docs/DEVELOPMENT.md)

---

**📖 학습용 프로젝트**: 실제 서버 없이 모니터링 시스템 구현 연습  
**🎯 적합한 대상**: DevOps 학습자, 포트폴리오 제작자  
**🚀 시작하기**: [QUICK-START.md](./docs/QUICK-START.md)