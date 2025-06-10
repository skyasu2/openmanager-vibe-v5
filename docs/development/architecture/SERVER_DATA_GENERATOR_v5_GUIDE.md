# 📊 서버 데이터 생성기 v5 완전 가이드

> **OpenManager Vibe v5.41.3 - 완전 재구현된 서버 시뮬레이션 엔진**  
> **TypeScript 기반 타입 안전성과 현실적 서버 메트릭 생성**

---

## 🎯 v5 주요 개선사항

### **완전 재구현된 아키텍처**

- ✅ **타입 안전성**: `ServerInstance`, `ServerCluster`, `ApplicationMetrics` 완전 호환
- ✅ **싱글톤 패턴**: 메모리 효율적인 인스턴스 관리
- ✅ **실시간 업데이트**: 3초 간격 메트릭 업데이트
- ✅ **완전한 API**: 모든 필수 메서드 구현

```typescript
// 새로운 v5 구조
import {
  ServerInstance,
  ServerCluster,
  ApplicationMetrics,
} from '@/types/data-generator';

export class RealServerDataGenerator {
  private static instance: RealServerDataGenerator | null = null;
  private servers: Map<string, ServerInstance> = new Map();
  private clusters: Map<string, ServerCluster> = new Map();
  private applications: Map<string, ApplicationMetrics> = new Map();
}
```

---

## 🏗️ 핵심 컴포넌트

### 1. **서버 인스턴스 관리**

```typescript
// 서버 타입 및 역할 정의
const serverTypes: ('web' | 'api' | 'database' | 'cache' | 'queue' | 'cdn' | 'gpu' | 'storage')[] =
  ['web', 'api', 'database', 'cache', 'queue'];

const roles: ('master' | 'slave' | 'primary' | 'replica' | 'worker' | 'standalone')[] =
  ['primary', 'replica', 'worker', 'standalone'];

// 서버 생성 예시
const server: ServerInstance = {
  id: `server-${i}`,
  name: `${serverType}-${i}`,
  type: serverType,
  role,
  environment,
  location,
  status: 'running' | 'warning' | 'error',
  specs: {
    cpu: {
      cores: 4-20,
      model: 'Intel Xeon',
      architecture: 'x86_64' | 'arm64' // 30% ARM 서버
    },
    memory: {
      total: 8-64GB,
      type: 'DDR4',
      speed: 3200
    },
    disk: {
      total: 256GB-8TB,
      type: 'SSD',
      iops: 3000
    },
    network: {
      bandwidth: 1000,
      latency: 1-10ms
    }
  }
}
```

### 2. **클러스터 관리 시스템**

```typescript
// 클러스터 자동 생성
const cluster: ServerCluster = {
  id: `cluster-${type}-${index}`,
  name: `${type} Cluster`,
  servers: servers, // ServerInstance[] 배열
  loadBalancer: {
    algorithm: 'round-robin' | 'least-connections' | 'ip-hash',
    activeConnections: 0 - 100,
    totalRequests: 0 - 10000,
  },
  scaling: {
    current: servers.length,
    min: 1,
    max: servers.length * 2,
    target: servers.length,
    policy: 'cpu' | 'memory' | 'requests',
  },
};
```

### 3. **애플리케이션 메트릭 추적**

```typescript
// 애플리케이션 성능 메트릭
const application: ApplicationMetrics = {
  name: 'Frontend App',
  version: 'v1.0.0-v5.9.0',
  deployments: {
    production: { servers: 3-5, health: 90 },
    staging: { servers: 1-2, health: 85 },
    development: { servers: 1, health: 80 }
  },
  performance: {
    responseTime: 50-250ms,
    throughput: 100-1100 req/s,
    errorRate: 0-5%,
    availability: 90-99%
  },
  resources: {
    totalCpu: 누적 CPU 코어,
    totalMemory: 누적 메모리,
    totalDisk: 누적 디스크,
    cost: $1000-6000/월
  }
};
```

---

## 📈 실시간 메트릭 생성

### **실시간 데이터 업데이트 엔진**

```typescript
private generateRealtimeData(): void {
  this.servers.forEach(server => {
    // 현실적 메트릭 변동 (±10%)
    server.metrics.cpu = Math.max(0, Math.min(100,
      server.metrics.cpu + (Math.random() - 0.5) * 10
    ));

    // 네트워크 트래픽 실시간 변동
    server.metrics.network.in = Math.random() * 100;
    server.metrics.network.out = Math.random() * 100;

    // 요청 수 및 오류율
    server.metrics.requests = Math.random() * 1000 + 100;
    server.metrics.errors = Math.random() * 10;

    // 건강 점수 동적 계산
    server.health.score = Math.max(0, Math.min(100,
      server.health.score + (Math.random() - 0.5) * 10
    ));

    // 상태 변경 (2% 확률)
    if (Math.random() < 0.02) {
      const statuses = ['running', 'warning', 'error'];
      server.status = statuses[Math.floor(Math.random() * statuses.length)];
    }
  });
}
```

### **환경별 설정**

```typescript
// 개발 환경: 30개 서버 (높은 활성도)
// 프로덕션 환경: 16개 서버 (안정성 우선)
const config: GeneratorConfig = {
  maxServers: 30,
  updateInterval: 3000, // 3초마다 업데이트
  enableRealtime: true,
  serverArchitecture: 'load-balanced',
};
```

---

## 🌍 지역 및 환경 분산

### **글로벌 리전 분산**

```typescript
const locations = [
  'us-east-1', // 미국 동부
  'us-west-2', // 미국 서부
  'eu-west-1', // 유럽 서부
  'ap-southeast-1', // 아시아 태평양
];

const environments = [
  'production', // 프로덕션 (50%)
  'staging', // 스테이징 (30%)
  'development', // 개발 (20%)
];
```

### **서버 타입별 특성**

| 서버 타입    | CPU 특성  | 메모리 특성 | 주요 역할        |
| ------------ | --------- | ----------- | ---------------- |
| **Web**      | 낮음-중간 | 중간        | 프론트엔드 서빙  |
| **API**      | 중간-높음 | 중간-높음   | 백엔드 로직 처리 |
| **Database** | 높음      | 매우 높음   | 데이터 저장/조회 |
| **Cache**    | 낮음      | 매우 높음   | 메모리 캐싱      |
| **Queue**    | 중간      | 중간        | 비동기 작업 처리 |

---

## 🔄 API 메서드 완전 가이드

### **필수 메서드**

```typescript
// 싱글톤 인스턴스 획득
const generator = RealServerDataGenerator.getInstance();

// 초기화
await generator.initialize();

// 실시간 모니터링 시작/중지
generator.startAutoGeneration();
generator.stopAutoGeneration();

// 데이터 조회
const servers = generator.getAllServers(); // ServerInstance[]
const server = generator.getServerById('server-1'); // ServerInstance | undefined
const clusters = generator.getAllClusters(); // ServerCluster[]
const apps = generator.getAllApplications(); // ApplicationMetrics[]

// 대시보드 요약
const summary = generator.getDashboardSummary();
/*
{
  servers: { total, running, warning, error, avgCpu, avgMemory },
  clusters: { total, healthy, warning, critical },
  applications: { total, healthy, warning, critical, avgResponseTime },
  timestamp: number
}
*/

// 시스템 상태
const health = await generator.healthCheck();
const status = generator.getStatus();
const config = generator.getEnvironmentConfig();
```

### **고급 기능**

```typescript
// 애플리케이션별 서버 필터링
const webServers = servers.filter(s => s.type === 'web');
const productionServers = servers.filter(s => s.environment === 'production');

// 클러스터 건강도 계산
const healthyRatio =
  cluster.servers.filter(s => s.status === 'running').length /
  cluster.servers.length;

// 리소스 사용률 분석
const totalCpu =
  servers.reduce((sum, s) => sum + s.metrics.cpu, 0) / servers.length;
const totalMemory =
  servers.reduce((sum, s) => sum + s.metrics.memory, 0) / servers.length;
```

---

## 📊 모니터링 및 알림

### **건강도 지표**

```typescript
// 서버 건강 점수 (60-100점)
if (server.health.score < 80) {
  server.health.issues = ['High CPU usage', 'Memory leak detected'];
}

// 클러스터 상태 분류
const clusterHealth = {
  healthy: healthyRatio >= 0.8,    // 80% 이상 정상
  warning: healthyRatio >= 0.5,    // 50-80% 정상
  critical: healthyRatio < 0.5     // 50% 미만 정상
};

// 애플리케이션 가용성
const appHealth = {
  healthy: availability >= 95%,     // 95% 이상
  warning: availability >= 90%,     // 90-95%
  critical: availability < 90%      // 90% 미만
};
```

### **테스트 시나리오 시뮬레이션**

```typescript
// 시연용 시나리오 생성
const testScenarios = {
  normalOperation: '정상 운영 상태 시뮬레이션',
  highLoad: 'CPU/Memory 높은 부하 시뮬레이션',
  serverFailure: '서버 장애 상황 시뮬레이션',
  networkIssue: '네트워크 지연 시뮬레이션',
};
```

---

## 🔧 성능 최적화

### **메모리 효율성**

- **Map 기반 저장**: O(1) 조회 성능
- **타입 안전성**: TypeScript 컴파일 타임 검증
- **지연 로딩**: 필요시에만 데이터 생성
- **가비지 컬렉션**: 주기적 메모리 정리

### **실시간 성능**

```typescript
// 업데이트 주기 최적화
const optimizedConfig = {
  updateInterval: 3000, // 3초 간격
  maxServers: 30, // 최대 30개 서버
  enableRealtime: true, // 실시간 모드
  memoryOptimization: true, // 메모리 최적화
};
```

---

## 🚀 배포 및 운영

### **환경별 설정**

```typescript
// 개발 환경
NODE_ENV = development;
MAX_SERVERS = 30;
UPDATE_INTERVAL = 3000;
REALTIME_ENABLED = true;

// 프로덕션 환경
NODE_ENV = production;
MAX_SERVERS = 16;
UPDATE_INTERVAL = 5000;
REALTIME_ENABLED = true;
```

### **모니터링 지표**

- **시스템 메트릭**: CPU, Memory, Disk, Network
- **애플리케이션 메트릭**: Response Time, Throughput, Error Rate
- **인프라 메트릭**: Server Count, Cluster Health, Availability

---

## 📝 변경 이력

### **v5.41.3 (2024-12-10)**

- ✅ 완전한 TypeScript 재구현
- ✅ ServerInstance/ServerCluster/ApplicationMetrics 타입 통합
- ✅ 싱글톤 패턴 적용
- ✅ 실시간 메트릭 업데이트 (3초 간격)
- ✅ ARM64 아키텍처 지원 (30% 비율)
- ✅ 글로벌 리전 분산 (4개 리전)
- ✅ 완전한 API 메서드 구현
- ✅ 시연용 테스트 시나리오 시뮬레이션

### **이전 버전 대비 개선사항**

- 🔧 Fallback 구현 → 완전 기능 구현
- 🔧 타입 불일치 해결 → 완전한 타입 안전성
- 🔧 부분적 메서드 → 모든 필수 메서드 구현
- 🔧 단순 데이터 → 현실적 메트릭 시뮬레이션

---

## 🤝 기여 가이드

### **코드 구조**

```
src/services/data-generator/
├── RealServerDataGenerator.ts     # 메인 클래스
├── types/                         # 타입 정의
└── managers/                      # 관리 모듈
```

### **개발 규칙**

1. TypeScript strict 모드 준수
2. 모든 public 메서드 JSDoc 문서화
3. 단위 테스트 커버리지 90% 이상
4. 성능 벤치마크 포함

---

## 🔀 **기능 영역 구분**

### 📊 **서버 데이터 생성기 (이 문서)**

- **목적**: 시연 및 테스트용 가짜 데이터 생성
- **범위**: 개발/데모 환경에서만 사용
- **역할**:
  - 30개 가상 서버 메트릭 생성
  - 실시간 테스트 데이터 업데이트
  - 대시보드 시연용 데이터 제공
  - 개발자 테스트 환경 지원

### 🤖 **AI 에이전트 (별도 시스템)**

- **목적**: 실제 서버 모니터링 및 알림
- **범위**: 프로덕션 환경의 실제 작업
- **역할**:
  - 🔔 **슬랙 알림**: 실제 서버 이슈 알림
  - 📊 **이상 감지**: AI 기반 패턴 분석
  - 🎯 **예측 분석**: 미래 리소스 수요 예측
  - 💬 **자연어 질의**: 서버 상태 AI 분석
  - 📝 **자동 보고서**: 장애 상황 자동 분석

### 🔗 **상호 연동**

- 서버 데이터 생성기가 만든 **테스트 데이터**로 AI 에이전트 **시연**
- 실제 환경에서는 AI 에이전트가 **실제 서버 데이터** 분석
- 개발 단계에서는 **가짜 데이터**로 기능 검증 후 **실제 환경** 적용

---

_OpenManager Vibe v5.41.3 - 서버 데이터 생성기 완전 가이드_  
_마지막 업데이트: 2024년 12월 10일_
