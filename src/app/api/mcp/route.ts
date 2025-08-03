/**
 * 🤖 베르셀 MCP 서버 - 개발 도구 전용
 *
 * 목적:
 * - 로컬 개발 도구(Claude Code, WindSurf Kiro 등)가 배포된 환경에 직접 접속
 * - 개발자가 실시간으로 배포된 환경의 상태를 확인하고 테스트
 *
 * 중요: 프로덕션 AI 기능은 여전히 GCP VM MCP 서버를 사용합니다
 */

import { z } from 'zod';
import { createMcpHandler, type MCPServer } from '@/lib/mcp-handler';

// 🔒 타입 안전성을 위한 인터페이스 정의
interface MCPHandlerArgs {
  [key: string]: unknown;
}

interface MCPHandlerExtra {
  [key: string]: unknown;
}

// 🔍 시스템 상태 확인 함수
const getSystemStatusHandler = async (_args: MCPHandlerArgs, _extra: MCPHandlerExtra) => {
  const status = {
    environment: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV,
    timestamp: new Date().toISOString(),
    uptime: process.uptime ? process.uptime() : 'Edge Runtime',
    region: process.env.VERCEL_REGION || 'unknown',
  };

  return {
    content: [
      {
        type: 'text',
        text: `### 🚀 Vercel 시스템 상태\n\n${JSON.stringify(status, null, 2)}`,
      },
    ],
  };
};

// 🔑 환경변수 확인 함수
const checkEnvConfigHandler = async (_args: MCPHandlerArgs, _extra: MCPHandlerExtra) => {
  const publicEnvs = Object.keys(process.env)
    .filter((key) => key.startsWith('NEXT_PUBLIC_'))
    .reduce(
      (acc, key) => {
        acc[key] = process.env[key]?.substring(0, 10) + '...';
        return acc;
      },
      {} as Record<string, string>
    );

  const criticalEnvs = {
    NODE_ENV: process.env.NODE_ENV,
    VERCEL_ENV: process.env.VERCEL_ENV,
    VERCEL_URL: process.env.VERCEL_URL ? '✅ 설정됨' : '❌ 미설정',
    NEXTAUTH_URL: process.env.NEXTAUTH_URL ? '✅ 설정됨' : '❌ 미설정',
    SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL
      ? '✅ 설정됨'
      : '❌ 미설정',
    UPSTASH_REDIS: process.env.UPSTASH_REDIS_REST_URL
      ? '✅ 설정됨'
      : '❌ 미설정',
  };

  return {
    content: [
      {
        type: 'text',
        text: `### 🔧 환경변수 설정 상태\n\n**중요 환경변수:**\n${JSON.stringify(
          criticalEnvs,
          null,
          2
        )}\n\n**공개 환경변수:**\n${JSON.stringify(publicEnvs, null, 2)}`,
      },
    ],
  };
};

// 📊 API 헬스 체크 함수
const checkApiHealthHandler = async (_args: MCPHandlerArgs, _extra: MCPHandlerExtra) => {
  const endpoints = [
    '/api/health',
    '/api/servers',
    '/api/ai/status',
    '/api/auth/session',
  ];

  const results = await Promise.all(
    endpoints.map(async (endpoint) => {
      try {
        const url = process.env.VERCEL_URL
          ? `https://${process.env.VERCEL_URL}${endpoint}`
          : `http://localhost:3000${endpoint}`;

        const start = Date.now();
        const response = await fetch(url, {
          method: 'GET',
          headers: { 'x-internal-check': 'true' },
        });
        const duration = Date.now() - start;

        return {
          endpoint,
          status: response.status,
          ok: response.ok,
          duration: `${duration}ms`,
        };
      } catch (error) {
        return {
          endpoint,
          status: 'error',
          ok: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    })
  );

  return {
    content: [
      {
        type: 'text',
        text: `### 🏥 API 헬스 체크 결과\n\n${JSON.stringify(results, null, 2)}`,
      },
    ],
  };
};

// 🧪 테스트 메시지 전송 함수
const sendTestMessageHandler = async (args: MCPHandlerArgs, _extra: MCPHandlerExtra) => {
  const messageSchema = z.object({
    message: z.string().describe('전송할 테스트 메시지'),
    level: z
      .enum(['info', 'warning', 'error', 'success'])
      .optional()
      .default('info'),
  });

  const { message, level } = messageSchema.parse(args);

  // 실제로는 로그 시스템이나 모니터링 시스템에 메시지를 전송
  console.log(`[MCP Test ${level.toUpperCase()}] ${message}`);

  return {
    content: [
      {
        type: 'text',
        text: `✅ 테스트 메시지가 성공적으로 전송되었습니다.\n\n- 메시지: ${message}\n- 레벨: ${level}\n- 타임스탬프: ${new Date().toISOString()}`,
      },
    ],
  };
};

// 🗄️ 레디스 캐시 상태 확인 함수
const checkRedisCacheHandler = async (_args: MCPHandlerArgs, _extra: MCPHandlerExtra) => {
  try {
    const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
    const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!REDIS_URL || !REDIS_TOKEN) {
      return {
        content: [
          {
            type: 'text',
            text: '❌ Redis 설정이 없습니다. UPSTASH_REDIS_REST_URL과 UPSTASH_REDIS_REST_TOKEN을 확인하세요.',
          },
        ],
      };
    }

    // Upstash Redis REST API로 INFO 커맨드 실행
    const response = await fetch(`${REDIS_URL}/info`, {
      headers: {
        Authorization: `Bearer ${REDIS_TOKEN}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Redis 연결 실패: ${response.status}`);
    }

    const data = await response.json();

    return {
      content: [
        {
          type: 'text',
          text: `### 🗄️ Redis 캐시 상태\n\n✅ 연결 성공\n\n**서버 정보:**\n${JSON.stringify(
            data.result,
            null,
            2
          )}`,
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `### 🗄️ Redis 캐시 상태\n\n❌ 연결 실패\n\n에러: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`,
        },
      ],
    };
  }
};

// 📊 데이터베이스 연결 확인 함수
const checkDatabaseHandler = async (_args: MCPHandlerArgs, _extra: MCPHandlerExtra) => {
  try {
    // Supabase 연결 확인
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!SUPABASE_URL || !SUPABASE_KEY) {
      return {
        content: [
          {
            type: 'text',
            text: '❌ Supabase 설정이 없습니다. 환경변수를 확인하세요.',
          },
        ],
      };
    }

    // Supabase Health Check
    const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
    });

    return {
      content: [
        {
          type: 'text',
          text: `### 🗄️ 데이터베이스 상태\n\n${
            response.ok ? '✅ Supabase 연결 성공' : '❌ Supabase 연결 실패'
          }\n\n- 상태 코드: ${response.status}\n- URL: ${SUPABASE_URL}`,
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `### 🗄️ 데이터베이스 상태\n\n❌ 연결 실패\n\n에러: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`,
        },
      ],
    };
  }
};

const handler = createMcpHandler((server: MCPServer) => {
  // 🔍 시스템 상태 확인 도구
  server.tool(
    'get_system_status',
    '현재 시스템 상태를 확인합니다',
    {},
    getSystemStatusHandler as any
  );

  // 🔑 환경변수 확인 도구
  server.tool(
    'check_env_config',
    '환경변수 설정 상태를 확인합니다',
    {},
    checkEnvConfigHandler as any
  );

  // 📊 API 헬스 체크 도구
  server.tool(
    'check_api_health',
    'API 엔드포인트 상태를 확인합니다',
    {},
    checkApiHealthHandler as any
  );

  // 🧪 테스트 메시지 전송 도구
  server.tool(
    'send_test_message',
    '테스트 메시지를 전송합니다',
    {
      message: { type: 'string', description: '전송할 테스트 메시지' },
      level: {
        type: 'string',
        enum: ['info', 'warning', 'error', 'success'],
        description: '메시지 레벨',
      },
    },
    sendTestMessageHandler as any
  );

  // 🗄️ 레디스 캐시 상태 확인 도구
  server.tool(
    'check_redis_cache',
    'Redis 캐시 서버 상태를 확인합니다',
    {},
    checkRedisCacheHandler as any
  );

  // 📊 데이터베이스 연결 확인 도구
  server.tool(
    'check_database',
    'Supabase 데이터베이스 연결을 확인합니다',
    {},
    checkDatabaseHandler as any
  );
});

export const { GET, POST } = handler;
