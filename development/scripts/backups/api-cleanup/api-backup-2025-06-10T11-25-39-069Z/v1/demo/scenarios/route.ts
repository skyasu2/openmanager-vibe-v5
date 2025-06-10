/**
 * 🎭 API v1 - 시연용 시나리오 데이터 엔드포인트
 *
 * 경쟁 프로젝트 시연을 위한 현실적인 데이터 생성
 * - 5가지 주요 시나리오 지원
 * - 실시간 스트림 시뮬레이션
 * - AI 학습용 다양한 패턴 제공
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  RealisticDataGenerator,
  DemoScenario,
  ServerMetrics,
  DemoLogEntry,
} from '@/services/data-generator/RealisticDataGenerator';

// 🎭 글로벌 데이터 생성기 인스턴스
const demoGenerator = new RealisticDataGenerator();

// 📊 시나리오별 사전 정의된 데이터셋
const demoScenarios = {
  normal: {
    name: '정상 운영 상태',
    description:
      '일반적인 업무시간 중 안정적인 서버 운영 상태를 시뮬레이션합니다.',
    icon: '🟢',
    features: ['안정적인 메트릭', '낮은 에러율', '예측 가능한 패턴'],
  },
  spike: {
    name: '갑작스런 트래픽 증가',
    description:
      '마케팅 캠페인이나 바이럴 컨텐츠로 인한 급격한 사용자 증가를 시뮬레이션합니다.',
    icon: '📈',
    features: ['트래픽 스파이크', 'CPU/메모리 부하', '응답시간 증가'],
  },
  memory_leak: {
    name: '메모리 누수 발생',
    description:
      '애플리케이션 버그로 인한 점진적인 메모리 증가와 성능 저하를 시뮬레이션합니다.',
    icon: '🔄',
    features: ['점진적 메모리 증가', '성능 저하', '시스템 불안정'],
  },
  ddos: {
    name: 'DDoS 공격 시뮬레이션',
    description:
      '분산 서비스 거부 공격으로 인한 시스템 부하와 보안 위협을 시뮬레이션합니다.',
    icon: '🛡️',
    features: ['네트워크 부하', '보안 경고', '서비스 불가'],
  },
  performance_degradation: {
    name: '점진적 성능 저하',
    description:
      '디스크 공간 부족이나 데이터베이스 성능 저하로 인한 시스템 악화를 시뮬레이션합니다.',
    icon: '📉',
    features: ['디스크 사용량 증가', '응답시간 지연', '처리 성능 저하'],
  },
};

/**
 * 🎯 시나리오 데이터 생성 및 조회
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await request.json();
    const { scenario, count = 50, includeLog = true, stream = false } = body;

    // 시나리오 검증
    if (!scenario || !Object.keys(demoScenarios).includes(scenario)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid scenario',
          availableScenarios: Object.keys(demoScenarios),
          code: 'INVALID_SCENARIO',
        },
        { status: 400 }
      );
    }

    console.log(`🎭 시나리오 데이터 생성: ${scenario}, count: ${count}`);

    // 시나리오 설정
    demoGenerator.setScenario(scenario as DemoScenario);

    // 메트릭 데이터 생성
    const metrics: ServerMetrics[] =
      demoGenerator.generateTimeSeriesData(count);

    // 로그 데이터 생성 (선택적)
    const logs: DemoLogEntry[] = includeLog
      ? demoGenerator.generateLogEntries(Math.min(count, 30))
      : [];

    // 시나리오 정보
    const scenarioInfo = demoGenerator.getCurrentScenarioInfo();

    // 응답 구성
    const response = {
      success: true,
      scenario: {
        current: scenario,
        info: demoScenarios[scenario as keyof typeof demoScenarios],
        config: scenarioInfo,
      },
      data: {
        metrics,
        logs,
        summary: {
          metricsCount: metrics.length,
          logsCount: logs.length,
          timeRange: {
            start: metrics[0]?.timestamp,
            end: metrics[metrics.length - 1]?.timestamp,
          },
          keyIndicators: calculateKeyIndicators(metrics),
        },
      },
      meta: {
        processingTime: Date.now() - startTime,
        apiVersion: 'v1.0.0',
        generator: 'RealisticDataGenerator',
        timestamp: new Date().toISOString(),
      },
    };

    console.log(`✅ 시나리오 데이터 생성 완료: ${scenario}`, {
      metricsGenerated: metrics.length,
      logsGenerated: logs.length,
      processingTime: Date.now() - startTime,
    });

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('❌ 시나리오 데이터 생성 오류:', error);

    return NextResponse.json(
      {
        success: false,
        error: '시나리오 데이터 생성 중 오류가 발생했습니다',
        code: 'GENERATION_ERROR',
        message: error.message,
        meta: {
          processingTime: Date.now() - startTime,
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}

/**
 * 🔍 사용 가능한 시나리오 목록 및 정보
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action');
    const scenario = url.searchParams.get('scenario') as DemoScenario;

    switch (action) {
      case 'list':
        return NextResponse.json({
          scenarios: demoScenarios,
          count: Object.keys(demoScenarios).length,
          timestamp: new Date().toISOString(),
        });

      case 'info':
        if (scenario && demoScenarios[scenario as keyof typeof demoScenarios]) {
          demoGenerator.setScenario(scenario);
          const scenarioInfo = demoGenerator.getCurrentScenarioInfo();

          return NextResponse.json({
            scenario: demoScenarios[scenario as keyof typeof demoScenarios],
            config: scenarioInfo,
            sampleData: {
              metrics: demoGenerator.generateTimeSeriesData(5),
              logs: demoGenerator.generateLogEntries(3),
            },
            timestamp: new Date().toISOString(),
          });
        } else {
          return NextResponse.json(
            {
              error: 'Scenario not found',
              availableScenarios: Object.keys(demoScenarios),
            },
            { status: 404 }
          );
        }

      case 'preview':
        // 모든 시나리오의 간단한 미리보기
        const previews: Record<string, any> = {};
        for (const [key, info] of Object.entries(demoScenarios)) {
          demoGenerator.setScenario(key as DemoScenario);
          const sampleMetrics = demoGenerator.generateTimeSeriesData(3);

          previews[key] = {
            info,
            sampleMetrics,
            indicators: calculateKeyIndicators(sampleMetrics),
          };
        }

        return NextResponse.json({
          previews,
          timestamp: new Date().toISOString(),
        });

      default:
        return NextResponse.json({
          name: 'Demo Scenarios API v1',
          version: 'v1.0.0',
          description: '시연용 현실적 서버 시나리오 데이터 생성',
          scenarios: Object.keys(demoScenarios),
          endpoints: {
            'POST /api/v1/demo/scenarios': '시나리오 데이터 생성',
            'GET /api/v1/demo/scenarios?action=list': '시나리오 목록',
            'GET /api/v1/demo/scenarios?action=info&scenario=<name>':
              '시나리오 상세 정보',
            'GET /api/v1/demo/scenarios?action=preview':
              '모든 시나리오 미리보기',
          },
          usage: {
            generateData:
              'POST { "scenario": "ddos", "count": 50, "includeLog": true }',
            quickPreview: 'GET ?action=info&scenario=memory_leak',
          },
          timestamp: new Date().toISOString(),
        });
    }
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process request',
        message: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * 📊 핵심 지표 계산
 */
function calculateKeyIndicators(metrics: ServerMetrics[]) {
  if (!metrics || metrics.length === 0) {
    return {
      avgCPU: 0,
      avgMemory: 0,
      avgResponseTime: 0,
      maxCPU: 0,
      maxMemory: 0,
      totalThroughput: 0,
    };
  }

  const cpuValues = metrics.map(m => m.cpu);
  const memoryValues = metrics.map(m => m.memory);
  const responseTimeValues = metrics.map(m => m.responseTime);
  const throughputValues = metrics.map(m => m.throughput || 0);

  return {
    avgCPU:
      Math.round(
        (cpuValues.reduce((sum, val) => sum + val, 0) / cpuValues.length) * 100
      ) / 100,
    avgMemory:
      Math.round(
        (memoryValues.reduce((sum, val) => sum + val, 0) /
          memoryValues.length) *
          100
      ) / 100,
    avgResponseTime:
      Math.round(
        (responseTimeValues.reduce((sum, val) => sum + val, 0) /
          responseTimeValues.length) *
          100
      ) / 100,
    maxCPU: Math.max(...cpuValues),
    maxMemory: Math.max(...memoryValues),
    totalThroughput: throughputValues.reduce((sum, val) => sum + val, 0),
    trend: {
      cpu: calculateTrend(cpuValues),
      memory: calculateTrend(memoryValues),
      responseTime: calculateTrend(responseTimeValues),
    },
  };
}

/**
 * 📈 트렌드 계산
 */
function calculateTrend(values: number[]): string {
  if (values.length < 2) return 'stable';

  const first = values[0];
  const last = values[values.length - 1];
  const change = ((last - first) / first) * 100;

  if (Math.abs(change) < 5) return 'stable';
  return change > 0 ? 'increasing' : 'decreasing';
}
