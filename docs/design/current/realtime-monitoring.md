# 실시간 모니터링 아키텍처 설계

## 🎯 24시간 순환 + 10분 기준 + 1분 보간 시스템

### 핵심 아이디어
**"뱀의 꼬리를 무는" 24시간 순환 시스템**에서 10분 간격 기준점을 두고, 그 사이를 FNV-1a 해시로 1분 단위 부드럽게 보간하는 방식

### 🏗️ 아키텍처 구조

```typescript
// 1. 24시간 순환 시스템 (86,400초 = 24시간)
const get24HourCycle = (timestamp: number): number => {
  const dayMs = 24 * 60 * 60 * 1000; // 86,400,000ms
  return timestamp % dayMs;
};

// 2. 10분 기준점 계산 (144개 슬롯)
const getBaseline10MinSlot = (cycleTime: number): number => {
  const tenMinMs = 10 * 60 * 1000; // 600,000ms
  return Math.floor(cycleTime / tenMinMs); // 0-143 범위
};

// 3. 1분 단위 보간 계산
const interpolate1MinVariation = (
  baseline: number, 
  timestamp: number, 
  serverId: number,
  metricType: string
): number => {
  const seed = timestamp + serverId + metricType.charCodeAt(0);
  const variation = fnv1aHash(seed) * 0.2; // ±10% 범위
  return baseline * (0.9 + variation);
};

// 4. 통합 메트릭 계산
const getRealTimeMetric = (
  serverId: number, 
  metricType: string, 
  currentTime: number
): number => {
  const cycleTime = get24HourCycle(currentTime);
  const slot = getBaseline10MinSlot(cycleTime);
  const baseline = getBaseline(serverId, metricType, slot);
  
  return interpolate1MinVariation(baseline, currentTime, serverId, metricType);
};
```

### 📊 데이터 구조

#### 기준점 데이터 (사전 정의)
```typescript
interface BaselineData {
  timeSlot: number;        // 0-143 (144개 10분 슬롯)
  serverProfiles: {
    [serverId: string]: {
      cpu: number;          // 10분 기준 CPU 사용률
      memory: number;       // 10분 기준 메모리 사용률
      disk: number;         // 10분 기준 디스크 I/O
      network: number;      // 10분 기준 네트워크 사용량
      responseTime: number; // 10분 기준 응답시간
    };
  };
  scenarios: ScenarioEvent[]; // 해당 시간대 장애 시나리오
}

// 파일 크기: 144슬롯 × 15서버 × 5메트릭 = ~100KB
```

#### 실시간 보간 로직
```typescript
// 부드러운 전환을 위한 가중 보간
const getSmoothTransition = (
  prevSlotValue: number,
  nextSlotValue: number, 
  progress: number // 0.0-1.0 (10분 내 진행률)
): number => {
  // Cosine 보간으로 부드러운 곡선 생성
  const smoothProgress = (1 - Math.cos(progress * Math.PI)) / 2;
  return prevSlotValue + (nextSlotValue - prevSlotValue) * smoothProgress;
};
```

### ⚡ 성능 최적화

#### 메모리 효율성
- **Vercel Edge Runtime 완전 호환**: 메모리 상태 저장 없음
- **Pure Function**: 입력→출력, 사이드 이펙트 없음
- **캐시 불필요**: 결정론적 계산으로 동일 결과 보장

#### 계산 효율성
```typescript
// 최적화된 계산 순서
const optimizedMetricCalculation = (timestamp: number) => {
  // 1회 계산: 시간 관련
  const cycleTime = get24HourCycle(timestamp);
  const slot = getBaseline10MinSlot(cycleTime);
  const progress = (cycleTime % (10 * 60 * 1000)) / (10 * 60 * 1000);
  
  // 서버별 병렬 계산
  return servers.map(server => ({
    ...server,
    metrics: calculateServerMetrics(server.id, slot, progress, timestamp)
  }));
};
```

### 🎨 24시간 현실적 패턴

#### 시간대별 부하 곡선
```typescript
const generateTimeBasedLoad = (hour: number): number => {
  // 업무시간(9-18시) 높은 부하, 새벽(2-6시) 낮은 부하
  const businessHoursMultiplier = hour >= 9 && hour <= 18 ? 1.4 : 0.6;
  const nightTimeReduction = hour >= 2 && hour <= 6 ? 0.4 : 1.0;
  
  return businessHoursMultiplier * nightTimeReduction;
};

// 24시간 기준점 생성 예시
const generate24HourBaseline = () => {
  const baseline = [];
  for (let slot = 0; slot < 144; slot++) { // 144개 10분 슬롯
    const hour = Math.floor(slot * 10 / 60); // 현재 시간
    const loadFactor = generateTimeBasedLoad(hour);
    
    baseline.push({
      timeSlot: slot,
      timestamp: slot * 10 * 60 * 1000, // 10분 단위
      serverProfiles: generateServerProfiles(loadFactor),
      scenarios: generateScenarios(hour) // 시간대별 장애 시나리오
    });
  }
  return baseline;
};
```

### 🔄 실시간 업데이트 시뮬레이션

#### 30초 간격 자동 새로고침
```typescript
// 클라이언트 사이드 실시간 업데이트
const startRealTimeMonitoring = () => {
  setInterval(() => {
    const currentTime = Date.now();
    const newMetrics = getRealTimeServerMetrics(currentTime);
    
    // 부드러운 애니메이션과 함께 UI 업데이트
    updateDashboard(newMetrics);
  }, 30000); // 30초마다 갱신
};

// 보간 애니메이션 (옵션)
const animateMetricTransition = (oldValue: number, newValue: number) => {
  const frames = 60; // 1초 60프레임
  const increment = (newValue - oldValue) / frames;
  
  for (let i = 0; i <= frames; i++) {
    setTimeout(() => {
      const currentValue = oldValue + (increment * i);
      updateMetricDisplay(currentValue);
    }, i * 16.67); // ~60fps
  }
};
```

### 📈 예상 성과

| 지표 | 현재 방식 | 개선된 방식 | 개선 효과 |
|------|-----------|-------------|----------|
| **파일 크기** | 시나리오별 | ~100KB | 일정한 크기 |
| **실시간성** | 정적 | 1분 단위 변화 | 현실감 300% ↑ |
| **API 응답** | 152ms | ~180ms | 28ms 증가 (허용) |
| **메모리 사용** | 최소 | 최소 유지 | 동일 |
| **Vercel 호환** | ✅ | ✅ | 완전 호환 |

### 🎯 구현 우선순위

#### Phase 1: 기본 순환 시스템
- [x] FNV-1a 해시 기반 보간 (이미 구현됨)
- [ ] 24시간 순환 로직 구현
- [ ] 10분 기준점 데이터 생성

#### Phase 2: 실시간 보간
- [ ] 1분 단위 부드러운 보간
- [ ] 시간대별 현실적 패턴
- [ ] 장애 시나리오 시간 연동

#### Phase 3: UI 연동
- [ ] 30초 자동 새로고침
- [ ] 부드러운 전환 애니메이션
- [ ] AI 어시스턴트 실시간 분석 연동

### 💡 결론

**추천 방식**: 24시간 순환 + 10분 기준 + FNV-1a 보간

**이유**:
- ✅ Vercel 무료 티어 완전 호환
- ✅ 메모리 제약 없음 (stateless)
- ✅ 실시간 모니터링 느낌 제공
- ✅ AI 어시스턴트가 시간 컨텍스트 인식 가능
- ✅ 포트폴리오 목적에 완벽 부합

사전 생성 1분 데이터보다 **10배 작은 파일 크기**로 **비슷한 현실감**을 제공하는 **효율적인 솔루션**입니다.