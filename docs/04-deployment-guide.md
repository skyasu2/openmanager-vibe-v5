# 🚀 OpenManager Vibe V5 배포 가이드

> 배포 프로세스, 환경 설정, 성능 최적화 완전 가이드

## 📋 목차

1. [배포 환경 개요](#배포-환경-개요)
2. [Vercel 배포](#vercel-배포)
3. [환경 변수 설정](#환경-변수-설정)
4. [데이터베이스 설정](#데이터베이스-설정)
5. [성능 모니터링](#성능-모니터링)
6. [CI/CD 설정](#cicd-설정)
7. [보안 설정](#보안-설정)
8. [트러블슈팅](#트러블슈팅)

---

## 🌐 배포 환경 개요

### 아키텍처

```
                    ┌─────────────────┐
                    │   🌍 Vercel     │
                    │   (Frontend +   │
                    │   Serverless)   │
                    └─────────┬───────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ 🗄️ Supabase  │    │ 📦 Upstash   │    │ 📊 Vercel    │
│ (Database)   │    │ Redis        │    │ Analytics    │
│              │    │ (Cache)      │    │              │
└──────────────┘    └──────────────┘    └──────────────┘
```

### 배포 전략

- **플랫폼**: Vercel (서버리스)
- **데이터베이스**: Supabase (PostgreSQL)
- **캐시**: Upstash Redis
- **모니터링**: Vercel Analytics + 커스텀 대시보드
- **배포 방식**: Git 기반 자동 배포
- **환경 분리**: Production, Preview, Development

---

## 🚀 Vercel 배포

### 1. Vercel 계정 설정

```bash
# Vercel CLI 설치
npm i -g vercel

# 로그인
vercel login

# 프로젝트 연결
vercel
```

### 2. vercel.json 설정

```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm install",
  "devCommand": "npm run dev",
  "regions": ["icn1", "hnd1"],
  "functions": {
    "src/app/api/**/*.ts": {
      "maxDuration": 10
    }
  },
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "*"
        },
        {
          "key": "Access-Control-Allow-Methods",
          "value": "GET, POST, PUT, DELETE, OPTIONS"
        },
        {
          "key": "Access-Control-Allow-Headers",
          "value": "X-Requested-With, Content-Type, Authorization"
        }
      ]
    }
  ],
  "rewrites": [
    {
      "source": "/api/v1/(.*)",
      "destination": "/api/$1"
    }
  ],
  "redirects": [
    {
      "source": "/docs",
      "destination": "/docs/01-project-guide",
      "permanent": true
    }
  ]
}
```

### 3. Next.js 설정 최적화

```typescript
// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  
  // 성능 최적화
  experimental: {
    optimizeCss: true,
    optimizeServerReact: true,
    turbotrace: {
      logLevel: 'error'
    }
  },

  // 이미지 최적화
  images: {
    domains: ['localhost', 'your-domain.vercel.app'],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384]
  },

  // 압축 설정
  compress: true,

  // PWA 설정 (선택사항)
  pwa: {
    dest: 'public',
    register: true,
    skipWaiting: true
  },

  // 보안 헤더
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          }
        ]
      }
    ];
  }
};

export default nextConfig;
```

### 4. 배포 커맨드

```bash
# 프로덕션 배포
vercel --prod

# 프리뷰 배포
vercel

# 로컬에서 프로덕션 환경 테스트
vercel dev
```

---

## ⚙️ 환경 변수 설정

### 1. Vercel 환경 변수

```bash
# Vercel 대시보드에서 설정하거나 CLI로 설정
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add UPSTASH_REDIS_REST_URL
vercel env add UPSTASH_REDIS_REST_TOKEN
vercel env add NEXTAUTH_SECRET
vercel env add NEXTAUTH_URL
vercel env add OPENAI_API_KEY
```

### 2. 환경별 설정

#### Production 환경
```bash
# .env.production
NEXT_PUBLIC_APP_ENV=production
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-redis-token
NEXTAUTH_SECRET=your-super-secret-key
NEXTAUTH_URL=https://your-domain.vercel.app
OPENAI_API_KEY=your-openai-key
```

#### Development 환경
```bash
# .env.local
NEXT_PUBLIC_APP_ENV=development
NEXT_PUBLIC_SUPABASE_URL=https://your-dev-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-dev-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-dev-service-role-key
UPSTASH_REDIS_REST_URL=https://your-dev-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-dev-redis-token
NEXTAUTH_SECRET=development-secret
NEXTAUTH_URL=http://localhost:3000
OPENAI_API_KEY=your-openai-key
```

### 3. 환경 변수 검증

```typescript
// src/lib/env.ts
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  UPSTASH_REDIS_REST_URL: z.string().url(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1),
  NEXTAUTH_SECRET: z.string().min(32),
  NEXTAUTH_URL: z.string().url(),
  OPENAI_API_KEY: z.string().min(1).optional(),
});

export const env = envSchema.parse(process.env);
```

---

## 🗄️ 데이터베이스 설정

### 1. Supabase 프로젝트 생성

```sql
-- 서버 테이블
CREATE TABLE servers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'healthy',
  type VARCHAR(50) NOT NULL,
  location VARCHAR(100),
  metrics JSONB,
  uptime INTEGER DEFAULT 0,
  last_update TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  configuration JSONB,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 메트릭 테이블
CREATE TABLE metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  server_id UUID REFERENCES servers(id) ON DELETE CASCADE,
  cpu DECIMAL(5,2),
  memory DECIMAL(5,2),
  disk DECIMAL(5,2),
  network DECIMAL(5,2),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 알림 테이블
CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  severity VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  server_id UUID REFERENCES servers(id) ON DELETE CASCADE,
  metric_type VARCHAR(50),
  threshold DECIMAL(5,2),
  current_value DECIMAL(5,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- 인덱스 추가
CREATE INDEX idx_servers_status ON servers(status);
CREATE INDEX idx_servers_type ON servers(type);
CREATE INDEX idx_metrics_server_timestamp ON metrics(server_id, timestamp);
CREATE INDEX idx_alerts_status ON alerts(status);
CREATE INDEX idx_alerts_server ON alerts(server_id);
```

### 2. RLS (Row Level Security) 설정

```sql
-- RLS 활성화
ALTER TABLE servers ENABLE ROW LEVEL SECURITY;
ALTER TABLE metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

-- 정책 설정
CREATE POLICY "Users can view servers" ON servers
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can view metrics" ON metrics
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can view alerts" ON alerts
  FOR SELECT USING (auth.role() = 'authenticated');
```

### 3. 데이터베이스 마이그레이션

```typescript
// src/lib/migrations/001_initial.sql
export const migration001 = `
  -- 서버 데이터 초기화
  INSERT INTO servers (name, type, location, status, metrics) VALUES
  ('api-useast-001', 'api', 'US-East', 'healthy', '{"cpu": 45.2, "memory": 67.8, "disk": 52.1, "network": 23.4}'),
  ('db-eucentral-003', 'database', 'EU-Central', 'warning', '{"cpu": 78.5, "memory": 82.1, "disk": 65.3, "network": 45.7}'),
  ('web-apseoul-005', 'web', 'AP-Seoul', 'critical', '{"cpu": 91.2, "memory": 89.4, "disk": 76.8, "network": 67.3}');
`;
```

---

## 📊 성능 모니터링

### 1. Vercel Analytics 설정

```tsx
// src/app/layout.tsx
import { Analytics } from '@vercel/analytics/react';

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
      </body>
    </html>
  );
}
```

### 2. 커스텀 메트릭 추가

```typescript
// src/lib/analytics.ts
export class PerformanceMonitor {
  static trackPageLoad(pageName: string) {
    if (typeof window !== 'undefined') {
      const loadTime = performance.now();
      
      // Vercel Analytics로 전송
      window.va?.track('page_load', {
        page: pageName,
        load_time: loadTime
      });

      // 커스텀 메트릭 저장
      this.saveMetric('page_load', {
        page: pageName,
        load_time: loadTime,
        timestamp: new Date().toISOString()
      });
    }
  }

  static trackAPICall(endpoint: string, duration: number, status: number) {
    window.va?.track('api_call', {
      endpoint,
      duration,
      status
    });
  }

  private static async saveMetric(type: string, data: any) {
    try {
      await fetch('/api/metrics/custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, data })
      });
    } catch (error) {
      console.error('Failed to save metric:', error);
    }
  }
}
```

### 3. 실시간 성능 모니터링

```typescript
// src/lib/monitoring.ts
export class RealTimeMonitor {
  private static instance: RealTimeMonitor;
  private metrics: Map<string, any> = new Map();

  static getInstance() {
    if (!this.instance) {
      this.instance = new RealTimeMonitor();
    }
    return this.instance;
  }

  startMonitoring() {
    // CPU 사용률 모니터링 (브라우저 환경)
    this.monitorCPU();
    
    // 메모리 사용률 모니터링
    this.monitorMemory();
    
    // 네트워크 성능 모니터링
    this.monitorNetwork();
  }

  private monitorCPU() {
    setInterval(() => {
      if ('performance' in window && 'now' in performance) {
        const start = performance.now();
        // CPU 집약적 작업 시뮬레이션
        for (let i = 0; i < 100000; i++) {
          Math.random();
        }
        const duration = performance.now() - start;
        
        this.metrics.set('cpu_performance', {
          score: Math.max(0, 100 - duration),
          timestamp: Date.now()
        });
      }
    }, 5000);
  }

  private monitorMemory() {
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory;
        this.metrics.set('memory_usage', {
          used: memory.usedJSHeapSize,
          total: memory.totalJSHeapSize,
          limit: memory.jsHeapSizeLimit,
          percentage: (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100,
          timestamp: Date.now()
        });
      }, 5000);
    }
  }

  private monitorNetwork() {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      setInterval(() => {
        this.metrics.set('network_info', {
          downlink: connection.downlink,
          effectiveType: connection.effectiveType,
          rtt: connection.rtt,
          timestamp: Date.now()
        });
      }, 10000);
    }
  }

  getMetrics() {
    return Object.fromEntries(this.metrics);
  }
}
```

### 4. 성능 대시보드

```tsx
// src/components/PerformanceDashboard.tsx
export default function PerformanceDashboard() {
  const [metrics, setMetrics] = useState<any>({});

  useEffect(() => {
    const monitor = RealTimeMonitor.getInstance();
    monitor.startMonitoring();

    const interval = setInterval(() => {
      setMetrics(monitor.getMetrics());
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="performance-dashboard">
      <div className="metric-card">
        <h3>CPU Performance</h3>
        <div className="metric-value">
          {metrics.cpu_performance?.score?.toFixed(1) || 'N/A'}%
        </div>
      </div>
      
      <div className="metric-card">
        <h3>Memory Usage</h3>
        <div className="metric-value">
          {metrics.memory_usage?.percentage?.toFixed(1) || 'N/A'}%
        </div>
      </div>
      
      <div className="metric-card">
        <h3>Network Quality</h3>
        <div className="metric-value">
          {metrics.network_info?.effectiveType || 'Unknown'}
        </div>
      </div>
    </div>
  );
}
```

---

## 🔄 CI/CD 설정

### 1. GitHub Actions 워크플로우

```yaml
# .github/workflows/deploy.yml
name: Deploy to Vercel

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
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
      
      - name: Run type check
        run: npm run type-check
      
      - name: Run linter
        run: npm run lint
      
      - name: Run tests
        run: npm run test
      
      - name: Build application
        run: npm run build

  deploy-preview:
    needs: test
    runs-on: ubuntu-latest
    if: github.event_name == 'pull_request'
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy to Vercel (Preview)
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}

  deploy-production:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy to Vercel (Production)
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

### 2. 코드 품질 검사

```yaml
# .github/workflows/quality.yml
name: Code Quality

on: [push, pull_request]

jobs:
  quality:
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
      
      - name: Run ESLint
        run: npm run lint -- --format=json --output-file=eslint-report.json
      
      - name: Run TypeScript compiler
        run: npm run type-check
      
      - name: Run Prettier check
        run: npm run prettier:check
      
      - name: Upload ESLint report
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: eslint-report
          path: eslint-report.json
```

### 3. 자동화된 테스트

```typescript
// src/__tests__/api/servers.test.ts
import { createMocks } from 'node-mocks-http';
import handler from '@/app/api/servers/route';

describe('/api/servers', () => {
  it('GET - returns servers list', async () => {
    const { req, res } = createMocks({
      method: 'GET',
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const data = JSON.parse(res._getData());
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data.servers)).toBe(true);
  });
});
```

---

## 🔐 보안 설정

### 1. 환경 보안

```typescript
// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // API 키 검증
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const token = request.headers.get('authorization');
    const apiKey = request.headers.get('x-api-key');
    
    if (!token && !apiKey) {
      return new Response('Unauthorized', { status: 401 });
    }
  }

  // CORS 설정
  const response = NextResponse.next();
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  return response;
}

export const config = {
  matcher: ['/api/:path*']
};
```

### 2. JWT 토큰 검증

```typescript
// src/lib/auth.ts
import jwt from 'jsonwebtoken';

export function verifyToken(token: string) {
  try {
    const decoded = jwt.verify(token.replace('Bearer ', ''), process.env.NEXTAUTH_SECRET!);
    return decoded;
  } catch (error) {
    throw new Error('Invalid token');
  }
}

export function generateToken(payload: any) {
  return jwt.sign(payload, process.env.NEXTAUTH_SECRET!, {
    expiresIn: '1h'
  });
}
```

### 3. 입력 검증

```typescript
// src/lib/validation.ts
import { z } from 'zod';

export const serverSchema = z.object({
  name: z.string().min(3).max(50),
  type: z.enum(['api', 'database', 'web', 'cache']),
  location: z.string().optional(),
  configuration: z.object({
    os: z.string(),
    cores: z.number().min(1).max(64),
    ram: z.string(),
    disk: z.string()
  }).optional(),
  tags: z.array(z.string()).optional()
});

export function validateServer(data: unknown) {
  return serverSchema.parse(data);
}
```

---

## 🔧 트러블슈팅

### 1. 배포 실패 해결

```bash
# 빌드 오류 확인
npm run build
npm run type-check
npm run lint

# Vercel 로그 확인
vercel logs

# 캐시 클리어
vercel --force
```

### 2. 성능 이슈 해결

```typescript
// 번들 분석
// package.json
{
  "scripts": {
    "analyze": "ANALYZE=true npm run build"
  }
}

// next.config.ts
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true'
});

module.exports = withBundleAnalyzer(nextConfig);
```

### 3. 데이터베이스 연결 이슈

```typescript
// src/lib/db-health.ts
export async function checkDatabaseHealth() {
  try {
    const { data, error } = await supabase
      .from('servers')
      .select('count')
      .limit(1);
    
    if (error) throw error;
    
    return { status: 'healthy', timestamp: new Date() };
  } catch (error) {
    return { 
      status: 'unhealthy', 
      error: error.message, 
      timestamp: new Date() 
    };
  }
}
```

### 4. 모니터링 설정

```typescript
// src/lib/alerting.ts
export class AlertManager {
  static async sendAlert(alert: {
    title: string;
    message: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
  }) {
    // Slack 알림
    if (process.env.SLACK_WEBHOOK_URL) {
      await fetch(process.env.SLACK_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `🚨 ${alert.title}`,
          attachments: [{
            color: this.getSeverityColor(alert.severity),
            text: alert.message
          }]
        })
      });
    }

    // 이메일 알림 (선택사항)
    if (process.env.EMAIL_API_KEY) {
      // 이메일 발송 로직
    }
  }

  private static getSeverityColor(severity: string) {
    switch (severity) {
      case 'critical': return 'danger';
      case 'high': return 'warning';
      case 'medium': return 'good';
      default: return '#36a64f';
    }
  }
}
```

---

## 📈 성능 최적화 체크리스트

### ✅ 프론트엔드 최적화
- [x] Next.js Image 컴포넌트 사용
- [x] 동적 임포트로 코드 분할
- [x] React.memo로 컴포넌트 메모이제이션
- [x] useMemo/useCallback 적절한 사용
- [x] 번들 크기 분석 및 최적화

### ✅ 백엔드 최적화
- [x] Serverless Function 최적화
- [x] Redis 캐싱 전략
- [x] 데이터베이스 인덱스 최적화
- [x] API 응답 압축
- [x] 불필요한 데이터 전송 제거

### ✅ 모니터링 설정
- [x] Vercel Analytics 연동
- [x] 커스텀 메트릭 수집
- [x] 성능 대시보드 구축
- [x] 알림 시스템 구축
- [x] 로그 모니터링

---

**작성자**: 개인 프로젝트 (바이브 코딩)  
**배포 환경**: Vercel + Supabase + Upstash  
**문서 버전**: v5.1  
**마지막 업데이트**: 2024년 현재 