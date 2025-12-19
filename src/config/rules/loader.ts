/**
 * 🎯 RulesLoader - 시스템 규칙 로더
 *
 * 외부화된 규칙(system-rules.json)을 로드하고 접근하는 서비스.
 * Singleton 패턴으로 구현하여 앱 전체에서 동일한 규칙 참조.
 *
 * @example
 * ```typescript
 * import { rulesLoader, getThreshold, isCritical } from '@/config/rules';
 *
 * // 임계값 조회
 * const cpuThreshold = getThreshold('cpu');
 * console.log(cpuThreshold.critical); // 85
 *
 * // 상태 판정
 * if (isCritical('cpu', 90)) {
 *   console.log('CPU 심각 상태!');
 * }
 * ```
 */

import type {
  SystemRules,
  MetricThreshold,
  IRulesLoader,
  AlertRule,
} from './types';
import systemRulesJson from './system-rules.json';

/**
 * 시스템 규칙 로더 클래스
 */
class RulesLoader implements IRulesLoader {
  private rules: SystemRules;
  private static instance: RulesLoader;

  private constructor() {
    this.rules = this.loadRules();
  }

  /**
   * Singleton 인스턴스 반환
   */
  static getInstance(): RulesLoader {
    if (!RulesLoader.instance) {
      RulesLoader.instance = new RulesLoader();
    }
    return RulesLoader.instance;
  }

  /**
   * 규칙 파일 로드
   */
  private loadRules(): SystemRules {
    // JSON import는 이미 타입이 맞지 않으므로 캐스팅
    return systemRulesJson as unknown as SystemRules;
  }

  /**
   * 전체 규칙 반환
   */
  getRules(): SystemRules {
    return this.rules;
  }

  /**
   * 특정 메트릭의 임계값 조회
   */
  getThreshold(metric: keyof SystemRules['thresholds']): MetricThreshold {
    return this.rules.thresholds[metric];
  }

  /**
   * 모든 임계값 조회
   */
  getAllThresholds(): SystemRules['thresholds'] {
    return this.rules.thresholds;
  }

  /**
   * 값이 경고 수준인지 확인 (warning <= value < critical)
   */
  isWarning(metric: keyof SystemRules['thresholds'], value: number): boolean {
    const threshold = this.getThreshold(metric);
    return value >= threshold.warning && value < threshold.critical;
  }

  /**
   * 값이 심각 수준인지 확인 (value >= critical)
   */
  isCritical(metric: keyof SystemRules['thresholds'], value: number): boolean {
    const threshold = this.getThreshold(metric);
    return value >= threshold.critical;
  }

  /**
   * 값에 따른 상태 결정
   */
  getStatus(
    metric: keyof SystemRules['thresholds'],
    value: number
  ): 'normal' | 'warning' | 'critical' {
    if (this.isCritical(metric, value)) return 'critical';
    if (this.isWarning(metric, value)) return 'warning';
    return 'normal';
  }

  /**
   * 서버 메트릭 전체로 상태 결정
   */
  getServerStatus(metrics: {
    cpu?: number;
    memory?: number;
    disk?: number;
    network?: number;
  }): 'online' | 'warning' | 'critical' {
    const statuses: ('normal' | 'warning' | 'critical')[] = [];

    if (metrics.cpu !== undefined) {
      statuses.push(this.getStatus('cpu', metrics.cpu));
    }
    if (metrics.memory !== undefined) {
      statuses.push(this.getStatus('memory', metrics.memory));
    }
    if (metrics.disk !== undefined) {
      statuses.push(this.getStatus('disk', metrics.disk));
    }
    if (metrics.network !== undefined) {
      statuses.push(this.getStatus('network', metrics.network));
    }

    // 하나라도 critical이면 critical
    if (statuses.includes('critical')) return 'critical';
    // 하나라도 warning이면 warning
    if (statuses.includes('warning')) return 'warning';
    return 'online';
  }

  /**
   * 활성화된 알림 규칙 조회
   */
  getActiveAlertRules(): AlertRule[] {
    return this.rules.alertRules.filter((rule) => rule.enabled);
  }

  /**
   * 특정 메트릭의 알림 규칙 조회
   */
  getAlertRulesForMetric(
    metricType: AlertRule['metricType']
  ): AlertRule[] {
    return this.rules.alertRules.filter(
      (rule) => rule.metricType === metricType && rule.enabled
    );
  }

  /**
   * AI 지시사항 조회 (RAG 연동용)
   */
  getAIInstructions(): string {
    return this.rules.metadata.aiInstructions;
  }

  /**
   * 규칙 버전 조회
   */
  getVersion(): string {
    return this.rules.version;
  }

  /**
   * 규칙 새로고침 (향후 DB 연동 시 사용)
   */
  async refresh(): Promise<void> {
    // Phase 2: Supabase 연동 시 구현
    // const rules = await supabase.from('system_config').select('*');
    this.rules = this.loadRules();
  }

  /**
   * AI 친화적인 규칙 요약 생성
   */
  getSummaryForAI(): string {
    const t = this.rules.thresholds;
    return `
## 현재 시스템 모니터링 임계값 (v${this.rules.version})

| 메트릭 | 경고(Warning) | 심각(Critical) |
|--------|--------------|----------------|
| CPU | ${t.cpu.warning}% | ${t.cpu.critical}% |
| Memory | ${t.memory.warning}% | ${t.memory.critical}% |
| Disk | ${t.disk.warning}% | ${t.disk.critical}% |
| Network | ${t.network.warning}% | ${t.network.critical}% |
| Response Time | ${t.responseTime.warning}ms | ${t.responseTime.critical}ms |

${this.rules.metadata.aiInstructions}
    `.trim();
  }
}

// Singleton 인스턴스
export const rulesLoader = RulesLoader.getInstance();

// 편의 함수들 (직접 import 가능)
export const getRules = () => rulesLoader.getRules();
export const getThreshold = (metric: keyof SystemRules['thresholds']) =>
  rulesLoader.getThreshold(metric);
export const getAllThresholds = () => rulesLoader.getAllThresholds();
export const isWarning = (
  metric: keyof SystemRules['thresholds'],
  value: number
) => rulesLoader.isWarning(metric, value);
export const isCritical = (
  metric: keyof SystemRules['thresholds'],
  value: number
) => rulesLoader.isCritical(metric, value);
export const getStatus = (
  metric: keyof SystemRules['thresholds'],
  value: number
) => rulesLoader.getStatus(metric, value);
export const getServerStatus = (metrics: {
  cpu?: number;
  memory?: number;
  disk?: number;
  network?: number;
}) => rulesLoader.getServerStatus(metrics);
export const getActiveAlertRules = () => rulesLoader.getActiveAlertRules();
export const getAIInstructions = () => rulesLoader.getAIInstructions();
export const getSummaryForAI = () => rulesLoader.getSummaryForAI();
