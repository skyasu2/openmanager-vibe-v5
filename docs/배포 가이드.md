# 🚀 배포 가이드 (Vercel)

> **OpenManager Vibe v5.44.4** - Vercel 배포 가이드 (2025년 7월 2일 기준)

## 📋 **개요**

OpenManager Vibe v5는 **Vercel 서버리스 환경**에 최적화된 AI 엔진 통합 서버 관리 플랫폼입니다. 2025년 상반기 개발 과정에서 Vercel의 최신 기능들을 활용하여 안정적이고 효율적인 배포 환경을 구축했습니다.

## 🎯 **Vercel 최적화 특징**

### **서버리스 아키텍처**

- **Edge Functions**: 전 세계 빠른 응답
- **Automatic Scaling**: 트래픽에 따른 자동 확장
- **Zero Cold Start**: 최적화된 부팅 시간
- **Memory Optimization**: 메모리 효율적 사용

### **AI 엔진 최적화**

- **Streaming Responses**: 실시간 AI 응답 스트리밍
- **Caching Strategy**: Redis 기반 지능형 캐싱
- **Request Batching**: 효율적인 요청 처리
- **Error Handling**: 견고한 오류 처리

## 🚀 **배포 과정**

### **1. 프로젝트 준비**

```bash
# 저장소 클론
git clone https://github.com/your-org/openmanager-vibe-v5.git
cd openmanager-vibe-v5

# 의존성 설치
npm install

# 로컬 테스트
npm run build
npm run dev
```

### **2. Vercel 설정**

#### **vercel.json 설정**

```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "functions": {
    "src/app/api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "env": {
    "NODE_ENV": "production"
  },
  "regions": ["icn1", "hnd1", "sin1"]
}
```

#### **환경 변수 설정**

```env
# AI 엔진 설정
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_key
GOOGLE_AI_API_KEY=your_google_ai_key

# Redis 설정 (Upstash)
UPSTASH_REDIS_REST_URL=your_redis_url
UPSTASH_REDIS_REST_TOKEN=your_redis_token

# 기타 설정
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
NODE_ENV=production
```

### **3. 배포 실행**

```bash
# Vercel CLI 설치
npm install -g vercel

# 로그인
vercel login

# 프로젝트 연결
vercel link

# 배포
vercel --prod
```

## ⚡ **성능 최적화**

### **빌드 최적화**

#### **Next.js 설정 (next.config.js)**

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // 번들 최적화
  experimental: {
    serverComponentsExternalPackages: ['@supabase/supabase-js'],
  },

  // 이미지 최적화
  images: {
    domains: ['your-domain.com'],
    formats: ['image/webp', 'image/avif'],
  },

  // 압축 설정
  compress: true,

  // 정적 최적화
  output: 'standalone',

  // 환경 변수
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
};

module.exports = nextConfig;
```

#### **Webpack 최적화**

```javascript
// webpack.config.js
module.exports = {
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
        },
      },
    },
  },
};
```

### **런타임 최적화**

#### **메모리 관리**

```typescript
// 메모리 효율적인 AI 엔진 로딩
export class OptimizedAIEngine {
  private static instance: OptimizedAIEngine;

  static getInstance(): OptimizedAIEngine {
    if (!this.instance) {
      this.instance = new OptimizedAIEngine();
    }
    return this.instance;
  }

  async processWithMemoryLimit(query: string): Promise<string> {
    // 메모리 사용량 모니터링
    const memoryUsage = process.memoryUsage();
    if (memoryUsage.heapUsed > 200 * 1024 * 1024) {
      // 200MB 제한
      await this.clearCache();
    }

    return this.processQuery(query);
  }
}
```

#### **캐싱 전략**

```typescript
// Redis 기반 지능형 캐싱
export class VercelCacheManager {
  async getCachedResponse(key: string): Promise<string | null> {
    try {
      return await redis.get(key);
    } catch (error) {
      console.warn('Cache miss:', error);
      return null;
    }
  }

  async setCachedResponse(
    key: string,
    value: string,
    ttl: number = 300
  ): Promise<void> {
    try {
      await redis.setex(key, ttl, value);
    } catch (error) {
      console.warn('Cache set failed:', error);
    }
  }
}
```

## 🔧 **개발 환경 설정**

### **로컬 개발**

```bash
# 개발 서버 시작
npm run dev

# 타입 체크
npm run type-check

# 린트 검사
npm run lint

# 테스트 실행
npm test

# 빌드 테스트
npm run build
```

### **환경 분리**

#### **.env.local (로컬 개발)**

```env
# 로컬 개발용 설정
NEXT_PUBLIC_APP_ENV=development
NEXT_PUBLIC_API_URL=http://localhost:3000/api

# 목업 모드 (선택사항)
FORCE_MOCK_REDIS=true
FORCE_MOCK_GOOGLE_AI=true
```

#### **.env.production (프로덕션)**

```env
# 프로덕션 설정
NEXT_PUBLIC_APP_ENV=production
NEXT_PUBLIC_API_URL=https://your-app.vercel.app/api

# 실제 서비스 연동
FORCE_MOCK_REDIS=false
FORCE_MOCK_GOOGLE_AI=false
```

## 📊 **모니터링 및 분석**

### **Vercel Analytics**

```typescript
// 성능 모니터링
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
```

### **커스텀 메트릭**

```typescript
// 커스텀 성능 지표
export class PerformanceMonitor {
  static trackAIResponse(mode: string, duration: number): void {
    if (typeof window !== 'undefined') {
      // Vercel Analytics로 전송
      window.va?.track('ai_response', {
        mode,
        duration,
        timestamp: Date.now(),
      });
    }
  }

  static trackError(error: Error, context: string): void {
    if (typeof window !== 'undefined') {
      window.va?.track('error', {
        message: error.message,
        context,
        timestamp: Date.now(),
      });
    }
  }
}
```

## 🛠️ **배포 자동화**

### **GitHub Actions**

```yaml
# .github/workflows/deploy.yml
name: Deploy to Vercel

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Build project
        run: npm run build

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```

### **배포 스크립트**

```bash
#!/bin/bash
# deploy.sh

echo "🚀 OpenManager Vibe v5 배포 시작..."

# 테스트 실행
echo "📋 테스트 실행 중..."
npm test
if [ $? -ne 0 ]; then
  echo "❌ 테스트 실패. 배포를 중단합니다."
  exit 1
fi

# 빌드 실행
echo "🔨 빌드 실행 중..."
npm run build
if [ $? -ne 0 ]; then
  echo "❌ 빌드 실패. 배포를 중단합니다."
  exit 1
fi

# Vercel 배포
echo "🌐 Vercel 배포 중..."
vercel --prod
if [ $? -eq 0 ]; then
  echo "✅ 배포 완료!"
else
  echo "❌ 배포 실패."
  exit 1
fi
```

## 🔍 **문제 해결**

### **일반적인 문제**

#### **빌드 실패**

```bash
# 캐시 정리
npm cache clean --force
rm -rf node_modules
rm -rf .next
npm install

# 타입 오류 확인
npm run type-check

# 린트 오류 확인
npm run lint
```

#### **배포 실패**

```bash
# Vercel 로그 확인
vercel logs

# 환경 변수 확인
vercel env ls

# 프로젝트 재연결
vercel link
```

#### **성능 문제**

```javascript
// 번들 분석
npm install -g @next/bundle-analyzer
ANALYZE=true npm run build

// 메모리 사용량 확인
node --inspect-brk server.js
```

### **AI 엔진 관련 문제**

#### **응답 시간 지연**

```typescript
// 타임아웃 설정
export const AI_CONFIG = {
  timeout: 30000, // 30초
  retries: 3,
  backoff: 1000, // 1초
};

// 타임아웃 처리
export async function processWithTimeout<T>(
  promise: Promise<T>,
  timeout: number
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Timeout')), timeout)
    ),
  ]);
}
```

#### **메모리 부족**

```typescript
// 스트리밍 처리
export async function* streamAIResponse(query: string) {
  const chunks = await processInChunks(query);
  for (const chunk of chunks) {
    yield chunk;
  }
}

// 메모리 정리
export function cleanupAIEngine(): void {
  if (global.gc) {
    global.gc();
  }
}
```

## 📚 **참고 자료**

### **공식 문서**

- [Vercel 공식 문서](https://vercel.com/docs)
- [Next.js 배포 가이드](https://nextjs.org/docs/deployment)
- [Vercel Edge Functions](https://vercel.com/docs/functions/edge-functions)

### **최적화 가이드**

- [Next.js 성능 최적화](https://nextjs.org/docs/advanced-features/measuring-performance)
- [Vercel 성능 모니터링](https://vercel.com/docs/analytics)

### **문제 해결**

- [Vercel 문제 해결 가이드](https://vercel.com/docs/troubleshooting)
- [Next.js 디버깅](https://nextjs.org/docs/advanced-features/debugging)

## 🎯 **현재 배포 상태**

### **프로덕션 환경**

- **URL**: <https://openmanager-vibe-v5.vercel.app>
- **상태**: 안정적 운영 중
- **성능**: 평균 응답 시간 620ms (LOCAL) / 1200ms (GOOGLE_AI)
- **가용성**: 99.5%

### **개발 환경**

- **브랜치**: main (자동 배포)
- **미리보기**: PR별 자동 배포
- **테스트**: 569개 테스트 통과

---

> **배포 현황**: 2025년 7월 2일 기준, Vercel 환경에서 안정적으로 운영 중이며, 지속적인 성능 최적화를 통해 더 나은 사용자 경험을 제공하고 있습니다. 🚀
