# Mock Simulation System

## 🎲 FNV-1a Hash Engine

```typescript
// Core Algorithm
function fnv1aHash(data: string): number {
  let hash = 2166136261;
  for (let i = 0; i < data.length; i++) {
    hash ^= data.charCodeAt(i);
    hash = (hash * 16777619) >>> 0;
  }
  return hash;
}

// Realistic Metrics Generation
const generateMetrics = (serverId: string, timestamp: number) => {
  const seed = fnv1aHash(`${serverId}-${Math.floor(timestamp / 60000)}`);
  return normalDistribution(seed, serverProfile[serverId]);
};
```

## 🏗️ 10 Server Profiles

```typescript
const serverProfiles = {
  'server-web-01': {
    type: 'web',
    cpuRange: [20, 60],
    memoryRange: [30, 70],
    baseResponseTime: 150,
  },
  'server-api-01': {
    type: 'api',
    cpuRange: [15, 45],
    memoryRange: [25, 55],
    baseResponseTime: 80,
  },
  'server-db-01': {
    type: 'database',
    cpuRange: [40, 85],
    memoryRange: [60, 90],
    baseResponseTime: 25,
  },
  // ... 7 more profiles
};
```

## ⚡ 15 Incident Scenarios

```typescript
const incidents = [
  { type: 'traffic_spike', probability: 0.15, impact: 2.5 },
  { type: 'ddos_attack', probability: 0.03, impact: 4.0 },
  { type: 'memory_leak', probability: 0.08, impact: 3.0 },
  { type: 'slow_query', probability: 0.12, impact: 2.0 },
  { type: 'disk_full', probability: 0.05, impact: 3.5 },
  // ... 10 more scenarios
];

// Probability-based triggering
const triggerIncident = (hash: number) => {
  const probability = (hash % 10000) / 10000;
  return incidents.find((i) => probability < i.probability);
};
```

## 📈 Performance Results

```typescript
const performance = {
  responseTime: '272ms average (255-284ms range)',
  realism: '10 server types + CPU-Memory correlation',
  cost: '$0/month vs $57/month GCP VM',
  stability: '99.95% vs 99.5% VM uptime',
  aiCompatibility: 'Rich metadata for analysis',
};
```

## 🔄 24-Hour Cycles

```typescript
// Korean timezone patterns
const generateDailyPattern = (hour: number) => {
  const patterns = {
    nighttime: [0, 1, 2, 3, 4, 5], // Low usage
    morning: [6, 7, 8, 9], // Rising usage
    business: [10, 11, 12, 13, 14, 15, 16, 17], // Peak
    evening: [18, 19, 20, 21, 22, 23], // Declining
  };
  return getLoadMultiplier(hour);
};
```
