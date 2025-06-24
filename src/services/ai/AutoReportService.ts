import { createSafeError } from '@/lib/error-handler';
import { AIAnalysisDataset } from '@/types/ai-agent-input-schema';

export class AutoReportService {
  private static instance: AutoReportService;

  private constructor() {
    // Google AI 제거, 로컬 처리만 사용
  }

  static getInstance(): AutoReportService {
    if (!AutoReportService.instance) {
      AutoReportService.instance = new AutoReportService();
    }
    return AutoReportService.instance;
  }

  /**
   * 자동 장애 보고서를 생성합니다. (Google AI 제거, 로컬 처리)
   * @param context AI 분석을 위한 데이터셋 (순수 데이터만 포함)
   * @returns 생성된 마크다운 형식의 보고서
   */
  async generateReport(context: AIAnalysisDataset): Promise<string> {
    try {
      if (!context || (!context.logs?.length && !context.metrics?.length)) {
        throw new Error(
          '보고서 생성을 위한 기본 데이터(로그 또는 메트릭)가 부족합니다.'
        );
      }

      // Google AI 대신 로컬 분석 기반 보고서 생성
      const report = await this.generateLocalReport(context);

      return this.sanitizeReport(report);
    } catch (error) {
      const safeError = createSafeError(error);
      console.error('❌ 자동 장애 보고서 생성 실패:', safeError.message);
      throw new Error(`장애 보고서 생성 중 오류 발생: ${safeError.message}`);
    }
  }

  /**
   * 로컬 AI 엔진 기반 보고서 생성 (Google AI 제거)
   */
  private async generateLocalReport(
    context: AIAnalysisDataset
  ): Promise<string> {
    const { logs, metrics, metadata } = context;

    // 기본 분석 수행
    const analysis = this.analyzeSystemData(context);

    // 마크다운 보고서 생성
    const report = `# 🚨 시스템 장애 보고서

## 📊 요약
- **분석 시점**: ${metadata.generationTime}
- **서버 수**: ${metadata.serverCount}개
- **데이터 포인트**: ${metadata.dataPoints}개
- **시간 범위**: ${metadata.timeRange.start} ~ ${metadata.timeRange.end}

## 🔍 주요 발견사항
${analysis.findings.map(finding => `- ${finding}`).join('\n')}

## 📈 시스템 상태
${analysis.systemStatus}

## 🚨 감지된 이상 징후
${
  analysis.anomalies.length > 0
    ? analysis.anomalies.map(anomaly => `- ${anomaly}`).join('\n')
    : '- 현재 심각한 이상 징후는 감지되지 않았습니다.'
}

## 💡 권장사항
${analysis.recommendations.map(rec => `- ${rec}`).join('\n')}

## 📋 상세 로그 분석
${
  logs
    ?.slice(0, 10)
    .map(log => `- [${log.timestamp}] ${log.level}: ${log.message}`)
    .join('\n') || '로그 정보 없음'
}

## 📊 메트릭 분석
${
  metrics
    ?.slice(0, 10)
    .map(
      metric =>
        `- 서버 ${metric.serverId}: CPU ${metric.system.cpu.usage.toFixed(1)}%, 메모리 ${(metric.system.memory.used / (1024 * 1024)).toFixed(1)}MB`
    )
    .join('\n') || '메트릭 정보 없음'
}

---
*이 보고서는 OpenManager V5 로컬 AI 시스템에 의해 자동 생성되었습니다.*
*생성 시간: ${new Date().toISOString()}*`;

    return report;
  }

  /**
   * 시스템 데이터 분석 (로컬 처리)
   */
  private analyzeSystemData(context: AIAnalysisDataset): {
    findings: string[];
    systemStatus: string;
    anomalies: string[];
    recommendations: string[];
  } {
    const { logs, metrics } = context;
    const findings: string[] = [];
    const anomalies: string[] = [];
    const recommendations: string[] = [];

    // 로그 분석
    if (logs && logs.length > 0) {
      const errorLogs = logs.filter(
        log => log.level === 'ERROR' || log.level === 'FATAL'
      );
      const warnLogs = logs.filter(log => log.level === 'WARN');

      findings.push(`총 ${logs.length}개의 로그 항목 분석`);

      if (errorLogs.length > 0) {
        anomalies.push(`${errorLogs.length}개의 오류 로그 발견`);
        recommendations.push('오류 로그를 검토하여 근본 원인을 파악하세요');
      }

      if (warnLogs.length > 0) {
        findings.push(`${warnLogs.length}개의 경고 로그 확인`);
      }
    }

    // 메트릭 분석
    if (metrics && metrics.length > 0) {
      findings.push(`${metrics.length}개 서버의 메트릭 분석`);

      const highCpuServers = metrics.filter(m => m.system.cpu.usage > 80);
      const highMemoryServers = metrics.filter(
        m =>
          m.system.memory.available > 0 &&
          m.system.memory.used /
            (m.system.memory.used + m.system.memory.available) >
            0.8
      );

      if (highCpuServers.length > 0) {
        anomalies.push(
          `${highCpuServers.length}개 서버에서 높은 CPU 사용률 감지 (>80%)`
        );
        recommendations.push('CPU 사용률이 높은 서버의 프로세스를 확인하세요');
      }

      if (highMemoryServers.length > 0) {
        anomalies.push(
          `${highMemoryServers.length}개 서버에서 높은 메모리 사용률 감지 (>80%)`
        );
        recommendations.push(
          '메모리 사용량이 높은 서버의 메모리 누수를 확인하세요'
        );
      }
    }

    // 시스템 상태 결정
    let systemStatus = '정상';
    if (anomalies.length > 0) {
      systemStatus = anomalies.length > 2 ? '심각' : '주의';
    }

    // 기본 권장사항 추가
    if (recommendations.length === 0) {
      recommendations.push('정기적인 시스템 모니터링을 계속 수행하세요');
      recommendations.push('예방적 유지보수를 통해 시스템 안정성을 확보하세요');
    }

    return {
      findings,
      systemStatus,
      anomalies,
      recommendations,
    };
  }

  private sanitizeReport(report: string): string {
    // 보안상 민감한 정보 제거 및 정리
    return report
      .replace(/password[=:]\s*\S+/gi, 'password=***')
      .replace(/token[=:]\s*\S+/gi, 'token=***')
      .replace(/key[=:]\s*\S+/gi, 'key=***')
      .trim();
  }
}

export const autoReportService = AutoReportService.getInstance();
