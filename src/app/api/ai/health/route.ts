import { NextResponse } from 'next/server';
import { postgresVectorDB } from '@/services/ai/postgres-vector-db';
import { getTensorFlowStatus, isTensorFlowAvailable } from '@/utils/loadTf';

/**
 * 📡 AI Health Endpoint
 * GET /api/ai/health
 * -------------------------
 * MCP Remote / RAG / TensorFlow / Google AI 상태를 종합 반환
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
  const tfStatus = getTensorFlowStatus();

  if (!tfStatus.available) {
    return {
      status: 'disabled',
      reason: tfStatus.reason,
      message: tfStatus.message,
    };
  }

  // 실제 로드 테스트는 하지 않고 환경만 체크
  return {
    status: 'available',
    backend: 'cpu',
    message: 'TensorFlow 동적 로드 준비됨',
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
