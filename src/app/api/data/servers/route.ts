import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * 🚀 새로운 API v3 - 베르셀 캐시 문제 우회
 * 15개 서버 데이터를 직접 반환
 */
export async function GET(request: NextRequest) {
  const timestamp = new Date().toISOString();
  const currentHour = new Date().getHours();
  
  console.log(`🕐 [Static-API] ${currentHour}시 정적 데이터 조회 시작 - ${timestamp}`);
  
  try {
    // 🗂️ 정적 파일 경로 (24시간 데이터)
    const filePath = `/server-scenarios/hourly-metrics/${currentHour.toString().padStart(2, '0')}.json`;
    const fullPath = process.cwd() + '/public' + filePath;
    
    console.log(`📁 파일 경로: ${fullPath}`);
    
    // 📖 정적 JSON 파일 읽기 (계산 없음!)
    const fs = require('fs');
    const hourlyData = JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
    
    // 🔄 베르셀 호환 형식으로 변환 (기존 대시보드 호환성)
    const servers = Object.values(hourlyData.servers).map((server: any, index: number) => ({
      id: `server-${currentHour}-${index}`,
      name: server.name || `server-${index + 1}`,
      type: server.type || 'unknown',
      status: server.status === 'healthy' ? 'online' : 
              server.status === 'warning' ? 'warning' : 'critical',
      cpu: server.cpu || 0,
      memory: server.memory || 0,
      disk: server.disk || 0,
      provider: `Static-${currentHour}h`,
      location: server.location || 'Static-DC',
      ip: server.hostname ? server.hostname.split('.')[0] : `192.168.${currentHour}.${index + 100}`
    }));

    const response = {
      success: true,
      data: servers,
      source: "static-hourly",
      timestamp,
      currentHour,
      scenario: hourlyData.scenario,
      count: servers.length,
      summary: {
        total: servers.length,
        online: servers.filter(s => s.status === 'online').length,
        warning: servers.filter(s => s.status === 'warning').length,
        critical: servers.filter(s => s.status === 'critical').length
      },
      version: "4.0.0-static",
      deployment_note: "24시간 정적 데이터 - 자원 소모 최소화",
      performance_mode: "ultra-fast",
      cacheBreaker: `static-${currentHour}-${Date.now()}`
    };

    console.log(`✅ [Static-API] ${servers.length}개 서버 데이터 반환 완료 (${response.summary.online}/${response.summary.warning}/${response.summary.critical})`);

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=900', // 15분 캐시 (시간 바뀔 때까지)
        'X-API-Version': '4.0.0-static',
        'X-Performance-Mode': 'ultra-fast',
        'X-Server-Count': servers.length.toString(),
        'X-Current-Hour': currentHour.toString(),
        'X-Timestamp': timestamp
      }
    });

  } catch (error) {
    console.error(`❌ [Static-API] 파일 읽기 오류:`, error);
    
    // 🔄 폴백: 기존 정적 서버 (안전장치)
    const fallbackServers = [
      {
        id: `fallback-${currentHour}-1`,
        name: "web-server-01", 
        type: "web",
        status: "online",
        cpu: 25 + (currentHour * 0.5),
        memory: 45 + (currentHour * 0.3),
        disk: 30,
        provider: `Fallback-${currentHour}h`,
        location: "Fallback-DC",
        ip: "192.168.255.100"
      }
    ];

    return NextResponse.json({
      success: true,
      data: fallbackServers,
      source: "fallback-static",
      timestamp,
      currentHour,
      count: 1,
      fallback: true,
      error: "Static file read failed, using fallback",
      version: "4.0.0-fallback"
    }, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Version': '4.0.0-fallback',
        'X-Fallback': 'true'
      }
    });
  }
}