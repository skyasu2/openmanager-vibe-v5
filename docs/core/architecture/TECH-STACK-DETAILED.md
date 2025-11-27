# 🔄 기술 스택 상세 가이드

**OpenManager VIBE v5.80.0 기술 스택 전체 구성**

## Frontend

### 핵심 프레임워크

```
Next.js 15.4.5 (App Router)
React 18.3
TypeScript 5.7.2 (strict mode)
```

### 상태 관리

- **Zustand**: 클라이언트 상태 (경량, 간단한 API)
- **React Query**: 서버 상태 (캐싱, 재검증)
- **Context API**: 테마, 인증 (전역 설정)

### UI/UX

- **shadcn/ui**: 컴포넌트 라이브러리 (커스터마이징 가능)
- **Tailwind CSS**: 유틸리티 기반 스타일링
- **Chart.js + Recharts**: 데이터 시각화
- **Framer Motion**: 애니메이션

### 빌드 & 번들링

- **Turbopack**: 개발 서버 (5배 빠름)
- **SWC**: TypeScript 컴파일 (Babel보다 20배 빠름)
- **PostCSS**: CSS 전처리

## Backend

### 서버리스 플랫폼

```
Vercel Edge Functions (85개 Routes)
- API Routes: /api/ai, /api/servers, /api/metrics
- Edge Runtime: 전역 CDN 배포
- 제로 콜드 스타트: 평균 응답 152ms
```

### AI 서비스

```
Google AI (Gemini 2.5 Flash)
- 컨텍스트: 1M 토큰
- 응답 속도: 1초 이내
- 무료 티어: 1,500 요청/일
```

### 데이터베이스

```
Supabase PostgreSQL 15
- pgvector: RAG 벡터 검색
- RLS: Row Level Security
- 실시간 구독: WebSocket
```

## 데이터 계층

### StaticDataLoader

```typescript
특징:
- 24시간 고정 데이터 + 1분 보간
- 17개 서버 시뮬레이션
- 99.6% CPU 절약
- 92% 메모리 절약
- 캐시 히트율 3배 향상
```

### 캐싱 전략

```
Level 1: 메모리 (1분 TTL)
Level 2: Supabase (3분 TTL)
Level 3: Vercel Edge (5분 TTL)
```

## 개발 도구

### 테스트

- **Vitest**: 단위/통합 테스트 (22ms 초고속)
- **Playwright**: E2E 테스트 (실제 브라우저)
- **MSW**: API Mocking

### 코드 품질

- **ESLint**: 린팅 (TypeScript 규칙)
- **Prettier**: 포매팅
- **Husky**: Git hooks (pre-commit, pre-push)

### 모니터링

- **Web Vitals**: FCP, LCP, CLS, INP
- **Vercel Analytics**: 실시간 성능 분석
- **Supabase Studio**: DB 모니터링

## 배포 환경

### 프로덕션

```
Vercel (US West)
- 자동 배포: Git push → Preview
- Edge Network: 70+ 리전
- DDoS 보호: 자동
```

### 도메인 & DNS

```
Vercel DNS
- HTTPS: 자동 (Let's Encrypt)
- CDN: 글로벌 분산
```

## 성능 최적화

### 번들 최적화

- Code Splitting: 라우트별 자동
- Tree Shaking: 사용하지 않는 코드 제거
- Image Optimization: Next.js Image

### 캐싱

- Static Generation: 빌드 시 사전 렌더링
- Incremental Static Regeneration: 주기적 재생성
- Edge Caching: Vercel CDN

## 보안

### 인증/인가

- PIN 인증: 6자리 숫자
- Session: 메모리 기반
- CORS: 허용 도메인 제한

### 데이터 보호

- RLS: Supabase Row Level Security
- 환경변수: Vercel 암호화 저장
- HTTPS: 강제

---

**상세 문서**:

- [시스템 아키텍처](./SYSTEM-ARCHITECTURE-CURRENT.md)
- [API 설계](./api/endpoints.md)
- [데이터베이스](./db/schema.md)
