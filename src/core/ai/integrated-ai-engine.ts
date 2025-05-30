/**
 * 🧠 통합 AI 엔진 (TypeScript 포팅)
 * Python AI 엔진의 로직을 Next.js 내부로 통합
 * 단일 서버 운영을 위한 완전 통합 솔루션
 */

interface AnalysisRequest {
  query?: string;
  metrics?: MetricData[];
  data?: Record<string, any>;
}

interface AnalysisResult {
  success?: boolean;
  summary: string;
  confidence: number;
  recommendations: string[];
  analysis_data: Record<string, any>;
}

interface MetricData {
  timestamp: string;
  cpu: number;
  memory: number;
  disk: number;
  networkIn?: number;
  networkOut?: number;
}

interface AnalysisConfig {
  confidence_threshold: number;
  critical_cpu_threshold: number;
  critical_memory_threshold: number;
  critical_disk_threshold: number;
}

export class IntegratedAIEngine {
  private static instance: IntegratedAIEngine;
  private config: AnalysisConfig;
  private initialized: boolean = false;
  private startTime: Date = new Date();
  private requestCount: number = 0;

  private constructor() {
    this.config = {
      confidence_threshold: 0.8,
      critical_cpu_threshold: 90,
      critical_memory_threshold: 85,
      critical_disk_threshold: 90
    };
  }

  public static getInstance(): IntegratedAIEngine {
    if (!IntegratedAIEngine.instance) {
      IntegratedAIEngine.instance = new IntegratedAIEngine();
    }
    return IntegratedAIEngine.instance;
  }

  /**
   * 🚀 엔진 초기화
   */
  public async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      console.log('🧠 통합 AI 엔진 초기화 시작...');
      
      // 워밍업 분석 수행
      await this.performWarmupAnalysis();
      
      this.initialized = true;
      console.log('✅ 통합 AI 엔진 초기화 완료!');
    } catch (error) {
      console.error('❌ 통합 AI 엔진 초기화 실패:', error);
      throw error;
    }
  }

  /**
   * 🔥 워밍업 분석
   */
  private async performWarmupAnalysis(): Promise<void> {
    const dummyMetrics: MetricData[] = [{
      timestamp: new Date().toISOString(),
      cpu: 50,
      memory: 60,
      disk: 70
    }];

    await this.analyzeMetrics('워밍업 테스트', dummyMetrics, {});
  }

  /**
   * ⚡ 메인 분석 함수
   */
  public async analyzeMetrics(
    query: string,
    metrics: MetricData[],
    additionalData: Record<string, any> = {}
  ): Promise<AnalysisResult> {
    if (!this.initialized) {
      await this.initialize();
    }

    this.requestCount++;
    const startTime = Date.now();

    try {
      // 기본 분석 결과 구성
      let analysisResult: AnalysisResult = {
        summary: "정상적인 시스템 상태입니다",
        confidence: 0.95,
        recommendations: ["정기적인 모니터링 지속"],
        analysis_data: {
          query,
          metrics_count: metrics.length,
          timestamp: new Date().toISOString(),
          analysis_type: "general"
        },
        success: true
      };

      // 쿼리 기반 분석
      if (query) {
        const queryAnalysis = this.analyzeByQuery(query);
        analysisResult = { ...analysisResult, ...queryAnalysis };
      }

      // 메트릭 기반 분석
      if (metrics && metrics.length > 0) {
        const metricAnalysis = this.analyzeMetricsData(metrics);
        analysisResult = { ...analysisResult, ...metricAnalysis };
      }

      // 메타데이터 추가
      analysisResult.analysis_data = {
        ...analysisResult.analysis_data,
        processing_time: Date.now() - startTime,
        request_id: `req_${this.requestCount}`,
        service_uptime: Date.now() - this.startTime.getTime(),
        engine_version: "integrated-1.0.0"
      };

      return analysisResult;

    } catch (error) {
      console.error('❌ 분석 오류:', error);
      return {
        success: false,
        summary: "분석 중 오류가 발생했습니다",
        confidence: 0,
        recommendations: ["시스템 관리자에게 문의하세요"],
        analysis_data: {
          error: error instanceof Error ? error.message : '알 수 없는 오류',
          processing_time: Date.now() - startTime
        }
      };
    }
  }

  /**
   * 📝 쿼리 기반 분석
   */
  private analyzeByQuery(query: string): Partial<AnalysisResult> {
    const queryLower = query.toLowerCase();

    // CPU 관련 분석
    if (this.containsKeywords(queryLower, ['cpu', '프로세서', '처리율', '사용률'])) {
      if (this.containsKeywords(queryLower, ['급증', '증가', '높음', '과부하'])) {
        return {
          summary: "CPU 부하 증가로 인한 응답 지연 가능성",
          confidence: 0.92,
          recommendations: [
            "nginx 상태 확인",
            "DB 커넥션 수 점검",
            "실행 중인 프로세스 확인",
            "CPU 집약적 작업 최적화 검토"
          ],
          analysis_data: {
            analysis_type: "cpu_performance",
            severity: "high"
          }
        };
      }
    }

    // 메모리 관련 분석
    if (this.containsKeywords(queryLower, ['메모리', '램', 'memory', 'ram'])) {
      return {
        summary: "메모리 사용량 최적화가 필요합니다",
        confidence: 0.88,
        recommendations: [
          "메모리 누수 점검",
          "캐시 정리 실행",
          "불필요한 프로세스 종료"
        ],
        analysis_data: {
          analysis_type: "memory_optimization",
          severity: "medium"
        }
      };
    }

    // 디스크 관련 분석
    if (this.containsKeywords(queryLower, ['디스크', '저장소', 'disk', 'storage'])) {
      return {
        summary: "디스크 공간 또는 I/O 성능 점검이 필요합니다",
        confidence: 0.85,
        recommendations: [
          "디스크 사용량 확인",
          "로그 파일 정리",
          "디스크 조각 모음 실행"
        ],
        analysis_data: {
          analysis_type: "disk_performance",
          severity: "medium"
        }
      };
    }

    // 네트워크 관련 분석
    if (this.containsKeywords(queryLower, ['네트워크', '연결', 'network', '지연'])) {
      return {
        summary: "네트워크 연결 상태 점검이 필요합니다",
        confidence: 0.80,
        recommendations: [
          "네트워크 대역폭 확인",
          "방화벽 규칙 점검",
          "DNS 해석 속도 확인"
        ],
        analysis_data: {
          analysis_type: "network_analysis",
          severity: "medium"
        }
      };
    }

    return {};
  }

  /**
   * 📊 메트릭 데이터 분석
   */
  private analyzeMetricsData(metrics: MetricData[]): Partial<AnalysisResult> {
    const latestMetric = metrics[metrics.length - 1];
    
    const cpuUsage = latestMetric.cpu || 0;
    const memoryUsage = latestMetric.memory || 0;
    const diskUsage = latestMetric.disk || 0;

    const issues: string[] = [];
    const recommendations: string[] = [];
    let severity = "low";
    let confidence = 0.95;

    // CPU 분석
    if (cpuUsage >= this.config.critical_cpu_threshold) {
      issues.push(`CPU 사용률이 위험 수준입니다 (${cpuUsage}%)`);
      recommendations.push(...[
        "CPU 집약적 프로세스 확인",
        "로드 밸런싱 검토",
        "서버 스케일링 고려"
      ]);
      severity = "critical";
    } else if (cpuUsage >= 70) {
      issues.push(`CPU 사용률이 높습니다 (${cpuUsage}%)`);
      recommendations.push("CPU 사용량 모니터링 강화");
      severity = "high";
    }

    // 메모리 분석
    if (memoryUsage >= this.config.critical_memory_threshold) {
      issues.push(`메모리 사용률이 위험 수준입니다 (${memoryUsage}%)`);
      recommendations.push(...[
        "메모리 누수 점검",
        "캐시 최적화",
        "메모리 증설 검토"
      ]);
      severity = "critical";
    } else if (memoryUsage >= 70) {
      issues.push(`메모리 사용률이 높습니다 (${memoryUsage}%)`);
      recommendations.push("메모리 사용량 모니터링");
      if (severity === "low") severity = "high";
    }

    // 디스크 분석
    if (diskUsage >= this.config.critical_disk_threshold) {
      issues.push(`디스크 사용률이 위험 수준입니다 (${diskUsage}%)`);
      recommendations.push(...[
        "디스크 정리 즉시 실행",
        "로그 파일 아카이브",
        "디스크 용량 증설"
      ]);
      severity = "critical";
    }

    // 분석 결과 생성
    if (issues.length > 0) {
      const summary = issues.join("; ");
      confidence = severity === "critical" ? 0.95 : severity === "high" ? 0.88 : 0.75;
      
      return {
        summary,
        confidence,
        recommendations,
        analysis_data: {
          analysis_type: "metrics_analysis",
          severity,
          metrics_analyzed: {
            cpu: cpuUsage,
            memory: memoryUsage,
            disk: diskUsage
          }
        }
      };
    }

    return {
      summary: "모든 메트릭이 정상 범위 내에 있습니다",
      confidence: 0.95,
      recommendations: ["현재 상태 유지", "정기적인 모니터링 지속"]
    };
  }

  /**
   * 🔍 키워드 포함 여부 확인
   */
  private containsKeywords(text: string, keywords: string[]): boolean {
    return keywords.some(keyword => text.includes(keyword));
  }

  /**
   * 📈 시스템 상태 반환
   */
  public getSystemStatus() {
    return {
      initialized: this.initialized,
      uptime: Date.now() - this.startTime.getTime(),
      requestCount: this.requestCount,
      version: "integrated-1.0.0"
    };
  }
} 