# 서버 카드 플리커 및 목업 제거 최적화 가이드

### 1. 개요

OpenManager Vibe v5 대시보드의 서버 카드가 5 초 주기로 과도하게 재정렬(플리커)되던 이슈를 해결하기 위해 아래와 같은 조치를 적용했습니다.

- RealServerDataGenerator를 기반으로 한 고정 정렬 데이터 소스 사용
- `/api/servers/next` API의 목업 코드 제거 및 캐싱 헤더 추가
- `useRealtimeServers` 훅 기본 `refreshInterval`을 20초로 통일
- Cache-Control 헤더(`s-maxage=30, stale-while-revalidate=60`)로 브라우저·CDN 캐시 활용

### 2. 변경 내역

1. **`src/app/api/servers/next/route.ts`**
   - 랜덤 목업 제거 → `RealServerDataGenerator` 연동
   - 데이터 없는 경우 `initialize()` 후 `startAutoGeneration()` 수행
   - 서버 리스트를 `id` 기준 정렬하여 불안정한 순서 문제 해결
   - 응답에 `Cache-Control` 헤더 추가 (CDN 30 초, SWR 60 초)
2. **`src/hooks/api/useRealtimeServers.ts`**
   - `refreshInterval` 기본값 `5 000 ms` → `20 000 ms`
   - 과도한 폴링 방지로 UI 안정성 및 백엔드 부하 감소

### 3. 사용 방법

1. 서버 실행
   ```bash
   npm run dev
   ```
2. 브라우저에서 대시보드 확인(`http://localhost:3000/dashboard`).
   - 서버 카드가 20 초 주기로 부드럽게 업데이트되고, 순서가 고정됨을 확인합니다.
3. API 직접 호출 테스트
   ```bash
   curl -I http://localhost:3000/api/servers/next
   # Cache-Control: public, s-maxage=30, stale-while-revalidate=60 헤더 확인
   ```

### 4. 향후 로드맵

| 단계 | 대상 API            | 조치                                                | 우선순위 |
| ---- | ------------------- | --------------------------------------------------- | -------- |
| 1    | `/api/servers/[id]` | `simulationEngine` → `RealServerDataGenerator` 전환 | 🔴       |
| 2    | `/api/metrics/**`   | 랜덤 값 → 실데이터 + Redis 캐시                     | 🟠       |
| 3    | `/api/stream/*`     | 노이즈 상수화 + SSE keep-alive 최적화               | 🟠       |
| 4    | AI 데모 routes      | RAG 기반 실데이터 샘플 교체                         | 🟡       |

### 5. 검증 스크립트

- **로컬**: `npm run validate:quick` – lint ⟶ type-check ⟶ vitest
- **통합**: `npm run test:integration -- src/tests/integration/servers-api.test.ts`

### 6. 참고

- `RealServerDataGenerator` 설정: 8개 서버, 20 초 메트릭 업데이트, Redis TTL 1 h
- 자세한 구현은 `src/services/data-generator/RealServerDataGenerator.ts` 참조
