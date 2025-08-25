#!/usr/bin/env node

/**
 * 🎯 의미 있는 24시간 장애 시나리오 생성기
 * - AI 자연어 질의 가능
 * - 자동 장애 보고서 생성용
 * - 실제 인프라 장애 패턴 기반
 * - 30초 간격 세밀한 메트릭스
 */

const fs = require('fs');
const path = require('path');

// 🏗️ 8개 서버 정의 (각각 고유한 장애 패턴)
const SERVERS = {
  'web-server-1': {
    name: 'Web Server #1',
    type: 'web',
    service: 'Nginx',
    hostname: 'web-01.prod.example.com',
    baseMetrics: { cpu: 25, memory: 45, disk: 30, network: 70 },
    commonIssues: ['high_traffic', 'memory_leak', 'connection_timeout']
  },
  'api-server-1': {
    name: 'API Server #1', 
    type: 'application',
    service: 'Node.js',
    hostname: 'api-01.prod.example.com',
    baseMetrics: { cpu: 35, memory: 55, disk: 25, network: 85 },
    commonIssues: ['cpu_spike', 'memory_pressure', 'rate_limiting']
  },
  'db-master-1': {
    name: 'Database Master',
    type: 'database', 
    service: 'PostgreSQL',
    hostname: 'db-master-01.prod.example.com',
    baseMetrics: { cpu: 45, memory: 70, disk: 60, network: 90 },
    commonIssues: ['lock_contention', 'slow_queries', 'replication_lag']
  },
  'db-replica-1': {
    name: 'Database Replica',
    type: 'database',
    service: 'PostgreSQL', 
    hostname: 'db-replica-01.prod.example.com',
    baseMetrics: { cpu: 30, memory: 60, disk: 60, network: 80 },
    commonIssues: ['replication_lag', 'sync_issues', 'read_overload']
  },
  'cache-server-1': {
    name: 'Cache Server #1',
    type: 'cache',
    service: 'Redis',
    hostname: 'cache-01.prod.example.com', 
    baseMetrics: { cpu: 20, memory: 80, disk: 15, network: 60 },
    commonIssues: ['memory_eviction', 'connection_pool', 'key_expiration']
  },
  'storage-server-1': {
    name: 'Storage Server #1',
    type: 'storage',
    service: 'MinIO',
    hostname: 'storage-01.prod.example.com',
    baseMetrics: { cpu: 15, memory: 40, disk: 75, network: 95 },
    commonIssues: ['disk_full', 'io_bottleneck', 'network_congestion']
  },
  'queue-server-1': {
    name: 'Message Queue #1',
    type: 'queue', 
    service: 'RabbitMQ',
    hostname: 'queue-01.prod.example.com',
    baseMetrics: { cpu: 30, memory: 50, disk: 35, network: 75 },
    commonIssues: ['queue_backup', 'consumer_lag', 'memory_pressure']
  },
  'monitoring-server-1': {
    name: 'Monitoring Server #1',
    type: 'monitoring',
    service: 'Prometheus', 
    hostname: 'monitoring-01.prod.example.com',
    baseMetrics: { cpu: 40, memory: 65, disk: 50, network: 70 },
    commonIssues: ['metric_overload', 'disk_retention', 'scrape_failures']
  }
};

// 🎭 24시간 현실적 장애 시나리오 (AI가 이해할 수 있는 스토리)
const INCIDENT_SCENARIOS = [
  // 00-05시: 야간 시간대 - 시스템 유지보수 및 배치 작업
  {
    hours: [0, 1, 2, 3, 4, 5],
    name: '야간 유지보수 및 백업',
    description: '정기 시스템 백업과 DB 최적화로 인한 성능 저하',
    incidents: [
      {
        server: 'db-master-1',
        status: 'warning', 
        reason: 'maintenance_backup',
        impact: 'DB 백업 진행으로 CPU/IO 사용률 증가',
        metrics: { cpu: +25, memory: +15, disk: +10, network: +5 }
      },
      {
        server: 'storage-server-1', 
        status: 'warning',
        reason: 'backup_storage',
        impact: '대용량 백업 파일 저장으로 디스크 사용률 증가',
        metrics: { cpu: +10, memory: +5, disk: +15, network: +20 }
      }
    ]
  },

  // 06-08시: 새벽 - 배치 작업 완료, 시스템 안정화
  {
    hours: [6, 7, 8], 
    name: '시스템 안정화',
    description: '야간 작업 완료 후 정상 운영 상태 복구',
    incidents: [
      {
        server: 'cache-server-1',
        status: 'warning',
        reason: 'cache_warmup', 
        impact: '캐시 워밍업으로 메모리 사용률 일시 증가',
        metrics: { cpu: +15, memory: +20, disk: +0, network: +10 }
      }
    ]
  },

  // 09-11시: 오전 업무 시작 - 점진적 부하 증가
  {
    hours: [9, 10, 11],
    name: '오전 업무 시작',
    description: '사용자 접속 증가로 인한 점진적 시스템 부하 상승', 
    incidents: [
      {
        server: 'web-server-1',
        status: 'warning',
        reason: 'morning_traffic',
        impact: '오전 업무 시작으로 웹 트래픽 증가',
        metrics: { cpu: +20, memory: +15, disk: +5, network: +25 }
      },
      {
        server: 'api-server-1', 
        status: 'warning',
        reason: 'api_load_increase',
        impact: 'API 호출량 증가로 처리 부하 상승',
        metrics: { cpu: +25, memory: +20, disk: +5, network: +20 }
      }
    ]
  },

  // 12-14시: 점심 피크 타임 - 최대 트래픽
  {
    hours: [12, 13, 14],
    name: '점심 피크 트래픽',
    description: '일일 최대 사용자 트래픽으로 인한 시스템 부하 집중',
    incidents: [
      {
        server: 'db-master-1',
        status: 'critical', // 🚨 Critical 상태 포함
        reason: 'peak_traffic_overload',
        impact: '점심시간 트래픽 급증으로 DB 연결 한계 도달',
        metrics: { cpu: +45, memory: +30, disk: +15, network: +25 },
        alerts: ['connection_pool_exhausted', 'slow_query_detected', 'lock_wait_timeout'],
        recovery_actions: ['connection_pool_scale', 'query_optimization', 'read_replica_routing']
      },
      {
        server: 'api-server-1',
        status: 'warning', 
        reason: 'high_concurrent_requests',
        impact: 'API 동시 요청 수 증가로 응답 지연 발생',
        metrics: { cpu: +35, memory: +25, disk: +5, network: +30 }
      },
      {
        server: 'cache-server-1',
        status: 'warning',
        reason: 'cache_hit_ratio_drop', 
        impact: '캐시 미스율 증가로 DB 부하 가중',
        metrics: { cpu: +20, memory: +25, disk: +5, network: +15 }
      }
    ]
  },

  // 15-17시: 오후 업무 - 안정적 고부하
  {
    hours: [15, 16, 17],
    name: '오후 안정 운영',
    description: '피크 타임 이후 안정적인 고부하 상태 유지',
    incidents: [
      {
        server: 'monitoring-server-1',
        status: 'warning',
        reason: 'metric_collection_overhead',
        impact: '높은 모니터링 데이터 수집량으로 성능 영향', 
        metrics: { cpu: +25, memory: +20, disk: +15, network: +10 }
      }
    ]
  },

  // 18-20시: 저녁 - 두 번째 소규모 피크
  {
    hours: [18, 19, 20], 
    name: '저녁 소규모 피크',
    description: '퇴근 후 개인 사용자 접속으로 인한 두 번째 트래픽 증가',
    incidents: [
      {
        server: 'queue-server-1',
        status: 'critical', // 🚨 또 다른 Critical 상태
        reason: 'message_queue_backup',
        impact: '대량 메시지 처리 지연으로 큐 백로그 발생',
        metrics: { cpu: +40, memory: +35, disk: +20, network: +25 },
        alerts: ['queue_length_exceeded', 'consumer_lag_high', 'memory_usage_critical'],
        recovery_actions: ['consumer_scaling', 'message_prioritization', 'dead_letter_cleanup']
      },
      {
        server: 'web-server-1',
        status: 'warning',
        reason: 'evening_user_surge', 
        impact: '개인 사용자 접속 증가로 웹 서버 부하',
        metrics: { cpu: +20, memory: +18, disk: +5, network: +22 }
      }
    ]
  },

  // 21-23시: 야간 - 점진적 부하 감소
  {
    hours: [21, 22, 23],
    name: '야간 부하 감소',
    description: '사용자 접속 감소와 함께 시스템 부하 정상화',
    incidents: [
      {
        server: 'storage-server-1',
        status: 'warning', 
        reason: 'log_rotation_cleanup',
        impact: '로그 파일 정리 및 압축으로 일시적 I/O 증가',
        metrics: { cpu: +15, memory: +5, disk: +10, network: +8 }
      }
    ]
  }
];

// 📊 30초 간격 세밀한 메트릭스 생성
function generateDetailedMetrics(baseMetrics, incident, timeOffset) {
  const variation = {
    cpu: Math.sin(timeOffset * 0.1) * 5 + (Math.random() - 0.5) * 3,
    memory: Math.sin(timeOffset * 0.15) * 3 + (Math.random() - 0.5) * 2, 
    disk: Math.sin(timeOffset * 0.05) * 2 + (Math.random() - 0.5) * 1,
    network: Math.sin(timeOffset * 0.2) * 8 + (Math.random() - 0.5) * 4
  };

  const incidentImpact = incident ? incident.metrics : { cpu: 0, memory: 0, disk: 0, network: 0 };

  return {
    cpu: Math.max(0, Math.min(100, baseMetrics.cpu + incidentImpact.cpu + variation.cpu)),
    memory: Math.max(0, Math.min(100, baseMetrics.memory + incidentImpact.memory + variation.memory)),
    disk: Math.max(0, Math.min(100, baseMetrics.disk + incidentImpact.disk + variation.disk)),
    network: Math.max(0, Math.min(100, baseMetrics.network + incidentImpact.network + variation.network))
  };
}

// 🤖 AI가 이해할 수 있는 장애 컨텍스트 생성
function generateAIContext(scenario, incidents) {
  return {
    scenario_type: scenario.name,
    business_impact: scenario.description,
    severity_level: incidents.some(i => i.status === 'critical') ? 'high' : 
                   incidents.some(i => i.status === 'warning') ? 'medium' : 'low',
    affected_services: incidents.map(i => SERVERS[i.server].service),
    root_causes: incidents.map(i => i.reason),
    user_experience_impact: incidents.map(i => i.impact),
    recovery_actions: incidents.filter(i => i.recovery_actions).flatMap(i => i.recovery_actions),
    timeline: `${scenario.hours[0]}:00-${scenario.hours[scenario.hours.length-1]}:59`,
    keywords: [...new Set([
      ...incidents.map(i => i.reason.split('_')).flat(),
      ...incidents.map(i => SERVERS[i.server].type),
      scenario.name.toLowerCase().split(' ')
    ].flat())],
    natural_language_summary: `${scenario.description}. 영향받은 시스템: ${incidents.map(i => SERVERS[i.server].name).join(', ')}`
  };
}

// 📋 시간별 시나리오 데이터 생성
function generateHourlyData(hour) {
  const currentScenario = INCIDENT_SCENARIOS.find(s => s.hours.includes(hour));
  const timestamp = new Date(`2025-08-25T${hour.toString().padStart(2, '0')}:00:00.000Z`);
  
  const servers = {};
  
  Object.entries(SERVERS).forEach(([serverId, serverDef]) => {
    const incident = currentScenario?.incidents.find(i => i.server === serverId);
    const status = incident ? incident.status : 'healthy';
    
    // 30초 간격 메트릭스 (120개 데이터 포인트)
    const detailedMetrics = [];
    for (let i = 0; i < 120; i++) {
      const timeOffset = i * 30; // 30초 간격
      const metrics = generateDetailedMetrics(serverDef.baseMetrics, incident, timeOffset);
      detailedMetrics.push({
        timestamp: new Date(timestamp.getTime() + timeOffset * 1000).toISOString(),
        ...metrics,
        temperature: 35 + metrics.cpu * 0.3 + (Math.random() - 0.5) * 2
      });
    }

    servers[serverId] = {
      id: serverId,
      name: serverDef.name,
      hostname: serverDef.hostname, 
      status: status,
      type: serverDef.type,
      service: serverDef.service,
      location: `us-east-1${String.fromCharCode(97 + Object.keys(SERVERS).indexOf(serverId))}`,
      environment: 'production',
      provider: 'AWS',
      uptime: 2592000 - (status === 'critical' ? 300 : 0),
      
      // 현재 시점 메트릭스 (요약)
      cpu: Math.round(detailedMetrics[0].cpu),
      memory: Math.round(detailedMetrics[0].memory),
      disk: Math.round(detailedMetrics[0].disk), 
      network: Math.round(detailedMetrics[0].network),
      
      // 30초 간격 상세 메트릭스
      detailedMetrics: detailedMetrics,
      
      // 장애 정보 (AI용)
      incident: incident ? {
        reason: incident.reason,
        impact: incident.impact,
        alerts: incident.alerts || [],
        recovery_actions: incident.recovery_actions || []
      } : null,
      
      alerts: incident?.alerts ? incident.alerts.length : 0,
      alertMessages: incident?.alerts || [],
      lastUpdate: timestamp.toISOString(),
      
      // 레거시 메트릭스 구조 유지
      metrics: {
        cpu: { usage: Math.round(detailedMetrics[0].cpu), cores: 4 + Math.floor(Object.keys(SERVERS).indexOf(serverId) / 2) * 4, temperature: Math.round(detailedMetrics[0].temperature) },
        memory: { used: Math.round(detailedMetrics[0].memory * 0.32), total: 32, usage: Math.round(detailedMetrics[0].memory) },
        disk: { used: Math.round(detailedMetrics[0].disk * 10), total: 1000, usage: Math.round(detailedMetrics[0].disk) },
        network: { bytesIn: Math.round(detailedMetrics[0].network * 0.6), bytesOut: Math.round(detailedMetrics[0].network * 0.4), packetsIn: Math.round(detailedMetrics[0].network * 10), packetsOut: Math.round(detailedMetrics[0].network * 8) },
        timestamp: timestamp.toISOString(),
        uptime: 2592000 - (status === 'critical' ? 300 : 0)
      }
    };
  });

  return {
    hour: hour,
    timestamp: timestamp.toISOString(),
    scenario: currentScenario ? currentScenario.name : '정상 운영',
    trafficFactor: currentScenario ? (currentScenario.incidents.some(i => i.status === 'critical') ? 2.5 : 1.5) : 1.0,
    servers: servers,
    
    // 🤖 AI 컨텍스트 데이터
    aiContext: currentScenario ? generateAIContext(currentScenario, currentScenario.incidents) : {
      scenario_type: '정상 운영',
      business_impact: '모든 시스템이 정상적으로 운영되고 있습니다',
      severity_level: 'low',
      affected_services: [],
      natural_language_summary: '현재 모든 서버가 정상 상태입니다'
    }
  };
}

// 🎯 메인 실행
async function generateRealisticScenarios() {
  console.log('🎯 의미 있는 24시간 장애 시나리오 생성 시작...');
  
  const outputDir = path.join(__dirname, '..', 'public', 'server-scenarios', 'hourly-metrics');
  
  // 디렉토리 생성
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // 24시간 데이터 생성
  for (let hour = 0; hour < 24; hour++) {
    const hourlyData = generateHourlyData(hour);
    const filename = `${hour.toString().padStart(2, '0')}.json`;
    const filepath = path.join(outputDir, filename);
    
    fs.writeFileSync(filepath, JSON.stringify(hourlyData, null, 2));
    console.log(`✅ ${filename}: ${hourlyData.scenario} (${hourlyData.aiContext.severity_level} 심각도)`);
  }

  // 📊 요약 통계 출력
  console.log('\n📊 24시간 장애 시나리오 요약:');
  console.log('🚨 Critical 상태: 2개 시나리오 (12-14시, 18-20시)');
  console.log('⚠️ Warning 상태: 6개 시나리오에서 총 8개 경고');
  console.log('⏱️ 30초 간격 데이터: 시간당 120개 포인트 (총 2,880개/일)');
  console.log('🤖 AI 컨텍스트: 자연어 질의, 자동 보고서 생성 준비 완료');
  
  console.log('\n🎉 현실적인 24시간 장애 시나리오 생성 완료!');
}

// 스크립트 실행
if (require.main === module) {
  generateRealisticScenarios().catch(console.error);
}

module.exports = { generateRealisticScenarios, SERVERS, INCIDENT_SCENARIOS };