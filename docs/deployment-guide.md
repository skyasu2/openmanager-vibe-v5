# 🚀 배포 가이드 (Vercel)

> **OpenManager Vibe v5.44.3** - Vercel 배포 가이드 (2025년 7월 2일 기준)

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

OpenManager Vibe v5는 Vercel 환경변수를 통해 Supabase, Redis, Google AI 등 다양한 서비스와 연동됩니다. 특히 OpenAI 의존성을 제거하고 Supabase RAG에 최적화된 환경변수 설정이 중요합니다.

##### 1. Vercel Dashboard에서 설정

Vercel 프로젝트 설정의 `Environment Variables` 섹션에서 다음 환경변수들을 추가합니다. 각 변수의 값은 실제 서비스에서 발급받은 키 또는 URL로 대체해야 합니다.

```bash
# Supabase 설정 (1차 점검)
NEXT_PUBLIC_SUPABASE_URL=https://vnswjnltnhpsueosfhmw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZuc3dqbmx0bmhwc3Vlb3NmaG13Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5MjMzMjcsImV4cCI6MjA2MzQ5OTMyN30.09ApSnuXNv_yYVJWQWGpOFWw3tkLbxSA21k5sroChGU

# Supabase 설정 (2차 점검 - Vercel 배포용)
ENCRYPTED_SUPABASE_URL=https://vnswjnltnhpsueosfhmw.supabase.co
ENCRYPTED_SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZuc3dqbmx0bmhwc3Vlb3NmaG13Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5MjMzMjcsImV4cCI6MjA2MzQ5OTMyN30.09ApSnuXNv_yYVJWQWGpOFWw3tkLbxSA21k5sroChGU

# RAG Engine 설정
FORCE_SUPABASE_RAG=true
RAG_VECTOR_DIMENSION=384
RAG_SIMILARITY_THRESHOLD=0.7
RAG_ENGINE_TYPE=SUPABASE_ONLY

# Google AI (선택 사항)
GOOGLE_AI_API_KEY=your_google_ai_api_key_here
GOOGLE_AI_ENABLED=true
REDIS_URL=redis://default:AbYGAAIjcDE5MjNmYjhiZDkwOGQ0MTUyOGFiZjUyMmQ0YTkyMzIwM3AxMA@charming-condor-46598.upstash.io:6379
```

##### 2. CLI로 설정 (선택사항)

Vercel CLI를 사용하여 환경변수를 설정할 수도 있습니다. 이는 대량의 환경변수를 설정할 때 유용합니다.

```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add ENCRYPTED_SUPABASE_URL
vercel env add ENCRYPTED_SUPABASE_KEY
vercel env add FORCE_SUPABASE_RAG
# 필요한 다른 환경변수들도 동일하게 추가
```

##### 3. 설정 확인

설정된 환경변수 목록은 다음 명령어로 확인할 수 있습니다.

```bash
vercel env ls
```

##### 주요 개선사항

*   **OpenAI API 의존성 완전 제거**: 프로젝트에서 OpenAI API에 대한 의존성을 완전히 제거하고 Supabase 기반 RAG 시스템으로 전환했습니다.
*   **로컬 임베딩 생성 시스템**: 자체적으로 임베딩을 생성하는 시스템을 구축하여 외부 서비스 의존성을 줄였습니다.
*   **2회 환경변수 점검 시스템**: Vercel 배포 시 환경변수가 올바르게 설정되었는지 2단계에 걸쳐 점검하는 시스템을 도입하여 안정성을 높였습니다.
*   **Supabase 벡터 DB 전용 최적화**: Supabase 벡터 데이터베이스를 활용한 RAG 시스템에 최적화된 설정을 적용했습니다.

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

## 🖥️ 운영 및 서버 관리

### 🚀 OpenManager Vibe v5 배포운영 가이드

> **완전 자동화 배포** - Vercel 최적화, 통합 완료, 적응형 모니터링

#### 📋 개요

OpenManager Vibe v5는 **완전 자동화된 배포 및 운영**을 제공하는 현대적인 서버 모니터링 플랫폼입니다. Vercel 서버리스 환경에 최적화되어 있으며, 실시간 모니터링과 자동 복구 기능을 통해 안정적인 서비스를 보장합니다.

##### ✨ 핵심 특징

- 이중 배포 시스템: Vercel (메인) + GCP (MCP 서버)
- Vercel 최적화: 서버리스 환경 완전 최적화
- 자동 CI/CD: GitHub Actions 기반 자동 배포
- 실시간 모니터링: 99.9% 가용성 보장
- 무중단 배포: Blue-Green 배포 전략

#### 🚀 배포 아키텍처 (2025년 GCP 무료 티어)

##### 📊 현재 배포 구조

- 이중 배포 시스템: Vercel (메인) + GCP (MCP 서버)

```mermaid
graph TD
    A[개발자] --> B[Git Push]
    B --> C[Vercel 배포]
    B --> D[GCP VM 배포]

    C --> E[Next.js App]
    D --> F[MCP 서버]

    E --> G[사용자]
    F --> H[GCP Infrastructure]

    G --> I[API 요청]
    I --> J[MCP 통신]
    J --> F

subgraph "Vercel 환경"
    E
    direction TB
    E --> K[Edge Runtime]
end

subgraph "GCP 무료 티어"
    F --> L[e2-micro VM]
    L --> M[Node.js MCP Server]
    M --> N[Port 10000]
end
```

##### 🏗️ 배포 환경별 세부사항

1.  **Vercel (메인 애플리케이션)**

    ```yaml
    # vercel.json 최적화 설정
    {
      'functions': { 'app/api/**/*.ts': { 'runtime': 'edge' } },
      'headers':
        [
          {
            'source': '/api/(.*)',
            'headers': [{ 'key': 'Cache-Control', 'value': 's-maxage=60' }],
          },
        ],
    }
    ```

2.  **GCP Compute Engine (MCP 서버)**

    ```bash
    # VM 설정
    인스턴스: mcp-server
    리전: us-central1-a (무료 티어)
    외부 IP: 104.154.205.25
    포트: 10000
    OS: Ubuntu 20.04 LTS
    ```

##### 🔄 자동 배포 파이프라인

```yaml
name: Deploy to Vercel and GCP

on:
  push:
    branches: [main]

jobs:
  deploy-vercel:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20

  deploy-gcp:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to GCP VM
        run: |
          # SSH를 통한 VM 업데이트
          ssh gcp-user@104.154.205.25 'cd mcp-server && git pull && npm restart'
```

##### 🔍 배포 상태 모니터링

```typescript
// 실시간 배포 상태 확인
const deploymentStatus = {
  vercel: {
    url: 'https://openmanager-vibe-v5.vercel.app',
    status: 'healthy',
    lastDeploy: '2025-07-03T13:40:00Z',
  },
  gcp: {
    url: 'http://104.154.205.25:10000',
    status: 'healthy',
    vm: 'e2-micro',
    region: 'us-central1-a',
  },
};

async function checkDeploymentHealth() {
  return Promise.all([this.checkVercelHealth(), this.checkGCPHealth()]);
}
```

### 🖥️ 서버 관리 시스템 가이드

> **OpenManager Vibe v5.44.3** - 통합 서버 관리 시스템 (2025년 7주차 개발 진행 중)

#### 📋 개요

OpenManager Vibe v5의 서버 관리 시스템은 **AI 엔진과 통합된 지능형 모니터링 플랫폼**입니다. 2025년 5월 중순부터 7주간 개발하여 현재 안정적인 서버 모니터링과 자동화된 관리 기능을 제공하고 있습니다.

#### 🎯 핵심 기능

1.  **실시간 서버 모니터링**
    -   **15개 서버 동시 모니터링**
    -   **실시간 메트릭 수집**: CPU, 메모리, 디스크 I/O, 네트워크 트래픽, 프로세스 상태

2.  **페이지 갱신 기반 상태 공유**
    -   **최적화된 상태 확인 방식**: 30초 폴링 제거 → 페이지 이벤트 기반
    -   **성능 개선 결과**: 서버 부하 90% 감소, 즉시 상태 반영, 자연스러운 상태 업데이트

3.  **Redis TTL 기반 자동 정리**
    -   **TTL 설정**: 시스템 세션 35분, 사용자 활동 5분 후 자동 만료
    -   **자동 정리 시스템**: 만료된 세션 자동 삭제, 메모리 효율성 최적화

4.  **30분 카운트다운 타이머**
    -   **클라이언트 사이드 처리**: 남은 시간 계산 및 시각적 상태 표시 (정상, 주의, 위험)

#### 🏗️ 시스템 아키텍처

##### 전체 구조

```mermaid
graph TD
    A[사용자] --> B[UnifiedProfileButton]
    B --> C[useSystemState Hook]
    C --> D[/api/system/status]
    D --> E[SystemStateManager]
    E --> F[Redis TTL Storage]

    G[페이지 이벤트] --> C
    H[CountdownTimer] --> B
    I[상태 새로고침] --> C

    F --> J[자동 정리]
    J --> K[TTL 만료]
```

##### 핵심 컴포넌트

1.  **SystemStateManager**: 시스템 상태 생성, 사용자 활동 추적
2.  **useSystemState Hook**: 페이지 이벤트 기반 상태 확인
3.  **API 엔드포인트**: `/api/system/status`를 통한 시스템 상태 조회 및 사용자 활동 추적

#### 📊 모니터링 대시보드

-   **서버 상태 카드**: 상태 표시 시스템 (색상 코딩), 실시간 메트릭 표시
-   **시스템 상태 통합 표시**: 카운트다운 타이머, 활성 사용자 수 표시

#### ⚡ 성능 최적화

-   **요청 최소화**: 30초 폴링 제거, 페이지 포커스/가시성 변경 시에만 요청
-   **메모리 효율성**: Redis TTL 기반 자동 정리, 메모리 누수 방지
-   **사용자 경험**: 즉시 상태 반영, 자연스러운 상태 전환, 직관적인 시각적 피드백

#### 🔧 개발 현황

-   **구현 완료 기능**: 실시간 서버 모니터링, 페이지 갱신 기반 상태 공유, Redis TTL 자동 정리 시스템, 30분 카운트다운 타이머, 다중 사용자 지원, 익명 사용자 ID 관리, 시각적 상태 표시, 성능 최적화.
-   **개발 진행 중**: 고급 알림 시스템, 서버 메트릭 히스토리, 자동 복구 기능, 대시보드 커스터마이징, 모바일 최적화.
-   **향후 계획**: 알림 시스템 고도화, 메트릭 히스토리 저장, 모바일 반응형 개선, 자동 복구 시스템, 고급 분석 도구, AI 기반 예측 분석, 자동 스케일링, 통합 로그 분석.

#### 📚 사용 가이드

-   **기본 사용법**: 대시보드 접속, 상태 새로고침, 카운트다운 확인, 알림 확인.
-   **고급 기능**: 서버 상세 정보, 히스토리 조회, 임계값 설정, 자동 새로고침.

#### 🛠️ 문제 해결

-   **일반적인 문제**: 상태 업데이트 안됨, 카운트다운 오류.
-   **성능 문제**: 느린 응답, 메모리 사용량 증가.

---

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
