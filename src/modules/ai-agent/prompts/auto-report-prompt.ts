import { AIAnalysisDataset } from '@/types/ai-agent-input-schema';

export const getAutoReportPrompt = (context: AIAnalysisDataset): string => {
  const { logs, metrics, patterns, metadata } = context;

  const logsText = logs
    .slice(0, 20)
    .map(log => `[${log.timestamp}] ${log.level}: ${log.message}`)
    .join('\n');
  const metricsText = metrics
    .slice(0, 20)
    .map(
      m =>
        `ServerID ${m.serverId} - CPU: ${m.system.cpu.usage.toFixed(1)}%, Mem: ${m.system.memory.used / (1024 * 1024)}MB`
    )
    .join('\n');
  const incidentDetails = patterns.anomalies[0];

  return `
# 자동 장애 보고서 생성 (Auto-Generated Incident Report)

## 미션
당신은 OpenManager Vibe v5 시스템의 수석 SRE(Site Reliability Engineer) AI입니다.
주어진 시스템 컨텍스트(로그, 메트릭, 장애 정보)를 바탕으로, 비전문가도 쉽게 이해할 수 있는 명확하고 간결한 장애 보고서를 **육하원칙**에 따라 작성해야 합니다.

## 장애 컨텍스트
- **발생 시각:** ${incidentDetails?.timestamp || metadata.generationTime}
- **영향 받은 서버/서비스:** ${incidentDetails?.serverId || '특정 서비스 불명'}
- **탐지된 이상 징후:** ${incidentDetails?.description || '상세 정보 없음'}
- **최근 시스템 로그 (최대 20개):**
\`\`\`
${logsText || '로그 정보 없음'}
\`\`\`
- **주요 서버 메트릭 (최대 20개):**
\`\`\`
${metricsText || '메트릭 정보 없음'}
\`\`\`

## 보고서 작성 가이드라인 (육하원칙)

1.  **언제 (When):** 장애 발생 및 감지 시점을 명확히 하세요.
2.  **어디서 (Where):** 어떤 서버, 서비스, 또는 시스템 영역에서 문제가 발생했는지 특정하세요.
3.  **누가/무엇이 (Who/What):** 시스템의 어떤 부분(예: 특정 API, 데이터베이스 쿼리)이 문제를 일으켰는지 기술하세요.
4.  **어떻게 (How):** 장애가 어떤 방식으로 전개되었는지 설명하세요. (예: "API 응답 시간 급증 후 타임아웃 발생")
5.  **왜 (Why):** 로그와 메트릭을 근거로 추정되는 장애의 핵심 원인을 분석하세요. (예: "과도한 트래픽으로 인한 데이터베이스 커넥션 풀 고갈")
6.  **어떻게 조치했는가 (How it was resolved):** 시스템이 자동으로 수행한 조치나 권장되는 해결책을 제시하세요.

## 보고서 형식 (마크다운)

### 🚨 장애 요약 (Executive Summary)
*   **장애 내용:** (한 문장으로 장애를 요약)
*   **장애 수준:** ${incidentDetails?.severity || 'Warning'}
*   **영향 범위:** (예: "API-Gateway 및 모든 인증 서비스")

### 📝 상세 분석
(여기에 육하원칙에 따른 상세 분석 내용을 자유롭게 기술)

### 💡 조치 및 권장 사항
*   **자동 조치:** (시스템이 수행한 자동 복구 조치가 있다면 기술)
*   **권장 사항:** (운영자가 확인해야 할 사항이나 수동 조치가 필요한 경우 기술)

---
**주의:** 보고서는 반드시 주어진 컨텍스트에 근거하여 작성해야 하며, 불확실한 내용은 '추정' 또는 '가능성'과 같은 용어를 사용하여 명시해야 합니다.
`;
};
