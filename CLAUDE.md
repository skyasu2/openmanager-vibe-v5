# CLAUDE.md

Project guidance for Claude Code (claude.ai/code) when working with this repository.

📚 **Claude Code 공식 문서**: https://docs.anthropic.com/en/docs/claude-code/overview

## 🎯 프로젝트 개요

**OpenManager VIBE v5**: AI 기반 실시간 서버 모니터링 플랫폼

### 핵심 특징

- 100% 무료 티어로 운영 (Vercel + GCP + Supabase)
- 엔터프라이즈급 성능 (152ms 응답, 99.95% 가동률)
- Next.js 15 + App Router + React 18.2.0 + TypeScript strict mode

### 무료 티어 아키텍처

- **Frontend**: Vercel Edge Runtime (100GB 대역폭/월)
- **Backend API**: GCP Functions Python 3.11 (2백만 요청/월)
- **Database**: Supabase PostgreSQL (500MB)
- **Cache**: Upstash Redis (256MB)
- **Future**: GCP VM 무료 티어 활용 예정 (e2-micro)

### 주요 기능

- 📊 **실시간 모니터링**: CPU, Memory, Disk, Network (15초 간격)
- 🤖 **AI 분석**: 이상 징후 감지, 성능 예측, 자연어 질의
- 🔐 **인증**: GitHub OAuth 기반 접근 제어
- 📈 **대시보드**: 반응형 UI, 실시간 차트, 알림 시스템

## 🛠️ 개발 환경

- **OS**: Windows 11 + WSL Ubuntu
- **Node.js**: v22.15.1
- **Package Manager**: npm
- **언어**: 한국어 우선 (기술 용어는 영어 병기)
- **Python**: 3.11 (GCP Functions)
- **Claude Code**: 프로젝트별 독립 설정 사용

## 📂 프로젝트 구조

```
openmanager-vibe-v5/
├── src/             # 소스 코드
│   ├── app/         # Next.js 15 App Router
│   ├── services/    # 비즈니스 로직 (AI, Auth, MCP)
│   ├── components/  # React 컴포넌트
│   └── lib/         # 유틸리티
├── docs/            # 상세 문서 (100+개)
├── scripts/         # 자동화 스크립트
├── gcp-functions/   # Python 3.11 서버리스 (무료 티어)
│   ├── enhanced-korean-nlp/    # 한국어 처리
│   ├── ml-analytics-engine/    # ML 분석
│   └── unified-ai-processor/   # AI 통합 처리
└── tests/           # 테스트 코드
```

## 🚀 자주 사용하는 명령어

```bash
# 개발
npm run dev              # http://localhost:3000
npm run build            # 프로덕션 빌드
npm run lint:fix         # ESLint 자동 수정
npm run type-check       # TypeScript 검사

# 테스트
npm test                 # Vitest 실행
npm run test:e2e         # Playwright E2E
npm run test:coverage    # 커버리지 (목표: 70%+)

# 검증
npm run validate:all     # 린트 + 타입 + 테스트

# 모니터링
npx ccusage@latest blocks --live    # Claude 사용량 실시간
npm run health:check                 # API 상태 확인
```

## 📝 개발 규칙 (필수)

1. **TypeScript**: `any` 타입 절대 금지, strict mode 필수
2. **파일 크기**: 500줄 권장, 1500줄 초과 시 분리
3. **코드 재사용**: 기존 코드 검색 후 작성 (`@codebase` 활용)
4. **커밋**: 매 커밋마다 CHANGELOG.md 업데이트
5. **문서**: 루트에는 핵심 문서 5개만 유지
   - README.md, CHANGELOG.md, CHANGELOG-LEGACY.md, CLAUDE.md, GEMINI.md
   - 기타 문서는 종류별로 분류: `docs/`, `reports/`
6. **사고 모드**: "think hard" 항상 활성화
7. **SOLID 원칙**: 모든 코드에 적용

## 🔒 포트폴리오 보안 정책

**중요**: 이 프로젝트는 포트폴리오/데모용으로 **기본적인 보안**만 적용합니다.

### 현재 보안 설정

- **AI 보안**: `enableStrictMode: false` (포트폴리오 수준)
- **API 보호**: 민감한 엔드포인트만 (`/api/admin`, `/api/database`, `/api/ai`)
- **시크릿 관리**: 환경변수 사용, 하드코딩 방지 (Husky 검사)
- **보안 에이전트**: 기본 보안만 검사 (과도한 엔터프라이즈 보안 제거)

### 보안 체크리스트

- ✅ 하드코딩된 시크릿 없음
- ✅ 환경변수로 설정 관리
- ✅ 기본 API 인증
- ❌ 복잡한 보안 패턴 (불필요)
- ❌ 엔터프라이즈급 감사 (과도함)

### 🔐 시크릿 관리 (중요!)

- **절대 하드코딩 금지**: API 키, 토큰은 반드시 환경변수 사용
- **문서 마스킹**: 예시에서도 `[환경변수에서 설정]` 또는 `ghp_XXXXX` 형태 사용
- **자동 검사**: Pre-commit 훅이 시크릿 노출 자동 차단
- **상세 가이드**: [`/docs/security-management-guide.md`](/docs/security-management-guide.md)

자세한 내용: [`/docs/portfolio-security-guide.md`](/docs/portfolio-security-guide.md)

### 타입 안전성 유틸리티

프로젝트 전반에서 타입 안전성을 위해 다음 유틸리티 함수들을 사용:

```typescript
// src/types/type-utils.ts
getErrorMessage(error); // error.message 대신 사용
safeArrayAccess(array, index); // array[index] 대신 사용
safeObjectAccess(obj, key); // obj.key 대신 사용
safeParseFloat(value); // parseFloat() 대신 사용

// src/types/react-utils.ts
useSafeEffect(() => {
  // 안전한 useEffect
  // cleanup 함수 자동 반환
}, [deps]);

useAsyncEffect(async () => {
  // 비동기 useEffect
  // 안전한 비동기 처리
}, [deps]);
```

## 🔧 Next.js 15 App Router 모범 사례

### 프로덕션 최적화 (2024)

#### 1. 캐싱 전략 변경

- **중요**: Next.js 15부터 GET Route Handlers와 Client Router Cache가 기본적으로 **uncached**로 변경
- **이전**: 기본 캐시 → **현재**: 기본 비캐시
- **성능 영향**: 명시적 캐싱 전략 필요

```typescript
// app/api/servers/route.ts
export async function GET() {
  // Next.js 15: 명시적 캐싱 필요
  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
    },
  });
}
```

#### 2. Runtime 설정 업데이트

```typescript
// ❌ 구버전 (deprecated)
export const runtime = 'experimental-edge';

// ✅ Next.js 15
export const runtime = 'edge';
```

#### 3. 번들 최적화

```javascript
// next.config.js
module.exports = {
  // 자동 외부 패키지 번들링 (Pages Router)
  bundlePagesRouterDependencies: true,

  // 특정 패키지 번들링 제외
  serverExternalPackages: ['@upstash/redis', 'sharp'],

  // ESLint 9 지원
  eslint: {
    ignoreDuringBuilds: false,
  },
};
```

#### 4. 성능 모니터링

```typescript
// app/layout.tsx - Core Web Vitals 추적
import { SpeedInsights } from '@vercel/speed-insights/next';
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
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
```

#### 5. CI/CD 파이프라인

```yaml
# .github/workflows/production.yml
name: Production Deployment
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22.15.1'
          cache: 'npm'

      - run: npm ci
      - run: npm run lint
      - run: npm run type-check
      - run: npm run test
      - run: npm run build

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```

## 💡 핵심 시스템

### AI 엔진

- **UnifiedAIEngineRouter**: 모든 AI 서비스 중앙 관리
- **엔진**: Google AI, Supabase RAG, Korean NLP
- **자동 폴백**: 실패 시 다른 엔진으로 자동 전환

### GCP Functions (서버리스)

- **enhanced-korean-nlp**: 한국어 자연어 처리
- **ml-analytics-engine**: ML 기반 분석
- **unified-ai-processor**: 통합 AI 처리
- **배포**: `scripts/deployment/deploy-all.sh`

### 인증

- **Supabase Auth**: GitHub OAuth
- **세션 관리**: JWT + Refresh Token

### 데이터베이스

- **PostgreSQL**: Supabase (500MB 무료)
  - 공식 문서: https://supabase.com/docs
  - **전담 관리**: `database-administrator` 서브 에이전트
- **Redis**: Upstash (256MB 무료)
  - Overview & 시작 가이드: https://upstash.com/docs/redis/overall/getstarted
  - SDK & Quickstart: https://upstash.com/docs/redis/sdks/ts/overview
  - **전담 관리**: `database-administrator` 서브 에이전트
- **Vector DB**: pgvector 확장 (Supabase 내)

## 🔴 Upstash Redis 통합 가이드

### 환경 설정

```bash
# 필수 패키지 설치
npm install @upstash/redis

# 환경 변수 설정 (.env.local)
UPSTASH_REDIS_REST_URL="https://your-redis-url.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your-redis-token"
```

### 클라이언트 초기화

```typescript
// lib/redis.ts
import { Redis } from '@upstash/redis';

// 환경 변수에서 자동 초기화
const redis = Redis.fromEnv();

export default redis;

// 또는 명시적 초기화
export const redisClient = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});
```

### 핵심 사용 패턴

#### 1. 캐싱 전략

```typescript
// services/caching.ts
import redis from '@/lib/redis';

export async function getCachedData<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 300 // 5분
): Promise<T> {
  // 캐시에서 조회
  const cached = await redis.get<T>(key);
  if (cached) return cached;

  // 데이터 페칭 및 캐싱
  const data = await fetcher();
  await redis.setex(key, ttl, data);
  return data;
}

// 사용 예시
const serverMetrics = await getCachedData(
  `server:${serverId}:metrics`,
  () => fetchServerMetrics(serverId),
  60 // 1분 캐시
);
```

#### 2. 세션 관리

```typescript
// services/session.ts
import redis from '@/lib/redis';

export class SessionManager {
  private static SESSION_PREFIX = 'session:';
  private static TTL = 24 * 60 * 60; // 24시간

  static async create(userId: string, data: any) {
    const sessionId = crypto.randomUUID();
    const key = `${this.SESSION_PREFIX}${sessionId}`;

    await redis.setex(key, this.TTL, {
      userId,
      ...data,
      createdAt: Date.now(),
    });

    return sessionId;
  }

  static async get(sessionId: string) {
    const key = `${this.SESSION_PREFIX}${sessionId}`;
    return await redis.get(key);
  }

  static async destroy(sessionId: string) {
    const key = `${this.SESSION_PREFIX}${sessionId}`;
    await redis.del(key);
  }
}
```

#### 3. Rate Limiting

```typescript
// middleware/rate-limit.ts
import redis from '@/lib/redis';
import { NextRequest, NextResponse } from 'next/server';

export async function rateLimitMiddleware(
  request: NextRequest,
  limit: number = 100,
  window: number = 3600 // 1시간
) {
  const ip = request.ip ?? '127.0.0.1';
  const key = `rate_limit:${ip}`;

  const requests = await redis.incr(key);

  if (requests === 1) {
    await redis.expire(key, window);
  }

  if (requests > limit) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  return NextResponse.next();
}
```

#### 4. 실시간 데이터 Pub/Sub

```typescript
// services/realtime.ts
import redis from '@/lib/redis';

export class RealtimeService {
  static async publishMetrics(serverId: string, metrics: any) {
    await redis.publish(`server:${serverId}:metrics`, JSON.stringify(metrics));
  }

  static async subscribeToMetrics(
    serverId: string,
    callback: (data: any) => void
  ) {
    // WebSocket과 연동하여 실시간 업데이트
    const channel = `server:${serverId}:metrics`;
    // Note: Upstash는 HTTP 기반이므로 polling 방식 사용
    setInterval(async () => {
      const data = await redis.get(`latest:${channel}`);
      if (data) callback(data);
    }, 1000);
  }
}
```

### 성능 최적화

#### 1. 배치 작업

```typescript
// 여러 키 동시 처리
const pipeline = redis.pipeline();
pipeline.set('key1', 'value1');
pipeline.set('key2', 'value2');
pipeline.incr('counter');
const results = await pipeline.exec();
```

#### 2. 메모리 관리

```typescript
// TTL 설정으로 자동 정리
await redis.setex('temp:data', 300, data); // 5분 후 자동 삭제

// 메모리 사용량 모니터링
const info = await redis.info('memory');
console.log('Redis 메모리 사용량:', info);
```

#### 3. 에러 처리

```typescript
// 안전한 Redis 작업
export async function safeRedisOperation<T>(
  operation: () => Promise<T>,
  fallback?: T
): Promise<T | null> {
  try {
    return await operation();
  } catch (error) {
    console.error('Redis operation failed:', error);
    return fallback ?? null;
  }
}
```

## 🟢 Supabase RLS 보안 모범 사례

### RLS 기본 설정

```sql
-- 테이블에 RLS 활성화 (필수)
ALTER TABLE servers ENABLE ROW LEVEL SECURITY;
ALTER TABLE server_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
```

### 보안 정책 패턴

#### 1. 사용자별 데이터 격리

```sql
-- 개별 사용자 데이터 접근
CREATE POLICY "Users can only see own servers" ON servers
FOR ALL USING (auth.uid() = user_id);

-- 인덱스 최적화 (필수)
CREATE INDEX idx_servers_user_id ON servers(user_id);
```

#### 2. 팀 기반 접근 제어

```sql
-- 팀 멤버십 확인
CREATE POLICY "Team members can access team servers" ON servers
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM team_members
    WHERE team_id = servers.team_id
    AND user_id = auth.uid()
  )
);

-- 성능 최적화 인덱스
CREATE INDEX idx_team_members_user_team ON team_members(user_id, team_id);
```

#### 3. 역할 기반 권한

```sql
-- 관리자 권한 확인
CREATE POLICY "Admins can manage all data" ON servers
FOR ALL USING (
  (auth.jwt() ->> 'role') = 'admin'
);

-- 읽기 전용 사용자
CREATE POLICY "Read-only access for viewers" ON servers
FOR SELECT USING (
  (auth.jwt() ->> 'role') IN ('viewer', 'admin', 'editor')
);
```

### 중요 보안 원칙

#### 1. JWT 데이터 검증

```sql
-- ❌ 위험: user_metadata 사용 금지
CREATE POLICY "Unsafe policy" ON servers
FOR ALL USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  -- user_metadata는 사용자가 수정 가능!
);

-- ✅ 안전: app_metadata 사용
CREATE POLICY "Safe policy" ON servers
FOR ALL USING (
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  -- app_metadata는 서버에서만 수정 가능
);
```

#### 2. 성능 고려사항

```sql
-- RLS 정책에 사용되는 모든 컬럼에 인덱스 필수
CREATE INDEX idx_servers_user_id ON servers(user_id);
CREATE INDEX idx_servers_team_id ON servers(team_id);
CREATE INDEX idx_servers_created_at ON servers(created_at);

-- 복합 인덱스로 쿼리 최적화
CREATE INDEX idx_servers_user_team ON servers(user_id, team_id);
```

#### 3. 테스트 자동화

```sql
-- pgTAP으로 RLS 정책 테스트
BEGIN;
SELECT plan(3);

-- 테스트 사용자 생성
SET LOCAL "request.jwt.claims" TO '{"sub": "test-user-id", "role": "user"}';

-- 권한 테스트
SELECT ok(
  (SELECT count(*) FROM servers) = 0,
  'User should not see any servers initially'
);

-- 데이터 삽입 테스트
INSERT INTO servers (name, user_id) VALUES ('test-server', 'test-user-id');
SELECT ok(
  (SELECT count(*) FROM servers) = 1,
  'User should see their own server'
);

-- 다른 사용자 데이터 접근 차단 테스트
SET LOCAL "request.jwt.claims" TO '{"sub": "other-user-id", "role": "user"}';
SELECT ok(
  (SELECT count(*) FROM servers) = 0,
  'Other user should not see first users servers'
);

SELECT * FROM finish();
ROLLBACK;
```

### Storage RLS 설정

```sql
-- 스토리지 버킷 RLS 활성화
CREATE POLICY "Users can upload own files" ON storage.objects
FOR INSERT WITH CHECK (auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own files" ON storage.objects
FOR SELECT USING (auth.uid()::text = (storage.foldername(name))[1]);
```

## 🔌 주요 API 엔드포인트

- `/api/servers/*` - 서버 메트릭 CRUD
- `/api/ai/*` - AI 분석 및 예측
- `/api/auth/*` - 인증/인가
- `/api/realtime/*` - 실시간 데이터 스트림
- `/api/admin/*` - 관리자 기능

## 🕐 Time MCP 활용 (필수)

**문서 작성 시 정확한 시간 기록:**

```typescript
// ❌ 잘못된 방법
const now = new Date(); // 서버 타임존에 의존

// ✅ 올바른 방법
const timeInfo = await mcp__time__get_current_time({
  timezone: 'Asia/Seoul',
});
```

**주요 활용처:**

- 문서 헤더 타임스탬프
- CHANGELOG 엔트리
- 이슈 리포트 생성
- 배포 로그 기록
- 서버 메트릭 수집

상세 가이드: [Time MCP 활용 가이드](/docs/time-mcp-usage-guide.md)

## 🔧 MCP 서버 (10개) - Claude Code CLI 설정

### 현재 활성화된 MCP 서버 (2025.7.30 기준)

| 서버명                | 상태         | 용도                   | 패키지                                                    |
| --------------------- | ------------ | ---------------------- | --------------------------------------------------------- |
| `filesystem`          | ✅ Connected | 파일 시스템 작업       | `@modelcontextprotocol/server-filesystem@latest`          |
| `memory`              | ✅ Connected | 지식 그래프 관리       | `@modelcontextprotocol/server-memory@latest`              |
| `github`              | ✅ Connected | GitHub 저장소 관리     | `@modelcontextprotocol/server-github@latest`              |
| `supabase`            | ✅ Connected | 데이터베이스 작업      | `@supabase/mcp-server-supabase@latest`                    |
| `tavily-mcp`          | ✅ Connected | 웹 검색 및 콘텐츠 추출 | `tavily-mcp@0.2.9`                                        |
| `sequential-thinking` | ✅ Connected | 복잡한 문제 해결       | `@modelcontextprotocol/server-sequential-thinking@latest` |
| `playwright`          | ✅ Connected | 브라우저 자동화        | `@playwright/mcp@latest`                                  |
| `time`                | ✅ Connected | 시간/시간대 변환       | `mcp-server-time` (Python)                                |
| `context7`            | ✅ Connected | 라이브러리 문서 검색   | `@upstash/context7-mcp@latest`                            |
| `serena`              | ✅ Connected | 고급 코드 분석         | `git+https://github.com/oraios/serena` (Python)           |

### MCP 서버 설치 방법 (최신)

**중요**: Claude Code v1.16.0부터 MCP 설정이 CLI 기반으로 변경되었습니다.

#### 1. 기본 설치 명령어

```bash
# Node.js 기반 서버
claude mcp add <서버명> npx -- -y <패키지명>@latest

# Python 기반 서버
claude mcp add <서버명> uvx -- <패키지명 또는 git URL>

# 환경변수가 필요한 경우
claude mcp add <서버명> npx -e KEY=value -- -y <패키지명>@latest
```

#### 2. 실제 설치 예시

```bash
# filesystem 서버 (작업 디렉토리 지정)
claude mcp add filesystem npx -- -y @modelcontextprotocol/server-filesystem@latest /mnt/d/cursor/openmanager-vibe-v5

# GitHub 서버 (토큰 필요)
claude mcp add github npx -e GITHUB_PERSONAL_ACCESS_TOKEN=ghp_xxxxx -- -y @modelcontextprotocol/server-github@latest

# Supabase 서버 (프로젝트 ID 필수)
claude mcp add supabase npx -e SUPABASE_URL=https://xxxxx.supabase.co -e SUPABASE_SERVICE_ROLE_KEY=eyJhbGci... -- -y @supabase/mcp-server-supabase@latest --project-ref=xxxxx

# Serena 서버 (프로젝트 경로 필요)
claude mcp add serena uvx -- --from git+https://github.com/oraios/serena serena-mcp-server --context ide-assistant --project /mnt/d/cursor/openmanager-vibe-v5
```

### MCP 서버 관리

```bash
# 서버 목록 및 상태 확인
claude mcp list

# 서버 제거
claude mcp remove <서버명>

# 서버 상세 정보
claude mcp get <서버명>

# Claude API 재시작 (설정 반영)
claude api restart
```

### 설정 위치

- **CLI 설정**: `~/.claude.json`의 projects 섹션
- **구 파일 설정**: `.claude/mcp.json` (더 이상 사용하지 않음)

⚠️ **중요**:

- MCP 서버 설정 후 Claude Code 재시작 필요
- 환경변수는 `-e` 옵션으로 전달
- Python 서버는 `uvx` 명령어 사용

### 문제 해결 가이드

#### MCP 서버 연결 실패 시

1. **패키지 버전 확인**: `@latest` 태그 사용 권장
2. **환경변수 확인**: 토큰이나 API 키가 올바른지 확인
3. **Python 서버**: `uvx --version` 확인 (0.8.0+ 필요)
4. **재시작**: `claude api restart` 실행

#### 자주 발생하는 문제

- **"No MCP servers configured"**: CLI 설정으로 마이그레이션 필요
- **"Failed to connect"**: 패키지가 npm에 없거나 권한 문제
- **환경변수 인식 안됨**: `-e` 옵션으로 직접 전달 필요

### 유용한 MCP 서버 추천

```bash
# 추가 추천 MCP 서버들
# 1. Brave Search - 웹 검색 (tavily 대안)
claude mcp add brave-search npx -e BRAVE_API_KEY=your_key -- -y @modelcontextprotocol/server-brave-search@latest

# 2. Slack - 슬랙 통합
claude mcp add slack npx -e SLACK_BOT_TOKEN=xoxb-xxx -e SLACK_TEAM_ID=xxx -- -y @modelcontextprotocol/server-slack@latest

# 3. Linear - 이슈 트래킹
claude mcp add linear npx -e LINEAR_API_KEY=xxx -- -y @modelcontextprotocol/server-linear@latest

# 4. Puppeteer - 브라우저 자동화 (Playwright 대안)
claude mcp add puppeteer npx -- -y @modelcontextprotocol/server-puppeteer@latest
```

## 🤖 유용한 Sub Agents - 프로젝트 로컬 설정

복잡한 작업 시 Task 도구로 서브 에이전트 활용:

| 작업 유형       | 추천 Agent                   | 용도                          |
| --------------- | ---------------------------- | ----------------------------- |
| 복잡한 작업     | `central-supervisor`         | 마스터 오케스트레이터         |
| 코드 품질       | `code-review-specialist`     | SOLID 원칙, 타입 검사         |
| 보안 검사       | `security-auditor`           | 취약점 탐지, 보안 감사        |
| DB 최적화       | `database-administrator`     | Upstash Redis + Supabase 전담 |
| 성능 개선       | `ux-performance-optimizer`   | Core Web Vitals               |
| 테스트          | `test-automation-specialist` | 테스트 작성/수정              |
| AI 시스템       | `ai-systems-engineer`        | AI 어시스턴트 개발            |
| 문서 구조       | `doc-structure-guardian`     | JBGE 원칙, 문서 정리          |
| 문서 작성       | `doc-writer-researcher`      | 문서 작성, 연구, 지식 합성    |
| 디버깅          | `debugger-specialist`        | 오류 분석, 근본 원인 파악     |
| 플랫폼 모니터링 | `vercel-monitor`             | Vercel 상태, 무료 티어 추적   |
| MCP 관리        | `mcp-server-admin`           | MCP 인프라 관리               |
| AI 협업         | `gemini-cli-collaborator`    | Gemini CLI 연동               |

### 📁 서브 에이전트 설정 위치

- **프로젝트 로컬 설정**: `.claude/agents/` (13개 에이전트 .md 파일)
- **MCP 서버 설정**: `~/.claude.json` (CLI로 관리)
- **매핑 가이드**: `/docs/sub-agents-mcp-mapping-guide.md`
- **글로벌 설정과의 관계**: 프로젝트별로 독립적으로 관리됨

### 🚀 서브 에이전트 역할 분리 원칙

**중요**: 각 에이전트는 명확한 전문 영역만 담당합니다.

- **central-supervisor**: 오케스트레이션만 - 작업 분배, 모니터링, 결과 통합
- **vercel-monitor**: Vercel 플랫폼 모니터링만 - 배포 상태, 사용량, 무료 티어 추적
- **debugger-specialist**: 디버깅만 - 오류 분석, 가설 수립, 최소 수정
- **doc-structure-guardian**: 문서 구조만 - JBGE 원칙, 정리, 아카이빙
- **doc-writer-researcher**: 문서 작성만 - 연구, 지식 합성, 새 문서 생성
- **code-review-specialist**: 코드 품질만 - SOLID, DRY, 복잡도 분석
- **security-auditor**: 보안만 - 취약점 탐지, OWASP, 인증/인가
- **협업 원칙**: 에이전트 간 역할 중복 없이 명확한 책임 분리

```typescript
// 권장 방식 - 작업 목표만 제시
Task({
  subagent_type: 'database-administrator',
  description: 'Redis + DB 최적화',
  prompt: 'Upstash Redis 캐싱과 Supabase PostgreSQL 성능을 최적화해주세요.',
});

// 병렬 처리 - 독립적인 작업은 동시 실행
Task({
  subagent_type: 'vercel-monitor',
  prompt: 'Vercel 플랫폼 상태 및 사용량 분석',
});
Task({
  subagent_type: 'ux-performance-optimizer',
  prompt: '프론트엔드 성능 개선',
});
Task({
  subagent_type: 'database-administrator',
  prompt: 'Upstash Redis 메모리 사용량 분석 및 Supabase 쿼리 최적화',
});
```

### 🔗 서브 에이전트 체이닝 패턴

서브 에이전트들은 central-supervisor의 조율 하에 협업합니다:

```
사용자 요청 → central-supervisor (작업 분석 및 분배)
  ├─ ai-systems-engineer (AI 기능 개발)
  ├─ database-administrator (Upstash Redis + Supabase 최적화)
  ├─ vercel-monitor (Vercel 플랫폼 상태 확인)
  ├─ debugger-specialist (오류 분석 및 해결)
  ├─ code-review-specialist (코드 품질 검증)
  ├─ security-auditor (보안 취약점 검사)
  ├─ doc-structure-guardian (문서 구조 정리)
  └─ doc-writer-researcher (문서 작성 및 연구)
      └─ 모든 결과 → central-supervisor (통합 및 보고)
```

### 📊 실전 성공 사례

- **병렬 처리 효과**: 3개 에이전트 동시 실행으로 30-40% 시간 단축
- **자동 폴백**: AI 엔진 실패 시 200ms 이내 다른 엔진으로 전환
- **캐싱 최적화**: 반복 쿼리 70-80% 시간 절약

## 📋 Claude Code 프로젝트 설정 구조

### 설정 파일 우선순위

1. `.claude/settings.local.json` (개인 로컬 설정)
2. `.claude/settings.json` (팀 공유 설정)
3. `~/.claude/settings.json` (사용자 전역 설정)

### MCP 서버 관리

- **MCP 설정**: CLI 명령어 (`claude mcp add/remove/list`)로 관리
- **서브에이전트**: `.claude/agents/*.md` 파일로 관리
- **독립성**: 각 프로젝트마다 독립적인 설정 유지

## ⚠️ 주의사항 및 트러블슈팅

### 환경 설정

1. **환경 변수**: `.env.local` 필수 (env.local.template 참조)
2. **무료 티어 한계**: [무료 티어 아키텍처](#무료-티어-아키텍처) 섹션 참조
3. **Git Hooks**: Husky 자동 실행 (pre-commit, pre-push)

### 자주 발생하는 문제

- **MCP 연결 오류**: `bash scripts/mcp/reset.sh` 실행
- **타입 에러**: `npm run type-check` → `npm run lint:fix`
- **OAuth 실패**: `.env.local`의 GitHub 키 확인
- **빌드 실패**: Node.js 버전 확인 (v22.15.1 필수)

### 파일 읽기/쓰기 에러

```
Error: File has not been read yet. Read it first before writing to it
```

- **원인**: Claude Code는 기존 파일 수정 시 반드시 Read 도구 먼저 사용
- **해결**: Write/Edit 전에 항상 Read 도구 사용
- **주의**: Sub agents도 동일한 규칙 적용

### 메모리 관리

```bash
# 개발 환경
--max-old-space-size=8192  # 8GB

# 프로덕션
--max-old-space-size=4096  # 4GB
```

## 🚀 배포 및 무료 티어 전략

### Vercel (Frontend)

- **공식 문서**: https://vercel.com/docs
- **명령어**: `vercel --prod` (main 브랜치 자동 배포)
- **환경 변수**: Vercel 대시보드에서 설정
- **무료 한계**: [무료 티어 아키텍처](#무료-티어-아키텍처) 참조

### GCP Functions (Backend API)

- **공식 문서**: https://cloud.google.com/docs
- **Python 함수**: `gcp-functions/` 디렉토리
- **배포**: `scripts/deployment/deploy-all.sh`
- **무료 한계**: [무료 티어 아키텍처](#무료-티어-아키텍처) 참조

### 무료 티어 최적화 전략

- **캐싱**: Redis로 반복 요청 최소화
- **Edge Runtime**: Vercel Edge로 서버 부하 감소
- **요청 배치**: 여러 요청을 하나로 묶어 처리
- **자동 스케일링**: 트래픽에 따라 자동 조절

### 무료 티어 환경변수 상세 설정

```bash
# === Next.js 15 & Vercel 설정 ===
NEXTAUTH_URL=https://your-domain.vercel.app
NEXTAUTH_SECRET=[YOUR_32_CHAR_SECRET]
VERCEL_ENV=production

# === Supabase 설정 ===
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[YOUR_SUPABASE_ANON_KEY]
SUPABASE_SERVICE_ROLE_KEY=[YOUR_SERVICE_ROLE_KEY]  # 서버 전용

# === Upstash Redis 설정 ===
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=[YOUR_REDIS_TOKEN]

# === GitHub OAuth ===
GITHUB_CLIENT_ID=[YOUR_GITHUB_CLIENT_ID]
GITHUB_CLIENT_SECRET=[YOUR_GITHUB_CLIENT_SECRET]

# === GCP Functions ===
GOOGLE_AI_API_KEY=[YOUR_GOOGLE_AI_KEY]
GCP_PROJECT_ID=your-project-id
GCP_REGION=us-central1

# === 서버리스 함수 제한 ===
SERVERLESS_FUNCTION_TIMEOUT=8      # 8초 타임아웃
MEMORY_LIMIT_MB=40                 # 40MB 메모리 제한

# === API 할당량 보호 ===
GOOGLE_AI_DAILY_LIMIT=1000         # Google AI 일일 1000회
SUPABASE_MONTHLY_LIMIT=40000       # Supabase 월 40000회
REDIS_DAILY_LIMIT=8000             # Redis 일일 8000회

# === 메모리 관리 강화 ===
MEMORY_WARNING_THRESHOLD=35        # 35MB 경고 임계값
FORCE_GARBAGE_COLLECTION=true      # 강제 가비지 컬렉션

# === 보안 설정 ===
CRON_SECRET=[YOUR_SECURE_CRON_SECRET_KEY]  # 크론 작업 인증키
JWT_SECRET=[YOUR_JWT_SECRET]               # JWT 토큰 서명
WEBHOOK_SECRET=[YOUR_WEBHOOK_SECRET]       # GitHub 웹훅

# === 모니터링 ===
SENTRY_DSN=[YOUR_SENTRY_DSN]              # 에러 추적 (선택사항)
ANALYTICS_ID=[YOUR_VERCEL_ANALYTICS_ID]   # Vercel Analytics

# === 개발 환경 ===
NODE_ENV=production
LOG_LEVEL=info
DEBUG_MODE=false
```

### 환경변수 보안 체크리스트

1. **절대 공개하면 안 되는 키**:
   - `SUPABASE_SERVICE_ROLE_KEY` (RLS 우회 가능)
   - `GITHUB_CLIENT_SECRET`
   - `JWT_SECRET`, `NEXTAUTH_SECRET`
   - `CRON_SECRET`, `WEBHOOK_SECRET`

2. **공개 가능한 키** (NEXT*PUBLIC* 접두사):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

3. **환경별 분리**:

   ```bash
   # .env.local (개발)
   NODE_ENV=development
   DEBUG_MODE=true

   # Vercel 환경변수 (프로덕션)
   NODE_ENV=production
   DEBUG_MODE=false
   ```

## 💰 Claude + Gemini 협업 전략

토큰 사용량 최적화를 위한 Claude Code와 Gemini CLI 역할 분담:

| 작업 유형   | Claude Code | Gemini CLI | 토큰 절감률 |
| ----------- | ----------- | ---------- | ----------- |
| 코드 생성   | ✅ 주력     | 보조       | -           |
| 코드 분석   | 보조        | ✅ 주력    | 60%         |
| 문서 작성   | ✅ 주력     | 검토       | -           |
| 테스트 작성 | ✅ 주력     | 실행       | -           |
| 리팩토링    | 설계        | ✅ 실행    | 40%         |
| 디버깅      | 분석        | ✅ 해결    | 50%         |

### 실전 협업 예시

```bash
# 1단계: Gemini로 코드 분석 (무료)
gemini analyze src/services --complexity

# 2단계: Claude로 핵심 부분만 개선 (토큰 절약)
"complexity가 높은 processData 함수만 리팩토링해줘"

# 3단계: Gemini로 결과 검증 (무료)
gemini review --changes
```

## 📚 추가 문서

### 프로젝트 문서

- 상세 가이드: `/docs` 폴더
- API 문서: `/docs/api`
- Gemini 협업: `GEMINI.md`
- **MCP 서버 완전 가이드**: `/docs/mcp-servers-complete-guide.md`
- 서브에이전트 정의: `.claude/agents/`

### Claude Code 공식 문서

- [Claude Code 개요](https://docs.anthropic.com/en/docs/claude-code/overview)
- [MCP (Model Context Protocol)](https://docs.anthropic.com/en/docs/claude-code/mcp)
- [서브 에이전트](https://docs.anthropic.com/en/docs/claude-code/sub-agents)
- [설정 가이드](https://docs.anthropic.com/en/docs/claude-code/settings)

---

💡 **핵심 원칙**: 간결성, 재사용성, 타입 안전성, 무료 티어 최적화

📊 **프로젝트 현황**:

- 코드 품질: 475개 → 400개 문제 (15.8% 개선), Critical 에러 99% 해결
- 무료 티어 사용률: Vercel 30%, GCP 15%, Supabase 3%
- GCP Functions: 3개 배포 완료, Python 3.11 최적화
