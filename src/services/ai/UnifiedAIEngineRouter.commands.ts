/**
 * 🤖 Unified AI Engine Router - Command Recommendations System
 *
 * Intelligent command recommendation and analysis engine
 * - Natural language command request detection
 * - Server-specific command mapping and suggestions
 * - OS command database integration
 * - Contextual command analysis and formatting
 * - Korean/English language support
 *
 * @author AI Systems Engineer
 * @version 1.0.0
 */

import {
  CommandRecommendation,
  CommandRequestContext,
  CommandAnalysisResult,
  CommandDetectionResult,
  RouterConfig,
  RouterMetrics,
} from './UnifiedAIEngineRouter.types';
import {
  serverCommandsMap,
  recommendCommands,
  type OSCommand,
} from '@/config/serverCommandsConfig';

export class UnifiedAIEngineRouterCommands {
  private config: RouterConfig;

  constructor(config: RouterConfig) {
    this.config = config;
  }

  /**
   * 🤖 명령어 요청 감지 및 분석
   *
   * 자연어 쿼리에서 명령어 요청 패턴을 감지하고 분석
   */
  public analyzeCommandRequest(
    query: string,
    nlpEntities?: Array<{ value: string; type?: string }>
  ): CommandRequestContext {
    const lowerQuery = query.toLowerCase();

    // 명령어 관련 키워드 패턴
    const commandPatterns = [
      /(\w+)\s*(명령어|커맨드|command)/,
      /(어떻게|어떤|무슨)\s*명령어/,
      /(실행|사용)하는\s*(방법|명령어)/,
      /(서버|시스템)\s*(상태|모니터링|관리).*명령어/,
      /command\s+(to|for)\s+/,
      /how\s+to\s+.*(command|cmd)/,
      /(확인|체크|모니터링)할\s*(명령어|커맨드|방법)/, // 추가
      /(높을|낮을|많을|적을)\s*때\s*(확인|사용)할\s*(명령어|방법)?/, // 추가
    ];

    // 카테고리별 키워드
    const categoryKeywords = {
      monitoring: ['모니터링', '상태', '확인', 'monitor', 'status', 'check'],
      service: ['서비스', '프로세스', 'service', 'process', 'daemon'],
      log: ['로그', '기록', 'log', 'journal', 'history'],
      network: ['네트워크', '연결', 'network', 'connection', 'ping'],
      disk: ['디스크', '저장소', 'disk', 'storage', 'space'],
      system: ['시스템', '정보', 'system', 'info', 'hardware'],
    };

    // 서버/서비스별 키워드 (specificCommands에 추가용)
    const serverKeywords = {
      // 웹 서버
      nginx: ['nginx', '엔진엑스'],
      apache: ['apache', 'httpd', '아파치'],
      // 앱 서버
      tomcat: ['tomcat', '톰캣', 'java'],
      nodejs: ['node', 'nodejs', 'pm2', '노드'],
      // DB 서버
      postgres: ['postgres', 'postgresql', '포스트그레스'],
      mysql: ['mysql'],
      // 기타
      windows: ['windows', 'smb', 'file', 'nas'],
      backup: ['backup', 'bacula', '백업'],
    };

    let isCommandRequest = false;
    let requestType: CommandRequestContext['requestType'] = 'general';
    let confidence = 0;
    const detectedCategories: string[] = [];
    const specificCommands: string[] = [];

    // 패턴 매칭으로 명령어 요청 감지
    for (const pattern of commandPatterns) {
      if (pattern.test(lowerQuery)) {
        isCommandRequest = true;
        confidence += 0.3;

        if (lowerQuery.includes('어떻게') || lowerQuery.includes('how')) {
          requestType = 'command_usage';
        } else if (lowerQuery.includes('무슨') || lowerQuery.includes('어떤')) {
          requestType = 'command_inquiry';
        } else {
          requestType = 'command_request';
        }
        break;
      }
    }

    // NLP 엔티티에서 명령어 카테고리 감지
    if (nlpEntities) {
      for (const entity of nlpEntities) {
        if (entity.type === 'command') {
          isCommandRequest = true;
          confidence += 0.4;
          detectedCategories.push(entity.value);

          if (entity.value === 'command_request') {
            requestType = 'command_request';
            confidence += 0.2;
          }
        }
      }
    }

    // 카테고리별 키워드 매칭
    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      for (const keyword of keywords) {
        if (lowerQuery.includes(keyword)) {
          detectedCategories.push(category);
          if (isCommandRequest) {
            confidence += 0.1;
          }
        }
      }
    }

    // 서버/서비스 키워드를 specificCommands에 추가
    for (const [server, keywords] of Object.entries(serverKeywords)) {
      for (const keyword of keywords) {
        if (lowerQuery.includes(keyword)) {
          specificCommands.push(server);
          if (!isCommandRequest) {
            isCommandRequest = true;
            requestType = 'command_inquiry';
          }
          confidence += 0.15;
        }
      }
    }

    // 특정 Linux/Unix 명령어 감지
    const commonCommands = [
      'top',
      'htop',
      'ps',
      'free',
      'df',
      'iostat',
      'vmstat',
      'netstat',
      'ss',
      'systemctl',
      'service',
      'tail',
      'journalctl',
      'ping',
      'traceroute',
      'nslookup',
      'dig',
      'curl',
      'wget',
      'ifconfig',
      'ip',
    ];

    for (const cmd of commonCommands) {
      if (lowerQuery.includes(cmd)) {
        specificCommands.push(cmd);
        if (!isCommandRequest) {
          isCommandRequest = true;
          requestType = 'command_inquiry';
        }
        confidence += 0.2;
      }
    }

    // 최종 confidence 조정 (0-1 범위)
    confidence = Math.min(confidence, 1.0);

    return {
      isCommandRequest,
      detectedCategories: [...new Set(detectedCategories)], // 중복 제거
      specificCommands: [...new Set(specificCommands)], // 중복 제거
      confidence,
      requestType,
    };
  }

  /**
   * 💡 명령어 추천 생성
   *
   * 컨텍스트를 바탕으로 적합한 명령어들을 추천
   */
  public async generateCommandRecommendations(
    context: CommandRequestContext
  ): Promise<CommandRecommendation[]> {
    const recommendations: CommandRecommendation[] = [];

    // 서버 ID 감지 또는 기본값 사용
    // TODO: 향후 context에서 serverId 받아오도록 개선
    const detectedServerId = this.detectServerFromContext(context);

    if (detectedServerId) {
      // serverCommandsConfig의 recommendCommands 함수 사용
      let scenario = 'general';

      // context 기반으로 시나리오 결정
      if (context.detectedCategories.includes('monitoring')) {
        if (
          context.specificCommands.some(
            (cmd) =>
              cmd.includes('cpu') || cmd.includes('top') || cmd.includes('htop')
          )
        ) {
          scenario = 'cpu_high';
        } else if (
          context.specificCommands.some(
            (cmd) =>
              cmd.includes('memory') ||
              cmd.includes('free') ||
              cmd.includes('mem')
          )
        ) {
          scenario = 'memory_leak';
        }
      } else if (context.detectedCategories.includes('disk')) {
        scenario = 'disk_full';
      } else if (
        context.detectedCategories.includes('service') ||
        context.detectedCategories.includes('system')
      ) {
        scenario = 'service_down';
      }

      // recommendCommands 함수로 서버별 맞춤 명령어 가져오기
      const osCommands = recommendCommands(
        detectedServerId,
        scenario,
        context.detectedCategories[0]
      );

      // OSCommand를 CommandRecommendation 형식으로 변환
      for (const cmd of osCommands) {
        recommendations.push({
          command: cmd.command,
          description: cmd.description,
          category: cmd.category,
          confidence: context.confidence * 0.9, // 서버별 맞춤 명령어는 높은 신뢰도
          usage_example: cmd.usage || cmd.example || cmd.command,
          related_commands: cmd.alternatives,
        });
      }
    }

    // 서버를 감지하지 못한 경우 일반적인 명령어 추천
    if (recommendations.length === 0) {
      // 모든 서버의 공통 명령어 수집
      const commonCommands = this.getCommonCommands(context);
      recommendations.push(...commonCommands);
    }

    // 특정 명령어가 언급된 경우 모든 서버에서 검색
    if (context.specificCommands.length > 0) {
      for (const cmd of context.specificCommands) {
        const foundCommands = this.searchCommandsAcrossServers(cmd);
        for (const found of foundCommands) {
          if (!recommendations.find((r) => r.command === found.command)) {
            recommendations.push(found);
          }
        }
      }
    }

    // 신뢰도순으로 정렬하고 상위 5개만 반환
    return recommendations
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 5);
  }

  /**
   * 🔍 컨텍스트에서 서버 ID 감지
   *
   * 사용자 입력에서 특정 서버나 서비스 힌트를 찾아 서버 ID 매핑
   */
  public detectServerFromContext(
    context: CommandRequestContext
  ): string | null {
    // 서버 이름 패턴과 서버 ID 매핑
    const serverPatterns: Array<{ patterns: RegExp[]; serverId: string }> = [
      {
        patterns: [/nginx/i, /web.*1/i, /web.*prd.*01/i],
        serverId: 'web-prd-01',
      },
      {
        patterns: [/apache/i, /httpd/i, /web.*2/i, /web.*prd.*02/i],
        serverId: 'web-prd-02',
      },
      {
        patterns: [/tomcat/i, /java/i, /app.*1/i, /app.*prd.*01/i],
        serverId: 'app-prd-01',
      },
      {
        patterns: [/node/i, /pm2/i, /app.*2/i, /app.*prd.*02/i],
        serverId: 'app-prd-02',
      },
      {
        patterns: [/postgres/i, /postgresql/i, /db.*main/i, /db.*01/i],
        serverId: 'db-main-01',
      },
      {
        patterns: [/replica/i, /db.*repl/i, /db.*02/i],
        serverId: 'db-repl-01',
      },
      {
        patterns: [/windows/i, /smb/i, /file.*nas/i, /storage/i],
        serverId: 'file-nas-01',
      },
      {
        patterns: [/backup/i, /bacula/i],
        serverId: 'backup-01',
      },
    ];

    // specificCommands에서 서버 힌트 찾기
    for (const { patterns, serverId } of serverPatterns) {
      for (const pattern of patterns) {
        if (context.specificCommands.some((cmd) => pattern.test(cmd))) {
          console.log(`🎯 서버 감지: ${serverId}`);
          return serverId;
        }
      }
    }

    // 기본값: 첫 번째 웹 서버
    return null;
  }

  /**
   * 🌐 모든 서버의 공통 명령어 수집
   *
   * 특정 서버를 감지하지 못한 경우 카테고리별 일반적인 명령어 제공
   */
  public getCommonCommands(
    context: CommandRequestContext
  ): CommandRecommendation[] {
    const commonCommands: CommandRecommendation[] = [];

    // 카테고리별 대표 명령어
    const categoryDefaults: Record<string, OSCommand[]> = {
      monitoring: [
        {
          command: 'top',
          description: '실시간 프로세스 및 시스템 리소스 모니터링',
          category: 'monitoring',
          riskLevel: 'safe',
          usage: 'top [-b] [-n count]',
          example: 'top -b -n 1',
        },
        {
          command: 'htop',
          description: '향상된 대화형 프로세스 뷰어',
          category: 'monitoring',
          riskLevel: 'safe',
        },
      ],
      disk: [
        {
          command: 'df -h',
          description: '디스크 사용량 확인 (사람이 읽기 쉬운 형식)',
          category: 'disk',
          riskLevel: 'safe',
        },
      ],
      network: [
        {
          command: 'netstat -tuln',
          description: '열린 네트워크 포트 확인',
          category: 'network',
          riskLevel: 'safe',
        },
      ],
      system: [
        {
          command: 'systemctl status',
          description: '서비스 상태 확인',
          category: 'system',
          riskLevel: 'safe',
          example: 'systemctl status nginx',
        },
      ],
    };

    // 감지된 카테고리에 따라 명령어 추가
    for (const category of context.detectedCategories) {
      if (categoryDefaults[category]) {
        for (const cmd of categoryDefaults[category]) {
          commonCommands.push({
            command: cmd.command,
            description: cmd.description,
            category: cmd.category,
            confidence: context.confidence * 0.7, // 일반 명령어는 낮은 신뢰도
            usage_example: cmd.usage || cmd.example || cmd.command,
            related_commands: cmd.alternatives,
          });
        }
      }
    }

    return commonCommands;
  }

  /**
   * 🔎 모든 서버에서 특정 명령어 검색
   *
   * 특정 명령어나 키워드가 언급된 경우 모든 서버에서 관련 명령어 찾기
   */
  public searchCommandsAcrossServers(
    searchTerm: string
  ): CommandRecommendation[] {
    const foundCommands: CommandRecommendation[] = [];
    const searchLower = searchTerm.toLowerCase();

    // 모든 서버의 명령어 검색
    for (const [serverId, serverConfig] of Object.entries(serverCommandsMap)) {
      const allCommands = [
        ...serverConfig.commands.basic,
        ...serverConfig.commands.advanced,
        ...serverConfig.commands.troubleshooting,
      ];

      for (const cmd of allCommands) {
        if (
          cmd.command.toLowerCase().includes(searchLower) ||
          cmd.description.toLowerCase().includes(searchLower)
        ) {
          // 중복 방지
          const exists = foundCommands.find(
            (f) =>
              f.command === cmd.command && f.description === cmd.description
          );

          if (!exists) {
            foundCommands.push({
              command: cmd.command,
              description: `${cmd.description} (${serverConfig.os})`,
              category: cmd.category,
              confidence: 0.8,
              usage_example: cmd.usage || cmd.example || cmd.command,
              related_commands: cmd.alternatives,
            });
          }
        }
      }
    }

    return foundCommands;
  }

  /**
   * 📝 명령어 추천 응답 포맷팅
   *
   * 추천된 명령어들을 사용자 친화적인 형식으로 포맷
   */
  public formatCommandRecommendations(
    recommendations: CommandRecommendation[],
    context: CommandRequestContext,
    originalQuery: string
  ): string {
    if (recommendations.length === 0) {
      return `"${originalQuery}"에 대한 명령어를 찾지 못했습니다. 더 구체적인 요청을 해주세요.`;
    }

    let response = '';

    // 요청 유형에 따른 인사말
    switch (context.requestType) {
      case 'command_request':
        response += `요청하신 작업에 적합한 명령어들을 추천드립니다:\n\n`;
        break;
      case 'command_inquiry':
        response += `문의하신 명령어에 대한 정보입니다:\n\n`;
        break;
      case 'command_usage':
        response += `사용 방법과 함께 관련 명령어들을 안내드립니다:\n\n`;
        break;
      default:
        response += `관련 명령어 추천:\n\n`;
    }

    // 각 명령어 정보 포맷팅
    recommendations.forEach((rec, index) => {
      response += `${index + 1}. **${rec.command}**\n`;
      response += `   📝 ${rec.description}\n`;
      response += `   💡 사용 예시: \`${rec.usage_example}\`\n`;

      if (rec.related_commands && rec.related_commands.length > 0) {
        response += `   🔗 관련 명령어: ${rec.related_commands.join(', ')}\n`;
      }

      response += `   📊 카테고리: ${rec.category} (신뢰도: ${Math.round(rec.confidence * 100)}%)\n\n`;
    });

    // 추가 도움말
    if (context.confidence > 0.7) {
      response += `💡 **도움말**: 위 명령어들은 "${originalQuery}" 요청에 기반해 추천되었습니다.\n`;
      response += `더 자세한 사용법이나 옵션이 필요하시면 \`man [명령어]\` 또는 \`[명령어] --help\`를 사용해보세요.`;
    } else {
      response += `💡 **참고**: 요청이 명확하지 않아 일반적인 명령어들을 추천드렸습니다.\n`;
      response += `더 구체적인 작업이나 상황을 알려주시면 더 정확한 명령어를 추천해드릴 수 있습니다.`;
    }

    return response;
  }

  /**
   * 🤖 명령어 추천 시스템 - 완전한 분석 결과 반환
   *
   * 외부에서 직접 명령어 추천을 요청할 수 있는 통합 메서드
   */
  public async getCommandRecommendations(
    query: string,
    options?: {
      includeAnalysis?: boolean;
      maxRecommendations?: number;
    }
  ): Promise<CommandAnalysisResult> {
    const { includeAnalysis = true, maxRecommendations = 5 } = options || {};

    // 1. 명령어 요청 분석
    const analysis = this.analyzeCommandRequest(query);

    console.log('🔍 명령어 분석 결과:', {
      query,
      isCommandRequest: analysis.isCommandRequest,
      detectedCategories: analysis.detectedCategories,
      specificCommands: analysis.specificCommands,
      confidence: analysis.confidence,
      requestType: analysis.requestType,
    });

    // 2. 명령어 추천 생성
    let recommendations = await this.generateCommandRecommendations(analysis);

    // 3. 최대 개수 제한 적용
    if (maxRecommendations && recommendations.length > maxRecommendations) {
      recommendations = recommendations.slice(0, maxRecommendations);
    }

    // 4. 포맷된 응답 생성
    const formattedResponse = this.formatCommandRecommendations(
      recommendations,
      analysis,
      query
    );

    return {
      recommendations,
      analysis,
      formattedResponse,
    };
  }

  /**
   * 🔍 명령어 요청 간단 감지
   *
   * 쿼리가 명령어 요청인지 빠르게 확인하는 유틸리티 메서드
   */
  public detectCommandQuery(query: string): CommandDetectionResult {
    const analysis = this.analyzeCommandRequest(query);

    return {
      isCommand: analysis.isCommandRequest,
      confidence: analysis.confidence,
      categories: analysis.detectedCategories,
      type: analysis.requestType,
    };
  }

  /**
   * 🎯 명령어 요청 사전 처리
   *
   * UnifiedAIEngineRouter에서 명령어 요청을 처리하기 전 사전 분석
   */
  public async processCommandQuery(
    query: string,
    nlpEntities?: Array<{ value: string; type?: string }>
  ): Promise<{
    shouldProcessAsCommand: boolean;
    commandContext: CommandRequestContext;
    formattedResponse?: string;
  }> {
    // 1. 명령어 요청 분석
    const commandContext = this.analyzeCommandRequest(query, nlpEntities);

    // 2. 명령어 요청 여부 판단 (임계값: 0.5)
    const shouldProcessAsCommand =
      commandContext.isCommandRequest && commandContext.confidence > 0.5;

    // 3. 명령어로 처리해야 하는 경우 추천 생성
    let formattedResponse: string | undefined;

    if (shouldProcessAsCommand) {
      const recommendations =
        await this.generateCommandRecommendations(commandContext);
      formattedResponse = this.formatCommandRecommendations(
        recommendations,
        commandContext,
        query
      );
    }

    return {
      shouldProcessAsCommand,
      commandContext,
      formattedResponse,
    };
  }

  /**
   * 📊 명령어 시스템 통계
   *
   * 명령어 추천 시스템의 성능 통계 조회
   */
  public getCommandStats(): {
    totalServers: number;
    totalCommands: number;
    categoryCounts: Record<string, number>;
    serverCounts: Record<string, number>;
  } {
    let totalCommands = 0;
    const categoryCounts: Record<string, number> = {};
    const serverCounts: Record<string, number> = {};

    // 모든 서버의 명령어 통계 수집
    for (const [serverId, serverConfig] of Object.entries(serverCommandsMap)) {
      const allCommands = [
        ...serverConfig.commands.basic,
        ...serverConfig.commands.advanced,
        ...serverConfig.commands.troubleshooting,
      ];

      serverCounts[serverId] = allCommands.length;
      totalCommands += allCommands.length;

      // 카테고리별 카운트
      for (const cmd of allCommands) {
        categoryCounts[cmd.category] = (categoryCounts[cmd.category] || 0) + 1;
      }
    }

    return {
      totalServers: Object.keys(serverCommandsMap).length,
      totalCommands,
      categoryCounts,
      serverCounts,
    };
  }

  /**
   * 🔧 설정 업데이트
   *
   * 명령어 시스템 설정 업데이트
   */
  public updateConfig(newConfig: Partial<RouterConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('🤖 명령어 시스템 설정 업데이트:', {
      enableKoreanNLP: this.config.enableKoreanNLP,
      koreanNLPThreshold: this.config.koreanNLPThreshold,
    });
  }
}
