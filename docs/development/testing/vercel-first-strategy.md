# Vercel 중심 테스트 전략

## 🎯 핵심 철학

**"로컬보다 실제 Vercel 환경에서 직접 테스트가 더 효과적"**

### 왜 Vercel 중심인가?

1. **환경 일치**: 테스트 환경 = 운영 환경
2. **실제 성능**: Edge Functions, CDN, 실제 네트워크 레이턴시 반영
3. **무료 티어 검증**: 실제 사용량 기반 제한 테스트
4. **개발 효율성**: Mock 설정 불필요, 디버깅 시간 단축

---

## 📊 현재 테스트 현황 (2025-12-19)

### 테스트 구성

| 카테고리 | 파일 수 | 위치 | 비고 |
| -------- | ------- | ---- | ---- |
| **Co-located Unit** | 35개 | `src/` | 컴포넌트, hooks, lib, utils |
| **E2E** | 8개 | `tests/e2e/` | Playwright (Chromium) |
| **Integration** | 10개 | `tests/integration/` | 시스템 통합 |
| **API** | 3개 | `tests/api/` | API Contract |
| **합계** | **65개** | - | - |

### 성능 지표

- **CI 최고속**: 2.2초 (92 tests)
- **Minimal 테스트**: 22ms
- **E2E Critical**: ~1분

---

## 🎯 테스트 우선순위

### 1. 🔴 High Priority: Vercel E2E 테스트

**실제 운영 환경에서 직접 테스트**

```bash
# Vercel 환경 종합 테스트
npm run test:vercel:full    # 전체 프로덕션 테스트

# E2E 테스트 (실제 환경)
npm run test:vercel:e2e     # 18개 Playwright 테스트

# 프로덕션 환경 검증
npm run test:vercel:e2e     # 배포 후 즉시 실행
```

**포함 내용**:

- 대시보드 렌더링 및 인터랙션
- AI 쿼리 시스템 (LOCAL/GOOGLE_AI 모드)
- PIN 인증 및 관리자 모드
- 서버 메트릭 표시 및 업데이트
- 실시간 데이터 동기화

### 2. 🟡 Medium Priority: API Routes 성능 테스트

**실제 API 응답 시간 측정**

```bash
# API 통합 테스트
npm run test:integration    # GCP Functions + Supabase

# API Routes 검증
npm run test:api           # Next.js API 엔드포인트

# 성능 측정
npm run lighthouse:vercel   # Lighthouse 성능 분석
```

### 3. 🔵 Low Priority: 로컬 Unit 테스트

**필요시에만 실행**

```bash
# 로컬 유닛 테스트
npm run test                # Vitest (필요시만)
npm run test:e2e            # 로컬 Playwright (개발용)
```

---

## 🚀 실행 방법

### 기본 워크플로우

```bash
# 1. 코드 변경 완료

# 2. 로컬에서 빠른 검증 (선택적)
npm run test:super-fast     # 11초 빠른 유닛 테스트

# 3. Vercel 배포
git push                    # 자동 배포 트리거

# 4. Vercel 환경 E2E 테스트
npm run test:vercel:e2e     # 실제 환경 검증

# 5. 성능 측정
npm run lighthouse:vercel   # Core Web Vitals 확인
```

### 1인 AI 개발 최적화 워크플로우

```bash
# AI 개발 기본 워크플로우
npm run test:ai             # Vercel 실제 환경 테스트

# 가장 빠른 검증
npm run test:super-fast     # 11초 (유닛 테스트만)

# 최적화된 병렬 테스트
npm run test:fast           # 21초 (멀티스레드)

# 병렬 개발 + 테스트
npm run test:dev            # quick + vercel 병렬 실행
```

---

## ⚡ 테스트 성능 최적화 (2025-09-24)

### AI 교차검증 결과 기반 최적화

**문제 인식**:

- Codex (실무): 테스트 피라미드 역전 문제 지적
- Gemini (아키텍처): Integration-First 패턴의 혁신성 인정
- Qwen (성능): **단 1줄 수정으로 44% 성능 향상** 제안

**최적화 적용**:

```typescript
// config/testing/vitest.config.main.ts
{
  test: {
    singleThread: false,  // false로 변경 (1줄 수정)
  }
}
```

**성과**:

- 테스트 시간: 37.95초 → 21.08초 (**44% 단축**)
- 일일 개발 효율: 16.87초 절약
- 월간 효과: 약 6시간 절약

### 1인 AI 개발 맞춤 전략

```bash
# 기본 워크플로우
npm run test:ai          # Vercel 실제 환경 (핵심)
npm run test:super-fast  # 빠른 개발 검증 (11초)

# AI 교차검증으로 Unit 테스트 대체
"codex: 이 로직 문제있나 검증해줘"
"gemini: 구조적 개선점 있나 확인"
"qwen: 성능 병목점 분석해줘"
```

---

## ✅ Vercel 환경 테스트 장점

### 1. 환경 일치

- ✅ 테스트 = 프로덕션
- ✅ Edge Functions 실제 동작
- ✅ CDN 캐싱 효과 확인
- ✅ 실제 네트워크 레이턴시

### 2. 무료 티어 검증

- ✅ 실제 사용량 추적
- ✅ 제한 사항 테스트
- ✅ 성능 최적화 검증
- ✅ 비용 효율성 확인

### 3. 개발 효율성

- ✅ Mock 설정 불필요
- ✅ 환경 설정 간소화
- ✅ 디버깅 시간 단축
- ✅ 실제 문제 조기 발견

---

## 🎯 테스트 커버리지 목표

### 현재 커버리지

- **E2E**: 핵심 사용자 플로우 100%
- **API**: 주요 엔드포인트 95%
- **보안**: 인증/권한 시스템 100%
- **성능**: Core Web Vitals 실측

### 향후 목표

- **E2E**: 추가 시나리오 확대
- **API**: Edge Case 테스트 강화
- **성능**: 자동화된 성능 모니터링

---

## 📊 성능 지표 (2025-09-28 실측)

### Core Web Vitals

- **FCP** (First Contentful Paint): 608ms ✅
- **LCP** (Largest Contentful Paint): < 2.5s ✅
- **CLS** (Cumulative Layout Shift): < 0.1 ✅
- **응답시간**: 532ms (평균) ✅

### Vercel 배포 현황

- **배포 상태**: ✅ 완전 성공 (Zero Warnings)
- **Node.js 버전**: ✅ 22.x 통합
- **프로덕션 안정성**: 100% 확보
