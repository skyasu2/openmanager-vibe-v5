/**
 * 🚀 Next Server API - 순차 서버 생성 (성능 최적화)
 * 
 * 기존: 5초마다 20개 일괄 생성 → CPU/메모리 스파이크
 * 신규: 1초마다 1개씩 순차 생성 → 부하 분산 + 자연스러운 UX
 */

import { NextRequest, NextResponse } from 'next/server';
import { virtualServerManager } from '@/services/VirtualServerManager';

// 서버 생성 순서 최적화 (중요도 기준)
const SERVER_GENERATION_ORDER = [
  // 1-3초: 핵심 서버 먼저 (사용자가 빨리 볼 수 있게)
  'web-prod-01',
  'db-master-01', 
  'api-gateway-prod',
  
  // 4-9초: 클러스터 서버들
  'k8s-master-01',
  'k8s-worker-01',
  'k8s-worker-02',
  'cache-redis-01',
  'k8s-ingress-01',
  'proxy-nginx-01',
  
  // 10-15초: 분석/모니터링 서버
  'analytics-worker',
  'monitoring-elk',
  'k8s-logging-01',
  'k8s-monitoring-01',
  'grafana-metrics',
  'jenkins-ci-cd',
  
  // 16-20초: 백업/보안 서버
  'backup-storage-01',
  'mail-server-01',
  'file-server-nfs',
  'vault-secrets',
  'staging-web-01'
];

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  console.log('🔄 [NextServer] API 호출 시작');
  
  try {
    // 메모리 사용량 체크
    if (typeof global !== 'undefined' && global.gc) {
      const memUsage = process.memoryUsage();
      console.log(`📊 메모리 사용량: ${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`);
    }

    const body = await request.json().catch(() => ({}));
    const { currentCount = 0, reset = false } = body;
    
    console.log(`🔄 [NextServer] 요청: currentCount=${currentCount}, reset=${reset}`);
    
    // 리셋 요청 시 처리
    if (reset) {
      console.log('🔄 서버 생성 시퀀스 리셋');
      try {
        // VirtualServerManager 강제 재초기화
        await virtualServerManager.quickInitialize();
        console.log('✅ VirtualServerManager 재초기화 완료');
      } catch (resetError) {
        console.warn('⚠️ 재초기화 중 오류:', resetError);
      }
      
      return NextResponse.json({
        success: true,
        message: '서버 생성 시퀀스가 리셋되었습니다',
        currentCount: 0,
        isComplete: false,
        nextServerType: getServerTypeFromHostname(SERVER_GENERATION_ORDER[0]),
        timestamp: new Date().toISOString()
      });
    }
    
    // 완료 확인
    if (currentCount >= 20) {
      console.log('✅ 모든 서버 생성 완료');
      return NextResponse.json({
        success: true,
        message: '모든 서버 생성이 완료되었습니다',
        currentCount: 20,
        isComplete: true,
        totalServers: 20
      });
    }
    
    // 인덱스 유효성 검사
    if (currentCount < 0 || currentCount >= SERVER_GENERATION_ORDER.length) {
      console.error(`❌ 잘못된 currentCount: ${currentCount}`);
      return NextResponse.json({
        success: false,
        error: 'Invalid server index',
        currentCount,
        isComplete: false
      }, { status: 400 });
    }
    
    // 다음 서버 생성
    const nextServerHostname = SERVER_GENERATION_ORDER[currentCount];
    console.log(`🔨 [${currentCount + 1}/20] 서버 생성: ${nextServerHostname}`);
    
    // VirtualServerManager에서 서버 생성
    const allServers = virtualServerManager.getServers();
    let newServer = allServers.find(server => server.hostname === nextServerHostname);
    
    // 서버가 없으면 VirtualServerManager 초기화
    if (!newServer) {
      console.log('📋 VirtualServerManager 초기화 중...');
      await virtualServerManager.quickInitialize();
      const updatedServers = virtualServerManager.getServers();
      newServer = updatedServers.find(server => server.hostname === nextServerHostname);
    }
    
    if (!newServer) {
      console.error(`❌ 서버를 찾을 수 없음: ${nextServerHostname}`);
      return NextResponse.json({
        success: false,
        error: `Server not found: ${nextServerHostname}`,
        currentCount,
        isComplete: false
      }, { status: 404 });
    }
    
    // 메트릭 생성 (최신 데이터로)
    const latestMetrics = await virtualServerManager.getLatestMetrics(newServer.id);
    
    const serverResponse = {
      id: newServer.id,
      hostname: newServer.hostname,
      name: newServer.name,
      type: newServer.type,
      environment: newServer.environment,
      location: newServer.location || 'Unknown',
      provider: newServer.provider || 'onpremise',
      status: determineServerStatus(latestMetrics),
      cpu: latestMetrics?.cpu_usage || Math.round(newServer.baseMetrics.cpu_base + (Math.random() - 0.5) * 20),
      memory: latestMetrics?.memory_usage || Math.round(newServer.baseMetrics.memory_base + (Math.random() - 0.5) * 15),
      disk: latestMetrics?.disk_usage || Math.round(newServer.baseMetrics.disk_base + (Math.random() - 0.5) * 10),
      uptime: formatUptime(Math.floor(Math.random() * 7200000)), // 0-2시간
      lastUpdate: new Date(),
      alerts: generateAlerts(latestMetrics),
      services: generateServices(newServer.type),
      specs: newServer.specs,
      os: getOSFromProvider(newServer.provider),
      ip: generateIPAddress(newServer.provider, currentCount)
    };
    
    const newCount = currentCount + 1;
    const isComplete = newCount >= 20;
    const nextServerType = isComplete ? null : getServerTypeFromHostname(SERVER_GENERATION_ORDER[newCount]);
    
    const processingTime = Date.now() - startTime;
    console.log(`✅ 서버 생성 완료: ${nextServerHostname} (${newCount}/20) - ${processingTime}ms`);
    
    return NextResponse.json({
      success: true,
      server: serverResponse,
      currentCount: newCount,
      isComplete,
      nextServerType,
      totalServers: 20,
      progress: Math.round((newCount / 20) * 100),
      processingTime,
      message: isComplete 
        ? '🎉 모든 서버 배포 완료!' 
        : `⚡ ${nextServerHostname} 서버 배포됨`
    });
    
  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error('❌ [NextServer] API 오류:', {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      processingTime
    });
    
    // 상세한 에러 정보 제공
    let errorDetails = 'Unknown error';
    let errorCode = 'INTERNAL_ERROR';
    
    if (error instanceof Error) {
      errorDetails = error.message;
      if (error.message.includes('Cannot read properties')) {
        errorCode = 'NULL_REFERENCE_ERROR';
        errorDetails = 'VirtualServerManager 초기화 실패';
      } else if (error.message.includes('localStorage')) {
        errorCode = 'STORAGE_ERROR';
        errorDetails = 'Storage 접근 실패 (서버사이드 제한)';
      } else if (error.message.includes('fetch')) {
        errorCode = 'NETWORK_ERROR';
        errorDetails = '네트워크 연결 실패';
      }
    }
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      errorCode,
      details: errorDetails,
      processingTime,
      currentCount: 0,
      isComplete: false,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    // 현재 상태 조회
    const servers = virtualServerManager.getServers();
    const generationStatus = virtualServerManager.getGenerationStatus();
    
    return NextResponse.json({
      success: true,
      currentCount: servers.length,
      totalServers: 20,
      isComplete: servers.length >= 20,
      isGenerating: generationStatus.isGenerating,
      availableServers: SERVER_GENERATION_ORDER,
      progress: Math.round((servers.length / 20) * 100)
    });
    
  } catch (error) {
    console.error('❌ [NextServer] 상태 조회 오류:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to get server status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// 헬퍼 함수들

function getServerTypeFromHostname(hostname: string): string {
  if (hostname.includes('web')) return 'Web Server';
  if (hostname.includes('db')) return 'Database';
  if (hostname.includes('api')) return 'API Gateway';
  if (hostname.includes('k8s-master')) return 'Kubernetes Master';
  if (hostname.includes('k8s-worker')) return 'Kubernetes Worker';
  if (hostname.includes('k8s-ingress')) return 'Kubernetes Ingress';
  if (hostname.includes('k8s-logging')) return 'Kubernetes Logging';
  if (hostname.includes('k8s-monitoring')) return 'Kubernetes Monitoring';
  if (hostname.includes('cache')) return 'Cache Server';
  if (hostname.includes('proxy')) return 'Proxy Server';
  if (hostname.includes('analytics')) return 'Analytics Worker';
  if (hostname.includes('monitoring')) return 'Monitoring Stack';
  if (hostname.includes('jenkins')) return 'CI/CD Server';
  if (hostname.includes('grafana')) return 'Metrics Dashboard';
  if (hostname.includes('backup')) return 'Backup Storage';
  if (hostname.includes('mail')) return 'Mail Server';
  if (hostname.includes('file')) return 'File Server';
  if (hostname.includes('vault')) return 'Security Vault';
  if (hostname.includes('staging')) return 'Staging Server';
  return 'Server';
}

function determineServerStatus(metrics: any): 'online' | 'warning' | 'offline' {
  if (!metrics) return 'online';
  
  if (metrics.cpu_usage > 90 || metrics.memory_usage > 95) return 'offline';
  if (metrics.cpu_usage > 75 || metrics.memory_usage > 85) return 'warning';
  return 'online';
}

function formatUptime(milliseconds: number): string {
  const days = Math.floor(milliseconds / (1000 * 60 * 60 * 24));
  const hours = Math.floor((milliseconds % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  return `${days}일 ${hours}시간`;
}

function generateAlerts(metrics: any): number {
  if (!metrics) return 0;
  
  let alerts = 0;
  if (metrics.cpu_usage > 75) alerts++;
  if (metrics.memory_usage > 85) alerts++;
  if (metrics.disk_usage > 90) alerts++;
  return alerts;
}

function generateServices(serverType: string): Array<{name: string; status: 'running' | 'stopped'; port: number}> {
  const serviceMap: Record<string, Array<{name: string; port: number}>> = {
    web: [
      { name: 'nginx', port: 80 },
      { name: 'php-fpm', port: 9000 },
      { name: 'redis', port: 6379 }
    ],
    database: [
      { name: 'mysql', port: 3306 },
      { name: 'redis', port: 6379 }
    ],
    api: [
      { name: 'node', port: 3000 },
      { name: 'nginx', port: 80 }
    ],
    kubernetes: [
      { name: 'kubelet', port: 10250 },
      { name: 'kube-proxy', port: 10256 }
    ],
    cache: [
      { name: 'redis', port: 6379 },
      { name: 'redis-sentinel', port: 26379 }
    ]
  };
  
  const services = serviceMap[serverType] || [{ name: 'system', port: 22 }];
  
  return services.map(service => ({
    name: service.name,
    status: Math.random() > 0.1 ? 'running' : 'stopped' as const,
    port: service.port
  }));
}

function getOSFromProvider(provider?: string): string {
  switch (provider) {
    case 'aws': return 'Amazon Linux 2';
    case 'gcp': return 'Ubuntu 20.04 LTS';
    case 'azure': return 'Ubuntu 22.04 LTS';
    case 'kubernetes': return 'Container Linux';
    default: return 'CentOS 8';
  }
}

function generateIPAddress(provider?: string, index: number = 0): string {
  switch (provider) {
    case 'aws': return `10.0.1.${10 + index}`;
    case 'gcp': return `10.1.1.${10 + index}`;
    case 'azure': return `10.2.1.${10 + index}`;
    case 'kubernetes': return `10.244.0.${10 + index}`;
    default: return `192.168.1.${10 + index}`;
  }
} 