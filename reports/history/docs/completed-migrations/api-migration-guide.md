# AI API Migration Guide

## unified-stream → supervisor 마이그레이션

> **버전**: v5.83.8 → v5.85.0
> **상태**: 완료 ✅ (v5.85.0에서 unified-stream 제거됨)

### 변경 사항 요약

| 항목 | 이전 (v5.83.7 이하) | 이후 (v5.83.8+) |
|------|---------------------|-----------------|
| 엔드포인트 | `/api/ai/unified-stream` | `/api/ai/supervisor` |
| 아키텍처 | Streaming AI Engine | LangGraph Multi-Agent |
| 백엔드 | Vercel Edge | Cloud Run Proxy |

### 마이그레이션 타임라인

```
v5.83.8  - supervisor 기본, unified-stream 호환 프록시 제공
v5.84.x  - unified-stream 프록시 deprecation 경고 추가
v5.85.0  - unified-stream 완전 제거 ✅ 완료
```

---

## 클라이언트 코드 업데이트

### React/Next.js (useChat 훅)

**Before:**
```typescript
import { useChat } from 'ai/react';

const { messages, append } = useChat({
  api: '/api/ai/unified-stream',
});
```

**After:**
```typescript
import { useChat } from 'ai/react';

const { messages, append } = useChat({
  api: '/api/ai/supervisor',
});
```

### fetch API 직접 호출

**Before:**
```typescript
const response = await fetch('/api/ai/unified-stream', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    messages: [{ role: 'user', content: '서버 상태 확인' }]
  })
});
```

**After:**
```typescript
const response = await fetch('/api/ai/supervisor', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    messages: [{ role: 'user', content: '서버 상태 확인' }]
  })
});
```

---

## 요청/응답 포맷 변경

### 요청 포맷 (변경 없음)

```typescript
interface SupervisorRequest {
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content?: string;        // 레거시 포맷
    parts?: Array<{          // AI SDK v5 포맷
      type: 'text';
      text: string;
    }>;
  }>;
  sessionId?: string;
}
```

### 응답 헤더 변경

| 헤더 | 설명 |
|------|------|
| `X-Session-Id` | 세션 식별자 |
| `X-Backend` | 백엔드 출처 (`cloud-run` 또는 `fallback-error`) |

---

## 호환성 레이어

v5.83.8부터 구버전 호환을 위한 프록시가 자동으로 제공됩니다:

```
/api/ai/unified-stream → /api/ai/supervisor (자동 리다이렉트)
```

**주의**: 이 호환 레이어는 v5.85.0에서 제거될 예정입니다.

---

## 체크리스트

- [ ] 코드에서 `/api/ai/unified-stream` 검색
- [ ] `/api/ai/supervisor`로 교체
- [ ] 테스트 실행 확인
- [ ] 스트리밍 응답 정상 동작 확인

---

## 문제 해결

### Q: Cloud Run 연결 실패 시?

A: 503 응답과 함께 `Retry-After: 30` 헤더가 반환됩니다.
자동 재시도 로직 구현을 권장합니다:

```typescript
async function fetchWithRetry(url: string, options: RequestInit, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    const response = await fetch(url, options);
    if (response.status !== 503) return response;

    const retryAfter = response.headers.get('Retry-After');
    await new Promise(r => setTimeout(r, (parseInt(retryAfter || '30') * 1000)));
  }
  throw new Error('Max retries exceeded');
}
```

### Q: 기존 테스트가 실패하는 경우?

A: 테스트 파일에서 엔드포인트 경로를 업데이트하세요:

```typescript
// Before
const endpoint = '/api/ai/unified-stream';

// After
const endpoint = '/api/ai/supervisor';
```

---

## API 라우트 통합 (v5.84.1)

> **버전**: v5.84.1
> **상태**: 완료

### 통합된 엔드포인트 요약

| 카테고리 | 통합 전 | 통합 후 | 감소 |
|---------|--------|--------|------|
| Health Check | 3개 | 1개 | -67% |
| System | 6개 | 1개 | -83% |
| Database | 3개 | 1개 | -67% |
| Cache | 2개 | 1개 | -50% |
| Test/Debug | 2개 | 2개 (재구성) | 0% |
| **총계** | **16개** | **6개** | **-63%** |

---

### Health Check 마이그레이션

**Before:**
```typescript
// Ping 체크
await fetch('/api/ping');

// AI 헬스체크
await fetch('/api/ai/health');

// 전체 헬스체크
await fetch('/api/health');
```

**After:**
```typescript
// Ping 체크 (간단 응답)
await fetch('/api/health?simple=true');

// AI 헬스체크
await fetch('/api/health?service=ai');

// 전체 헬스체크
await fetch('/api/health');
```

---

### System API 마이그레이션

**Before:**
```typescript
// 시스템 상태
await fetch('/api/system/status');

// 시스템 초기화
await fetch('/api/system/initialize', { method: 'POST' });

// 시스템 시작
await fetch('/api/system/start', { method: 'POST' });

// 메모리 최적화
await fetch('/api/system/optimize', {
  method: 'POST',
  body: JSON.stringify({ level: 'aggressive' })
});

// 데이터 동기화
await fetch('/api/system/sync-data', { method: 'POST' });
```

**After:**
```typescript
// 시스템 상태 (기본)
await fetch('/api/system');

// 시스템 메트릭
await fetch('/api/system?view=metrics');

// 헬스 상태
await fetch('/api/system?view=health');

// 프로세스 목록
await fetch('/api/system?view=processes');

// 메모리 상태
await fetch('/api/system?view=memory');

// 시스템 시작
await fetch('/api/system', {
  method: 'POST',
  body: JSON.stringify({ action: 'start' })
});

// 시스템 중지
await fetch('/api/system', {
  method: 'POST',
  body: JSON.stringify({ action: 'stop' })
});

// 시스템 재시작
await fetch('/api/system', {
  method: 'POST',
  body: JSON.stringify({ action: 'restart' })
});

// 초기화
await fetch('/api/system', {
  method: 'POST',
  body: JSON.stringify({ action: 'initialize' })
});

// 메모리 최적화
await fetch('/api/system', {
  method: 'POST',
  body: JSON.stringify({ action: 'optimize', level: 'aggressive' })
});

// 데이터 동기화
await fetch('/api/system', {
  method: 'POST',
  body: JSON.stringify({ action: 'sync-data' })
});
```

---

### Database API 마이그레이션

**Before:**
```typescript
// DB 상태
await fetch('/api/database/status');

// 풀 리셋
await fetch('/api/database/reset-pool', { method: 'POST' });

// 읽기전용 모드
await fetch('/api/database/readonly-mode', { method: 'POST' });
```

**After:**
```typescript
// DB 상태
await fetch('/api/database');

// 풀 상태
await fetch('/api/database?view=pool');

// 읽기전용 상태
await fetch('/api/database?view=readonly');

// 풀 리셋
await fetch('/api/database', {
  method: 'POST',
  body: JSON.stringify({ action: 'reset' })
});

// 읽기전용 모드 설정
await fetch('/api/database', {
  method: 'POST',
  body: JSON.stringify({ action: 'readonly', enabled: true })
});
```

---

### Cache API 마이그레이션

**Before:**
```typescript
// 캐시 통계
await fetch('/api/cache/stats');

// 캐시 최적화
await fetch('/api/cache/optimize', { method: 'POST' });
```

**After:**
```typescript
// 캐시 통계
await fetch('/api/cache');

// 캐시 최적화
await fetch('/api/cache', {
  method: 'POST',
  body: JSON.stringify({ action: 'optimize' })
});
```

---

### Test/Debug 라우트 재구성

**Before:**
```typescript
await fetch('/api/auth/test');
await fetch('/api/auth/debug');
```

**After:**
```typescript
await fetch('/api/test/auth');
await fetch('/api/debug/auth');
```

---

### Deprecated 엔드포인트 목록

다음 엔드포인트들은 하위호환성을 위해 유지되지만, 콘솔에 deprecation 경고가 출력됩니다:

| Deprecated | 대체 엔드포인트 |
|------------|----------------|
| `/api/ping` | `/api/health?simple=true` |
| `/api/ai/health` | `/api/health?service=ai` |
| `/api/system/status` | `/api/system` |
| `/api/system/initialize` | `POST /api/system` (action: initialize) |
| `/api/system/start` | `POST /api/system` (action: start) |
| `/api/system/optimize` | `/api/system?view=memory` 또는 `POST` (action: optimize) |
| `/api/system/sync-data` | `POST /api/system` (action: sync-data) |
| `/api/system/unified` | `/api/system` |
| `/api/database/status` | `/api/database` |
| `/api/database/reset-pool` | `POST /api/database` (action: reset) |
| `/api/database/readonly-mode` | `POST /api/database` (action: readonly) |
| `/api/cache/stats` | `/api/cache` |
| `/api/cache/optimize` | `POST /api/cache` (action: optimize) |
| `/api/auth/test` | `/api/test/auth` |
| `/api/auth/debug` | `/api/debug/auth` |

---

_Last Updated: 2026-01-08_
