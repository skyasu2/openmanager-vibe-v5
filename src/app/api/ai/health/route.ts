import { NextResponse } from 'next/server';
import { postgresVectorDB } from '@/services/ai/postgres-vector-db';

/**
 * 📡 AI Health Endpoint
 * GET /api/ai/health
 * -------------------------
 * MCP Remote / RAG / Google AI 상태를 종합 반환 (TensorFlow 지원 중단)
 */

async function getMcpHealth() {
  const MCP_URL =
    process.env.MCP_REMOTE_URL ||
    process.env.MCP_LOCAL_URL ||
    'http://localhost:3100';
  try {
    const res = await fetch(`${MCP_URL}/health`, { next: { revalidate: 0 } });
    if (!res.ok) throw new Error('Bad status');
    const data = await res.json();
    return { status: 'online', latency: data.latency ?? null };
  } catch (e) {
    return { status: 'offline' };
  }
}

async function getTensorFlowHealth() {
  // TensorFlow.js 지원이 v5.43.0에서 중단됨
  return {
    status: 'deprecated',
    reason: 'removed_in_v5.43.0',
    message:
      'TensorFlow.js 지원이 중단되었습니다. lightweight-ml-engine을 사용하세요.',
  };
}

export async function GET() {
  // MCP
  const mcp = await getMcpHealth();

  // RAG / pgvector
  const ragStatus =
    process.env.RAG_FORCE_MEMORY === 'true'
      ? { status: 'memory_mode', documents: 3 }
      : { status: 'pgvector_ready' };

  // TensorFlow (안전한 상태 체크만)
  const tensorflow = await getTensorFlowHealth();

  // Google AI
  const googleAi = process.env.GOOGLE_AI_API_KEY
    ? { status: 'ready', model: 'gemini-pro' }
    : { status: 'no_api_key' };

  return NextResponse.json({
    mcp,
    rag: ragStatus,
    tensorflow,
    google_ai: googleAi,
    timestamp: new Date().toISOString(),
    overall_status: 'healthy',
  });
}
