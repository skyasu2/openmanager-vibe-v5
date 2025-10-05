/**
 * AI Cross-Verification History Manager
 *
 * Manages recording and retrieval of AI cross-verification results
 */

import { writeFile, mkdir, readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import type { AIQueryRequest, AIResponse, Conflict } from '../types.js';

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
  };
  metadata: {
    version: string;
    environment: string;
  };
}

/**
 * Get history directory path
 */
function getHistoryDir(): string {
  // packages/multi-ai-mcp/history/
  return join(process.cwd(), 'packages', 'multi-ai-mcp', 'history');
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
      synthesis: synthesis || {
        consensus: [],
        conflicts: [],
        totalTime: 0,
        successRate: 0,
      },
      metadata: {
        version: '1.1.0',
        environment: process.env.NODE_ENV || 'development',
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

    const historyFiles = files
      .filter(f => f.endsWith('.json'))
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
