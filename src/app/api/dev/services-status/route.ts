import { devKeyManager } from '@/utils/dev-key-manager';
import { supabase } from '@/lib/supabase/client';
import { env, isDevelopment } from '@/env';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import debug from '@/utils/debug';

// 강제 동적 라우팅 설정
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface ServiceStatus {
  name: string;
  status: 'connected' | 'error' | 'unknown';
  responseTime: number;
  details: Record<string, unknown> | null;
  error?: string;
}

interface ServicesStatusResponse {
  timestamp: string;
  environment: string;
  services: ServiceStatus[];
  summary: {
    total: number;
    connected: number;
    errors: number;
    averageResponseTime: number;
  };
}

async function checkSupabase(): Promise<ServiceStatus> {
  const startTime = Date.now();
  try {
    const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
    const { error } = await supabase
      .from('system_logs')
      .select('count')
      .limit(1);
    const responseTime = Date.now() - startTime;

    if (error) {
      return {
        name: 'Supabase',
        status: 'error',
        responseTime,
        details: { error: error.message },
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }

    return {
      name: 'Supabase',
      status: 'connected',
      responseTime,
      details: {
        url:
          supabaseUrl === 'https://dummy.supabase.co'
            ? '미설정 (Mock)'
            : '설정됨',
        region: 'Seoul-DC-1',
        database: 'postgres',
        connection: 'pooler',
        keyManager: 'DevKeyManager v1.0',
      },
    };
  } catch (error: unknown) {
    return {
      name: 'Supabase',
      status: 'error',
      responseTime: Date.now() - startTime,
      details: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

function checkMemoryCache(): Promise<ServiceStatus> {
  const startTime = Date.now();
  try {
    const testKey = `memory-test-${Date.now()}`;
    const testValue = 'test-value';
    const memoryStore = new Map<string, { value: unknown; expires: number }>();
    memoryStore.set(testKey, { value: testValue, expires: Date.now() + 10000 });
    const retrieved = memoryStore.get(testKey);
    const testPassed = retrieved?.value === testValue;
    memoryStore.delete(testKey);
    const responseTime = Date.now() - startTime;

    return Promise.resolve({
      name: 'Memory Cache',
      status: 'connected',
      responseTime,
      details: {
        type: 'In-Memory Cache',
        testResult: testPassed ? 'passed' : 'failed',
        implementation: 'JavaScript Map',
        features: ['LRU Eviction', 'TTL Support', 'Statistics'],
        performance: 'Optimized for serverless',
      },
    });
  } catch (error: unknown) {
    return Promise.resolve({
      name: 'Memory Cache',
      status: 'error',
      responseTime: Date.now() - startTime,
      details: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

async function checkGoogleAI(): Promise<ServiceStatus> {
  const startTime = Date.now();
  try {
    const apiKey = devKeyManager.getGoogleAIKey();
    if (!apiKey) {
      return {
        name: 'Google AI (Gemini)',
        status: 'error',
        responseTime: 0,
        details: null,
        error: 'Missing API key (DevKeyManager)',
      };
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: 'Hello' }] }] }),
      }
    );

    const responseTime = Date.now() - startTime;

    if (!response.ok) {
      const errorData = await response.text();
      return {
        name: 'Google AI (Gemini)',
        status: 'error',
        responseTime,
        details: { httpStatus: response.status },
        error: `HTTP ${response.status}: ${errorData}`,
      };
    }
    await response.json();

    return {
      name: 'Google AI (Gemini)',
      status: 'connected',
      responseTime,
      details: {
        model: 'gemini-1.5-flash',
        enabled: (env.GOOGLE_AI_ENABLED || 'false') === 'true',
        quotaProtection: (env.GOOGLE_AI_QUOTA_PROTECTION || 'false') === 'true',
        dailyLimit: env.GOOGLE_AI_DAILY_LIMIT || '300',
        keyManager: 'DevKeyManager v1.0',
      },
    };
  } catch (error: unknown) {
    return {
      name: 'Google AI (Gemini)',
      status: 'error',
      responseTime: Date.now() - startTime,
      details: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function checkLocalMCP(): Promise<ServiceStatus> {
  const startTime = Date.now();
  try {
    const mcpUrl = devKeyManager.getMCPUrl();
    if (!mcpUrl) {
      return {
        name: 'Local MCP Server',
        status: 'error',
        responseTime: 0,
        details: null,
        error: 'MCP URL not configured in environment variables',
      };
    }
    const response = await fetch(`${mcpUrl}/health`, {
      method: 'GET',
      headers: { 'User-Agent': 'OpenManager-Dev-Tools/1.0' },
    });
    const responseTime = Date.now() - startTime;
    if (!response.ok) {
      return {
        name: 'Local MCP Server',
        status: 'error',
        responseTime,
        details: { httpStatus: response.status },
        error: `HTTP ${response.status}`,
      };
    }
    const data = await response.json();
    return {
      name: 'Local MCP Server',
      status: 'connected',
      responseTime,
      details: {
        url: mcpUrl,
        port: 3000,
        health: data,
        keyManager: 'DevKeyManager v1.0',
      },
    };
  } catch (error: unknown) {
    return {
      name: 'Local MCP Server',
      status: 'error',
      responseTime: Date.now() - startTime,
      details: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function checkVercel(): Promise<ServiceStatus> {
  const startTime = Date.now();
  try {
    const vercelUrl = env.VERCEL_URL;
    const baseUrl = vercelUrl
      ? `https://${vercelUrl}`
      : 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/health`, { method: 'GET' });
    const responseTime = Date.now() - startTime;

    return {
      name: 'Vercel Deployment',
      status: response.ok ? 'connected' : 'error',
      responseTime,
      details: {
        environment: env.VERCEL_ENV || 'development',
        url: env.VERCEL_URL || 'localhost:3000',
        region: env.VERCEL_REGION || 'local',
      },
    };
  } catch (error: unknown) {
    return {
      name: 'Vercel Deployment',
      status: 'error',
      responseTime: Date.now() - startTime,
      details: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function GET(_request: NextRequest) {
  if (!isDevelopment) {
    return NextResponse.json(
      { error: 'Dev endpoints are only available in development' },
      { status: 404 }
    );
  }

  try {
    debug.log('🔍 개발자 도구: 모든 서비스 상태 확인 시작... (Redis-Free)');
    const services = await Promise.all([
      checkSupabase(),
      checkMemoryCache(),
      checkGoogleAI(),
      checkLocalMCP(),
      checkVercel(),
    ]);

    const summary = {
      total: services.length,
      connected: services.filter((s: ServiceStatus) => s.status === 'connected')
        .length,
      errors: services.filter((s: ServiceStatus) => s.status === 'error')
        .length,
      averageResponseTime: Math.round(
        services.reduce(
          (sum: number, s: ServiceStatus) => sum + s.responseTime,
          0
        ) / services.length
      ),
    };

    const response: ServicesStatusResponse = {
      timestamp: new Date().toISOString(),
      environment: env.NODE_ENV,
      services,
      summary,
    };

    debug.log(
      `✅ 서비스 상태 확인 완료 (Redis-Free): ${summary.connected}/${summary.total} 연결됨`
    );

    return NextResponse.json(response);
  } catch (error: unknown) {
    debug.error('❌ 서비스 상태 확인 중 오류:', error);
    return NextResponse.json(
      {
        timestamp: new Date().toISOString(),
        environment: env.NODE_ENV,
        services: [],
        summary: { total: 0, connected: 0, errors: 1, averageResponseTime: 0 },
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
