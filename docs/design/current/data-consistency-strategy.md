# 모니터링-AI 어시스턴트 데이터 일관성 전략

## 🎯 문제 정의

**현재 상황**: 모니터링과 AI 어시스턴트가 각각 다른 타임스탬프로 메트릭을 계산
**결과**: 같은 시점에 다른 데이터를 보여주는 일관성 문제
**사용자 경험**: "대시보드는 CPU 75%인데 AI는 82%라고 하네?" 혼란

## 🔧 해결책: 통합 메트릭 서비스

### 1. 시간 정규화 (Time Normalization)

```typescript
// 1분 단위로 시간 정규화
const normalizeTimestamp = (timestamp: number): number => {
  const minute = 60 * 1000; // 1분 = 60,000ms
  return Math.floor(timestamp / minute) * minute;
};

// 예시: 14:32:15.347 → 14:32:00.000
// 14:32:00 ~ 14:32:59 사이는 모두 14:32:00으로 정규화
```

### 2. 통합 메트릭 API

```typescript
// /api/metrics/current - 정규화된 현재 메트릭
export async function GET(request: NextRequest) {
  const currentTime = Date.now();
  const normalizedTime = normalizeTimestamp(currentTime);
  
  // 모든 서버 메트릭을 정규화된 시간 기준으로 계산
  const servers = generateRealTimeServerMetrics(normalizedTime);
  
  return NextResponse.json({
    timestamp: normalizedTime,
    servers,
    metadata: {
      actualTime: currentTime,
      normalized: true,
      validUntil: normalizedTime + (60 * 1000) // 1분 후까지 유효
    }
  });
}
```

### 3. 공통 데이터 소스 사용

#### 모니터링 대시보드
```typescript
// 프론트엔드에서 통합 API 사용
const fetchMetrics = async () => {
  const response = await fetch('/api/metrics/current');
  const data = await response.json();
  
  // 캐싱: 같은 분 내에서 재사용
  const cacheKey = `metrics-${data.timestamp}`;
  localStorage.setItem(cacheKey, JSON.stringify(data));
  
  return data;
};
```

#### AI 어시스턴트
```typescript
// SimplifiedQueryEngine에서 동일한 API 호출
class SimplifiedQueryEngine {
  private async getCurrentMetrics(): Promise<ServerMetrics[]> {
    const response = await fetch('/api/metrics/current');
    const data = await response.json();
    
    // AI는 이 데이터를 기준으로 분석
    return data.servers;
  }
  
  async processServerQuery(query: string): Promise<string> {
    const currentMetrics = await this.getCurrentMetrics();
    
    // "현재 서버 상태는?" → 모니터링과 동일한 데이터 기준 답변
    return this.analyzeMetrics(currentMetrics, query);
  }
}
```

### 4. 클라이언트 사이드 최적화

```typescript
// 30초 캐싱으로 중복 호출 방지
class MetricsCache {
  private cache = new Map<string, CachedMetrics>();
  
  async getMetrics(): Promise<ServerMetrics[]> {
    const now = Date.now();
    const normalizedTime = normalizeTimestamp(now);
    const cacheKey = `metrics-${normalizedTime}`;
    
    // 캐시 확인
    const cached = this.cache.get(cacheKey);
    if (cached && (now - cached.fetchedAt < 30000)) { // 30초 캐시
      return cached.data;
    }
    
    // 새로 페치
    const response = await fetch('/api/metrics/current');
    const data = await response.json();
    
    this.cache.set(cacheKey, {
      data: data.servers,
      fetchedAt: now,
      validUntil: normalizedTime + 60000
    });
    
    return data.servers;
  }
}
```

## 📊 데이터 일관성 보장 메커니즘

### 시간 계층 구조
```
24시간 순환 (86,400초)
├── 10분 기준점 (144개 슬롯)
├── 1분 정규화 (실제 사용 단위)
└── 30초 캐싱 (성능 최적화)
```

### 일관성 검증
```typescript
// 데이터 일관성 검증 함수
const verifyConsistency = async () => {
  const dashboardMetrics = await fetchMetricsForDashboard();
  const aiMetrics = await fetchMetricsForAI();
  
  const timestamp1 = normalizeTimestamp(dashboardMetrics.timestamp);
  const timestamp2 = normalizeTimestamp(aiMetrics.timestamp);
  
  console.assert(timestamp1 === timestamp2, '타임스탬프 불일치');
  console.assert(
    JSON.stringify(dashboardMetrics.servers) === JSON.stringify(aiMetrics.servers),
    '메트릭 데이터 불일치'
  );
};
```

## 🚀 구현 단계

### Phase 1: 통합 메트릭 API 구축
- [x] FNV-1a 해시 기반 메트릭 생성 (완료)
- [ ] 시간 정규화 로직 추가
- [ ] `/api/metrics/current` 엔드포인트 생성

### Phase 2: 기존 시스템 통합
- [ ] 모니터링 대시보드 API 변경
- [ ] AI 어시스턴트 데이터 소스 통합
- [ ] 클라이언트 사이드 캐싱 구현

### Phase 3: 일관성 검증
- [ ] 데이터 일관성 테스트 추가
- [ ] 실시간 검증 메커니즘 구현
- [ ] 에러 처리 및 폴백 로직

## 💡 예상 효과

| 항목 | 기존 방식 | 개선된 방식 | 효과 |
|------|-----------|-------------|------|
| **데이터 일관성** | 불일치 위험 | 완전 일치 | 사용자 혼란 해소 |
| **API 호출** | 각각 호출 | 통합 API | 중복 제거 |
| **캐싱 효과** | 없음 | 30초 캐시 | 성능 향상 |
| **디버깅** | 어려움 | 단일 소스 | 문제 추적 용이 |

## 🎯 핵심 이점

### 1. **완벽한 데이터 일치**
```
사용자: "지금 웹서버 CPU가 몇 %인가요?"
AI: "현재 웹서버-01의 CPU는 78%입니다."
대시보드: [78% 표시] ✅ 일치!
```

### 2. **성능 최적화**
- 1분 단위 정규화로 불필요한 계산 방지
- 30초 캐싱으로 중복 API 호출 제거
- 클라이언트-서버 간 효율적 통신

### 3. **개발 편의성**
- 단일 진실 소스 (Single Source of Truth)
- 디버깅 시 일관된 데이터 보장
- 테스트 작성 용이

## ⚠️ 주의사항

### 실시간성 vs 일관성 트레이드오프
- **실시간성**: 1분 정규화로 최대 60초 지연 가능
- **일관성**: 완벽한 데이터 일치 보장
- **결론**: 포트폴리오 프로젝트에서는 일관성이 더 중요

### 캐싱 만료 처리
```typescript
// 분 단위 경계에서 캐시 자동 만료
const isNextMinute = (cachedTime: number, currentTime: number): boolean => {
  return normalizeTimestamp(cachedTime) !== normalizeTimestamp(currentTime);
};
```

## 🔚 결론

**모니터링과 AI 어시스턴트의 데이터 일관성**은 사용자 경험의 핵심입니다.

**통합 메트릭 API + 시간 정규화**로 이 문제를 완벽히 해결하고, 
**"AI가 말하는 것과 대시보드가 보여주는 것이 다르다"**는 혼란을 완전히 제거할 수 있습니다.