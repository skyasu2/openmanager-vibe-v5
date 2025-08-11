/**
 * 🚀 AI 성능 벤치마크 API 엔드포인트
 * 
 * GET /api/ai/performance/benchmark?type=quick|full|target&iterations=3
 * 
 * 쿼리 매개변수:
 * - type: 벤치마크 유형 (quick, full, target)
 * - iterations: 반복 횟수 (기본값: 3)
 * - engine: 특정 엔진만 테스트 (simplified, performance-optimized, ultra-performance)
 * 
 * @author AI Systems Engineer
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAIPerformanceBenchmark, quickBenchmark, validatePerformanceTarget } from '@/services/ai/performance-benchmark';
import { getUltraPerformanceAIEngine } from '@/services/ai/ultra-performance-ai-engine';

export const runtime = 'edge';
export const maxDuration = 300; // 5분 제한

type ValidEngine = 'simplified' | 'performance-optimized' | 'ultra-performance' | 'optimizer';

interface BenchmarkResult {
  type: string;
  targetMs?: number;
  overallPassed?: boolean;
  recommendation?: string;
  query?: string;
  responseTime?: number;
  targetAchieved?: boolean;
  success?: boolean;
  optimizations?: string[];
  breakdown?: unknown;
  cacheType?: string;
  durationMs?: number;
  [key: string]: unknown;
}

export async function GET(request: NextRequest) {
  const startTime = performance.now();
  
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'quick';
    const iterations = parseInt(searchParams.get('iterations') || '3');
    const engine = searchParams.get('engine') as ValidEngine | null;
    const timeout = parseInt(searchParams.get('timeout') || '5000');
    
    console.log(`🚀 AI 성능 벤치마크 API 호출: ${type}`, {
      iterations,
      engine,
      timeout,
    });
    
    let result: BenchmarkResult;
    
    switch (type) {
      case 'quick': {
        console.log('⚡ 빠른 벤치마크 실행...');
        const benchmarkReport = await quickBenchmark();
        result = {
          ...benchmarkReport,
          type: 'quick',
        };
        break;
      }
      
      case 'target': {
        console.log('🎯 목표 달성 테스트 실행...');
        const benchmark = getAIPerformanceBenchmark();
        const targetResult = await benchmark.validateTargetAchievement(152, 20);
        const passed = await validatePerformanceTarget(152);
        
        result = {
          type: 'target-validation',
          targetMs: 152,
          ...targetResult,
          overallPassed: passed,
          recommendation: passed 
            ? 'Ultra Performance 엔진을 운영 환경에 배포할 수 있습니다!' 
            : '추가 최적화가 필요합니다.',
        };
        break;
      }
      
      case 'single-query': {
        const query = searchParams.get('query') || '서버 상태 확인';
        console.log(`🔍 단일 쿼리 성능 테스트: ${query}`);
        
        const ultraEngine = getUltraPerformanceAIEngine();
        const queryStart = performance.now();
        
        const queryResult = await ultraEngine.query({
          query,
          mode: 'local',
          options: {
            timeoutMs: 152,
            cached: true,
          },
        });
        
        const queryTime = performance.now() - queryStart;
        
        result = {
          type: 'single-query',
          query,
          responseTime: Math.round(queryTime * 100) / 100,
          targetAchieved: queryTime <= 152,
          success: queryResult.success,
          optimizations: queryResult.optimizationInfo?.optimizationsApplied || [],
          breakdown: queryResult.optimizationInfo?.responseTimeBreakdown,
          cacheType: queryResult.optimizationInfo?.cacheType,
        };
        break;
      }
      
      case 'monitor': {
        console.log('📈 실시간 성능 모니터링...');
        const benchmark = getAIPerformanceBenchmark();
        const monitorDuration = parseInt(searchParams.get('duration') || '30000'); // 30초 기본
        
        result = await benchmark.startRealTimeMonitoring(monitorDuration);
        result.durationMs = monitorDuration;
        break;
      }
      
      case 'full':
      default: {
        console.log('🏆 전체 벤치마크 실행...');
        const benchmark = getAIPerformanceBenchmark();
        
        const engines: ValidEngine[] = engine 
          ? [engine]
          : ['simplified', 'performance-optimized', 'ultra-performance'];
        
        result = await benchmark.runFullBenchmark({
          engines,
          testQueries: [
            '서버 상태 확인',
            'CPU 사용률 분석',
            '메모리 사용량 확인',
            '디스크 용량 체크',
            '네트워크 트래픽 모니터링',
            '전체 시스템 건강상태',
            '성능 지표 요약',
            '로그 분석 결과',
            '보안 상태 검사',
            '알림 설정 상태',
          ],
          iterations,
          concurrentUsers: 1,
          timeout,
        });
        break;
      }
    }
    
    const totalTime = performance.now() - startTime;
    
    // 성능 요약 추가
    const summary = {
      benchmarkType: type,
      totalDuration: Math.round(totalTime),
      timestamp: new Date().toISOString(),
      environment: {
        runtime: 'edge',
        nodeEnv: process.env.NODE_ENV,
      },
    };
    
    console.log(`✅ 벤치마크 완료: ${type}`, {
      duration: `${(totalTime / 1000).toFixed(1)}초`,
      success: true,
    });
    
    return NextResponse.json({
      success: true,
      data: result,
      summary,
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Type': 'application/json',
      },
    });
    
  } catch (error) {
    const totalTime = performance.now() - startTime;
    
    console.error('❌ 벤치마크 API 오류:', error);
    
    return NextResponse.json({
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        type: error instanceof Error ? error.constructor.name : 'UnknownError',
        duration: Math.round(totalTime),
      },
      recommendations: [
        '1. 모든 AI 엔진이 정상적으로 초기화되었는지 확인',
        '2. 환경 변수 설정 확인 (.env.local)',
        '3. 메모리 사용량이 제한을 초과하지 않았는지 확인',
        '4. 네트워크 연결 상태 확인',
      ],
    }, {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}

// POST 요청으로 커스텀 벤치마크 실행
export async function POST(request: NextRequest) {
  const startTime = performance.now();
  
  try {
    const body = await request.json();
    const {
      customQueries = ['서버 상태 확인'],
      engines = ['ultra-performance'] as ValidEngine[],
      iterations = 3,
      timeout = 5000,
      targetMs = 152,
    } = body;
    
    console.log('📝 커스텀 벤치마크 실행:', {
      queries: customQueries.length,
      engines,
      iterations,
    });
    
    const benchmark = getAIPerformanceBenchmark();
    const result = await benchmark.runFullBenchmark({
      engines: engines as ValidEngine[],
      testQueries: customQueries,
      iterations,
      concurrentUsers: 1,
      timeout,
    });
    
    // 목표 달성 분석
    const analysis = {
      overallTargetAchieved: false,
      bestPerformer: '',
      worstPerformer: '',
      averageImprovement: 0,
      recommendations: [] as string[],
    };
    
    if (result.engineResults.length > 0) {
      const bestEngine = result.engineResults.reduce((best, current) => 
        current.averageResponseTime < best.averageResponseTime ? current : best
      );
      const worstEngine = result.engineResults.reduce((worst, current) => 
        current.averageResponseTime > worst.averageResponseTime ? current : worst
      );
      
      analysis.bestPerformer = bestEngine.engineName;
      analysis.worstPerformer = worstEngine.engineName;
      analysis.overallTargetAchieved = bestEngine.averageResponseTime <= targetMs && 
                                      bestEngine.targetAchievedRate >= 0.8;
      
      // 개선율 계산
      const baselineEngine = result.engineResults.find(e => e.engineName === 'simplified');
      if (baselineEngine && bestEngine.engineName !== 'simplified') {
        analysis.averageImprovement = ((baselineEngine.averageResponseTime - bestEngine.averageResponseTime) / 
                                     baselineEngine.averageResponseTime) * 100;
      }
      
      // 추천사항 생성
      if (analysis.overallTargetAchieved) {
        analysis.recommendations.push('🚀 성능 목표 달성! 운영 환경 배포 권장');
      } else {
        analysis.recommendations.push('⚠️ 추가 최적화 필요');
        if (bestEngine.cacheHitRate < 0.7) {
          analysis.recommendations.push('💾 캐시 적중률 개선 필요');
        }
        if (bestEngine.errorRate > 0.05) {
          analysis.recommendations.push('🔧 에러율 개선 필요');
        }
      }
    }
    
    const totalTime = performance.now() - startTime;
    
    return NextResponse.json({
      success: true,
      data: {
        ...result,
        analysis,
        customConfig: {
          customQueries,
          engines,
          iterations,
          timeout,
          targetMs,
        },
      },
      summary: {
        benchmarkType: 'custom',
        totalDuration: Math.round(totalTime),
        timestamp: new Date().toISOString(),
      },
    });
    
  } catch (error) {
    const totalTime = performance.now() - startTime;
    
    console.error('❌ 커스텀 벤치마크 API 오류:', error);
    
    return NextResponse.json({
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        duration: Math.round(totalTime),
      },
    }, {
      status: 500,
    });
  }
}