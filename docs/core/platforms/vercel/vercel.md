---
id: vercel-deployment
title: Vercel Deployment Guide
keywords: [vercel, deployment, nextjs, free-tier]
priority: high
ai_optimized: true
---

# Vercel Deployment Guide

## 🚀 Quick Deploy

```bash
# Install Vercel CLI
npm install -g vercel

# Login and deploy
vercel login
vercel --prod

# Check deployment
vercel inspect
```

## 🛠️ **베르셀 CLI 최신 활용법** (v46.1.0)

### 📦 **배포/승급 (Deploy/Promote)**

```bash
# 현재 디렉터리 배포 (프리뷰/프로덕션)
vercel
vercel deploy

# 기존 배포를 프로덕션으로 승급
vercel promote <deployment-url|id>

# 로컬 빌드 후 결과물만 업로드 (CI/CD용)
vercel build
vercel deploy --prebuilt
```

### 🛠️ **로컬 개발/빌드**

```bash
# 베르셀 환경을 로컬에서 복제 (함수·미들웨어 포함)
vercel dev
vercel dev --listen 3001  # 포트 지정

# 대시보드 설정을 로컬에 동기화 (dev/build 전 권장)
vercel pull
```

### 🔐 **환경변수 관리**

```bash
# 환경변수 조회/추가/삭제/내보내기
vercel env ls
vercel env add KEY_NAME
vercel env rm KEY_NAME
vercel env pull

# 커스텀 환경별 배포/동기화
vercel deploy --target=staging
vercel pull --environment=staging
```

### 📊 **로그/디버깅**

```bash
# 특정 배포의 실행 로그 스트리밍
vercel logs <url|id>

# 배포/빌드 아티팩트·로그 상세 분석
vercel inspect [--logs]
```

## ⚙️ vercel.json Configuration

```json
{
  "version": 2,
  "framework": "nextjs",
  "functions": {
    "src/app/api/**/*.ts": {
      "maxDuration": 8,
      "memory": 128
    }
  },
  "regions": ["icn1"],
  "build": {
    "env": {
      "NEXT_TELEMETRY_DISABLED": "1",
      "TYPESCRIPT_STRICT_MODE": "true",
      "NODE_ENV": "production"
    }
  },
  "buildCommand": "npm run build && npm run validate:all"
}
```

## 🔧 Environment Variables

```bash
# Critical production variables
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel env add UPSTASH_REDIS_REST_URL production
vercel env add GOOGLE_AI_API_KEY production

# Free tier optimization
vercel env add NEXT_PUBLIC_FREE_TIER_MODE production
vercel env add VERCEL_HOBBY_PLAN production
vercel env add ENABLE_QUOTA_PROTECTION production
```

## 💰 Free Tier Optimization

```typescript
// src/config/vercel-optimization.ts
export const vercelConfig = {
  // Memory optimization (50MB limit)
  maxMemoryUsage: 40, // MB

  // Function timeout (10s limit)
  maxExecutionTime: 8000, // ms

  // Request optimization
  maxRequestSize: '1mb',

  // Auto garbage collection
  forceGC: process.env.NODE_ENV === 'production',

  // Disable file system writes
  disableFileSystem: process.env.VERCEL === '1',
};

// Apply optimizations
if (vercelConfig.disableFileSystem) {
  console.warn('🚫 File system writes disabled (Vercel)');
}
```

## 📊 Performance Monitoring

```bash
# Check deployment metrics
vercel logs --follow

# Function usage
vercel inspect --scope=functions

# Analytics
https://vercel.com/dashboard/analytics
```

## 🛡️ Security Headers

```typescript
// next.config.js security
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
];

module.exports = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};
```

## 🚨 Common Issues & Solutions

```bash
# Build failures
npm run type-check  # Fix TypeScript errors
npm run lint:fix    # Fix ESLint issues

# Memory exceeded
MEMORY_LIMIT_MB=40
FORCE_GARBAGE_COLLECTION=true

# Timeout issues
SERVERLESS_FUNCTION_TIMEOUT=8
DISABLE_BACKGROUND_JOBS=true
```

## 💡 **실무 팁 & 베스트 프랙티스**

### 🔄 **권장 워크플로우**

```bash
# 1. 개발 환경 구성
vercel pull                    # 대시보드 설정 동기화
vercel dev                     # 로컬 개발 서버 시작

# 2. 배포 전 검증
npm run build                  # 로컬 빌드 테스트
npm run type-check            # 타입 체크
npm run lint                  # 린트 검사

# 3. 프리뷰 배포 → 프로덕션 승급
vercel                        # 프리뷰 배포
vercel promote <preview-url>  # 검증 후 프로덕션 승급
```

### 🚀 **CI/CD 최적화**

```bash
# GitHub Actions에서 활용
vercel build --prod           # 프로덕션 빌드
vercel deploy --prebuilt --prod  # 빌드 결과물 배포
```

### 📊 **모니터링 & 디버깅**

```bash
# 실시간 로그 스트리밍
vercel logs --follow

# 특정 함수 성능 분석
vercel inspect --scope=functions

# 배포 히스토리 확인
vercel ls
```

### 🎯 **무료 티어 최적화 팁**

- `vercel pull` → `vercel dev` 순서로 개발 환경 구성
- CI/CD에서는 `vercel build` → `vercel deploy --prebuilt` 패턴 활용
- 환경별 배포는 `--target` 플래그로 구분
- 실시간 로그 모니터링은 `vercel logs` 활용

### 📚 **공식 문서 참조**

- **메인 가이드**: https://vercel.com/docs/cli
- **배포**: https://vercel.com/docs/cli#commands/deploy
- **개발**: https://vercel.com/docs/cli#commands/dev
- **환경변수**: https://vercel.com/docs/cli#commands/env
- **로그**: https://vercel.com/docs/cli#commands/logs
