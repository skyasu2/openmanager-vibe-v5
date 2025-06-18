# 🛠️ OpenManager Vibe v5 개발자 가이드

## 📋 목차

- [프로젝트 개요](#프로젝트-개요)
- [개발 환경 설정](#개발-환경-설정)
- [아키텍처 개요](#아키텍처-개요)
- [AI 시스템 개발](#ai-시스템-개발)
- [이미지 분석 엔진](#이미지-분석-엔진)
- [테스트 가이드](#테스트-가이드)
- [배포 가이드](#배포-가이드)
- [성능 최적화](#성능-최적화)
- [문제 해결](#문제-해결)

## 🎯 프로젝트 개요

### 기술 스택

- **Frontend**: Next.js 15, React 18, TypeScript
- **Styling**: Tailwind CSS, Framer Motion
- **AI/ML**: Google AI Studio, Local RAG, MCP
- **Database**: Supabase (PostgreSQL), Redis
- **Testing**: Vitest, Playwright, Storybook
- **Deployment**: Vercel (Frontend), Render (MCP Server)

### 프로젝트 구조

```
openmanager-vibe-v5/
├── src/
│   ├── app/                    # Next.js App Router
│   ├── components/             # React 컴포넌트
│   ├── lib/                    # 유틸리티 라이브러리
│   ├── services/               # 비즈니스 로직
│   ├── stores/                 # 상태 관리
│   └── types/                  # TypeScript 타입
├── development/
│   ├── tests/                  # 테스트 파일
│   └── scripts/                # 개발 스크립트
├── docs/                       # 문서
└── public/                     # 정적 파일
```

## 🚀 개발 환경 설정

### 필수 요구사항

- Node.js 18.17 이상
- npm 9.0 이상
- Git

### 설치 및 실행

```bash
# 저장소 클론
git clone https://github.com/your-org/openmanager-vibe-v5.git
cd openmanager-vibe-v5

# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env.local
# .env.local 파일 편집

# 개발 서버 실행
npm run dev

# 스토리북 실행
npm run storybook

# 테스트 실행
npm run test
```

### 환경 변수 설정

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Redis
REDIS_URL=your_redis_url

# Google AI (선택사항)
GOOGLE_AI_API_KEY=your_google_ai_key
GOOGLE_AI_ENABLED=true

# MCP Server
MCP_SERVER_URL=your_mcp_server_url
```

## 🏗️ 아키텍처 개요

### 컴포넌트 아키텍처

```
┌─────────────────────────────────────┐
│           Frontend (Next.js)        │
├─────────────────────────────────────┤
│  ┌─────────────┐ ┌─────────────────┐ │
│  │ Dashboard   │ │ AI Assistant    │ │
│  │ Components  │ │ (Enhanced Chat) │ │
│  └─────────────┘ └─────────────────┘ │
├─────────────────────────────────────┤
│           AI Engine Layer           │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ │
│  │Unified  │ │Google   │ │Local    │ │
│  │AI       │ │AI       │ │RAG      │ │
│  └─────────┘ └─────────┘ └─────────┘ │
├─────────────────────────────────────┤
│         Data & Services Layer       │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ │
│  │Supabase │ │Redis    │ │MCP      │ │
│  │Database │ │Cache    │ │Server   │ │
│  └─────────┘ └─────────┘ └─────────┘ │
└─────────────────────────────────────┘
```

### 디렉토리 구조 상세

```
src/
├── app/                        # Next.js 라우팅
│   ├── api/                    # API 엔드포인트
│   ├── dashboard/              # 대시보드 페이지
│   └── admin/                  # 관리자 페이지
├── components/
│   ├── ai/                     # AI 관련 컴포넌트
│   │   └── pages/              # AI Chat 페이지
│   ├── dashboard/              # 대시보드 컴포넌트
│   └── ui/                     # 공통 UI 컴포넌트
├── lib/
│   ├── image-analysis/         # 이미지 분석 엔진
│   ├── ml/                     # 머신러닝 유틸리티
│   └── vector/                 # 벡터 검색
├── services/
│   ├── ai/                     # AI 서비스
│   ├── data-generator/         # 데이터 생성
│   └── monitoring/             # 모니터링 서비스
└── stores/                     # Zustand 상태 관리
```

## 🤖 AI 시스템 개발

### AI 엔진 구조

```typescript
// AI 엔진 인터페이스
interface AIEngine {
  id: string;
  name: string;
  description: string;
  features: string[];
  status: 'ready' | 'loading' | 'error' | 'disabled';
}

// 통합 AI 서비스
class UnifiedAIService {
  async processQuery(query: string, engine: string): Promise<AIResponse> {
    // 엔진별 라우팅 로직
  }
}
```

### 새로운 AI 엔진 추가

1. **엔진 클래스 생성**

```typescript
// src/services/ai/engines/CustomAIEngine.ts
export class CustomAIEngine implements AIEngineInterface {
  async processQuery(query: string): Promise<string> {
    // 커스텀 로직 구현
  }
}
```

2. **엔진 등록**

```typescript
// src/services/ai/AIEngineRegistry.ts
import { CustomAIEngine } from './engines/CustomAIEngine';

export const AI_ENGINES = {
  // ... 기존 엔진들
  custom: new CustomAIEngine(),
};
```

3. **UI 컴포넌트 업데이트**

```typescript
// src/components/ai/pages/EnhancedAIChatPage.tsx
const AI_ENGINES: AIEngine[] = [
  // ... 기존 엔진들
  {
    id: 'custom',
    name: 'Custom AI',
    description: '커스텀 AI 엔진',
    icon: CustomIcon,
    color: 'text-custom-600',
    bgColor: 'bg-custom-50',
    features: ['특징1', '특징2'],
    status: 'ready',
  },
];
```

## 🖼️ 이미지 분석 엔진

### 핵심 기능

- **메타데이터 추출**: 파일 정보, 해상도, 형식
- **색상 분석**: Canvas API를 활용한 픽셀 분석
- **패턴 인식**: 휴리스틱 기반 패턴 감지
- **제안 생성**: 분석 결과 기반 개선 제안

### 사용 예제

```typescript
import { ImageAnalysisEngine } from '@/lib/image-analysis/ImageAnalysisEngine';

const engine = new ImageAnalysisEngine();

// 이미지 분석
const result = await engine.analyzeImage(file);

// 결과 요약 생성
const summary = engine.generateSummary(result);
```

### 확장 방법

1. **새로운 분석 기능 추가**

```typescript
// ImageAnalysisEngine.ts에 메서드 추가
private detectCustomPattern(img: HTMLImageElement): boolean {
  // 커스텀 패턴 감지 로직
}
```

2. **분석 결과 인터페이스 확장**

```typescript
interface ImageAnalysisResult {
  // ... 기존 필드들
  customAnalysis?: CustomAnalysisResult;
}
```

## 🧪 테스트 가이드

### 테스트 구조

```
development/tests/
├── unit/                       # 단위 테스트
│   ├── enhanced-ai-chat.test.ts
│   └── image-analysis.test.ts
├── integration/                # 통합 테스트
│   └── ai-workflow.test.ts
└── e2e/                       # E2E 테스트
    └── dashboard.spec.ts
```

### 테스트 실행

```bash
# 단위 테스트
npm run test:unit

# 통합 테스트
npm run test:integration

# E2E 테스트
npm run test:e2e

# 모든 테스트
npm run test
```

### 새로운 테스트 작성

```typescript
// development/tests/unit/example.test.ts
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

describe('ExampleComponent', () => {
  it('should render correctly', () => {
    render(<ExampleComponent />);
    expect(screen.getByText('Example')).toBeInTheDocument();
  });
});
```

## 🚀 배포 가이드

### Vercel 배포 (Frontend)

```bash
# 자동 배포 (GitHub 연동)
git push origin main

# 수동 배포
npx vercel --prod
```

### Render 배포 (MCP Server)

```yaml
# render.yaml
services:
  - type: web
    name: openmanager-mcp
    env: node
    buildCommand: npm install
    startCommand: npm run start:mcp
    envVars:
      - key: NODE_ENV
        value: production
```

### 환경별 설정

```typescript
// next.config.ts
const nextConfig = {
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  // 환경별 설정
};
```

## ⚡ 성능 최적화

### 코드 분할

```typescript
// 동적 import 사용
const LazyComponent = dynamic(() => import('./LazyComponent'), {
  loading: () => <LoadingSpinner />,
});
```

### 이미지 최적화

```typescript
// Next.js Image 컴포넌트 사용
import Image from 'next/image';

<Image
  src="/image.jpg"
  alt="Description"
  width={500}
  height={300}
  priority={true}
/>
```

### 메모이제이션

```typescript
// React.memo 사용
const MemoizedComponent = React.memo(({ data }) => {
  return <div>{data}</div>;
});

// useMemo 사용
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(data);
}, [data]);
```

### 번들 분석

```bash
# 번들 크기 분석
npm run analyze

# Lighthouse 성능 측정
npm run lighthouse
```

## 🔧 개발 도구

### 코드 품질

```bash
# ESLint 실행
npm run lint

# Prettier 포맷팅
npm run format

# TypeScript 타입 체크
npm run type-check
```

### 스토리북

```bash
# 스토리북 실행
npm run storybook

# 스토리북 빌드
npm run build-storybook
```

### 개발 스크립트

```bash
# 개발 환경 초기화
npm run dev:setup

# 데이터베이스 마이그레이션
npm run db:migrate

# 캐시 정리
npm run clean
```

## 🐛 문제 해결

### 일반적인 문제

**빌드 실패**

```bash
# 의존성 재설치
rm -rf node_modules package-lock.json
npm install

# 캐시 정리
npm run clean
```

**TypeScript 오류**

```bash
# 타입 체크
npm run type-check

# 타입 정의 업데이트
npm update @types/*
```

**성능 문제**

```bash
# 번들 분석
npm run analyze

# 메모리 사용량 확인
node --inspect npm run dev
```

### 디버깅 도구

```typescript
// 개발 환경에서만 로그 출력
if (process.env.NODE_ENV === 'development') {
  console.log('Debug info:', data);
}

// 성능 측정
console.time('operation');
// ... 작업 수행
console.timeEnd('operation');
```

## 📚 추가 리소스

### 공식 문서

- [Next.js 문서](https://nextjs.org/docs)
- [React 문서](https://react.dev)
- [TypeScript 문서](https://www.typescriptlang.org/docs)
- [Tailwind CSS 문서](https://tailwindcss.com/docs)

### 프로젝트 문서

- [API 참조](./api-reference.md)
- [아키텍처 명세](./architecture.md)
- [배포 가이드](./deployment.md)

### 커뮤니티

- [GitHub Issues](https://github.com/your-org/openmanager-vibe-v5/issues)
- [Discord 채널](https://discord.gg/openmanager)
- [개발자 포럼](https://forum.openmanager.com)

---

**OpenManager Vibe v5** - AI 기반 차세대 서버 모니터링 시스템  
© 2025 OpenManager Team. All rights reserved.
