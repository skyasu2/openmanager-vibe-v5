# 🧪 A/B 테스트 결과 로직 가이드

OpenManager v5.17.10-MCP의 A/B 테스트 시스템 설계 및 분기 기준 가이드입니다.

## 📋 목차

1. [A/B 테스트 개요](#ab-테스트-개요)
2. [테스트 시나리오](#테스트-시나리오)
3. [분기 기준 로직](#분기-기준-로직)
4. [성능 측정 지표](#성능-측정-지표)
5. [결과 판단 기준](#결과-판단-기준)
6. [구현 예시](#구현-예시)

---

## 🎯 A/B 테스트 개요

### 테스트 목적

OpenManager의 AI 응답 품질과 사용자 경험을 최적화하기 위해 다양한 변수를 테스트합니다.

### 핵심 테스트 영역

```
A/B 테스트 구조
├── 🤖 AI 응답 알고리즘 (FastAPI vs MCP 하이브리드)
├── 🎨 UI/UX 변형 (레이아웃, 색상, 워딩)
├── 📊 성능 최적화 (캐시 전략, 응답 형식)
└── 🔧 기능 활성화 (신규 기능의 점진적 롤아웃)
```

### 분기 전략

| 전략 | 설명 | 사용 시기 |
|------|------|-----------|
| **50/50 분할** | 전체 사용자를 균등 분할 | 주요 기능 변경 |
| **90/10 분할** | 안전한 카나리 배포 | 고위험 변경사항 |
| **사용자 기반** | 특정 사용자 그룹 대상 | 타겟 기능 테스트 |
| **지역 기반** | 지역별 다른 경험 제공 | 지역화 테스트 |

---

## 🧪 테스트 시나리오

### 1. AI 응답 알고리즘 테스트

#### 시나리오 A: FastAPI 우선 모드
```typescript
const algorithmA = {
  name: "FastAPI_Priority",
  description: "FastAPI 엔진을 우선 사용, 실패시 MCP 폴백",
  config: {
    fastapi_timeout: 3000,
    mcp_fallback: true,
    cache_strategy: "aggressive"
  }
};
```

#### 시나리오 B: 하이브리드 모드
```typescript
const algorithmB = {
  name: "Hybrid_Mode",
  description: "FastAPI와 MCP 병렬 처리, 빠른 응답 선택",
  config: {
    parallel_processing: true,
    response_selection: "first_success",
    cache_strategy: "balanced"
  }
};
```

### 2. UI/UX 변형 테스트

#### 변형 A: 기존 디자인
```typescript
const uiVariantA = {
  theme: "dark_gradient",
  layout: "sidebar_right",
  ai_indicator: "pulsing_dot",
  response_format: "card_based"
};
```

#### 변형 B: 새로운 디자인
```typescript
const uiVariantB = {
  theme: "glassmorphism",
  layout: "bottom_panel",
  ai_indicator: "typing_animation",
  response_format: "chat_bubble"
};
```

### 3. 성능 최적화 테스트

#### 전략 A: 공격적 캐싱
```typescript
const performanceA = {
  cache_ttl: 3600, // 1시간
  preload_common_queries: true,
  compression: "gzip",
  cdn_usage: true
};
```

#### 전략 B: 실시간 우선
```typescript
const performanceB = {
  cache_ttl: 300, // 5분
  preload_common_queries: false,
  compression: "brotli",
  cdn_usage: false
};
```

---

## 🔀 분기 기준 로직

### 사용자 분할 알고리즘

```typescript
interface ABTestConfig {
  testId: string;
  name: string;
  enabled: boolean;
  trafficAllocation: number; // 0-100%
  variants: ABVariant[];
  targeting?: UserTargeting;
}

interface ABVariant {
  id: string;
  name: string;
  weight: number; // 변형별 가중치
  config: Record<string, any>;
}

interface UserTargeting {
  userTypes?: ('new' | 'returning' | 'premium')[];
  regions?: string[];
  devices?: ('mobile' | 'desktop' | 'tablet')[];
  timeRange?: {
    start: string;
    end: string;
  };
}

class ABTestManager {
  /**
   * 사용자를 A/B 테스트 그룹에 할당
   */
  assignUserToTest(userId: string, testConfig: ABTestConfig): ABVariant | null {
    // 1. 테스트 활성화 여부 확인
    if (!testConfig.enabled) return null;
    
    // 2. 트래픽 할당 확인
    const userHash = this.hashUserId(userId);
    const trafficThreshold = testConfig.trafficAllocation / 100;
    
    if (userHash > trafficThreshold) {
      return null; // 테스트 대상 외
    }
    
    // 3. 타겟팅 조건 확인
    if (testConfig.targeting && !this.matchesTargeting(userId, testConfig.targeting)) {
      return null;
    }
    
    // 4. 변형 할당
    return this.selectVariant(userHash, testConfig.variants);
  }
  
  private hashUserId(userId: string): number {
    // 일관성 있는 해시 생성 (0-1 범위)
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 32비트 정수 변환
    }
    return Math.abs(hash) / 2147483647;
  }
  
  private selectVariant(hash: number, variants: ABVariant[]): ABVariant {
    const totalWeight = variants.reduce((sum, v) => sum + v.weight, 0);
    const threshold = hash * totalWeight;
    
    let cumulative = 0;
    for (const variant of variants) {
      cumulative += variant.weight;
      if (threshold <= cumulative) {
        return variant;
      }
    }
    
    return variants[variants.length - 1]; // 폴백
  }
}
```

### 실시간 분기 결정

```typescript
class FeatureFlag {
  /**
   * 실시간으로 기능 활성화 여부 결정
   */
  static shouldEnableFeature(
    featureName: string, 
    userId: string, 
    context: RequestContext
  ): boolean {
    const config = this.getFeatureConfig(featureName);
    
    // 1. 전역 비활성화
    if (!config.enabled) return false;
    
    // 2. 사용자별 강제 설정
    const userOverride = this.getUserOverride(userId, featureName);
    if (userOverride !== null) return userOverride;
    
    // 3. 조건부 활성화
    return this.evaluateConditions(config.conditions, context);
  }
  
  private static evaluateConditions(
    conditions: FeatureCondition[], 
    context: RequestContext
  ): boolean {
    return conditions.every(condition => {
      switch (condition.type) {
        case 'user_percentage':
          return this.hashUserId(context.userId) < condition.value / 100;
          
        case 'time_range':
          const now = new Date();
          return now >= condition.start && now <= condition.end;
          
        case 'server_load':
          return context.serverLoad < condition.threshold;
          
        case 'error_rate':
          return context.errorRate < condition.threshold;
          
        default:
          return true;
      }
    });
  }
}
```

---

## 📊 성능 측정 지표

### 주요 KPI

#### 1. AI 응답 품질
```typescript
interface AIQualityMetrics {
  response_time: number;        // 평균 응답 시간 (ms)
  success_rate: number;         // 성공률 (%)
  user_satisfaction: number;    // 사용자 만족도 (1-5)
  relevance_score: number;      // 응답 관련성 (0-1)
  cache_hit_rate: number;       // 캐시 적중률 (%)
}
```

#### 2. 사용자 참여도
```typescript
interface EngagementMetrics {
  session_duration: number;     // 세션 지속 시간 (초)
  queries_per_session: number;  // 세션당 질의 수
  return_rate: number;          // 재방문율 (%)
  feature_adoption: number;     // 신기능 사용률 (%)
  churn_rate: number;          // 이탈률 (%)
}
```

#### 3. 시스템 성능
```typescript
interface SystemMetrics {
  cpu_usage: number;           // CPU 사용률 (%)
  memory_usage: number;        // 메모리 사용률 (%)
  error_rate: number;          // 에러율 (%)
  uptime: number;              // 가동 시간 (%)
  cost_per_request: number;    // 요청당 비용 ($)
}
```

### 측정 구현

```typescript
class MetricsCollector {
  async recordABTestMetric(
    testId: string,
    variant: string,
    metricName: string,
    value: number,
    context: MetricContext
  ): Promise<void> {
    const metric = {
      testId,
      variant,
      metricName,
      value,
      timestamp: Date.now(),
      userId: context.userId,
      sessionId: context.sessionId,
      metadata: context.metadata
    };
    
    // Redis에 실시간 저장
    await this.redis.lpush(`ab_test:${testId}:${variant}:${metricName}`, 
                          JSON.stringify(metric));
    
    // 배치 처리를 위한 큐에 추가
    await this.analytics.track('ab_test_metric', metric);
  }
  
  async getTestResults(testId: string, timeRange: TimeRange): Promise<ABTestResult> {
    const variants = await this.getTestVariants(testId);
    const results: ABTestResult = {
      testId,
      timeRange,
      variants: {}
    };
    
    for (const variant of variants) {
      const metrics = await this.aggregateMetrics(testId, variant, timeRange);
      results.variants[variant] = {
        sampleSize: metrics.sampleSize,
        conversionRate: metrics.conversionRate,
        confidenceInterval: this.calculateConfidenceInterval(metrics),
        statisticalSignificance: this.calculateSignificance(metrics, results.variants)
      };
    }
    
    return results;
  }
}
```

---

## 📈 결과 판단 기준

### 통계적 유의성

#### 최소 샘플 크기
```typescript
const MINIMUM_SAMPLE_SIZES = {
  high_traffic_feature: 1000,    // 주요 기능
  ui_change: 500,               // UI 변경
  performance_test: 2000,       // 성능 테스트
  new_feature: 100              // 신규 기능
};
```

#### 신뢰도 수준
```typescript
const CONFIDENCE_LEVELS = {
  critical_change: 0.99,        // 99% 신뢰도
  major_feature: 0.95,          // 95% 신뢰도  
  minor_improvement: 0.90,      // 90% 신뢰도
  experimental: 0.80            // 80% 신뢰도
};
```

### 의사결정 매트릭스

```typescript
interface DecisionCriteria {
  metric: string;
  improvement_threshold: number;  // 최소 개선율
  significance_level: number;     // 통계적 유의성
  business_impact: 'high' | 'medium' | 'low';
  risk_level: 'high' | 'medium' | 'low';
}

const DECISION_MATRIX: DecisionCriteria[] = [
  {
    metric: 'response_time',
    improvement_threshold: 0.10,  // 10% 개선
    significance_level: 0.95,
    business_impact: 'high',
    risk_level: 'medium'
  },
  {
    metric: 'user_satisfaction',
    improvement_threshold: 0.05,  // 5% 개선
    significance_level: 0.95,
    business_impact: 'high',
    risk_level: 'low'
  },
  {
    metric: 'error_rate',
    improvement_threshold: -0.20, // 20% 감소
    significance_level: 0.99,
    business_impact: 'high',
    risk_level: 'high'
  }
];
```

### 자동 의사결정 로직

```typescript
class ABTestDecisionEngine {
  async evaluateTest(testId: string): Promise<TestDecision> {
    const results = await this.metricsCollector.getTestResults(testId);
    const config = await this.getTestConfig(testId);
    
    const decisions: MetricDecision[] = [];
    
    for (const criteria of config.decisionCriteria) {
      const decision = this.evaluateMetric(results, criteria);
      decisions.push(decision);
    }
    
    return this.aggregateDecisions(decisions, config);
  }
  
  private evaluateMetric(
    results: ABTestResult, 
    criteria: DecisionCriteria
  ): MetricDecision {
    const controlVariant = results.variants['control'];
    const testVariant = results.variants['test'];
    
    // 개선율 계산
    const improvement = (testVariant.value - controlVariant.value) / controlVariant.value;
    
    // 통계적 유의성 확인
    const isSignificant = testVariant.statisticalSignificance >= criteria.significance_level;
    
    // 비즈니스 임계값 확인
    const meetsThreshold = Math.abs(improvement) >= Math.abs(criteria.improvement_threshold);
    
    const recommendation = this.generateRecommendation(
      improvement, 
      isSignificant, 
      meetsThreshold, 
      criteria
    );
    
    return {
      metric: criteria.metric,
      improvement,
      isSignificant,
      meetsThreshold,
      recommendation,
      confidence: testVariant.statisticalSignificance
    };
  }
  
  private generateRecommendation(
    improvement: number,
    isSignificant: boolean,
    meetsThreshold: boolean,
    criteria: DecisionCriteria
  ): 'adopt' | 'reject' | 'continue' | 'investigate' {
    if (!isSignificant) {
      return 'continue'; // 더 많은 데이터 필요
    }
    
    if (improvement > 0 && meetsThreshold) {
      return criteria.risk_level === 'high' ? 'investigate' : 'adopt';
    }
    
    if (improvement < 0 && Math.abs(improvement) > Math.abs(criteria.improvement_threshold)) {
      return 'reject'; // 성능 저하
    }
    
    return 'investigate'; // 애매한 결과
  }
}
```

---

## 💻 구현 예시

### A/B 테스트 설정

```typescript
// src/modules/ai-agent/testing/ABTestManager.ts
export const AB_TESTS: ABTestConfig[] = [
  {
    testId: 'ai_algorithm_v2',
    name: 'AI Algorithm Optimization',
    enabled: true,
    trafficAllocation: 50,
    variants: [
      {
        id: 'control',
        name: 'Current Algorithm',
        weight: 50,
        config: { algorithm: 'fastapi_priority' }
      },
      {
        id: 'test',
        name: 'Hybrid Algorithm',
        weight: 50,
        config: { algorithm: 'hybrid_mode' }
      }
    ],
    targeting: {
      userTypes: ['returning'],
      timeRange: {
        start: '2025-05-28T00:00:00Z',
end: '2025-06-02T23:59:59Z'
      }
    }
  }
];
```

### 실제 적용 코드

```typescript
// src/core/ai/unified-ai-system.ts
class UnifiedAISystem {
  async processQuery(query: string, context: QueryContext): Promise<AIResponse> {
    // A/B 테스트 변형 확인
    const testVariant = this.abTestManager.getVariant('ai_algorithm_v2', context.userId);
    
    let response: AIResponse;
    
    if (testVariant?.config.algorithm === 'hybrid_mode') {
      // 테스트 변형: 하이브리드 모드
      response = await this.processHybridMode(query, context);
      
      // 메트릭 기록
      await this.metricsCollector.recordABTestMetric(
        'ai_algorithm_v2',
        'test',
        'response_time',
        response.processingTime,
        context
      );
    } else {
      // 컨트롤 그룹: 기존 알고리즘
      response = await this.processFastAPIMode(query, context);
      
      await this.metricsCollector.recordABTestMetric(
        'ai_algorithm_v2',
        'control',
        'response_time',
        response.processingTime,
        context
      );
    }
    
    return response;
  }
}
```

### 결과 분석 대시보드

```typescript
// src/components/ai/AIAgentAdminDashboard.tsx
export default function ABTestDashboard() {
  const [testResults, setTestResults] = useState<ABTestResult[]>([]);
  
  useEffect(() => {
    const fetchResults = async () => {
      const results = await fetch('/api/admin/ab-tests').then(r => r.json());
      setTestResults(results);
    };
    
    fetchResults();
    const interval = setInterval(fetchResults, 30000); // 30초마다 갱신
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">A/B 테스트 결과</h1>
      
      {testResults.map(result => (
        <div key={result.testId} className="bg-white rounded-lg p-6 mb-6 shadow">
          <h2 className="text-xl font-semibold mb-4">{result.testName}</h2>
          
          <div className="grid grid-cols-2 gap-6">
            {Object.entries(result.variants).map(([variantId, variant]) => (
              <div key={variantId} className="border rounded p-4">
                <h3 className="font-medium mb-2">{variantId}</h3>
                <div className="space-y-2">
                  <div>표본 크기: {variant.sampleSize.toLocaleString()}</div>
                  <div>전환율: {(variant.conversionRate * 100).toFixed(2)}%</div>
                  <div>신뢰도: {(variant.statisticalSignificance * 100).toFixed(1)}%</div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 p-4 bg-gray-50 rounded">
            <strong>권장사항:</strong> {result.recommendation}
          </div>
        </div>
      ))}
    </div>
  );
}
```

---

## 📝 모니터링 및 알림

### 자동 알림 설정

```typescript
const ALERT_CONDITIONS = {
  sample_size_reached: 1000,
  significance_achieved: 0.95,
  performance_degradation: -0.10,
  error_spike: 0.05
};

class ABTestMonitor {
  async checkAlertConditions(testId: string): Promise<void> {
    const results = await this.getTestResults(testId);
    
    for (const [variantId, variant] of Object.entries(results.variants)) {
      // 샘플 크기 달성
      if (variant.sampleSize >= ALERT_CONDITIONS.sample_size_reached) {
        await this.sendAlert(`Test ${testId} variant ${variantId} reached minimum sample size`);
      }
      
      // 통계적 유의성 달성
      if (variant.statisticalSignificance >= ALERT_CONDITIONS.significance_achieved) {
        await this.sendAlert(`Test ${testId} variant ${variantId} achieved statistical significance`);
      }
      
      // 성능 저하 감지
      if (variant.performanceChange <= ALERT_CONDITIONS.performance_degradation) {
        await this.sendUrgentAlert(`Performance degradation detected in test ${testId}`);
      }
    }
  }
}
```

---

## 📊 리포팅

### 주간 A/B 테스트 리포트

```typescript
class ABTestReporter {
  async generateWeeklyReport(): Promise<WeeklyReport> {
    const activeTests = await this.getActiveTests();
    const completedTests = await this.getCompletedTests(7); // 지난 7일
    
    return {
      summary: {
        activeTests: activeTests.length,
        completedTests: completedTests.length,
        totalUsers: await this.getTotalTestUsers(),
        avgConversionLift: this.calculateAverageConversionLift(completedTests)
      },
      activeTests: activeTests.map(test => ({
        testId: test.id,
        name: test.name,
        runtime: test.runtime,
        sampleSize: test.sampleSize,
        projectedCompletion: test.projectedCompletion
      })),
      completedTests: completedTests.map(test => ({
        testId: test.id,
        name: test.name,
        result: test.result,
        impact: test.businessImpact,
        decision: test.finalDecision
      })),
      recommendations: await this.generateRecommendations()
    };
  }
}
```

---

*이 가이드는 OpenManager v5.17.10-MCP의 A/B 테스트 시스템 구축을 위한 완전한 참조 문서입니다. 데이터 기반 의사결정을 통해 지속적인 개선을 달성할 수 있습니다.* 