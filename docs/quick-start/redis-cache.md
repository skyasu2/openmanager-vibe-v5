# Upstash Redis 캐싱 가이드

> 5ms 글로벌 레이턴시 | 2025년 무료 티어 확장

## 🚀 빠른 시작

### 1. Upstash Redis 생성

1. [console.upstash.com](https://console.upstash.com) 접속
2. "Create Database" → Global 선택 (5ms 레이턴시)
3. 환경 변수 복사:

```bash
# .env.local
UPSTASH_REDIS_REST_URL=https://[region]-[id].upstash.io
UPSTASH_REDIS_REST_TOKEN=AX...
```

### 2. SDK 설치

```bash
npm install @upstash/redis @upstash/ratelimit
```

### 3. Redis 클라이언트 초기화

```typescript
// lib/redis.ts
import { Redis } from '@upstash/redis';

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});
```

## 💾 캐싱 전략

### Cache-aside 패턴

```typescript
// app/api/servers/[id]/route.ts
import { redis } from '@/lib/redis';
import { supabase } from '@/lib/supabase';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const cacheKey = `server:${params.id}`;

  // 1. 캐시 확인
  const cached = await redis.get(cacheKey);
  if (cached) {
    return Response.json(cached);
  }

  // 2. DB에서 조회
  const { data, error } = await supabase
    .from('servers')
    .select('*')
    .eq('id', params.id)
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 404 });
  }

  // 3. 캐시 저장 (5분 TTL)
  await redis.set(cacheKey, data, { ex: 300 });

  return Response.json(data);
}
```

### Write-through 캐싱

```typescript
// app/api/metrics/route.ts
export async function POST(request: Request) {
  const metric = await request.json();

  // 1. DB에 저장
  const { data, error } = await supabase
    .from('metrics')
    .insert(metric)
    .select()
    .single();

  if (error) {
    return Response.json({ error }, { status: 400 });
  }

  // 2. 캐시 업데이트
  const cacheKey = `metrics:${data.server_id}:latest`;
  await redis.zadd(cacheKey, {
    score: Date.now(),
    member: JSON.stringify(data),
  });

  // 최근 100개만 유지
  await redis.zremrangebyrank(cacheKey, 0, -101);

  return Response.json(data);
}
```

## 🚦 Rate Limiting

### IP 기반 제한

```typescript
// middleware.ts
import { Ratelimit } from '@upstash/ratelimit';
import { redis } from '@/lib/redis';

const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, '1 m'), // 분당 100 요청
  analytics: true, // 분석 데이터 수집
});

export async function middleware(request: Request) {
  if (request.nextUrl.pathname.startsWith('/api')) {
    const ip = request.headers.get('x-forwarded-for') ?? '127.0.0.1';
    const { success, limit, reset, remaining } = await ratelimit.limit(ip);

    if (!success) {
      return new Response('Too Many Requests', {
        status: 429,
        headers: {
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': new Date(reset).toISOString(),
        },
      });
    }
  }
}
```

### 사용자별 제한

```typescript
// app/api/ai/query/route.ts
const userRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.fixedWindow(50, '1 h'), // 시간당 50 요청
  prefix: 'ai-query',
});

export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { success } = await userRatelimit.limit(session.user.id);
  if (!success) {
    return Response.json(
      { error: '시간당 50개 쿼리 제한을 초과했습니다.' },
      { status: 429 }
    );
  }

  // AI 쿼리 처리...
}
```

## 📊 실시간 메트릭 캐싱

### 시계열 데이터

```typescript
// lib/metrics-cache.ts
export class MetricsCache {
  private redis: Redis;

  constructor() {
    this.redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
  }

  async addMetric(serverId: string, metric: any) {
    const key = `metrics:${serverId}:${new Date().toISOString().slice(0, 10)}`;

    // Sorted Set으로 시간순 저장
    await this.redis.zadd(key, {
      score: Date.now(),
      member: JSON.stringify(metric),
    });

    // 24시간 후 자동 삭제
    await this.redis.expire(key, 86400);
  }

  async getRecentMetrics(serverId: string, minutes: number = 5) {
    const key = `metrics:${serverId}:${new Date().toISOString().slice(0, 10)}`;
    const since = Date.now() - minutes * 60 * 1000;

    const metrics = await this.redis.zrangebyscore(key, since, '+inf');
    return metrics.map(m => JSON.parse(m));
  }
}
```

## 🔐 읽기 전용 토큰 (프론트엔드)

### 안전한 클라이언트 접근

```typescript
// app/api/cache/token/route.ts
export async function GET() {
  // 읽기 전용 토큰 생성 (Upstash 콘솔에서)
  const readOnlyToken = process.env.UPSTASH_REDIS_REST_TOKEN_READONLY!;

  return Response.json({
    url: process.env.NEXT_PUBLIC_UPSTASH_REDIS_REST_URL,
    token: readOnlyToken, // 읽기만 가능
  });
}

// components/RealtimeMetrics.tsx
'use client';

import { Redis } from '@upstash/redis';
import { useEffect, useState } from 'react';

export function RealtimeMetrics({ serverId }: { serverId: string }) {
  const [metrics, setMetrics] = useState([]);

  useEffect(() => {
    const fetchMetrics = async () => {
      const { url, token } = await fetch('/api/cache/token').then(r => r.json());
      const redis = new Redis({ url, token });

      // 읽기 전용 작업만 가능
      const data = await redis.get(`metrics:${serverId}:latest`);
      setMetrics(data || []);
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 5000); // 5초마다

    return () => clearInterval(interval);
  }, [serverId]);

  return <MetricsChart data={metrics} />;
}
```

## 🎯 무료 티어 최적화

### 2025년 확장된 무료 티어

- **월 500K 명령**: 기존 10K/일에서 대폭 증가
- **256MB 저장소**: 충분한 캐시 공간
- **글로벌 복제**: 5ms 레이턴시 보장

### 효율적인 사용 전략

```typescript
// 1. 배치 명령 사용
const pipeline = redis.pipeline();
pipeline.get('key1');
pipeline.get('key2');
pipeline.get('key3');
const results = await pipeline.exec();

// 2. JSON 압축
import { compress, decompress } from 'lz-string';

await redis.set('large-data', compress(JSON.stringify(data)));
const compressed = await redis.get('large-data');
const data = JSON.parse(decompress(compressed));

// 3. 적절한 TTL 설정
await redis.set('temp-data', value, { ex: 300 }); // 5분
await redis.set('session', value, { ex: 3600 }); // 1시간
```

## 🔗 유용한 링크

- [Upstash Redis 문서](https://upstash.com/docs/redis)
- [SDK 가이드](https://upstash.com/docs/redis/sdks/ts/overview)
- [무료 티어 정보](https://upstash.com/pricing)
- [Rate Limiting 가이드](https://upstash.com/docs/redis/sdks/ratelimit-ts)

## 💡 실무 팁

1. **Global 리전 선택**: 한국 사용자를 위한 최적 성능
2. **파이프라인 활용**: 여러 명령을 한 번에 실행
3. **TTL 필수**: 모든 캐시에 만료 시간 설정
4. **모니터링**: Upstash 콘솔에서 실시간 사용량 확인

---

마지막 업데이트: 2025-07-28 | [전체 문서 보기](https://upstash.com/docs)
