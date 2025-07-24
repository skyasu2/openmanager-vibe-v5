# 🚀 Vercel MCP 설정 가이드

> **최종 업데이트**: 2025년 7월 24일  
> **문서 용도**: Vercel 환경에서 MCP 서버 설정 및 운영

## 📋 개요

Vercel MCP는 배포된 환경을 직접 테스트하고 디버깅할 수 있는 개발 도구용 MCP 서버입니다. AI 개발 도구(Claude Code, Cursor 등)에서 배포된 환경에 직접 접속하여 실시간으로 상태를 확인할 수 있습니다.

## 🏗️ 아키텍처

### 기술 스택

- **패키지**: `mcp-handler` v1.0.1
- **런타임**: Vercel Edge Runtime
- **프로토콜**: HTTP POST (MCP over HTTP)
- **엔드포인트**: `/api/mcp`

### 3-Tier MCP 아키텍처에서의 위치

```
1. 로컬 개발 MCP → 코드 작성 및 개발
2. GCP VM MCP → 프로덕션 AI 기능
3. Vercel MCP → 배포 환경 테스트 (이 문서)
```

## 🔧 설정 방법

### 1. 패키지 설치

```bash
npm install mcp-handler
```

### 2. API Route 생성

`/app/api/mcp/route.ts` 파일 생성:

```typescript
import { createMcpHandler } from 'mcp-handler';
import { z } from 'zod';

// 도구 핸들러 정의
const getSystemStatusHandler = async (_args: any, _extra: any) => {
  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify(
          {
            environment: process.env.NODE_ENV,
            vercelEnv: process.env.VERCEL_ENV,
            timestamp: new Date().toISOString(),
            uptime: 'Edge Runtime',
            region: process.env.VERCEL_REGION || 'unknown',
          },
          null,
          2
        ),
      },
    ],
  };
};

// MCP 핸들러 생성
const handler = createMcpHandler(
  server => {
    // 도구 등록
    server.tool(
      'get_system_status',
      '시스템 상태를 확인합니다',
      {},
      getSystemStatusHandler
    );

    // 추가 도구들...
  },
  {
    capabilities: {
      tools: { listChanged: true },
    },
  },
  { basePath: '/api' }
);

export { handler as GET, handler as POST };
```

### 3. Vercel 배포 설정

#### vercel.json 설정

```json
{
  "functions": {
    "app/api/mcp/route.ts": {
      "maxDuration": 30
    }
  },
  "headers": [
    {
      "source": "/api/mcp",
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "*"
        },
        {
          "key": "Access-Control-Allow-Methods",
          "value": "GET, POST, OPTIONS"
        }
      ]
    }
  ]
}
```

#### 환경 변수 설정

Vercel 대시보드 또는 CLI에서:

```bash
vercel env add VERCEL_MCP_ENABLED production
```

## 📖 mcp-handler 패키지 사용법

### 기본 구조

```typescript
import { createMcpHandler } from 'mcp-handler';

const handler = createMcpHandler(
  server => {
    // 서버 설정 콜백
  },
  {
    // 옵션
  },
  {
    // 설정
  }
);
```

### 도구 등록 패턴

#### 단순 도구

```typescript
server.tool(
  'tool_name',
  '도구 설명',
  {}, // 파라미터 스키마 (없음)
  async (_args, _extra) => {
    return {
      content: [
        {
          type: 'text',
          text: '응답 내용',
        },
      ],
    };
  }
);
```

#### 파라미터가 있는 도구

```typescript
server.tool(
  'health_check',
  'API 헬스체크를 수행합니다',
  {
    endpoint: z.string().default('/api/health'),
  },
  async ({ endpoint }, _extra) => {
    const response = await fetch(endpoint);
    return {
      content: [
        {
          type: 'text',
          text: `Status: ${response.status}`,
        },
      ],
    };
  }
);
```

### 에러 처리

```typescript
const handler = async (args: any, extra: any) => {
  try {
    // 도구 로직
    return { content: [{ type: 'text', text: 'Success' }] };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error.message}`,
        },
      ],
    };
  }
};
```

## 🛠️ 제공되는 도구

### 1. get_system_status

시스템의 현재 상태를 확인합니다.

### 2. check_env_config

환경변수 설정 상태를 확인합니다.

### 3. health_check

API 엔드포인트의 상태를 확인합니다.

- 파라미터: `endpoint` (기본값: "/api/health")

### 4. get_recent_logs

최근 로그를 조회합니다.

- 파라미터: `limit` (1-100, 기본값: 10)
- 현재 구현 예정

### 5. get_project_info

프로젝트의 상세 정보를 조회합니다.

### 6. debug_deployment

배포 환경 문제에 대한 디버깅 가이드를 제공합니다.

- 파라미터: `issue` (문제 설명)

## 🔌 MCP 클라이언트 연결

### Claude Code에서 사용

1. 프로젝트 설정에서 MCP 서버 추가
2. URL: `https://your-app.vercel.app/api/mcp`
3. 프로토콜: HTTP

### 프로그래밍 방식

```javascript
const mcpClient = new MCPClient({
  url: 'https://your-app.vercel.app/api/mcp',
  protocol: 'http',
});

// 도구 호출
const result = await mcpClient.callTool('get_system_status');
```

## 🚨 트러블슈팅

### 일반적인 문제

#### 1. "Method not allowed" 오류

```bash
# 해결: GET과 POST 모두 export
export { handler as GET, handler as POST };
```

#### 2. CORS 오류

```bash
# 해결: vercel.json에 CORS 헤더 추가
{
  "headers": [{
    "source": "/api/mcp",
    "headers": [
      { "key": "Access-Control-Allow-Origin", "value": "*" }
    ]
  }]
}
```

#### 3. Timeout 오류

```bash
# 해결: maxDuration 설정
{
  "functions": {
    "app/api/mcp/route.ts": {
      "maxDuration": 30
    }
  }
}
```

### 디버깅 방법

#### 1. 로컬 테스트

```bash
# Vercel CLI로 로컬 실행
vercel dev

# 테스트
curl -X POST http://localhost:3000/api/mcp \
  -H "Content-Type: application/json" \
  -d '{"method": "tools/list"}'
```

#### 2. 로그 확인

```bash
# Vercel 로그 확인
vercel logs --follow
```

#### 3. 환경변수 확인

```bash
# 환경변수 목록
vercel env ls

# 특정 환경변수 확인
vercel env pull
```

## 📊 성능 최적화

### Edge Runtime 최적화

- 콜드 스타트 최소화
- 메모리 사용량 최적화
- 응답 크기 제한

### 캐싱 전략

```typescript
// 응답 캐싱
return new Response(JSON.stringify(result), {
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'public, s-maxage=60',
  },
});
```

### 모니터링

- Vercel Analytics 활용
- 커스텀 메트릭 추가
- 에러 추적 설정

## 🔒 보안 고려사항

### 인증 추가 (선택사항)

```typescript
const handler = createMcpHandler(
  server => {
    // 도구 등록
  },
  {
    authenticate: async request => {
      const token = request.headers.get('Authorization');
      return token === process.env.MCP_SECRET;
    },
  }
);
```

### Rate Limiting

```typescript
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '1 m'),
});
```

## 🚀 고급 기능

### Redis 연동 (로그 저장)

```typescript
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

const getRecentLogsHandler = async ({ limit }: { limit: number }) => {
  const logs = await redis.lrange('logs', 0, limit - 1);
  return {
    content: [
      {
        type: 'text',
        text: logs.join('\n'),
      },
    ],
  };
};
```

### Supabase 연동 (데이터 조회)

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

const getDataHandler = async () => {
  const { data, error } = await supabase.from('table').select('*');

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(data, null, 2),
      },
    ],
  };
};
```

## 📚 참고 자료

- [MCP 공식 문서](https://modelcontextprotocol.io/)
- [Vercel Edge Runtime 문서](https://vercel.com/docs/functions/edge-runtime)
- [mcp-handler npm 패키지](https://www.npmjs.com/package/mcp-handler)
- [프로젝트 MCP 아키텍처 가이드](./mcp-unified-architecture-guide.md)
