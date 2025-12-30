# AI 어시스턴트 엔진 개선 작업계획서

**작성일**: 2025-12-30
**프로젝트**: OpenManager VIBE v5
**목표**: AI 어시스턴트 엔진 안정성 및 성능 개선

---

## 개선 범위 요약

| Phase | 항목 | 우선순위 | 예상 소요 |
|-------|------|----------|----------|
| 1 | Message Format 통합 | 🔴 높음 | 2-3시간 |
| 2 | 로컬 폴백 추가 | 🔴 높음 | 4-5시간 |
| 3 | 응답 캐싱 도입 | 🟡 중간 | 3-4시간 |

---

## Phase 1: Message Format 통합

### 문제점
- `extractTextFromMessage()` 함수가 3곳에 중복:
  - `src/app/api/ai/supervisor/route.ts` (라인 244-265)
  - `src/domains/ai-sidebar/components/AISidebarV4.tsx` (라인 40-51)
  - `src/components/ai/AIWorkspace.tsx` (라인 45-55)
- `normalizeMessagesForCloudRun()`은 supervisor에만 존재 (라인 285-305)

### 해결 방안

#### 1.1 새 파일 생성
```
src/lib/ai/utils/message-normalizer.ts
```

**내용**:
```typescript
export interface NormalizedMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// UIMessage (AI SDK v5 parts[]) 또는 레거시 content에서 텍스트 추출
export function extractTextFromMessage(message: unknown): string;

// Cloud Run용 메시지 정규화
export function normalizeMessagesForCloudRun(messages: unknown[]): NormalizedMessage[];
```

#### 1.2 수정할 파일

| 파일 | 변경 내용 |
|------|----------|
| `src/app/api/ai/supervisor/route.ts` | 중복 함수 제거, import 추가 |
| `src/domains/ai-sidebar/components/AISidebarV4.tsx` | 중복 함수 제거, import 추가 |
| `src/components/ai/AIWorkspace.tsx` | 중복 함수 제거, import 추가 |

#### 1.3 구현 순서
1. `message-normalizer.ts` 생성 및 타입 정의
2. 기존 로직 통합 (parts + content 하이브리드 지원)
3. `supervisor/route.ts` 마이그레이션
4. UI 컴포넌트 마이그레이션
5. 기존 중복 코드 제거

---

## Phase 2: 로컬 폴백 추가

### 문제점
- Cloud Run 장애 시 503 에러만 반환
- `intelligent-monitoring`, `incident-report`에 Circuit Breaker 없음
- 사용자에게 유용한 폴백 응답 없음

### 해결 방안

#### 2.1 새 파일 생성
```
src/lib/ai/fallback/ai-fallback-handler.ts
```

**내용**:
```typescript
export interface FallbackResponse {
  success: boolean;
  message: string;
  data?: unknown;
  source: 'fallback';
  retryAfter?: number;
}

// 엔드포인트별 폴백 응답 생성
export function createFallbackResponse(
  endpoint: 'supervisor' | 'intelligent-monitoring' | 'incident-report' | 'approval',
  context?: { sessionId?: string; query?: string }
): FallbackResponse;
```

#### 2.2 Circuit Breaker 확장
```
src/lib/ai/circuit-breaker.ts (수정)
```

**추가 함수**:
```typescript
export async function executeWithCircuitBreakerAndFallback<T>(
  serviceName: string,
  primaryFn: () => Promise<T>,
  fallbackFn: () => T | Promise<T>
): Promise<{ data: T; source: 'primary' | 'fallback' }>;
```

#### 2.3 수정할 파일

| 파일 | 변경 내용 |
|------|----------|
| `src/lib/ai/circuit-breaker.ts` | 폴백 래퍼 함수 추가 |
| `src/app/api/ai/supervisor/route.ts` | 503 → 폴백 응답 |
| `src/app/api/ai/intelligent-monitoring/route.ts` | Circuit Breaker + 폴백 |
| `src/app/api/ai/incident-report/route.ts` | Circuit Breaker + 폴백 |
| `src/app/api/ai/approval/route.ts` | Circuit Breaker 적용 |

#### 2.4 폴백 응답 예시

**Supervisor**:
```json
{
  "success": true,
  "response": "AI 서비스가 일시적으로 불안정합니다. 기본 상태 정보를 제공합니다.",
  "source": "fallback",
  "suggestions": ["시스템 상태 확인", "30초 후 재시도"]
}
```

**Intelligent Monitoring**:
```json
{
  "success": true,
  "data": { "prediction": null, "message": "예측 서비스 일시 중단" },
  "source": "fallback"
}
```

#### 2.5 구현 순서
1. `ai-fallback-handler.ts` 생성
2. `circuit-breaker.ts`에 폴백 래퍼 추가
3. `supervisor/route.ts` 폴백 적용
4. `intelligent-monitoring/route.ts` 전체 적용
5. `incident-report/route.ts` 전체 적용
6. `approval/route.ts` Circuit Breaker만 적용

---

## Phase 3: 응답 캐싱 도입

### 문제점
- 기존 캐시 인프라(Redis, Memory) 구현되어 있으나 미사용
- 동일 쿼리에 대한 중복 Cloud Run 호출

### 해결 방안

#### 3.1 새 파일 생성
```
src/lib/ai/cache/ai-response-cache.ts
src/lib/ai/cache/cache-key-generator.ts
src/lib/ai/cache/index.ts
```

**ai-response-cache.ts**:
```typescript
export class AIResponseCache {
  // Memory → Redis 순서로 조회
  async get(sessionId: string, query: string): Promise<CacheResult>;

  // 양쪽에 저장
  async set(sessionId: string, query: string, response: AIResponse): Promise<void>;

  // 세션 캐시 무효화
  async invalidate(sessionId: string): Promise<void>;
}
```

#### 3.2 TTL 정책

| 엔드포인트 | TTL | 사유 |
|-----------|-----|------|
| supervisor (일반) | 15분 | 대화 맥락 민감 |
| supervisor (상태) | 5분 | 빈번한 변경 |
| intelligent-monitoring | 30분 | 예측 안정적 |
| incident-report | 1시간 | 보고서 고정 |

#### 3.3 캐시 키 구조
```
ai:response:{sessionHash}:{queryHash}
```

#### 3.4 수정할 파일

| 파일 | 변경 내용 |
|------|----------|
| `src/app/api/ai/supervisor/route.ts` | 캐시 조회/저장 |
| `src/app/api/ai/intelligent-monitoring/route.ts` | 캐시 조회/저장 |
| `src/app/api/ai/incident-report/route.ts` | 캐시 조회/저장 |

#### 3.5 캐시 흐름
```
요청 → Memory 조회 → (Miss) → Redis 조회 → (Miss) → Cloud Run
                                     ↓ (Hit)           ↓ (성공)
                              Memory 저장           Memory + Redis 저장
```

#### 3.6 구현 순서
1. `cache/` 디렉토리 및 파일 생성
2. 기존 Redis/Memory 캐시 통합
3. `supervisor/route.ts`에 캐시 적용 (POC)
4. 다른 엔드포인트 확대 적용
5. 캐시 히트율 로깅 추가

---

## 파일 구조 (최종)

```
src/lib/ai/
├── circuit-breaker.ts        (수정: 폴백 래퍼 추가)
├── utils/
│   ├── message-normalizer.ts (신규: Phase 1)
│   └── query-complexity.ts   (기존)
├── fallback/
│   └── ai-fallback-handler.ts (신규: Phase 2)
└── cache/
    ├── ai-response-cache.ts  (신규: Phase 3)
    ├── cache-key-generator.ts (신규: Phase 3)
    └── index.ts              (신규: Phase 3)
```

---

## 위험 및 완화

| Phase | 위험 | 완화 방안 |
|-------|------|----------|
| 1 | 타입 불일치 | AI SDK v5 타입 정확히 참조 |
| 2 | 폴백 데이터 혼동 | `source: 'fallback'` 명시 |
| 3 | 오래된 캐시 반환 | 적절한 TTL + Cache-Control |

---

## 승인 체크리스트

- [ ] Phase 1: Message Format 통합 진행
- [ ] Phase 2: 로컬 폴백 추가 진행
- [ ] Phase 3: 응답 캐싱 도입 진행
- [ ] 전체 Phase 진행

---

**작성자**: Claude Opus 4.5
**검토 대기**: 사용자 승인 필요
