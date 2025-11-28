/**
 * 🤖 AI 통합 스트리밍 API (Vercel AI SDK)
 *
 * 목표: 포트폴리오용 AI 어시스턴트 시뮬레이션
 * - Vercel AI SDK streamText 사용
 * - Tool Calling (4개 포트폴리오용 Tools)
 * - 실시간 Thinking Process 시각화
 * - Mock 데이터 기반 시뮬레이션
 *
 * POST /api/ai/unified-stream
 */

import { google } from '@ai-sdk/google';
import { streamText, tool } from 'ai';
import { z } from 'zod';
import { getGoogleAIKey } from '@/lib/ai/google-ai-manager';
import { loadHourlyScenarioData } from '@/services/scenario/scenario-loader';
import { SupabaseRAGEngine } from '@/services/ai/supabase-rag-engine';
import { createClient } from '@/lib/supabase/server';
import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/auth/api-auth';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

/**
 * 📊 Tool 1: 서버 메트릭 조회 (기존 15개 서버 데이터 활용)
 * scenario-loader의 실제 시뮬레이션 데이터 사용
 */
const getServerMetrics = tool({
  description:
    '서버 CPU/메모리/디스크 상태를 조회합니다 (시나리오 기반 시뮬레이션)',
  inputSchema: z.object({
    serverId: z.string().optional().describe('조회할 서버 ID (선택)'),
    metric: z
      .enum(['cpu', 'memory', 'disk', 'all'])
      .describe('조회할 메트릭 타입'),
  }),
  execute: async ({
    serverId,
    metric,
  }: {
    serverId?: string;
    metric: 'cpu' | 'memory' | 'disk' | 'all';
  }) => {
    // 🎯 기존 15개 서버 데이터 로드 (scenario-loader)
    const allServers = await loadHourlyScenarioData();

    const target = serverId
      ? allServers.find((s) => s.id === serverId)
      : allServers;

    const servers = Array.isArray(target)
      ? target
      : target
        ? [target]
        : allServers;

    // 평균 계산
    const avgCpu = servers.reduce((sum, s) => sum + s.cpu, 0) / servers.length;
    const avgMemory =
      servers.reduce((sum, s) => sum + s.memory, 0) / servers.length;
    const avgDisk =
      servers.reduce((sum, s) => sum + s.disk, 0) / servers.length;

    return {
      success: true,
      servers: servers.map((s) => ({
        id: s.id,
        name: s.name,
        status: s.status,
        cpu: s.cpu,
        memory: s.memory,
        disk: s.disk,
        network: s.network,
      })),
      summary: {
        total: servers.length,
        avgCpu: Math.round(avgCpu),
        avgMemory: Math.round(avgMemory),
        avgDisk: Math.round(avgDisk),
        alertCount: servers.filter(
          (s) => s.status === 'warning' || s.status === 'critical'
        ).length,
      },
      timestamp: new Date().toISOString(),
      _dataSource: 'scenario-loader (15 servers)',
      _note: '시나리오 기반 시뮬레이션 데이터 (기존 시스템 활용)',
    };
  },
});

/**
 * 🔮 Tool 2: ML 장애 예측 (실제 GCP Cloud Functions)
 * GCP ML Analytics Engine을 사용한 실제 장애 예측
 */
const predictIncident = tool({
  description: 'ML 모델로 서버 장애 가능성을 예측합니다 (GCP Cloud Functions)',
  inputSchema: z.object({
    serverId: z.string().describe('예측할 서버 ID'),
  }),
  execute: async ({ serverId }: { serverId: string }) => {
    try {
      // 🚀 실제 GCP ML Analytics Engine 호출
      const gcpEndpoint =
        process.env.NEXT_PUBLIC_GCP_ML_ANALYTICS_ENDPOINT ||
        'https://asia-northeast3-openmanager-free-tier.cloudfunctions.net/ml-analytics-engine';

      // 🎯 기존 15개 서버 데이터 로드
      const allServers = await loadHourlyScenarioData();

      const server = allServers.find((s) => s.id === serverId);
      if (!server) {
        return {
          success: false,
          error: `Server ${serverId} not found (total: ${allServers.length} servers)`,
          timestamp: new Date().toISOString(),
        };
      }

      // 24시간 메트릭 데이터 생성 (실제로는 DB에서 조회)
      const metrics = [];
      const now = new Date();
      for (let i = 0; i < 24; i++) {
        const timestamp = new Date(now.getTime() - i * 3600000);
        metrics.push(
          {
            timestamp: timestamp.toISOString(),
            value: server.cpu + (Math.random() - 0.5) * 10,
            server_id: serverId,
            metric_type: 'cpu',
          },
          {
            timestamp: timestamp.toISOString(),
            value: server.memory + (Math.random() - 0.5) * 10,
            server_id: serverId,
            metric_type: 'memory',
          }
        );
      }

      // GCP ML Analytics Engine 호출
      const response = await fetch(gcpEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metrics,
          context: {
            analysis_type: 'anomaly_detection',
            threshold: 0.8,
          },
        }),
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        throw new Error(`GCP ML API error: ${response.status}`);
      }

      const result = await response.json();

      // 이상 탐지 결과 기반 장애 확률 계산
      const anomalies = result.data?.anomalies || [];
      const highSeverityAnomalies = anomalies.filter(
        (a: any) => a.severity === 'high'
      );
      const probability = Math.min(highSeverityAnomalies.length * 0.2, 0.95);

      const riskFactors = anomalies.map((a: any) => ({
        metric: a.timestamp,
        severity: a.severity,
        value: a.value,
      }));

      return {
        success: true,
        serverId,
        prediction: {
          probability: Number(probability.toFixed(2)),
          timeframe: '1h',
          confidence: result.data?.trend?.confidence || 0.85,
          riskLevel:
            probability > 0.7 ? 'high' : probability > 0.4 ? 'medium' : 'low',
          factors: riskFactors,
          trend: result.data?.trend,
          recommendations: result.data?.recommendations || [],
        },
        timestamp: new Date().toISOString(),
        _realGCP: true,
        _endpoint: gcpEndpoint,
        _performance: result.performance,
      };
    } catch (error) {
      console.error('❌ GCP ML 예측 실패:', error);

      // Fallback: 간단한 로컬 예측 (기존 서버 데이터 사용)
      const allServers = await loadHourlyScenarioData();
      const server = allServers.find((s) => s.id === serverId);

      if (!server) {
        return {
          success: false,
          error: `Fallback: Server ${serverId} not found`,
          timestamp: new Date().toISOString(),
        };
      }

      const cpuRisk = server.cpu > 80 ? 0.7 : server.cpu > 60 ? 0.4 : 0.1;
      const memRisk = server.memory > 85 ? 0.8 : server.memory > 70 ? 0.5 : 0.2;
      const probability = Math.max(cpuRisk, memRisk);

      return {
        success: true,
        serverId,
        prediction: {
          probability: Number(probability.toFixed(2)),
          timeframe: '1h',
          confidence: 0.6,
          riskLevel:
            probability > 0.7 ? 'high' : probability > 0.4 ? 'medium' : 'low',
          factors: [
            cpuRisk > 0.5 ? `High CPU usage (${server.cpu}%)` : null,
            memRisk > 0.5 ? `High memory usage (${server.memory}%)` : null,
          ].filter(Boolean),
        },
        timestamp: new Date().toISOString(),
        _fallback: true,
        _error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
});

/**
 * 📚 Tool 3: RAG 지식베이스 시뮬레이션
 * 하드코딩된 Mock 지식베이스
 */
/**
 * 📚 Tool 3: RAG 지식베이스 검색 (Real RAG)
 * Supabase pgvector 기반 하이브리드 검색
 */
const searchKnowledgeBase = tool({
  description: '과거 장애 이력 및 해결 방법을 검색합니다 (Real RAG)',
  inputSchema: z.object({
    query: z.string().describe('검색 쿼리'),
  }),
  execute: async ({ query }: { query: string }) => {
    try {
      // 🚀 Real RAG Engine 초기화
      const supabase = await createClient();
      const ragEngine = new SupabaseRAGEngine(supabase);

      // 하이브리드 검색 수행
      const searchResult = await ragEngine.searchHybrid(query, {
        maxResults: 3,
        enableKeywordFallback: true,
      });

      if (!searchResult.success || searchResult.results.length === 0) {
        return {
          success: false,
          query,
          message: '관련된 문서를 찾을 수 없습니다.',
          timestamp: new Date().toISOString(),
        };
      }

      return {
        success: true,
        query,
        results: searchResult.results.map((r) => ({
          content: r.content,
          similarity: r.similarity,
          metadata: r.metadata,
        })),
        totalMatches: searchResult.totalResults,
        timestamp: new Date().toISOString(),
        _source: 'Supabase pgvector (Real RAG)',
      };
    } catch (error) {
      console.error('❌ RAG 검색 실패:', error);
      return {
        success: false,
        error: '지식베이스 검색 중 오류가 발생했습니다.',
        timestamp: new Date().toISOString(),
      };
    }
  },
});

/**
 * 📈 Tool 4: 서버 상태 종합 분석
 * 통계 기반 건강도 분석
 */
const analyzeServerHealth = tool({
  description: '전체 서버의 건강도를 종합 분석합니다 (포트폴리오 시뮬레이션)',
  inputSchema: z.object({}),
  execute: async () => {
    // 🎯 기존 15개 서버 데이터 로드
    const allServers = await loadHourlyScenarioData();

    // 건강도 점수 계산 (0-100)
    const healthScore =
      allServers.reduce((sum, s) => {
        const cpuScore = (100 - s.cpu) / 100;
        const memScore = (100 - s.memory) / 100;
        const diskScore = (100 - s.disk) / 100;
        return sum + (cpuScore + memScore + diskScore) / 3;
      }, 0) / allServers.length;

    const criticalServers = allServers.filter((s) => s.status === 'critical');
    const warningServers = allServers.filter((s) => s.status === 'warning');
    const healthyServers = allServers.filter((s) => s.status === 'online');

    // 권장사항 생성
    const recommendations = [
      healthScore < 0.6 ? '일부 서버 리소스 확장 필요' : null,
      allServers.some((s) => s.cpu > 80) ? 'CPU 부하 분산 권장' : null,
      allServers.some((s) => s.memory > 85) ? '메모리 최적화 필요' : null,
      criticalServers.length > 0
        ? `긴급: ${criticalServers.length}대 서버 즉시 조치 필요`
        : null,
    ].filter(Boolean);

    return {
      success: true,
      analysis: {
        overallHealth: Math.round(healthScore * 100),
        healthGrade: healthScore > 0.8 ? 'A' : healthScore > 0.6 ? 'B' : 'C',
        serverCount: {
          total: allServers.length,
          healthy: healthyServers.length,
          warning: warningServers.length,
          critical: criticalServers.length,
        },
        recommendations,
      },
      timestamp: new Date().toISOString(),
      _dataSource: 'scenario-loader (Simulation)',
    };
  },
});

/**
 * ⚡ Tool 5: 패턴 분석 (Offline Capability)
 * 정규식 기반의 빠른 의도 파악
 */
const analyzePattern = tool({
  description:
    '사용자 질문의 패턴을 분석하여 즉각적인 시스템 정보를 제공합니다 (Offline)',
  inputSchema: z.object({
    query: z.string().describe('분석할 사용자 질문'),
  }),
  execute: async ({ query }: { query: string }) => {
    const patterns: string[] = [];
    const q = query.toLowerCase();

    // 시스템 관련 패턴 매칭
    if (/cpu|프로세서|성능/i.test(q)) patterns.push('system_performance');
    if (/메모리|ram|memory/i.test(q)) patterns.push('memory_status');
    if (/디스크|저장소|용량/i.test(q)) patterns.push('storage_info');
    if (/네트워크|인터넷|연결/i.test(q)) patterns.push('network_status');
    if (/서버|시스템|상태/i.test(q)) patterns.push('server_status');

    if (patterns.length === 0) {
      return {
        success: false,
        message: '매칭되는 패턴이 없습니다.',
      };
    }

    return {
      success: true,
      patterns,
      detectedIntent: patterns[0],
      timestamp: new Date().toISOString(),
      _mode: 'offline-pattern-match',
    };
  },
});

/**
 * ⌨️ Tool 6: 명령어 추천 (Offline Capability)
 * 키워드 기반 CLI 명령어 추천
 */
const recommendCommands = tool({
  description: '사용자 질문에 적합한 CLI 명령어를 추천합니다 (Offline)',
  inputSchema: z.object({
    keywords: z.array(z.string()).describe('질문에서 추출한 핵심 키워드'),
  }),
  execute: async ({ keywords }: { keywords: string[] }) => {
    const recommendations = [
      {
        keywords: ['서버', '목록', '조회', '리스트'],
        command: 'list servers',
        description: '현재 등록된 모든 서버 목록을 조회합니다.',
      },
      {
        keywords: ['상태', '체크', '확인', 'status'],
        command: 'status check',
        description: '시스템 전체 상태를 점검합니다.',
      },
      {
        keywords: ['성능', '모니터링', 'cpu', '메모리'],
        command: 'monitor performance',
        description: '실시간 성능 지표를 모니터링합니다.',
      },
      {
        keywords: ['로그', '분석', '에러'],
        command: 'analyze logs',
        description: '시스템 로그를 분석합니다.',
      },
      {
        keywords: ['알림', '설정', 'alert'],
        command: 'configure alerts',
        description: '알림 규칙을 설정합니다.',
      },
    ];

    const matched = recommendations.filter((rec) =>
      keywords.some((k) =>
        rec.keywords.some((rk) => rk.includes(k) || k.includes(rk))
      )
    );

    return {
      success: true,
      recommendations:
        matched.length > 0 ? matched : recommendations.slice(0, 3), // 매칭 없으면 기본 3개
      timestamp: new Date().toISOString(),
      _mode: 'offline-command-recommendation',
    };
  },
});

// ============================================================================
// 🧠 Extended Thinking Tools - AI 사고 과정 시각화
// ============================================================================

/**
 * 💡 Thinking Tool 1: 질문 의도 분석
 */
const analyzeIntent = tool({
  description: '사용자 질문의 의도를 분석합니다 (Thinking Step)',
  inputSchema: z.object({
    query: z.string().describe('사용자 질문'),
  }),
  execute: async ({ query }: { query: string }) => {
    const lowerQuery = query.toLowerCase();

    // 키워드 기반 의도 분류
    let intent = 'general';
    let category = 'information';
    let confidence = 0.7;

    if (
      lowerQuery.includes('cpu') ||
      lowerQuery.includes('메모리') ||
      lowerQuery.includes('디스크')
    ) {
      intent = 'metric_query';
      category = 'monitoring';
      confidence = 0.9;
    } else if (lowerQuery.includes('상태') || lowerQuery.includes('status')) {
      intent = 'status_check';
      category = 'monitoring';
      confidence = 0.85;
    } else if (
      lowerQuery.includes('장애') ||
      lowerQuery.includes('에러') ||
      lowerQuery.includes('문제')
    ) {
      intent = 'incident_analysis';
      category = 'troubleshooting';
      confidence = 0.9;
    } else if (lowerQuery.includes('예측') || lowerQuery.includes('가능성')) {
      intent = 'prediction';
      category = 'analytics';
      confidence = 0.85;
    } else if (lowerQuery.includes('최적화') || lowerQuery.includes('개선')) {
      intent = 'optimization';
      category = 'improvement';
      confidence = 0.8;
    }

    return {
      intent,
      category,
      confidence,
      reasoning: `질문에서 "${intent}" 의도를 감지했습니다.`,
      suggestedTools:
        intent === 'metric_query'
          ? ['getServerMetrics']
          : intent === 'prediction'
            ? ['predictIncident']
            : intent === 'incident_analysis'
              ? ['searchKnowledgeBase']
              : [],
    };
  },
});

/**
 * 💡 Thinking Tool 2: 복잡도 분석
 */
const analyzeComplexity = tool({
  description:
    '질문의 복잡도를 분석하여 최적 처리 전략을 결정합니다 (Thinking Step)',
  inputSchema: z.object({
    query: z.string().describe('사용자 질문'),
    intent: z.string().optional().describe('분석된 의도'),
  }),
  execute: async ({ query, intent }: { query: string; intent?: string }) => {
    const words = query.split(' ').length;
    const hasMultipleQuestions =
      query.includes('?') && query.split('?').length > 2;
    const requiresAggregation =
      query.includes('전체') ||
      query.includes('모든') ||
      query.includes('종합');

    // 복잡도 점수 (1-5)
    let score = 1;
    if (words > 20) score += 1;
    if (hasMultipleQuestions) score += 1;
    if (requiresAggregation) score += 1;
    if (intent === 'incident_analysis' || intent === 'optimization') score += 1;

    const recommendation =
      score >= 4 ? 'multi-tool' : score >= 3 ? 'single-tool' : 'direct-answer';

    return {
      score,
      level: score >= 4 ? 'complex' : score >= 3 ? 'moderate' : 'simple',
      recommendation,
      reasoning: `질문 길이 ${words}단어, 복잡도 ${score}/5점으로 "${recommendation}" 전략을 권장합니다.`,
      estimatedTools: score >= 4 ? 3 : score >= 3 ? 1 : 0,
    };
  },
});

/**
 * 💡 Thinking Tool 3: 라우팅 결정
 */
const selectRoute = tool({
  description: '최적의 처리 경로를 선택합니다 (Thinking Step)',
  inputSchema: z.object({
    complexity: z.number().describe('복잡도 점수 (1-5)'),
    intent: z.string().describe('질문 의도'),
  }),
  execute: async ({
    complexity,
    intent,
  }: {
    complexity: number;
    intent: string;
  }) => {
    const route =
      complexity >= 4
        ? 'comprehensive-analysis'
        : complexity >= 3
          ? 'targeted-query'
          : 'quick-response';

    const toolSequence =
      intent === 'prediction'
        ? ['getServerMetrics', 'predictIncident']
        : intent === 'incident_analysis'
          ? ['searchKnowledgeBase', 'getServerMetrics']
          : intent === 'optimization'
            ? ['analyzeServerHealth', 'searchKnowledgeBase']
            : ['getServerMetrics'];

    const costEstimate =
      complexity >= 4 ? '$0.003' : complexity >= 3 ? '$0.001' : '$0';

    return {
      route,
      strategy:
        complexity >= 4
          ? 'Multi-tool 종합 분석'
          : complexity >= 3
            ? 'Single-tool 타겟팅'
            : 'Direct 즉시 응답',
      toolSequence,
      reasoning: `복잡도 ${complexity}점, ${intent} 의도 → "${route}" 경로 선택`,
      costEstimate,
      freeOptimized: costEstimate === '$0',
    };
  },
});

/**
 * 💡 Thinking Tool 4: 컨텍스트 검색
 */
const searchContext = tool({
  description: '관련 컨텍스트를 검색합니다 (Thinking Step)',
  inputSchema: z.object({
    query: z.string().describe('검색 쿼리'),
    scope: z.enum(['servers', 'knowledge', 'history']).describe('검색 범위'),
  }),
  execute: async ({
    query,
    scope,
  }: {
    query: string;
    scope: 'servers' | 'knowledge' | 'history';
  }) => {
    const results = {
      servers: {
        found: 4,
        relevant: ['server-2', 'server-4'],
        summary: '2대 서버에서 관련 메트릭 발견',
      },
      knowledge: {
        found: 3,
        relevant: ['CPU 과부하', '메모리 누수'],
        summary: '과거 유사 사례 2건 발견',
      },
      history: {
        found: 5,
        relevant: ['2024-11-20 장애', '2024-11-15 최적화'],
        summary: '최근 2주 내 관련 이벤트 2건',
      },
    };

    const result = results[scope];

    return {
      scope,
      ...result,
      reasoning: `"${scope}" 범위에서 ${result.found}건 검색, ${result.relevant.length}건 관련`,
      confidence: result.relevant.length / result.found,
    };
  },
});

/**
 * 💡 Thinking Tool 5: 인사이트 생성
 */
const generateInsight = tool({
  description: '수집된 데이터에서 인사이트를 생성합니다 (Thinking Step)',
  inputSchema: z.object({
    dataPoints: z.array(z.string()).describe('수집된 데이터 포인트'),
  }),
  execute: async ({ dataPoints }: { dataPoints: string[] }) => {
    const insights = [];

    if (dataPoints.some((d) => d.includes('cpu') || d.includes('CPU'))) {
      insights.push({
        type: 'performance',
        message: 'CPU 사용률 패턴 분석 완료',
        priority: 'medium',
      });
    }

    if (
      dataPoints.some((d) => d.includes('critical') || d.includes('warning'))
    ) {
      insights.push({
        type: 'alert',
        message: '긴급 조치 필요 서버 감지',
        priority: 'high',
      });
    }

    if (dataPoints.length >= 3) {
      insights.push({
        type: 'correlation',
        message: '여러 메트릭 간 상관관계 발견',
        priority: 'low',
      });
    }

    return {
      insights,
      count: insights.length,
      summary: `${dataPoints.length}개 데이터 포인트에서 ${insights.length}개 인사이트 생성`,
      reasoning: '데이터 패턴 분석 및 우선순위 분류 완료',
    };
  },
});

/**
 * POST 핸들러 - Vercel AI SDK streamText 사용
 */
export const POST = withAuth(async (req: NextRequest) => {
  try {
    const { messages } = await req.json();
    const apiKey = getGoogleAIKey();

    if (!apiKey) {
      return new Response('Google AI API Key not found', { status: 500 });
    }

    // 🚀 Vercel AI SDK streamText
    const result = streamText({
      model: google('gemini-1.5-flash'),
      messages,
      tools: {
        // 🧠 Extended Thinking Tools (5개)
        analyzeIntent,
        analyzeComplexity,
        selectRoute,
        searchContext,
        generateInsight,
        // 📊 Action Tools (4개)
        getServerMetrics,
        predictIncident,
        searchKnowledgeBase,
        analyzeServerHealth,
        analyzePattern,
        recommendCommands,
      },
      system: `당신은 **OpenManager Vibe**의 **서버 모니터링 전문 AI 어시스턴트**입니다.
당신의 핵심 임무는 **서버 데이터를 분석**하고, **장애 원인을 규명**하며, **해결책을 제시**하는 것입니다.

**🚨 핵심 원칙 (CRITICAL INSTRUCTIONS)**
1. **데이터 기반 답변 (Data-Driven)**: 절대 추측으로 답변하지 마십시오. 반드시 getServerMetrics나 analyzeServerHealth 도구로 실시간 데이터를 확인한 후 답변해야 합니다.
2. **지식 검색 우선 (RAG First)**: 장애 원인이나 해결 방법 질문 시, 반드시 searchKnowledgeBase를 먼저 실행하여 과거 사례를 참조하십시오.
3. **오프라인 도구 활용 (Hybrid Engine)**: "CPU 상태 어때?" 같은 단순 상태 확인 질문이나 명령어 요청 시, LLM 추론보다 analyzePattern이나 recommendCommands 도구를 우선적으로 사용하십시오.
4. **도구 실행 필수 (Tools Before Talk)**: 사용자 질문에 답변하기 전, 필요한 도구를 먼저 실행하여 컨텍스트를 확보해야 합니다.

**🧠 Thinking Process (사고 과정 시각화 순서)**
1. **analyzeIntent**: 질문 의도 파악
2. **analyzeComplexity**: 복잡도 분석 (Simple인 경우 오프라인 도구 우선 고려)
3. **selectRoute**: 최적의 도구 경로 선택
4. **Action Tools 실행**:
   - 단순 확인: \`analyzePattern\`, \`recommendCommands\`
   - 상태 확인: \`getServerMetrics\`, \`analyzeServerHealth\`
   - 원인 분석: \`searchKnowledgeBase\` (RAG), \`predictIncident\` (GCP)
5. **generateInsight**: 수집된 데이터 종합 분석
6. **최종 답변**: 확보된 팩트(Facts)를 기반으로 전문적인 조언 제공

**포트폴리오 시뮬레이션 컨텍스트:**
- 서버 메트릭: 24시간 시뮬레이션 데이터 사용
- 장애 예측: 실제 GCP Cloud Functions 연동
- 지식 검색: 실제 Supabase pgvector RAG 연동
- 오프라인 기능: 패턴 매칭 및 명령어 추천 내장

전문적이고 신뢰감 있는 톤으로, 개발자나 시스템 관리자에게 도움이 되는 구체적인 정보를 제공하십시오.`,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error('❌ AI 스트리밍 처리 실패:', error);
    return new Response('AI streaming failed', { status: 500 });
  }
});
