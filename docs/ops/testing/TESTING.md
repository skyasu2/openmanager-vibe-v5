# 🧪 Testing Guide - OpenManager Vibe v5.44.0 (현행화)

OpenManager Vibe v5의 **AI 엔진 아키텍처 v3.0 완전 구현** 및 **Co-location 테스트 구조**가 반영된 최신 가이드입니다.

## 🎯 **새로운 테스트 구조 (Co-location)**

프로젝트는 유지보수성과 발견성을 높이기 위해 **Co-location (관련 코드와 테스트를 같은 위치에 배치)** 패턴을 채택했습니다.

### 📁 **폴더 구조**

```
src/
├── components/          # UI 컴포넌트
│   ├── dashboard/
│   │   ├── ServerDashboard.tsx
│   │   ├── ServerDashboard.integration.test.tsx  # ✅ UI 통합 테스트 (Co-located)
│   │   └── ServerCard.test.tsx                   # ✅ 단위 테스트 (Co-located)
├── hooks/
│   ├── useSupabaseSession.ts
│   └── useSupabaseSession.test.ts                # ✅ Hook 테스트 (Co-located)
├── lib/                 # 라이브러리/유틸리티
│   └── utils.test.ts                             # ✅ 유틸리티 테스트 (Co-located)
tests/
├── integration/         # 시스템 전반 통합 테스트 (API, 외부 연동)
├── e2e/                 # E2E 테스트 (Playwright)
├── performance/         # 성능 테스트
└── scripts/             # 테스트 지원 스크립트
```

### 🚀 **빠른 테스트 실행 명령어**

```bash
# 빠른 타입 체크 및 린트 실행 (커밋 전 권장)
npm run validate:quick

# 단위/통합 테스트 (Co-located 포함)
npm run test:quick

# 시스템 통합 테스트만 실행
npm run test:integration

# E2E 테스트 실행 (Playwright)
npm run test:e2e

# 전체 문서화된 커버리지 리포트
npm run test:coverage
```

## ⚡ **AI 엔진 아키텍처 v4.0 테스트 철학**

- **단일 통합 파이프라인**: Supabase RAG + Google Cloud Functions + Google AI SDK
- **Cloud Functions 우선**: Korean NLP, ML Analytics, Unified Processor를 기본 단계로 실행
- **직접 Google AI 호출**: Prompt SDK를 통한 저지연 응답, 모델은 `gemini-2.5-flash` 고정
- **캐싱 + 폴백 최소화**: 500ms 이내 응답 목표, 타임아웃 시 사용자 안내 반환

## 🎯 AI 엔진 테스트 전략

### 🤖 **통합 파이프라인 검증 시나리오**

1. **RAG + Cloud Functions 결합**
   - Supabase RAG 결과 5건 → Unified AI Processor 요약 → Prompt 결합
   - 성능 목표: 400~600ms
   - 테스트 포커스: 유사도 검색 정확도, Cloud Functions latency

2. **한국어 NLP + 실시간 메트릭**
   - Korean NLP 함수 호출 → UnifiedMetricsService 실시간 데이터 병합
   - 성능 목표: 650ms 이내
   - 테스트 포커스: 한국어 질의 감지, 서버 메트릭 컨텍스트 주입

### 📊 **테스트 커버리지 목표**

```
         /\
        /  \
       /E2E \      <- 10% (사용자 시나리오 - Playwright)
      /______\
     /        \
    /Sys Integ \   <- 20% (시스템/API 통합 - tests/integration)
   /__________\
  /            \
 / UI/Unit Tests\  <- 70% (컴포넌트/로직 - src/**)
/________________\
```

## 📚 Detailed Guides

더 자세한 내용은 아래 가이드를 참고하세요:

- **[E2E Testing Guide](e2e-testing-guide.md)**: Playwright 상세 설정 및 시나리오 작성법
- **[React Component Testing Guide](react-component-testing-guide.md)**: 컴포넌트 테스트 패턴 및 예제
- **[MSW Guide](msw-guide.md)**: API 모킹(Mocking) 가이드
- **[Test Strategy Guide](test-strategy-guide.md)**: 전체 테스트 전략 상세
- **[Co-location Guide](co-location-guide.md)**: 테스트 파일 위치 선정 가이드

## 🛠️ 테스트 도구 스택

### 테스트 프레임워크

- **Vitest**: 메인 테스트 프레임워크 (Jest 대체)
- **Testing Library**: React 컴포넌트 테스트
- **Playwright**: E2E 테스트
- **MSW**: API 모킹

### 주요 테스트 유틸리티

- **UnifiedAIEngineRouter**: 통합 AI 엔진 라우터 테스트
- **SupabaseRAGEngine**: RAG 엔진 테스트
- **KoreanNLPEngine**: 한국어 처리 테스트

## 🔧 최신화된 설정 파일

### Vitest 설정 (`vitest.config.minimal.ts`)

```typescript
export default defineConfig({
  test: {
    // ...
    include: [
      'src/utils/type-guards.test.ts',
      'src/**/*.test.{ts,tsx}',            // ✅ Co-located 단위 테스트
      'src/**/*.integration.test.tsx',      // ✅ Co-located 통합 테스트
    ],
    exclude: [
      // ... 무거운 E2E 및 시스템 통합 등 제외
    ]
  }
});
```

### Playwright 설정 (`playwright.config.ts`)

E2E 테스트는 Playwright를 사용하며, `tests/e2e` 폴더 내의 테스트를 실행합니다.

---

**마지막 업데이트**: 2025.12.19 - Co-location 구조 반영 및 문서 현행화 완료.
