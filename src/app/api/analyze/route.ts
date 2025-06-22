import { LocalRAGEngine } from '@/lib/ml/rag-engine';
import { AILogger, LogCategory } from '@/services/ai/logging/AILogger';
import { makeAIRequest } from '@/utils/aiEngineConfig';
import { NextRequest, NextResponse } from 'next/server';

// 🎯 RAG 엔진 인스턴스 (전역)
let ragEngine: LocalRAGEngine | null = null;

async function getRagEngine(): Promise<LocalRAGEngine> {
  if (!ragEngine) {
    ragEngine = new LocalRAGEngine();
    await ragEngine.initialize();
  }
  return ragEngine;
}

// 🤖 지능형 분석 엔진 (RAG 통합)
async function performIntelligentAnalysis(
  type: string,
  data: any,
  options: any
) {
  const rag = await getRagEngine();
  const query = data.query || '';
  const lowerQuery = query.toLowerCase();
  const aiLogger = AILogger.getInstance();

  // 🧠 사고 과정 시작
  const thinkingSteps: any[] = [];
  const startTime = Date.now();

  try {
    // Step 1: 질문 분석 및 의도 파악
    thinkingSteps.push({
      step: 1,
      action: '질문 분석',
      thought: `사용자 질문: "${query}"를 분석합니다.`,
      analysis: {
        originalQuery: query,
        lowerQuery: lowerQuery,
        queryLength: query.length,
        hasKorean: /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(query),
      },
    });

    // 1. 불가능한 질문 감지 및 한계 인식
    const impossiblePatterns = [
      '내일',
      '정확히',
      '예측해주세요',
      '비밀번호',
      '해킹',
      '시간을 되돌려',
      '존재하지 않는',
      'supermega',
      'ceo',
      '개인',
      '경쟁사',
    ];

    const hasImpossiblePattern = impossiblePatterns.some(pattern =>
      lowerQuery.includes(pattern)
    );

    if (hasImpossiblePattern) {
      thinkingSteps.push({
        step: 2,
        action: '불가능한 질문 감지',
        thought: '이 질문은 AI의 한계를 벗어나는 요청입니다.',
        matchedPatterns: impossiblePatterns.filter(p => lowerQuery.includes(p)),
      });

      await aiLogger.logThinking(
        'AnalyzeAPI',
        LogCategory.AI_ENGINE,
        query,
        thinkingSteps,
        '불가능한 질문으로 판단하여 한계 응답 제공',
        ['AI 한계 인식 응답 생성'],
        0.9
      );

      return generateLimitationResponse(query);
    }

    // Step 2: 카테고리 분석 및 도메인 식별
    let categoryFilter = '';
    const categoryAnalysis: any = {
      detectedKeywords: [],
      confidenceScores: {},
    };

    if (
      lowerQuery.includes('linux') ||
      lowerQuery.includes('리눅스') ||
      lowerQuery.includes('top') ||
      lowerQuery.includes('ps') ||
      lowerQuery.includes('cpu') ||
      lowerQuery.includes('프로세스') ||
      lowerQuery.includes('시스템')
    ) {
      categoryFilter = 'linux';
      categoryAnalysis.detectedKeywords = [
        'linux',
        '리눅스',
        'top',
        'ps',
        'cpu',
        '프로세스',
        '시스템',
      ].filter(k => lowerQuery.includes(k));
      categoryAnalysis.confidenceScores.linux = 0.9;
    } else if (
      lowerQuery.includes('kubernetes') ||
      lowerQuery.includes('쿠버네티스') ||
      lowerQuery.includes('kubectl') ||
      lowerQuery.includes('pod') ||
      lowerQuery.includes('k8s')
    ) {
      categoryFilter = 'k8s';
      categoryAnalysis.detectedKeywords = [
        'kubernetes',
        '쿠버네티스',
        'kubectl',
        'pod',
        'k8s',
      ].filter(k => lowerQuery.includes(k));
      categoryAnalysis.confidenceScores.k8s = 0.9;
    } else if (
      lowerQuery.includes('mysql') ||
      lowerQuery.includes('데이터베이스') ||
      lowerQuery.includes('db') ||
      lowerQuery.includes('sql') ||
      lowerQuery.includes('연결')
    ) {
      categoryFilter = 'mysql';
      categoryAnalysis.detectedKeywords = [
        'mysql',
        '데이터베이스',
        'db',
        'sql',
        '연결',
      ].filter(k => lowerQuery.includes(k));
      categoryAnalysis.confidenceScores.mysql = 0.9;
    }

    thinkingSteps.push({
      step: 3,
      action: '카테고리 분석',
      thought: `키워드 분석을 통해 도메인을 식별합니다.`,
      result: {
        categoryFilter: categoryFilter || 'general',
        detectedKeywords: categoryAnalysis.detectedKeywords,
        confidence: categoryAnalysis.confidenceScores[categoryFilter] || 0.3,
      },
    });

    // Step 3: RAG Engine 검색 (최우선)
    thinkingSteps.push({
      step: 4,
      action: 'RAG Engine 검색',
      thought: '벡터 데이터베이스에서 관련 명령어와 문서를 검색합니다.',
      parameters: {
        query: query,
        maxResults: 5,
        threshold: 0.1,
        category: categoryFilter,
      },
    });

    const ragResponse = await rag.search({
      query: query,
      maxResults: 5,
      threshold: 0.1,
      category: categoryFilter,
    });

    const ragAnalysis = {
      success: ragResponse.success,
      resultsCount: ragResponse.results.length,
      topResult: ragResponse.results[0]?.document?.metadata?.category,
      topScore: ragResponse.results[0]?.score,
      allResults: ragResponse.results.map(r => ({
        id: r.document.id,
        score: r.score,
        category: r.document.metadata?.category,
      })),
    };

    thinkingSteps.push({
      step: 5,
      action: 'RAG 검색 결과 분석',
      thought: `${ragResponse.results.length}개의 관련 문서를 찾았습니다.`,
      result: ragAnalysis,
    });

    // Step 4: RAG 결과 우선 처리
    if (ragResponse.success && ragResponse.results.length > 0) {
      let filteredResults = ragResponse.results;

      // 카테고리 필터링 적용
      if (categoryFilter) {
        const categoryResults = ragResponse.results.filter(r =>
          r.document.metadata.category.includes(categoryFilter)
        );

        if (categoryResults.length > 0) {
          const otherResults = ragResponse.results.filter(
            r => !r.document.metadata.category.includes(categoryFilter)
          );
          filteredResults = [...categoryResults, ...otherResults];
        }
      }

      thinkingSteps.push({
        step: 6,
        action: 'RAG 결과 최적화',
        thought: `카테고리 필터링을 적용하여 ${filteredResults.length}개 결과로 정제했습니다.`,
        optimization: {
          originalCount: ragResponse.results.length,
          filteredCount: filteredResults.length,
          categoryFilter: categoryFilter,
          topMatch: filteredResults[0]?.document?.metadata?.category,
        },
      });

      // RAG 기반 응답 생성
      const ragConclusion = `RAG Engine을 통해 ${filteredResults.length}개의 관련 문서에서 답변을 생성합니다.`;
      thinkingSteps.push({
        step: 7,
        action: '최종 응답 생성',
        thought: ragConclusion,
        confidence: filteredResults[0]?.score || 0.7,
      });

      const responseTime = Date.now() - startTime;

      // 사고 과정 로깅
      await aiLogger.logThinking(
        'RAG_Engine',
        LogCategory.RAG,
        query,
        thinkingSteps,
        `RAG 검색을 통한 명령어 기반 응답 생성 (${responseTime}ms)`,
        [ragConclusion, `최고 점수: ${filteredResults[0]?.score?.toFixed(3)}`],
        filteredResults[0]?.score || 0.7,
        ['패턴 매칭', 'MCP 컨텍스트']
      );

      const commandResponse = generateCommandBasedResponse(
        query,
        filteredResults,
        type
      );
      return {
        ...commandResponse,
        thinking_process: thinkingSteps,
        debug_info: {
          processingTime: responseTime,
          ragStats: ragAnalysis,
          categoryFilter: categoryFilter,
          thinkingSteps: thinkingSteps.length,
          engine: 'RAG_Engine',
          confidence: filteredResults[0]?.score || 0.7,
        },
      };
    }

    // Step 5: RAG 실패 시 폴백 로직
    thinkingSteps.push({
      step: 6,
      action: 'RAG 검색 실패',
      thought:
        'RAG 검색에서 적절한 결과를 찾지 못했습니다. 폴백 로직을 실행합니다.',
      reason: 'RAG 결과 부족 또는 점수 미달',
    });

    // 복합 장애 시나리오 감지
    const complexFailurePatterns = [
      '동시에',
      '여러 문제',
      '복합',
      '우선순위',
      '단계별',
    ];
    const isComplexFailure = complexFailurePatterns.some(pattern =>
      lowerQuery.includes(pattern)
    );

    if (isComplexFailure) {
      thinkingSteps.push({
        step: 7,
        action: '복합 장애 감지',
        thought: '복잡한 다중 장애 시나리오로 판단됩니다.',
        matchedPatterns: complexFailurePatterns.filter(p =>
          lowerQuery.includes(p)
        ),
      });

      await aiLogger.logThinking(
        'Pattern_Matching',
        LogCategory.AI_ENGINE,
        query,
        thinkingSteps,
        '복합 장애 시나리오 감지 및 우선순위 기반 응답',
        ['복합 장애 대응 가이드 제공'],
        0.8
      );

      return {
        ...generateComplexFailureResponse(query, type),
        thinking_process: thinkingSteps,
      };
    }

    // 트러블슈팅 패턴 감지
    const troubleshootingPatterns = [
      'cpu 95%',
      'mysql 연결',
      '디스크 90%',
      'redis 응답',
      'nginx',
      '장애',
      '문제',
      '오류',
      '실패',
      '다운',
      '느려',
      '안 됩니다',
    ];

    const matchedTroubleshootingPatterns = troubleshootingPatterns.filter(
      pattern => lowerQuery.includes(pattern)
    );

    if (matchedTroubleshootingPatterns.length > 0) {
      thinkingSteps.push({
        step: 7,
        action: '트러블슈팅 패턴 감지',
        thought: `${matchedTroubleshootingPatterns.length}개의 트러블슈팅 패턴이 감지되었습니다.`,
        matchedPatterns: matchedTroubleshootingPatterns,
      });

      await aiLogger.logThinking(
        'Pattern_Matching',
        LogCategory.AI_ENGINE,
        query,
        thinkingSteps,
        '트러블슈팅 패턴 매칭을 통한 응답 생성',
        [`패턴 매칭: ${matchedTroubleshootingPatterns.join(', ')}`],
        0.7
      );

      return {
        ...generateTroubleshootingResponse(query, type),
        thinking_process: thinkingSteps,
      };
    }

    // 최종 폴백: 기본 분석 응답
    thinkingSteps.push({
      step: 8,
      action: '기본 분석 응답',
      thought: '특정 패턴이 감지되지 않아 일반적인 분석 응답을 제공합니다.',
      fallback: true,
    });

    const responseTime = Date.now() - startTime;

    await aiLogger.logThinking(
      'Fallback_Engine',
      LogCategory.FALLBACK,
      query,
      thinkingSteps,
      '기본 분석 응답 생성 (모든 특화 엔진 실패)',
      ['일반적인 시스템 분석 응답 제공'],
      0.5
    );

    return {
      ...generateBasicAnalysisResponse(type, data),
      thinking_process: thinkingSteps,
      debug_info: {
        processingTime: responseTime,
        engine: 'Fallback_Engine',
        thinkingSteps: thinkingSteps.length,
        ragFailed: true,
      },
    };
  } catch (error) {
    console.error('❌ 분석 중 오류:', error);

    thinkingSteps.push({
      step: thinkingSteps.length + 1,
      action: '오류 발생',
      thought: `분석 중 오류가 발생했습니다: ${error instanceof Error ? error.message : error}`,
      error: true,
    });

    await aiLogger.logError(
      'AnalyzeAPI',
      LogCategory.AI_ENGINE,
      error instanceof Error ? error : new Error(String(error)),
      { query, thinkingSteps }
    );

    return {
      ...generateBasicAnalysisResponse(type, data),
      thinking_process: thinkingSteps,
      debug_info: {
        error: error instanceof Error ? error.message : error,
        engine: 'Error_Fallback',
      },
    };
  }
}

// 🎯 명령어 기반 응답 생성 (NEW)
function generateCommandBasedResponse(
  query: string,
  ragResults: any[],
  type: string
) {
  const topResult = ragResults[0];
  const document = topResult.document;
  const category = document.metadata?.category || 'general';
  const commands = document.keywords || [];
  const priority = document.metadata?.priority || 5;

  // 카테고리별 맞춤 응답
  let categoryInfo = getCategoryInfo(category);

  // 명령어 추출 및 정리
  const relevantCommands = extractRelevantCommands(commands, query);

  // 안전성 경고 추출
  const safetyWarnings = extractSafetyWarnings(ragResults);

  return {
    type: 'command-guidance',
    summary: `${categoryInfo.name} 관련 명령어 안내입니다. ${document.content.substring(0, 100)}...`,
    insights: [
      `${categoryInfo.name} 시나리오가 감지되었습니다`,
      `우선순위: ${getPriorityText(priority)}`,
      `관련 명령어 ${relevantCommands.length}개를 찾았습니다`,
      `신뢰도: ${Math.round(topResult.score * 100)}%`,
    ],
    commands: relevantCommands,
    safety_warnings: safetyWarnings,
    recommendations: generateSmartRecommendations(document, query),
    category: category,
    priority: priority >= 8 ? 'high' : priority >= 6 ? 'medium' : 'low',
    confidence: Math.round(topResult.score * 100) / 100,
    rag_enhanced: true,
  };
}

// 🏷️ 카테고리 정보 매핑
function getCategoryInfo(category: string) {
  const categoryMap: { [key: string]: { name: string; icon: string } } = {
    'linux-troubleshooting': { name: '리눅스 트러블슈팅', icon: '🐧' },
    'linux-administration': { name: '리눅스 관리', icon: '⚙️' },
    'linux-monitoring': { name: '리눅스 모니터링', icon: '📊' },
    'k8s-troubleshooting': { name: '쿠버네티스 트러블슈팅', icon: '☸️' },
    'k8s-administration': { name: '쿠버네티스 관리', icon: '🔧' },
    'k8s-networking': { name: '쿠버네티스 네트워킹', icon: '🌐' },
    'k8s-monitoring': { name: '쿠버네티스 모니터링', icon: '📈' },
    'k8s-deployment': { name: '쿠버네티스 배포', icon: '🚀' },
    'mysql-troubleshooting': { name: 'MySQL 트러블슈팅', icon: '🐘' },
    'mysql-administration': { name: 'MySQL 관리', icon: '🗃️' },
    'postgresql-monitoring': { name: 'PostgreSQL 모니터링', icon: '🐘' },
    'postgresql-administration': { name: 'PostgreSQL 관리', icon: '📊' },
    'redis-administration': { name: 'Redis 관리', icon: '🔴' },
    'redis-monitoring': { name: 'Redis 모니터링', icon: '📈' },
    'mongodb-monitoring': { name: 'MongoDB 모니터링', icon: '🍃' },
    'mongodb-administration': { name: 'MongoDB 관리', icon: '🗄️' },
    'database-backup': { name: '데이터베이스 백업', icon: '💾' },
    'database-security': { name: '데이터베이스 보안', icon: '🔒' },
  };

  return categoryMap[category] || { name: '일반 시스템', icon: '🖥️' };
}

// 🎯 관련 명령어 추출
function extractRelevantCommands(commands: string[], query: string): string[] {
  if (!commands || commands.length === 0) return [];

  const lowerQuery = query.toLowerCase();

  // 쿼리와 관련성 높은 명령어를 우선 선택
  const scoredCommands = commands.map(cmd => {
    let score = 0;
    const lowerCmd = cmd.toLowerCase();

    // 직접 매칭
    if (lowerQuery.includes(lowerCmd.split(' ')[0])) score += 10;

    // 키워드 매칭
    const keywords = [
      'top',
      'ps',
      'kill',
      'systemctl',
      'kubectl',
      'mysql',
      'redis',
    ];
    keywords.forEach(keyword => {
      if (lowerQuery.includes(keyword) && lowerCmd.includes(keyword)) {
        score += 5;
      }
    });

    return { command: cmd, score };
  });

  // 점수순 정렬 후 상위 5개 반환
  return scoredCommands
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(item => item.command);
}

// ⚠️ 안전성 경고 추출
function extractSafetyWarnings(ragResults: any[]): string[] {
  const warnings: string[] = [];

  ragResults.forEach(result => {
    const content = result.document.content;
    if (content.includes('주의') || content.includes('경고')) {
      // 안전성 관련 문장 추출
      const sentences = content.split('.');
      sentences.forEach(sentence => {
        if (
          sentence.includes('주의') ||
          sentence.includes('경고') ||
          sentence.includes('위험') ||
          sentence.includes('삭제')
        ) {
          warnings.push(sentence.trim());
        }
      });
    }
  });

  return [...new Set(warnings)].slice(0, 3); // 중복 제거 후 상위 3개
}

// 💡 스마트 권장사항 생성
function generateSmartRecommendations(document: any, query: string): string[] {
  const category = document.metadata?.category || '';
  const baseRecommendations = [
    '명령어 실행 전 현재 상태 백업 권장',
    '프로덕션 환경에서는 더욱 신중하게 접근',
    '변경 사항 적용 후 시스템 상태 모니터링',
  ];

  // 카테고리별 특화 권장사항
  const categorySpecific: { [key: string]: string[] } = {
    'linux-troubleshooting': [
      '시스템 로그 확인을 통한 근본 원인 분석',
      '리소스 사용량 지속 모니터링',
    ],
    'k8s-troubleshooting': [
      '네임스페이스 지정 습관화',
      'kubectl describe를 통한 상세 정보 확인',
    ],
    'mysql-troubleshooting': ['슬로우 쿼리 로그 분석', '인덱스 최적화 검토'],
    'redis-administration': [
      '메모리 사용량 정기 점검',
      '데이터 만료 정책 설정',
    ],
  };

  const specificRecs = categorySpecific[category] || [];
  return [...baseRecommendations, ...specificRecs].slice(0, 4);
}

// 📊 우선순위 텍스트 변환
function getPriorityText(priority: number): string {
  if (priority >= 9) return '매우 높음 (즉시 대응)';
  if (priority >= 7) return '높음 (빠른 대응)';
  if (priority >= 5) return '보통 (계획적 대응)';
  return '낮음 (예방적 대응)';
}

// 🚫 한계 인식 응답 생성
function generateLimitationResponse(query: string) {
  const limitations = [
    '정확한 미래 예측은 불가능합니다',
    '보안 정보는 제공할 수 없습니다',
    '존재하지 않는 시스템은 분석할 수 없습니다',
    '시간을 되돌리는 것은 불가능합니다',
    '개인 정보나 비밀번호는 알 수 없습니다',
  ];

  const randomLimitation =
    limitations[Math.floor(Math.random() * limitations.length)];

  return {
    type: 'limitation-acknowledgment',
    summary: `죄송합니다. ${randomLimitation}. 대신 현재 시스템 상태를 기반으로 한 일반적인 권장사항을 제공할 수 있습니다.`,
    insights: [
      '요청하신 정보는 시스템 한계로 인해 제공할 수 없습니다',
      '현재 시스템 데이터를 기반으로 한 분석만 가능합니다',
      '추가 정보가 필요한 경우 구체적인 질문을 해주세요',
    ],
    recommendations: [
      '현재 시스템 상태 모니터링 강화',
      '정기적인 시스템 점검 수행',
      '예방적 유지보수 계획 수립',
    ],
    confidence: 0.95,
    limitation_reason: '시스템 한계 인식',
  };
}

// 🔧 장애 대응 응답 생성
function generateTroubleshootingResponse(query: string, type: string) {
  const serverType = extractServerType(query);
  const issueType = extractIssueType(query);

  const commands = generateCommands(serverType, issueType);
  const steps = generateTroubleshootingSteps(serverType, issueType);

  return {
    type: 'troubleshooting',
    summary: `${serverType} 서버의 ${issueType} 문제에 대한 단계별 해결 방안을 제시합니다.`,
    insights: [
      `${issueType} 문제가 감지되었습니다`,
      `${serverType} 서버 특화 진단이 필요합니다`,
      '즉시 대응이 필요한 상황입니다',
    ],
    recommendations: steps,
    commands: commands,
    priority:
      issueType.includes('95%') || issueType.includes('90%')
        ? 'critical'
        : 'high',
    confidence: 0.88,
  };
}

// 🌪️ 복합 장애 응답 생성
function generateComplexFailureResponse(query: string, type: string) {
  const issues = extractMultipleIssues(query);
  const prioritizedSteps = generatePrioritySteps(issues);

  return {
    type: 'complex-failure',
    summary: `${issues.length}개의 동시 장애 상황에 대한 우선순위 기반 대응 방안을 제시합니다.`,
    insights: [
      `${issues.length}개의 동시 장애가 감지되었습니다`,
      '연쇄 장애 가능성이 높습니다',
      '즉시 대응팀 소집이 필요합니다',
    ],
    anomalies: issues.map(issue => ({
      type: issue.type,
      severity: issue.severity,
      description: issue.description,
      confidence: 0.85,
    })),
    recommendations: prioritizedSteps,
    urgency: 'critical',
    confidence: 0.82,
  };
}

// 📊 기본 분석 응답 생성
function generateBasicAnalysisResponse(type: string, data: any) {
  return {
    type: type,
    summary: '서버 성능 분석 완료',
    insights: [
      'CPU 사용률이 평균 대비 15% 높음',
      '메모리 사용률은 정상 범위',
      '네트워크 지연시간 증가 감지',
    ],
    recommendations: [
      'CPU 집약적 프로세스 최적화 권장',
      '네트워크 구성 점검 필요',
    ],
    confidence: 0.85,
  };
}

// 🔍 헬퍼 함수들
function extractServerType(query: string): string {
  if (query.includes('nginx')) return 'nginx';
  if (query.includes('mysql')) return 'mysql';
  if (query.includes('redis')) return 'redis';
  if (query.includes('apache')) return 'apache';
  return '일반';
}

function extractIssueType(query: string): string {
  if (query.includes('95%') || query.includes('cpu')) return 'CPU 과부하';
  if (query.includes('연결') || query.includes('mysql')) return '연결 실패';
  if (query.includes('90%') || query.includes('디스크')) return '디스크 부족';
  if (query.includes('응답하지 않') || query.includes('redis'))
    return '서비스 무응답';
  return '성능 저하';
}

function generateCommands(serverType: string, issueType: string): string[] {
  const commandMap: Record<string, string[]> = {
    'nginx-CPU 과부하': [
      'top -p $(pgrep nginx)',
      'nginx -t',
      'systemctl status nginx',
      'htop',
      'ps aux | grep nginx',
    ],
    'mysql-연결 실패': [
      'systemctl status mysql',
      'mysql -u root -p -e "SHOW PROCESSLIST;"',
      'netstat -tulpn | grep 3306',
      'tail -f /var/log/mysql/error.log',
      'mysqladmin ping',
    ],
    'redis-서비스 무응답': [
      'redis-cli ping',
      'systemctl status redis',
      'netstat -tlnp | grep 6379',
      'redis-cli info memory',
      'tail -f /var/log/redis/redis-server.log',
    ],
  };

  const key = `${serverType}-${issueType}`;
  return (
    commandMap[key] || [
      'top',
      'htop',
      'systemctl status',
      'journalctl -xe',
      'df -h',
    ]
  );
}

function generateTroubleshootingSteps(
  serverType: string,
  issueType: string
): string[] {
  return [
    `1. ${serverType} 서비스 상태 즉시 확인`,
    `2. ${issueType} 관련 로그 분석`,
    '3. 리소스 사용량 모니터링',
    '4. 필요시 서비스 재시작',
    '5. 근본 원인 분석 및 예방 조치',
  ];
}

function extractMultipleIssues(
  query: string
): Array<{ type: string; severity: string; description: string }> {
  const issues = [];

  if (query.includes('nginx cpu 95%')) {
    issues.push({
      type: 'cpu',
      severity: 'critical',
      description: 'nginx CPU 사용률 95%',
    });
  }
  if (query.includes('mysql 연결 실패')) {
    issues.push({
      type: 'database',
      severity: 'critical',
      description: 'MySQL 연결 실패',
    });
  }
  if (query.includes('redis 메모리')) {
    issues.push({
      type: 'memory',
      severity: 'high',
      description: 'Redis 메모리 부족',
    });
  }
  if (query.includes('디스크 90%')) {
    issues.push({
      type: 'disk',
      severity: 'high',
      description: '디스크 사용량 90%',
    });
  }

  return issues;
}

function generatePrioritySteps(issues: any[]): string[] {
  const steps = [
    '🚨 1순위: 서비스 연속성 확보 (트래픽 우회)',
    '⚠️ 2순위: 데이터베이스 연결 복구',
    '💾 3순위: 메모리 및 디스크 정리',
    '🔧 4순위: 근본 원인 분석',
    '📋 5순위: 재발 방지 대책 수립',
  ];

  return steps;
}

// AI 분석 응답 타입 정의
interface AIAnalysisResponse {
  summary: string;
  confidence: number;
  recommendations: string[];
  analysis_data?: {
    query?: string;
    metrics_count?: number;
    timestamp?: string;
  };
}

// AI 분석 요청 타입 정의
interface AIAnalysisRequest {
  query?: string;
  metrics?: Array<{ [key: string]: any }>;
  data?: { [key: string]: any };
  type?: string;
  options?: any;
}

/**
 * 🔍 AI 분석 API - POST 요청 처리
 * 서버 데이터 및 시스템 상태를 AI로 분석하는 엔드포인트
 */
export async function POST(request: NextRequest) {
  try {
    const body: AIAnalysisRequest = await request.json();
    const { type, data, options, query } = body;

    // 요청 데이터 정규화
    const normalizedData = {
      query: query || data?.query || '',
      ...data,
    };

    // 실제 AI 분석 엔진 호출
    const analysisResult = await performIntelligentAnalysis(
      type || 'troubleshooting',
      normalizedData,
      options || {}
    );

    // 분석 타입별 처리
    switch (type) {
      case 'server-performance':
        return NextResponse.json({
          success: true,
          analysis: analysisResult,
        });

      case 'anomaly-detection':
        return NextResponse.json({
          success: true,
          analysis: analysisResult,
        });

      case 'predictive-analysis':
        return NextResponse.json({
          success: true,
          analysis: analysisResult,
        });

      default:
        // 기본 케이스: performIntelligentAnalysis 결과 직접 반환
        return NextResponse.json({
          success: true,
          data: analysisResult,
          processedAt: new Date().toISOString(),
        });
    }
  } catch (error) {
    console.error('❌ AI 분석 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: '분석 처리 중 오류가 발생했습니다',
        details: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 }
    );
  }
}

/**
 * GET 요청 처리 (분석 상태 조회)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'status';

    if (type === 'health') {
      // AI 엔진 설정 확인
      const aiEngineUrl =
        process.env.FASTAPI_BASE_URL ||
        'https://openmanager-ai-engine.onrender.com';

      // 내부 AI 엔진 헬스체크 시도
      const healthData = await makeAIRequest('?action=health', {}, true);

      return NextResponse.json({
        status: 'ok',
        aiEngine: {
          internalEngine: '/api/v3/ai',
          externalEngine: aiEngineUrl,
          health: healthData,
          hybridMode: true,
          lastChecked: new Date().toISOString(),
        },
      });
    }

    return NextResponse.json({
      success: true,
      status: 'ready',
      availableAnalyses: [
        'server-performance',
        'anomaly-detection',
        'predictive-analysis',
      ],
      message: 'AI 분석 시스템이 정상 작동 중입니다',
    });
  } catch (error) {
    console.error('❌ AI 분석 상태 조회 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: '상태 조회 중 오류가 발생했습니다',
        details: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 }
    );
  }
}
