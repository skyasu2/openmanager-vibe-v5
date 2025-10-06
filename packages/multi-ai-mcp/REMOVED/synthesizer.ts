/**
 * Multi-AI Result Synthesizer
 *
 * Analyzes responses from Codex/Gemini/Qwen
 * Finds consensus, conflicts, and provides recommendations
 */

import type { AIResponse, Conflict, MultiAIResult } from './types.js';

export function synthesizeResults(
  query: string,
  codexResult?: AIResponse,
  geminiResult?: AIResponse,
  qwenResult?: AIResponse
): MultiAIResult {
  const results: MultiAIResult['results'] = {};

  if (codexResult) results.codex = codexResult;
  if (geminiResult) results.gemini = geminiResult;
  if (qwenResult) results.qwen = qwenResult;

  // Calculate performance metrics
  const successCount = [codexResult, geminiResult, qwenResult]
    .filter(r => r?.success).length;
  const totalCount = [codexResult, geminiResult, qwenResult]
    .filter(r => r !== undefined).length;
  const totalTime = Math.max(
    codexResult?.responseTime || 0,
    geminiResult?.responseTime || 0,
    qwenResult?.responseTime || 0
  );

  // Find consensus points (mentioned by 2+ AIs)
  const consensus = findConsensus(codexResult, geminiResult, qwenResult);

  // Find conflicts (different opinions)
  const conflicts = findConflicts(codexResult, geminiResult, qwenResult);

  // Generate final recommendation
  const recommendation = generateRecommendation(
    query,
    consensus,
    conflicts,
    codexResult,
    geminiResult,
    qwenResult
  );

  return {
    query,
    timestamp: new Date().toISOString(),
    results,
    synthesis: {
      consensus,
      conflicts,
      recommendation
    },
    performance: {
      totalTime,
      successRate: totalCount > 0 ? successCount / totalCount : 0
    }
  };
}

function findConsensus(
  codex?: AIResponse,
  gemini?: AIResponse,
  qwen?: AIResponse
): string[] {
  const consensus: string[] = [];

  const responses = [codex?.response, gemini?.response, qwen?.response]
    .filter((r): r is string => !!r && r.length > 0);

  if (responses.length < 2) return consensus;

  // Enhanced pattern detection with semantic categories
  const semanticPatterns = {
    recommendation: {
      patterns: [/권장|recommended|suggest|should/i],
      label: '권장사항'
    },
    improvement: {
      patterns: [/개선|improve|enhance|optimize|better/i],
      label: '개선 필요'
    },
    issue: {
      patterns: [/문제|problem|issue|bug|error/i],
      label: '문제점'
    },
    performance: {
      patterns: [/성능|performance|speed|fast|slow/i],
      label: '성능'
    },
    architecture: {
      patterns: [/구조|architecture|design|pattern/i],
      label: '아키텍처'
    },
    testing: {
      patterns: [/테스트|test|testing|coverage/i],
      label: '테스트'
    }
  };

  // Check each semantic category
  for (const [category, config] of Object.entries(semanticPatterns)) {
    const matchCount = responses.filter(r =>
      config.patterns.some(p => p.test(r))
    ).length;

    if (matchCount >= 2) {
      consensus.push(`✓ ${config.label}: ${matchCount}개 AI 합의`);
    }
  }

  // Check for specific numeric agreement (e.g., "90%", "5배")
  const numericPattern = /(\d+)(%|배|점|개)/g;
  const numericMentions: Record<string, number> = {};

  responses.forEach(r => {
    const matches = r.matchAll(numericPattern);
    for (const match of matches) {
      const key = match[0];
      numericMentions[key] = (numericMentions[key] || 0) + 1;
    }
  });

  Object.entries(numericMentions)
    .filter(([_, count]) => count >= 2)
    .forEach(([value, count]) => {
      consensus.push(`✓ 수치 합의: "${value}" ${count}회 언급`);
    });

  return consensus;
}

function findConflicts(
  codex?: AIResponse,
  gemini?: AIResponse,
  qwen?: AIResponse
): Conflict[] {
  const conflicts: Conflict[] = [];

  // Detect conflicts based on sentiment or key recommendations
  const hasPositive = (text?: string) => text && /긍정|positive|good|recommend/i.test(text);
  const hasNegative = (text?: string) => text && /부정|negative|not recommend|avoid/i.test(text);

  const codexPositive = hasPositive(codex?.response);
  const geminiPositive = hasPositive(gemini?.response);
  const qwenPositive = hasPositive(qwen?.response);

  const codexNegative = hasNegative(codex?.response);
  const geminiNegative = hasNegative(gemini?.response);
  const qwenNegative = hasNegative(qwen?.response);

  // If opinions diverge significantly
  const positiveCount = [codexPositive, geminiPositive, qwenPositive].filter(Boolean).length;
  const negativeCount = [codexNegative, geminiNegative, qwenNegative].filter(Boolean).length;

  if (positiveCount > 0 && negativeCount > 0) {
    conflicts.push({
      issue: '평가 의견 불일치',
      codexView: codexPositive ? '긍정적' : codexNegative ? '부정적' : '중립',
      geminiView: geminiPositive ? '긍정적' : geminiNegative ? '부정적' : '중립',
      qwenView: qwenPositive ? '긍정적' : qwenNegative ? '부정적' : '중립'
    });
  }

  return conflicts;
}

function generateRecommendation(
  query: string,
  consensus: string[],
  conflicts: Conflict[],
  codex?: AIResponse,
  gemini?: AIResponse,
  qwen?: AIResponse
): string {
  const successfulAIs = [codex, gemini, qwen].filter(r => r?.success);

  if (successfulAIs.length === 0) {
    return '❌ 모든 AI 실행 실패. 쿼리를 다시 시도해주세요.';
  }

  if (successfulAIs.length === 1) {
    return `⚠️ 1개 AI만 응답. ${successfulAIs[0]?.provider} 의견을 참고하되 추가 검증 권장.`;
  }

  if (consensus.length > 0 && conflicts.length === 0) {
    return `✅ ${successfulAIs.length}개 AI 합의 달성. ${consensus.length}개 공통 의견 확인.`;
  }

  if (conflicts.length > 0) {
    return `⚠️ ${conflicts.length}개 의견 충돌 발견. 각 AI 관점을 개별 검토 권장.`;
  }

  return `📊 ${successfulAIs.length}개 AI 응답 완료. 결과를 종합 검토하세요.`;
}
