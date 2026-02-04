/**
 * MonitoringContext - 모니터링 파이프라인 통합
 *
 * AlertManager + MetricsAggregator + HealthCalculator → AI/Dashboard 출력
 *
 * @created 2026-02-04
 */

import {
  getKSTTimestamp,
  MetricsProvider,
} from '@/services/metrics/MetricsProvider';
import { type Alert, AlertManager } from './AlertManager';
import { HealthCalculator, type HealthReport } from './HealthCalculator';
import { type AggregatedMetrics, MetricsAggregator } from './MetricsAggregator';

export type MonitoringReport = {
  timestamp: string;
  health: HealthReport;
  aggregated: AggregatedMetrics;
  firingAlerts: Alert[];
};

export class MonitoringContext {
  private alertManager = new AlertManager();
  private aggregator = new MetricsAggregator();
  private healthCalc = new HealthCalculator();

  private static instance: MonitoringContext;

  private constructor() {}

  public static getInstance(): MonitoringContext {
    if (!MonitoringContext.instance) {
      MonitoringContext.instance = new MonitoringContext();
    }
    return MonitoringContext.instance;
  }

  analyze(): MonitoringReport {
    const provider = MetricsProvider.getInstance();
    const allMetrics = provider.getAllServerMetrics();
    const timestamp = getKSTTimestamp();

    // 1. Alert 평가
    const firingAlerts = this.alertManager.evaluate(allMetrics, timestamp);

    // 2. 집계
    const aggregated = this.aggregator.aggregate(allMetrics);

    // 3. 건강도 계산
    const health = this.healthCalc.calculate(aggregated, firingAlerts);

    return { timestamp, health, aggregated, firingAlerts };
  }

  /**
   * AI용 LLM 컨텍스트 (~100 토큰)
   */
  getLLMContext(): string {
    const report = this.analyze();
    const { health, aggregated, firingAlerts, timestamp } = report;

    // 타임스탬프 → KST 시간 표시
    const timeStr = timestamp
      .replace(/T/, ' ')
      .replace(/\.\d+/, '')
      .replace(/\+09:00/, ' KST');

    let ctx = `[Monitoring Report - ${timeStr}]\n`;
    ctx += `System Health: ${health.score}/100 (${health.grade})\n`;
    ctx += `Scrape: node-exporter | ${aggregated.statusCounts.total} targets, ${aggregated.statusCounts.online} UP\n\n`;

    // Active Alerts
    if (firingAlerts.length > 0) {
      ctx += `Active Alerts (${firingAlerts.length}):\n`;
      const sorted = [...firingAlerts].sort((a, b) => {
        if (a.severity === 'critical' && b.severity !== 'critical') return -1;
        if (a.severity !== 'critical' && b.severity === 'critical') return 1;
        return b.value - a.value;
      });
      for (const alert of sorted.slice(0, 5)) {
        const durMin = Math.round(alert.duration / 60);
        ctx += `- ${alert.instance} ${alert.metric}=${alert.value}% [${alert.severity.toUpperCase()}, firing ${durMin}m]\n`;
      }
      ctx += '\n';
    }

    // By Type
    ctx += 'By Type: ';
    ctx += aggregated.byServerType
      .map((t) => `${t.serverType}(${t.count}) avg CPU ${t.avgCpu}%`)
      .join(' | ');
    ctx += '\n';

    // Top CPU
    if (aggregated.topCpu.length > 0) {
      ctx += 'Top CPU: ';
      ctx += aggregated.topCpu
        .slice(0, 3)
        .map((t) => `${t.instance}(${t.value}%)`)
        .join(', ');
      ctx += '\n';
    }

    return ctx;
  }

  /**
   * Dashboard 요약
   */
  getDashboardSummary(): {
    healthScore: number;
    healthGrade: string;
    statusCounts: MonitoringReport['aggregated']['statusCounts'];
    firingAlertCount: number;
    criticalAlertCount: number;
    avgCpu: number;
    avgMemory: number;
  } {
    const report = this.analyze();
    return {
      healthScore: report.health.score,
      healthGrade: report.health.grade,
      statusCounts: report.aggregated.statusCounts,
      firingAlertCount: report.firingAlerts.length,
      criticalAlertCount: report.firingAlerts.filter(
        (a) => a.severity === 'critical'
      ).length,
      avgCpu: report.aggregated.avgCpu,
      avgMemory: report.aggregated.avgMemory,
    };
  }
}
