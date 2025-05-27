# 🔗 AI Agent Integration Guide

> **OpenManager AI v5 - 고도화된 AI 에이전트 모듈화 및 시스템 통합 가이드**

## 📋 **개요**

이 가이드는 OpenManager AI v5의 고도화된 AI 에이전트를 기존 서버 모니터링 시스템과 완전히 통합하는 방법을 설명합니다. 모듈화된 아키텍처를 통해 이식성과 확장성을 극대화했습니다.

## 🏗️ **통합 아키텍처**

### **핵심 구성 요소**

```
┌─────────────────────────────────────────────────────────────┐
│                    AI Agent Integration Layer                │
├─────────────────────────────────────────────────────────────┤
│  🔌 SystemIntegrationAdapter                               │
│  ├── 📊 DatabaseAdapter (Supabase/PostgreSQL/MySQL)        │
│  ├── 🚀 CacheAdapter (Redis)                               │
│  └── 📡 DataCollectorAdapter (Server Metrics)              │
├─────────────────────────────────────────────────────────────┤
│  🧠 OptimizedAIAgentEngine                                 │
│  ├── 🔍 MCP Pattern Matching                               │
│  ├── 🐍 Lightweight Python Analysis                        │
│  ├── 💾 Smart Caching                                      │
│  └── 🌍 Environment Detection                              │
├─────────────────────────────────────────────────────────────┤
│  📈 Existing Monitoring System                             │
│  ├── 🗄️ MetricsStorageService                             │
│  ├── 📊 ServerDataCollector                                │
│  └── 🔄 Real-time Data Pipeline                            │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 **설치 및 설정**

### **1. 의존성 설치**

```bash
# 기본 의존성
npm install

# AI 에이전트 경량 Python 패키지
npm run setup:python-lightweight

# 개발 도구
npm install -g vercel
```

### **2. 환경 변수 설정**

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
REDIS_URL=redis://localhost:6379

# AI 에이전트 설정
AI_AGENT_ENABLE_PYTHON=true
AI_AGENT_ENABLE_MCP=true
AI_AGENT_ENABLE_CACHING=true
```

### **3. 데이터베이스 스키마 설정**

```bash
# Supabase 스키마 적용
psql -f scripts/setup-database.sql
```

## 🔧 **어댑터 설정**

### **SystemIntegrationAdapter 초기화**

```typescript
import { 
  SystemIntegrationAdapter,
  SupabaseDatabaseAdapter,
  RedisCacheAdapter,
  ServerDataCollectorAdapter
} from '@/modules/ai-agent/adapters';

// 통합 설정
const integrationConfig = {
  database: {
    type: 'supabase',
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    apiKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  },
  redis: {
    enabled: true,
    url: process.env.REDIS_URL,
    ttl: 300
  },
  monitoring: {
    collectionInterval: 30000,
    enableRealtime: true,
    enableAggregation: true
  },
  aiAgent: {
    enablePythonAnalysis: true,
    enableMCP: true,
    enableCaching: true
  }
};

// 어댑터 초기화
const integrationAdapter = SystemIntegrationAdapter.getInstance(integrationConfig);

// 구체적인 어댑터 등록
integrationAdapter.setDatabaseAdapter(new SupabaseDatabaseAdapter({
  url: integrationConfig.database.url,
  apiKey: integrationConfig.database.apiKey
}));

integrationAdapter.setCacheAdapter(new RedisCacheAdapter({
  url: integrationConfig.redis.url,
  ttl: integrationConfig.redis.ttl
}));

integrationAdapter.setDataCollectorAdapter(new ServerDataCollectorAdapter({
  collectionInterval: integrationConfig.monitoring.collectionInterval,
  enableRealtime: integrationConfig.monitoring.enableRealtime,
  enableAggregation: integrationConfig.monitoring.enableAggregation
}));

// 초기화
await integrationAdapter.initialize();
```

## 📊 **데이터 흐름**

### **1. 메트릭 수집 → 표준화 → AI 분석**

```typescript
// 1. 기존 시스템에서 메트릭 수집
const rawMetrics = await serverDataCollector.collectMetrics(serverId);

// 2. 표준 메트릭으로 변환
const standardMetrics = transformToStandardMetrics(rawMetrics);

// 3. 데이터베이스 저장
await databaseAdapter.saveMetrics(standardMetrics);

// 4. Redis 캐싱
await cacheAdapter.set(`server:${serverId}:latest`, standardMetrics, 300);

// 5. AI 분석 트리거 (임계값 초과 시)
if (shouldTriggerAIAnalysis(standardMetrics)) {
  await aiEngine.analyzeServerMetrics(standardMetrics);
}
```

### **2. 실시간 이상 감지**

```typescript
// 메트릭 수집 이벤트 리스너
dataCollectorAdapter.onMetricsCollected(async (metrics) => {
  // 임계값 기반 이상 감지
  const isAnomalous = 
    metrics.metrics.cpu.usage > 80 ||
    metrics.metrics.memory.usage > 85 ||
    metrics.metrics.disk.usage > 90;

  if (isAnomalous) {
    // AI 분석 요청
    const analysis = await aiEngine.processSmartQuery({
      query: `서버 ${metrics.hostname}에서 이상이 감지되었습니다. 분석해주세요.`,
      serverData: metrics,
      metadata: { action: 'anomaly-detection' }
    });

    // 알림 발송
    await notificationService.sendAlert({
      serverId: metrics.serverId,
      severity: 'warning',
      message: analysis.response
    });
  }
});
```

## 🔗 **API 통합**

### **통합 API 엔드포인트**

```typescript
// GET /api/ai-agent/integrated
// 통합 시스템 상태 조회
const response = await fetch('/api/ai-agent/integrated');
const { data } = await response.json();

console.log('통합 상태:', data.integration);
console.log('AI 엔진 상태:', data.aiEngine);
console.log('서버 목록:', data.servers);
```

### **지원되는 액션**

```typescript
// 1. 서버 분석
const serverAnalysis = await fetch('/api/ai-agent/integrated', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'analyze-server',
    serverId: 'web-prod-01'
  })
});

// 2. 스마트 쿼리
const smartQuery = await fetch('/api/ai-agent/integrated', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'smart-query',
    query: 'CPU 사용률이 높은 서버를 찾아서 분석해주세요'
  })
});

// 3. 이상 감지
const anomalyDetection = await fetch('/api/ai-agent/integrated', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'anomaly-detection',
    timeRange: { hours: 24 }
  })
});

// 4. 헬스 체크
const healthCheck = await fetch('/api/ai-agent/integrated', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'health-check'
  })
});

// 5. 메트릭 히스토리
const metricsHistory = await fetch('/api/ai-agent/integrated', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'metrics-history',
    serverId: 'web-prod-01',
    timeRange: { hours: 24 }
  })
});
```

## 🧪 **테스트 및 검증**

### **통합 테스트 실행**

```bash
# 전체 통합 테스트
npm run ai:test-integrated

# 개별 테스트
npm run ai:integration-test

# 시스템 검증 (통합 + 최적화 테스트)
npm run system:validate
```

### **테스트 범위**

1. **기본 연결 테스트**
   - API 엔드포인트 연결
   - 통합 시스템 상태 확인

2. **어댑터 통합 테스트**
   - 데이터베이스 어댑터 연결
   - Redis 캐시 어댑터 테스트
   - 데이터 수집기 어댑터 테스트

3. **AI 엔진 통합 테스트**
   - MCP 패턴 매칭
   - Python 분석 엔진

4. **데이터 흐름 테스트**
   - 서버 메트릭 조회
   - 메트릭 히스토리

5. **성능 벤치마크**
   - 응답 시간 측정
   - 동시 요청 처리

6. **장애 복구 테스트**
   - 잘못된 요청 처리
   - 타임아웃 처리

7. **종합 시나리오 테스트**
   - End-to-End 워크플로우

## 📈 **성능 최적화**

### **캐싱 전략**

```typescript
// 1. 메트릭 캐싱 (5분 TTL)
await cacheAdapter.set(`server:${serverId}:latest`, metrics, 300);

// 2. AI 분석 결과 캐싱 (15분 TTL)
await cacheAdapter.set(`ai:analysis:${queryHash}`, analysis, 900);

// 3. 배치 캐싱
await cacheAdapter.setBatch([
  { key: 'server:web-01:latest', value: metrics1, ttl: 300 },
  { key: 'server:api-01:latest', value: metrics2, ttl: 300 }
]);
```

### **데이터베이스 최적화**

```sql
-- 인덱스 최적화
CREATE INDEX CONCURRENTLY idx_server_metrics_server_timestamp 
ON server_metrics(server_id, timestamp DESC);

-- 파티셔닝 (시간 기반)
CREATE TABLE server_metrics_2024_01 PARTITION OF server_metrics
FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

-- 자동 정리 (24시간 보존)
SELECT cron.schedule('cleanup-old-metrics', '0 * * * *', 
  'DELETE FROM server_metrics WHERE timestamp < NOW() - INTERVAL ''24 hours''');
```

### **메모리 최적화**

```typescript
// 1. 스트리밍 처리
const metricsStream = databaseAdapter.getMetricsStream(serverId);
for await (const batch of metricsStream) {
  await processMetricsBatch(batch);
}

// 2. 메모리 풀 관리
const connectionPool = new Pool({
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
});
```

## 🔍 **모니터링 및 로깅**

### **통합 상태 모니터링**

```typescript
// 통합 어댑터 상태 조회
const status = integrationAdapter.getIntegrationStatus();

console.log('초기화 상태:', status.isInitialized);
console.log('데이터베이스:', status.database);
console.log('캐시:', status.cache);
console.log('데이터 수집기:', status.dataCollector);
```

### **성능 메트릭**

```typescript
// Redis 통계
const redisStats = await cacheAdapter.getStats();
console.log('Redis 연결:', redisStats.connected);
console.log('키 개수:', redisStats.keyCount);
console.log('메모리 사용량:', redisStats.memoryUsage);

// 데이터 수집 통계
const collectionStats = dataCollectorAdapter.getCollectionStats();
console.log('수집 활성화:', collectionStats.isActive);
console.log('성공률:', collectionStats.successRate);
console.log('마지막 수집:', collectionStats.lastCollection);
```

## 🚨 **장애 대응**

### **Graceful Degradation**

```typescript
// Redis 연결 실패 시 데이터베이스 직접 조회
async function getServerMetrics(serverId: string) {
  try {
    // 1. 캐시에서 조회 시도
    const cached = await cacheAdapter.get(`server:${serverId}:latest`);
    if (cached) return cached;
  } catch (error) {
    console.warn('캐시 조회 실패, 데이터베이스 직접 조회:', error);
  }

  // 2. 데이터베이스에서 조회
  return await databaseAdapter.getLatestMetrics(serverId);
}

// Python 분석 실패 시 JavaScript Fallback
async function analyzeMetrics(metrics: ServerMetrics) {
  try {
    return await pythonAnalysisEngine.analyze(metrics);
  } catch (error) {
    console.warn('Python 분석 실패, JavaScript Fallback 사용:', error);
    return await javascriptAnalysisEngine.analyze(metrics);
  }
}
```

### **에러 복구**

```typescript
// 자동 재시도 메커니즘
async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxRetries) throw error;
      
      console.warn(`작업 실패 (${attempt}/${maxRetries}), ${delay}ms 후 재시도:`, error);
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2; // 지수 백오프
    }
  }
  throw new Error('최대 재시도 횟수 초과');
}
```

## 📦 **배포 가이드**

### **Vercel 배포**

```bash
# 1. 빌드 테스트
npm run build

# 2. 통합 테스트
npm run system:validate

# 3. Vercel 배포
vercel --prod

# 4. 배포 후 검증
curl https://your-domain.vercel.app/api/ai-agent/integrated
```

### **환경별 설정**

```typescript
// vercel.json
{
  "functions": {
    "src/app/api/ai-agent/integrated/route.ts": {
      "maxDuration": 30
    }
  },
  "env": {
    "AI_AGENT_ENABLE_PYTHON": "true",
    "AI_AGENT_ENABLE_MCP": "true",
    "AI_AGENT_ENABLE_CACHING": "true"
  }
}
```

## 🔧 **커스터마이징**

### **새로운 어댑터 추가**

```typescript
// 1. 어댑터 인터페이스 구현
class CustomDatabaseAdapter implements DatabaseAdapter {
  async connect(): Promise<void> {
    // 연결 로직
  }

  async saveMetrics(metrics: StandardServerMetrics): Promise<void> {
    // 저장 로직
  }

  // ... 기타 메서드 구현
}

// 2. 어댑터 등록
integrationAdapter.setDatabaseAdapter(new CustomDatabaseAdapter(config));
```

### **AI 분석 로직 확장**

```typescript
// 1. 커스텀 분석 프로세서
class CustomAnalysisProcessor {
  async analyze(metrics: StandardServerMetrics): Promise<AnalysisResult> {
    // 커스텀 분석 로직
    return {
      insights: ['커스텀 인사이트'],
      recommendations: ['커스텀 권장사항'],
      severity: 'info'
    };
  }
}

// 2. AI 엔진에 등록
aiEngine.addAnalysisProcessor('custom', new CustomAnalysisProcessor());
```

## 📚 **참고 자료**

- [AI Agent Core Architecture](./AI_AGENT_CORE_ARCHITECTURE.md)
- [Optimized AI Guide](./OPTIMIZED_AI_GUIDE.md)
- [Python Analysis Setup](./PYTHON_ANALYSIS_SETUP.md)
- [API Documentation](./docs/api/)

## 🤝 **기여 가이드**

1. **이슈 리포트**: GitHub Issues 사용
2. **기능 요청**: Feature Request 템플릿 사용
3. **코드 기여**: Pull Request 가이드라인 준수
4. **테스트**: 모든 PR은 통합 테스트 통과 필수

## 📄 **라이선스**

MIT License - 자세한 내용은 [LICENSE](./LICENSE) 파일 참조

---

**🎉 축하합니다!** OpenManager AI v5의 고도화된 AI 에이전트가 성공적으로 통합되었습니다. 이제 모듈화된 아키텍처를 통해 확장 가능하고 이식성 높은 AI 기반 서버 모니터링 시스템을 운영할 수 있습니다. 