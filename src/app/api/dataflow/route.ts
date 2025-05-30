/**
 * 🔄 데이터 플로우 관리 API
 * 
 * 데이터 생성기, 서버 모니터링, AI 에이전트 간의
 * 데이터 흐름을 제어하고 모니터링하는 API
 */

import { NextRequest, NextResponse } from 'next/server';
import { dataFlowManager } from '../../../services/ai/DataFlow';

/**
 * 📊 데이터 플로우 상태 조회 (GET)
 */
export async function GET(request: NextRequest) {
  try {
    const status = dataFlowManager.getStatus();
    const metrics = dataFlowManager.getMetrics();
    const latestData = dataFlowManager.getLatestServerData();

    return NextResponse.json({
      success: true,
      status,
      metrics,
      data_summary: {
        server_count: latestData.length,
        healthy_servers: latestData.filter(s => s.status === 'healthy').length,
        warning_servers: latestData.filter(s => s.status === 'warning').length,
        critical_servers: latestData.filter(s => s.status === 'critical').length,
        avg_cpu: latestData.length > 0 ? 
          (latestData.reduce((sum, s) => sum + s.cpu_usage, 0) / latestData.length).toFixed(1) : '0',
        avg_memory: latestData.length > 0 ? 
          (latestData.reduce((sum, s) => sum + s.memory_usage, 0) / latestData.length).toFixed(1) : '0'
      },
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ 데이터 플로우 상태 조회 실패:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

/**
 * 🚀 데이터 플로우 시작 (POST)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'start') {
      await dataFlowManager.startDataFlow();
      
      return NextResponse.json({
        success: true,
        message: '데이터 플로우가 시작되었습니다',
        status: dataFlowManager.getStatus(),
        timestamp: new Date().toISOString()
      });
      
    } else if (action === 'stop') {
      dataFlowManager.stopDataFlow();
      
      return NextResponse.json({
        success: true,
        message: '데이터 플로우가 중지되었습니다',
        status: dataFlowManager.getStatus(),
        timestamp: new Date().toISOString()
      });
      
    } else if (action === 'restart') {
      dataFlowManager.stopDataFlow();
      
      // 1초 후 재시작
      setTimeout(async () => {
        await dataFlowManager.startDataFlow();
      }, 1000);
      
      return NextResponse.json({
        success: true,
        message: '데이터 플로우가 재시작됩니다',
        timestamp: new Date().toISOString()
      });
      
    } else {
      return NextResponse.json({
        success: false,
        error: '지원하지 않는 액션입니다. start, stop, restart 중 하나를 선택하세요.',
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

  } catch (error: any) {
    console.error('❌ 데이터 플로우 제어 실패:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

/**
 * OPTIONS 요청 처리 (CORS)
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
} 