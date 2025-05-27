# 🏗️ OpenManager Vibe v5 - 아키텍처 리뷰

## 📋 개요
이 문서는 OpenManager Vibe v5 프로젝트의 전체 아키텍처를 클린 코드, SOLID 원칙, 모듈화 관점에서 분석한 결과입니다.

## 🎯 현재 구조 분석

### ✅ 잘 설계된 부분들

#### 1. **모듈화 구조**
```
src/
├── modules/          # 기능별 모듈 분리
│   ├── ai-agent/     # AI 에이전트 모듈
│   ├── ai-sidebar/   # AI 사이드바 모듈
│   ├── mcp/          # MCP 프로토콜 모듈
│   └── shared/       # 공통 유틸리티
├── services/         # 비즈니스 로직 서비스
├── components/       # UI 컴포넌트
├── types/           # 타입 정의
└── lib/             # 유틸리티 라이브러리
```

#### 2. **타입 안정성**
- TypeScript 적극 활용
- 체계적인 인터페이스 정의
- 타입 중앙화 (`src/types/`)

#### 3. **API 설계**
- RESTful API 구조
- 일관된 응답 형식
- 적절한 HTTP 상태 코드

## ❌ 주요 문제점들

### 1. **과도한 싱글톤 패턴 사용**

**문제점:**
```typescript
// 발견된 싱글톤 클래스들 (20개 이상)
- AlertSystem
- VirtualServerDataAdapter
- RealAnalysisEngine
- PredictionEngine
- AIAnalysisService
- SystemHealthChecker
- HybridMetricsBridge
- ... 등 다수
```

**문제:**
- 테스트 어려움 (Mock 객체 생성 불가)
- 의존성 주입 불가
- 전역 상태로 인한 부작용
- 멀티스레드 환경에서 문제 가능성

**개선 방안:**
```typescript
// Before (Singleton)
export class AlertSystem {
  private static instance: AlertSystem;
  static getInstance(): AlertSystem {
    if (!AlertSystem.instance) {
      AlertSystem.instance = new AlertSystem();
    }
    return AlertSystem.instance;
  }
}

// After (Dependency Injection)
export interface IAlertSystem {
  startMonitoring(): void;
  stopMonitoring(): void;
  getActiveAlerts(): Alert[];
}

export class AlertSystem implements IAlertSystem {
  constructor(
    private virtualServerManager: IVirtualServerManager,
    private logger: ILogger
  ) {}
}

// DI Container
export class ServiceContainer {
  private services = new Map();
  
  register<T>(token: string, factory: () => T): void {
    this.services.set(token, factory);
  }
  
  resolve<T>(token: string): T {
    const factory = this.services.get(token);
    return factory();
  }
}
```

### 2. **타입 정의 중복**

**문제점:**
```typescript
// src/types/server.ts
export interface Service {
  name: string;
  status: 'running' | 'stopped';
  port: number;
}

// src/services/collectors/ServerDataCollector.ts
export interface Service {
  name: string;
  status: 'running' | 'stopped' | 'failed' | 'starting' | 'stopping';
  port?: number;
  pid?: number;
  // ... 추가 필드들
}

// src/types/collector.ts
export interface ServiceStatus {
  name: string;
  status: 'running' | 'stopped' | 'error' | 'unknown';
  port?: number;
  // ... 다른 필드들
}
```

**개선 방안:**
```typescript
// src/types/common.ts
export interface BaseService {
  name: string;
  status: ServiceStatus;
  port?: number;
}

export type ServiceStatus = 
  | 'running' 
  | 'stopped' 
  | 'failed' 
  | 'starting' 
  | 'stopping' 
  | 'error' 
  | 'unknown';

// src/types/server.ts
export interface ServerService extends BaseService {
  // 서버 특화 필드
}

// src/types/collector.ts
export interface CollectorService extends BaseService {
  pid?: number;
  memory?: number;
  cpu?: number;
  restartCount?: number;
}
```

### 3. **순환 의존성 위험**

**문제점:**
```typescript
// VirtualServerManager -> AlertSystem
// AlertSystem -> VirtualServerManager
// AIAnalysisService -> 여러 서비스들
// 각 서비스들 -> AIAnalysisService
```

**개선 방안:**
```typescript
// 이벤트 기반 아키텍처 도입
export interface IEventBus {
  emit(event: string, data: any): void;
  on(event: string, handler: (data: any) => void): void;
  off(event: string, handler: (data: any) => void): void;
}

export class AlertSystem {
  constructor(private eventBus: IEventBus) {
    this.eventBus.on('server.metrics.updated', this.handleMetricsUpdate);
  }
  
  private handleMetricsUpdate = (metrics: ServerMetrics) => {
    // 알림 로직 처리
  }
}

export class VirtualServerManager {
  constructor(private eventBus: IEventBus) {}
  
  private async generateRealtimeDataPoint() {
    const metrics = this.generateMetrics();
    this.eventBus.emit('server.metrics.updated', metrics);
  }
}
```

### 4. **거대한 클래스들 (God Object)**

**문제점:**
```typescript
// VirtualServerManager: 569줄
// AIAnalysisService: 1000줄 이상
// EnhancedAIAgentEngine: 1500줄 이상
```

**개선 방안:**
```typescript
// VirtualServerManager 분리
export class VirtualServerManager {
  constructor(
    private serverFactory: IServerFactory,
    private metricsGenerator: IMetricsGenerator,
    private dataStorage: IDataStorage,
    private realtimeScheduler: IRealtimeScheduler
  ) {}
}

export interface IServerFactory {
  createServers(count: number): VirtualServer[];
}

export interface IMetricsGenerator {
  generateMetrics(server: VirtualServer, timestamp: Date): ServerMetrics;
  generateHistoryData(server: VirtualServer): ServerMetrics[];
}

export interface IDataStorage {
  saveServers(servers: VirtualServer[]): Promise<void>;
  saveMetrics(metrics: ServerMetrics[]): Promise<void>;
  getMetrics(serverId: string, timeRange: TimeRange): Promise<ServerMetrics[]>;
}

export interface IRealtimeScheduler {
  start(callback: () => Promise<void>, interval: number): void;
  stop(): void;
  isRunning(): boolean;
}
```

### 5. **하드코딩된 설정값들**

**문제점:**
```typescript
// 곳곳에 하드코딩된 값들
private readonly GENERATION_INTERVAL = 5000; // 5초
private readonly TOTAL_DURATION = 20 * 60 * 1000; // 20분
private readonly HISTORY_DURATION = 24 * 60 * 60 * 1000; // 24시간
```

**개선 방안:**
```typescript
// src/config/index.ts
export interface AppConfig {
  virtualServer: {
    generationInterval: number;
    totalDuration: number;
    historyDuration: number;
    serverCount: number;
  };
  alerts: {
    checkInterval: number;
    cooldownMinutes: number;
    maxRetries: number;
  };
  ai: {
    responseTimeout: number;
    maxTokens: number;
    temperature: number;
  };
}

export const defaultConfig: AppConfig = {
  virtualServer: {
    generationInterval: 5000,
    totalDuration: 20 * 60 * 1000,
    historyDuration: 24 * 60 * 60 * 1000,
    serverCount: 5
  },
  // ... 기타 설정
};

// 환경변수 오버라이드
export const config = {
  ...defaultConfig,
  ...loadFromEnv()
};
```

## 🎯 SOLID 원칙 위반 사례

### 1. **SRP (Single Responsibility Principle) 위반**

**문제:**
```typescript
// VirtualServerManager가 너무 많은 책임을 가짐
class VirtualServerManager {
  // 1. 서버 생성
  // 2. 메트릭 생성
  // 3. 데이터베이스 저장
  // 4. 실시간 스케줄링
  // 5. 시스템 상태 관리
}
```

### 2. **OCP (Open/Closed Principle) 위반**

**문제:**
```typescript
// 새로운 메트릭 타입 추가 시 기존 코드 수정 필요
private getMetricValue(metrics: ServerMetrics, metric: string): number {
  switch (metric) {
    case 'cpu_usage': return metrics.cpu_usage;
    case 'memory_usage': return metrics.memory_usage;
    case 'disk_usage': return metrics.disk_usage;
    case 'response_time': return metrics.response_time;
    default: return 0;
  }
}
```

**개선:**
```typescript
export interface IMetricExtractor {
  canHandle(metric: string): boolean;
  extract(metrics: ServerMetrics): number;
}

export class CpuMetricExtractor implements IMetricExtractor {
  canHandle(metric: string): boolean {
    return metric === 'cpu_usage';
  }
  
  extract(metrics: ServerMetrics): number {
    return metrics.cpu_usage;
  }
}

export class MetricExtractorRegistry {
  private extractors: IMetricExtractor[] = [];
  
  register(extractor: IMetricExtractor): void {
    this.extractors.push(extractor);
  }
  
  extract(metrics: ServerMetrics, metric: string): number {
    const extractor = this.extractors.find(e => e.canHandle(metric));
    return extractor ? extractor.extract(metrics) : 0;
  }
}
```

### 3. **DIP (Dependency Inversion Principle) 위반**

**문제:**
```typescript
// 구체 클래스에 직접 의존
export class AlertSystem {
  constructor() {
    // 하드코딩된 의존성
  }
  
  private async checkMetrics() {
    const servers = virtualServerManager.getServers(); // 직접 참조
  }
}
```

## 🚀 개선 제안사항

### 1. **의존성 주입 컨테이너 도입**

```typescript
// src/di/container.ts
export class DIContainer {
  private services = new Map<string, any>();
  private factories = new Map<string, () => any>();
  
  register<T>(token: string, factory: () => T): void {
    this.factories.set(token, factory);
  }
  
  registerInstance<T>(token: string, instance: T): void {
    this.services.set(token, instance);
  }
  
  resolve<T>(token: string): T {
    if (this.services.has(token)) {
      return this.services.get(token);
    }
    
    const factory = this.factories.get(token);
    if (factory) {
      const instance = factory();
      this.services.set(token, instance);
      return instance;
    }
    
    throw new Error(`Service ${token} not found`);
  }
}

// src/di/tokens.ts
export const TOKENS = {
  VIRTUAL_SERVER_MANAGER: 'VirtualServerManager',
  ALERT_SYSTEM: 'AlertSystem',
  EVENT_BUS: 'EventBus',
  LOGGER: 'Logger',
  CONFIG: 'Config'
} as const;
```

### 2. **이벤트 기반 아키텍처**

```typescript
// src/events/EventBus.ts
export interface IEventBus {
  emit<T>(event: string, data: T): void;
  on<T>(event: string, handler: (data: T) => void): void;
  off<T>(event: string, handler: (data: T) => void): void;
}

export class EventBus implements IEventBus {
  private listeners = new Map<string, Set<Function>>();
  
  emit<T>(event: string, data: T): void {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.forEach(handler => handler(data));
    }
  }
  
  on<T>(event: string, handler: (data: T) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);
  }
  
  off<T>(event: string, handler: (data: T) => void): void {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.delete(handler);
    }
  }
}

// 이벤트 타입 정의
export interface ServerMetricsUpdatedEvent {
  serverId: string;
  metrics: ServerMetrics;
  timestamp: Date;
}

export interface AlertTriggeredEvent {
  alert: Alert;
  rule: AlertRule;
  timestamp: Date;
}
```

### 3. **레이어드 아키텍처 적용**

```typescript
// src/domain/ - 도메인 로직
export interface IServerRepository {
  save(server: VirtualServer): Promise<void>;
  findById(id: string): Promise<VirtualServer | null>;
  findAll(): Promise<VirtualServer[]>;
}

export interface IMetricsRepository {
  save(metrics: ServerMetrics): Promise<void>;
  findByServerId(serverId: string, timeRange: TimeRange): Promise<ServerMetrics[]>;
}

// src/application/ - 애플리케이션 서비스
export class ServerManagementService {
  constructor(
    private serverRepo: IServerRepository,
    private metricsRepo: IMetricsRepository,
    private eventBus: IEventBus
  ) {}
  
  async createServers(count: number): Promise<VirtualServer[]> {
    const servers = ServerFactory.createServers(count);
    
    for (const server of servers) {
      await this.serverRepo.save(server);
    }
    
    this.eventBus.emit('servers.created', { servers });
    return servers;
  }
}

// src/infrastructure/ - 인프라스트럭처
export class SupabaseServerRepository implements IServerRepository {
  constructor(private supabase: SupabaseClient) {}
  
  async save(server: VirtualServer): Promise<void> {
    await this.supabase.from('servers').insert(server);
  }
  
  async findById(id: string): Promise<VirtualServer | null> {
    const { data } = await this.supabase
      .from('servers')
      .select('*')
      .eq('id', id)
      .single();
    return data;
  }
}
```

### 4. **설정 관리 개선**

```typescript
// src/config/schema.ts
import { z } from 'zod';

export const ConfigSchema = z.object({
  virtualServer: z.object({
    generationInterval: z.number().min(1000),
    totalDuration: z.number().min(60000),
    historyDuration: z.number().min(3600000),
    serverCount: z.number().min(1).max(20)
  }),
  alerts: z.object({
    checkInterval: z.number().min(5000),
    cooldownMinutes: z.number().min(1),
    maxRetries: z.number().min(1)
  }),
  database: z.object({
    url: z.string().url(),
    key: z.string().min(1)
  })
});

export type Config = z.infer<typeof ConfigSchema>;

// src/config/loader.ts
export class ConfigLoader {
  static load(): Config {
    const config = {
      virtualServer: {
        generationInterval: Number(process.env.GENERATION_INTERVAL) || 5000,
        totalDuration: Number(process.env.TOTAL_DURATION) || 1200000,
        historyDuration: Number(process.env.HISTORY_DURATION) || 86400000,
        serverCount: Number(process.env.SERVER_COUNT) || 5
      },
      alerts: {
        checkInterval: Number(process.env.ALERT_CHECK_INTERVAL) || 10000,
        cooldownMinutes: Number(process.env.ALERT_COOLDOWN) || 5,
        maxRetries: Number(process.env.ALERT_MAX_RETRIES) || 3
      },
      database: {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
      }
    };
    
    return ConfigSchema.parse(config);
  }
}
```

### 5. **테스트 가능한 구조**

```typescript
// src/services/__tests__/AlertSystem.test.ts
describe('AlertSystem', () => {
  let alertSystem: AlertSystem;
  let mockVirtualServerManager: jest.Mocked<IVirtualServerManager>;
  let mockEventBus: jest.Mocked<IEventBus>;
  let mockLogger: jest.Mocked<ILogger>;
  
  beforeEach(() => {
    mockVirtualServerManager = createMockVirtualServerManager();
    mockEventBus = createMockEventBus();
    mockLogger = createMockLogger();
    
    alertSystem = new AlertSystem(
      mockVirtualServerManager,
      mockEventBus,
      mockLogger
    );
  });
  
  it('should trigger alert when CPU usage exceeds threshold', async () => {
    // Given
    const server = createMockServer();
    const metrics = createMockMetrics({ cpu_usage: 95 });
    mockVirtualServerManager.getServers.mockReturnValue([server]);
    mockVirtualServerManager.getLatestMetrics.mockResolvedValue(metrics);
    
    // When
    await alertSystem.checkMetrics();
    
    // Then
    expect(mockEventBus.emit).toHaveBeenCalledWith(
      'alert.triggered',
      expect.objectContaining({
        severity: 'critical',
        metric: 'cpu_usage'
      })
    );
  });
});
```

## 📊 우선순위별 개선 계획

### Phase 1: 즉시 개선 (1-2주)
1. 타입 정의 통합 및 중복 제거
2. 하드코딩된 설정값들을 설정 파일로 분리
3. 기본적인 에러 핸들링 개선

### Phase 2: 구조 개선 (3-4주)
1. 의존성 주입 컨테이너 도입
2. 이벤트 기반 아키텍처 적용
3. 거대한 클래스들 분리

### Phase 3: 아키텍처 개선 (5-8주)
1. 레이어드 아키텍처 적용
2. 도메인 주도 설계 원칙 적용
3. 종합적인 테스트 코드 작성

## 🎯 결론

현재 프로젝트는 기능적으로는 잘 작동하지만, 유지보수성과 확장성 측면에서 개선이 필요합니다. 특히 과도한 싱글톤 패턴 사용과 거대한 클래스들이 주요 문제점입니다. 

제안된 개선사항들을 단계적으로 적용하면 더욱 견고하고 유지보수하기 쉬운 시스템으로 발전시킬 수 있을 것입니다. 