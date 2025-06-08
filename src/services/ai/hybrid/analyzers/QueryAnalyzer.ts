/**
 * 🔍 쿼리 분석기
 * 
 * Single Responsibility: 사용자 쿼리 분석과 스마트 쿼리 생성
 * Strategy Pattern: 다양한 쿼리 분석 전략 지원
 */

import { SmartQuery, QueryIntent } from '../types/HybridTypes';

export class QueryAnalyzer {
  private readonly intentKeywords = {
    analysis: [
      '분석', '통계', '리포트', '데이터', '현황', '상태', '성능', '지표',
      'analysis', 'report', 'statistics', 'data', 'metrics', 'performance'
    ],
    search: [
      '찾기', '검색', '조회', '확인', '정보', '문서', '파일',
      'search', 'find', 'lookup', 'information', 'document', 'file'
    ],
    prediction: [
      '예측', '전망', '미래', '예상', '추세', '트렌드', '예견',
      'prediction', 'forecast', 'future', 'trend', 'predict', 'expect'
    ],
    optimization: [
      '최적화', '개선', '향상', '효율', '성능', '튜닝', '조정',
      'optimization', 'improve', 'enhance', 'efficiency', 'tuning', 'optimize'
    ],
    troubleshooting: [
      '문제', '오류', '에러', '장애', '해결', '수정', '디버깅', '트러블슈팅',
      'problem', 'error', 'issue', 'bug', 'fix', 'solve', 'debug', 'troubleshoot'
    ]
  };

  private readonly koreanPattern = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/;

  /**
   * 스마트 쿼리 분석
   */
  async analyzeQuery(query: string): Promise<SmartQuery> {
    const isKorean = this.detectKorean(query);
    const keywords = this.extractKeywords(query);
    const intent = this.detectIntent(query);

    return {
      originalQuery: query,
      intent,
      keywords,
      requiredDocs: this.determineRequiredDocs(intent, keywords),
      mcpActions: this.determineMCPActions(intent, keywords),
      tensorflowModels: this.determineTensorFlowModels(intent),
      isKorean,
      useTransformers: this.shouldUseTransformers(query, intent),
      useVectorSearch: this.shouldUseVectorSearch(query, intent),
    };
  }

  /**
   * 한국어 감지
   */
  private detectKorean(text: string): boolean {
    return this.koreanPattern.test(text);
  }

  /**
   * 의도 감지
   */
  private detectIntent(query: string): QueryIntent {
    const lowerQuery = query.toLowerCase();
    const intentScores: Record<QueryIntent, number> = {
      analysis: 0,
      search: 0,
      prediction: 0,
      optimization: 0,
      troubleshooting: 0,
    };

    // 각 의도별 키워드 매칭 점수 계산
    for (const [intent, keywords] of Object.entries(this.intentKeywords)) {
      for (const keyword of keywords) {
        if (lowerQuery.includes(keyword)) {
          intentScores[intent as QueryIntent] += 1;
        }
      }
    }

    // 컨텍스트 기반 추가 점수
    if (lowerQuery.includes('서버') || lowerQuery.includes('시스템')) {
      intentScores.analysis += 0.5;
      intentScores.troubleshooting += 0.3;
    }

    if (lowerQuery.includes('모니터링') || lowerQuery.includes('monitoring')) {
      intentScores.analysis += 1;
    }

    if (lowerQuery.includes('ai') || lowerQuery.includes('인공지능')) {
      intentScores.analysis += 0.5;
      intentScores.prediction += 0.5;
    }

    // 가장 높은 점수의 의도 반환
    let maxScore = 0;
    let detectedIntent: QueryIntent = 'search'; // 기본값

    for (const [intent, score] of Object.entries(intentScores)) {
      if (score > maxScore) {
        maxScore = score;
        detectedIntent = intent as QueryIntent;
      }
    }

    return detectedIntent;
  }

  /**
   * 키워드 추출
   */
  private extractKeywords(text: string): string[] {
    return text
      .toLowerCase()
      .split(/[\s\n\r\t,.!?;:()\[\]{}]+/)
      .filter(word => word.length > 2 && !this.isCommonWord(word))
      .slice(0, 10); // 상위 10개 키워드만
  }

  /**
   * 일반적인 단어 확인
   */
  private isCommonWord(word: string): boolean {
    const commonWords = [
      // 영어 일반 단어
      'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
      'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had',
      'do', 'does', 'did', 'will', 'would', 'should', 'could', 'can', 'may', 'might', 'must',
      'this', 'that', 'these', 'those', 'what', 'when', 'where', 'why', 'how',
      // 한국어 일반 단어
      '그', '이', '저', '것', '수', '있', '없', '등', '또', '및', '의', '을', '를', 
      '에', '로', '와', '과', '는', '가', '이다', '있다', '하다', '되다', '같다'
    ];
    return commonWords.includes(word);
  }

  /**
   * 필요한 문서 결정
   */
  private determineRequiredDocs(intent: QueryIntent, keywords: string[]): string[] {
    const docs: string[] = [];

    // 의도별 기본 문서
    switch (intent) {
      case 'analysis':
        docs.push('src/modules/ai-agent/analytics/', 'src/services/monitoring/');
        break;
      case 'search':
        docs.push('docs/', 'README.md');
        break;
      case 'prediction':
        docs.push('src/services/ai/engines/', 'src/modules/ai-agent/prediction/');
        break;
      case 'optimization':
        docs.push('src/services/ai/optimization/', 'src/config/');
        break;
      case 'troubleshooting':
        docs.push('src/services/error-handling/', 'docs/troubleshooting/');
        break;
    }

    // 키워드 기반 추가 문서
    for (const keyword of keywords) {
      if (keyword.includes('mcp')) {
        docs.push('src/services/mcp/', 'docs/mcp-integration.md');
      }
      if (keyword.includes('ai') || keyword.includes('agent')) {
        docs.push('src/modules/ai-agent/');
      }
      if (keyword.includes('hybrid')) {
        docs.push('src/services/ai/hybrid/');
      }
    }

    return [...new Set(docs)]; // 중복 제거
  }

  /**
   * MCP 액션 결정
   */
  private determineMCPActions(intent: QueryIntent, keywords: string[]): string[] {
    const actions: string[] = [];

    // 의도별 기본 액션
    switch (intent) {
      case 'analysis':
        actions.push('getSystemStatus', 'getMetrics', 'getPerformanceData');
        break;
      case 'search':
        actions.push('listResources', 'searchDocuments');
        break;
      case 'prediction':
        actions.push('getHistoricalData', 'runPredictionModel');
        break;
      case 'optimization':
        actions.push('getConfiguration', 'getOptimizationSuggestions');
        break;
      case 'troubleshooting':
        actions.push('getLogs', 'getErrorReports', 'runDiagnostics');
        break;
    }

    // 키워드 기반 추가 액션
    for (const keyword of keywords) {
      if (keyword.includes('서버') || keyword.includes('server')) {
        actions.push('getServerStatus', 'getServerMetrics');
      }
      if (keyword.includes('데이터베이스') || keyword.includes('database')) {
        actions.push('getDatabaseStatus', 'getDatabaseMetrics');
      }
      if (keyword.includes('네트워크') || keyword.includes('network')) {
        actions.push('getNetworkStatus', 'getNetworkMetrics');
      }
    }

    return [...new Set(actions)]; // 중복 제거
  }

  /**
   * TensorFlow 모델 결정
   */
  private determineTensorFlowModels(intent: QueryIntent): string[] {
    const models: string[] = [];

    switch (intent) {
      case 'analysis':
        models.push('anomaly-detection', 'classification');
        break;
      case 'prediction':
        models.push('time-series', 'regression', 'forecasting');
        break;
      case 'optimization':
        models.push('reinforcement-learning', 'optimization');
        break;
      case 'troubleshooting':
        models.push('anomaly-detection', 'root-cause-analysis');
        break;
      case 'search':
        // 검색에는 특별한 모델 불필요
        break;
    }

    return models;
  }

  /**
   * Transformers 사용 여부 결정
   */
  private shouldUseTransformers(query: string, intent: QueryIntent): boolean {
    // 복잡한 자연어 처리가 필요한 경우
    const complexPatterns = [
      /어떻게.*해야.*하나/,  // "어떻게 ... 해야 하나"
      /왜.*인지.*알려줘/,    // "왜 ... 인지 알려줘"
      /.*설명.*해줘/,        // "... 설명해줘"
      /.*차이.*뭐야/,        // "... 차이가 뭐야"
    ];

    const hasComplexPattern = complexPatterns.some(pattern => pattern.test(query));
    const isLongQuery = query.length > 50;
    const needsNLU = ['analysis', 'troubleshooting'].includes(intent);

    return hasComplexPattern || isLongQuery || needsNLU;
  }

  /**
   * 벡터 검색 사용 여부 결정
   */
  private shouldUseVectorSearch(query: string, intent: QueryIntent): boolean {
    // 의미적 검색이 필요한 경우
    const semanticKeywords = [
      '유사한', '비슷한', '관련된', '연관된', '해당하는',
      'similar', 'related', 'relevant', 'corresponding'
    ];

    const hasSemanticKeyword = semanticKeywords.some(keyword => 
      query.toLowerCase().includes(keyword)
    );

    const isSearchIntent = intent === 'search';
    const isComplexQuery = query.split(' ').length > 5;

    return hasSemanticKeyword || isSearchIntent || isComplexQuery;
  }

  /**
   * 쿼리 복잡도 평가
   */
  getQueryComplexity(query: string): 'simple' | 'medium' | 'complex' {
    const wordCount = query.split(' ').length;
    const hasSpecialChars = /[?!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/]/.test(query);
    const hasNumbers = /\d/.test(query);

    if (wordCount <= 3 && !hasSpecialChars) return 'simple';
    if (wordCount <= 10 && !hasNumbers) return 'medium';
    return 'complex';
  }

  /**
   * 쿼리 카테고리 분류
   */
  categorizeQuery(query: string): {
    category: 'technical' | 'business' | 'operational' | 'general';
    confidence: number;
  } {
    const technicalTerms = ['api', 'database', 'server', 'network', 'algorithm', 'model'];
    const businessTerms = ['revenue', 'profit', 'customer', 'market', 'strategy'];
    const operationalTerms = ['monitoring', 'deployment', 'maintenance', 'backup'];

    const lowerQuery = query.toLowerCase();
    
    let techScore = 0;
    let businessScore = 0;
    let operationalScore = 0;

    technicalTerms.forEach(term => {
      if (lowerQuery.includes(term)) techScore++;
    });

    businessTerms.forEach(term => {
      if (lowerQuery.includes(term)) businessScore++;
    });

    operationalTerms.forEach(term => {
      if (lowerQuery.includes(term)) operationalScore++;
    });

    const maxScore = Math.max(techScore, businessScore, operationalScore);
    
    if (maxScore === 0) {
      return { category: 'general', confidence: 0.5 };
    }

    if (techScore === maxScore) {
      return { category: 'technical', confidence: techScore / technicalTerms.length };
    }
    
    if (businessScore === maxScore) {
      return { category: 'business', confidence: businessScore / businessTerms.length };
    }
    
    return { category: 'operational', confidence: operationalScore / operationalTerms.length };
  }

  /**
   * 쿼리 전처리
   */
  preprocessQuery(query: string): string {
    return query
      .trim()
      .replace(/\s+/g, ' ') // 연속된 공백 제거
      .replace(/[^\w\s가-힣]/g, '') // 특수문자 제거 (한글 유지)
      .toLowerCase();
  }

  /**
   * 쿼리 확장 (동의어, 관련어 추가)
   */
  expandQuery(query: string): string[] {
    const synonyms: Record<string, string[]> = {
      '서버': ['server', '시스템', 'system'],
      '데이터베이스': ['database', 'db', '디비'],
      '모니터링': ['monitoring', '감시', '추적'],
      '에러': ['error', '오류', '문제', 'issue'],
      '성능': ['performance', '속도', 'speed'],
    };

    const expandedQueries = [query];
    const words = query.split(' ');

    words.forEach(word => {
      if (synonyms[word]) {
        synonyms[word].forEach(synonym => {
          const expandedQuery = query.replace(word, synonym);
          expandedQueries.push(expandedQuery);
        });
      }
    });

    return [...new Set(expandedQueries)]; // 중복 제거
  }
} 