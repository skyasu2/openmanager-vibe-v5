import fs from 'fs';
import path from 'path';

// --- Constants ---
const SERVERS = [
  {
    id: 'web-1',
    name: 'WEB-01',
    type: 'web',
    description: '프론트엔드 웹 서버 #1',
  },
  {
    id: 'web-2',
    name: 'WEB-02',
    type: 'web',
    description: '프론트엔드 웹 서버 #2',
  },
  {
    id: 'web-3',
    name: 'WEB-03',
    type: 'web',
    description: '프론트엔드 웹 서버 #3',
  },
  {
    id: 'api-1',
    name: 'API-01',
    type: 'api',
    description: '백엔드 API 서버 #1',
  },
  {
    id: 'api-2',
    name: 'API-02',
    type: 'api',
    description: '백엔드 API 서버 #2',
  },
  {
    id: 'api-3',
    name: 'API-03',
    type: 'api',
    description: '백엔드 API 서버 #3',
  },
  {
    id: 'db-primary',
    name: 'DB-PRIMARY',
    type: 'database',
    description: '주 데이터베이스 서버',
  },
  {
    id: 'db-read-1',
    name: 'DB-READ-01',
    type: 'database',
    description: '읽기 복제본 #1',
  },
  {
    id: 'db-read-2',
    name: 'DB-READ-02',
    type: 'database',
    description: '읽기 복제본 #2',
  },
  {
    id: 'cache-1',
    name: 'CACHE-01',
    type: 'cache',
    description: 'Redis 캐시 서버 #1',
  },
  {
    id: 'cache-2',
    name: 'CACHE-02',
    type: 'cache',
    description: 'Redis 캐시 서버 #2',
  },
  {
    id: 'storage-1',
    name: 'STORAGE-01',
    type: 'storage',
    description: '파일 스토리지 서버',
  },
  {
    id: 'storage-2',
    name: 'STORAGE-02',
    type: 'storage',
    description: '백업 스토리지 서버',
  },
  {
    id: 'log-server',
    name: 'LOG-01',
    type: 'log',
    description: '로그 수집 서버',
  },
  {
    id: 'monitoring',
    name: 'MONITOR-01',
    type: 'monitoring',
    description: '모니터링 서버',
  },
];

const normalMetrics: any = {
  web: {
    cpu: 30,
    memory: 45,
    disk: 60,
    network: 40,
    responseTime: 100,
    errorRate: 0.1,
  },
  api: {
    cpu: 35,
    memory: 50,
    disk: 55,
    network: 50,
    responseTime: 150,
    errorRate: 0.2,
  },
  database: {
    cpu: 40,
    memory: 60,
    disk: 70,
    network: 45,
    responseTime: 50,
    errorRate: 0.05,
  },
  cache: {
    cpu: 25,
    memory: 55,
    disk: 40,
    network: 60,
    responseTime: 10,
    errorRate: 0.01,
  },
  storage: { cpu: 20, memory: 40, disk: 75, network: 35 },
  log: { cpu: 30, memory: 50, disk: 80, network: 40 },
  monitoring: { cpu: 25, memory: 45, disk: 65, network: 30 },
};

// --- Utils ---
function generateCurve(
  startValue: number,
  endValue: number,
  points: number,
  curveType: string
): number[] {
  const result: number[] = [];
  for (let i = 0; i < points; i++) {
    const progress = i / (points - 1);
    let value = startValue;
    if (curveType === 'linear')
      value = startValue + (endValue - startValue) * progress;
    else if (curveType === 'exponential')
      value = startValue + (endValue - startValue) * Math.pow(progress, 2);
    else if (curveType === 'spike')
      value = startValue + (endValue - startValue) * Math.min(1, progress * 2);

    const noise = (Math.random() - 0.5) * value * 0.04;
    result.push(Math.max(0, Math.min(100, value + noise)));
  }
  return result;
}

function generate24HourData(serverId: string) {
  const data = [];
  const server = SERVERS.find((s) => s.id === serverId);
  if (!server) return [];

  // Simplified generation: mostly normal with some random variations to simulate "alive" servers
  // We are skipping complex scenarios for this standalone script to ensure it runs without dependencies
  // But we will add some "patterns" based on server type

  for (let hour = 0; hour < 24; hour++) {
    const isPeakHour = hour >= 9 && hour <= 18; // 9 AM to 6 PM
    const loadFactor = isPeakHour ? 1.5 : 0.8;

    for (let min = 0; min < 60; min += 5) {
      const base = normalMetrics[server.type];
      const noise = (Math.random() - 0.5) * 5;

      // Simulate daily cycle
      const timeFactor =
        Math.sin(((hour + min / 60) / 24) * Math.PI * 2 - Math.PI / 2) * 0.2 +
        1; // 0.8 to 1.2

      data.push({
        cpu: Math.max(
          0,
          Math.min(100, base.cpu * loadFactor * timeFactor + noise)
        ),
        memory: Math.max(
          0,
          Math.min(100, base.memory * loadFactor * 0.9 + noise)
        ), // Memory is more stable
        disk: Math.max(0, Math.min(100, base.disk + ((hour * 0.5) % 20))), // Disk grows slowly then resets (simulated cleanup)
        network: Math.max(
          0,
          Math.min(100, base.network * loadFactor * timeFactor + noise)
        ),
        responseTime: base.responseTime
          ? base.responseTime * loadFactor
          : undefined,
        errorRate: base.errorRate
          ? Math.max(0, base.errorRate + (Math.random() > 0.9 ? 0.5 : 0))
          : undefined,
      });
    }
  }
  return data;
}

// --- Main ---
const outputDir = path.join(process.cwd(), 'public', 'data');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const outputPath = path.join(outputDir, 'server-metrics-24h.json');
console.log('Generating 24h static metrics data (Standalone)...');

const allServerData: Record<string, any> = {};

SERVERS.forEach((server) => {
  const data = generate24HourData(server.id);
  allServerData[server.id] = {
    info: server,
    metrics: data,
  };
  console.log(`✓ Generated data for ${server.name} (${data.length} points)`);
});

fs.writeFileSync(outputPath, JSON.stringify(allServerData, null, 2));
console.log(`\n✅ Successfully generated static metrics at: ${outputPath}`);
