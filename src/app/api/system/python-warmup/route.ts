import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Python Render 서비스 수동 웜업
    const pythonServiceUrl = process.env.AI_ENGINE_URL || 'https://openmanager-vibe-v5.onrender.com';
    const startTime = Date.now();
    
    console.log('🔧 Python 수동 웜업 API 요청');
    
    // 헬스체크로 서비스 깨우기
    const response = await fetch(`${pythonServiceUrl}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(30000),
      headers: {
        'User-Agent': 'OpenManager-Manual-Warmup-API'
      }
    });
    
    const warmupTime = Date.now() - startTime;
    
    if (response.ok) {
      const data = await response.json();
      
      // 추가 분석 요청으로 완전 웜업
      try {
        const analysisResponse = await fetch(`${pythonServiceUrl}/analyze`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: 'manual api warmup test',
            metrics: [{
              timestamp: new Date().toISOString(),
              cpu: 45, memory: 55, disk: 65,
              networkIn: 800, networkOut: 1200
            }]
          }),
          signal: AbortSignal.timeout(20000)
        });
        
        const analysisTime = Date.now() - startTime;
        
        return NextResponse.json({
          success: true,
          message: 'Python 서비스 수동 웜업 완료',
          data: {
            healthCheck: data,
            warmupTime,
            analysisTime,
            fullWarmup: analysisResponse.ok
          }
        });
        
      } catch (analysisError) {
        return NextResponse.json({
          success: true,
          message: 'Python 서비스 기본 웜업 완료 (분석 웜업 실패)',
          data: {
            healthCheck: data,
            warmupTime,
            analysisError: analysisError instanceof Error ? analysisError.message : 'Unknown error'
          }
        });
      }
      
    } else {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Python 서비스 웜업 실패',
          error: `HTTP ${response.status}: ${response.statusText}`,
          warmupTime
        },
        { status: 502 }
      );
    }
    
  } catch (error) {
    console.error('❌ Python 웜업 API 오류:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Python 웜업 요청 처리 실패',
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  // 현재 Python 서비스 상태 확인
  try {
    const pythonServiceUrl = process.env.AI_ENGINE_URL || 'https://openmanager-vibe-v5.onrender.com';
    
    const response = await fetch(`${pythonServiceUrl}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(10000)
    });
    
    const isActive = response.ok;
    
    return NextResponse.json({
      success: true,
      data: {
        pythonServiceUrl,
        isActive,
        status: isActive ? 'active' : 'sleeping',
        warmupMode: 'on-demand',
        lastCheck: new Date().toISOString()
      }
    });
    
  } catch (error) {
    return NextResponse.json({
      success: true,
      data: {
        pythonServiceUrl: process.env.AI_ENGINE_URL || 'https://openmanager-vibe-v5.onrender.com',
        isActive: false,
        status: 'sleeping',
        warmupMode: 'on-demand',
        error: error instanceof Error ? error.message : 'Connection failed'
      }
    });
  }
} 