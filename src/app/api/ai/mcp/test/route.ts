/**
 * 🧪 MCP 오케스트레이터 테스트 엔드포인트
 * 
 * MCP 시스템의 기능 검증 및 디버깅용
 */

import { NextRequest, NextResponse } from 'next/server';
import { MCPOrchestrator, MCPRequest } from '../../../../../core/mcp/mcp-orchestrator';

/**
 * 🧪 MCP 기능 테스트
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await request.json();
    const testType = body.testType || 'basic';

    console.log(`🧪 MCP 테스트 시작: ${testType}`);

    const orchestrator = new MCPOrchestrator();
    const results: any[] = [];

    // 테스트 시나리오들
    const testScenarios = getTestScenarios(testType);

    for (const scenario of testScenarios) {
      try {
        console.log(`🔍 테스트 실행: ${scenario.name}`);
        
        const result = await orchestrator.process(scenario.request);
        
        results.push({
          scenario: scenario.name,
          success: true,
          tools_used: result.tools_used,
          confidence: result.confidence,
          processing_time: result.processing_time,
          sample_result: scenario.extractSample ? scenario.extractSample(result.result) : result.result
        });

        console.log(`✅ 테스트 성공: ${scenario.name}`, {
          toolsUsed: result.tools_used,
          confidence: result.confidence
        });

      } catch (error: any) {
        console.error(`❌ 테스트 실패: ${scenario.name}`, error);
        
        results.push({
          scenario: scenario.name,
          success: false,
          error: error.message,
          processing_time: 0
        });
      }
    }

    const totalTime = Date.now() - startTime;
    const successCount = results.filter(r => r.success).length;

    return NextResponse.json({
      success: true,
      test_type: testType,
      summary: {
        total_tests: results.length,
        successful_tests: successCount,
        success_rate: Math.round((successCount / results.length) * 100),
        total_time: totalTime
      },
      results
    });

  } catch (error: any) {
    console.error('❌ MCP 테스트 오류:', error);
    
    return NextResponse.json({
      success: false,
      error: 'MCP 테스트 실행 중 오류 발생',
      message: error.message,
      processing_time: Date.now() - startTime
    }, { status: 500 });
  }
}

/**
 * 📋 테스트 시나리오 목록
 */
function getTestScenarios(testType: string): any[] {
  const baseScenarios = [
    {
      name: '통계 분석 테스트',
      request: {
        query: '시스템 성능 통계를 분석해주세요',
        parameters: {
          data: [85, 92, 78, 91, 88, 94, 76, 89, 95, 87],
          detailed: true
        },
        context: {
          session_id: 'test_session_stats',
          urgency: 'medium'
        }
      } as MCPRequest,
      extractSample: (result: any) => ({
        analysis_type: result.detailed_results?.[0]?.analysis_type,
        confidence: result.confidence
      })
    },
    {
      name: '이상 탐지 테스트',
      request: {
        query: '시스템에서 이상한 패턴을 찾아주세요',
        parameters: {
          metrics: {
            cpu: [45, 47, 46, 89, 48, 46, 47, 92, 45],
            memory: [60, 62, 61, 58, 95, 62, 61, 59, 60]
          },
          sensitivity: 0.1
        },
        context: {
          session_id: 'test_session_anomaly',
          urgency: 'high'
        }
      } as MCPRequest,
      extractSample: (result: any) => ({
        analysis_type: result.detailed_results?.[0]?.analysis_type,
        tools_count: result.summary?.successful_tools
      })
    }
  ];

  const advancedScenarios = [
    {
      name: '예측 분석 테스트',
      request: {
        query: '향후 시스템 부하를 예측해주세요',
        parameters: {
          historical_data: [65, 68, 72, 69, 71, 74, 70, 73, 75, 72],
          forecast_periods: 5,
          model_type: 'simple'
        },
        context: {
          session_id: 'test_session_forecast',
          urgency: 'medium'
        }
      } as MCPRequest,
      extractSample: (result: any) => ({
        has_predictions: !!result.detailed_results?.find((r: any) => r.analysis_type === 'time_series_forecast')
      })
    },
    {
      name: '패턴 인식 테스트',
      request: {
        query: '반복되는 패턴을 찾아주세요',
        parameters: {
          data: generateTimeSeriesData(),
          pattern_types: ['daily', 'weekly']
        },
        context: {
          session_id: 'test_session_pattern',
          urgency: 'low'
        }
      } as MCPRequest,
      extractSample: (result: any) => ({
        patterns_found: result.detailed_results?.length || 0
      })
    },
    {
      name: '최적화 제안 테스트',
      request: {
        query: '시스템 성능을 최적화하는 방법을 제안해주세요',
        parameters: {
          current_state: {
            cpu: 85,
            memory: 78,
            disk: 65,
            response_time: 245
          },
          target_metrics: {
            cpu: 70,
            memory: 60,
            response_time: 200
          }
        },
        context: {
          session_id: 'test_session_optimization',
          urgency: 'medium'
        }
      } as MCPRequest,
      extractSample: (result: any) => ({
        has_recommendations: !!result.recommendations?.length
      })
    }
  ];

  if (testType === 'advanced') {
    return [...baseScenarios, ...advancedScenarios];
  }

  return baseScenarios;
}

/**
 * 📊 시계열 데이터 생성
 */
function generateTimeSeriesData(): number[] {
  const data: number[] = [];
  const baseValue = 70;
  
  for (let i = 0; i < 24; i++) {
    // 일일 패턴 시뮬레이션 (업무시간 높은 부하)
    const hourPattern = i >= 9 && i <= 17 ? 1.3 : 0.8;
    const noise = (Math.random() - 0.5) * 10;
    data.push(Math.max(10, baseValue * hourPattern + noise));
  }
  
  return data;
}

/**
 * 📋 테스트 정보 반환
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    if (action === 'scenarios') {
      return NextResponse.json({
        available_tests: [
          {
            type: 'basic',
            name: '기본 테스트',
            description: '통계 분석과 이상 탐지 기본 기능 테스트',
            scenarios: 2
          },
          {
            type: 'advanced',
            name: '고급 테스트',
            description: '모든 MCP 도구의 종합 테스트',
            scenarios: 5
          }
        ],
        usage: {
          'POST /api/ai/mcp/test': '테스트 실행 (body: {testType: "basic" | "advanced"})',
          'GET /api/ai/mcp/test?action=scenarios': '사용 가능한 테스트 시나리오 목록'
        }
      });
    }

    return NextResponse.json({
      service: 'MCP Orchestrator Test Suite',
      version: '1.0.0',
      description: 'MCP 시스템의 기능 검증 및 성능 테스트',
      available_actions: ['scenarios'],
      test_types: ['basic', 'advanced']
    });

  } catch (error: any) {
    return NextResponse.json({
      error: 'Test suite error',
      message: error.message
    }, { status: 500 });
  }
} 