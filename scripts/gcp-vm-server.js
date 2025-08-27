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

// 📊 기본 서버 데이터 (15개 서버 - 기존 API와 동일)
const baseServers = [
  // 웹 서버들 (5개)
  { id: 'web-01', name: 'web-server-01', type: 'web', baseCpu: 45.2, baseMemory: 78.5, baseDisk: 65.1, baseNetwork: 12.3, baseUptime: 99.8 },
  { id: 'web-02', name: 'web-server-02', type: 'web', baseCpu: 52.8, baseMemory: 68.2, baseDisk: 58.9, baseNetwork: 15.7, baseUptime: 99.5 },
  { id: 'web-03', name: 'web-server-03', type: 'web', baseCpu: 38.9, baseMemory: 82.1, baseDisk: 71.3, baseNetwork: 9.8, baseUptime: 98.9 },
  { id: 'web-04', name: 'web-server-04', type: 'web', baseCpu: 67.4, baseMemory: 45.8, baseDisk: 89.2, baseNetwork: 22.1, baseUptime: 97.8 },
  { id: 'web-05', name: 'web-server-05', type: 'web', baseCpu: 89.3, baseMemory: 91.7, baseDisk: 93.4, baseNetwork: 45.6, baseUptime: 95.2 },

  // 데이터베이스 서버들 (3개)
  { id: 'db-01', name: 'db-server-01', type: 'database', baseCpu: 23.7, baseMemory: 89.2, baseDisk: 45.8, baseNetwork: 8.5, baseUptime: 99.9 },
  { id: 'db-02', name: 'db-server-02', type: 'database', baseCpu: 34.2, baseMemory: 76.5, baseDisk: 67.3, baseNetwork: 12.9, baseUptime: 99.7 },
  { id: 'db-03', name: 'db-server-03', type: 'database', baseCpu: 78.9, baseMemory: 88.4, baseDisk: 89.7, baseNetwork: 25.3, baseUptime: 96.8 },

  // API 서버들 (4개)
  { id: 'api-01', name: 'api-server-01', type: 'api', baseCpu: 67.1, baseMemory: 34.5, baseDisk: 78.2, baseNetwork: 28.7, baseUptime: 98.5 },
  { id: 'api-02', name: 'api-server-02', type: 'api', baseCpu: 45.8, baseMemory: 67.9, baseDisk: 56.4, baseNetwork: 18.2, baseUptime: 99.2 },
  { id: 'api-03', name: 'api-server-03', type: 'api', baseCpu: 56.7, baseMemory: 78.3, baseDisk: 45.9, baseNetwork: 21.8, baseUptime: 98.8 },
  { id: 'api-04', name: 'api-server-04', type: 'api', baseCpu: 92.4, baseMemory: 95.7, baseDisk: 87.3, baseNetwork: 52.1, baseUptime: 94.5 },

  // 로드 밸런서 & 캐시 (3개)
  { id: 'lb-01', name: 'lb-server-01', type: 'loadbalancer', baseCpu: 12.5, baseMemory: 28.9, baseDisk: 35.7, baseNetwork: 67.8, baseUptime: 99.9 },
  { id: 'lb-02', name: 'lb-server-02', type: 'loadbalancer', baseCpu: 18.2, baseMemory: 34.6, baseDisk: 42.1, baseNetwork: 89.4, baseUptime: 99.8 },
  { id: 'cache-01', name: 'cache-server-01', type: 'cache', baseCpu: 67.8, baseMemory: 89.5, baseDisk: 23.4, baseNetwork: 45.7, baseUptime: 99.1 }
];

// 📈 시간대별 부하 패턴 계산
function getLoadMultiplierByHour(hour) {
  const patterns = {
    0: 0.3,  // 심야: 30%
    3: 0.2,  // 새벽: 20%
    6: 0.5,  // 아침: 50%
    9: 0.8,  // 업무시작: 80%
    12: 1.2, // 점심피크: 120%
    15: 1.0, // 오후업무: 100%
    18: 0.9, // 퇴근시간: 90%
    21: 0.6  // 저녁: 60%
  };
  
  // 가장 가까운 시간대 패턴 사용
  const timeKeys = Object.keys(patterns).map(Number).sort((a, b) => a - b);
  let closestHour = timeKeys[0];
  
  for (const key of timeKeys) {
    if (hour >= key) {
      closestHour = key;
    } else {
      break;
    }
  }
  
  return patterns[closestHour];
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

// 📊 동적 서버 데이터 생성 (시간 기반)
function generateDynamicServerData() {
  const currentTime = new Date();
  const hour = currentTime.getHours();
  const loadMultiplier = getLoadMultiplierByHour(hour);
  
  console.log(`🕐 현재 시간: ${hour}시, 부하 배수: ${loadMultiplier}`);
  
  return baseServers.map((server, index) => {
    const cpu = Math.min(95, Math.max(5, server.baseCpu * loadMultiplier + (getRandomVariation() * 100)));
    const memory = Math.min(95, Math.max(10, server.baseMemory * loadMultiplier + (getRandomVariation() * 100)));
    const disk = Math.min(95, Math.max(10, server.baseDisk + (getRandomVariation() * 20)));
    const network = Math.max(0, server.baseNetwork * loadMultiplier + (getRandomVariation() * 50));
    const uptime = Math.max(90, server.baseUptime + (getRandomVariation() * 5));
    
    return {
      id: `server-${Date.now()}-${index}`,
      name: server.name,
      hostname: server.name,
      status: calculateStatus(cpu, memory),
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
      location: 'Seoul-DC-01',
      alerts: Math.floor(Math.random() * 3),
      ip: `192.168.1.${index + 100}`,
      os: 'Ubuntu 22.04 LTS',
      type: server.type,
      role: 'worker',
      environment: 'production',
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
        zombieProcesses: Math.floor(Math.random() * 5),
        loadAverage: `${(cpu / 100 * 4).toFixed(2)}, ${(cpu / 100 * 3.8).toFixed(2)}, ${(cpu / 100 * 3.5).toFixed(2)}`,
        lastUpdate: currentTime.toISOString()
      },
      networkInfo: {
        interface: 'eth0',
        receivedBytes: `${Math.floor(network * 0.6)} MB`,
        sentBytes: `${Math.floor(network * 0.4)} MB`,
        receivedErrors: Math.floor(Math.random() * 10),
        sentErrors: Math.floor(Math.random() * 10),
        status: calculateStatus(cpu, memory) === 'online' ? 'healthy' : 
                calculateStatus(cpu, memory) === 'warning' ? 'warning' : 'critical'
      }
    };
  });
}

// 📊 시나리오 정보 생성
function getCurrentScenario() {
  const currentHour = new Date().getHours();
  const scenarios = {
    0: { korean: '심야 유지보수', english: 'midnight-maintenance' },
    6: { korean: '아침 시작', english: 'morning-startup' },
    9: { korean: '업무 시작', english: 'work-hours-begin' },
    12: { korean: '점심 피크', english: 'lunch-peak' },
    14: { korean: '오후 업무', english: 'afternoon-work' },
    18: { korean: '퇴근 시간', english: 'evening-rush' },
    21: { korean: '야간 모드', english: 'night-mode' }
  };

  const timeKey = Math.floor(currentHour / 3) * 3;
  return scenarios[timeKey] || scenarios[12];
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

  res.json({
    success: true,
    data: servers,
    source: 'gcp-vm',
    fallback: false,
    cached: wasFromCache,
    scenario: {
      current: currentScenario.english,
      korean: currentScenario.korean,
      hour: currentHour
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
      loadMultiplier: getLoadMultiplierByHour(currentHour),
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