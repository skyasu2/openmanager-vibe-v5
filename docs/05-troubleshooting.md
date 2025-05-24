# 🛠️ OpenManager Vibe V5 트러블슈팅

> 문제 해결, FAQ, 성능 모니터링 완전 가이드

## 📋 목차

1. [일반적인 문제 해결](#일반적인-문제-해결)
2. [개발 환경 문제](#개발-환경-문제)
3. [배포 관련 문제](#배포-관련-문제)
4. [성능 문제](#성능-문제)
5. [데이터베이스 문제](#데이터베이스-문제)
6. [API 관련 문제](#api-관련-문제)
7. [브라우저 호환성](#브라우저-호환성)
8. [FAQ](#faq)

---

## 🔧 일반적인 문제 해결

### 1. 애플리케이션이 시작되지 않음

#### 증상
```bash
Error: Cannot find module 'next'
npm ERR! missing script: dev
```

#### 해결 방법
```bash
# 1. 의존성 재설치
rm -rf node_modules package-lock.json
npm install

# 2. Next.js 버전 확인
npm list next

# 3. Node.js 버전 확인 (18.0.0+ 필요)
node --version
```

### 2. TypeScript 컴파일 오류

#### 증상
```bash
Type error: Cannot find module '@/components/ServerCard' or its corresponding type declarations.
```

#### 해결 방법
```bash
# 1. TypeScript 설정 확인
cat tsconfig.json

# 2. 경로 별칭 확인
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}

# 3. 타입 정의 파일 확인
npm run type-check
```

### 3. 환경 변수 로드 실패

#### 증상
```bash
Error: Environment variable NEXT_PUBLIC_SUPABASE_URL is not defined
```

#### 해결 방법
```bash
# 1. .env.local 파일 존재 확인
ls -la .env*

# 2. 환경 변수 형식 확인
# ✅ 올바른 형식
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co

# ❌ 잘못된 형식 (공백 있음)
NEXT_PUBLIC_SUPABASE_URL = https://your-project.supabase.co

# 3. 환경 변수 검증 스크립트 실행
npm run env:check
```

---

## 💻 개발 환경 문제

### 1. 포트 충돌

#### 증상
```bash
Error: listen EADDRINUSE: address already in use :::3000
```

#### 해결 방법
```bash
# 1. 포트 사용 중인 프로세스 확인
lsof -ti:3000

# 2. 프로세스 종료
kill -9 $(lsof -ti:3000)

# 3. 다른 포트로 실행
npm run dev -- -p 3001
```

### 2. Hot Reload가 작동하지 않음

#### 증상
- 파일 변경 시 자동 새로고침 안됨
- 변경사항이 브라우저에 반영되지 않음

#### 해결 방법
```bash
# 1. .next 캐시 삭제
rm -rf .next

# 2. 개발 서버 재시작
npm run dev

# 3. 브라우저 캐시 삭제 (Ctrl+Shift+R)

# 4. next.config.ts에서 웹팩 설정 확인
module.exports = {
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      };
    }
    return config;
  },
};
```

### 3. CSS/Tailwind 스타일이 적용되지 않음

#### 증상
- Tailwind 클래스가 작동하지 않음
- CSS Modules이 임포트되지 않음

#### 해결 방법
```bash
# 1. Tailwind CSS 설정 확인
cat tailwind.config.ts

# 2. PostCSS 설정 확인
cat postcss.config.mjs

# 3. globals.css에서 Tailwind import 확인
@tailwind base;
@tailwind components;
@tailwind utilities;

# 4. CSS Modules 파일명 확인
# ✅ 올바른 형식
styles.module.css

# ❌ 잘못된 형식
styles.css
```

---

## 🚀 배포 관련 문제

### 1. Vercel 배포 실패

#### 증상
```bash
Error: Command "npm run build" exited with 1
```

#### 해결 방법
```bash
# 1. 로컬에서 빌드 테스트
npm run build

# 2. TypeScript 오류 확인
npm run type-check

# 3. ESLint 오류 확인
npm run lint

# 4. Vercel 로그 확인
vercel logs --prod

# 5. 환경 변수 확인
vercel env ls
```

### 2. Serverless Function 타임아웃

#### 증상
```bash
Error: Function execution timed out after 10.01s
```

#### 해결 방법
```javascript
// vercel.json
{
  "functions": {
    "src/app/api/**/*.ts": {
      "maxDuration": 30
    }
  }
}

// API 함수 최적화
export async function GET() {
  try {
    // 타임아웃 설정
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    
    const result = await fetch(url, {
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    return result;
  } catch (error) {
    if (error.name === 'AbortError') {
      return Response.json({ error: 'Timeout' }, { status: 408 });
    }
    throw error;
  }
}
```

### 3. 정적 파일 로드 실패

#### 증상
- 이미지가 표시되지 않음
- CSS/JS 파일 404 오류

#### 해결 방법
```bash
# 1. public 폴더 구조 확인
public/
├── images/
├── icons/
└── favicon.ico

# 2. Next.js Image 컴포넌트 사용
import Image from 'next/image';

<Image
  src="/images/logo.png"
  alt="Logo"
  width={200}
  height={100}
/>

# 3. 절대 경로 사용
<img src="/icons/server.svg" alt="Server" />
```

---

## ⚡ 성능 문제

### 1. 페이지 로딩 속도 느림

#### 증상
- First Contentful Paint > 3초
- 페이지 로드 시 화면이 오래 빈 상태

#### 해결 방법
```tsx
// 1. 동적 임포트 사용
const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <p>Loading...</p>,
  ssr: false
});

// 2. 이미지 최적화
<Image
  src="/image.jpg"
  alt="Description"
  width={800}
  height={600}
  priority={true} // LCP 이미지에 사용
  placeholder="blur"
/>

// 3. 폰트 최적화
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
});
```

### 2. 번들 크기가 큼

#### 증상
```bash
Route (app)                              Size     First Load JS
┌ ○ /                                   14.2 kB        87.4 kB
├ ○ /demo                              156.8 kB       229.0 kB
```

#### 해결 방법
```bash
# 1. 번들 분석
npm run analyze

# 2. 불필요한 라이브러리 제거
npm uninstall unused-package

# 3. Tree shaking 확인
// ✅ 좋은 예
import { debounce } from 'lodash/debounce';

// ❌ 나쁜 예
import _ from 'lodash';

# 4. 동적 임포트 추가
const Chart = dynamic(() => import('chart.js'), { ssr: false });
```

### 3. 메모리 누수

#### 증상
- 페이지 사용 시간이 길수록 느려짐
- 브라우저 탭이 많은 메모리 사용

#### 해결 방법
```tsx
// 1. useEffect 정리 함수 사용
useEffect(() => {
  const interval = setInterval(() => {
    // 주기적 작업
  }, 1000);

  return () => clearInterval(interval); // 정리
}, []);

// 2. 이벤트 리스너 정리
useEffect(() => {
  const handleResize = () => {
    // 리사이즈 처리
  };

  window.addEventListener('resize', handleResize);
  return () => window.removeEventListener('resize', handleResize);
}, []);

// 3. 큰 객체 참조 해제
useEffect(() => {
  return () => {
    // 큰 데이터 정리
    setLargeData(null);
  };
}, []);
```

---

## 🗄️ 데이터베이스 문제

### 1. Supabase 연결 실패

#### 증상
```bash
Error: Invalid API key
Error: Failed to connect to database
```

#### 해결 방법
```typescript
// 1. 연결 설정 확인
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// 2. 헬스 체크 함수
export async function checkSupabaseHealth() {
  try {
    const { data, error } = await supabase
      .from('servers')
      .select('count')
      .limit(1);
    
    if (error) throw error;
    return { status: 'healthy' };
  } catch (error) {
    console.error('Supabase health check failed:', error);
    return { status: 'unhealthy', error: error.message };
  }
}

// 3. 재연결 로직
async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
  throw new Error('Max retries exceeded');
}
```

### 2. Redis 캐시 문제

#### 증상
```bash
Error: Redis connection timeout
Error: Too many connections
```

#### 해결 방법
```typescript
// 1. 연결 풀 최적화
class RedisManager {
  private static instance: Redis;

  static getInstance() {
    if (!this.instance) {
      this.instance = new Redis(process.env.UPSTASH_REDIS_REST_URL!, {
        connectTimeout: 5000,
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
      });
    }
    return this.instance;
  }

  static async healthCheck() {
    try {
      const redis = this.getInstance();
      await redis.ping();
      return { status: 'healthy' };
    } catch (error) {
      return { status: 'unhealthy', error: error.message };
    }
  }
}

// 2. 캐시 만료 시간 설정
await redis.setex('key', 300, JSON.stringify(data)); // 5분 후 만료

// 3. 에러 핸들링
async function getCachedData(key: string) {
  try {
    const cached = await redis.get(key);
    return cached ? JSON.parse(cached) : null;
  } catch (error) {
    console.warn('Redis error, falling back to database:', error);
    return null; // 캐시 실패 시 DB에서 조회
  }
}
```

### 3. 데이터 동기화 문제

#### 증상
- 실시간 데이터가 업데이트되지 않음
- 서버별 메트릭이 다름

#### 해결 방법
```typescript
// 1. 실시간 구독 설정
useEffect(() => {
  const channel = supabase
    .channel('servers')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'servers'
    }, (payload) => {
      console.log('Change received!', payload);
      // 상태 업데이트
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, []);

// 2. 데이터 검증
function validateServerMetrics(metrics: any) {
  const schema = z.object({
    cpu: z.number().min(0).max(100),
    memory: z.number().min(0).max(100),
    disk: z.number().min(0).max(100),
    network: z.number().min(0)
  });

  return schema.parse(metrics);
}

// 3. 충돌 해결
async function updateServerWithConflictResolution(serverId: string, updates: any) {
  const { data: current } = await supabase
    .from('servers')
    .select('*')
    .eq('id', serverId)
    .single();

  if (current && current.updated_at > updates.last_known_update) {
    throw new Error('Conflict: Server was updated by another process');
  }

  return await supabase
    .from('servers')
    .update({ ...updates, updated_at: new Date() })
    .eq('id', serverId);
}
```

---

## 🔌 API 관련 문제

### 1. CORS 오류

#### 증상
```bash
Access to fetch at 'api/servers' has been blocked by CORS policy
```

#### 해결 방법
```typescript
// next.config.ts
const nextConfig = {
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET, POST, PUT, DELETE, OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type, Authorization" },
        ],
      },
    ];
  },
};

// API 라우트에서 OPTIONS 처리
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
```

### 2. 인증 토큰 문제

#### 증상
```bash
401 Unauthorized
403 Forbidden
```

#### 해결 방법
```typescript
// 1. 토큰 검증 미들웨어
export function withAuth(handler: Function) {
  return async (req: Request) => {
    const token = req.headers.get('authorization');
    
    if (!token) {
      return Response.json({ error: 'Token required' }, { status: 401 });
    }

    try {
      const decoded = jwt.verify(token.replace('Bearer ', ''), process.env.JWT_SECRET!);
      return handler(req, { user: decoded });
    } catch (error) {
      return Response.json({ error: 'Invalid token' }, { status: 401 });
    }
  };
}

// 2. 토큰 갱신 로직
async function refreshToken() {
  try {
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('refreshToken')}`
      }
    });

    if (response.ok) {
      const { token } = await response.json();
      localStorage.setItem('token', token);
      return token;
    }
  } catch (error) {
    console.error('Token refresh failed:', error);
    // 로그인 페이지로 리다이렉트
    window.location.href = '/login';
  }
}

// 3. API 요청 인터셉터
async function apiRequest(url: string, options: RequestInit = {}) {
  let token = localStorage.getItem('token');
  
  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`
    }
  });

  if (response.status === 401) {
    token = await refreshToken();
    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${token}`
      }
    });
  }

  return response;
}
```

### 3. API 응답 지연

#### 증상
- API 응답이 5초 이상 걸림
- 타임아웃 오류 발생

#### 해결 방법
```typescript
// 1. 요청 타임아웃 설정
async function fetchWithTimeout(url: string, timeout = 5000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    if (error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw error;
  }
}

// 2. 캐싱 전략
const cache = new Map();

async function getCachedOrFetch(key: string, fetcher: () => Promise<any>, ttl = 300000) {
  const cached = cache.get(key);
  
  if (cached && Date.now() - cached.timestamp < ttl) {
    return cached.data;
  }

  const data = await fetcher();
  cache.set(key, { data, timestamp: Date.now() });
  return data;
}

// 3. 병렬 요청 최적화
async function fetchMultipleServers(serverIds: string[]) {
  const requests = serverIds.map(id => 
    fetchWithTimeout(`/api/servers/${id}`)
  );

  const results = await Promise.allSettled(requests);
  
  return results.map((result, index) => ({
    serverId: serverIds[index],
    success: result.status === 'fulfilled',
    data: result.status === 'fulfilled' ? result.value : null,
    error: result.status === 'rejected' ? result.reason : null
  }));
}
```

---

## 🌐 브라우저 호환성

### 1. Internet Explorer 지원

#### 증상
- IE에서 페이지가 로드되지 않음
- JavaScript 오류 발생

#### 해결 방법
```typescript
// 1. 브라우저 감지
function isIE() {
  return /MSIE|Trident/.test(navigator.userAgent);
}

if (isIE()) {
  // IE 사용자에게 경고 표시
  alert('이 사이트는 Internet Explorer를 지원하지 않습니다. Chrome, Firefox, Safari 등 최신 브라우저를 사용해주세요.');
}

// 2. Polyfill 추가
// next.config.ts
const nextConfig = {
  compiler: {
    styledComponents: true,
  },
  transpilePackages: ['@vercel/analytics'],
};

// 3. 브라우저 호환성 체크
function checkBrowserSupport() {
  const requiredFeatures = [
    'fetch',
    'Promise',
    'Map',
    'Set'
  ];

  const unsupported = requiredFeatures.filter(feature => 
    !(feature in window)
  );

  if (unsupported.length > 0) {
    console.warn('Unsupported features:', unsupported);
    return false;
  }

  return true;
}
```

### 2. 모바일 브라우저 이슈

#### 증상
- 터치 이벤트가 작동하지 않음
- 뷰포트 크기가 잘못됨

#### 해결 방법
```tsx
// 1. 터치 이벤트 처리
const [touchStart, setTouchStart] = useState<number | null>(null);
const [touchEnd, setTouchEnd] = useState<number | null>(null);

const handleTouchStart = (e: TouchEvent) => {
  setTouchEnd(null);
  setTouchStart(e.targetTouches[0].clientX);
};

const handleTouchMove = (e: TouchEvent) => {
  setTouchEnd(e.targetTouches[0].clientX);
};

const handleTouchEnd = () => {
  if (!touchStart || !touchEnd) return;
  
  const distance = touchStart - touchEnd;
  const isLeftSwipe = distance > 50;
  const isRightSwipe = distance < -50;

  if (isLeftSwipe) {
    // 왼쪽 스와이프 처리
  }
  if (isRightSwipe) {
    // 오른쪽 스와이프 처리
  }
};

// 2. 뷰포트 메타 태그
// app/layout.tsx
export const metadata = {
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no'
};

// 3. 모바일 감지
function isMobile() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}
```

---

## ❓ FAQ

### Q1: 데모 페이지가 로드되지 않아요
**A:** 다음 순서로 확인해보세요:
1. 브라우저 콘솔에서 JavaScript 오류 확인
2. 네트워크 탭에서 API 요청 실패 여부 확인
3. `npm run dev`로 개발 서버가 정상 실행 중인지 확인
4. 환경 변수가 올바르게 설정되었는지 확인

### Q2: AI 채팅이 응답하지 않아요
**A:** 다음을 확인해보세요:
1. OpenAI API 키가 올바르게 설정되었는지 확인
2. API 키의 사용 한도가 초과되지 않았는지 확인
3. 네트워크 연결 상태 확인
4. 브라우저 개발자 도구에서 오류 메시지 확인

### Q3: 서버 메트릭이 업데이트되지 않아요
**A:** 실시간 업데이트 문제입니다:
1. WebSocket 연결 상태 확인
2. Supabase 실시간 구독이 활성화되었는지 확인
3. 브라우저가 백그라운드에 있으면 업데이트가 중단될 수 있음
4. 페이지를 새로고침해보세요

### Q4: 성능이 느려요
**A:** 성능 최적화 방법:
1. 브라우저 캐시 삭제
2. 다른 탭을 닫아 메모리 확보
3. 하드웨어 가속 활성화
4. 인터넷 연결 속도 확인

### Q5: 모바일에서 레이아웃이 깨져요
**A:** 반응형 디자인 문제입니다:
1. 화면을 세로/가로로 회전해보세요
2. 브라우저 줌을 100%로 설정
3. 모바일 브라우저의 주소창이 숨겨지도록 스크롤
4. 앱을 홈 화면에 추가하여 전체화면으로 사용

### Q6: 배포 후 환경 변수가 작동하지 않아요
**A:** Vercel 환경 변수 설정을 확인하세요:
1. Vercel 대시보드에서 환경 변수 설정 확인
2. `NEXT_PUBLIC_` 접두사가 있는 변수만 클라이언트에서 접근 가능
3. 배포 후 새로 추가한 환경 변수는 재배포 필요
4. `vercel env pull`로 로컬에 환경 변수 동기화

### Q7: TypeScript 오류가 계속 발생해요
**A:** TypeScript 설정 문제입니다:
1. `npm run type-check`로 전체 타입 오류 확인
2. `tsconfig.json` 설정이 올바른지 확인
3. 타입 정의 파일이 누락되지 않았는지 확인
4. `@types/` 패키지들이 최신 버전인지 확인

### Q8: Git 커밋이 실패해요
**A:** 코드 품질 검사 때문입니다:
1. `npm run lint`로 ESLint 오류 수정
2. `npm run prettier:fix`로 코드 포맷팅
3. `npm run type-check`로 TypeScript 오류 수정
4. `.gitignore`에 불필요한 파일이 포함되지 않았는지 확인

---

## 🆘 추가 도움이 필요한 경우

### 로그 수집 방법
```bash
# 1. Next.js 빌드 로그
npm run build > build.log 2>&1

# 2. 개발 서버 로그
npm run dev > dev.log 2>&1

# 3. 브라우저 콘솔 로그
# F12 → Console → 우클릭 → "Save as..."

# 4. 네트워크 요청 로그
# F12 → Network → 우클릭 → "Save all as HAR"
```

### 이슈 리포트 템플릿
```markdown
## 문제 설명
[문제에 대한 명확한 설명]

## 재현 단계
1. ...
2. ...
3. ...

## 예상 결과
[무엇이 일어나야 하는지]

## 실제 결과
[실제로 무엇이 일어났는지]

## 환경 정보
- OS: [예: Windows 10, macOS 12]
- 브라우저: [예: Chrome 120, Safari 16]
- Node.js: [예: 18.17.0]
- npm: [예: 9.6.7]

## 추가 정보
[스크린샷, 로그, 기타 관련 정보]
```

---

**작성자**: 개인 프로젝트 (바이브 코딩)  
**문서 버전**: v5.1  
**마지막 업데이트**: 2024년 현재  
**지원**: GitHub Issues를 통해 문의해주세요 