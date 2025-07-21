/**
 * 🎯 서버 모니터링 에이전트 핸들러 함수들
 *
 * ServerMonitoringAgent의 크기를 줄이기 위해 분리된 핸들러 함수들
 */

import type { MCPMonitoringData, MCPPatternAnalysis } from '@/types/mcp';

/**
 * 🔍 서버 상태 조회 핸들러
 */
export function handleServerStatusQuery(
  data: MCPMonitoringData,
  analysis: MCPPatternAnalysis,
  getHealthScore: (health: any) => number
): string {
  const { servers, summary } = data;
  const runningServers = servers.filter(
    s =>
      s.status === 'running' || s.status === 'online' || s.status === 'healthy'
  ).length;
  const totalServers = servers.length;

  let response = `📊 **현재 서버 상태 보고**\n\n`;
  response += `• 전체 서버: ${totalServers}대\n`;
  response += `• 정상 운영: ${runningServers}대 (${((runningServers / totalServers) * 100).toFixed(1)}%)\n`;
  const avgCpu =
    summary?.performance?.avgCpu ||
    servers.reduce((sum, s) => sum + (s.cpu || 0), 0) / servers.length;
  const avgMemory =
    summary?.performance?.avgMemory ||
    servers.reduce((sum, s) => sum + (s.memory || 0), 0) / servers.length;
  const avgHealth =
    servers.reduce((sum, s) => sum + getHealthScore(s.health), 0) /
    servers.length;

  response += `• 평균 CPU: ${avgCpu.toFixed(1)}%\n`;
  response += `• 평균 메모리: ${avgMemory.toFixed(1)}%\n`;
  response += `• 시스템 건강도: ${avgHealth.toFixed(1)}점\n\n`;

  if (analysis.issues && analysis.issues.length > 0) {
    response += `⚠️ **주의사항:**\n`;
    analysis.issues.forEach((issue: string, index: number) => {
      response += `${index + 1}. ${issue}\n`;
    });
  } else {
    response += `✅ 모든 서버가 정상적으로 운영되고 있습니다.`;
  }

  return response;
}

/**
 * 🚨 장애 분석 핸들러
 */
export function handleIncidentQuery(
  _data: MCPMonitoringData,
  analysis: MCPPatternAnalysis
): string {
  if (!analysis.issues || analysis.issues.length === 0) {
    return `✅ **장애 상황 없음**\n\n현재 시스템에서 감지된 장애나 심각한 문제는 없습니다. 모든 서버가 정상 범위 내에서 운영되고 있습니다.`;
  }

  let response = `🚨 **장애 분석 보고서**\n\n`;
  response += `**심각도:** ${(analysis.severity || 'info').toUpperCase()}\n`;
  response += `**감지된 문제:** ${analysis.issues.length}개\n\n`;

  response += `**상세 분석:**\n`;
  analysis.issues.forEach((issue: string, index: number) => {
    response += `${index + 1}. ${issue}\n`;
  });

  if (analysis.recommendations && analysis.recommendations.length > 0) {
    response += `\n**권장 조치사항:**\n`;
    analysis.recommendations.forEach((rec: string, index: number) => {
      response += `${index + 1}. ${rec}\n`;
    });
  }

  return response;
}

/**
 * 🚀 성능 분석 핸들러
 */
export function handlePerformanceQuery(
  data: MCPMonitoringData,
  _analysis: MCPPatternAnalysis
): string {
  const { summary } = data;

  // 평균값 계산
  const avgCpu =
    summary?.performance?.avgCpu ||
    data.servers.reduce((sum, s) => sum + (s.cpu || 0), 0) /
      data.servers.length;
  const avgMemory =
    summary?.performance?.avgMemory ||
    data.servers.reduce((sum, s) => sum + (s.memory || 0), 0) /
      data.servers.length;
  const totalRequests = (summary as any)?.totalRequests || 0;
  const totalErrors = (summary as any)?.totalErrors || 0;

  let response = `🚀 **성능 분석 보고서**\n\n`;

  // 성능 지표 분석
  const cpuStatus = avgCpu > 70 ? '높음 ⚠️' : avgCpu > 50 ? '보통' : '낮음 ✅';
  const memoryStatus =
    avgMemory > 80 ? '높음 ⚠️' : avgMemory > 60 ? '보통' : '낮음 ✅';

  response += `**CPU 사용률:** ${avgCpu.toFixed(1)}% (${cpuStatus})\n`;
  response += `**메모리 사용률:** ${avgMemory.toFixed(1)}% (${memoryStatus})\n`;
  response += `**총 요청 수:** ${totalRequests.toLocaleString()}회\n`;
  response += `**에러율:** ${((totalErrors / Math.max(1, totalRequests)) * 100).toFixed(2)}%\n\n`;

  // 성능 개선 제안
  response += `**성능 개선 제안:**\n`;
  if (avgCpu > 70) {
    response += `• CPU 부하가 높습니다. 코드 최적화나 서버 증설을 고려하세요\n`;
  }
  if (avgMemory > 80) {
    response += `• 메모리 사용률이 높습니다. 캐싱 전략 검토가 필요합니다\n`;
  }
  if (totalErrors > 100) {
    response += `• 에러 발생률이 높습니다. 로그 분석을 통한 원인 파악이 필요합니다\n`;
  }

  return response;
}

/**
 * 💡 권장사항 핸들러
 */
export function handleRecommendationQuery(
  _data: MCPMonitoringData,
  analysis: MCPPatternAnalysis
): string {
  let response = `💡 **시스템 개선 권장사항**\n\n`;

  if (analysis.recommendations && analysis.recommendations.length > 0) {
    response += `**즉시 조치 권장:**\n`;
    analysis.recommendations.forEach((rec: string, index: number) => {
      response += `${index + 1}. ${rec}\n`;
    });
    response += `\n`;
  }

  response += `**일반적인 최적화 제안:**\n`;
  response += `• 정기적인 로그 정리 및 아카이빙 수행\n`;
  response += `• 모니터링 알럿 임계값 검토 및 조정\n`;
  response += `• 자동 스케일링 정책 검토\n`;
  response += `• 보안 패치 및 업데이트 스케줄 관리\n`;
  response += `• 백업 및 재해복구 계획 점검\n`;

  return response;
}

/**
 * 💰 비용 분석 핸들러
 */
export function handleCostQuery(
  data: MCPMonitoringData,
  _analysis: MCPPatternAnalysis
): string {
  const { summary } = data;

  let response = `💰 **비용 분석 보고서**\n\n`;
  response += `**현재 비용:**\n`;
  const cost = (summary as any)?.cost || { total: 0, monthly: 0 };
  response += `• 시간당 비용: $${cost.total.toFixed(2)}\n`;
  response += `• 월간 예상 비용: $${cost.monthly.toFixed(2)}\n\n`;

  // 비용 절약 제안
  response += `**비용 최적화 제안:**\n`;
  const lowUtilizationServers = data.servers.filter(
    s =>
      (s.metrics?.cpu || s.cpu || 0) < 30 &&
      (s.metrics?.memory || s.memory || 0) < 40
  );

  if (lowUtilizationServers.length > 0) {
    response += `• ${lowUtilizationServers.length}대의 서버가 저활용 상태입니다\\n`;
    response += `• 서버 통합을 통해 월 $${(lowUtilizationServers.length * 50).toFixed(2)} 절약 가능\\n`;
  }

  response += `• 자동 스케일링을 통한 리소스 효율성 향상\n`;
  response += `• 예약 인스턴스 활용으로 15-20% 비용 절감\n`;

  return response;
}

/**
 * 🔮 예측 분석 핸들러
 */
export function handlePredictionQuery(
  data: MCPMonitoringData,
  _analysis: MCPPatternAnalysis
): string {
  let response = `🔮 **시스템 예측 분석**\n\n`;

  // 간단한 트렌드 분석 (실제로는 더 복잡한 ML 알고리즘 필요)
  const { summary } = data;

  const avgCpu = summary?.performance?.avgCpu || 50;
  const avgMemory = summary?.performance?.avgMemory || 60;
  const totalRequests = (summary as any)?.totalRequests || 1000;
  response += `**단기 예측 (7일):**\n`;
  response += `• CPU 사용률: ${(avgCpu * 1.1).toFixed(1)}% 예상 (현재 대비 +10%)\n`;
  response += `• 메모리 사용률: ${(avgMemory * 1.05).toFixed(1)}% 예상\n`;
  response += `• 요청량: ${(totalRequests * 1.15).toLocaleString()}회 예상\n\n`;

  response += `**주의사항:**\n`;
  if (avgCpu > 60) {
    response += `• CPU 사용률 증가 추세로 인한 성능 저하 우려\n`;
  }
  if (avgMemory > 70) {
    response += `• 메모리 부족 상황 발생 가능성\n`;
  }

  response += `\n**권장 준비사항:**\n`;
  response += `• 트래픽 증가에 대비한 스케일링 준비\n`;
  response += `• 성능 모니터링 강화\n`;

  return response;
}

/**
 * 🤖 일반 질의 핸들러
 */
export function handleGeneralQuery(
  _data: MCPMonitoringData,
  _analysis: MCPPatternAnalysis
): string {
  return `🤖 **AI 어시스턴트 응답**\n\n안녕하세요! 서버 모니터링 AI 어시스턴트입니다.\n\n다음과 같은 질문을 도와드릴 수 있습니다:\n• 서버 상태 조회\n• 장애 분석\n• 성능 분석\n• 비용 분석\n• 시스템 권장사항\n• 미래 예측\n\n구체적인 질문을 해주시면 더 정확한 답변을 드릴 수 있습니다.`;
}
