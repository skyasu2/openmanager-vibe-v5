import { NextResponse } from 'next/server';
import { postgresVectorDB } from '@/services/ai/postgres-vector-db';
import { loadTf } from '@/utils/loadTf';

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

export async function GET() {
  // MCP
  const mcp = await getMcpHealth();

  // RAG / pgvector
  const ragStatus = await postgresVectorDB.getStats().then(async stats => {
    const health = await postgresVectorDB.healthCheck();
    return { ...health, ...stats };
  });

  // TensorFlow
  const tf = await loadTf();
  const tensorflow = tf ? 'loaded' : 'unavailable';

  // Google AI
  const googleAI = process.env.GOOGLE_AI_API_KEY ? 'enabled' : 'missing_key';

  return NextResponse.json({ mcp, rag: ragStatus, tensorflow, googleAI });
}
