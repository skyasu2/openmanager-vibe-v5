# Vercel Edge Runtime 핵심 가이드

> 2025년 최신 기능 포함 | 실무 코드 중심

## 🚀 빠른 시작

### 1. Edge Runtime 설정

```typescript
// app/api/edge-example/route.ts
export const runtime = 'edge'; // Edge Runtime 활성화
export const dynamic = 'force-dynamic'; // 동적 렌더링

export async function GET(request: Request) {
  return new Response('Hello from Edge!', {
    headers: { 'content-type': 'text/plain' },
  });
}
```

### 2. Fluid Compute (2025 신기능)

**85% 비용 절감 + 자동 스케일링**

```typescript
// vercel.json
{
  "functions": {
    "app/api/ai/route.ts": {
      "runtime": "edge",
      "fluidCompute": true,      // Fluid Compute 활성화
      "maxDuration": 300,         // 최대 5분
      "memory": 3009              // 3GB 메모리
    }
  }
}
```

### 3. Active CPU 가격 모델

실제 실행 시간만 과금 (대기 시간 무료)

```typescript
// app/api/background/route.ts
export async function POST(request: Request) {
  // 긴 처리 작업도 실제 CPU 사용 시간만 과금
  const result = await processLargeDataset();

  // 대기 시간 (DB 쿼리, API 호출)은 무료
  await fetch('https://api.example.com/webhook', {
    method: 'POST',
    body: JSON.stringify(result),
  });

  return Response.json({ success: true });
}
```

## 🌍 Region Preference

데이터 위치에 가까운 Edge Function 배포

```typescript
// app/api/users/[id]/route.ts
export const preferredRegion = 'icn1'; // 서울 리전 우선
export const runtime = 'edge';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  // Supabase 서울 리전 데이터베이스와 통신
  const user = await supabase
    .from('users')
    .select('*')
    .eq('id', params.id)
    .single();

  return Response.json(user);
}
```

## ⚡ 성능 최적화

### 스트리밍 응답

```typescript
// app/api/stream/route.ts
export const runtime = 'edge';

export async function GET() {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      for (let i = 0; i < 5; i++) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        controller.enqueue(encoder.encode(`data: ${i}\n\n`));
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
    },
  });
}
```

### Edge Config 활용

```typescript
// app/api/config/route.ts
import { get } from '@vercel/edge-config';

export const runtime = 'edge';

export async function GET() {
  const featureFlags = await get('featureFlags');

  return Response.json({
    flags: featureFlags,
    cached: true, // Edge Config는 자동 캐싱
  });
}
```

## 🛡️ 보안 설정

### Rate Limiting

```typescript
// middleware.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Memory Cache } from '@upstash/memory cache';

const ratelimit = new Ratelimit({
  memory cache: Memory Cache.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'),
});

export async function middleware(request: Request) {
  const ip = request.headers.get('x-forwarded-for') ?? '127.0.0.1';
  const { success } = await ratelimit.limit(ip);

  if (!success) {
    return new Response('Too Many Requests', { status: 429 });
  }
}

export const config = {
  matcher: '/api/:path*',
};
```

## 📊 모니터링

### Function Logs

```bash
# 실시간 로그 확인
vercel logs --follow

# 특정 함수 로그
vercel logs --filter="path:/api/edge-example"
```

### 성능 지표

```typescript
// app/api/metrics/route.ts
export const runtime = 'edge';

export async function GET() {
  const startTime = Date.now();

  // 작업 수행
  const result = await performTask();

  // 메트릭 전송
  await fetch('https://api.vercel.com/v1/metrics', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.VERCEL_TOKEN}`,
    },
    body: JSON.stringify({
      name: 'edge-function-duration',
      value: Date.now() - startTime,
      tags: { function: 'metrics' },
    }),
  });

  return Response.json(result);
}
```

## 🔗 유용한 링크

- [Vercel 공식 문서](https://vercel.com/docs)
- [Edge Runtime API](https://vercel.com/docs/functions/edge-runtime)
- [Fluid Compute 가이드](https://vercel.com/docs/functions/fluid-compute)
- [가격 계산기](https://vercel.com/pricing)

## 💡 실무 팁

1. **Cold Start 최소화**: Edge Runtime은 Node.js보다 10배 빠른 시작
2. **메모리 효율**: Fluid Compute로 필요시만 메모리 확장
3. **글로벌 배포**: 자동으로 300ms 이내 응답 보장
4. **무료 티어**: 월 100GB 대역폭, 1M 요청 포함

---

마지막 업데이트: 2025-07-28 | [전체 문서 보기](https://vercel.com/docs)
