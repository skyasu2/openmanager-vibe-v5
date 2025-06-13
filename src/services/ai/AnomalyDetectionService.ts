import { TimeSeriesMetrics, LogEntry } from '@/types/ai-agent-input-schema';
import { GoogleAIService } from './GoogleAIService';
import { createSafeError } from '@/lib/error-handler';

export interface Anomaly {
  timestamp: Date;
  metric: string;
  value: number;
  severity: 'warning' | 'critical';
  description: string;
  source: 'metrics' | 'logs';
}

interface AnomalyDetectionConfig {
  metricThresholds?: {
    [key: string]: {
      warning: number;
      critical: number;
    };
  };
  logKeywords?: {
    warning?: string[];
    critical?: string[];
  };
  statisticalSensitivity?: number; // 1.0 (normal) to 3.0 (very sensitive)
}

export class AnomalyDetectionService {
  private aiService: GoogleAIService;

  constructor() {
    this.aiService = new GoogleAIService();
  }

  /**
   * 메트릭과 로그 데이터에서 이상 징후를 탐지합니다.
   * @param metrics 시계열 메트릭 데이터
   * @param logs 로그 데이터
   * @param config 탐지 설정
   * @returns 탐지된 이상 징후 목록
   */
  async detect(
    metrics: TimeSeriesMetrics[],
    logs: LogEntry[],
    config: AnomalyDetectionConfig = {}
  ): Promise<Anomaly[]> {
    try {
      const metricAnomalies = this.detectFromMetrics(metrics, config);
      const logAnomalies = this.detectFromLogs(logs, config);

      const allAnomalies = [...metricAnomalies, ...logAnomalies];

      if (allAnomalies.length > 5) {
        // 너무 많은 이상 징후가 감지되면 AI를 통해 핵심 원인 요약
        const summary = await this.summarizeAnomalies(allAnomalies);
        // 요약된 내용을 기반으로 하나의 critical 이상 징후로 묶음
        return [
          {
            timestamp: new Date(),
            metric: 'multiple',
            value: allAnomalies.length,
            severity: 'critical',
            description: `대규모 이상 징후 감지: ${summary}`,
            source: 'metrics',
          },
        ];
      }

      return allAnomalies;
    } catch (error) {
      const safeError = createSafeError(error);
      console.error('❌ 이상 징후 탐지 실패:', safeError);
      return []; // 오류 발생 시 빈 배열 반환
    }
  }

  /**
   * 통계 기반으로 메트릭 이상 징후를 탐지합니다.
   */
  private detectFromMetrics(
    metrics: TimeSeriesMetrics[],
    config: AnomalyDetectionConfig
  ): Anomaly[] {
    const anomalies: Anomaly[] = [];
    const sensitivity = config.statisticalSensitivity || 1.5;

    // CPU 사용률 분석
    const cpuUsages = metrics.map(m => m.system.cpu.usage);
    const { mean: cpuMean, std: cpuStd } = this.calculateStats(cpuUsages);
    const cpuThreshold = cpuMean + cpuStd * sensitivity;

    metrics.forEach(m => {
      if (m.system.cpu.usage > cpuThreshold && m.system.cpu.usage > 60) {
        anomalies.push({
          timestamp: m.timestamp,
          metric: 'cpu_usage',
          value: m.system.cpu.usage,
          severity: m.system.cpu.usage > 90 ? 'critical' : 'warning',
          description: `CPU 사용률이 비정상적으로 높습니다 (평균: ${cpuMean.toFixed(1)}%, 현재: ${m.system.cpu.usage.toFixed(1)}%).`,
          source: 'metrics',
        });
      }
    });

    return anomalies;
  }

  /**
   * 키워드 기반으로 로그 이상 징후를 탐지합니다.
   */
  private detectFromLogs(
    logs: LogEntry[],
    config: AnomalyDetectionConfig
  ): Anomaly[] {
    const anomalies: Anomaly[] = [];
    const criticalKeywords = config.logKeywords?.critical || [
      'FATAL',
      'panic',
      'critical error',
    ];
    const warningKeywords = config.logKeywords?.warning || [
      'WARN',
      'error',
      'timeout',
      'failed',
    ];

    logs.forEach(log => {
      const message = log.message.toLowerCase();
      if (criticalKeywords.some(k => message.includes(k))) {
        anomalies.push({
          timestamp: log.timestamp,
          metric: 'log_entry',
          value: 1,
          severity: 'critical',
          description: `심각한 오류 로그 발견: ${log.message}`,
          source: 'logs',
        });
      } else if (warningKeywords.some(k => message.includes(k))) {
        anomalies.push({
          timestamp: log.timestamp,
          metric: 'log_entry',
          value: 1,
          severity: 'warning',
          description: `경고 로그 발견: ${log.message}`,
          source: 'logs',
        });
      }
    });

    return anomalies;
  }

  /**
   * 기본적인 통계(평균, 표준편차)를 계산합니다.
   */
  private calculateStats(data: number[]): { mean: number; std: number } {
    if (data.length === 0) return { mean: 0, std: 0 };
    const mean = data.reduce((a, b) => a + b) / data.length;
    const std = Math.sqrt(
      data.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / data.length
    );
    return { mean, std };
  }

  /**
   * AI를 사용하여 다수의 이상 징후를 요약합니다.
   */
  private async summarizeAnomalies(anomalies: Anomaly[]): Promise<string> {
    const prompt = `
      다음은 우리 시스템에서 동시에 감지된 이상 징후 목록입니다.
      이 현상들의 가장 가능성 있는 핵심 원인(root cause)을 한 문장으로 요약해주세요.

      [이상 징후 목록]
      ${anomalies.map(a => `- ${a.description}`).join('\n')}
    `;
    const result = await this.aiService.generateContent(prompt);
    return result.content || '다수의 이상 징후가 동시 발생했습니다.';
  }
}
