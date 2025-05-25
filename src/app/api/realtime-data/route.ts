/**
 * Realtime Data API
 * 
 * 📊 실시간 데이터 조회 API
 * - 테스트 환경: DB 데이터만 확인
 * - 실제 환경: 실시간 데이터 + DB 데이터 수집
 */

import { NextRequest, NextResponse } from 'next/server';
import { serverDataGenerator } from '../../../services/collectors/ServerDataGenerator';

interface RealtimeDataQuery {
  serverId?: string;
  timeRange?: number; // 분 단위
  includeHistory?: boolean;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const serverId = searchParams.get('serverId') || undefined;
    const timeRange = parseInt(searchParams.get('timeRange') || '10'); // 기본 10분
    const includeHistory = searchParams.get('includeHistory') === 'true';
    
    console.log(`📊 Realtime data request: serverId=${serverId}, timeRange=${timeRange}min`);

    // 환경 감지
    const environment = detectEnvironment();
    
    if (environment === 'production') {
      // 실제 환경: 실시간 데이터 + DB 데이터 수집
      return await handleProductionDataRequest({
        serverId,
        timeRange,
        includeHistory
      });
    } else {
      // 테스트 환경: DB 데이터만 확인
      return await handleTestDataRequest({
        serverId,
        timeRange,
        includeHistory
      });
    }

  } catch (error) {
    console.error('❌ Realtime data request failed:', error);
    
    return NextResponse.json({
      success: false,
      error: '실시간 데이터 조회에 실패했습니다.',
      message: error instanceof Error ? error.message : '알 수 없는 오류'
    }, { status: 500 });
  }
}

/**
 * 프로덕션 환경 데이터 처리
 */
async function handleProductionDataRequest(query: RealtimeDataQuery) {
  console.log('🏭 Production environment: collecting real + DB data');
  
  try {
    // 1. 실시간 데이터 수집 (SSH, SNMP, Agent API 등)
    const realtimeData = await collectRealServerData(query.serverId);
    
    // 2. DB에서 히스토리 데이터 조회
    const historyData = query.includeHistory 
      ? await queryHistoryData(query.serverId, query.timeRange || 10)
      : [];
    
    // 3. 데이터 병합 및 분석
    const mergedData = mergeRealtimeAndHistory(realtimeData, historyData);
    
    return NextResponse.json({
      success: true,
      environment: 'production',
      data: {
        realtime: realtimeData,
        history: historyData,
        merged: mergedData,
        sources: ['live-servers', 'database'],
        timestamp: new Date().toISOString()
      },
      metadata: {
        serverCount: realtimeData.length,
        historyPoints: historyData.length,
        timeRange: `${query.timeRange} minutes`,
        dataFreshness: 'live'
      }
    });

  } catch (error) {
    console.error('Production data collection failed:', error);
    
    // 실패 시 DB 데이터만 반환
    return await handleTestDataRequest(query);
  }
}

/**
 * 테스트 환경 데이터 처리
 */
async function handleTestDataRequest(query: RealtimeDataQuery) {
  console.log('🧪 Test environment: DB data only');
  
  try {
    // 1. 실시간 테이블에서 데이터 조회
    const realtimeData = await queryRealtimeTable(query.serverId, query.timeRange || 10);
    
    // 2. 히스토리 테이블에서 데이터 조회 (요청 시)
    const historyData = query.includeHistory 
      ? await queryHistoryTable(query.serverId, 60) // 1시간
      : [];
    
    // 3. 데이터 생성기 상태 확인
    const generatorStatus = serverDataGenerator.getGenerationStatus();
    
    return NextResponse.json({
      success: true,
      environment: 'test',
      data: {
        realtime: realtimeData,
        history: historyData,
        generator: {
          isGenerating: generatorStatus.isGenerating,
          remainingTime: generatorStatus.remainingTime,
          patterns: generatorStatus.patterns
        },
        sources: ['database-only'],
        timestamp: new Date().toISOString()
      },
      metadata: {
        serverCount: realtimeData.length,
        historyPoints: historyData.length,
        timeRange: `${query.timeRange} minutes`,
        dataFreshness: generatorStatus.isGenerating ? 'generating' : 'static',
        recommendation: generatorStatus.isGenerating 
          ? '실시간 데이터 생성 중입니다.'
          : '랜딩페이지에서 "시작" 버튼을 눌러 실시간 데이터를 생성하세요.'
      }
    });

  } catch (error) {
    console.error('Test data query failed:', error);
    
    return NextResponse.json({
      success: false,
      error: 'DB 데이터 조회에 실패했습니다.',
      message: error instanceof Error ? error.message : '알 수 없는 오류'
    }, { status: 500 });
  }
}

/**
 * 실제 서버 데이터 수집
 */
async function collectRealServerData(serverId?: string): Promise<any[]> {
  // 실제 구현 시:
  // - SSH 명령어 실행
  // - SNMP 쿼리
  // - Agent API 호출
  // - 클라우드 API 호출
  
  console.log('🔍 Collecting real server data...');
  
  // 현재는 시뮬레이션 데이터 반환
  return generateMockRealtimeData(serverId);
}

/**
 * 실시간 테이블 쿼리
 */
async function queryRealtimeTable(serverId?: string, timeRangeMinutes: number = 10): Promise<any[]> {
  console.log(`🗄️ Querying realtime table (${timeRangeMinutes}min)`);
  
  // 실제 구현 시:
  // const cutoffTime = new Date(Date.now() - timeRangeMinutes * 60 * 1000);
  // const query = `
  //   SELECT * FROM server_metrics_realtime 
  //   WHERE timestamp >= $1 
  //   ${serverId ? 'AND server_id = $2' : ''}
  //   ORDER BY timestamp DESC
  // `;
  // return await db.query(query, [cutoffTime, serverId].filter(Boolean));
  
  // 현재는 시뮬레이션 데이터 반환
  return generateMockRealtimeData(serverId);
}

/**
 * 히스토리 테이블 쿼리
 */
async function queryHistoryTable(serverId?: string, timeRangeMinutes: number = 60): Promise<any[]> {
  console.log(`🗄️ Querying history table (${timeRangeMinutes}min)`);
  
  // 실제 구현 시:
  // const cutoffTime = new Date(Date.now() - timeRangeMinutes * 60 * 1000);
  // const query = `
  //   SELECT * FROM server_metrics_history 
  //   WHERE timestamp >= $1 
  //   ${serverId ? 'AND server_id = $2' : ''}
  //   ORDER BY timestamp DESC
  // `;
  // return await db.query(query, [cutoffTime, serverId].filter(Boolean));
  
  // 현재는 시뮬레이션 데이터 반환
  return generateMockHistoryData(serverId, timeRangeMinutes);
}

/**
 * 히스토리 데이터 쿼리 (일반)
 */
async function queryHistoryData(serverId?: string, timeRangeMinutes: number = 10): Promise<any[]> {
  return await queryHistoryTable(serverId, timeRangeMinutes);
}

/**
 * 실시간 데이터와 히스토리 데이터 병합
 */
function mergeRealtimeAndHistory(realtimeData: any[], historyData: any[]): any {
  return {
    totalDataPoints: realtimeData.length + historyData.length,
    timeRange: {
      start: historyData[historyData.length - 1]?.timestamp || new Date(),
      end: realtimeData[0]?.timestamp || new Date()
    },
    trends: {
      cpu: calculateTrend([...historyData, ...realtimeData], 'cpu'),
      memory: calculateTrend([...historyData, ...realtimeData], 'memory'),
      disk: calculateTrend([...historyData, ...realtimeData], 'disk')
    },
    alerts: detectAnomalies([...historyData, ...realtimeData])
  };
}

/**
 * 트렌드 계산
 */
function calculateTrend(data: any[], metric: string): any {
  if (data.length < 2) return { trend: 'stable', change: 0 };
  
  const recent = data.slice(0, Math.min(10, data.length));
  const avg = recent.reduce((sum, item) => sum + (item[metric] || 0), 0) / recent.length;
  const older = data.slice(-Math.min(10, data.length));
  const oldAvg = older.reduce((sum, item) => sum + (item[metric] || 0), 0) / older.length;
  
  const change = avg - oldAvg;
  const trend = Math.abs(change) < 2 ? 'stable' : change > 0 ? 'increasing' : 'decreasing';
  
  return { trend, change: Math.round(change * 100) / 100 };
}

/**
 * 이상 징후 감지
 */
function detectAnomalies(data: any[]): any[] {
  const alerts = [];
  
  for (const item of data.slice(0, 5)) { // 최근 5개 데이터만 체크
    if (item.cpu > 90) {
      alerts.push({
        type: 'cpu_high',
        severity: 'critical',
        message: `${item.hostname} CPU 사용률 높음: ${item.cpu}%`,
        timestamp: item.timestamp
      });
    }
    
    if (item.memory > 95) {
      alerts.push({
        type: 'memory_high',
        severity: 'critical',
        message: `${item.hostname} 메모리 사용률 높음: ${item.memory}%`,
        timestamp: item.timestamp
      });
    }
  }
  
  return alerts;
}

/**
 * 환경 감지
 */
function detectEnvironment(): 'production' | 'test' {
  return process.env.NODE_ENV === 'production' && process.env.DEPLOY_MODE === 'production'
    ? 'production'
    : 'test';
}

/**
 * 모의 실시간 데이터 생성
 */
function generateMockRealtimeData(serverId?: string): any[] {
  const servers = serverId 
    ? [{ id: serverId, hostname: `server-${serverId}` }]
    : [
        { id: 'web-01', hostname: 'web-server-01' },
        { id: 'api-01', hostname: 'api-server-01' },
        { id: 'db-01', hostname: 'db-server-01' }
      ];
  
  return servers.map(server => ({
    serverId: server.id,
    hostname: server.hostname,
    timestamp: new Date(),
    cpu: Math.round((Math.random() * 60 + 20) * 100) / 100,
    memory: Math.round((Math.random() * 50 + 30) * 100) / 100,
    disk: Math.round((Math.random() * 40 + 20) * 100) / 100,
    network: {
      bytesIn: Math.floor(Math.random() * 1000000),
      bytesOut: Math.floor(Math.random() * 800000),
      latency: Math.round((Math.random() * 30 + 10) * 100) / 100
    }
  }));
}

/**
 * 모의 히스토리 데이터 생성
 */
function generateMockHistoryData(serverId?: string, timeRangeMinutes: number = 60): any[] {
  const servers = serverId 
    ? [{ id: serverId, hostname: `server-${serverId}` }]
    : [
        { id: 'web-01', hostname: 'web-server-01' },
        { id: 'api-01', hostname: 'api-server-01' },
        { id: 'db-01', hostname: 'db-server-01' }
      ];
  
  const dataPoints = [];
  const now = new Date();
  
  for (let i = 0; i < timeRangeMinutes; i += 5) { // 5분 간격
    for (const server of servers) {
      dataPoints.push({
        serverId: server.id,
        hostname: server.hostname,
        timestamp: new Date(now.getTime() - i * 60 * 1000),
        cpu: Math.round((Math.random() * 50 + 25) * 100) / 100,
        memory: Math.round((Math.random() * 40 + 40) * 100) / 100,
        disk: Math.round((Math.random() * 30 + 35) * 100) / 100,
        network: {
          bytesIn: Math.floor(Math.random() * 800000),
          bytesOut: Math.floor(Math.random() * 600000),
          latency: Math.round((Math.random() * 20 + 15) * 100) / 100
        }
      });
    }
  }
  
  return dataPoints.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
} 