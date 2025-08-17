# 💰 무료 티어 최적화 가이드

> Vercel + Supabase + GCP 무료 티어 100% 활용

## 🎯 개요

OpenManager VIBE v5를 무료 티어만으로 완벽 운영하는 최적화 전략입니다.

## 🆓 무료 티어 현황

### Vercel (프론트엔드)

- **함수 호출**: 100GB 대역폭
- **배포**: 무제한
- **사용률**: 30% (70GB 여유)

### Supabase (데이터베이스)

- **데이터베이스**: 500MB 저장소
- **대역폭**: 5GB/월
- **사용률**: 3% (485MB 여유)

### GCP (백엔드)

- **Compute Engine**: e2-micro (1개월 무료)
- **Cloud Functions**: 2M 요청/월
- **사용률**: 15% (1.7M 요청 여유)

## ⚡ 최적화 전략

### 1. 번들 크기 최적화

```typescript
// next.config.js
const nextConfig = {
  experimental: {
    appDir: true,
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },
  webpack: (config) => {
    config.optimization.splitChunks = {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
        },
      },
    };
    return config;
  },
};
```

### 2. 데이터베이스 최적화

```sql
-- 인덱스 최적화
CREATE INDEX CONCURRENTLY idx_users_created_at ON users(created_at);
CREATE INDEX CONCURRENTLY idx_servers_status ON servers(status) WHERE status = 'active';

-- 파티셔닝으로 성능 향상
CREATE TABLE server_metrics_2025_08 PARTITION OF server_metrics
FOR VALUES FROM ('2025-08-01') TO ('2025-09-01');
```

### 3. 캐싱 전략

```typescript
// 메모리 캐시 (Upstash Redis 무료 티어)
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// API 응답 캐싱
export const cachedApiCall = async (
  key: string,
  fetcher: () => Promise<any>
) => {
  const cached = await redis.get(key);
  if (cached) return cached;

  const data = await fetcher();
  await redis.setex(key, 300, JSON.stringify(data)); // 5분 캐시
  return data;
};
```

## 📊 비용 모니터링

### 실시간 사용량 추적

```typescript
// lib/usage-tracker.ts
export const trackUsage = async () => {
  const usage = {
    vercel: await getVercelUsage(),
    supabase: await getSupabaseUsage(),
    gcp: await getGCPUsage(),
    timestamp: new Date().toISOString(),
  };

  // 80% 임계점 경고
  Object.entries(usage).forEach(([service, data]) => {
    if (data.percentage > 80) {
      console.warn(`⚠️ ${service} usage: ${data.percentage}%`);
    }
  });

  return usage;
};
```

### 자동 알림 설정

```typescript
// 일일 사용량 리포트
export const dailyUsageReport = async () => {
  const usage = await trackUsage();

  if (
    usage.vercel.percentage > 70 ||
    usage.supabase.percentage > 70 ||
    usage.gcp.percentage > 70
  ) {
    // Discord/Slack 알림
    await sendAlert({
      title: '⚠️ 무료 티어 사용량 경고',
      usage: usage,
      recommendations: generateOptimizations(usage),
    });
  }
};
```

## 🚀 성능 최적화

### 1. Edge Functions 활용

```typescript
// app/api/health/route.ts (Vercel Edge)
export const runtime = 'edge';

export async function GET() {
  const healthData = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    region: process.env.VERCEL_REGION,
    edge: true,
  };

  return Response.json(healthData, {
    headers: {
      'Cache-Control': 's-maxage=60, stale-while-revalidate=300',
    },
  });
}
```

### 2. 이미지 최적화

```typescript
// next.config.js
const nextConfig = {
  images: {
    domains: ['your-domain.com'],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 31536000, // 1년
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
  },
};
```

### 3. 프리렌더링 최적화

```typescript
// app/page.tsx
export const revalidate = 3600; // 1시간

export default async function Page() {
  const staticData = await getStaticData();

  return (
    <div>
      <StaticContent data={staticData} />
      <ClientComponent />
    </div>
  );
}
```

## 📈 확장성 계획

### 단계별 확장 전략

```typescript
// 무료 → 유료 전환 임계점
const USAGE_THRESHOLDS = {
  vercel: {
    warning: 70, // 70GB
    critical: 90, // 90GB
    upgrade: 95, // 95GB
  },
  supabase: {
    warning: 400, // 400MB
    critical: 450, // 450MB
    upgrade: 480, // 480MB
  },
  gcp: {
    warning: 1600000, // 1.6M requests
    critical: 1800000, // 1.8M requests
    upgrade: 1900000, // 1.9M requests
  },
};
```

### 자동 스케일링 준비

```typescript
// 사용량 기반 기능 제한
export const featureGating = (usage: UsageData) => {
  if (usage.supabase.percentage > 80) {
    return {
      enableFileUploads: false,
      enableRealTimeSync: false,
      maxUsersPerOrg: 10,
    };
  }

  return {
    enableFileUploads: true,
    enableRealTimeSync: true,
    maxUsersPerOrg: 50,
  };
};
```

## 🔧 운영 도구

### 1. 사용량 대시보드

```bash
# 간단한 CLI 도구
npm run usage:check    # 현재 사용량 확인
npm run usage:report   # 상세 리포트 생성
npm run usage:alert    # 임계점 알림 테스트
```

### 2. 자동화 스크립트

```bash
#!/bin/bash
# scripts/optimize-free-tier.sh

echo "🔍 무료 티어 최적화 실행..."

# 1. 번들 크기 분석
npm run analyze

# 2. 데이터베이스 정리
npm run db:cleanup

# 3. 캐시 정리
npm run cache:clear

# 4. 사용량 확인
npm run usage:check

echo "✅ 최적화 완료!"
```

## 📚 관련 문서

### 배포 관련

- **[Vercel 배포](./vercel-deployment.md)**
- **[GCP 배포](./gcp-deployment.md)**

### 성능 최적화

- **[API 최적화](../performance/api-optimization-guide.md)**
- **[메모리 최적화](../performance/memory-optimization-guide.md)**

### 모니터링

- **[시스템 모니터링](../monitoring/system-status-monitoring-guide.md)**

---

> **💡 팁**: 무료 티어 한계에 도달하기 전에 최적화를 진행하세요!
