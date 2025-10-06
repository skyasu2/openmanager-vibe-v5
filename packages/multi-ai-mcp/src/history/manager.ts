/**
 * AI Cross-Verification History Manager
 *
 * Manages recording and retrieval of AI cross-verification results
 */

import { writeFile, mkdir, readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import type { AIQueryRequest, AIResponse, Conflict } from '../types.js';

// ES Module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface VerificationHistory {
  timestamp: string;
  query: string;
  mode: {
    codex: boolean;
    gemini: boolean;
    qwen: boolean;
    qwenPlanMode: boolean;
  };
  results: {
    codex?: AIResponse;
    gemini?: AIResponse;
    qwen?: AIResponse;
  };
  synthesis: {
    consensus: string[];
    conflicts: Conflict[];
    totalTime: number;
    successRate: number;
    reasoning?: string; // 판정 근거 (왜 합의/충돌했는지)
  };
  performance: {
    codexTime: number;
    geminiTime: number;
    qwenTime: number;
    parallelEfficiency: number; // totalTime / max(individual times)
  };
  metadata: {
    version: string;
    environment: string;
    nodeVersion: string;
    platform: string;
  };
}

/**
 * Get history directory path
 * Uses __dirname to ensure correct path regardless of execution context
 */
function getHistoryDir(): string {
  // src/history/manager.ts → packages/multi-ai-mcp/history/
  return join(__dirname, '..', '..', 'history');
}

/**
 * Ensure history directory exists
 */
async function ensureHistoryDir(): Promise<void> {
  const dir = getHistoryDir();
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true });
  }
}

/**
 * Generate filename from timestamp
 */
function generateFilename(): string {
  const now = new Date();
  const timestamp = now.toISOString()
    .replace(/:/g, '-')
    .replace(/\..+/, '');
  return `${timestamp}-verification.json`;
}

/**
 * Record verification history
 */
export async function recordVerification(
  request: AIQueryRequest,
  codex?: AIResponse,
  gemini?: AIResponse,
  qwen?: AIResponse,
  synthesis?: {
    consensus: string[];
    conflicts: Conflict[];
    totalTime: number;
    successRate: number;
  }
): Promise<string> {
  try {
    await ensureHistoryDir();

    // Calculate performance metrics
    const codexTime = codex?.responseTime || 0;
    const geminiTime = gemini?.responseTime || 0;
    const qwenTime = qwen?.responseTime || 0;
    const maxTime = Math.max(codexTime, geminiTime, qwenTime);
    const totalTime = synthesis?.totalTime || maxTime;
    const parallelEfficiency = maxTime > 0 ? totalTime / maxTime : 1;

    // Generate reasoning for synthesis
    const consensusCount = synthesis?.consensus?.length || 0;
    const conflictCount = synthesis?.conflicts?.length || 0;
    const successRate = synthesis?.successRate || 0;
    const reasoning = consensusCount > 0
      ? `${consensusCount}개 AI 합의 달성, ${conflictCount}개 충돌, 성공률 ${(successRate * 100).toFixed(0)}%`
      : conflictCount > 0
      ? `${conflictCount}개 충돌 발견, 추가 검증 권장`
      : '응답 없음 또는 실패';

    const history: VerificationHistory = {
      timestamp: new Date().toISOString(),
      query: request.query,
      mode: {
        codex: request.includeCodex ?? true,
        gemini: request.includeGemini ?? true,
        qwen: request.includeQwen ?? true,
        qwenPlanMode: request.qwenPlanMode ?? true,
      },
      results: {
        ...(codex && { codex }),
        ...(gemini && { gemini }),
        ...(qwen && { qwen }),
      },
      synthesis: {
        consensus: synthesis?.consensus || [],
        conflicts: synthesis?.conflicts || [],
        totalTime: synthesis?.totalTime || 0,
        successRate: synthesis?.successRate || 0,
        reasoning,
      },
      performance: {
        codexTime,
        geminiTime,
        qwenTime,
        parallelEfficiency,
      },
      metadata: {
        version: '2.3.0',
        environment: process.env.NODE_ENV || 'development',
        nodeVersion: process.version,
        platform: process.platform,
      },
    };

    const filename = generateFilename();
    const filepath = join(getHistoryDir(), filename);

    await writeFile(filepath, JSON.stringify(history, null, 2), 'utf-8');

    return filepath;
  } catch (error) {
    console.error('Failed to record verification history:', error);
    return '';
  }
}

/**
 * Get recent verification history
 */
export async function getRecentHistory(limit: number = 10): Promise<VerificationHistory[]> {
  try {
    await ensureHistoryDir();

    const dir = getHistoryDir();
    const fs = await import('fs/promises');
    const files = await fs.readdir(dir);

    // Filter for timestamp-based verification files only
    // Pattern: YYYY-MM-DDTHH-MM-SS-verification.json
    const historyFiles = files
      .filter(f => f.endsWith('.json') && /^\d{4}-\d{2}-\d{2}T/.test(f))
      .sort()
      .reverse()
      .slice(0, limit);

    const histories: VerificationHistory[] = [];

    for (const file of historyFiles) {
      const content = await readFile(join(dir, file), 'utf-8');
      histories.push(JSON.parse(content));
    }

    return histories;
  } catch (error) {
    console.error('Failed to get verification history:', error);
    return [];
  }
}

/**
 * Search verification history by query pattern
 */
export async function searchHistory(queryPattern: string): Promise<VerificationHistory[]> {
  try {
    const allHistory = await getRecentHistory(100); // Search last 100

    return allHistory.filter(h =>
      h.query.toLowerCase().includes(queryPattern.toLowerCase())
    );
  } catch (error) {
    console.error('Failed to search verification history:', error);
    return [];
  }
}

/**
 * Get verification statistics
 */
export async function getHistoryStats(): Promise<{
  totalVerifications: number;
  averageSuccessRate: number;
  averageResponseTime: number;
  aiUsage: {
    codex: number;
    gemini: number;
    qwen: number;
  };
}> {
  try {
    const allHistory = await getRecentHistory(100);

    const stats = {
      totalVerifications: allHistory.length,
      averageSuccessRate: 0,
      averageResponseTime: 0,
      aiUsage: {
        codex: 0,
        gemini: 0,
        qwen: 0,
      },
    };

    if (allHistory.length === 0) return stats;

    let totalSuccessRate = 0;
    let totalTime = 0;

    for (const h of allHistory) {
      totalSuccessRate += h.synthesis.successRate;
      totalTime += h.synthesis.totalTime;

      if (h.results.codex) stats.aiUsage.codex++;
      if (h.results.gemini) stats.aiUsage.gemini++;
      if (h.results.qwen) stats.aiUsage.qwen++;
    }

    stats.averageSuccessRate = totalSuccessRate / allHistory.length;
    stats.averageResponseTime = totalTime / allHistory.length;

    return stats;
  } catch (error) {
    console.error('Failed to get history stats:', error);
    return {
      totalVerifications: 0,
      averageSuccessRate: 0,
      averageResponseTime: 0,
      aiUsage: { codex: 0, gemini: 0, qwen: 0 },
    };
  }
}
