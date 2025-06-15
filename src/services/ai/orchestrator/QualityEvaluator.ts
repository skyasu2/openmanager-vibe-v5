import { EngineResult } from './types';

const DEFAULT_THRESHOLD = Number(process.env.AI_QUALITY_THRESHOLD || 75);
const MIN_SUCCESS_ENGINES = Number(process.env.MIN_SUCCESS_ENGINES || 2);

export function evaluateResponse(results: EngineResult[]): {
  qualityScore: number;
  sufficient: boolean;
} {
  const successful = results.filter(r => r.success);

  if (successful.length === 0) {
    return { qualityScore: 0, sufficient: false };
  }

  const avgConfidence =
    successful.reduce((sum, r) => sum + (r.confidence || 0), 0) /
    successful.length;

  const qualityScore = Math.round(avgConfidence * 100);

  const sufficient =
    successful.length >= MIN_SUCCESS_ENGINES && qualityScore >= DEFAULT_THRESHOLD;

  return { qualityScore, sufficient };
} 