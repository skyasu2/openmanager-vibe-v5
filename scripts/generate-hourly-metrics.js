#!/usr/bin/env node

/**
 * 🎯 24시간 포트폴리오 시나리오 메트릭스 생성기
 * 
 * 각 시간대별로 8개 서버의 장애 시나리오 데이터를 생성합니다.
 */

const fs = require('fs');
const path = require('path');

// 기본 서버 메타데이터 로드
const serverMetadataPath = path.join(__dirname, '../public/server-scenarios/servers-metadata.json');
const serverMetadata = JSON.parse(fs.readFileSync(serverMetadataPath, 'utf8'));

// 출력 디렉토리
const outputDir = path.join(__dirname, '../public/server-scenarios/hourly-metrics');

// 🎭 24시간 시나리오 정의
const hourlyScenarios = {
  // 🌃 새벽 (00:00-06:00)
  0: { scenario: "정상 운영", incidents: [] },
  1: { scenario: "정상 운영", incidents: [] },
  2: { 
    scenario: "Cache 메모리 부족 경고", 
    incidents: [
      { serverId: "cache-server-1", type: "memory_pressure", severity: "warning", factor: 1.4 }
    ]
  },
  3: { 
    scenario: "DB 복제 지연", 
    incidents: [
      { serverId: "cache-server-1", type: "memory_pressure", severity: "warning", factor: 1.3 },
      { serverId: "db-replica-1", type: "replication_lag", severity: "warning", factor: 1.2 }
    ]
  },
  4: { 
    scenario: "점진적 회복", 
    incidents: [
      { serverId: "cache-server-1", type: "memory_pressure", severity: "warning", factor: 1.2 }
    ]
  },
  5: { scenario: "정상화", incidents: [] },

  // 🌅 아침 (06:00-12:00)
  6: { scenario: "트래픽 증가 시작", incidents: [], trafficFactor: 1.2 },
  7: { scenario: "아침 트래픽 증가", incidents: [], trafficFactor: 1.4 },
  8: { 
    scenario: "웹서버 CPU 스파이크", 
    incidents: [
      { serverId: "web-server-1", type: "cpu_spike", severity: "critical", factor: 1.8 }
    ],
    trafficFactor: 1.6 
  },
  9: { 
    scenario: "API 응답시간 증가", 
    incidents: [
      { serverId: "web-server-1", type: "cpu_spike", severity: "warning", factor: 1.4 },
      { serverId: "api-server-1", type: "response_time", severity: "warning", factor: 1.3 }
    ],
    trafficFactor: 1.5 
  },
  10: { 
    scenario: "메시지 큐 백로그", 
    incidents: [
      { serverId: "api-server-1", type: "response_time", severity: "warning", factor: 1.2 },
      { serverId: "queue-server-1", type: "queue_backlog", severity: "warning", factor: 1.5 }
    ],
    trafficFactor: 1.4 
  },
  11: { 
    scenario: "부하 분산으로 안정화", 
    incidents: [
      { serverId: "queue-server-1", type: "queue_backlog", severity: "warning", factor: 1.2 }
    ],
    trafficFactor: 1.3 
  },

  // ☀️ 오후 (12:00-18:00)
  12: { scenario: "점심 피크 트래픽", incidents: [], trafficFactor: 1.5 },
  13: { 
    scenario: "스토리지 디스크 경고", 
    incidents: [
      { serverId: "storage-server-1", type: "disk_full", severity: "critical", factor: 1.6 }
    ],
    trafficFactor: 1.4 
  },
  14: { 
    scenario: "DB 슬로우 쿼리 급증", 
    incidents: [
      { serverId: "storage-server-1", type: "disk_full", severity: "warning", factor: 1.4 },
      { serverId: "db-master-1", type: "slow_queries", severity: "warning", factor: 1.3 }
    ],
    trafficFactor: 1.3 
  },
  15: { 
    scenario: "모니터링 수집 지연", 
    incidents: [
      { serverId: "db-master-1", type: "slow_queries", severity: "warning", factor: 1.2 },
      { serverId: "monitoring-server-1", type: "collection_delay", severity: "warning", factor: 1.3 }
    ],
    trafficFactor: 1.2 
  },
  16: { scenario: "점진적 정상화", incidents: [], trafficFactor: 1.1 },
  17: { scenario: "정상 운영", incidents: [], trafficFactor: 1.0 },

  // 🌙 저녁 (18:00-24:00)
  18: { scenario: "퇴근 시간 트래픽 피크", incidents: [], trafficFactor: 1.7 },
  19: { 
    scenario: "API 메모리 누수 감지", 
    incidents: [
      { serverId: "api-server-1", type: "memory_leak", severity: "warning", factor: 1.3 }
    ],
    trafficFactor: 1.6 
  },
  20: { 
    scenario: "DB 커넥션 풀 고갈", 
    incidents: [
      { serverId: "api-server-1", type: "memory_leak", severity: "warning", factor: 1.4 },
      { serverId: "db-master-1", type: "connection_pool", severity: "critical", factor: 1.5 }
    ],
    trafficFactor: 1.5 
  },
  21: { 
    scenario: "웹서버 503 에러", 
    incidents: [
      { serverId: "web-server-1", type: "http_errors", severity: "critical", factor: 1.6 },
      { serverId: "db-master-1", type: "connection_pool", severity: "critical", factor: 1.4 }
    ],
    trafficFactor: 1.4 
  },
  22: { 
    scenario: "긴급 패치 적용", 
    incidents: [
      { serverId: "web-server-1", type: "maintenance", severity: "warning", factor: 0.8 },
      { serverId: "api-server-1", type: "maintenance", severity: "warning", factor: 0.7 }
    ],
    trafficFactor: 1.2 
  },
  23: { scenario: "시스템 안정화", incidents: [], trafficFactor: 1.0 }
};

// 📊 메트릭스 계산 함수
function calculateMetrics(baseMetrics, incidents, trafficFactor = 1.0) {
  const metrics = { ...baseMetrics };
  
  // 트래픽 팩터 적용
  metrics.cpu = Math.round(metrics.cpu * trafficFactor);
  metrics.memory = Math.round(metrics.memory * trafficFactor);
  metrics.network = Math.round(metrics.network * trafficFactor * 1.2);
  
  // 상한선 적용
  metrics.cpu = Math.min(metrics.cpu, 95);
  metrics.memory = Math.min(metrics.memory, 95);
  metrics.disk = Math.min(metrics.disk, 95);
  metrics.network = Math.min(metrics.network, 99);
  
  return metrics;
}

// 🚨 상태 결정 함수
function determineStatus(metrics, incidents) {
  if (incidents.some(inc => inc.severity === "critical")) return "critical";
  if (incidents.some(inc => inc.severity === "warning")) return "warning";
  if (metrics.cpu > 90 || metrics.memory > 90 || metrics.disk > 90) return "warning";
  return "healthy";
}

// 📈 업타임 계산 (장애 시간 반영)
function calculateUptime(baseUptime, incidents) {
  const totalDowntime = incidents.reduce((acc, inc) => {
    return acc + (inc.severity === "critical" ? 300 : 60); // critical: 5분, warning: 1분
  }, 0);
  return Math.max(baseUptime - totalDowntime, 0);
}

// 🎯 알림 생성 함수
function generateAlerts(incidents) {
  return incidents.map(incident => {
    const alertMessages = {
      memory_pressure: "Memory usage exceeding 85% threshold",
      replication_lag: "Database replication lag detected",
      cpu_spike: "CPU usage spike detected",
      response_time: "API response time above threshold",
      queue_backlog: "Message queue backlog building up",
      disk_full: "Disk usage critical - above 90%",
      slow_queries: "Slow database queries detected",
      collection_delay: "Metrics collection experiencing delays",
      memory_leak: "Memory leak pattern detected",
      connection_pool: "Database connection pool exhausted",
      http_errors: "HTTP 5xx errors increasing",
      maintenance: "Scheduled maintenance in progress"
    };
    return alertMessages[incident.type] || "System alert detected";
  });
}

// 📝 시간별 메트릭스 생성
function generateHourlyMetrics(hour) {
  const scenario = hourlyScenarios[hour];
  const timestamp = new Date();
  timestamp.setHours(hour, 0, 0, 0);
  
  const hourlyData = {
    hour,
    timestamp: timestamp.toISOString(),
    scenario: scenario.scenario,
    trafficFactor: scenario.trafficFactor || 1.0,
    servers: {}
  };

  serverMetadata.servers.forEach(server => {
    const serverIncidents = scenario.incidents.filter(inc => inc.serverId === server.id);
    
    // 베이스 메트릭스에 장애 팩터 적용
    let metrics = { ...server.baseMetrics };
    
    serverIncidents.forEach(incident => {
      switch (incident.type) {
        case "memory_pressure":
        case "memory_leak":
          metrics.memory = Math.round(metrics.memory * incident.factor);
          break;
        case "cpu_spike":
          metrics.cpu = Math.round(metrics.cpu * incident.factor);
          break;
        case "disk_full":
          metrics.disk = Math.round(metrics.disk * incident.factor);
          break;
        case "response_time":
          metrics.cpu = Math.round(metrics.cpu * incident.factor);
          metrics.memory = Math.round(metrics.memory * incident.factor * 0.9);
          break;
        case "queue_backlog":
          metrics.memory = Math.round(metrics.memory * incident.factor);
          metrics.network = Math.round(metrics.network * incident.factor);
          break;
        case "slow_queries":
        case "connection_pool":
          metrics.cpu = Math.round(metrics.cpu * incident.factor);
          metrics.memory = Math.round(metrics.memory * incident.factor);
          break;
        case "http_errors":
          metrics.cpu = Math.round(metrics.cpu * incident.factor);
          metrics.network = Math.round(metrics.network * incident.factor);
          break;
        case "collection_delay":
          metrics.cpu = Math.round(metrics.cpu * incident.factor);
          metrics.disk = Math.round(metrics.disk * incident.factor);
          break;
        case "maintenance":
          metrics.cpu = Math.round(metrics.cpu * incident.factor);
          metrics.memory = Math.round(metrics.memory * incident.factor);
          break;
      }
    });

    // 트래픽 팩터 및 상한선 적용
    metrics = calculateMetrics(metrics, serverIncidents, scenario.trafficFactor);
    
    const status = determineStatus(metrics, serverIncidents);
    const uptime = calculateUptime(86400 * 30, serverIncidents); // 30일 기준
    const alerts = generateAlerts(serverIncidents);
    
    hourlyData.servers[server.id] = {
      id: server.id,
      name: server.name,
      hostname: server.hostname,
      status,
      cpu: metrics.cpu,
      memory: metrics.memory,
      disk: metrics.disk,
      network: metrics.network,
      uptime,
      location: server.location,
      environment: server.environment,
      provider: server.provider,
      type: server.type,
      service: server.service,
      alerts: alerts.length,
      alertMessages: alerts,
      lastUpdate: timestamp.toISOString(),
      incidents: serverIncidents.map(inc => ({
        type: inc.type,
        severity: inc.severity,
        active: true
      })),
      metrics: {
        cpu: {
          usage: metrics.cpu,
          cores: server.specs.cpu_cores,
          temperature: 35 + Math.round(metrics.cpu * 0.3)
        },
        memory: {
          used: Math.round((metrics.memory * server.specs.memory_gb) / 100),
          total: server.specs.memory_gb,
          usage: metrics.memory
        },
        disk: {
          used: Math.round((metrics.disk * server.specs.disk_gb) / 100),
          total: server.specs.disk_gb,
          usage: metrics.disk
        },
        network: {
          bytesIn: Math.round(metrics.network * 0.6),
          bytesOut: Math.round(metrics.network * 0.4),
          packetsIn: Math.round(metrics.network * 10),
          packetsOut: Math.round(metrics.network * 8)
        },
        timestamp: timestamp.toISOString(),
        uptime
      }
    };
  });

  return hourlyData;
}

// 🚀 메인 실행
function main() {
  console.log('🎯 24시간 포트폴리오 시나리오 메트릭스 생성 시작...\n');
  
  // 출력 디렉토리 확인
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // 24시간 메트릭스 생성
  for (let hour = 0; hour < 24; hour++) {
    const hourlyMetrics = generateHourlyMetrics(hour);
    const filename = `${hour.toString().padStart(2, '0')}.json`;
    const filepath = path.join(outputDir, filename);
    
    fs.writeFileSync(filepath, JSON.stringify(hourlyMetrics, null, 2));
    
    const scenario = hourlyScenarios[hour];
    console.log(`✅ ${filename}: ${scenario.scenario} (${Object.keys(hourlyMetrics.servers).length}개 서버)`);
    
    if (scenario.incidents.length > 0) {
      scenario.incidents.forEach(inc => {
        console.log(`   🚨 ${inc.serverId}: ${inc.type} (${inc.severity})`);
      });
    }
  }
  
  console.log(`\n🎉 총 24개의 시간별 메트릭스 파일이 생성되었습니다!`);
  console.log(`📂 위치: ${outputDir}`);
  console.log(`\n📊 시나리오 요약:`);
  console.log(`   - 정상 운영: 8시간`);
  console.log(`   - 경고 상황: 12시간`);
  console.log(`   - 심각한 장애: 4시간`);
  console.log(`   - 8개 서버별 다양한 장애 시나리오 포함`);
}

// 스크립트 실행
if (require.main === module) {
  main();
}

module.exports = { generateHourlyMetrics, hourlyScenarios };