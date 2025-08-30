import { NextRequest, NextResponse } from 'next/server';

/**
 * 🤖 AI 분석 무결성 보장 API
 * 
 * ✅ 제공되는 데이터:
 * - 순수 Raw 메트릭 (CPU, Memory, Disk, Network)
 * - 서버 기본 정보 (ID, Name, Status, Uptime)
 * - 타임스탬프 및 위치 정보
 * 
 * ❌ 제거된 정보 (AI 분석 무결성 보장):
 * - 시나리오 이름 및 힌트
 * - Mock/시뮬레이션 관련 표시
 * - Fixed-Pattern, Scenario 등 패턴 정보
 * - Console 로그 (시나리오 활성화 알림)
 * 
 * 🎯 목적: AI가 사전 정보 없이 순수 메트릭만으로 분석하도록 보장
 */

interface RawServerMetric {
  id: string;
  name: string;
  hostname: string;
  status: 'online' | 'offline' | 'warning' | 'critical';
  
  // 📊 Pure Raw Metrics (AI 분석용)
  cpu: number;
  memory: number; 
  disk: number;
  network: number;
  
  // ⏱️ Time & Location (분석 컨텍스트)
  uptime: number;
  timestamp: string;
  location: string;
  
  // 🏗️ Server Context (AI 분석 도움)
  type: string;
  environment: string;
  
  // 📈 Additional Raw Metrics
  responseTime?: number;
  connections?: number;
  load?: number;
}

/**
 * 🔄 24시간 순수 메트릭 로드 (시나리오 힌트 완전 제거)
 */
async function loadPureRawMetrics(): Promise<RawServerMetric[]> {
  try {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentSecond = now.getSeconds();
    
    // 30초 단위 데이터 회전 (시나리오 정보 없이)
    const segmentInHour = Math.floor((currentMinute * 60 + currentSecond) / 30);
    const rotationMinute = segmentInHour % 60;
    
    // 시나리오 정보를 로그하지 않음 - AI 분석 무결성 보장
    
    const fs = require('fs');
    const path = require('path');
    const filePath = path.join(process.cwd(), 'public', 'server-scenarios', 'hourly-metrics', `${currentHour.toString().padStart(2, '0')}.json`);
    
    let hourlyData;
    
    if (!fs.existsSync(filePath)) {
      const fallbackPath = path.join(process.cwd(), 'public', 'server-scenarios', 'hourly-metrics', '17.json');
      hourlyData = JSON.parse(fs.readFileSync(fallbackPath, 'utf8'));
    } else {
      hourlyData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
    
    return convertToPureMetrics(hourlyData, currentHour, rotationMinute, segmentInHour);
    
  } catch (error) {
    console.error('Raw metrics 로드 실패:', error);
    return generateFallbackMetrics();
  }
}

/**
 * 🧹 순수 메트릭 변환기 - 모든 시나리오 힌트 제거
 */
function convertToPureMetrics(hourlyData: any, currentHour: number, rotationMinute: number, segmentInHour: number): RawServerMetric[] {
  const servers = hourlyData.servers || {};
  
  // 🔒 시나리오 정보를 로그하지 않음 - AI 분석 무결성 유지
  
  // 10개 서버 보장
  if (Object.keys(servers).length < 10) {
    const missingCount = 10 - Object.keys(servers).length;
    
    for (let i = 0; i < missingCount; i++) {
      const serverIndex = Object.keys(servers).length + i + 1;
      const serverTypes = ['security', 'backup', 'proxy', 'gateway'];
      const serverType = serverTypes[i % serverTypes.length];
      const serverId = `${serverType}-server-${serverIndex}`;
      
      servers[serverId] = {
        id: serverId,
        name: `${serverType.charAt(0).toUpperCase() + serverType.slice(1)} Server #${serverIndex}`,
        hostname: `${serverType}-${serverIndex.toString().padStart(2, '0')}.internal`,
        status: 'online',
        type: serverType,
        location: 'datacenter-east',
        environment: 'production',
        uptime: 2592000 + Math.floor(Math.random() * 86400),
        cpu: Math.floor(15 + Math.random() * 25),
        memory: Math.floor(20 + Math.random() * 35),
        disk: Math.floor(25 + Math.random() * 40),
        network: Math.floor(5 + Math.random() * 20)
      };
    }
  }
  
  return Object.values(servers).map((serverData: any, index) => {
    // 🔄 시간 내 고정 패턴 (시나리오 힌트 없이)
    const minuteFactor = rotationMinute / 59;
    const fixedOffset = Math.sin(minuteFactor * 2 * Math.PI) * 2;
    const serverOffset = (index * 3.7) % 10;
    const fixedVariation = 1 + (fixedOffset + serverOffset) / 100;
    
    // 📊 순수 Raw 메트릭만 계산
    const rawMetric: RawServerMetric = {
      id: serverData.id || `server-${index}`,
      name: serverData.name || `Server ${index + 1}`,
      hostname: serverData.hostname || `server-${index}.internal`,
      status: serverData.status || 'online',
      
      // 🎯 Pure Raw Metrics (시나리오 정보 없이)
      cpu: Math.round((serverData.cpu || 0) * fixedVariation),
      memory: Math.round((serverData.memory || 0) * fixedVariation),
      disk: Math.round((serverData.disk || 0) * fixedVariation),
      network: Math.round((serverData.network || 20) * fixedVariation),
      
      // ⏱️ Time & Location
      uptime: serverData.uptime || 86400,
      timestamp: new Date().toISOString(),
      location: serverData.location || 'datacenter-east',
      
      // 🏗️ Server Context
      type: serverData.type || 'worker',
      environment: serverData.environment || 'production',
      
      // 📈 Additional Metrics
      responseTime: Math.round((serverData.responseTime || 200) * fixedVariation),
      connections: Math.round((serverData.connections || 150) * fixedVariation),
      load: Math.round(((serverData.cpu || 0) / 25) * fixedVariation * 100) / 100
    };
    
    return rawMetric;
  });
}

/**
 * 🔄 Fallback Raw 메트릭 생성 (시나리오 힌트 없이)
 */
function generateFallbackMetrics(): RawServerMetric[] {
  const serverTypes = ['web', 'api', 'database', 'cache', 'monitoring', 'security', 'backup', 'proxy', 'gateway', 'worker'];
  
  return Array.from({ length: 10 }, (_, index) => {
    const serverType = serverTypes[index];
    const baseMetrics = getBaseMetricsForType(serverType);
    
    return {
      id: `server-${index + 1}`,
      name: `${serverType.charAt(0).toUpperCase() + serverType.slice(1)} Server #${index + 1}`,
      hostname: `${serverType}-${(index + 1).toString().padStart(2, '0')}.internal`,
      status: Math.random() > 0.85 ? (Math.random() > 0.5 ? 'warning' : 'critical') : 'online',
      
      cpu: baseMetrics.cpu + Math.floor(Math.random() * 20) - 10,
      memory: baseMetrics.memory + Math.floor(Math.random() * 15) - 7,
      disk: baseMetrics.disk + Math.floor(Math.random() * 10) - 5,
      network: baseMetrics.network + Math.floor(Math.random() * 15) - 7,
      
      uptime: 86400 + Math.floor(Math.random() * 2592000),
      timestamp: new Date().toISOString(),
      location: 'datacenter-east',
      type: serverType,
      environment: 'production',
      
      responseTime: 150 + Math.floor(Math.random() * 100),
      connections: 100 + Math.floor(Math.random() * 200),
      load: Math.round((baseMetrics.cpu / 25) * 100) / 100
    };
  });
}

/**
 * 📊 서버 타입별 기본 메트릭 (시나리오 정보 없이)
 */
function getBaseMetricsForType(type: string): { cpu: number; memory: number; disk: number; network: number } {
  const profiles: Record<string, any> = {
    web: { cpu: 40, memory: 50, disk: 60, network: 20 },
    api: { cpu: 45, memory: 60, disk: 45, network: 25 },
    database: { cpu: 27, memory: 67, disk: 75, network: 12 },
    cache: { cpu: 30, memory: 65, disk: 35, network: 40 },
    monitoring: { cpu: 30, memory: 50, disk: 72, network: 17 },
    security: { cpu: 22, memory: 57, disk: 72, network: 10 },
    backup: { cpu: 40, memory: 27, disk: 55, network: 25 },
    proxy: { cpu: 35, memory: 45, disk: 40, network: 50 },
    gateway: { cpu: 50, memory: 55, disk: 30, network: 45 },
    worker: { cpu: 40, memory: 50, disk: 50, network: 25 }
  };
  
  return profiles[type] || profiles['worker'];
}

/**
 * 🤖 AI Raw Metrics API Endpoint
 * 순수 메트릭만 제공, 시나리오 힌트 완전 차단
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '10', 10)));
    const format = searchParams.get('format') || 'standard';
    
    // 🔒 AI 분석용 순수 메트릭 로드 (시나리오 힌트 없이)
    const rawMetrics = await loadPureRawMetrics();
    
    // 📊 요청된 수량만큼만 제공
    const limitedMetrics = rawMetrics.slice(0, limit);
    
    // 🧹 Format별 응답 (AI 분석 최적화)
    let responseData;
    
    if (format === 'minimal') {
      // 🎯 최소 메트릭만 (AI 가벼운 분석용)
      responseData = limitedMetrics.map(server => ({
        id: server.id,
        name: server.name,
        status: server.status,
        cpu: server.cpu,
        memory: server.memory,
        disk: server.disk,
        network: server.network,
        timestamp: server.timestamp
      }));
    } else if (format === 'extended') {
      // 📈 확장 메트릭 (AI 상세 분석용)
      responseData = limitedMetrics.map(server => ({
        ...server,
        metrics: {
          utilization: {
            cpu: server.cpu,
            memory: server.memory,
            disk: server.disk,
            network: server.network
          },
          performance: {
            responseTime: server.responseTime,
            connections: server.connections,
            load: server.load
          },
          context: {
            uptime: server.uptime,
            type: server.type,
            environment: server.environment,
            location: server.location
          }
        }
      }));
    } else {
      // 📋 표준 포맷 (AI 일반 분석용)
      responseData = limitedMetrics;
    }
    
    return NextResponse.json({
      success: true,
      data: responseData,
      metadata: {
        count: responseData.length,
        timestamp: new Date().toISOString(),
        format: format,
        // 🚫 시나리오/시뮬레이션 정보 완전 제거 - AI 분석 무결성 보장
        dataIntegrityLevel: 'pure-raw-metrics'
      }
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-AI-Data-Source': 'raw-metrics',
        'X-Analysis-Mode': 'integrity-preserved'
      }
    });
    
  } catch (error) {
    console.error('AI Raw Metrics API 오류:', error);
    
    return NextResponse.json({
      success: false,
      error: 'RAW_METRICS_FAILED',
      message: '순수 메트릭 데이터를 불러올 수 없습니다.'
    }, { status: 500 });
  }
}