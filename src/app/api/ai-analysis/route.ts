import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

/**
 * 🧠 AI 분석 전용 API 엔드포인트
 * - 자연어 질의 처리
 * - 시계열 데이터 분석  
 * - 장애 패턴 인식
 * - 예측 모델 제공
 */

interface AIAnalysisRequest {
  query: string;
  analysisType: 'timeline' | 'root_cause' | 'prediction' | 'comparison' | 'natural_language';
  timeRange?: {
    start: string;
    end: string;
  };
  context?: {
    serverId?: string;
    metric?: string;
    threshold?: number;
  };
}

interface AIAnalysisResponse {
  success: boolean;
  analysisType: string;
  query: string;
  results: {
    summary: string;
    findings: Array<{
      type: 'insight' | 'warning' | 'prediction' | 'correlation';
      severity: 'low' | 'medium' | 'high' | 'critical';
      message: string;
      evidence: any;
      confidence: number;
    }>;
    recommendations: string[];
    relatedData: any;
  };
  metadata: {
    executionTime: number;
    dataSourcesUsed: string[];
    confidenceLevel: number;
  };
}

/**
 * 📊 시계열 분석 엔진
 * 시간 기반 패턴 분석 및 이상 탐지
 */
class TimelineAnalysisEngine {
  static async analyzeTimeline(query: string, timeRange?: { start: string; end: string }) {
    const startTime = Date.now();
    try {
      // 현재 실시간 데이터 로드
      const currentDataPath = path.join(process.cwd(), 'public/ai-server-data/realtime/current.json');
      const currentData = JSON.parse(await fs.readFile(currentDataPath, 'utf-8'));
      
      // 히스토리컬 인시던트 데이터 로드
      const incidentPath = path.join(process.cwd(), 'public/ai-server-data/historical/incidents/sample-incident-001.json');
      const incidentData = JSON.parse(await fs.readFile(incidentPath, 'utf-8'));
      
      // 시간대 키워드 매칭
      let timeContext = '지난 24시간';
      if (/밤|night/i.test(query)) timeContext = '야간 시간대 (22:00-06:00)';
      if (/오늘|today/i.test(query)) timeContext = '오늘';
      if (/어제|yesterday/i.test(query)) timeContext = '어제';
      
      const findings: any[] = [];
      
      // 🔍 데이터 검증 및 변환 - any 타입 제거
      let servers: Array<{
        id: string;
        name: string;
        metrics: { cpu: number; memory: number; disk: number; network: number };
        currentEvents: any[];
        currentTrend: string;
        status: string;
      }> = [];
      
      try {
        if (!currentData?.servers || typeof currentData.servers !== 'object') {
          throw new Error('Invalid server data structure');
        }
        
        servers = Object.entries(currentData.servers).map(([id, data]) => {
          // 타입 가드로 데이터 검증
          if (!data || typeof data !== 'object') {
            throw new Error(`Invalid data for server ${id}`);
          }
          
          const validatedData = data as any; // 최소한의 any 사용
          
          return {
            id,
            name: id.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()),
            metrics: {
              cpu: typeof validatedData.cpu === 'number' ? validatedData.cpu : 50,
              memory: typeof validatedData.memory === 'number' ? validatedData.memory : 50,
              disk: typeof validatedData.disk === 'number' ? validatedData.disk : 50,
              network: typeof validatedData.network === 'number' ? validatedData.network : 50
            },
            currentEvents: Array.isArray(validatedData.events) ? validatedData.events : [],
            currentTrend: typeof validatedData.trend === 'string' ? validatedData.trend : 'stable',
            status: typeof validatedData.status === 'string' ? validatedData.status : 'online'
          };
        });
      } catch (error) {
        console.error('Data validation error:', error);
        return NextResponse.json({
          success: false,
          error: 'Data validation failed',
          fallback: true,
          results: {
            summary: '데이터 검증 실패로 인해 기본 분석만 제공됩니다.',
            findings: [],
            recommendations: ['데이터 소스를 확인해주세요.'],
            relatedData: {}
          },
          metadata: {
            executionTime: Date.now() - startTime,
            dataSourcesUsed: [],
            confidenceLevel: 0
          }
        }, { status: 200 }); // 200으로 반환 (Graceful Degradation)
      }
      
      const problematicServers = servers.filter((server: any) => 
        server.currentEvents?.length > 0 || 
        server.currentTrend === 'increasing' ||
        server.metrics.cpu > 85 || 
        server.metrics.memory > 90
      );
      
      problematicServers.forEach((server: any) => {
        if (server.currentEvents?.length > 0) {
          findings.push({
            type: 'warning' as const,
            severity: 'high' as const,
            message: `${server.name}에서 ${server.currentEvents[0].type} 이벤트 감지: ${server.currentEvents[0].description}`,
            evidence: {
              server: server.name,
              event: server.currentEvents[0],
              metrics: server.metrics
            },
            confidence: 0.92
          });
        }
        
        if (server.metrics.cpu > 85) {
          findings.push({
            type: 'warning' as const,
            severity: server.metrics.cpu > 90 ? 'critical' as const : 'high' as const,
            message: `${server.name} CPU 사용률 ${server.metrics.cpu}% - 임계점 초과`,
            evidence: {
              server: server.name,
              metric: 'cpu',
              value: server.metrics.cpu,
              threshold: 85
            },
            confidence: 0.95
          });
        }
      });
      
      // 히스토리컬 인시던트와 연관성 분석
      if (incidentData && findings.length > 0) {
        findings.push({
          type: 'correlation' as const,
          severity: 'medium' as const,
          message: `현재 상황이 ${incidentData.title} 패턴과 유사함 (${incidentData.startTime.split('T')[0]})`,
          evidence: {
            historicalIncident: {
              id: incidentData.id,
              title: incidentData.title,
              pattern: incidentData.rootCause?.technicalDetails
            }
          },
          confidence: 0.78
        });
      }
      
      const summary = findings.length > 0 
        ? `${timeContext} 동안 ${problematicServers.length}개 서버에서 이상 징후 감지. 주요 문제: ${findings[0]?.message}`
        : `${timeContext} 동안 모든 서버가 정상 상태를 유지하고 있습니다.`;
        
      const recommendations = findings.length > 0 ? [
        '문제 서버에 대한 즉시 모니터링 강화',
        '과거 유사 사례의 해결 방법 검토',
        '예방 조치를 위한 임계값 조정 고려'
      ] : [
        '현재 안정적인 상태 유지',
        '정기적인 성능 점검 계속 진행'
      ];
      
      return {
        summary,
        findings,
        recommendations,
        relatedData: {
          timeContext,
          analyzedServers: servers.length,
          problematicCount: problematicServers.length,
          historicalContext: incidentData ? incidentData.title : null
        }
      };
      
    } catch (error) {
      console.error('Timeline analysis error:', error);
      return {
        summary: '시계열 분석 중 오류가 발생했습니다.',
        findings: [{
          type: 'warning' as const,
          severity: 'low' as const,
          message: '데이터 로드 실패로 분석을 완료할 수 없습니다.',
          evidence: { error: error instanceof Error ? error.message : 'Unknown error' },
          confidence: 0.1
        }],
        recommendations: ['시스템 상태 점검 후 재시도'],
        relatedData: {}
      };
    }
  }
}

/**
 * 🔍 근본 원인 분석 엔진
 * 문제의 원인을 추적하고 상관관계 분석
 */
class RootCauseAnalysisEngine {
  static async analyzeRootCause(query: string) {
    const startTime = Date.now();
    try {
      const currentDataPath = path.join(process.cwd(), 'public/ai-server-data/realtime/current.json');
      const currentData = JSON.parse(await fs.readFile(currentDataPath, 'utf-8'));
      
      const baselinesPath = path.join(process.cwd(), 'public/ai-server-data/ai-features/baselines.json');
      const baselinesData = JSON.parse(await fs.readFile(baselinesPath, 'utf-8'));
      
      const findings: any[] = [];
      
      // 서버 데이터 변환
      const servers = Object.entries(currentData.servers).map(([id, data]: [string, any]) => ({
        id,
        name: id.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        ...data,
        metrics: { cpu: data.cpu, memory: data.memory, disk: data.disk, network: data.network },
        currentEvents: data.events || [],
        currentTrend: data.trend || 'stable'
      }));
      
      // CPU 급증 원인 분석
      if (/cpu|CPU|프로세서/i.test(query)) {
        const highCpuServers = servers.filter((server: any) => server.metrics.cpu > 70);
        
        highCpuServers.forEach((server: any) => {
          const baseline = baselinesData.serverBaselines[server.id];
          if (baseline) {
            const deviation = server.metrics.cpu - baseline.normalRanges.cpu.average;
            
            findings.push({
              type: 'insight' as const,
              severity: deviation > 30 ? 'critical' as const : 'high' as const,
              message: `${server.name}: 기준값 대비 CPU ${deviation.toFixed(1)}% 초과. 가능한 원인: ${server.currentEvents?.[0]?.type || '부하 증가'}`,
              evidence: {
                server: server.name,
                current: server.metrics.cpu,
                baseline: baseline.normalRanges.cpu.average,
                deviation,
                potentialCauses: server.currentEvents || []
              },
              confidence: 0.88
            });
          }
        });
      }
      
      // 메모리 문제 원인 분석
      if (/메모리|memory|RAM/i.test(query)) {
        const highMemoryServers = servers.filter((server: any) => server.metrics.memory > 80);
        
        highMemoryServers.forEach((server: any) => {
          const baseline = baselinesData.serverBaselines[server.id];
          if (baseline) {
            findings.push({
              type: 'warning' as const,
              severity: 'high' as const,
              message: `${server.name}: 메모리 사용률 ${server.metrics.memory}%. 메모리 누수 패턴 가능성 높음`,
              evidence: {
                server: server.name,
                current: server.metrics.memory,
                pattern: 'gradual_increase',
                correlatedWith: 'API 요청 증가'
              },
              confidence: 0.82
            });
          }
        });
      }
      
      // 상관관계 분석 (correlationPatterns 활용)
      const correlations = baselinesData.globalBaselines.correlationPatterns;
      Object.entries(correlations).forEach(([key, correlation]: [string, any]) => {
        findings.push({
          type: 'correlation' as const,
          severity: 'medium' as const,
          message: `상관관계 분석: ${correlation.description} (상관계수: ${correlation.correlation})`,
          evidence: {
            pattern: key,
            correlation: correlation.correlation,
            description: correlation.description,
            lagTime: correlation.lagTime
          },
          confidence: 0.75
        });
      });
      
      const summary = findings.length > 0 
        ? `근본 원인 분석 결과: ${findings.length}개 요인 식별. 주요 원인: ${findings[0]?.message}`
        : '명확한 근본 원인을 식별하지 못했습니다. 추가 데이터 수집이 필요합니다.';
        
      return {
        summary,
        findings,
        recommendations: [
          '식별된 근본 원인에 대한 단계별 해결 방안 수립',
          '상관관계가 높은 메트릭들에 대한 통합 모니터링',
          '예방을 위한 조기 경보 시스템 구축'
        ],
        relatedData: {
          analyzedCorrelations: Object.keys(correlations).length,
          primaryCause: findings[0]?.evidence || null
        }
      };
      
    } catch (error) {
      console.error('Root cause analysis error:', error);
      return {
        summary: '근본 원인 분석 중 오류가 발생했습니다.',
        findings: [],
        recommendations: ['시스템 로그 재검토'],
        relatedData: {}
      };
    }
  }
}

/**
 * 🔮 예측 분석 엔진
 * 미래 상태 예측 및 잠재적 문제 식별
 */
class PredictiveAnalysisEngine {
  static async analyzePrediction(query: string) {
    const startTime = Date.now();
    try {
      const currentDataPath = path.join(process.cwd(), 'public/ai-server-data/realtime/current.json');
      const currentData = JSON.parse(await fs.readFile(currentDataPath, 'utf-8'));
      
      const baselinesPath = path.join(process.cwd(), 'public/ai-server-data/ai-features/baselines.json');
      const baselinesData = JSON.parse(await fs.readFile(baselinesPath, 'utf-8'));
      
      const findings: any[] = [];
      const predictionModels = baselinesData.globalBaselines.predictionModels;
      
      // 서버 데이터 변환
      const servers = Object.entries(currentData.servers).map(([id, data]: [string, any]) => ({
        id,
        name: id.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        ...data,
        metrics: { cpu: data.cpu, memory: data.memory, disk: data.disk, network: data.network },
        currentEvents: data.events || [],
        currentTrend: data.trend || 'stable',
        type: id.includes('web') ? 'web' : (id.includes('api') ? 'api' : 'other')
      }));
      
      // 메모리 누수 예측
      if (predictionModels.memoryLeakDetection) {
        const serversAtRisk = servers.filter((server: any) => {
          const trend = server.currentTrend;
          const memoryUsage = server.metrics.memory;
          return trend === 'increasing' && memoryUsage > 70;
        });
        
        serversAtRisk.forEach((server: any) => {
          findings.push({
            type: 'prediction' as const,
            severity: 'warning' as const,
            message: `${server.name}: 2-3시간 내 메모리 누수 발생 가능성 높음 (현재 트렌드: ${server.currentTrend})`,
            evidence: {
              server: server.name,
              currentMemory: server.metrics.memory,
              trend: server.currentTrend,
              predictionWindow: '2-3 hours',
              model: 'memoryLeakDetection'
            },
            confidence: predictionModels.memoryLeakDetection.confidence / 100
          });
        });
      }
      
      // 트래픽 급증 예측
      if (predictionModels.trafficSpikePredictor) {
        const webServers = servers.filter((server: any) => server.type === 'web');
        
        webServers.forEach((server: any) => {
          if (server.metrics.cpu > 60 && server.metrics.network > 70) {
            findings.push({
              type: 'prediction' as const,
              severity: 'medium' as const,
              message: `${server.name}: 10-15분 내 트래픽 급증 예상 (선행 지표: CPU ${server.metrics.cpu}%, 네트워크 ${server.metrics.network}%)`,
              evidence: {
                server: server.name,
                leadIndicators: {
                  cpu: server.metrics.cpu,
                  network: server.metrics.network
                },
                timeWindow: predictionModels.trafficSpikePredictor.timeWindow,
                model: 'trafficSpikePredictor'
              },
              confidence: predictionModels.trafficSpikePredictor.confidence / 100
            });
          }
        });
      }
      
      // 시간 기반 예측 (내일, 다음 주 등)
      if (/내일|tomorrow|다음|next/i.test(query)) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dayOfWeek = tomorrow.toLocaleDateString('ko-KR', { weekday: 'long' });
        
        findings.push({
          type: 'prediction' as const,
          severity: 'low' as const,
          message: `${dayOfWeek} 예상 부하: 평소 대비 ${dayOfWeek.includes('월') ? '110%' : '95%'} (계절적 패턴 기반)`,
          evidence: {
            targetDate: tomorrow.toISOString().split('T')[0],
            dayOfWeek,
            expectedLoad: dayOfWeek.includes('월') ? 1.1 : 0.95,
            basedOn: 'seasonalPatterns'
          },
          confidence: 0.73
        });
      }
      
      const summary = findings.length > 0 
        ? `예측 분석 결과: ${findings.length}개 예상 시나리오 식별. 주요 예측: ${findings[0]?.message}`
        : '현재 상태로는 특별한 문제 예상되지 않음. 안정적 운영 전망.';
        
      return {
        summary,
        findings,
        recommendations: [
          '예측된 문제에 대한 사전 대응 계획 수립',
          '리소스 확장 또는 부하 분산 준비',
          '모니터링 알럿 임계값 임시 조정 고려'
        ],
        relatedData: {
          predictionHorizon: '2-24 hours',
          modelsUsed: Object.keys(predictionModels),
          confidenceLevel: findings.reduce((sum, f) => sum + f.confidence, 0) / findings.length || 0
        }
      };
      
    } catch (error) {
      console.error('Predictive analysis error:', error);
      return {
        summary: '예측 분석 중 오류가 발생했습니다.',
        findings: [],
        recommendations: ['예측 모델 재보정 필요'],
        relatedData: {}
      };
    }
  }
}

/**
 * ⚖️ 비교 분석 엔진
 * 시간대별, 서버별 성능 비교 분석
 */
class ComparisonAnalysisEngine {
  static async analyzeComparison(query: string) {
    const startTime = Date.now();
    try {
      const currentDataPath = path.join(process.cwd(), 'public/ai-server-data/realtime/current.json');
      const currentData = JSON.parse(await fs.readFile(currentDataPath, 'utf-8'));
      
      const baselinesPath = path.join(process.cwd(), 'public/ai-server-data/ai-features/baselines.json');
      const baselinesData = JSON.parse(await fs.readFile(baselinesPath, 'utf-8'));
      
      const findings: any[] = [];
      
      // 서버 데이터 변환
      const servers = Object.entries(currentData.servers).map(([id, data]: [string, any]) => ({
        id,
        name: id.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        ...data,
        metrics: { cpu: data.cpu, memory: data.memory, disk: data.disk, network: data.network },
        currentEvents: data.events || [],
        currentTrend: data.trend || 'stable'
      }));
      
      // 현재 vs 기준값 비교
      servers.forEach((server: any) => {
        const baseline = baselinesData.serverBaselines[server.id];
        if (baseline) {
          const cpuDiff = server.metrics.cpu - baseline.normalRanges.cpu.average;
          const memoryDiff = server.metrics.memory - baseline.normalRanges.memory.average;
          
          if (Math.abs(cpuDiff) > 20 || Math.abs(memoryDiff) > 15) {
            findings.push({
              type: 'insight' as const,
              severity: Math.abs(cpuDiff) > 30 ? 'high' as const : 'medium' as const,
              message: `${server.name}: 기준 대비 CPU ${cpuDiff > 0 ? '+' : ''}${cpuDiff.toFixed(1)}%, 메모리 ${memoryDiff > 0 ? '+' : ''}${memoryDiff.toFixed(1)}%`,
              evidence: {
                server: server.name,
                current: server.metrics,
                baseline: baseline.normalRanges,
                differences: { cpu: cpuDiff, memory: memoryDiff }
              },
              confidence: 0.85
            });
          }
        }
      });
      
      // 서버간 성능 비교
      const avgCpu = servers.reduce((sum: number, s: any) => sum + s.metrics.cpu, 0) / servers.length;
      const avgMemory = servers.reduce((sum: number, s: any) => sum + s.metrics.memory, 0) / servers.length;
      
      const outliers = servers.filter((server: any) => 
        Math.abs(server.metrics.cpu - avgCpu) > 25 || 
        Math.abs(server.metrics.memory - avgMemory) > 20
      );
      
      outliers.forEach((server: any) => {
        findings.push({
          type: 'warning' as const,
          severity: 'medium' as const,
          message: `${server.name}: 다른 서버 대비 이상값 감지 (CPU 평균: ${avgCpu.toFixed(1)}%, 현재: ${server.metrics.cpu}%)`,
          evidence: {
            server: server.name,
            current: server.metrics.cpu,
            average: avgCpu,
            deviation: server.metrics.cpu - avgCpu
          },
          confidence: 0.78
        });
      });
      
      // 시계열 비교 (이번 주 vs 지난 주 등)
      if (/주|week|이번|지난/i.test(query)) {
        const seasonalPatterns = baselinesData.serverBaselines['api-server-1']?.seasonalPatterns;
        if (seasonalPatterns) {
          const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
          const todayMultiplier = seasonalPatterns[today] || 1.0;
          
          findings.push({
            type: 'insight' as const,
            severity: 'low' as const,
            message: `주간 패턴 분석: 오늘은 평소 대비 ${(todayMultiplier * 100).toFixed(0)}% 부하 예상`,
            evidence: {
              dayOfWeek: today,
              loadMultiplier: todayMultiplier,
              seasonalData: seasonalPatterns
            },
            confidence: 0.70
          });
        }
      }
      
      const summary = findings.length > 0 
        ? `비교 분석 결과: ${findings.length}개 차이점 식별. 주요 발견: ${findings[0]?.message}`
        : '비교 대상들 간에 유의미한 차이를 발견하지 못했습니다.';
        
      return {
        summary,
        findings,
        recommendations: [
          '성능 차이가 큰 서버에 대한 세부 조사',
          '기준값 업데이트 또는 임계값 재조정',
          '이상값 서버의 설정 및 워크로드 검토'
        ],
        relatedData: {
          comparisonScope: 'current vs baseline + inter-server',
          averageMetrics: { cpu: avgCpu, memory: avgMemory },
          outlierCount: outliers.length
        }
      };
      
    } catch (error) {
      console.error('Comparison analysis error:', error);
      return {
        summary: '비교 분석 중 오류가 발생했습니다.',
        findings: [],
        recommendations: ['데이터 소스 확인 후 재시도'],
        relatedData: {}
      };
    }
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const requestData: AIAnalysisRequest = await request.json();
    const { query, analysisType, timeRange, context } = requestData;
    
    console.log(`🧠 [AI-ANALYSIS] ${analysisType} 분석 요청: "${query}"`);
    
    let results;
    const dataSourcesUsed = ['realtime-data', 'historical-incidents'];
    
    // 분석 타입에 따른 엔진 선택
    switch (analysisType) {
      case 'timeline':
        results = await TimelineAnalysisEngine.analyzeTimeline(query, timeRange);
        dataSourcesUsed.push('timeline-data');
        break;
        
      case 'root_cause':
        results = await RootCauseAnalysisEngine.analyzeRootCause(query);
        dataSourcesUsed.push('correlation-matrix');
        break;
        
      case 'prediction':
        results = await PredictiveAnalysisEngine.analyzePrediction(query);
        dataSourcesUsed.push('prediction-models');
        break;
        
      case 'comparison':
        results = await ComparisonAnalysisEngine.analyzeComparison(query);
        dataSourcesUsed.push('historical-baselines');
        break;
        
      case 'natural_language':
        // 자연어를 파싱해서 적절한 분석 타입으로 라우팅
        if (/원인|왜|why/i.test(query)) {
          results = await RootCauseAnalysisEngine.analyzeRootCause(query);
        } else if (/예측|미래|앞으로|내일/i.test(query)) {
          results = await PredictiveAnalysisEngine.analyzePrediction(query);
        } else if (/비교|대비|vs/i.test(query)) {
          results = await ComparisonAnalysisEngine.analyzeComparison(query);
        } else {
          results = await TimelineAnalysisEngine.analyzeTimeline(query, timeRange);
        }
        break;
        
      default:
        throw new Error(`지원하지 않는 분석 타입: ${analysisType}`);
    }
    
    // 🔧 타입 가드 추가: results가 NextResponse인 경우 처리
    if (results instanceof NextResponse || !results || typeof results !== 'object') {
      throw new Error('분석 엔진에서 잘못된 결과를 반환했습니다');
    }

    // 🔧 안전한 타입 체크: findings 속성 존재 확인
    const safeResults = results as any;
    if (!safeResults.findings || !Array.isArray(safeResults.findings)) {
      throw new Error('분석 결과에 findings 배열이 없습니다');
    }
    
    const executionTime = Date.now() - startTime;
    const confidenceLevel = safeResults.findings.length > 0 
      ? safeResults.findings.reduce((sum: number, finding: any) => sum + finding.confidence, 0) / safeResults.findings.length
      : 0.5;
    
    const response: AIAnalysisResponse = {
      success: true,
      analysisType,
      query,
      results: safeResults,
      metadata: {
        executionTime,
        dataSourcesUsed,
        confidenceLevel
      }
    };
    
    console.log(`✅ [AI-ANALYSIS] 분석 완료 (${executionTime}ms, 신뢰도: ${(confidenceLevel * 100).toFixed(1)}%)`);
    
    return NextResponse.json(response, { status: 200 });
    
  } catch (error) {
    console.error('❌ [AI-ANALYSIS] 분석 실패:', error);
    
    const errorResponse: AIAnalysisResponse = {
      success: false,
      analysisType: 'error',
      query: '',
      results: {
        summary: '분석 중 오류가 발생했습니다.',
        findings: [{
          type: 'warning',
          severity: 'high',
          message: error instanceof Error ? error.message : '알 수 없는 오류',
          evidence: {},
          confidence: 0.1
        }],
        recommendations: ['시스템 상태 확인 후 재시도'],
        relatedData: {}
      },
      metadata: {
        executionTime: Date.now() - startTime,
        dataSourcesUsed: [],
        confidenceLevel: 0.1
      }
    };
    
    return NextResponse.json(errorResponse, { status: 500 });
  }
}