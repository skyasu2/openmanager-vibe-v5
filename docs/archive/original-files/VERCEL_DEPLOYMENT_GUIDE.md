# 🚀 OpenManager v5 Vercel 배포 가이드

## 📊 **배포 전략 개요**

### 🎯 **자동 배포 파이프라인**

```
개발자 코드 → GitHub Push → Vercel 자동 빌드 → 프로덕션 배포
                    ↓
              환경변수 주입 → 최적화 빌드 → CDN 배포
```

### 📈 **예상 성능 개선**

- **로컬 vs Vercel 비교**
  - 네트워크 응답: 🏠 가정용 → ☁️ Edge Network (30-50% 빠름)
  - 캐싱: 🔄 개발 모드 → 🚀 프로덕션 최적화
  - 보안: 🔓 로컬 키 → 🔒 Vercel 환경변수

## 🔧 **1단계: GitHub 저장소 설정**

### 저장소 준비 확인

```bash
# 현재 커밋 상태 확인
git status
git log --oneline -5

# 필수 파일 존재 확인
- vercel.json ✅
- .env.local ✅ (로컬 전용)
- DATABASE_CONNECTION_GUIDE.md ✅
- package.json ✅
```

### 브랜치 전략

```bash
# 메인 브랜치 확인
git branch

# 프로덕션용 태그 생성 (선택사항)
git tag -a v5.41.7 -m "실제 DB 연결 완료 및 Vercel 배포 준비"
git push origin v5.41.7
```

## ☁️ **2단계: Vercel 프로젝트 생성**

### Vercel 대시보드 설정

1. **새 프로젝트 생성**

   - GitHub 저장소 연결
   - 프로젝트 이름: `openmanager-vibe-v5`
   - 프레임워크: Next.js (자동 감지)

2. **빌드 설정**

   ```bash
   # Build Command (기본값)
   npm run build

   # Output Directory (기본값)
   .next

   # Install Command (기본값)
   npm install
   ```

3. **환경변수 설정**
   ```bash
   # Production 환경변수 추가
   NEXT_PUBLIC_APP_URL=https://openmanager-vibe-v5.vercel.app
   NEXT_PUBLIC_SUPABASE_URL=https://vnswjnltnhpsueosfhmw.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZuc3dqbmx0bmhwc3Vlb3NmaG13Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5MjMzMjcsImV4cCI6MjA2MzQ5OTMyN30.09ApSnuXNv_yYVJWQWGpOFWw3tkLbxSA21k5sroChGU
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZuc3dqbmx0bmhwc3Vlb3NmaG13Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzkyMzMyNywiZXhwIjoyMDYzNDk5MzI3fQ.p2DEfXlB9ZgOApd_-fkB6THYvYKmN7qYj_a8N5FD-UI
   UPSTASH_REDIS_REST_URL=https://charming-condor-46598.upstash.io
   UPSTASH_REDIS_REST_TOKEN=AbYGAAIjcDE5MjNmYjhiZDkwOGQ0MTUyOGFiZjUyMmQ0YTkyMzIwM3AxMA
   KV_REST_API_URL=https://charming-condor-46598.upstash.io
   KV_REST_API_TOKEN=AbYGAAIjcDE5MjNmYjhiZDkwOGQ0MTUyOGFiZjUyMmQ0YTkyMzIwM3AxMA
   ```

## ⚡ **3단계: 성능 최적화 설정**

### vercel.json 구성 분석

```json
{
  "version": 2,
  "name": "openmanager-vibe-v5",
  "regions": ["icn1"], // 서울 리전
  "functions": {
    "src/app/api/**/*.ts": {
      "maxDuration": 30, // 일반 API 30초
      "memory": 1024 // 1GB 메모리
    },
    "src/app/api/ai/**/*.ts": {
      "maxDuration": 60, // AI API 60초
      "memory": 1024
    },
    "src/app/api/data-generator/**/*.ts": {
      "maxDuration": 45, // 데이터 생성 45초
      "memory": 512 // 512MB 메모리
    }
  },
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "s-maxage=60, stale-while-revalidate=300"
        }
      ]
    }
  ]
}
```

### 캐싱 전략

```javascript
// API 레벨 캐싱
export const runtime = 'edge';
export const revalidate = 60; // 60초 캐시

// Redis 캐싱
const CACHE_TTL = {
  servers: 300, // 5분
  metrics: 60, // 1분
  ai_analysis: 1800, // 30분
};
```

## 🌍 **4단계: 지역별 성능 최적화**

### 한국 사용자 최적화

```json
// vercel.json 지역 설정
{
  "regions": ["icn1"], // 서울 (주 지역)
  "regions": ["icn1", "nrt1"] // 서울 + 도쿄 (백업)
}
```

### 데이터베이스 지연 최소화

```javascript
// Supabase 연결 최적화
const supabase = createClient(url, key, {
  auth: {
    persistSession: false,
    detectSessionInUrl: false,
  },
  db: {
    schema: 'public',
    poolSize: 15,
    idleTimeoutMs: 30000,
  },
  global: {
    headers: {
      'x-connection-region': 'ap-southeast-1', // Singapore
    },
  },
});
```

## 📊 **5단계: 모니터링 및 알림 설정**

### Vercel Analytics 활성화

```javascript
// _app.tsx 또는 layout.tsx
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

### 성능 모니터링 코드

```javascript
// API 성능 로깅
export async function GET(request) {
  const startTime = Date.now();

  try {
    const result = await processRequest();

    // 성능 로깅
    console.log(`✅ API 성공: ${Date.now() - startTime}ms`);
    console.log(`📍 Region: ${process.env.VERCEL_REGION}`);
    console.log(`🔧 Function: ${process.env.VERCEL_URL}`);

    return NextResponse.json(result);
  } catch (error) {
    console.error(`❌ API 실패: ${Date.now() - startTime}ms`, error);
    throw error;
  }
}
```

## 🚨 **6단계: 배포 후 테스트 시나리오**

### 기본 기능 테스트

```bash
# 1. 메인 페이지 접속
curl https://openmanager-vibe-v5.vercel.app

# 2. 데이터베이스 연결 테스트
curl https://openmanager-vibe-v5.vercel.app/api/test-real-db

# 3. 헬스체크
curl https://openmanager-vibe-v5.vercel.app/api/health

# 4. 대시보드 API
curl https://openmanager-vibe-v5.vercel.app/api/dashboard
```

### 성능 벤치마크 (예상)

```yaml
로컬 환경:
  - 첫 페이지 로드: ~3초
  - API 응답: 100-500ms
  - DB 연결: 2-8초 (초기)

Vercel 프로덕션:
  - 첫 페이지 로드: ~1-2초 (CDN)
  - API 응답: 50-200ms (Edge)
  - DB 연결: 500ms-2초 (최적화)
  - Cold Start: +500-1000ms (첫 요청)
```

## ⚠️ **7단계: 주의사항 및 최적화**

### Cold Start 최소화

```javascript
// Keep-alive 함수 (권장)
export async function GET() {
  // 최소한의 연산으로 함수 활성 상태 유지
  return NextResponse.json({
    status: 'alive',
    timestamp: new Date().toISOString(),
  });
}
```

### 메모리 사용량 최적화

```javascript
// 큰 객체 메모리 해제
const processLargeData = () => {
  let result = heavyComputation();

  // 사용 후 명시적 해제
  heavyComputation = null;
  return result;
};
```

### 환경별 설정 분기

```javascript
// 환경 감지
const isProduction = process.env.NODE_ENV === 'production';
const isVercel = process.env.VERCEL === '1';

if (isVercel) {
  // Vercel 전용 최적화
  console.log('🚀 Vercel 프로덕션 모드');
} else {
  // 로컬 개발 모드
  console.log('🏠 로컬 개발 모드');
}
```

## 📋 **8단계: 배포 체크리스트**

### 배포 전 확인사항

- [ ] ✅ 로컬 테스트 통과 (2/3 성공)
- [ ] ✅ 환경변수 완전 설정
- [ ] ✅ vercel.json 구성 완료
- [ ] ✅ 문서 업데이트 완료
- [ ] ✅ Git 커밋/푸시 완료

### 배포 후 확인사항

- [ ] 메인 페이지 로딩
- [ ] 데이터베이스 연결 상태
- [ ] API 응답 시간
- [ ] Redis 캐싱 동작
- [ ] AI 기능 정상 동작
- [ ] 실시간 데이터 업데이트

## 🔄 **9단계: 지속적 배포 (CI/CD)**

### GitHub Actions (선택사항)

```yaml
# .github/workflows/vercel.yml
name: Vercel Deployment
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Vercel
        uses: vercel/action@v1
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

### 자동 테스트 스크립트

```javascript
// scripts/deployment-test.js
const testEndpoints = [
  '/api/health',
  '/api/test-real-db',
  '/api/dashboard',
  '/api/servers',
];

const runTests = async () => {
  for (const endpoint of testEndpoints) {
    const response = await fetch(`${process.env.VERCEL_URL}${endpoint}`);
    console.log(`${endpoint}: ${response.status}`);
  }
};
```

## 📞 **지원 및 리소스**

### Vercel 관련 문서

- [Vercel 공식 문서](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)

### 모니터링 도구

- **Vercel Analytics**: 성능 및 사용자 분석
- **Vercel Speed Insights**: 웹 성능 지표
- **Upstash Console**: Redis 사용량
- **Supabase Dashboard**: DB 성능

---

**배포 준비 완료**: 2025-01-02  
**예상 배포 시간**: 5-10분  
**최적화 수준**: 프로덕션 레디
