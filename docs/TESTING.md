# 🧪 OpenManager Vibe v5 - 테스트 전략 문서

> **최종 업데이트**: 2024-12-28  
> **Jules 분석 기반 테스트 전략 수립**

## 📋 **테스트 전략 개요**

### 🎯 **목표**
1. **AI 핵심 로직 테스트 커버리지 확보**
2. **Intent Classifier 통합 검증**
3. **MCP 분석 파이프라인 전체 검증**
4. **SmartModeDetector 역할 분리 확인**

### 🛠️ **사용 도구**
- **Testing Framework**: Vitest v3.1.4
- **Mocking**: Vitest built-in mocks
- **Coverage**: V8 provider
- **UI**: @vitest/ui

## 📁 **테스트 구조**

```
tests/
├── setup.ts                          # 전역 설정
├── integration/
│   ├── mcp-analysis.test.ts          # MCP 전체 흐름 테스트
│   └── ai-flow.test.ts               # AI 처리 흐름 테스트
├── unit/
│   ├── intent-classifier.test.ts     # Intent 분류 테스트
│   ├── smart-mode-detector.test.ts   # 모드 감지 테스트
│   └── entity-extraction.test.ts     # 엔티티 추출 테스트
└── mocks/
    ├── transformers.mock.ts          # Transformers.js Mock
    └── api.mock.ts                   # API Mock
```

## 🎯 **핵심 테스트 시나리오**

### **1. UnifiedIntentClassifier 통합 테스트**

#### **기본 분류 기능**
```typescript
describe('📋 기본 분류 기능', () => {
  it('간단한 서버 상태 질문을 올바르게 분류한다', async () => {
    const query = '서버 상태 확인해줘';
    const result = await classifier.classify(query);

    expect(result.intent).toMatch(/server_status|general_inquiry/);
    expect(result.confidence).toBeGreaterThan(0.6);
    expect(result.method).toMatch(/fallback|transformers/);
    expect(result.suggestedMode).toBe('basic');
    expect(result.needsPythonEngine).toBe(false);
  });

  it('복잡한 성능 예측 질문을 advanced 모드로 분류한다', async () => {
    const query = '서버 CPU 사용률 트렌드를 분석해서 다음 주 용량 부족 시점을 예측해줘';
    const result = await classifier.classify(query);

    expect(result.intent).toMatch(/server_performance_prediction|capacity_planning/);
    expect(result.needsTimeSeries).toBe(true);
    expect(result.needsComplexML).toBe(true);
    expect(result.suggestedMode).toBe('advanced');
    expect(result.urgency).toMatch(/medium|high/);
  });
});
```

#### **엔티티 추출 검증**
```typescript
describe('🏷️ 엔티티 추출', () => {
  it('서버 ID를 올바르게 추출한다', async () => {
    const query = 'web-prod-01 서버 메모리 사용률 확인해줘';
    const result = await classifier.classify(query);

    expect(result.entities).toContain('web-prod-01');
    expect(result.entities).toContain('메모리');
  });

  it('시간 범위를 올바르게 추출한다', async () => {
    const query = '최근 24시간 동안의 서버 성능 분석해줘';
    const result = await classifier.classify(query);

    expect(result.entities).toContain('24시간');
    expect(result.needsTimeSeries).toBe(true);
  });
});
```

#### **Fallback 동작 검증**
```typescript
describe('🤝 Fallback 동작', () => {
  it('Transformers.js 실패 시 Fallback을 사용한다', async () => {
    const classifierWithFailure = new UnifiedIntentClassifier();
    
    const query = '서버 상태 확인';
    const result = await classifierWithFailure.classify(query);

    expect(result.method).toBe('fallback');
    expect(result.fallbackReason).toMatch(/not_initialized|transformers_error/);
    expect(result.confidence).toBeGreaterThan(0.5);
  });
});
```

### **2. Python 엔진 필요성 판단 테스트**

```typescript
describe('🐍 Python 엔진 필요성 판단', () => {
  const testCases = [
    {
      query: '현재 서버 상태',
      expectedPython: false,
      description: '단순 조회'
    },
    {
      query: '서버 클러스터 전체의 용량 계획을 위한 ML 기반 예측 분석 수행',
      expectedPython: true,
      description: '복잡한 예측 분석'
    },
    {
      query: '에러 로그 분석',
      expectedPython: false,
      description: 'NLP 분석 (JavaScript 처리 가능)'
    }
  ];

  testCases.forEach(({ query, expectedPython, description }) => {
    it(`${description}: ${expectedPython ? 'Python 필요' : 'JavaScript 처리'}`, async () => {
      const result = await classifier.classify(query);
      expect(result.needsPythonEngine).toBe(expectedPython);
    });
  });
});
```

### **3. MCP 전체 흐름 통합 테스트**

```typescript
describe('🔄 MCP 전체 흐름 통합 테스트', () => {
  it('간단한 질문 → Basic 모드 → 빠른 응답', async () => {
    const classifier = new UnifiedIntentClassifier();
    const query = '서버 상태가 어때?';
    
    const result = await classifier.classify(query);
    
    // Basic 모드 검증
    expect(result.suggestedMode).toBe('basic');
    expect(result.needsPythonEngine).toBe(false);
    expect(result.urgency).toMatch(/low|medium/);
    
    // 처리 시간 검증
    expect(result.processingTime).toBeLessThan(1000);
  });

  it('복잡한 질문 → Advanced 모드 → 상세 분석', async () => {
    const query = `
      web-prod-01과 web-prod-02 서버의 지난 1주일간 CPU, 메모리, 
      디스크 사용률 패턴을 분석해서 성능 병목 지점을 찾고, 
      다음 달 트래픽 증가를 고려한 용량 계획을 수립해줘
    `;
    
    const result = await classifier.classify(query);
    
    // Advanced 모드 검증
    expect(result.suggestedMode).toBe('advanced');
    expect(result.needsPythonEngine).toBe(true);
    expect(result.needsTimeSeries).toBe(true);
    expect(result.needsComplexML).toBe(true);
    
    // 엔티티 추출 검증
    expect(result.entities).toContain('web-prod-01');
    expect(result.entities).toContain('web-prod-02');
    expect(result.entities).toContain('1주일');
  });
});
```

### **4. 성능 및 신뢰성 테스트**

```typescript
describe('📊 성능 및 신뢰성 테스트', () => {
  it('동시 다중 요청 처리', async () => {
    const classifier = new UnifiedIntentClassifier();
    const queries = [
      '서버 상태',
      'CPU 사용률 분석',
      '메모리 누수 감지',
      '용량 계획',
      '장애 진단'
    ];

    const promises = queries.map(query => classifier.classify(query));
    const results = await Promise.all(promises);

    expect(results).toHaveLength(5);
    results.forEach(result => {
      expect(result.confidence).toBeGreaterThan(0.5);
      expect(result.processingTime).toBeLessThan(5000);
    });
  });

  it('분류 통계 정보 제공', async () => {
    const classifier = new UnifiedIntentClassifier();
    const stats = classifier.getClassificationStats();

    expect(stats).toHaveProperty('transformersAvailable');
    expect(stats).toHaveProperty('initialized');
    expect(stats).toHaveProperty('fallbackCount');
    expect(stats).toHaveProperty('transformersCount');
  });
});
```

## 🔧 **Mock 전략**

### **Transformers.js Mock**
```typescript
// tests/mocks/transformers.mock.ts
vi.mock('@xenova/transformers', () => ({
  pipeline: vi.fn().mockResolvedValue({
    // Mock classifier
    classify: vi.fn().mockImplementation(async (text: string, labels: string[]) => ({
      labels: ['server_status'],
      scores: [0.85]
    })),
    // Mock NER
    ner: vi.fn().mockResolvedValue([])
  })
}));
```

### **환경 설정 Mock**
```typescript
// tests/setup.ts
// 브라우저 전역 객체 모의
Object.defineProperty(global, 'window', {
  value: {},
  writable: true
});

// fetch 모의
global.fetch = vi.fn();
```

## 📊 **커버리지 목표**

### **현재 목표**
- **Line Coverage**: 80% 이상
- **Function Coverage**: 90% 이상
- **Branch Coverage**: 75% 이상

### **우선순위 높은 파일들**
```
src/services/ai/intent/UnifiedIntentClassifier.ts    ✅ 100%
src/services/ai/MCPAIRouter.ts                       🎯 85%
src/modules/ai-agent/core/SmartModeDetector.ts       🎯 80%
src/hooks/useMCPAnalysis.ts                          🎯 75%
```

## 🚀 **실행 명령어**

### **기본 테스트 실행**
```bash
# 모든 테스트 실행
npm run test:unit

# 특정 파일 테스트
npm run test:unit -- tests/integration/mcp-analysis.test.ts

# Watch 모드
npm run test:watch

# UI 모드
npm run test:ui
```

### **커버리지 측정**
```bash
# 커버리지 리포트 생성
npm run test:coverage

# HTML 리포트 생성
npm run test:coverage -- --reporter=html
```

### **CI/CD 테스트**
```bash
# CI 환경용 (한 번 실행)
npm run test:unit -- --run

# 병렬 실행
npm run test:unit -- --run --threads
```

## 🎯 **테스트 품질 기준**

### **좋은 테스트의 조건**
1. **Fast**: 5초 이내 실행
2. **Independent**: 테스트 간 의존성 없음
3. **Repeatable**: 환경에 관계없이 동일한 결과
4. **Self-Validating**: 명확한 성공/실패 판단
5. **Timely**: 기능 구현과 동시에 작성

### **테스트 네이밍 규칙**
```typescript
// ✅ 좋은 테스트 이름
it('간단한 서버 상태 질문을 올바르게 분류한다')
it('Transformers.js 실패 시 Fallback을 사용한다')
it('복잡한 예측 분석은 Python 엔진이 필요하다')

// ❌ 나쁜 테스트 이름
it('should work')
it('test classification')
it('check result')
```

## 🔄 **지속적 개선**

### **테스트 메트릭 추적**
- **테스트 수행 시간 모니터링**
- **실패율 추적**
- **커버리지 변화 추적**

### **리팩토링 시 테스트 전략**
1. **리팩토링 전**: 기존 기능 테스트로 보호
2. **리팩토링 중**: 테스트 실행으로 회귀 검증
3. **리팩토링 후**: 새로운 구조에 맞게 테스트 업데이트

## 🎉 **결론**

Jules 분석을 바탕으로 수립된 테스트 전략으로:

- ✅ **AI 핵심 로직 보호**
- ✅ **통합 검증 체계 구축**
- ✅ **지속적 품질 보장**
- ✅ **안전한 리팩토링 환경**

이제 OpenManager Vibe v5는 신뢰할 수 있는 테스트 기반을 갖추었습니다. 