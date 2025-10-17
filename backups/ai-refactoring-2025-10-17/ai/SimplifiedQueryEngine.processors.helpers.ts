/**
 * 🛠️ Query Processor Helpers - SimplifiedQueryEngine
 *
 * Helper methods for query processors:
 * - Response generation
 * - Server response formatting
 * - Mock server response generation
 * - Google AI prompt building
 * - Confidence calculation
 */

import { MockContextLoader } from './MockContextLoader';
import { unifiedMetricsService } from './UnifiedMetricsService';
import type {
  AIQueryContext,
  MCPContext,
  AIMetadata,
  ServerArray,
} from '../../types/ai-service-types';
import type { 
  MockContext,
  ServerStatusAnalysis
} from './SimplifiedQueryEngine.types';
import type { EnhancedServerMetrics } from '@/types/server';

/**
 * 통합 응답 타입 (사이클 분석용)
 */
/**
 * 확장된 시나리오 타입 (AI 컨텍스트 포함)
 */
interface ExtendedScenario {
  type: string;
  severity: string;
  description: string;
  aiContext?: string;
  nextAction?: string;
  estimatedDuration?: string;
}

/**
 * 통합 응답 타입 (사이클 분석용)
 */
interface UnifiedCycleResponse {
  currentCycle: {
    timeSlot: number;
    scenario: string;
    phase: string;
    progress: number;
    intensity: number;
    description: string;
    affectedServers: string[];
    expectedResolution?: Date | null;
  };
  servers: Array<EnhancedServerMetrics & {
    metadata?: {
      scenarios?: ExtendedScenario[];
      [key: string]: unknown;
    };
  }>;
}

/**
 * 🛠️ 쿼리 프로세서 헬퍼 클래스
 */
export class SimplifiedQueryEngineHelpers {
  private mockContextLoader: MockContextLoader;

  constructor(mockContextLoader: MockContextLoader) {
    this.mockContextLoader = mockContextLoader;
  }

  /**
   * 📝 로컬 응답 생성 (통합 메트릭 지원)
   */
  async generateLocalResponse(
    query: string,
    ragResult: {
      results: Array<{
        id: string;
        content: string;
        similarity: number;
        metadata?: AIMetadata;
      }>;
    },
    mcpContext: MCPContext | null,
    userContext: AIQueryContext | undefined
  ): Promise<string> {
    const lowerQuery = query.toLowerCase();

    // 👋 인사말 우선 처리 (RAG 검색 불필요)
    if (this.isGreeting(query)) {
      return '안녕하세요! 👋\n\n' +
             '저는 서버 모니터링 AI 어시스턴트입니다.\n' +
             '다음과 같은 질문을 도와드릴 수 있습니다:\n\n' +
             '• 📊 서버 상태 및 메트릭 조회\n' +
             '• 🖥️ CPU/메모리 사용률 분석\n' +
             '• 🚨 장애 및 문제 상황 분석\n' +
             '• 🔍 실시간 시스템 모니터링\n\n' +
             '궁금하신 점을 자유롭게 물어보세요!';
    }

    // 🎯 실시간 서버 메트릭 쿼리 처리 (최우선)
    if (this.isServerMetricQuery(lowerQuery)) {
      try {
        return await this.generateRealTimeServerResponse(query, lowerQuery);
      } catch (error) {
        console.warn('실시간 메트릭 조회 실패, Mock 모드로 전환:', error);
        // 실패 시 Mock 모드로 폴백
      }
    }
    
    // Mock 모드 확인 및 처리
    const mockContext = this.mockContextLoader.getMockContext();
    if (mockContext) {
      // Mock 서버 관련 쿼리 처리
      if (lowerQuery.includes('서버')) {
        return this.generateMockServerResponse(query, mockContext);
      }

      // 상황 분석 쿼리 - 데이터만 보고 AI가 스스로 판단
      if (
        lowerQuery.includes('상황') ||
        lowerQuery.includes('분석')
      ) {
        return this.generateMockServerResponse(query, mockContext);
      }
    }

    // 일반 서버 관련 쿼리 처리
    if (userContext?.servers && query.toLowerCase().includes('서버')) {
      return this.generateServerResponse(query, userContext.servers);
    }

    if (ragResult.results.length === 0) {
      // Mock 모드일 때 추가 안내
      if (mockContext) {
        return (
          '죄송합니다. 관련된 정보를 찾을 수 없습니다.\n\n' +
          '🎭 현재 Mock 데이터 모드로 실행 중입니다.\n' +
          '서버 상태, 메트릭, 시나리오에 대해 물어보세요.'
        );
      }
      return '죄송합니다. 관련된 정보를 찾을 수 없습니다. 더 구체적인 질문을 해주시면 도움이 될 것 같습니다.';
    }

    let response = '';

    // RAG 결과 기반 응답
    const topResult = ragResult.results[0];
    if (topResult) {
      response += topResult.content;
    }

    // 추가 정보가 있으면 포함
    if (ragResult.results.length > 1) {
      response += '\n\n추가 정보:\n';
      ragResult.results.slice(1, 3).forEach((result, idx) => {
        response += `${idx + 1}. ${result.content.substring(0, 100)}...\n`;
      });
    }

    // MCP 컨텍스트가 있으면 추가
    if (mcpContext && mcpContext.files.length > 0) {
      response += '\n\n프로젝트 파일 참고:\n';
      mcpContext.files.slice(0, 2).forEach((file) => {
        response += `- ${file.path}\n`;
      });
    }

    // Mock 모드 안내 추가
    if (mockContext) {
      response += `\n\n🎭 Mock 데이터 모드 (${mockContext.currentTime})`;
    }

    return response;
  }

  /**
   * 🖥️ 서버 응답 생성
   */
  generateServerResponse(query: string, servers: ServerArray): string {
    const lowerQuery = query.toLowerCase();

    // CPU 사용률 관련 쿼리
    if (lowerQuery.includes('cpu')) {
      const highCpuServers = servers.filter((s) => s.cpu > 70);
      if (highCpuServers.length > 0) {
        return `CPU 사용률이 높은 서버:\n${highCpuServers
          .map((s) => `- ${s.name}: ${s.cpu}%`)
          .join('\n')}`;
      }
      return 'CPU 사용률이 높은 서버가 없습니다.';
    }

    // 전체 서버 상태 요약
    if (lowerQuery.includes('상태') || lowerQuery.includes('요약')) {
      const statusCount = {
        정상: servers.filter(
          (s) => s.status === 'online' // 🔧 수정: 'healthy' 제거 (타입 통합)
        ).length,
        주의: servers.filter((s) => s.status === 'warning').length,
        위험: servers.filter(
          (s) => s.status === 'critical' || s.status === 'offline'
        ).length,
      };

      return `전체 서버 상태 요약:\n- 정상: ${statusCount.정상}대\n- 주의: ${statusCount.주의}대\n- 위험: ${statusCount.위험}대\n\n총 ${servers.length}대의 서버가 모니터링되고 있습니다.`;
    }

    return `${servers.length}개의 서버가 모니터링되고 있습니다.`;
  }

  /**
   * 🎭 Mock 서버 응답 생성
   */
  generateMockServerResponse(query: string, mockContext: MockContext): string {
    const lowerQuery = query.toLowerCase();

    // 전체 상태 요약
    if (lowerQuery.includes('상태') || lowerQuery.includes('요약')) {
      const metrics = mockContext.metrics || {
        serverCount: 0,
        criticalCount: 0,
        warningCount: 0,
        healthyCount: 0,
        avgCpu: 0,
        avgMemory: 0,
        avgDisk: 0,
      };

      let analysis =
        `🎭 서버 상태 분석 (${mockContext.currentTime})\n\n` +
        `전체 서버: ${metrics.serverCount}대\n` +
        `- 위험: ${metrics.criticalCount}대\n` +
        `- 경고: ${metrics.warningCount}대\n` +
        `- 정상: ${metrics.healthyCount}대\n\n` +
        `평균 메트릭:\n` +
        `- CPU: ${metrics.avgCpu}%\n` +
        `- Memory: ${metrics.avgMemory}%\n` +
        `- Disk: ${metrics.avgDisk}%\n\n`;

      // 데이터 기반 상황 분석
      if (metrics.criticalCount > metrics.serverCount * 0.3) {
        analysis += `⚠️ 분석: 전체 서버의 30% 이상이 위험 상태입니다. 대규모 장애가 발생했을 가능성이 있습니다.`;
      } else if (metrics.avgCpu > 80) {
        analysis += `📊 분석: 평균 CPU 사용률이 매우 높습니다. 트래픽 급증이나 성능 문제가 있을 수 있습니다.`;
      } else if (metrics.avgMemory > 85) {
        analysis += `💾 분석: 메모리 사용률이 위험 수준입니다. 메모리 누수나 과부하 상태일 수 있습니다.`;
      } else {
        analysis += `✅ 분석: 전반적으로 시스템이 안정적인 상태입니다.`;
      }

      return analysis;
    }

    // CPU 관련 쿼리
    if (lowerQuery.includes('cpu')) {
      const avgCpu = mockContext.metrics?.avgCpu || 0;
      let cpuAnalysis =
        `🎭 CPU 상태 분석 (${mockContext.currentTime})\n\n` +
        `평균 CPU 사용률: ${avgCpu}%\n`;

      if (avgCpu > 70) {
        cpuAnalysis += `\n⚠️ CPU 사용률이 높습니다. 성능 저하가 예상됩니다.`;
      } else if (avgCpu < 30) {
        cpuAnalysis += `\n✅ CPU 사용률이 낮아 시스템이 여유롭습니다.`;
      } else {
        cpuAnalysis += `\n📊 CPU 사용률이 정상 범위입니다.`;
      }

      return cpuAnalysis;
    }

    // 기본 응답
    const serverCount = mockContext.metrics?.serverCount || 0;
    return (
      `🎭 Mock 모드 (${mockContext.currentTime})\n\n` +
      serverCount +
      '개의 서버가 모니터링되고 있습니다.'
    );
  }

  /**
   * 🤖 Google AI 프롬프트 구성
   */
  buildGoogleAIPrompt(
    query: string,
    context: AIQueryContext | undefined,
    mcpContext: MCPContext | null
  ): string {
    let prompt = `사용자 질문: ${query}\n\n`;

    // Mock 모드 컨텍스트 추가
    const mockContext = this.mockContextLoader.getMockContext();
    if (mockContext) {
      prompt += '🎭 Mock 데이터 모드:\n';
      prompt += this.mockContextLoader.generateContextString();
      prompt += '\n\n';
    }

    // 사용자 컨텍스트 추가
    if (context && Object.keys(context).length > 0) {
      prompt += '컨텍스트:\n';
      prompt += JSON.stringify(context, null, 2) + '\n\n';
    }

    // MCP 컨텍스트 추가
    if (mcpContext && mcpContext.files.length > 0) {
      prompt += '관련 파일 내용:\n';
      mcpContext.files.forEach((file) => {
        prompt += `\n파일: ${file.path}\n`;
        prompt += `${file.content.substring(0, 500)}...\n`;
      });
      prompt += '\n';
    }

    prompt += '위 정보를 바탕으로 사용자의 질문에 답변해주세요.';

    return prompt;
  }

  /**
   * 🎯 신뢰도 계산
   */
  calculateConfidence(ragResult: {
    results: Array<{ similarity: number }>;
  }): number {
    if (ragResult.results.length === 0) return 0.1;

    // 최고 유사도 점수 기반 신뢰도
    const topSimilarity = ragResult.results[0]?.similarity ?? 0;
    const resultCount = ragResult.results.length;

    // 유사도와 결과 개수를 종합한 신뢰도
    const confidence =
      topSimilarity * 0.7 + Math.min(resultCount / 10, 1) * 0.3;

    return Math.min(confidence, 0.95);
  }
  
  /**
   * 🔍 서버 메트릭 쿼리 판별
   */
  /**
   * 🎯 서버 컨텍스트 조회 및 포맷팅 (GOOGLE_AI/LOCAL 공통)
   * 
   * @param query - 사용자 쿼리
   * @returns 포맷팅된 서버 컨텍스트 문자열 또는 null (서버 메트릭 쿼리가 아닌 경우)
   */
  async getFormattedServerContext(query: string): Promise<string | null> {
    const lowerQuery = query.toLowerCase();
    
    // 서버 메트릭 쿼리가 아니면 null 반환
    if (!this.isServerMetricQuery(lowerQuery)) {
      return null;
    }
    
    try {
      // 서버 메트릭 조회
      const analysis = await unifiedMetricsService.analyzeServerStatus();
      
      // 포맷팅된 문자열만 반환
      return this.formatServerContext(analysis);
    } catch (error) {
      console.warn('[getFormattedServerContext] 서버 메트릭 조회 실패:', error);
      return null;
    }
  }

  /**
   * 📊 서버 컨텍스트 포맷팅 (private)
   * 
   * @param analysis - UnifiedMetricsService의 분석 결과
   * @returns 포맷팅된 컨텍스트 문자열
   */
  private formatServerContext(analysis: ServerStatusAnalysis): string {
    const { summary, criticalServers, warningServers, healthyServers, timeContext } = analysis;
    
    let contextString = '\n\n📊 실시간 서버 상태:\n';
    contextString += `- 전체 요약: ${summary}\n`;
    contextString += `- 위험 서버: ${criticalServers.length}개\n`;
    contextString += `- 경고 서버: ${warningServers.length}개\n`;
    contextString += `- 정상 서버: ${healthyServers.length}개\n`;
    contextString += `- 조회 시간: ${timeContext}\n`;
    
    // 위험 서버 상세 정보 (있을 경우)
    if (criticalServers.length > 0) {
      contextString += '\n⚠️ 위험 서버 상세:\n';
      criticalServers.forEach(server => {
        contextString += `  - ${server.name}: CPU ${server.cpu}%, Memory ${server.memory}%\n`;
      });
    }
    
    return contextString;
  }

  private isServerMetricQuery(lowerQuery: string): boolean {
    const serverKeywords = ['서버', 'cpu', 'memory', 'disk', 'network', '메모리', '디스크', '네트워크'];
    const statusKeywords = ['상태', 'status', '현재', '지금', '실시간'];
    const metricKeywords = ['사용률', '부하', '성능', '모니터링', '메트릭'];
    
    const hasServerKeyword = serverKeywords.some(keyword => lowerQuery.includes(keyword));
    const hasStatusKeyword = statusKeywords.some(keyword => lowerQuery.includes(keyword));
    const hasMetricKeyword = metricKeywords.some(keyword => lowerQuery.includes(keyword));
    
    return hasServerKeyword || (hasStatusKeyword && hasMetricKeyword);
  }

  /**
   * 🎯 인사말 감지
   * 
   * 간단한 인사말이면 RAG 검색 없이 친근한 응답 반환
   */
  private isGreeting(query: string): boolean {
    const greetings = [
      '안녕', '안녕하세요', '안녕하십니까', 
      'hi', 'hello', 'hey', 'hola',
      '반가워', '반갑습니다',
      'good morning', 'good afternoon', 'good evening',
      '좋은 아침', '좋은 저녁'
    ];
    
    const lower = query.toLowerCase().trim();
    
    // 완전 일치 또는 공백/구두점 포함 일치
    return greetings.some(greeting => {
      const greetingLower = greeting.toLowerCase();
      return lower === greetingLower || 
             lower === greetingLower + '!' ||
             lower === greetingLower + '?' ||
             lower === greetingLower + '.' ||
             lower.startsWith(greetingLower + ' ');
    });
  }
  
  /**
   * 🚀 실시간 서버 응답 생성
   */
  private async generateRealTimeServerResponse(originalQuery: string, lowerQuery: string): Promise<string> {
    // 통합 메트릭 서비스에서 현재 상태 조회
    const analysis = await unifiedMetricsService.analyzeServerStatus();
    const { summary, criticalServers, warningServers, healthyServers, timeContext } = analysis;
    
    // 쿼리 유형별 응답 생성
    if (lowerQuery.includes('전체') || lowerQuery.includes('상태')) {
      return this.generateOverallStatusResponse(summary, criticalServers, warningServers, timeContext);
    }
    
    if (lowerQuery.includes('cpu')) {
      return await this.generateCPUStatusResponse();
    }
    
    if (lowerQuery.includes('memory') || lowerQuery.includes('메모리')) {
      return await this.generateMemoryStatusResponse();
    }
    
    if (lowerQuery.includes('문제') || lowerQuery.includes('장애')) {
      return this.generateProblemAnalysisResponse(criticalServers, warningServers);
    }
    
    // 6개 사이클 분석 쿼리
    if (lowerQuery.includes('사이클') || lowerQuery.includes('시나리오') || lowerQuery.includes('원인') || lowerQuery.includes('분석')) {
      return await this.generateCycleAnalysisFromRealTime();
    }
    
    // 기본 현재 상태 응답
    return this.generateOverallStatusResponse(summary, criticalServers, warningServers, timeContext);
  }
  
  /**
   * 📊 전체 상태 응답
   */
  private generateOverallStatusResponse(
    summary: string, 
    criticalServers: EnhancedServerMetrics[],
    warningServers: EnhancedServerMetrics[], 
    timeContext: string
  ): string {
    let response = `🖥️ **현재 서버 전체 상태**\n\n`;
    response += `${summary}\n\n`;
    response += `⏰ ${timeContext}\n\n`;
    
    if (criticalServers.length > 0) {
      response += `🚨 **심각한 상태의 서버 (${criticalServers.length}개):**\n`;
      criticalServers.forEach(server => {
        response += `• ${server.name}: CPU ${server.cpu}%, 메모리 ${server.memory}%, 응답시간 ${server.responseTime}ms\n`;
      });
      response += `\n`;
    }
    
    if (warningServers.length > 0) {
      response += `⚠️ **주의가 필요한 서버 (${warningServers.length}개):**\n`;
      warningServers.forEach(server => {
        response += `• ${server.name}: CPU ${server.cpu}%, 메모리 ${server.memory}%\n`;
      });
      response += `\n`;
    }
    
    response += `✅ 정상 상태 서버: ${criticalServers.length + warningServers.length > 0 ? '나머지 서버들' : '모든 서버'}\n\n`;
    response += `🔄 데이터 동기화: 모니터링 대시보드와 동일한 실시간 데이터`;
    
    return response;
  }
  
  /**
   * 🖥️ CPU 상태 응답
   */
  private async generateCPUStatusResponse(): Promise<string> {
    const metrics = await unifiedMetricsService.getCurrentMetrics();
    const servers = metrics.servers;
    
    const highCPUServers = servers.filter(s => (s.cpu || s.cpu_usage || 0) > 70);
    const avgCPU = servers.reduce((sum, s) => sum + (s.cpu || s.cpu_usage || 0), 0) / servers.length;
    
    let response = `💻 **CPU 사용률 현황**\n\n`;
    response += `📊 전체 평균 CPU 사용률: ${Math.round(avgCPU)}%\n\n`;
    
    if (highCPUServers.length > 0) {
      response += `🔥 **높은 CPU 사용률 서버:**\n`;
      highCPUServers.forEach(server => {
        const cpuValue = server.cpu || server.cpu_usage || 0;
        const trend = cpuValue > (server.metadata?.baseline?.cpu || 50) ? '↗️' : '↘️';
        response += `• ${server.name}: ${cpuValue}% ${trend}\n`;
      });
    } else {
      response += `✅ 모든 서버의 CPU 사용률이 정상 범위 내에 있습니다.\n`;
    }
    
    return response;
  }
  
  /**
   * 💾 메모리 상태 응답
   */
  private async generateMemoryStatusResponse(): Promise<string> {
    const metrics = await unifiedMetricsService.getCurrentMetrics();
    const servers = metrics.servers;
    
    const highMemoryServers = servers.filter(s => (s.memory || s.memory_usage || 0) > 80);
    const avgMemory = servers.reduce((sum, s) => sum + (s.memory || s.memory_usage || 0), 0) / servers.length;
    
    let response = `💾 **메모리 사용률 현황**\n\n`;
    response += `📊 전체 평균 메모리 사용률: ${Math.round(avgMemory)}%\n\n`;
    
    if (highMemoryServers.length > 0) {
      response += `⚠️ **높은 메모리 사용률 서버:**\n`;
      highMemoryServers.forEach(server => {
        const memoryValue = server.memory || server.memory_usage || 0;
        response += `• ${server.name}: ${memoryValue}%`;
        if (memoryValue > 90) response += ` 🚨 위험`;
        else if (memoryValue > 80) response += ` ⚠️ 주의`;
        response += `\n`;
      });
      
      response += `\n💡 **권장사항:** 메모리 사용량이 높은 서버들의 프로세스를 확인해보세요.`;
    } else {
      response += `✅ 모든 서버의 메모리 사용률이 안전한 수준입니다.`;
    }
    
    return response;
  }
  
  /**
   * 🚨 문제 분석 응답
   */
  private generateProblemAnalysisResponse(criticalServers: EnhancedServerMetrics[], warningServers: EnhancedServerMetrics[]): string {
    let response = `🔍 **서버 문제 분석**\n\n`;
    
    if (criticalServers.length === 0 && warningServers.length === 0) {
      response += `✅ **현재 심각한 문제가 감지되지 않았습니다.**\n\n`;
      response += `모든 서버가 정상 범위 내에서 작동하고 있습니다.`;
      return response;
    }
    
    if (criticalServers.length > 0) {
      response += `🚨 **즉시 조치가 필요한 서버:**
`;
      criticalServers.forEach(server => {
        response += `• **${server.name}**:
`;
        response += `  - CPU: ${server.cpu ?? 0}% ${(server.cpu ?? 0) > 85 ? '(과부하)' : ''}
`;
        response += `  - 메모리: ${server.memory ?? 0}% ${(server.memory ?? 0) > 90 ? '(과부하)' : ''}
`;
        response += `  - 응답시간: ${server.responseTime}ms ${server.responseTime > 500 ? '(지연)' : ''}
`;
        
        // 장애 시나리오 정보 포함
        if (server.metadata?.scenarios?.length && server.metadata.scenarios.length > 0) {
          response += `  - 감지된 이벤트: ${server.metadata.scenarios[0]!.description}
`;
        }
        response += `\n`;
      });
    }
    
    if (warningServers.length > 0) {
      response += `⚠️ **모니터링이 필요한 서버:**
`;
      warningServers.forEach(server => {
        response += `• ${server.name}: `;
        if ((server.cpu ?? 0) > 70) response += `CPU ${server.cpu ?? 0}% `;
        if ((server.memory ?? 0) > 80) response += `메모리 ${server.memory ?? 0}% `;
        response += `
`;
      });
    }
    
    response += `\n🔄 실시간 모니터링이 계속되고 있습니다.`;
    
    return response;
  }
  
  /**
   * 🎯 6개 사이클 기반 상황 분석 응답
   */
  private generateCycleAnalysisResponse(unifiedResponse: UnifiedCycleResponse): string {
    const { currentCycle, servers } = unifiedResponse;
    
    if (!currentCycle) {
      return '❓ 현재 사이클 정보를 불러올 수 없습니다.';
    }
    
    let response = `🎯 **24시간 장애-해소 사이클 분석**\n\n`;
    
    // 현재 사이클 기본 정보
    response += `⏰ **현재 시간대:** ${this.getCycleTimeSlotDescription(currentCycle.timeSlot)}\n`;
    response += `📋 **시나리오:** ${this.getCycleScenarioDescription(currentCycle.scenario)}\n`;
    response += `📊 **진행 단계:** ${this.getCyclePhaseDescription(currentCycle.phase)} (${currentCycle.progress}%)\n`;
    response += `🔥 **영향 강도:** ${Math.round(currentCycle.intensity * 100)}%\n\n`;
    
    // 상세 설명
    response += `💬 **상황 설명:**\n${currentCycle.description}\n\n`;
    
    // 영향받는 서버들
    const affectedServers = servers.filter((s) => 
      currentCycle.affectedServers.includes(s.id)
    );
    
    if (affectedServers.length > 0) {
      response += `🎯 **영향받는 서버 (${affectedServers.length}개):**\n`;
      affectedServers.forEach((server) => {
        response += `• **${server.name}** (${server.status}): `;
        
        // 주요 영향받는 메트릭 표시
        const scenario = server.metadata?.scenarios?.[0];
        if (scenario) {
          response += `${scenario.description}\n`;
          response += `  - 🔍 상황 분석: ${scenario.aiContext}\n`;
          response += `  - 💡 권장 조치: ${scenario.nextAction} (관리자가 직접 실행 필요)\n`;
          response += `  - ⏱️ 예상 소요시간: ${scenario.estimatedDuration}\n`;
        } else {
          response += `CPU ${server.cpu}%, 메모리 ${server.memory}%, 응답시간 ${server.responseTime}ms\n`;
        }
      });
      response += `\n`;
    }
    
    // 해결 예상 시간
    if (currentCycle.expectedResolution) {
      const resolutionTime = new Date(currentCycle.expectedResolution);
      const remainingMinutes = Math.max(0, Math.ceil((resolutionTime.getTime() - Date.now()) / (1000 * 60)));
      response += `⏳ **예상 해결 시간:** ${resolutionTime.toLocaleString('ko-KR')} (약 ${remainingMinutes}분 후)\n\n`;
    }
    
    // 사이클별 맞춤 권장사항
    response += this.getCycleRecommendations(currentCycle.scenario, currentCycle.phase);
    
    return response;
  }
  
  /**
   * 시간대 설명
   */
  private getCycleTimeSlotDescription(timeSlot: number): string {
    const descriptions = [
      '0-4시 (야간 백업 시간)',
      '4-8시 (새벽 유지보수 시간)', 
      '8-12시 (오전 업무 시간)',
      '12-16시 (점심 피크 시간)',
      '16-20시 (오후 피크 시간)',
      '20-24시 (저녁 배치 시간)'
    ];
    return descriptions[timeSlot] || `시간대 ${timeSlot}`;
  }
  
  /**
   * 사이클 시나리오 설명
   */
  private getCycleScenarioDescription(scenario: string): string {
    const descriptions = {
      backup_cycle: '백업 사이클 - 야간 전체 시스템 백업',
      maintenance_cycle: '유지보수 사이클 - 새벽 보안 패치 및 재시작',
      traffic_cycle: '트래픽 사이클 - 출근시간 동시 접속자 급증',
      database_cycle: '데이터베이스 사이클 - 점심시간 주문 시스템 과부하',
      network_cycle: '네트워크 사이클 - 퇴근시간 대용량 파일 다운로드',
      batch_cycle: '배치 사이클 - 저녁 대량 데이터 처리 작업'
    };
    return descriptions[scenario as keyof typeof descriptions] || scenario;
  }
  
  /**
   * 사이클 단계 설명
   */
  private getCyclePhaseDescription(phase: string): string {
    const descriptions = {
      normal: '🟢 정상 상태',
      incident: '🟡 장애 발생 중',
      peak: '🔴 장애 심화 상태',
      resolving: '🟠 해결 진행 중',
      resolved: '✅ 해결 완료'
    };
    return descriptions[phase as keyof typeof descriptions] || phase;
  }
  
  /**
   * 사이클별 맞춤 권장사항
   */
  private getCycleRecommendations(scenario: string, phase: string): string {
    const recommendations = {
      backup_cycle: {
        incident: `💡 **관리자 권장 조치:**
• 백업 진행상황 확인: \`sudo systemctl status backup.service\`
• 디스크 I/O 모니터링: \`iotop -ao\` 명령어로 확인
• 불필요한 배치작업 일시 중단 고려 (백업 완료 후 재시작)
• 백업 완료 예상시간 확인 후 사용자 공지 권장`,
        peak: `⚠️ **긴급 관리자 조치:**
• 백업 프로세스 상태 점검: \`ps aux | grep backup\`
• 백업 로그 확인: \`tail -f /var/log/backup.log\`
• 디스크 용량 점검: \`df -h\` (여유공간 부족 시 조치 필요)
• 필요시 백업 우선순위 조정 또는 일시 중단 검토`,
        resolving: `📈 **백업 완료 후 정리작업:**
• 백업 완료 확인: \`backup-status --verify\`
• 성능 정상화 확인: \`iostat -x 1 5\`
• 로그 정리: \`logrotate -f /etc/logrotate.d/backup\`
• 다음 백업 스케줄 점검 및 최적화`
      },
      maintenance_cycle: {
        incident: `🔧 **패치 관리자 조치:**
• 패치 진행상황 확인: \`sudo apt list --upgradable\`
• 재시작 필요 서비스 확인: \`sudo systemctl list-units --failed\`
• 중요 서비스 우선순위 점검
• 패치 완료 후 재시작 스케줄 확인`,
        peak: `⚠️ **패치 피크시 긴급조치:**
• 패치 프로세스 모니터링: \`sudo tail -f /var/log/apt/term.log\`
• CPU/메모리 사용률 모니터링: \`htop\`
• 필요시 패치 일시 중단: \`sudo pkill -STOP apt\`
• 서비스별 재시작 순서 계획`,
        resolving: `🚀 **패치 완료 후 검증:**
• 시스템 업데이트 확인: \`sudo apt list --installed | grep -i updated\`
• 서비스 상태 전체 점검: \`sudo systemctl --failed\`
• 보안 패치 적용 확인: \`sudo unattended-upgrades --dry-run\`
• 시스템 재시작 필요 여부 확인: \`sudo needrestart\``
      },
      traffic_cycle: {
        incident: `📈 **트래픽 스케일링 관리:**
• 로드밸런서 상태: \`nginx -t && sudo systemctl status nginx\`
• 서버 부하 확인: \`uptime && free -h\`
• 연결 수 모니터링: \`netstat -an | wc -l\`
• 필요시 수동 스케일링: 추가 인스턴스 기동`,
        peak: `🚨 **트래픽 피크 긴급대응:**
• 로드밸런서 연결 제한 확인: \`nginx -s reload\` (설정 변경 시)
• 서버 리소스 긴급 점검: \`top -p \$(pgrep nginx)\`
• CDN 캐시 상태 확인 및 강제 갱신 고려
• 필요시 트래픽 제한: rate limiting 규칙 적용`,
        resolving: `✨ **스케일링 완료 후 최적화:**
• 오토스케일링 결과 확인
• 각 서버 인스턴스 헬스체크: \`curl -I http://server/health\`
• 로드밸런싱 균등분산 확인
• 불필요한 인스턴스 정리 계획`
      },
      database_cycle: {
        incident: `🍽️ **데이터베이스 과부하 대응:**
• DB 연결 수 확인: \`SHOW PROCESSLIST;\` (MySQL)
• 슬로우 쿼리 모니터링: \`SHOW FULL PROCESSLIST;\`
• 커넥션 풀 상태 점검
• 캐시 히트율 확인: Redis/Memcached 상태`,
        peak: `⚠️ **DB 과부하 긴급 조치:**
• 슬로우 쿼리 강제 종료: \`KILL QUERY [process_id];\`
• 인덱스 사용률 점검: \`EXPLAIN [slow_query];\`
• 메모리 사용량 확인: \`SHOW ENGINE INNODB STATUS;\`
• 필요시 읽기전용 모드 전환 고려`,
        resolving: `🔧 **DB 성능 회복 확인:**
• 쿼리 응답시간 모니터링: \`mysqladmin processlist\`
• 인덱스 재구성 결과 확인: \`ANALYZE TABLE [table_name];\`
• 캐시 성능 확인 및 워밍업
• 커넥션 풀 정상화 점검`
      },
      network_cycle: {
        incident: `📁 **네트워크 트래픽 관리:**
• 네트워크 대역폭 확인: \`iftop -i eth0\`
• CDN 상태 점검: CDN 대시보드 확인
• 파일서버 부하 확인: \`iostat -x 1 5\`
• 대용량 전송 작업 목록 확인`,
        peak: `🌐 **네트워크 포화 긴급대응:**
• 대역폭 사용량 실시간 모니터링: \`nload\`
• CDN 캐시 강제 갱신 및 최적화
• QoS 규칙 적용: 중요 트래픽 우선순위 설정
• 필요시 대용량 전송 일시 제한`,
        resolving: `⚡ **네트워크 최적화 완료:**
• CDN 분산 효과 확인
• 트래픽 경로 최적화 결과 점검
• 대역폭 사용률 정상화 확인
• 파일 전송 성능 테스트 실시`
      },
      batch_cycle: {
        incident: `🌙 **배치작업 모니터링:**
• 배치 프로세스 상태: \`ps aux | grep batch\`
• 메모리 사용률 추이: \`free -h && vmstat 1 5\`
• 배치 작업 로그 확인: \`tail -f /var/log/batch.log\`
• 예상 완료시간 및 진행률 확인`,
        peak: `💾 **배치 피크 메모리 관리:**
• JVM 힙 메모리 확인: \`jstat -gc [pid]\`
• 가비지 컬렉션 모니터링: \`jstat -gcutil [pid] 1s\`
• 필요시 배치 작업 우선순위 조정
• OOM 방지를 위한 메모리 제한 확인`,
        resolving: `🧹 **배치 완료 후 정리:**
• 배치 작업 완료 확인 및 로그 검토
• 메모리 정리 상태 확인: \`free -h\`
• 가비지 컬렉션 완료 대기
• 다음 배치 스케줄 최적화 검토`
      }
    };
    
    const scenarioRecs = recommendations[scenario as keyof typeof recommendations];
    if (scenarioRecs) {
      return scenarioRecs[phase as keyof typeof scenarioRecs] || '📊 시스템 상태를 지속적으로 모니터링하고 있습니다.';
    }
    
    return '📊 시스템 상태를 지속적으로 모니터링하고 있습니다.';
  }
  
  /**
   * 🎯 실시간 데이터에서 사이클 분석 생성
   */
  private async generateCycleAnalysisFromRealTime(): Promise<string> {
    try {
      // 통합 메트릭 API에서 현재 사이클 정보 포함된 데이터 가져오기
      const unifiedResponse = await unifiedMetricsService.getCurrentMetrics();
      
      if (unifiedResponse.currentCycle) {
        // UnifiedMetricsResponse를 UnifiedCycleResponse로 타입 단언
        // (실제로 호환 가능한 구조)
        return this.generateCycleAnalysisResponse(unifiedResponse as unknown as UnifiedCycleResponse);
      } else {
        return '❌ 현재 사이클 정보를 가져올 수 없습니다. 통합 메트릭 API를 확인해주세요.';
      }
    } catch (error) {
      console.error('실시간 사이클 분석 생성 실패:', error);
      return '❌ 사이클 분석을 생성하는 중 오류가 발생했습니다.';
    }
  }
}
