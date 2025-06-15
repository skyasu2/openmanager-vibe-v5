# 🚀 OpenManager Vibe v5.44.0 - 배포 가이드

> **📅 최종 업데이트**: 2025년 6월 15일  
> **🎯 버전**: v5.44.0  
> **✅ 상태**: 프로덕션 준비 완료  
> **📝 통합 문서**: deployment-guide-v5.43.5.md, vercel-deployment-guide.md, PRODUCTION-READY.md 내용 통합

## 🎯 배포 준비 상태

OpenManager Vibe v5.44.0은 **모든 핵심 시스템이 검증 완료**된 프로덕션 준비 상태입니다.

### ✅ 검증 완료 항목

- **TypeScript 컴파일**: 24개 오류 → 0개 오류 (100% 해결)
- **Next.js 빌드**: 94개 페이지 성공적 생성
- **AI 엔진 시스템**: 12개 엔진 완전 안정화
- **데이터베이스 연동**: Supabase + Redis 실제 검증
- **알림 시스템**: Slack 웹훅 실제 전송 성공
- **MCP 서버**: Render 배포 + 로컬 폴백 안정화

## 🎯 배포 개요

OpenManager Vibe v5.44.0은 **Vercel 서버리스 환경**에 최적화되어 있으며, 다양한 플랫폼 배포를 지원합니다.

### 지원 배포 플랫폼

- **Vercel** (권장) - 서버리스 최적화
- **Netlify** - JAMstack 지원
- **AWS** - 컨테이너 배포
- **Docker** - 로컬/온프레미스

## 🚀 Vercel 배포 (권장)

### 1️⃣ 자동 배포 설정

```bash
# Vercel CLI 설치
npm install -g vercel

# 프로젝트 연결
vercel link

# 환경 변수 설정
vercel env add GOOGLE_AI_API_KEY
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add UPSTASH_REDIS_REST_URL
vercel env add UPSTASH_REDIS_REST_TOKEN

# 배포 실행
vercel --prod
```

### 2️⃣ GitHub 연동 배포

1. **GitHub Repository 연결**

   - Vercel Dashboard → New Project
   - GitHub Repository 선택
   - OpenManager Vibe v5 선택

2. **Build Settings**

   ```
   Framework Preset: Next.js
   Build Command: npm run build
   Output Directory: .next
   Install Command: npm install
   ```

3. **Environment Variables**

   ```bash
   GOOGLE_AI_API_KEY=your_api_key_here
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
   UPSTASH_REDIS_REST_TOKEN=your_token
   NEXTAUTH_SECRET=your_random_secret
   NEXTAUTH_URL=https://your-domain.vercel.app
   ```

### 3️⃣ Vercel 설정 파일

```json
// vercel.json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "functions": {
    "src/app/api/*/route.ts": {
      "maxDuration": 30,
      "memory": 1024
    },
    "src/app/api/ai/*/route.ts": {
      "maxDuration": 60,
      "memory": 2048
    }
  },
  "regions": ["icn1", "pdx1"],
  "env": {
    "NODE_ENV": "production"
  },
  "crons": [
    {
      "path": "/api/cron/cleanup",
      "schedule": "0 2 * * *"
    },
    {
      "path": "/api/cron/gemini-learning",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

## 🐳 Docker 배포

### Dockerfile

```dockerfile
# Dockerfile
FROM node:20-alpine AS base

# Dependencies
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --only=production

# Builder
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# Runner
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

### Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - '3000:3000'
    environment:
      - NODE_ENV=production
      - GOOGLE_AI_API_KEY=${GOOGLE_AI_API_KEY}
      - NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
      - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
      - UPSTASH_REDIS_REST_URL=${UPSTASH_REDIS_REST_URL}
      - UPSTASH_REDIS_REST_TOKEN=${UPSTASH_REDIS_REST_TOKEN}
    restart: unless-stopped
    healthcheck:
      test: ['CMD', 'curl', '-f', 'http://localhost:3000/api/health']
      interval: 30s
      timeout: 10s
      retries: 3

  nginx:
    image: nginx:alpine
    ports:
      - '80:80'
      - '443:443'
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    restart: unless-stopped
```

### Docker 배포 명령어

```bash
# 이미지 빌드
docker build -t openmanager-vibe-v5 .

# 컨테이너 실행
docker run -d \
  --name openmanager-vibe \
  -p 3000:3000 \
  --env-file .env.production \
  openmanager-vibe-v5

# Docker Compose 실행
docker-compose up -d

# 로그 확인
docker-compose logs -f app

# 헬스 체크
docker-compose ps
```

## ☁️ AWS 배포

### AWS ECS 배포

```yaml
# ecs-task-definition.json
{
  'family': 'openmanager-vibe-v5',
  'networkMode': 'awsvpc',
  'requiresCompatibilities': ['FARGATE'],
  'cpu': '512',
  'memory': '1024',
  'executionRoleArn': 'arn:aws:iam::account:role/ecsTaskExecutionRole',
  'taskRoleArn': 'arn:aws:iam::account:role/ecsTaskRole',
  'containerDefinitions':
    [
      {
        'name': 'openmanager-vibe',
        'image': 'your-account.dkr.ecr.region.amazonaws.com/openmanager-vibe-v5:latest',
        'portMappings': [{ 'containerPort': 3000, 'protocol': 'tcp' }],
        'environment': [{ 'name': 'NODE_ENV', 'value': 'production' }],
        'secrets':
          [
            {
              'name': 'GOOGLE_AI_API_KEY',
              'valueFrom': 'arn:aws:secretsmanager:region:account:secret:openmanager/google-ai-key',
            },
          ],
        'logConfiguration':
          {
            'logDriver': 'awslogs',
            'options':
              {
                'awslogs-group': '/ecs/openmanager-vibe-v5',
                'awslogs-region': 'us-east-1',
                'awslogs-stream-prefix': 'ecs',
              },
          },
      },
    ],
}
```

### AWS 배포 스크립트

```bash
#!/bin/bash
# deploy-aws.sh

# ECR 로그인
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin your-account.dkr.ecr.us-east-1.amazonaws.com

# 이미지 빌드 및 푸시
docker build -t openmanager-vibe-v5 .
docker tag openmanager-vibe-v5:latest your-account.dkr.ecr.us-east-1.amazonaws.com/openmanager-vibe-v5:latest
docker push your-account.dkr.ecr.us-east-1.amazonaws.com/openmanager-vibe-v5:latest

# ECS 서비스 업데이트
aws ecs update-service \
  --cluster openmanager-cluster \
  --service openmanager-vibe-service \
  --force-new-deployment

echo "Deployment completed!"
```

## 🌐 Netlify 배포

### Netlify 설정

```toml
# netlify.toml
[build]
  command = "npm run build"
  publish = ".next"

[build.environment]
  NODE_ENV = "production"
  NEXT_TELEMETRY_DISABLED = "1"

[[plugins]]
  package = "@netlify/plugin-nextjs"

[functions]
  directory = ".netlify/functions"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    X-XSS-Protection = "1; mode=block"
```

## 🔧 환경별 설정

### 환경 변수 관리

```typescript
// src/config/environment.ts
export const config = {
  development: {
    api: {
      baseUrl: 'http://localhost:3000',
      timeout: 30000,
    },
    ai: {
      model: 'gemini-1.5-flash',
      temperature: 0.9,
      maxTokens: 8192,
    },
    database: {
      maxConnections: 10,
      idleTimeout: 30000,
    },
  },

  staging: {
    api: {
      baseUrl: 'https://staging.openmanager.dev',
      timeout: 30000,
    },
    ai: {
      model: 'gemini-1.5-flash',
      temperature: 0.8,
      maxTokens: 8192,
    },
    database: {
      maxConnections: 50,
      idleTimeout: 60000,
    },
  },

  production: {
    api: {
      baseUrl: 'https://openmanager.dev',
      timeout: 15000,
    },
    ai: {
      model: 'gemini-1.5-flash',
      temperature: 0.7,
      maxTokens: 8192,
    },
    database: {
      maxConnections: 100,
      idleTimeout: 300000,
    },
  },
};
```

### 환경 변수 템플릿

```bash
# .env.production.template
NODE_ENV=production

# Google AI
GOOGLE_AI_API_KEY=your_production_api_key
GOOGLE_AI_MODEL=gemini-1.5-flash

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_production_service_role_key

# Redis
UPSTASH_REDIS_REST_URL=https://your-production-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_production_token

# Authentication
NEXTAUTH_SECRET=your_production_secret_key
NEXTAUTH_URL=https://your-domain.com

# Monitoring
PROMETHEUS_ENABLED=true
MONITORING_WEBHOOK_URL=your_production_webhook
SENTRY_DSN=your_sentry_dsn

# Performance
ENABLE_CACHING=true
ENABLE_COMPRESSION=true
ENABLE_MINIFICATION=true
```

## 📊 배포 후 모니터링

### 헬스 체크

```typescript
// src/app/api/health/route.ts
export async function GET() {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.APP_VERSION || '1.0.0',
    environment: process.env.NODE_ENV,
    services: {
      database: await checkDatabase(),
      redis: await checkRedis(),
      ai: await checkAI(),
      mcp: await checkMCP(),
    },
  };

  const allHealthy = Object.values(health.services).every(
    s => s.status === 'ok'
  );

  return Response.json(health, {
    status: allHealthy ? 200 : 503,
  });
}
```

### 로그 모니터링

```typescript
// src/lib/monitoring.ts
export class ProductionLogger {
  private static instance: ProductionLogger;

  static getInstance(): ProductionLogger {
    if (!ProductionLogger.instance) {
      ProductionLogger.instance = new ProductionLogger();
    }
    return ProductionLogger.instance;
  }

  info(message: string, metadata?: any) {
    this.log('INFO', message, metadata);
  }

  error(message: string, error?: Error, metadata?: any) {
    this.log('ERROR', message, { error: error?.stack, ...metadata });

    // Sentry에 에러 전송
    if (process.env.SENTRY_DSN) {
      Sentry.captureException(error);
    }
  }

  private log(level: string, message: string, metadata?: any) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      metadata,
      service: 'openmanager-vibe',
      version: process.env.APP_VERSION,
      environment: process.env.NODE_ENV,
    };

    console.log(JSON.stringify(logEntry));
  }
}
```

## 🔒 프로덕션 보안

### SSL/TLS 설정

```nginx
# nginx.conf
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 환경 변수 보안

```bash
# secrets 관리
kubectl create secret generic openmanager-secrets \
  --from-literal=google-ai-key="$GOOGLE_AI_API_KEY" \
  --from-literal=supabase-key="$SUPABASE_SERVICE_ROLE_KEY" \
  --from-literal=redis-token="$UPSTASH_REDIS_REST_TOKEN"
```

## 🚀 CI/CD 파이프라인

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]
  release:
    types: [published]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - run: npm ci
      - run: npm run type-check
      - run: npm run lint
      - run: npm run test
      - run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
      - uses: actions/checkout@v4
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

## 📈 성능 최적화

### Build 최적화

```typescript
// next.config.ts
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['sharp'],
  },

  // 번들 최적화
  webpack: config => {
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

  // 이미지 최적화
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 31536000,
  },

  // 압축 활성화
  compress: true,

  // PWA 설정
  swcMinify: true,
};
```

## 🔍 배포 검증

### 배포 후 체크리스트

```bash
# 1. 헬스 체크
curl -f https://your-domain.com/api/health

# 2. API 엔드포인트 테스트
curl -H "Content-Type: application/json" \
     https://your-domain.com/api/servers

# 3. AI 기능 테스트
curl -X POST \
     -H "Content-Type: application/json" \
     -d '{"query":"서버 상태 확인"}' \
     https://your-domain.com/api/ai/query

# 4. 실시간 연결 테스트
wscat -c wss://your-domain.com/api/websocket

# 5. 성능 테스트
npx lighthouse https://your-domain.com --view
```

### 모니터링 대시보드

```typescript
// 프로덕션 메트릭 수집
export class ProductionMetrics {
  static recordAPICall(endpoint: string, duration: number, status: number) {
    // Prometheus 메트릭 전송
    prometheus.histogram('api_request_duration_seconds', duration, {
      endpoint,
      status: status.toString(),
    });
  }

  static recordAIQuery(model: string, tokens: number, duration: number) {
    prometheus.histogram('ai_query_duration_seconds', duration, { model });
    prometheus.counter('ai_tokens_used_total', tokens, { model });
  }
}
```

## 🆘 문제 해결

### 일반적인 배포 문제

#### 빌드 실패

```bash
# 로그 확인
vercel logs --app=your-app

# 로컬에서 프로덕션 빌드 테스트
npm run build
npm run start
```

#### 환경 변수 문제

```bash
# Vercel 환경 변수 확인
vercel env ls

# 환경 변수 추가
vercel env add VARIABLE_NAME
```

#### 성능 문제

```bash
# 번들 분석
npm run analyze

# 성능 측정
npm run lighthouse
```

## 📚 관련 문서

- [🚀 Quick Start](QUICK_START.md) - 빠른 시작
- [🏗️ Architecture](ARCHITECTURE.md) - 시스템 아키텍처
- [📊 Monitoring](MONITORING.md) - 모니터링 설정
- [🧪 Testing](TESTING.md) - 테스트 가이드

## 🔗 유용한 링크

- [Vercel Documentation](https://vercel.com/docs)
- [Docker Documentation](https://docs.docker.com/)
- [AWS ECS Documentation](https://docs.aws.amazon.com/ecs/)
- [Netlify Documentation](https://docs.netlify.com/)
