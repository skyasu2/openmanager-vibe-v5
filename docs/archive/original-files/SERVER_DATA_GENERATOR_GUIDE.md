# 📊 서버 데이터 생성기 완전 가이드

> **OpenManager Vibe v5 - 현실적 패턴 기반 서버 시뮬레이션 엔진**  
> **시간대별, 서버 타입별, 환경별 특성을 반영한 지능형 데이터 생성**

---

## 🎯 핵심 구조

### **다층 시뮬레이션 아키텍처**

```
환경별 설정 → 서버 타입 프로파일 → 현실적 패턴 엔진 → 메트릭 생성
     ↓              ↓                ↓              ↓
   개발/프로덕션    웹/DB/캐시      시간대 패턴     CPU/메모리/디스크
```

---

## 🏗️ 실제 구현된 컴포넌트

### 1. **시뮬레이션 엔진 (SimulationEngine)**

```typescript
// src/services/simulationEngine.ts
export class SimulationEngine {
  // 환경별 서버 생성 전략
  private generateServersBasedOnPlan(scalingConfig: any): EnhancedServerMetrics[] {
    const { environment } = scalingConfig;
    
    switch (environment) {
      case 'test':
        return this.generateTestServers(); // 2개 최소 서버
      case 'development':
        return this.generateDevelopmentServers(5-10); // 개발용 서버들
      case 'production':
        return this.generateProductionServers(15-30); // 프로덕션 서버들
    }
  }
}
```

### 2. **현실적 패턴 엔진 (RealisticPatternEngine)**

```typescript
// src/modules/data-generation/RealisticPatternEngine.ts
export class RealisticPatternEngine {
  generateRealisticMetric(
    metricType: 'cpu_usage' | 'memory_usage' | 'disk_usage',
    serverType: 'web' | 'database' | 'cache',
    timestamp: Date,
    previousMetrics?: any
  ): number {
    // 1. 기본 프로파일 적용
    const profile = SERVER_TYPE_PROFILES[serverType];
    
    // 2. 시간대 패턴 적용
    const timeMultiplier = this.getTimeMultiplier(timestamp.getHours());
    
    // 3. 상관관계 모델링
    const correlationEffect = this.applyCorrelations(metricType, previousMetrics);
    
    // 4. 현실적 변동성 추가
    return this.applyRealisticVariation(baseValue, profile.volatility);
  }
}
```

---

## 📊 서버 타입별 프로파일

### **웹 서버 (Web Server)**

```typescript
const webServerProfile = {
  cpu_base: 25,           // 기본 CPU 25%
  memory_base: 40,        // 기본 메모리 40%
  disk_base: 30,          // 기본 디스크 30%
  peak_multiplier: 2.5,   // 피크시 2.5배 증가
  characteristics: {
    stability: 0.8,       // 80% 안정성
    volatility: 0.3,      // 30% 변동성
    recovery_time: 3      // 3분 복구 시간
  },
  peak_hours: [9, 10, 11, 14, 15, 16], // 업무시간 피크
  burst_scenarios: {
    traffic_spike: { probability: 0.05, multiplier: 3.0 },
    ddos_simulation: { probability: 0.01, duration: 600 }
  }
};
```

### **데이터베이스 서버 (Database Server)**

```typescript
const databaseServerProfile = {
  cpu_base: 60,           // DB는 CPU 사용량 높음
  memory_base: 75,        // 메모리 사용량도 높음
  disk_base: 45,          // 디스크 I/O 높음
  peak_multiplier: 1.8,   // 상대적으로 안정적
  characteristics: {
    stability: 0.95,      // 95% 안정성 (중요 시스템)
    volatility: 0.1,      // 10% 변동성 (안정적)
    recovery_time: 8      // 8분 복구 시간 (느림)
  },
  correlation: {
    cpu_memory: 0.85,     // CPU-메모리 강한 상관관계
    memory_disk: 0.7      // 메모리-디스크 상관관계
  }
};
```

### **캐시 서버 (Cache Server)**

```typescript
const cacheServerProfile = {
  cpu_base: 15,           // 낮은 CPU 사용량
  memory_base: 85,        // 매우 높은 메모리 사용량
  disk_base: 10,          // 낮은 디스크 사용량
  peak_multiplier: 1.2,   // 안정적인 패턴
  characteristics: {
    stability: 0.9,       // 90% 안정성
    volatility: 0.2,      // 20% 변동성
    recovery_time: 1      // 1분 빠른 복구
  },
  cache_specific: {
    hit_rate_base: 0.85,  // 85% 캐시 히트율
    eviction_pattern: 'lru'
  }
};
```

---

## ⏰ 시간대별 트래픽 패턴

### **현실적 시간 패턴**

```typescript
function getTimeMultiplier(hour: number): number {
  const patterns = {
    // 새벽 2-6시: 최저 부하 (30%)
    deep_night: { hours: [2, 3, 4, 5, 6], multiplier: 0.3 },
    
    // 오전 7-9시: 출근 시간 증가 (80%)
    morning_ramp: { hours: [7, 8, 9], multiplier: 0.8 },
    
    // 오전 10시-오후 4시: 피크 타임 (150%)
    peak_hours: { hours: [10, 11, 12, 13, 14, 15, 16], multiplier: 1.5 },
    
    // 오후 5-8시: 저녁 시간 감소 (60%)
    evening_decline: { hours: [17, 18, 19, 20], multiplier: 0.6 },
    
    // 밤 9시-1시: 야간 부하 (40%)
    night: { hours: [21, 22, 23, 0, 1], multiplier: 0.4 }
  };
  
  return getPatternMultiplier(hour, patterns);
}
```

### **주간/계절별 패턴**

```typescript
function getSeasonalMultiplier(date: Date): number {
  const dayOfWeek = date.getDay();
  const month = date.getMonth();
  
  // 주간 패턴
  const weekdayMultiplier = dayOfWeek >= 1 && dayOfWeek <= 5 ? 1.0 : 0.6; // 주말 60% 감소
  
  // 월별 패턴 (쇼핑몰 기준)
  const monthlyPatterns = {
    11: 1.8, // 11월: 블랙프라이데이 (180%)
    12: 1.6, // 12월: 연말 쇼핑 (160%)
    1: 0.7,  // 1월: 연초 감소 (70%)
    8: 1.3   // 8월: 휴가철 온라인 쇼핑 (130%)
  };
  
  return weekdayMultiplier * (monthlyPatterns[month] || 1.0);
}
```

---

## 🚨 장애 시나리오 시뮬레이션

### **실제 구현된 장애 패턴**

```typescript
// src/services/simulationEngine.ts - simulateIncidents()
private simulateIncidents(server: EnhancedServerMetrics): void {
  const incidents = [
    {
      name: 'High CPU usage detected',
      probability: 0.02,  // 2% 확률
      effect: { cpu: +40, duration: 300000 }, // CPU 40% 증가, 5분간
      recovery: 'gradual' // 점진적 복구
    },
    {
      name: 'Memory leak suspected', 
      probability: 0.015, // 1.5% 확률
      effect: { memory: +30, duration: 600000 }, // 메모리 30% 증가, 10분간
      recovery: 'sudden'  // 급작스런 복구 (재시작)
    },
    {
      name: 'Database connection timeout',
      probability: 0.01,  // 1% 확률
      effect: { response_time: +500, duration: 180000 }, // 응답시간 500ms 증가
      recovery: 'gradual'
    }
  ];
  
  // 확률적 장애 발생 및 자동 복구 스케줄링
}
```

### **상관관계 모델링**

```typescript
private applyCorrelationEffects(
  server: EnhancedServerMetrics, 
  changedMetric: string, 
  changeAmount: number
): void {
  
  if (changedMetric === 'cpu_usage' && changeAmount > 20) {
    // CPU 급증시 다른 메트릭에 미치는 영향
    server.memory_usage += changeAmount * 0.3;  // 메모리도 30% 비율로 증가
    server.response_time += changeAmount * 2;   // 응답시간 2배 증가
    server.network_out += changeAmount * 1.5;   // 네트워크 아웃 1.5배 증가
  }
  
  if (changedMetric === 'memory_usage' && changeAmount > 30) {
    // 메모리 부족시 스와핑 발생
    server.disk_usage += Math.min(changeAmount * 0.5, 20); // 디스크 사용량 증가
    server.response_time += changeAmount * 1.8;
  }
}
```

---

## 🌍 환경별 구성

### **개발 환경 (Development)**

```typescript
private generateDevelopmentServers(count: number): EnhancedServerMetrics[] {
  const config = {
    serverCount: 5-10,
    statusDistribution: { healthy: 0.7, warning: 0.2, critical: 0.1 },
    environments: ['on-premise', 'aws', 'azure'],
    roles: ['web', 'api', 'database', 'cache'],
    loadLevel: 'medium',  // 중간 부하
    instabilityFactor: 1.2 // 개발환경 불안정성
  };
  
  return this.generateServersWithConfig(config);
}
```

### **프로덕션 환경 (Production)**

```typescript
private generateProductionServers(count: number): EnhancedServerMetrics[] {
  const config = {
    serverCount: 15-30,
    statusDistribution: { healthy: 0.85, warning: 0.12, critical: 0.03 },
    environments: ['aws', 'kubernetes', 'gcp'],
    roles: ['web', 'api', 'database', 'cache', 'storage'],
    loadLevel: 'high',    // 높은 부하
    redundancy: true,     // 이중화 구성
    autoScaling: true     // 오토스케일링 활성화
  };
  
  return this.generateServersWithConfig(config);
}
```

---

## 📈 실시간 메트릭 업데이트

### **비동기 데이터 생성 루프**

```typescript
// src/services/data-generator/RealServerDataGenerator.ts
export class RealServerDataGenerator {
  private async generateRealtimeData(): Promise<void> {
    const currentHour = new Date().getHours();
    const isPeakHour = this.simulationConfig.peakHours.includes(currentHour);
    const loadMultiplier = isPeakHour ? 1.8 : 1.0;

    // 병렬 처리로 모든 서버 메트릭 동시 업데이트
    await Promise.all([
      this.updateServerMetrics(loadMultiplier),
      this.updateClusterMetrics(),
      this.updateApplicationMetrics(),
      this.simulateAutoScaling()
    ]);

    // Redis 캐시 업데이트
    await this.cacheGeneratedData();
  }
  
  // 5초마다 실행
  public startGeneration(): void {
    this.generationInterval = setInterval(() => {
      this.generateRealtimeData();
    }, 5000);
  }
}
```

---

## 🎯 주요 특징

### **1. 현실성 (Realism)**
- 실제 서버 환경의 패턴과 특성 반영
- 시간대별, 계절별, 요일별 트래픽 변화
- 서버 타입별 리소스 사용 패턴

### **2. 상관관계 (Correlation)**
- CPU-메모리-응답시간 간의 실제 상관관계
- 장애 전파 패턴 (DB 장애 → API 응답 지연)
- 로드밸런싱과 오토스케일링 효과

### **3. 확장성 (Scalability)**
- 환경별 설정으로 다양한 시나리오 지원
- 실시간 스케일링 시뮬레이션
- 메모리 최적화로 대량 서버 처리 가능

### **4. 안정성 (Reliability)**
- 예외 상황 처리 및 자동 복구
- 메모리 누수 방지 및 가비지 컬렉션
- 타이머 관리 및 정리

---

## 🔧 설정 및 커스터마이징

### **환경 설정**

```typescript
// .env 설정
SIMULATION_ENVIRONMENT=production  # development, test, production
SIMULATION_SERVER_COUNT=20         # 서버 개수
SIMULATION_REALISTIC_PATTERNS=true # 현실적 패턴 활성화
SIMULATION_FAILURE_RATE=0.02      # 장애 발생 확률
```

### **커스텀 프로파일 추가**

```typescript
// 새로운 서버 타입 추가
const customServerProfile = {
  name: 'ml-training',
  cpu_base: 90,
  memory_base: 85,
  gpu_usage: 95,
  characteristics: {
    stability: 0.7,
    volatility: 0.4,
    recovery_time: 15
  }
};

SimulationEngine.addServerProfile('ml-training', customServerProfile);
```

---

**결론**: OpenManager Vibe v5의 서버 데이터 생성기는 단순한 랜덤 데이터가 아닌, **실제 서버 환경의 복잡성과 패턴을 충실히 재현하는 지능형 시뮬레이션 시스템**입니다. 