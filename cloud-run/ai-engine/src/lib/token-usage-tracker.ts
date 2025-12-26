/**
 * Token Usage Tracking Utility
 *
 * AI 모델별 토큰 사용량을 추적하고 비용을 추정합니다.
 *
 * 기능:
 * 1. 에이전트별 토큰 사용량 기록
 * 2. 일일/월별 사용량 집계
 * 3. 비용 추정 (Mistral/Groq 요금제 기준)
 * 4. Quota 경고 알림
 *
 * Updated: 2025-12-26 - Migrated from Gemini to Mistral AI
 *
 * 참고:
 * - Groq: https://console.groq.com/settings/usage
 * - Mistral: https://mistral.ai/pricing/
 */

import { AGENT_MODEL_CONFIG, type AgentType } from './model-config';

// ============================================================================
// 1. Types
// ============================================================================

export type AIProvider = 'mistral' | 'groq' | 'cerebras';

export interface TokenUsageEntry {
  timestamp: string;
  agentType: AgentType;
  model: string;
  provider: AIProvider;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  durationMs: number;
  success: boolean;
  errorType?: string;
}

export interface TokenUsageStats {
  totalInputTokens: number;
  totalOutputTokens: number;
  totalTokens: number;
  requestCount: number;
  successCount: number;
  failureCount: number;
  avgDurationMs: number;
  estimatedCostUSD: number;
}

export interface AgentUsageStats extends TokenUsageStats {
  agentType: AgentType;
  model: string;
  provider: AIProvider;
}

export interface DailyUsageReport {
  date: string;
  totalStats: TokenUsageStats;
  byAgent: Record<AgentType, AgentUsageStats>;
  byProvider: {
    mistral: TokenUsageStats;
    groq: TokenUsageStats;
  };
  quotaStatus: QuotaStatus;
}

export interface QuotaStatus {
  groq: {
    rpd: { used: number; limit: number; percentage: number };
    tpd: { used: number; limit: number; percentage: number };
  };
  mistral: {
    rpd: { used: number; limit: number; percentage: number };
    rpm: { used: number; limit: number; percentage: number };
  };
  alerts: QuotaAlert[];
}

export interface QuotaAlert {
  provider: AIProvider;
  type: 'rpd' | 'tpd' | 'rpm';
  severity: 'warning' | 'critical';
  message: string;
  currentUsage: number;
  limit: number;
}

// ============================================================================
// 2. Pricing Configuration (as of Dec 2025)
// ============================================================================

/**
 * 가격 정보 (USD per 1M tokens)
 * - Groq: Free tier (rate limited) / Pay-as-you-go
 * - Mistral: Free tier for experimentation
 */
export const TOKEN_PRICING = {
  mistral: {
    'mistral-small-latest': { input: 0.0, output: 0.0 }, // Free tier for experimentation
    'mistral-medium-latest': { input: 0.27, output: 0.81 },
    'mistral-large-latest': { input: 2.0, output: 6.0 },
    'open-mistral-7b': { input: 0.0, output: 0.0 }, // Free
    'open-mixtral-8x7b': { input: 0.0, output: 0.0 }, // Free
    'open-mixtral-8x22b': { input: 0.0, output: 0.0 }, // Free
  },
  groq: {
    'llama-3.1-8b-instant': { input: 0.05, output: 0.08 },
    'llama-3.3-70b-versatile': { input: 0.59, output: 0.79 },
  },
} as const;

/**
 * Quota 제한 (Free tier 기준)
 */
export const QUOTA_LIMITS = {
  groq: {
    rpd: 14_400, // Requests per day
    tpd: 500_000, // Tokens per day
    rpm: 30, // Requests per minute
  },
  mistral: {
    // Mistral Free tier limits (generous)
    rpd: 10_000, // Requests per day (estimate)
    rpm: 60, // Requests per minute
    tpd: 2_000_000, // Tokens per day (estimate)
  },
};

// ============================================================================
// 3. Token Usage Tracker Implementation
// ============================================================================

export class TokenUsageTracker {
  private entries: TokenUsageEntry[] = [];
  private readonly maxEntries: number;
  private minuteWindowStart: number = Date.now();
  private requestsThisMinute: { mistral: number; groq: number; cerebras: number } = { mistral: 0, groq: 0, cerebras: 0 };

  constructor(maxEntries = 10_000) {
    this.maxEntries = maxEntries;
  }

  // ============================================================================
  // 3.1 Recording
  // ============================================================================

  /**
   * 토큰 사용량 기록
   */
  recordUsage(
    agentType: AgentType,
    inputTokens: number,
    outputTokens: number,
    durationMs: number,
    success: boolean,
    errorType?: string
  ): void {
    const config = AGENT_MODEL_CONFIG[agentType];

    const entry: TokenUsageEntry = {
      timestamp: new Date().toISOString(),
      agentType,
      model: config.model,
      provider: config.provider,
      inputTokens,
      outputTokens,
      totalTokens: inputTokens + outputTokens,
      durationMs,
      success,
      errorType,
    };

    this.entries.push(entry);

    // 분당 요청 수 업데이트
    this.updateMinuteWindow(config.provider);

    // 최대 엔트리 수 유지
    if (this.entries.length > this.maxEntries) {
      this.entries.shift();
    }

    // 디버그 로깅
    if (process.env.DEBUG_TOKEN_USAGE === 'true') {
      console.log(`📊 [TokenUsage] ${agentType} (${config.model}): ${inputTokens}+${outputTokens}=${entry.totalTokens} tokens`);
    }
  }

  /**
   * 분당 요청 수 업데이트
   */
  private updateMinuteWindow(provider: AIProvider): void {
    const now = Date.now();
    if (now - this.minuteWindowStart > 60_000) {
      this.minuteWindowStart = now;
      this.requestsThisMinute = { mistral: 0, groq: 0, cerebras: 0 };
    }
    this.requestsThisMinute[provider]++;
  }

  // ============================================================================
  // 3.2 Statistics
  // ============================================================================

  /**
   * 오늘의 사용량 통계
   */
  getTodayStats(): DailyUsageReport {
    const today = new Date().toISOString().split('T')[0];
    const todayEntries = this.entries.filter((e) => e.timestamp.startsWith(today));

    return this.buildDailyReport(today, todayEntries);
  }

  /**
   * 특정 날짜의 사용량 통계
   */
  getStatsForDate(date: string): DailyUsageReport {
    const dateEntries = this.entries.filter((e) => e.timestamp.startsWith(date));
    return this.buildDailyReport(date, dateEntries);
  }

  /**
   * 에이전트별 사용량 통계
   */
  getStatsByAgent(agentType: AgentType): AgentUsageStats {
    const agentEntries = this.entries.filter((e) => e.agentType === agentType);
    const config = AGENT_MODEL_CONFIG[agentType];

    return {
      agentType,
      model: config.model,
      provider: config.provider,
      ...this.calculateStats(agentEntries, config.provider, config.model),
    };
  }

  /**
   * 일일 리포트 생성
   */
  private buildDailyReport(date: string, entries: TokenUsageEntry[]): DailyUsageReport {
    const byAgent = {} as Record<AgentType, AgentUsageStats>;
    const agentTypes: AgentType[] = ['supervisor', 'nlq', 'analyst', 'reporter', 'verifier'];

    for (const agentType of agentTypes) {
      const agentEntries = entries.filter((e) => e.agentType === agentType);
      const config = AGENT_MODEL_CONFIG[agentType];

      byAgent[agentType] = {
        agentType,
        model: config.model,
        provider: config.provider,
        ...this.calculateStats(agentEntries, config.provider, config.model),
      };
    }

    const mistralEntries = entries.filter((e) => e.provider === 'mistral');
    const groqEntries = entries.filter((e) => e.provider === 'groq');

    const byProvider = {
      mistral: this.calculateStats(mistralEntries, 'mistral', 'mistral-small-latest'),
      groq: this.calculateStats(groqEntries, 'groq', 'llama-3.3-70b-versatile'),
    };

    const totalStats = this.calculateStats(entries, 'groq', 'llama-3.3-70b-versatile');
    totalStats.estimatedCostUSD = byProvider.mistral.estimatedCostUSD + byProvider.groq.estimatedCostUSD;

    return {
      date,
      totalStats,
      byAgent,
      byProvider,
      quotaStatus: this.calculateQuotaStatus(entries),
    };
  }

  /**
   * 통계 계산
   */
  private calculateStats(
    entries: TokenUsageEntry[],
    provider: AIProvider,
    model: string
  ): TokenUsageStats {
    if (entries.length === 0) {
      return {
        totalInputTokens: 0,
        totalOutputTokens: 0,
        totalTokens: 0,
        requestCount: 0,
        successCount: 0,
        failureCount: 0,
        avgDurationMs: 0,
        estimatedCostUSD: 0,
      };
    }

    const totalInputTokens = entries.reduce((sum, e) => sum + e.inputTokens, 0);
    const totalOutputTokens = entries.reduce((sum, e) => sum + e.outputTokens, 0);
    const successCount = entries.filter((e) => e.success).length;
    const totalDuration = entries.reduce((sum, e) => sum + e.durationMs, 0);

    // Type-safe pricing lookup
    let inputPricing = 0;
    let outputPricing = 0;

    if (provider === 'mistral') {
      const mistralPricing = TOKEN_PRICING.mistral[model as keyof typeof TOKEN_PRICING.mistral];
      if (mistralPricing) {
        inputPricing = mistralPricing.input;
        outputPricing = mistralPricing.output;
      }
    } else if (provider === 'groq') {
      const groqPricing = TOKEN_PRICING.groq[model as keyof typeof TOKEN_PRICING.groq];
      if (groqPricing) {
        inputPricing = groqPricing.input;
        outputPricing = groqPricing.output;
      }
    }

    const estimatedCostUSD =
      (totalInputTokens / 1_000_000) * inputPricing +
      (totalOutputTokens / 1_000_000) * outputPricing;

    return {
      totalInputTokens,
      totalOutputTokens,
      totalTokens: totalInputTokens + totalOutputTokens,
      requestCount: entries.length,
      successCount,
      failureCount: entries.length - successCount,
      avgDurationMs: Math.round(totalDuration / entries.length),
      estimatedCostUSD: Math.round(estimatedCostUSD * 10000) / 10000, // 4 decimal places
    };
  }

  /**
   * Quota 상태 계산
   */
  private calculateQuotaStatus(entries: TokenUsageEntry[]): QuotaStatus {
    const today = new Date().toISOString().split('T')[0];
    const todayEntries = entries.filter((e) => e.timestamp.startsWith(today));

    const groqEntries = todayEntries.filter((e) => e.provider === 'groq');
    const mistralEntries = todayEntries.filter((e) => e.provider === 'mistral');

    const groqRpd = groqEntries.length;
    const groqTpd = groqEntries.reduce((sum, e) => sum + e.totalTokens, 0);
    const mistralRpd = mistralEntries.length;

    const alerts: QuotaAlert[] = [];

    // Groq RPD 체크
    if (groqRpd >= QUOTA_LIMITS.groq.rpd * 0.9) {
      alerts.push({
        provider: 'groq',
        type: 'rpd',
        severity: groqRpd >= QUOTA_LIMITS.groq.rpd ? 'critical' : 'warning',
        message: `Groq RPD quota at ${((groqRpd / QUOTA_LIMITS.groq.rpd) * 100).toFixed(1)}%`,
        currentUsage: groqRpd,
        limit: QUOTA_LIMITS.groq.rpd,
      });
    }

    // Groq TPD 체크
    if (groqTpd >= QUOTA_LIMITS.groq.tpd * 0.9) {
      alerts.push({
        provider: 'groq',
        type: 'tpd',
        severity: groqTpd >= QUOTA_LIMITS.groq.tpd ? 'critical' : 'warning',
        message: `Groq TPD quota at ${((groqTpd / QUOTA_LIMITS.groq.tpd) * 100).toFixed(1)}%`,
        currentUsage: groqTpd,
        limit: QUOTA_LIMITS.groq.tpd,
      });
    }

    // Mistral RPD 체크
    if (mistralRpd >= QUOTA_LIMITS.mistral.rpd * 0.9) {
      alerts.push({
        provider: 'mistral',
        type: 'rpd',
        severity: mistralRpd >= QUOTA_LIMITS.mistral.rpd ? 'critical' : 'warning',
        message: `Mistral RPD quota at ${((mistralRpd / QUOTA_LIMITS.mistral.rpd) * 100).toFixed(1)}%`,
        currentUsage: mistralRpd,
        limit: QUOTA_LIMITS.mistral.rpd,
      });
    }

    // RPM 체크 (현재 분)
    if (this.requestsThisMinute.mistral >= QUOTA_LIMITS.mistral.rpm * 0.8) {
      alerts.push({
        provider: 'mistral',
        type: 'rpm',
        severity: this.requestsThisMinute.mistral >= QUOTA_LIMITS.mistral.rpm ? 'critical' : 'warning',
        message: `Mistral RPM at ${this.requestsThisMinute.mistral}/${QUOTA_LIMITS.mistral.rpm}`,
        currentUsage: this.requestsThisMinute.mistral,
        limit: QUOTA_LIMITS.mistral.rpm,
      });
    }

    return {
      groq: {
        rpd: {
          used: groqRpd,
          limit: QUOTA_LIMITS.groq.rpd,
          percentage: Math.round((groqRpd / QUOTA_LIMITS.groq.rpd) * 100),
        },
        tpd: {
          used: groqTpd,
          limit: QUOTA_LIMITS.groq.tpd,
          percentage: Math.round((groqTpd / QUOTA_LIMITS.groq.tpd) * 100),
        },
      },
      mistral: {
        rpd: {
          used: mistralRpd,
          limit: QUOTA_LIMITS.mistral.rpd,
          percentage: Math.round((mistralRpd / QUOTA_LIMITS.mistral.rpd) * 100),
        },
        rpm: {
          used: this.requestsThisMinute.mistral,
          limit: QUOTA_LIMITS.mistral.rpm,
          percentage: Math.round((this.requestsThisMinute.mistral / QUOTA_LIMITS.mistral.rpm) * 100),
        },
      },
      alerts,
    };
  }

  // ============================================================================
  // 3.3 Reporting
  // ============================================================================

  /**
   * 텍스트 리포트 생성
   */
  generateReport(): string {
    const report = this.getTodayStats();

    const lines = [
      '═══════════════════════════════════════════════════════════════',
      '                   TOKEN USAGE REPORT                          ',
      '═══════════════════════════════════════════════════════════════',
      '',
      `📅 Date: ${report.date}`,
      '',
      '───────────────────────────────────────────────────────────────',
      '                      TOTAL USAGE                               ',
      '───────────────────────────────────────────────────────────────',
      `  Total Requests:      ${report.totalStats.requestCount}`,
      `  Success Rate:        ${((report.totalStats.successCount / Math.max(1, report.totalStats.requestCount)) * 100).toFixed(1)}%`,
      `  Total Tokens:        ${report.totalStats.totalTokens.toLocaleString()}`,
      `    - Input:           ${report.totalStats.totalInputTokens.toLocaleString()}`,
      `    - Output:          ${report.totalStats.totalOutputTokens.toLocaleString()}`,
      `  Estimated Cost:      $${report.totalStats.estimatedCostUSD.toFixed(4)}`,
      `  Avg Duration:        ${report.totalStats.avgDurationMs}ms`,
      '',
      '───────────────────────────────────────────────────────────────',
      '                     BY PROVIDER                                ',
      '───────────────────────────────────────────────────────────────',
      `  Mistral AI:          ${report.byProvider.mistral.requestCount} requests, ${report.byProvider.mistral.totalTokens.toLocaleString()} tokens, $${report.byProvider.mistral.estimatedCostUSD.toFixed(4)}`,
      `  Groq (LLaMA):        ${report.byProvider.groq.requestCount} requests, ${report.byProvider.groq.totalTokens.toLocaleString()} tokens, $${report.byProvider.groq.estimatedCostUSD.toFixed(4)}`,
      '',
      '───────────────────────────────────────────────────────────────',
      '                     BY AGENT                                   ',
      '───────────────────────────────────────────────────────────────',
    ];

    for (const [agentType, stats] of Object.entries(report.byAgent)) {
      if (stats.requestCount > 0) {
        lines.push(`  ${agentType.padEnd(12)}: ${stats.requestCount} requests, ${stats.totalTokens.toLocaleString()} tokens`);
      }
    }

    lines.push('');
    lines.push('───────────────────────────────────────────────────────────────');
    lines.push('                     QUOTA STATUS                              ');
    lines.push('───────────────────────────────────────────────────────────────');
    lines.push(`  Groq RPD:            ${report.quotaStatus.groq.rpd.used}/${report.quotaStatus.groq.rpd.limit} (${report.quotaStatus.groq.rpd.percentage}%)`);
    lines.push(`  Groq TPD:            ${report.quotaStatus.groq.tpd.used.toLocaleString()}/${report.quotaStatus.groq.tpd.limit.toLocaleString()} (${report.quotaStatus.groq.tpd.percentage}%)`);
    lines.push(`  Mistral RPD:         ${report.quotaStatus.mistral.rpd.used}/${report.quotaStatus.mistral.rpd.limit} (${report.quotaStatus.mistral.rpd.percentage}%)`);
    lines.push(`  Mistral RPM:         ${report.quotaStatus.mistral.rpm.used}/${report.quotaStatus.mistral.rpm.limit} (${report.quotaStatus.mistral.rpm.percentage}%)`);

    if (report.quotaStatus.alerts.length > 0) {
      lines.push('');
      lines.push('───────────────────────────────────────────────────────────────');
      lines.push('                        ALERTS                                 ');
      lines.push('───────────────────────────────────────────────────────────────');
      for (const alert of report.quotaStatus.alerts) {
        const icon = alert.severity === 'critical' ? '🔴' : '🟡';
        lines.push(`  ${icon} [${alert.severity.toUpperCase()}] ${alert.message}`);
      }
    }

    lines.push('');
    lines.push('═══════════════════════════════════════════════════════════════');

    return lines.join('\n');
  }

  /**
   * JSON 형식 리포트
   */
  toJSON(): DailyUsageReport {
    return this.getTodayStats();
  }

  /**
   * Prometheus 형식 메트릭
   */
  toPrometheus(): string {
    const report = this.getTodayStats();

    return [
      '# HELP ai_engine_token_usage_total Total tokens used',
      '# TYPE ai_engine_token_usage_total counter',
      `ai_engine_token_usage_total{type="input"} ${report.totalStats.totalInputTokens}`,
      `ai_engine_token_usage_total{type="output"} ${report.totalStats.totalOutputTokens}`,
      '',
      '# HELP ai_engine_requests_total Total requests made',
      '# TYPE ai_engine_requests_total counter',
      `ai_engine_requests_total{status="success"} ${report.totalStats.successCount}`,
      `ai_engine_requests_total{status="failure"} ${report.totalStats.failureCount}`,
      '',
      '# HELP ai_engine_quota_usage_ratio Quota usage ratio',
      '# TYPE ai_engine_quota_usage_ratio gauge',
      `ai_engine_quota_usage_ratio{provider="groq",type="rpd"} ${report.quotaStatus.groq.rpd.percentage / 100}`,
      `ai_engine_quota_usage_ratio{provider="groq",type="tpd"} ${report.quotaStatus.groq.tpd.percentage / 100}`,
      `ai_engine_quota_usage_ratio{provider="mistral",type="rpd"} ${report.quotaStatus.mistral.rpd.percentage / 100}`,
      `ai_engine_quota_usage_ratio{provider="mistral",type="rpm"} ${report.quotaStatus.mistral.rpm.percentage / 100}`,
      '',
      '# HELP ai_engine_estimated_cost_usd Estimated cost in USD',
      '# TYPE ai_engine_estimated_cost_usd gauge',
      `ai_engine_estimated_cost_usd ${report.totalStats.estimatedCostUSD}`,
    ].join('\n');
  }

  // ============================================================================
  // 3.4 Utilities
  // ============================================================================

  /**
   * 엔트리 초기화
   */
  clear(): void {
    this.entries = [];
    this.requestsThisMinute = { mistral: 0, groq: 0, cerebras: 0 };
    console.log('📊 [TokenUsageTracker] Cleared all entries');
  }

  /**
   * 엔트리 수 반환
   */
  getEntryCount(): number {
    return this.entries.length;
  }
}

// ============================================================================
// 4. Singleton Instance
// ============================================================================

let trackerInstance: TokenUsageTracker | null = null;

/**
 * 글로벌 Token Usage Tracker 인스턴스 반환
 */
export function getTokenUsageTracker(): TokenUsageTracker {
  if (!trackerInstance) {
    trackerInstance = new TokenUsageTracker();
    console.log('📊 [TokenUsageTracker] Initialized');
  }
  return trackerInstance;
}

/**
 * Token Usage Tracker 인스턴스 리셋 (테스트용)
 */
export function resetTokenUsageTracker(): void {
  if (trackerInstance) {
    trackerInstance.clear();
    trackerInstance = null;
    console.log('📊 [TokenUsageTracker] Reset');
  }
}

// ============================================================================
// 5. Helper Functions for Integration
// ============================================================================

/**
 * 간단한 사용량 기록 헬퍼
 */
export function trackTokenUsage(
  agentType: AgentType,
  inputTokens: number,
  outputTokens: number,
  durationMs: number,
  success = true,
  errorType?: string
): void {
  const tracker = getTokenUsageTracker();
  tracker.recordUsage(agentType, inputTokens, outputTokens, durationMs, success, errorType);
}

/**
 * 빠른 상태 확인 (API 엔드포인트용)
 */
export function getTokenUsageStatus(): {
  todayTokens: number;
  todayRequests: number;
  estimatedCostUSD: number;
  quotaAlerts: number;
} {
  const tracker = getTokenUsageTracker();
  const report = tracker.getTodayStats();

  return {
    todayTokens: report.totalStats.totalTokens,
    todayRequests: report.totalStats.requestCount,
    estimatedCostUSD: report.totalStats.estimatedCostUSD,
    quotaAlerts: report.quotaStatus.alerts.length,
  };
}
