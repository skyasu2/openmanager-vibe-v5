/**
 * 서버 컨텍스트 주입 - AI 응답에 실제 서버 데이터 참조 제공
 *
 * Cloud Run 전송 전 system message로 현재 alert 서버 상태를 prepend하여
 * AI가 일반론 대신 구체적 서버 데이터 기반 답변을 생성하도록 함
 */

import type { NormalizedMessage } from '@/lib/ai/utils/message-normalizer';
import { MetricsProvider } from '@/services/metrics/MetricsProvider';

export function buildServerContextMessage(): NormalizedMessage | null {
  try {
    const provider = MetricsProvider.getInstance();
    const summary = provider.getSystemSummary();
    const alerts = provider.getAlertServers();

    if (!alerts.length) return null;

    const alertLines = alerts
      .map(
        (s) =>
          `- ${s.name}(${s.serverId}): CPU ${s.cpu}%, Memory ${s.memory}%, Disk ${s.disk}% [${s.status}]`
      )
      .join('\n');

    return {
      role: 'system',
      content: `[현재 인프라 상태 - ${summary.timestamp}]
전체 ${summary.totalServers}대: 정상 ${summary.onlineServers}, 경고 ${summary.warningServers}, 위험 ${summary.criticalServers}
평균 CPU ${summary.averageCpu}% | Memory ${summary.averageMemory}% | Disk ${summary.averageDisk}%

주의 서버:
${alertLines}

위 데이터를 참조하여 구체적으로 답변하세요.`,
    };
  } catch {
    return null;
  }
}
