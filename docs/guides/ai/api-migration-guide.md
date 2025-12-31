# AI API Migration Guide

## unified-stream → supervisor 마이그레이션

> **버전**: v5.83.8 ~ v5.84.x
> **상태**: 진행 중

### 변경 사항 요약

| 항목 | 이전 (v5.83.7 이하) | 이후 (v5.83.8+) |
|------|---------------------|-----------------|
| 엔드포인트 | `/api/ai/unified-stream` | `/api/ai/supervisor` |
| 아키텍처 | Streaming AI Engine | LangGraph Multi-Agent |
| 백엔드 | Vercel Edge | Cloud Run Proxy |

### 마이그레이션 타임라인

```
v5.83.8  (현재)  - supervisor 기본, unified-stream 호환 프록시 제공
v5.84.x  (예정)  - unified-stream 프록시 deprecation 경고 추가
v5.85.0  (예정)  - unified-stream 완전 제거
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

_Last Updated: 2025-12-22_
