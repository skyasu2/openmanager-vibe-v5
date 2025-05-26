import { SystemHealthChecker, StatisticalAnalysis, AnomalyDetection } from '@/services/SystemHealthChecker';
import { hybridMetricsBridge, TimeSeriesPoint } from '@/services/metrics/HybridMetricsBridge';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

/**
 * 패턴 매칭 결과 인터페이스
 */
export interface PatternMatchResult {
  confidenceScore: number; // 0-1 사이의 신뢰도 점수
  matchedPatterns: string[]; // 매칭된 패턴 키들
  sourceContext: 'basic' | 'advanced' | 'custom'; // 문서 출처
  dynamicMetrics?: {
    cpu?: number;
    memory?: number;
    disk?: number;
    network_in?: number;
    network_out?: number;
    responseTime?: number;
  };
  response: string; // 최종 응답 메시지
  fallbackLevel: number; // 1=primary, 2=secondary, 3=fallback
  metaData: {
    queryAnalysis: {
      keywords: string[];
      intent: string;
      complexity: 'simple' | 'moderate' | 'complex';
    };
    responseGeneration: {
      templateUsed: string;
      contextDocuments: string[];
      healthDataIntegrated: boolean;
    };
  };
}

/**
 * 패턴 정의 인터페이스
 */
interface PatternDefinition {
  id: string;
  keywords: string[];
  synonyms: string[];
  category: 'cpu' | 'memory' | 'disk' | 'network' | 'general' | 'composite';
  priority: number; // 1=highest, 5=lowest
  responseTemplates: {
    primary: string;
    secondary: string;
    fallback: string;
  };
  thresholds: {
    normal: { min: number; max: number };
    warning: { min: number; max: number };
    critical: { min: number; max: number };
  };
  relatedMetrics: string[];
}

/**
 * 고도화된 패턴 매칭 엔진
 * 
 * 🧠 주요 기능:
 * - 다양한 질문 패턴에 대한 유연한 매칭
 * - 여러 키워드 조합 처리
 * - 신뢰도 기반 fallback 응답 시스템
 * - 실시간 서버 상태 데이터 연계
 * - 컨텍스트 문서 계층화 관리
 */
export class PredictivePatternMatcher {
  private static instance: PredictivePatternMatcher;
  private healthChecker: SystemHealthChecker;
  private patterns: Map<string, PatternDefinition> = new Map();
  private contextDocuments: Map<string, string> = new Map();
  private lastAnalysis?: StatisticalAnalysis;
  private lastAnomalies?: AnomalyDetection[];

  private constructor() {
    this.healthChecker = SystemHealthChecker.getInstance();
    this.initializePatterns();
    this.loadContextDocuments();
  }

  public static getInstance(): PredictivePatternMatcher {
    if (!this.instance) {
      this.instance = new PredictivePatternMatcher();
    }
    return this.instance;
  }

  /**
   * 🎯 메인 패턴 매칭 및 응답 생성
   */
  async analyzeQuery(query: string): Promise<PatternMatchResult> {
    console.log(`🧠 Analyzing query: "${query}"`);

    // 1. 최신 시스템 상태 데이터 획득
    await this.refreshSystemHealth();

    // 2. 쿼리 분석 및 키워드 추출
    const queryAnalysis = this.analyzeQueryKeywords(query);
    
    // 3. 패턴 매칭 수행 (신뢰도 순으로 정렬)
    const matchedPatterns = this.findMatchingPatterns(queryAnalysis.keywords);

    // 4. 신뢰도 기반 응답 생성
    const result = await this.generateResponse(matchedPatterns, queryAnalysis, query);

    console.log(`✅ Pattern matching complete: confidence=${result.confidenceScore.toFixed(2)}, patterns=[${result.matchedPatterns.join(', ')}]`);
    
    return result;
  }

  /**
   * 🔍 쿼리 키워드 분석
   */
  private analyzeQueryKeywords(query: string): {
    keywords: string[];
    intent: string;
    complexity: 'simple' | 'moderate' | 'complex';
  } {
    const normalizedQuery = query.toLowerCase().trim();
    const keywords: string[] = [];
    
    // 키워드 추출 (한국어/영어 혼합 지원)
    const keywordPatterns = [
      // CPU 관련
      { pattern: /cpu|씨피유|프로세서|연산/, keyword: 'cpu' },
      { pattern: /메모리|memory|ram|램/, keyword: 'memory' },
      { pattern: /디스크|disk|하드|저장|용량|스토리지/, keyword: 'disk' },
      { pattern: /네트워크|network|인터넷|통신|연결/, keyword: 'network' },
      
      // 상태 관련
      { pattern: /높음|높아|과부하|부족|꽉|문제|느림|지연/, keyword: 'issue' },
      { pattern: /동시에|같이|모두|전체|복합/, keyword: 'composite' },
      { pattern: /사용률|사용량|부하|로드/, keyword: 'usage' },
      
      // 액션 관련
      { pattern: /해결|조치|복구|수정|개선/, keyword: 'action' },
      { pattern: /상태|현황|점검|확인/, keyword: 'status' }
    ];

    keywordPatterns.forEach(({ pattern, keyword }) => {
      if (pattern.test(normalizedQuery)) {
        keywords.push(keyword);
      }
    });

    // 의도 파악
    let intent = 'inquiry';
    if (keywords.includes('action')) intent = 'troubleshooting';
    if (keywords.includes('status')) intent = 'status_check';
    if (keywords.includes('composite')) intent = 'complex_analysis';

    // 복잡도 평가
    let complexity: 'simple' | 'moderate' | 'complex' = 'simple';
    if (keywords.length > 3) complexity = 'moderate';
    if (keywords.includes('composite') || keywords.length > 5) complexity = 'complex';

    return { keywords, intent, complexity };
  }

  /**
   * 🎯 패턴 매칭 수행
   */
  private findMatchingPatterns(keywords: string[]): Array<{
    pattern: PatternDefinition;
    score: number;
    matchedKeywords: string[];
  }> {
    const matches: Array<{
      pattern: PatternDefinition;
      score: number;
      matchedKeywords: string[];
    }> = [];

    this.patterns.forEach((pattern) => {
      const matchedKeywords: string[] = [];
      let score = 0;

      // 키워드 매칭 점수 계산
      keywords.forEach(keyword => {
        if (pattern.keywords.includes(keyword)) {
          matchedKeywords.push(keyword);
          score += 1.0; // 정확한 키워드 매칭
        } else {
          // 동의어 매칭 확인
          const synonymMatch = pattern.synonyms.some(synonym => 
            synonym.includes(keyword) || keyword.includes(synonym)
          );
          if (synonymMatch) {
            matchedKeywords.push(keyword);
            score += 0.7; // 동의어 매칭은 낮은 점수
          }
        }
      });

      // 패턴 우선순위 반영
      score = score * (6 - pattern.priority) / 5;

      if (score > 0) {
        matches.push({ pattern, score, matchedKeywords });
      }
    });

    // 점수 순으로 정렬
    return matches.sort((a, b) => b.score - a.score);
  }

  /**
   * 📝 응답 생성 (fallback 단계 지원)
   */
  private async generateResponse(
    matchedPatterns: Array<{
      pattern: PatternDefinition;
      score: number;
      matchedKeywords: string[];
    }>,
    queryAnalysis: any,
    originalQuery: string
  ): Promise<PatternMatchResult> {
    
    let confidenceScore = 0;
    let response = '';
    let fallbackLevel = 3;
    let sourceContext: 'basic' | 'advanced' | 'custom' = 'basic';
    let templateUsed = 'fallback';
    const contextDocuments: string[] = [];
    const matchedPatternIds: string[] = [];

    if (matchedPatterns.length > 0) {
      const topMatch = matchedPatterns[0];
      confidenceScore = Math.min(topMatch.score / 3, 1.0); // 최대 1.0으로 정규화
      matchedPatternIds.push(topMatch.pattern.id);

      // Fallback 단계 결정
      if (confidenceScore >= 0.8) {
        fallbackLevel = 1;
        templateUsed = 'primary';
        response = topMatch.pattern.responseTemplates.primary;
      } else if (confidenceScore >= 0.5) {
        fallbackLevel = 2;
        templateUsed = 'secondary';
        response = topMatch.pattern.responseTemplates.secondary;
      } else {
        fallbackLevel = 3;
        templateUsed = 'fallback';
        response = topMatch.pattern.responseTemplates.fallback;
      }

      // 컨텍스트 문서 출처 결정
      if (confidenceScore >= 0.8) sourceContext = 'advanced';
      else if (confidenceScore >= 0.6) sourceContext = 'basic';
      else sourceContext = 'basic';
    }

    // 기본 응답이 없는 경우 일반적인 fallback
    if (!response) {
      response = this.generateGenericResponse(queryAnalysis, originalQuery);
      confidenceScore = 0.3;
    }

    // 동적 메트릭 데이터 통합
    const dynamicMetrics = await this.integrateCurrentMetrics(matchedPatternIds);
    
    // 실시간 상태 데이터로 응답 강화
    response = this.enhanceResponseWithHealthData(response, dynamicMetrics, matchedPatternIds);

    return {
      confidenceScore,
      matchedPatterns: matchedPatternIds,
      sourceContext,
      dynamicMetrics,
      response,
      fallbackLevel,
      metaData: {
        queryAnalysis,
        responseGeneration: {
          templateUsed,
          contextDocuments,
          healthDataIntegrated: !!dynamicMetrics
        }
      }
    };
  }

  /**
   * 📊 현재 메트릭 데이터 통합 (HybridMetricsBridge 연동)
   */
  private async integrateCurrentMetrics(matchedPatterns: string[]): Promise<any> {
    try {
      // HybridMetricsBridge에서 AI 분석 데이터 가져오기
      const analysisData = await hybridMetricsBridge.getAIAnalysisData([], '1h');
      
      if (analysisData && analysisData.summary) {
        const metrics: any = {};
        
        // 매칭된 패턴에 따라 관련 메트릭 포함
        if (matchedPatterns.some(p => p.includes('cpu'))) {
          metrics.cpu = analysisData.summary.avgCpu;
        }
        if (matchedPatterns.some(p => p.includes('memory'))) {
          metrics.memory = analysisData.summary.avgMemory;
        }
        if (matchedPatterns.some(p => p.includes('disk'))) {
          metrics.disk = analysisData.summary.avgDisk;
        }
        if (matchedPatterns.some(p => p.includes('network'))) {
          // HybridMetricsBridge에서 네트워크 데이터 추출
          let avgNetworkIn = 0, avgNetworkOut = 0, networkPoints = 0;
          
          analysisData.timeSeries.forEach(timeSeries => {
            timeSeries.forEach(point => {
              if (point.metrics.network) {
                avgNetworkIn += point.metrics.network.bytesIn;
                avgNetworkOut += point.metrics.network.bytesOut;
                networkPoints++;
              }
            });
          });
          
          if (networkPoints > 0) {
            metrics.network_in = Math.round(avgNetworkIn / networkPoints * 100) / 100;
            metrics.network_out = Math.round(avgNetworkOut / networkPoints * 100) / 100;
          }
        }
        if (matchedPatterns.some(p => p.includes('response'))) {
          // 응답시간 계산
          let avgResponseTime = 0, responsePoints = 0;
          
          analysisData.timeSeries.forEach(timeSeries => {
            timeSeries.forEach(point => {
              avgResponseTime += point.metrics.responseTime;
              responsePoints++;
            });
          });
          
          metrics.responseTime = responsePoints > 0 ? 
            Math.round(avgResponseTime / responsePoints * 100) / 100 : 0;
        }

        return Object.keys(metrics).length > 0 ? metrics : null;
      }
      
      // Fallback: SystemHealthChecker 데이터 사용
      if (this.lastAnalysis) {
        const metrics: any = {};
        
        if (matchedPatterns.some(p => p.includes('cpu'))) {
          metrics.cpu = this.lastAnalysis.avgCpuUsage;
        }
        if (matchedPatterns.some(p => p.includes('memory'))) {
          metrics.memory = this.lastAnalysis.avgMemoryUsage;
        }
        if (matchedPatterns.some(p => p.includes('disk'))) {
          metrics.disk = this.lastAnalysis.avgDiskUsage;
        }
        if (matchedPatterns.some(p => p.includes('response'))) {
          metrics.responseTime = this.lastAnalysis.avgResponseTime;
        }

        return Object.keys(metrics).length > 0 ? metrics : null;
      }
      
      return null;
      
    } catch (error) {
      console.warn('📊 Failed to integrate metrics from HybridMetricsBridge:', error);
      
      // Fallback to SystemHealthChecker
      if (this.lastAnalysis) {
        const metrics: any = {};
        
        if (matchedPatterns.some(p => p.includes('cpu'))) {
          metrics.cpu = this.lastAnalysis.avgCpuUsage;
        }
        if (matchedPatterns.some(p => p.includes('memory'))) {
          metrics.memory = this.lastAnalysis.avgMemoryUsage;
        }
        
        return Object.keys(metrics).length > 0 ? metrics : null;
      }
      
      return null;
    }
  }

  /**
   * 🏥 시스템 상태 데이터로 응답 강화
   */
  private enhanceResponseWithHealthData(
    baseResponse: string, 
    metrics: any, 
    patterns: string[]
  ): string {
    if (!metrics) return baseResponse;

    let enhancedResponse = baseResponse;

    // 현재 메트릭 값을 응답에 삽입
    Object.entries(metrics).forEach(([key, value]) => {
      const numValue = Number(value);
      if (!isNaN(numValue)) {
        const status = this.getMetricStatus(key, numValue);
        const statusText = this.getStatusText(status);
        
        enhancedResponse += ` 현재 ${this.getMetricDisplayName(key)} 사용률은 ${numValue.toFixed(1)}%로 ${statusText} 상태입니다.`;
      }
    });

    // 이상 징후가 있다면 추가 정보 제공
    if (this.lastAnomalies && this.lastAnomalies.length > 0) {
      const criticalAnomalies = this.lastAnomalies.filter(a => a.severity === 'critical' || a.severity === 'high');
      if (criticalAnomalies.length > 0) {
        enhancedResponse += ` 📊 추가로 ${criticalAnomalies.length}개의 심각한 이상 징후가 감지되었습니다.`;
      }
    }

    return enhancedResponse;
  }

  /**
   * 📈 메트릭 상태 판정
   */
  private getMetricStatus(metricType: string, value: number): 'normal' | 'warning' | 'critical' {
    const thresholds: Record<string, { warning: number; critical: number }> = {
      cpu: { warning: 70, critical: 85 },
      memory: { warning: 75, critical: 90 },
      disk: { warning: 80, critical: 90 },
      network_in: { warning: 70, critical: 85 },
      network_out: { warning: 70, critical: 85 },
      responseTime: { warning: 1000, critical: 3000 }
    };

    const threshold = thresholds[metricType];
    if (!threshold) return 'normal';

    if (value >= threshold.critical) return 'critical';
    if (value >= threshold.warning) return 'warning';
    return 'normal';
  }

  /**
   * 🏷️ 상태 텍스트 변환
   */
  private getStatusText(status: 'normal' | 'warning' | 'critical'): string {
    switch (status) {
      case 'normal': return '정상';
      case 'warning': return '경고';
      case 'critical': return '심각';
      default: return '알 수 없음';
    }
  }

  /**
   * 🏷️ 메트릭 표시명 변환
   */
  private getMetricDisplayName(metricType: string): string {
    const displayNames: Record<string, string> = {
      cpu: 'CPU',
      memory: '메모리',
      disk: '디스크',
      network_in: '네트워크 수신',
      network_out: '네트워크 송신',
      responseTime: '응답시간'
    };
    return displayNames[metricType] || metricType;
  }

  /**
   * 🔄 시스템 상태 데이터 새로고침
   */
  private async refreshSystemHealth(): Promise<void> {
    try {
      this.lastAnalysis = this.healthChecker.getStatisticalAnalysis();
      
      // 최신 헬스체크 수행하여 이상 징후 데이터 획득
      const healthReport = await this.healthChecker.generateHealthReport();
      this.lastAnomalies = healthReport.anomalies;
      
    } catch (error) {
      console.warn('🔄 Failed to refresh system health data:', error);
    }
  }

  /**
   * 🎲 일반적인 Fallback 응답 생성
   */
  private generateGenericResponse(queryAnalysis: any, originalQuery: string): string {
    const responses = [
      `"${originalQuery}"에 대한 구체적인 정보를 찾지 못했습니다. 시스템 관리자에게 문의하시거나 더 구체적인 질문을 해주세요.`,
      `요청하신 내용에 대해 정확한 답변을 제공하기 어렵습니다. 현재 시스템 상태를 확인하거나 다른 방식으로 질문해 주세요.`,
      `죄송합니다. 해당 질의에 대한 적절한 응답을 찾지 못했습니다. 시스템 모니터링 담당자에게 문의해 주세요.`
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  }

  /**
   * 🏗️ 패턴 초기화
   */
  private initializePatterns(): void {
    // CPU 관련 패턴
    this.patterns.set('cpu_high', {
      id: 'cpu_high',
      keywords: ['cpu', 'high', '높음', '과부하', '프로세서'],
      synonyms: ['씨피유', '연산', '처리', 'processor'],
      category: 'cpu',
      priority: 1,
      responseTemplates: {
        primary: 'CPU 사용률이 높은 상태입니다. 불필요한 프로세스를 종료하거나 부하를 분산시키는 것을 권장합니다.',
        secondary: 'CPU 과부하가 감지되었습니다. 시스템 성능 저하가 예상되니 조치가 필요합니다.',
        fallback: 'CPU 관련 문제가 있는 것 같습니다. 시스템 관리자에게 문의하세요.'
      },
      thresholds: {
        normal: { min: 0, max: 70 },
        warning: { min: 71, max: 85 },
        critical: { min: 86, max: 100 }
      },
      relatedMetrics: ['cpu', 'responseTime']
    });

    // 메모리 관련 패턴
    this.patterns.set('memory_high', {
      id: 'memory_high',
      keywords: ['memory', 'ram', '메모리', '부족', '꽉'],
      synonyms: ['램', '메모리', 'mem'],
      category: 'memory',
      priority: 1,
      responseTemplates: {
        primary: '메모리 사용률이 높습니다. 메모리 누수 프로세스를 확인하고 불필요한 서비스를 종료하세요.',
        secondary: '메모리 부족 현상이 감지되었습니다. 캐시를 클리어하거나 메모리 증설을 검토하세요.',
        fallback: '메모리 관련 문제가 발생했습니다. 시스템 점검이 필요합니다.'
      },
      thresholds: {
        normal: { min: 0, max: 75 },
        warning: { min: 76, max: 90 },
        critical: { min: 91, max: 100 }
      },
      relatedMetrics: ['memory']
    });

    // 복합 문제 패턴
    this.patterns.set('cpu_memory_composite', {
      id: 'cpu_memory_composite',
      keywords: ['cpu', 'memory', '동시에', '같이', '모두', '복합'],
      synonyms: ['함께', '전체', '시스템'],
      category: 'composite',
      priority: 1,
      responseTemplates: {
        primary: 'CPU와 메모리 사용률이 모두 높습니다. 시스템 전체 점검이 필요하며, 리소스 확장을 검토해야 합니다.',
        secondary: '복합적인 리소스 부족 현상입니다. 부하 분산과 스케일링을 고려하세요.',
        fallback: '시스템 전체에 문제가 있는 것 같습니다. 전문가의 도움이 필요합니다.'
      },
      thresholds: {
        normal: { min: 0, max: 70 },
        warning: { min: 71, max: 85 },
        critical: { min: 86, max: 100 }
      },
      relatedMetrics: ['cpu', 'memory', 'responseTime']
    });

    // 추가 패턴들...
    this.addDiskPatterns();
    this.addNetworkPatterns();
    this.addGeneralPatterns();
  }

  /**
   * 💾 디스크 관련 패턴 추가
   */
  private addDiskPatterns(): void {
    this.patterns.set('disk_full', {
      id: 'disk_full',
      keywords: ['disk', '디스크', '용량', '저장', '꽉', 'storage'],
      synonyms: ['하드', '스토리지', '저장공간'],
      category: 'disk',
      priority: 1,
      responseTemplates: {
        primary: '디스크 용량이 부족합니다. 불필요한 파일을 삭제하거나 스토리지를 확장하세요.',
        secondary: '저장공간 부족이 감지되었습니다. 로그 파일 정리를 권장합니다.',
        fallback: '디스크 관련 문제가 있습니다. 용량을 확인해 주세요.'
      },
      thresholds: {
        normal: { min: 0, max: 80 },
        warning: { min: 81, max: 90 },
        critical: { min: 91, max: 100 }
      },
      relatedMetrics: ['disk']
    });
  }

  /**
   * 🌐 네트워크 관련 패턴 추가
   */
  private addNetworkPatterns(): void {
    this.patterns.set('network_slow', {
      id: 'network_slow',
      keywords: ['network', '네트워크', '느림', '지연', '연결', 'slow'],
      synonyms: ['인터넷', '통신', '연결'],
      category: 'network',
      priority: 2,
      responseTemplates: {
        primary: '네트워크 성능이 저하되었습니다. 대역폭 사용률과 연결 상태를 확인하세요.',
        secondary: '네트워크 지연이 감지되었습니다. 라우팅과 방화벽 설정을 점검하세요.',
        fallback: '네트워크 문제가 있는 것 같습니다. 연결 상태를 확인해 주세요.'
      },
      thresholds: {
        normal: { min: 0, max: 70 },
        warning: { min: 71, max: 85 },
        critical: { min: 86, max: 100 }
      },
      relatedMetrics: ['network_in', 'network_out', 'responseTime']
    });
  }

  /**
   * 🌍 일반적인 패턴 추가
   */
  private addGeneralPatterns(): void {
    this.patterns.set('server_slow', {
      id: 'server_slow',
      keywords: ['서버', '느림', '속도', '지연', 'slow', 'server'],
      synonyms: ['시스템', '성능', '응답'],
      category: 'general',
      priority: 3,
      responseTemplates: {
        primary: '서버 성능이 저하되었습니다. 리소스 사용률과 프로세스 상태를 확인하세요.',
        secondary: '시스템 응답이 느려졌습니다. 부하 상태를 점검해 보세요.',
        fallback: '서버에 문제가 있는 것 같습니다. 상태를 확인해 주세요.'
      },
      thresholds: {
        normal: { min: 0, max: 70 },
        warning: { min: 71, max: 85 },
        critical: { min: 86, max: 100 }
      },
      relatedMetrics: ['cpu', 'memory', 'responseTime']
    });
  }

  /**
   * 📚 컨텍스트 문서 로드
   */
  private loadContextDocuments(): void {
    const documentsPath = join(process.cwd(), 'src/mcp/documents');
    
    // Basic 문서 로드
    this.loadDocumentsFromPath(join(documentsPath, 'basic'), 'basic');
    
    // Advanced 문서 로드 (존재하는 경우)
    if (existsSync(join(documentsPath, 'advanced'))) {
      this.loadDocumentsFromPath(join(documentsPath, 'advanced'), 'advanced');
    }
    
    // Custom 문서 로드 (존재하는 경우)
    if (existsSync(join(documentsPath, 'custom'))) {
      this.loadDocumentsFromPath(join(documentsPath, 'custom'), 'custom');
    }
  }

  /**
   * 📁 특정 경로에서 문서 로드
   */
  private loadDocumentsFromPath(path: string, context: string): void {
    try {
      // 여기서는 간단한 예시로 구현
      // 실제로는 디렉토리를 스캔하고 모든 .md 파일을 로드해야 함
      console.log(`📚 Loading context documents from ${context}: ${path}`);
      
    } catch (error) {
      console.warn(`📚 Failed to load documents from ${path}:`, error);
    }
  }

  /**
   * 🔧 패턴 재설정
   */
  public reloadPatterns(): void {
    this.patterns.clear();
    this.initializePatterns();
    console.log('🔧 Patterns reloaded successfully');
  }

  /**
   * 📊 현재 패턴 통계
   */
  public getPatternStats(): {
    totalPatterns: number;
    patternsByCategory: Record<string, number>;
    documentCount: number;
  } {
    const patternsByCategory: Record<string, number> = {};
    
    this.patterns.forEach(pattern => {
      patternsByCategory[pattern.category] = (patternsByCategory[pattern.category] || 0) + 1;
    });

    return {
      totalPatterns: this.patterns.size,
      patternsByCategory,
      documentCount: this.contextDocuments.size
    };
  }
}

// 싱글톤 인스턴스 export
export const predictivePatternMatcher = PredictivePatternMatcher.getInstance(); 