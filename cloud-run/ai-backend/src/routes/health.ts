/**
 * Health Check Route
 * Cloud Run 헬스체크 및 상태 확인
 */

import { Hono } from 'hono';

export const healthRoute = new Hono();

healthRoute.get('/', async (c) => {
  const startTime = Date.now();

  // 환경 변수 확인
  const envStatus = {
    GROQ_API_KEY: !!process.env.GROQ_API_KEY,
    GOOGLE_AI_API_KEY: !!process.env.GOOGLE_AI_API_KEY,
    SUPABASE_DIRECT_URL: !!process.env.SUPABASE_DIRECT_URL,
  };

  const allEnvReady = Object.values(envStatus).every(Boolean);

  return c.json({
    status: allEnvReady ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    latency: Date.now() - startTime,
    environment: {
      nodeVersion: process.version,
      platform: process.platform,
      env: process.env.NODE_ENV || 'development',
    },
    services: {
      groq: envStatus.GROQ_API_KEY ? 'configured' : 'missing',
      googleAI: envStatus.GOOGLE_AI_API_KEY ? 'configured' : 'missing',
      supabase: envStatus.SUPABASE_DIRECT_URL ? 'configured' : 'missing',
    },
    agents: {
      supervisor: 'Groq Llama-3.1-8b-instant',
      nlqAgent: 'Gemini 2.5 Flash',
      analystAgent: 'Gemini 2.5 Pro',
      reporterAgent: 'Groq Llama-3.3-70b-versatile',
    },
  });
});

healthRoute.get('/ready', async (c) => {
  // Kubernetes/Cloud Run readiness probe
  const hasRequiredEnv =
    process.env.GROQ_API_KEY && process.env.GOOGLE_AI_API_KEY;

  if (!hasRequiredEnv) {
    return c.json(
      { ready: false, reason: 'Missing required environment variables' },
      503
    );
  }

  return c.json({ ready: true });
});

healthRoute.get('/live', async (c) => {
  // Kubernetes/Cloud Run liveness probe
  return c.json({ alive: true, timestamp: Date.now() });
});
