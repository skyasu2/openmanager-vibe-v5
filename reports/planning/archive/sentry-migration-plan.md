# Sentry 마이그레이션 작업 계획서

**작성일**: 2026-01-22
**목표**: 로컬 개발 환경 500 에러 해결 + Next.js 16 권장 방식 적용

---

## 1. 현황 분석

### 1.1 현재 문제점

| 증상 | 원인 |
|------|------|
| 로컬 `npm run dev` 시 500 에러 | Sentry 초기화 충돌 |
| `e.setAttribute is not a function` | SSR 중 DOM API 접근 |
| Vercel Production은 정상 | `enabled: production only` 설정 |

### 1.2 현재 파일 구조 (문제)

```
프로젝트 루트/
├── instrumentation.ts          # Sentry 초기화 (구버전 방식)
├── sentry.server.config.ts     # ❌ deprecated
├── sentry.edge.config.ts       # ❌ deprecated
├── sentry.client.config.ts     # ❌ deprecated
└── src/
    └── instrumentation.ts      # ⚠️ 충돌 (다른 용도)
```

### 1.3 Sentry SDK 경고 메시지

```
[@sentry/nextjs] It appears you've configured a `sentry.server.config.ts` file.
Please ensure to put this file's content into the `register()` function of a
Next.js instrumentation file instead.

[@sentry/nextjs] DEPRECATION WARNING: It is recommended renaming your
`sentry.client.config.ts` file, or moving its content to `instrumentation-client.ts`.
```

---

## 2. 목표 구조 (Next.js 16 권장)

```
프로젝트 루트/
├── instrumentation.ts              # Server + Edge Sentry 통합
├── instrumentation-client.ts       # Client Sentry (신규)
├── src/
│   └── instrumentation.ts          # 삭제 (루트로 통합)
└── [삭제 예정]
    ├── sentry.server.config.ts
    ├── sentry.edge.config.ts
    └── sentry.client.config.ts
```

---

## 3. 작업 단계

### Phase 1: instrumentation.ts 통합 (Server + Edge)

**파일**: `/instrumentation.ts`

```typescript
import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

export async function register() {
  // Node.js 런타임 (Server)
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    Sentry.init({
      dsn: SENTRY_DSN,
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0,
      enabled: process.env.NODE_ENV === 'production',
      debug: false,
    });

    // 환경변수 검증
    try {
      await import('./src/env');
    } catch (error) {
      console.error('환경변수 검증 실패:', error);
      if (process.env.NODE_ENV === 'production') {
        process.exit(1);
      }
    }
  }

  // Edge 런타임
  if (process.env.NEXT_RUNTIME === 'edge') {
    Sentry.init({
      dsn: SENTRY_DSN,
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0,
      enabled: process.env.NODE_ENV === 'production',
      debug: false,
    });
  }
}

// Next.js 16 권장: Request Error 캡처
export function onRequestError(
  error: Error,
  request: Request,
  context: { routerKind: string; routePath: string }
) {
  Sentry.captureException(error, {
    extra: {
      routerKind: context.routerKind,
      routePath: context.routePath,
      url: request.url,
    },
  });
}
```

### Phase 2: instrumentation-client.ts 생성 (Client)

**파일**: `/instrumentation-client.ts` (신규)

```typescript
import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn: SENTRY_DSN,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0,
  enabled: process.env.NODE_ENV === 'production',
  debug: false,

  // 클라이언트 전용 설정
  replaysOnErrorSampleRate: 0, // 무료 티어: Replay 비활성화
  replaysSessionSampleRate: 0,
});
```

### Phase 3: 기존 파일 삭제

| 파일 | 액션 |
|------|------|
| `sentry.server.config.ts` | 삭제 |
| `sentry.edge.config.ts` | 삭제 |
| `sentry.client.config.ts` | 삭제 |
| `src/instrumentation.ts` | 삭제 (루트로 통합) |

### Phase 4: next.config.mjs 정리

`withSentryConfig` 옵션 유지 (소스맵 비활성화 등)

---

## 4. 검증 체크리스트

- [x] `npm run dev` 500 에러 해결 ✅ HTTP 200 (2026-01-22)
- [x] `npm run build` 성공 ✅ Compiled successfully (2026-01-22)
- [x] Vercel Preview 배포 정상 ✅ build_id: 6e46a02 (2026-01-22)
- [x] Production 배포 정상 ✅ HTTP 200 (2026-01-22)
- [ ] Sentry 이벤트 수신 확인 (Production) - Production 환경에서 확인 필요

---

## 5. 롤백 계획

문제 발생 시:
```bash
git revert HEAD  # 커밋 되돌리기
```

---

## 6. 예상 소요

| 단계 | 예상 |
|------|------|
| Phase 1-2 | 코드 작성 |
| Phase 3 | 파일 삭제 |
| Phase 4 | 테스트 |
| 총계 | - |

---

## 7. 실행 결과 (2026-01-22)

### 커밋
```
6e46a020f fix(sentry): migrate to Next.js 16 instrumentation pattern
```

### 변경 파일
| 파일 | 액션 |
|------|------|
| `instrumentation.ts` | 수정 (Server + Edge 통합) |
| `instrumentation-client.ts` | 신규 (Client + onRouterTransitionStart) |
| `sentry.server.config.ts` | 삭제 |
| `sentry.edge.config.ts` | 삭제 |
| `sentry.client.config.ts` | 삭제 |
| `src/instrumentation.ts` | 삭제 |

### 테스트 결과
- 로컬 개발: `HTTP 200` ✅
- 빌드: `228 tests passed`, `Compiled successfully` ✅
- Production: `HTTP 200` ✅

---

## 8. 참고 문서

- [Sentry Next.js Migration Guide](https://docs.sentry.io/platforms/javascript/guides/nextjs/migration/)
- [Next.js Instrumentation](https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation)
