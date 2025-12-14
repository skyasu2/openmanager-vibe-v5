/**
 * OpenManager AI Backend - Hono Server
 * Cloud Run 배포용 LangGraph Multi-Agent 서버
 */

import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { secureHeaders } from 'hono/secure-headers';
import { healthRoute } from './routes/health.js';
import { unifiedStreamRoute } from './routes/unified-stream.js';

const app = new Hono();

// ============================================================================
// Middleware
// ============================================================================

// CORS 설정 (Vercel 도메인 허용)
app.use(
  '*',
  cors({
    origin: [
      'https://openmanager-vibe-v5.vercel.app',
      'https://*.vercel.app',
      'http://localhost:3000',
    ],
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-Session-Id'],
    exposeHeaders: ['X-Session-Id', 'X-Target-Agent'],
    credentials: true,
  })
);

// 보안 헤더
app.use('*', secureHeaders());

// 로깅
app.use('*', logger());

// ============================================================================
// Routes
// ============================================================================

// 헬스체크
app.route('/health', healthRoute);

// AI 라우트 (LangGraph Multi-Agent)
app.route('/api/ai/unified-stream', unifiedStreamRoute);

// 기본 라우트
app.get('/', (c) => {
  return c.json({
    service: 'OpenManager AI Backend',
    version: '1.0.0',
    status: 'running',
    agents: ['supervisor', 'nlq-agent', 'analyst-agent', 'reporter-agent'],
  });
});

// ============================================================================
// Server Start
// ============================================================================

const port = Number(process.env.PORT) || 8080;

console.log(`🚀 AI Backend starting on port ${port}...`);
console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);

serve({
  fetch: app.fetch,
  port,
});

console.log(`✅ AI Backend running at http://localhost:${port}`);
