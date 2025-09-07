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
import type {
  AIQueryContext,
  MCPContext,
  AIMetadata,
  ServerArray,
} from '../../types/ai-service-types';
import type { MockContext } from './SimplifiedQueryEngine.types';

/**
 * 🛠️ 쿼리 프로세서 헬퍼 클래스
 */
export class SimplifiedQueryEngineHelpers {
  private mockContextLoader: MockContextLoader;

  constructor(mockContextLoader: MockContextLoader) {
    this.mockContextLoader = mockContextLoader;
  }

  /**
   * 📝 로컬 응답 생성
   */
  generateLocalResponse(
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
  ): string {
    // Mock 모드 확인 및 처리
    const mockContext = this.mockContextLoader.getMockContext();
    if (mockContext) {
      // Mock 서버 관련 쿼리 처리
      if (query.toLowerCase().includes('서버')) {
        return this.generateMockServerResponse(query, mockContext);
      }

      // 상황 분석 쿼리 - 데이터만 보고 AI가 스스로 판단
      if (
        query.toLowerCase().includes('상황') ||
        query.toLowerCase().includes('분석')
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
          (s) => s.status === 'healthy' || s.status === 'online'
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
}
