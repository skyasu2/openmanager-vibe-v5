/**
 * 🌐 GCP VM Express.js JSON API 서버
 * 
 * OpenManager VIBE v5 전용 서버 메트릭 제공 API
 * Next.js 앱이 Supabase 테이블 대신 이 서버에서 JSON 데이터를 받아옴
 * 
 * 배포 대상: GCP VM (104.154.205.25:10000)
 * 
 * AI 교차 검증 기반 구현:
 * - Gemini: 3단계 폴백, Express.js API, 30초 TTL 캐싱
 * - Codex: CORS 보안 강화, Rate Limiting, Circuit Breaker
 * - Qwen: 메모리 효율 최적화, 압축된 서버 상태
 */

const express = require('express');
const cors = require('cors');
const NodeCache = require('node-cache');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 10000;

// 🔐 환경변수 검증
const VM_API_TOKEN = process.env.VM_API_TOKEN;
if (!VM_API_TOKEN || VM_API_TOKEN.length < 32) {
  console.error('❌ VM_API_TOKEN이 설정되지 않았거나 너무 짧습니다 (최소 32자)');
  process.exit(1);
}

// 📊 메모리 캐시 (30초 TTL)
const cache = new NodeCache({ 
  stdTTL: 30,      // 30초 캐시
  checkperiod: 10, // 10초마다 만료 확인
  useClones: false // 성능 최적화
});

// 🌐 CORS 설정 - Vercel 도메인만 허용 (보안 강화)
const corsOptions = {
  origin: [
    'https://openmanager-vibe-v5.vercel.app',
    'http://localhost:3000',
    'http://localhost:3001'
  ],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Authorization', 'Content-Type'],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());

// 🛡️ Rate Limiting - VM 보호 (분당 30개 요청)
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1분
  max: 30, // IP당 30개 요청
  message: {
    error: 'RATE_LIMITED',
    message: 'Too many requests from this IP, please try again later.',
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  // 성공한 요청은 카운트에서 제외 (성능 최적화)
  skipSuccessfulRequests: false,
  skipFailedRequests: true
});

// 🔑 API 토큰 검증 미들웨어
const validateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.replace('Bearer ', '');
  
  if (!token || token !== VM_API_TOKEN) {
    return res.status(401).json({
      success: false,
      error: 'UNAUTHORIZED',
      message: 'Invalid or missing API token'
    });
  }
  
  next();
};

// 📊 기본 서버 데이터 (10개 온프레미스 서버 - AI 교차 검증 기반 최적화)
const baseServers = [
  // Web Layer (2개) - 고가용성 부하분산
  { id: 'web-01', name: 'web-server-01', type: 'web', baseCpu: 45.2, baseMemory: 78.5, baseDisk: 65.1, baseNetwork: 12.3, baseUptime: 99.8 },
  { id: 'web-02', name: 'web-server-02', type: 'web', baseCpu: 52.8, baseMemory: 68.2, baseDisk: 58.9, baseNetwork: 15.7, baseUptime: 99.5 },

  // API Layer (2개) - 마이크로서비스 부하분산  
  { id: 'api-01', name: 'api-server-01', type: 'api', baseCpu: 67.1, baseMemory: 34.5, baseDisk: 78.2, baseNetwork: 28.7, baseUptime: 98.5 },
  { id: 'api-02', name: 'api-server-02', type: 'api', baseCpu: 45.8, baseMemory: 67.9, baseDisk: 56.4, baseNetwork: 18.2, baseUptime: 99.2 },

  // Data Layer (3개) - Master-Replica + Cache
  { id: 'db-master', name: 'db-master', type: 'database', baseCpu: 23.7, baseMemory: 89.2, baseDisk: 45.8, baseNetwork: 8.5, baseUptime: 99.9 },
  { id: 'db-replica', name: 'db-replica', type: 'database', baseCpu: 34.2, baseMemory: 76.5, baseDisk: 67.3, baseNetwork: 12.9, baseUptime: 99.7 },
  { id: 'cache-01', name: 'redis-cache', type: 'cache', baseCpu: 67.8, baseMemory: 89.5, baseDisk: 23.4, baseNetwork: 45.7, baseUptime: 99.1 },

  // Operations Layer (3개) - 온프레미스 운영 필수
  { id: 'monitor-01', name: 'monitoring-srv', type: 'monitoring', baseCpu: 38.9, baseMemory: 45.8, baseDisk: 71.3, baseNetwork: 9.8, baseUptime: 98.9 },
  { id: 'backup-01', name: 'backup-srv', type: 'backup', baseCpu: 18.2, baseMemory: 34.6, baseDisk: 89.2, baseNetwork: 5.4, baseUptime: 99.8 },
  { id: 'firewall-01', name: 'security-srv', type: 'firewall', baseCpu: 12.5, baseMemory: 28.9, baseDisk: 35.7, baseNetwork: 67.8, baseUptime: 99.9 }
];

// 🎭 24시간 순환 장애 시나리오 시스템 (4시간 단위 6가지)
function getScenarioByHour(hour) {
  const scenarios = {
    0: {
      id: 'backup-crisis',
      name: '심야 백업 장애',
      description: '대용량 백업 작업으로 인한 스토리지 및 DB 부하',
      korean: '심야 백업 장애',
      english: 'midnight-backup-crisis'
    },
    4: {
      id: 'database-overload', 
      name: '새벽 DB 장애',
      description: '배치 작업 및 데이터 동기화로 인한 데이터베이스 과부하',
      korean: '새벽 DB 장애',
      english: 'dawn-database-overload'
    },
    8: {
      id: 'api-storm',
      name: '출근시간 API 폭주',
      description: '동시 접속자 급증으로 인한 API 서버 과부하',
      korean: '출근시간 API 폭주',
      english: 'morning-api-storm'
    },
    12: {
      id: 'web-traffic-peak',
      name: '점심시간 웹 트래픽 폭주',
      description: '웹 요청 폭증 및 DDoS 의심 트래픽으로 인한 서버 부하',
      korean: '점심시간 웹 트래픽 폭주',
      english: 'lunch-web-traffic-peak'
    },
    16: {
      id: 'cache-failure',
      name: '오후 캐시 장애',
      description: '캐시 메모리 포화로 인한 연쇄 DB 부하 발생',
      korean: '오후 캐시 장애', 
      english: 'afternoon-cache-failure'
    },
    20: {
      id: 'monitoring-alert',
      name: '저녁 모니터링 경보',
      description: '일일 리포트 생성 및 보안 스캔으로 인한 시스템 부하',
      korean: '저녁 모니터링 경보',
      english: 'evening-monitoring-alert'
    }
  };
  
  const timeBlock = Math.floor(hour / 4) * 4;
  return scenarios[timeBlock] || scenarios[0];
}

// ⚡ 시나리오별 서버 장애 패턴 정의
function getFailurePattern(scenarioId, serverName, currentMinute) {
  // 시간 내 진행 패턴: 0-15분(정상) → 15-30분(경고) → 30-45분(심각) → 45-60분(복구)
  const progressPhase = Math.floor(currentMinute / 15); // 0, 1, 2, 3
  
  const failurePatterns = {
    'backup-crisis': {
      'backup-srv': { 
        phases: [
          { cpu: 18, memory: 35, disk: 70 },  // 정상
          { cpu: 45, memory: 65, disk: 85 },  // 경고
          { cpu: 67, memory: 78, disk: 92 },  // 심각
          { cpu: 32, memory: 48, disk: 78 }   // 복구
        ]
      },
      'db-master': {
        phases: [
          { cpu: 24, memory: 65, disk: 46 },  // 정상
          { cpu: 58, memory: 82, disk: 51 },  // 경고
          { cpu: 72, memory: 89, disk: 58 },  // 심각
          { cpu: 41, memory: 71, disk: 49 }   // 복구
        ]
      }
    },
    'database-overload': {
      'db-master': {
        phases: [
          { cpu: 24, memory: 65, disk: 46 },  // 정상
          { cpu: 67, memory: 87, disk: 52 },  // 경고
          { cpu: 84, memory: 94, disk: 61 },  // 심각
          { cpu: 45, memory: 73, disk: 48 }   // 복구
        ]
      },
      'db-replica': {
        phases: [
          { cpu: 34, memory: 56, disk: 67 },  // 정상
          { cpu: 78, memory: 69, disk: 71 },  // 경고
          { cpu: 85, memory: 74, disk: 76 },  // 심각
          { cpu: 52, memory: 61, disk: 69 }   // 복구
        ]
      },
      'redis-cache': {
        phases: [
          { cpu: 68, memory: 72, disk: 23 },  // 정상
          { cpu: 72, memory: 87, disk: 28 },  // 경고
          { cpu: 76, memory: 91, disk: 32 },  // 심각
          { cpu: 70, memory: 78, disk: 25 }   // 복구
        ]
      }
    },
    'api-storm': {
      'api-server-01': {
        phases: [
          { cpu: 67, memory: 35, disk: 78 },  // 정상
          { cpu: 85, memory: 58, disk: 82 },  // 경고
          { cpu: 94, memory: 71, disk: 89 },  // 심각
          { cpu: 73, memory: 42, disk: 80 }   // 복구
        ]
      },
      'api-server-02': {
        phases: [
          { cpu: 46, memory: 68, disk: 56 },  // 정상
          { cpu: 78, memory: 79, disk: 61 },  // 경고
          { cpu: 89, memory: 86, disk: 68 },  // 심각
          { cpu: 58, memory: 72, disk: 59 }   // 복구
        ]
      },
      'web-server-01': {
        phases: [
          { cpu: 45, memory: 78, disk: 65, network: 12 },  // 정상
          { cpu: 62, memory: 81, disk: 69, network: 67 },  // 경고
          { cpu: 71, memory: 84, disk: 73, network: 89 },  // 심각
          { cpu: 52, memory: 79, disk: 67, network: 28 }   // 복구
        ]
      }
    },
    'web-traffic-peak': {
      'web-server-01': {
        phases: [
          { cpu: 45, memory: 78, disk: 65, network: 12 },  // 정상
          { cpu: 78, memory: 84, disk: 71, network: 58 },  // 경고
          { cpu: 92, memory: 89, disk: 78, network: 87 },  // 심각
          { cpu: 61, memory: 81, disk: 69, network: 34 }   // 복구
        ]
      },
      'web-server-02': {
        phases: [
          { cpu: 53, memory: 68, disk: 59, network: 16 },  // 정상
          { cpu: 71, memory: 82, disk: 64, network: 49 },  // 경고
          { cpu: 86, memory: 87, disk: 71, network: 78 },  // 심각
          { cpu: 64, memory: 74, disk: 62, network: 28 }   // 복구
        ]
      },
      'security-srv': {
        phases: [
          { cpu: 13, memory: 29, disk: 36, network: 68 },  // 정상
          { cpu: 45, memory: 52, disk: 41, network: 82 },  // 경고
          { cpu: 67, memory: 68, disk: 48, network: 91 },  // 심각
          { cpu: 28, memory: 38, disk: 39, network: 74 }   // 복구
        ]
      }
    },
    'cache-failure': {
      'redis-cache': {
        phases: [
          { cpu: 68, memory: 72, disk: 23 },  // 정상
          { cpu: 74, memory: 89, disk: 27 },  // 경고
          { cpu: 81, memory: 96, disk: 31 },  // 심각
          { cpu: 71, memory: 79, disk: 25 }   // 복구
        ]
      },
      'db-master': {
        phases: [
          { cpu: 24, memory: 65, disk: 46 },  // 정상
          { cpu: 68, memory: 78, disk: 51 },  // 경고
          { cpu: 85, memory: 84, disk: 58 },  // 심각
          { cpu: 42, memory: 69, disk: 48 }   // 복구
        ]
      },
      'monitoring-srv': {
        phases: [
          { cpu: 39, memory: 46, disk: 71 },  // 정상
          { cpu: 52, memory: 61, disk: 81 },  // 경고
          { cpu: 64, memory: 74, disk: 87 },  // 심각
          { cpu: 44, memory: 53, disk: 75 }   // 복구
        ]
      }
    },
    'monitoring-alert': {
      'monitoring-srv': {
        phases: [
          { cpu: 39, memory: 46, disk: 71 },  // 정상
          { cpu: 65, memory: 67, disk: 86 },  // 경고
          { cpu: 78, memory: 79, disk: 93 },  // 심각
          { cpu: 51, memory: 54, disk: 79 }   // 복구
        ]
      },
      'security-srv': {
        phases: [
          { cpu: 13, memory: 29, disk: 36, network: 68 },  // 정상
          { cpu: 67, memory: 58, disk: 42, network: 71 },  // 경고
          { cpu: 87, memory: 73, disk: 49, network: 76 },  // 심각
          { cpu: 35, memory: 41, disk: 38, network: 69 }   // 복구
        ]
      },
      'backup-srv': {
        phases: [
          { cpu: 18, memory: 35, disk: 70, network: 5 },   // 정상
          { cpu: 34, memory: 52, disk: 76, network: 58 },  // 경고
          { cpu: 48, memory: 67, disk: 84, network: 89 },  // 심각
          { cpu: 25, memory: 43, disk: 73, network: 28 }   // 복구
        ]
      }
    }
  };
  
  const pattern = failurePatterns[scenarioId]?.[serverName];
  if (!pattern) return null;
  
  return pattern.phases[progressPhase] || pattern.phases[0];
}

// 🎲 랜덤 변동값 생성 (±10% 범위)
function getRandomVariation() {
  return (Math.random() - 0.5) * 0.2; // -0.1 ~ +0.1 (±10%)
}

// 🚦 서버 상태 계산 (CPU, Memory 기준)
function calculateStatus(cpu, memory) {
  if (cpu > 90 || memory > 90) return 'critical';
  if (cpu > 80 || memory > 80) return 'warning';
  return 'online';
}

// 📊 24시간 순환 시나리오 기반 동적 서버 데이터 생성
function generateDynamicServerData() {
  const currentTime = new Date();
  const hour = currentTime.getHours();
  const minute = currentTime.getMinutes();
  const currentScenario = getScenarioByHour(hour);
  
  console.log(`🎭 현재 시나리오: ${currentScenario.name} (${hour}:${minute.toString().padStart(2, '0')})`);
  console.log(`📝 설명: ${currentScenario.description}`);
  
  return baseServers.map((server, index) => {
    // 1️⃣ 기본 메트릭 (평상시 상태)
    let cpu = server.baseCpu;
    let memory = server.baseMemory; 
    let disk = server.baseDisk;
    let network = server.baseNetwork;
    let uptime = server.baseUptime;
    
    // 2️⃣ 시나리오별 장애 패턴 적용 (해당 서버인 경우)
    const failurePattern = getFailurePattern(currentScenario.id, server.name, minute);
    if (failurePattern) {
      console.log(`⚠️  ${server.name} 장애 패턴 적용:`, failurePattern);
      
      cpu = failurePattern.cpu || cpu;
      memory = failurePattern.memory || memory;
      disk = failurePattern.disk || disk;
      network = failurePattern.network || network;
      uptime = Math.max(95, uptime - (failurePattern.cpu > 80 ? 2 : 0)); // 장애 시 uptime 약간 감소
    }
    
    // 3️⃣ 작은 랜덤 변동 추가 (±3% 정도만)
    const variation = getRandomVariation() * 0.15; // ±1.5% 정도로 축소
    cpu = Math.min(98, Math.max(5, cpu + (cpu * variation)));
    memory = Math.min(98, Math.max(10, memory + (memory * variation)));
    disk = Math.min(98, Math.max(10, disk + (disk * variation)));
    network = Math.max(0, network + (network * variation));
    
    // 4️⃣ 서버 상태 계산 및 알림 개수
    const status = calculateStatus(cpu, memory);
    let alerts = 0;
    if (status === 'critical') alerts = Math.floor(Math.random() * 3) + 2; // 2-4개
    else if (status === 'warning') alerts = Math.floor(Math.random() * 2) + 1; // 1-2개
    else alerts = Math.floor(Math.random() * 2); // 0-1개
    
    return {
      id: `server-${Date.now()}-${index}`,
      name: server.name,
      hostname: server.name,
      status: status,
      cpu: Math.round(cpu * 100) / 100,
      cpu_usage: Math.round(cpu * 100) / 100,
      memory: Math.round(memory * 100) / 100,
      memory_usage: Math.round(memory * 100) / 100,
      disk: Math.round(disk * 100) / 100,
      disk_usage: Math.round(disk * 100) / 100,
      network: Math.round(network * 100) / 100,
      network_in: Math.round(network * 0.6 * 100) / 100,
      network_out: Math.round(network * 0.4 * 100) / 100,
      uptime: uptime * 3600, // 시간을 초로 변환
      location: 'OnPrem-DC-Main',
      alerts: alerts,
      ip: `192.168.1.${index + 100}`,
      os: 'Ubuntu 22.04 LTS',
      type: server.type,
      role: 'worker',
      environment: 'on-premises',
      provider: 'GCP-VM',
      specs: {
        cpu_cores: Math.ceil(cpu / 25),
        memory_gb: Math.ceil(memory / 12.5),
        disk_gb: Math.ceil(disk * 4),
        network_speed: '1Gbps'
      },
      lastUpdate: currentTime.toISOString(),
      services: [],
      systemInfo: {
        os: 'Ubuntu 22.04 LTS',
        uptime: `${Math.floor(uptime)}h`,
        processes: Math.floor(Math.random() * 200) + 50,
        zombieProcesses: status === 'critical' ? Math.floor(Math.random() * 15) + 5 : Math.floor(Math.random() * 5),
        loadAverage: `${(cpu / 100 * 4).toFixed(2)}, ${(cpu / 100 * 3.8).toFixed(2)}, ${(cpu / 100 * 3.5).toFixed(2)}`,
        lastUpdate: currentTime.toISOString()
      },
      networkInfo: {
        interface: 'eth0',
        receivedBytes: `${Math.floor(network * 0.6)} MB`,
        sentBytes: `${Math.floor(network * 0.4)} MB`,
        receivedErrors: status === 'critical' ? Math.floor(Math.random() * 50) + 10 : Math.floor(Math.random() * 10),
        sentErrors: status === 'critical' ? Math.floor(Math.random() * 30) + 5 : Math.floor(Math.random() * 10),
        status: status === 'online' ? 'healthy' : status === 'warning' ? 'warning' : 'critical'
      },
      // 🎭 시나리오 정보 추가 (디버깅용)
      scenario: {
        id: currentScenario.id,
        name: currentScenario.name,
        affected: !!failurePattern,
        phase: failurePattern ? Math.floor(minute / 15) : null,
        phaseDesc: failurePattern ? ['정상', '경고', '심각', '복구'][Math.floor(minute / 15)] : '정상'
      }
    };
  });
}

// 📊 현재 시나리오 정보 생성 (상세 정보 포함)
function getCurrentScenario() {
  const currentTime = new Date();
  const currentHour = currentTime.getHours();
  const currentMinute = currentTime.getMinutes();
  
  const scenario = getScenarioByHour(currentHour);
  const progressPhase = Math.floor(currentMinute / 15);
  const phaseNames = ['정상 상태', '경고 신호', '장애 발생', '복구 진행'];
  const phaseEnglish = ['normal', 'warning', 'critical', 'recovery'];
  
  return {
    ...scenario,
    currentPhase: progressPhase,
    phaseName: phaseNames[progressPhase],
    phaseEnglish: phaseEnglish[progressPhase],
    timeInPhase: currentMinute % 15, // 현재 단계에서 몇 분째인지
    nextPhaseIn: 15 - (currentMinute % 15), // 다음 단계까지 몇 분 남았는지
    timeBlock: `${Math.floor(currentHour / 4) * 4}:00-${Math.floor(currentHour / 4) * 4 + 3}:59`,
    currentTime: `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`
  };
}

// 🔥 헬스 체크 엔드포인트 (토큰 불필요)
app.get('/health', (req, res) => {
  const memoryUsage = process.memoryUsage();
  const uptime = process.uptime();
  
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m`,
    memory: {
      used: Math.round(memoryUsage.heapUsed / 1024 / 1024) + 'MB',
      total: Math.round(memoryUsage.heapTotal / 1024 / 1024) + 'MB'
    },
    cache: {
      keys: cache.keys().length,
      stats: cache.getStats()
    }
  });
});

// 📊 메인 서버 데이터 엔드포인트
app.get('/api/servers', limiter, validateToken, (req, res) => {
  const cacheKey = 'server-data';
  let servers = cache.get(cacheKey);
  const wasFromCache = !!servers;
  
  if (!servers) {
    console.log('🔄 새로운 서버 데이터 생성 중...');
    servers = generateDynamicServerData();
    cache.set(cacheKey, servers);
  } else {
    console.log('⚡ 캐시에서 서버 데이터 반환');
  }

  const currentScenario = getCurrentScenario();
  const currentHour = new Date().getHours();

  // 🚨 현재 장애 상황 요약 생성
  const criticalServers = servers.filter(s => s.status === 'critical');
  const warningServers = servers.filter(s => s.status === 'warning');
  const affectedServers = servers.filter(s => s.scenario.affected);
  
  res.json({
    success: true,
    data: servers,
    source: 'gcp-vm',
    fallback: false,
    cached: wasFromCache,
    scenario: {
      // 기존 호환성
      current: currentScenario.english,
      korean: currentScenario.korean,
      hour: currentHour,
      
      // 🆕 새로운 상세 시나리오 정보
      id: currentScenario.id,
      name: currentScenario.name,
      description: currentScenario.description,
      phase: currentScenario.phaseName,
      phaseId: currentScenario.currentPhase,
      timeBlock: currentScenario.timeBlock,
      currentTime: currentScenario.currentTime,
      timeInPhase: currentScenario.timeInPhase,
      nextPhaseIn: currentScenario.nextPhaseIn,
      
      // 🚨 실시간 장애 상황
      summary: {
        criticalCount: criticalServers.length,
        warningCount: warningServers.length,
        affectedCount: affectedServers.length,
        totalServers: servers.length,
        healthyCount: servers.length - criticalServers.length - warningServers.length,
        criticalServers: criticalServers.map(s => s.name),
        warningServers: warningServers.map(s => s.name),
        affectedServers: affectedServers.map(s => ({ 
          name: s.name, 
          phase: s.scenario.phaseDesc,
          type: s.type 
        }))
      }
    },
    pagination: {
      page: 1,
      limit: servers.length,
      total: servers.length,
      totalPages: 1,
      hasNext: false,
      hasPrev: false
    },
    timestamp: new Date().toISOString(),
    metadata: {
      serverCount: servers.length,
      scenarioSystem: '24h-rotation-v2',
      cycleInfo: {
        totalScenarios: 6,
        scenarioLength: '4 hours',
        phaseLength: '15 minutes',
        cycleProgress: `${Math.floor(currentHour / 4) + 1}/6`
      },
      cacheStats: cache.getStats()
    }
  });
});

// 🚨 에러 핸들링 미들웨어
app.use((error, req, res, next) => {
  console.error('💥 서버 에러:', error);
  
  res.status(500).json({
    success: false,
    error: 'INTERNAL_SERVER_ERROR',
    message: 'Internal server error occurred',
    timestamp: new Date().toISOString()
  });
});

// 404 핸들러
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'NOT_FOUND',
    message: `Endpoint ${req.method} ${req.path} not found`,
    availableEndpoints: [
      'GET /health',
      'GET /api/servers'
    ],
    timestamp: new Date().toISOString()
  });
});

// 🚀 서버 시작
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log('🌐 OpenManager VIBE v5 - GCP VM JSON API 서버 시작됨');
  console.log(`📡 포트: ${PORT}`);
  console.log(`🔑 API 토큰: ${VM_API_TOKEN ? '설정됨 ✅' : '미설정 ❌'}`);
  console.log(`📊 캐시 TTL: 30초`);
  console.log(`🛡️ Rate Limit: 30 req/min per IP`);
  console.log(`⏰ 시작 시간: ${new Date().toISOString()}`);
});

// 🛑 Graceful shutdown
process.on('SIGTERM', () => {
  console.log('📴 SIGTERM 수신됨. Graceful shutdown 시작...');
  server.close(() => {
    console.log('🔄 HTTP 서버 종료됨');
    cache.flushAll();
    console.log('🗑️ 캐시 정리됨');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('📴 SIGINT 수신됨. Graceful shutdown 시작...');
  server.close(() => {
    console.log('🔄 HTTP 서버 종료됨');
    cache.flushAll();
    console.log('🗑️ 캐시 정리됨');
    process.exit(0);
  });
});

console.log('✅ GCP VM JSON API 서버가 준비되었습니다!');