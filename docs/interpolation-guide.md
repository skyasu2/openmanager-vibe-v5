# 📈 시계열 데이터 보간(Interpolation) 가이드

OpenManager Vibe V5의 10분 간격 시계열 데이터를 1분 또는 5분 단위로 보간하여 부드럽고 현실적인 흐름을 만드는 기능입니다.

## 🎯 **목적**

- **부드러운 시각화**: 10분 → 1분 간격으로 차트가 더 부드러워짐
- **AI 분석 정밀도**: 더 세밀한 패턴 감지 가능
- **현실적 노이즈**: 인위적이지 않은 자연스러운 변화
- **성능 최적화**: Vercel 무료 티어에서 안정적 동작

## 🏗️ **시스템 구조**

```
📈 Interpolation System
├── 🔧 interpolateMetrics.ts       # 핵심 보간 엔진
├── 🌉 hybrid-metrics-bridge.ts   # 통합 인터페이스
├── 📡 /api/metrics/daily          # API 엔드포인트
└── 🧪 test-interpolation.ts       # 테스트 스크립트
```

## 📊 **데이터 변환 예시**

### Before (10분 간격)
```
00:00 → 00:10 → 00:20 → 00:30
[70%]   [75%]   [72%]   [78%]
```

### After (1분 간격)
```
00:00 → 00:01 → 00:02 → ... → 00:10
[70%]   [70.5%] [71.2%]       [75%]
```

## 🚀 **빠른 시작**

### 1. **기본 사용법**

```typescript
import { interpolateMetrics } from '@/lib/interpolateMetrics';
import { getMetrics } from '@/lib/supabase-metrics';

// 원본 데이터 조회
const originalData = await getMetrics('web-01');

// 1분 간격으로 보간
const interpolated = interpolateMetrics(originalData, {
  resolutionMinutes: 1,
  noiseLevel: 0.02,
  preserveOriginal: true
});

console.log(`${originalData.length} → ${interpolated.length}개`);
```

### 2. **Hybrid Bridge 사용** (권장)

```typescript
import { getHybridMetrics } from '@/lib/hybrid-metrics-bridge';

// 1분 간격으로 자동 보간된 데이터 조회
const result = await getHybridMetrics('api-01', 1);

console.log(`데이터: ${result.data.length}개`);
console.log(`해상도: ${result.metadata.resolution}`);
console.log(`품질: ${result.metadata.quality?.qualityScore}점`);
```

### 3. **API를 통한 사용**

```bash
# 기본 조회 (원본 10분 간격)
curl "http://localhost:3000/api/metrics/daily?server_id=web-01"

# 1분 간격 보간 적용
curl "http://localhost:3000/api/metrics/daily?server_id=web-01&interpolate=true&resolution=1"

# 5분 간격 + 낮은 노이즈
curl "http://localhost:3000/api/metrics/daily?interpolate=true&resolution=5&noise=0.01"
```

## ⚙️ **보간 옵션 상세**

### `InterpolationOptions` 인터페이스

```typescript
interface InterpolationOptions {
  resolutionMinutes: 1 | 2 | 5;    // 보간 해상도
  noiseLevel: number;              // 노이즈 레벨 (0.0-1.0)
  preserveOriginal: boolean;       // 원본 데이터 유지
  smoothingFactor: number;         // 평활화 정도 (0.0-1.0)
}
```

### **해상도 설정**
- `1분`: 최고 해상도, 10배 데이터 증가
- `2분`: 중간 해상도, 5배 데이터 증가  
- `5분`: 낮은 해상도, 2배 데이터 증가

### **노이즈 레벨**
- `0.0`: 완전 선형 (인위적)
- `0.02`: 기본값 (±2% 현실적)
- `0.05`: 높은 변동성 (±5%)

### **평활화 팩터**
- `0.0`: 평활화 없음
- `0.1`: 기본값 (적절한 평활화)
- `0.3`: 강한 평활화 (급격한 변화 완화)

## 🎨 **사용 시나리오별 설정**

### 1. **시각화용** (부드러운 차트)

```typescript
const visualizationData = await interpolateMetrics(originalData, {
  resolutionMinutes: 1,
  noiseLevel: 0.015,      // 낮은 노이즈
  preserveOriginal: true,
  smoothingFactor: 0.2    // 강한 평활화
});
```

### 2. **AI 분석용** (패턴 감지)

```typescript
const analyticsData = await getAnalyticsMetrics('db-01', 1);
// 노이즈 최소화 (0.005), 평활화 강화 (0.2)
```

### 3. **실시간 모니터링용** (성능 우선)

```typescript
const realtimeData = await interpolateMetrics(originalData, {
  resolutionMinutes: 5,   // 낮은 해상도로 성능 최적화
  noiseLevel: 0.01,
  preserveOriginal: false, // 메모리 절약
  smoothingFactor: 0.05
});
```

### 4. **장애 분석용** (높은 정밀도)

```typescript
const troubleshootData = await interpolateMetrics(originalData, {
  resolutionMinutes: 1,
  noiseLevel: 0.005,      // 매우 낮은 노이즈
  preserveOriginal: true,
  smoothingFactor: 0.0    // 평활화 없음
});
```

## 🧪 **테스트 및 검증**

### **테스트 실행**

```bash
# 전체 테스트
npm run test:interpolation

# 기본 보간 테스트만
npm run test:interpolation:basic

# Hybrid Bridge 테스트
npm run test:interpolation:bridge

# 성능 벤치마크
npm run test:interpolation:performance
```

### **품질 검증**

```typescript
import { validateInterpolationQuality } from '@/lib/interpolateMetrics';

const quality = validateInterpolationQuality(original, interpolated);

console.log(`품질 점수: ${quality.qualityScore}/100`);
console.log(`오류: ${quality.errors.length}개`);
console.log(`경고: ${quality.warnings.length}개`);
```

## 📊 **성능 최적화**

### **메모리 효율성**

```typescript
// 서버별 개별 처리 (메모리 절약)
const result = await interpolateMetricsByServer(largeData, options);

// 스트리밍 모드 (대용량 데이터)
const bridge = new HybridMetricsBridge({ streamingMode: true });
for await (const batch of bridge.streamMetrics('server-01', 1000)) {
  // 배치 단위 처리
}
```

### **캐싱 활용**

```typescript
const bridge = new HybridMetricsBridge({
  enableCaching: true,
  cacheExpiryMinutes: 10
});

// 첫 조회: Supabase에서 데이터 가져와서 보간
const result1 = await bridge.getMetrics('web-01');

// 재조회: 캐시에서 즉시 반환
const result2 = await bridge.getMetrics('web-01');
console.log(`캐시 적중: ${result2.metadata.cached}`);
```

### **데이터 크기 제한**

```typescript
const bridge = new HybridMetricsBridge({
  maxDataPoints: 5000  // 최대 5000개 포인트로 제한
});
```

## 🔧 **고급 기능**

### **커스텀 노이즈 패턴**

기본 가우시안 노이즈 외에 메트릭 타입별 특화된 노이즈:

- **CPU**: 변동성 높음 (스파이크 패턴)
- **메모리**: 안정적 (점진적 변화)
- **디스크**: 매우 안정적
- **응답시간**: 최고 변동성 (네트워크 영향)

### **시간대별 패턴**

업무시간 vs 심야시간에 따른 자동 노이즈 조절:

```typescript
// 업무시간 (09:00-18:00): 높은 변동성
// 심야시간 (22:00-06:00): 낮은 변동성
```

### **장애 패턴 보존**

원본 데이터의 장애 패턴을 보간 과정에서 유지:

- 급격한 CPU 스파이크
- 메모리 누수 점진적 증가
- 응답시간 급증

## 📈 **예상 데이터 증가량**

| 해상도 | 증가 비율 | 예시 (144개 → ?) |
|--------|-----------|------------------|
| 1분    | 10배      | 144개 → 1,440개  |
| 2분    | 5배       | 144개 → 720개    |
| 5분    | 2배       | 144개 → 288개    |

## 🚨 **주의사항**

### **Vercel 무료 티어 제한**

- **함수 실행시간**: 10초 제한 → 큰 데이터셋은 분할 처리
- **메모리**: 1024MB 제한 → maxDataPoints로 제한
- **API 호출**: 100,000/월 → 캐싱으로 최적화

### **데이터 정확성**

- 보간된 데이터는 **추정값**입니다
- 정확한 분석에는 원본 데이터 사용 권장
- 시각화와 트렌드 분석 목적으로 활용

### **성능 고려사항**

```typescript
// ❌ 비효율적
for (const serverId of servers) {
  const data = await interpolateMetrics(await getMetrics(serverId), options);
}

// ✅ 효율적
const allData = await getMetrics();
const interpolated = await interpolateMetricsByServer(allData, options);
```

## 🎯 **실제 사용 예시**

### **차트 컴포넌트에서 활용**

```typescript
// components/MetricsChart.tsx
import { getHybridMetrics } from '@/lib/hybrid-metrics-bridge';

const MetricsChart = async ({ serverId }: { serverId: string }) => {
  const { data } = await getHybridMetrics(serverId, 1); // 1분 간격
  
  return (
    <LineChart data={data}>
      {/* 부드러운 차트 렌더링 */}
    </LineChart>
  );
};
```

### **AI 분석 엔진에서 활용**

```typescript
// services/ai/analysis-engine.ts
import { getAnalyticsMetrics } from '@/lib/hybrid-metrics-bridge';

export const analyzeServerTrends = async (serverId: string) => {
  // 노이즈 최소화된 고해상도 데이터
  const { data } = await getAnalyticsMetrics(serverId, 1);
  
  // AI 모델에 정밀한 시계열 데이터 제공
  return aiModel.detectPatterns(data);
};
```

### **대시보드에서 활용**

```typescript
// app/dashboard/page.tsx
const DashboardPage = async () => {
  const allServers = ['web-01', 'api-01', 'db-01'];
  
  const metricsPromises = allServers.map(serverId => 
    getHybridMetrics(serverId, 5) // 5분 간격으로 성능 최적화
  );
  
  const results = await Promise.all(metricsPromises);
  
  return <MetricsDashboard data={results} />;
};
```

---

## 🎉 **완료 체크리스트**

- [ ] Supabase에 daily_metrics 데이터 존재 확인
- [ ] `npm run test:interpolation:basic` 성공
- [ ] API 엔드포인트 테스트: `curl "localhost:3000/api/metrics/daily?interpolate=true&resolution=1"`
- [ ] Hybrid Bridge 기능 테스트: `npm run test:interpolation:bridge`
- [ ] 프로덕션 환경에서 캐싱 동작 확인
- [ ] 차트 컴포넌트에 보간 데이터 적용
- [ ] AI 분석 엔진에서 고해상도 데이터 활용

이제 OpenManager Vibe V5에서 부드럽고 현실적인 시계열 데이터를 사용할 수 있습니다! 🚀 