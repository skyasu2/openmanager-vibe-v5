/**
 * 🌊 API v1 - 실시간 스트림 데이터 엔드포인트
 * 
 * 시연용 실시간 데이터 스트림 시뮬레이션
 * - WebSocket 스타일 데이터 스트림
 * - 실시간 메트릭 업데이트
 * - 이벤트 기반 데이터 생성
 */

import { NextRequest, NextResponse } from 'next/server';
import { RealisticDataGenerator, DemoScenario } from '@/services/data-generator/RealisticDataGenerator';

// 🌊 스트림 생성기 인스턴스
const streamGenerator = new RealisticDataGenerator();

// 📊 스트림 세션 관리
const activeStreams = new Map<string, {
  scenario: DemoScenario;
  startTime: Date;
  dataPoints: number;
  lastUpdate: Date;
}>();

/**
 * 🎯 실시간 데이터 스트림 생성
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await request.json();
    const { 
      scenario = 'normal', 
      interval = 1000, // ms
      duration = 60000, // ms (1분)
      sessionId,
      eventMode = false
    } = body;

    // 세션 ID 생성 또는 검증
    const streamId = sessionId || `stream_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    console.log(`🌊 실시간 스트림 시작: ${streamId}, 시나리오: ${scenario}`);

    // 시나리오 설정
    streamGenerator.setScenario(scenario as DemoScenario);

    // 스트림 세션 등록
    activeStreams.set(streamId, {
      scenario: scenario as DemoScenario,
      startTime: new Date(),
      dataPoints: 0,
      lastUpdate: new Date()
    });

    // 실시간 데이터 생성 (시뮬레이션)
    const dataPoints = Math.floor(duration / interval);
    const streamData = [];
    
    for (let i = 0; i < Math.min(dataPoints, 100); i++) { // 최대 100개 포인트
      const timestamp = new Date(Date.now() + i * interval);
      const metrics = streamGenerator.generateTimeSeriesData(1)[0];
      
      streamData.push({
        ...metrics,
        timestamp: timestamp.toISOString(),
        streamId,
        sequenceNumber: i + 1,
        events: eventMode ? generateStreamEvents(scenario as DemoScenario, i) : []
      });
    }

    // 스트림 통계
    const streamStats = {
      sessionId: streamId,
      scenario,
      dataPoints: streamData.length,
      totalDuration: duration,
      interval,
      estimatedEndTime: new Date(Date.now() + duration).toISOString(),
      performance: {
        avgCPU: streamData.reduce((sum, d) => sum + d.cpu, 0) / streamData.length,
        avgMemory: streamData.reduce((sum, d) => sum + d.memory, 0) / streamData.length,
        peakResponseTime: Math.max(...streamData.map(d => d.responseTime))
      }
    };

    // 응답 구성
    const response = {
      success: true,
      stream: {
        id: streamId,
        status: 'active',
        scenario,
        config: {
          interval,
          duration,
          eventMode
        }
      },
      data: streamData,
      stats: streamStats,
      meta: {
        processingTime: Date.now() - startTime,
        apiVersion: 'v1.0.0',
        timestamp: new Date().toISOString()
      }
    };

    console.log(`✅ 스트림 데이터 생성 완료: ${streamId}`, {
      dataPoints: streamData.length,
      duration: duration,
      processingTime: Date.now() - startTime
    });

    return NextResponse.json(response);

  } catch (error: any) {
    console.error('❌ 스트림 데이터 생성 오류:', error);
    
    return NextResponse.json({
      success: false,
      error: '스트림 데이터 생성 중 오류가 발생했습니다',
      code: 'STREAM_ERROR',
      message: error.message,
      meta: {
        processingTime: Date.now() - startTime,
        timestamp: new Date().toISOString()
      }
    }, { status: 500 });
  }
}

/**
 * 🔍 스트림 상태 조회 및 관리
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action');
    const streamId = url.searchParams.get('streamId');

    switch (action) {
      case 'status':
        if (streamId && activeStreams.has(streamId)) {
          const streamInfo = activeStreams.get(streamId)!;
          return NextResponse.json({
            streamId,
            status: 'active',
            info: streamInfo,
            uptime: Date.now() - streamInfo.startTime.getTime(),
            timestamp: new Date().toISOString()
          });
        } else {
          return NextResponse.json({
            error: 'Stream not found',
            streamId,
            activeStreams: Array.from(activeStreams.keys())
          }, { status: 404 });
        }

      case 'list':
        const activeStreamsList = Array.from(activeStreams.entries()).map(([id, info]) => ({
          streamId: id,
          scenario: info.scenario,
          startTime: info.startTime,
          uptime: Date.now() - info.startTime.getTime(),
          dataPoints: info.dataPoints
        }));
        
        return NextResponse.json({
          activeStreams: activeStreamsList,
          count: activeStreamsList.length,
          timestamp: new Date().toISOString()
        });

      case 'cleanup':
        // 5분 이상 된 스트림 정리
        const cutoffTime = Date.now() - 5 * 60 * 1000;
        let cleaned = 0;
        
        for (const [id, info] of activeStreams.entries()) {
          if (info.startTime.getTime() < cutoffTime) {
            activeStreams.delete(id);
            cleaned++;
          }
        }
        
        return NextResponse.json({
          message: 'Stream cleanup completed',
          cleanedStreams: cleaned,
          remainingStreams: activeStreams.size,
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json({
          name: 'Stream Data API v1',
          version: 'v1.0.0',
          description: '실시간 스트림 데이터 시뮬레이션',
          endpoints: {
            'POST /api/v1/demo/stream': '스트림 시작',
            'GET /api/v1/demo/stream?action=status&streamId=<id>': '스트림 상태',
            'GET /api/v1/demo/stream?action=list': '활성 스트림 목록',
            'GET /api/v1/demo/stream?action=cleanup': '스트림 정리'
          },
          usage: {
            startStream: 'POST { "scenario": "ddos", "interval": 1000, "duration": 60000 }',
            checkStatus: 'GET ?action=status&streamId=stream_xxx'
          },
          activeStreams: activeStreams.size,
          timestamp: new Date().toISOString()
        });
    }

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: 'Failed to process stream request',
      message: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

/**
 * 🎪 스트림 종료
 */
export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const streamId = url.searchParams.get('streamId');

    if (!streamId) {
      return NextResponse.json({
        error: 'Stream ID required',
        code: 'MISSING_STREAM_ID'
      }, { status: 400 });
    }

    if (activeStreams.has(streamId)) {
      const streamInfo = activeStreams.get(streamId)!;
      activeStreams.delete(streamId);
      
      console.log(`🛑 스트림 종료: ${streamId}`);
      
      return NextResponse.json({
        success: true,
        message: 'Stream terminated',
        streamId,
        finalStats: {
          scenario: streamInfo.scenario,
          duration: Date.now() - streamInfo.startTime.getTime(),
          dataPoints: streamInfo.dataPoints
        },
        timestamp: new Date().toISOString()
      });
    } else {
      return NextResponse.json({
        error: 'Stream not found',
        streamId,
        availableStreams: Array.from(activeStreams.keys())
      }, { status: 404 });
    }

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: 'Failed to terminate stream',
      message: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

/**
 * 🎭 스트림 이벤트 생성
 */
function generateStreamEvents(scenario: DemoScenario, sequenceNumber: number): Array<{
  type: string;
  message: string;
  severity: string;
  timestamp: string;
}> {
  const events = [];
  const timestamp = new Date().toISOString();

  // 시나리오별 이벤트 생성
  switch (scenario) {
    case 'ddos':
      if (sequenceNumber % 10 === 0) {
        events.push({
          type: 'security_alert',
          message: `DDoS 공격 패턴 감지 - 연결 수 급증`,
          severity: 'critical',
          timestamp
        });
      }
      if (sequenceNumber % 15 === 0) {
        events.push({
          type: 'network_overload',
          message: '네트워크 대역폭 임계치 초과',
          severity: 'high',
          timestamp
        });
      }
      break;

    case 'memory_leak':
      if (sequenceNumber % 20 === 0) {
        events.push({
          type: 'memory_warning',
          message: `메모리 사용량 지속적 증가 감지 (${60 + sequenceNumber}%)`,
          severity: 'warning',
          timestamp
        });
      }
      break;

    case 'spike':
      if (sequenceNumber === 10) {
        events.push({
          type: 'traffic_spike',
          message: '예상치 못한 트래픽 급증 시작',
          severity: 'info',
          timestamp
        });
      }
      if (sequenceNumber === 30) {
        events.push({
          type: 'auto_scaling',
          message: '자동 스케일링 트리거됨',
          severity: 'info',
          timestamp
        });
      }
      break;

    case 'performance_degradation':
      if (sequenceNumber % 25 === 0) {
        events.push({
          type: 'performance_alert',
          message: '응답 시간 지속적 증가 추세',
          severity: 'warning',
          timestamp
        });
      }
      break;

    default: // normal
      if (sequenceNumber % 50 === 0) {
        events.push({
          type: 'routine_check',
          message: '정기 시스템 점검 완료',
          severity: 'info',
          timestamp
        });
      }
      break;
  }

  return events;
} 