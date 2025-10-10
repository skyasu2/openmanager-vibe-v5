/**
 * Basic History Manager
 *
 * Simplified history recording for individual AI queries
 * v3.0.0 - Infrastructure layer only
 */

import { writeFile, mkdir, readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { homedir } from 'os';

export interface BasicHistoryRecord {
  timestamp: string;
  provider: 'codex' | 'gemini' | 'qwen';
  query: string;
  success: boolean;
  responseTime: number;
  error?: string;
}

// History directory in user's home
const HISTORY_DIR = join(homedir(), '.multi-ai-history');

/**
 * Ensure history directory exists
 */
async function ensureHistoryDir(): Promise<void> {
  if (!existsSync(HISTORY_DIR)) {
    await mkdir(HISTORY_DIR, { recursive: true });
  }
}

/**
 * Get history file path for today
 */
function getHistoryFilePath(): string {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  return join(HISTORY_DIR, `${today}.json`);
}

/**
 * Record a basic history entry
 */
export async function recordBasicHistory(
  provider: 'codex' | 'gemini' | 'qwen',
  query: string,
  success: boolean,
  responseTime: number,
  error?: string
): Promise<void> {
  await ensureHistoryDir();

  const record: BasicHistoryRecord = {
    timestamp: new Date().toISOString(),
    provider,
    query: query.substring(0, 200), // Truncate long queries
    success,
    responseTime,
    error,
  };

  const filePath = getHistoryFilePath();

  // Read existing records
  let records: BasicHistoryRecord[] = [];
  if (existsSync(filePath)) {
    try {
      const content = await readFile(filePath, 'utf-8');
      records = JSON.parse(content);
    } catch (error) {
      // Invalid JSON, start fresh
      console.error('[History] Failed to read existing history:', error);
    }
  }

  // Append new record
  records.push(record);

  // Write back
  await writeFile(filePath, JSON.stringify(records, null, 2), 'utf-8');
}

/**
 * Get recent history records
 */
export async function getRecentBasicHistory(limit: number = 10): Promise<BasicHistoryRecord[]> {
  await ensureHistoryDir();

  const filePath = getHistoryFilePath();

  if (!existsSync(filePath)) {
    return [];
  }

  try {
    const content = await readFile(filePath, 'utf-8');
    const records: BasicHistoryRecord[] = JSON.parse(content);

    // Return last N records (most recent)
    return records.slice(-limit).reverse();
  } catch (error) {
    console.error('[History] Failed to read history:', error);
    return [];
  }
}
