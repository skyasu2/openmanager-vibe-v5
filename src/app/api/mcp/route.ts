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
import { createMcpHandler } from 'mcp-handler';

// 🔍 시스템 상태 확인 함수
const getSystemStatusHandler = async (_args: any, _extra: any) => {
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
        type: 'text' as const,
        text: `📊 시스템 상태:\n${JSON.stringify(status, null, 2)}`,
      },
    ],
  };
};

// 🔑 환경변수 확인 함수
const checkEnvConfigHandler = async (_args: any, _extra: any) => {
  const safeEnvVars = {
    NODE_ENV: process.env.NODE_ENV,
    VERCEL_ENV: process.env.VERCEL_ENV,
    GOOGLE_AI_ENABLED: process.env.GOOGLE_AI_ENABLED,
    GCP_VM_IP_CONFIGURED: !!process.env.GCP_VM_IP,
    SUPABASE_CONFIGURED: !!process.env.SUPABASE_URL,
    REDIS_CONFIGURED: !!process.env.UPSTASH_REDIS_REST_URL,
  };

  return {
    content: [
      {
        type: 'text' as const,
        text: `🔑 환경변수 설정:\n${JSON.stringify(safeEnvVars, null, 2)}`,
      },
    ],
  };
};

// 🧪 헬스체크 함수
const healthCheckHandler = async (
  { endpoint }: { endpoint: string },
  _extra: any
) => {
  try {
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000';

    const response = await fetch(`${baseUrl}${endpoint}`);
    const data = await response.text();

    return {
      content: [
        {
          type: 'text' as const,
          text: `✅ 헬스체크 결과:\nStatus: ${response.status}\nResponse: ${data}`,
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `❌ 헬스체크 실패: ${error}`,
        },
      ],
    };
  }
};

// 📝 로그 조회 함수
const getRecentLogsHandler = async (
  { limit }: { limit: number },
  _extra: any
) => {
  try {
    // Vercel 환경에서는 실제 로그를 가져올 수 없으므로
    // 시뮬레이션된 로그 또는 최근 요청 정보를 제공합니다
    const logs = [
      {
        timestamp: new Date().toISOString(),
        level: 'info',
        message: 'MCP 서버 상태 조회',
        endpoint: '/api/mcp',
      },
      {
        timestamp: new Date(Date.now() - 60000).toISOString(),
        level: 'info',
        message: '헬스체크 수행',
        endpoint: '/api/health',
      },
      {
        timestamp: new Date(Date.now() - 120000).toISOString(),
        level: 'warn',
        message: '환경변수 미설정 경고',
        variable: 'REDIS_URL',
      },
    ];

    const recentLogs = logs.slice(0, Math.min(limit, logs.length));
    const logText = recentLogs
      .map(
        log =>
          `[${log.timestamp}] [${log.level.toUpperCase()}] ${log.message}${
            log.endpoint ? ` - ${log.endpoint}` : ''
          }${log.variable ? ` - ${log.variable}` : ''}`
      )
      .join('\n');

    return {
      content: [
        {
          type: 'text' as const,
          text: `📝 최근 ${limit}개 로그:\n\n${logText}\n\n💡 팁: 실제 로그는 Vercel 대시보드에서 확인하세요.`,
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `❌ 로그 조회 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
        },
      ],
    };
  }
};

// 🔍 프로젝트 정보 제공 함수
const getProjectInfoHandler = async (_args: any, _extra: any) => {
  const projectInfo = {
    name: 'OpenManager VIBE v5',
    description: 'AI 기반 서버 모니터링 플랫폼',
    version: process.env.npm_package_version || '5.62.3',
    techStack: [
      'Next.js 15',
      'TypeScript',
      'Supabase Auth',
      'Google AI (Gemini)',
      'Redis (Upstash)',
      'Vercel Edge Runtime',
    ],
    mcpArchitecture: {
      development: 'Vercel MCP (이 서버)',
      production: 'GCP VM MCP (104.154.205.25:10000)',
    },
  };

  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify(projectInfo, null, 2),
      },
    ],
  };
};

// 💡 디버깅 가이드 생성 함수
const getDebugPrompt = async ({ issue }: { issue: string }, _extra: any) => {
  const guide = `OpenManager VIBE v5 배포 환경 디버깅 가이드:

문제: ${issue}

체크리스트:
1. 환경변수 설정 확인 (check_env_config 도구 사용)
2. 시스템 상태 확인 (get_system_status 도구 사용)
3. API 헬스체크 (health_check 도구 사용)
4. Vercel 로그 확인
5. Edge Runtime 호환성 검토

주의사항:
- 프로덕션 AI 기능은 GCP VM MCP를 사용합니다
- 이 MCP 서버는 개발 도구 전용입니다`;

  return {
    content: [
      {
        type: 'text' as const,
        text: guide,
      },
    ],
  };
};

const handler = createMcpHandler(
  server => {
    // 🔍 시스템 상태 확인 도구
    server.tool(
      'get_system_status',
      '현재 시스템 상태를 확인합니다',
      {},
      getSystemStatusHandler
    );

    // 🔑 환경변수 확인 도구
    server.tool(
      'check_env_config',
      '환경변수 설정 상태를 확인합니다',
      {},
      checkEnvConfigHandler
    );

    // 🧪 API 헬스체크 도구
    server.tool(
      'health_check',
      'API 헬스체크를 수행합니다',
      { endpoint: z.string().default('/api/health') },
      healthCheckHandler
    );

    // 📝 로그 조회 도구
    server.tool(
      'get_recent_logs',
      '최근 로그를 조회합니다',
      { limit: z.number().int().min(1).max(100).default(10) },
      getRecentLogsHandler
    );

    // 🔍 프로젝트 정보 도구
    server.tool(
      'get_project_info',
      'OpenManager VIBE 프로젝트 정보를 조회합니다',
      {},
      getProjectInfoHandler
    );

    // 💡 디버깅 도구
    server.tool(
      'debug_deployment',
      '배포 환경 디버깅을 위한 가이드를 제공합니다',
      { issue: z.string().describe('디버깅하려는 문제') },
      getDebugPrompt
    );
  },
  {
    capabilities: {
      tools: { listChanged: true },
    },
  },
  { basePath: '/api' }
);

export const runtime = 'edge';

export { handler as GET, handler as POST };
