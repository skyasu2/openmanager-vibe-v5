/**
 * 서버 컨텍스트 주입 - AI 응답에 Monitoring Pipeline 분석 결과 제공
 *
 * MonitoringContext의 분석 결과(Health Score, Alert, 그룹별 현황)를
 * system message로 주입하여 AI가 구체적 데이터 기반 답변을 생성하도록 함
 *
 * @updated 2026-02-04 - MonitoringContext 연동 (Prometheus 파이프라인)
 */

import type { NormalizedMessage } from '@/lib/ai/utils/message-normalizer';
import { MonitoringContext } from '@/services/monitoring/MonitoringContext';

export function buildServerContextMessage(): NormalizedMessage | null {
  try {
    const monitoring = MonitoringContext.getInstance();
    const context = monitoring.getLLMContext();

    if (!context) return null;

    return {
      role: 'system',
      content: `${context}\n위 모니터링 데이터를 참조하여 구체적으로 답변하세요.`,
    };
  } catch {
    return null;
  }
}
