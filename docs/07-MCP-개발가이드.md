# 🧠 MCP 기반 통합 AI 엔진 개발 가이드

## 📋 개요

**OpenManager Vibe v5**의 핵심인 **MCP (Model Context Protocol) 기반 통합 AI 엔진** 개발 가이드입니다.

> **🎯 4단계 완성**: 지능형 도구 오케스트레이션, 컨텍스트 인식 처리, 하이브리드 AI 처리, 완벽한 복원력

---

## 🏗️ MCP 시스템 아키텍처

```
┌─────────────────────────────────────────────────────────────┐
│            🧠 MCP Orchestrator (Model Context Protocol)     │
├─────────────────────────────────────────────────────────────┤
│  🎯 Intelligent Tool Selection  │  ⚡ Hybrid Tool Execution   │
│  - Natural Language → Tools     │  - Parallel: stats, anomaly │
│  - Context-aware Selection      │  - Sequential: root cause   │
│  - Auto-optimization             │  - Adaptive Processing      │
├─────────────────────────────────────────────────────────────┤
│  📊 6 Specialized Tools          │  🧠 Context Manager        │
│  - statistical_analysis         │  - Short/Long-term Memory  │
│  - anomaly_detection            │  - Pattern Learning        │
│  - time_series_forecast         │  - Session Tracking        │
│  - pattern_recognition          │  - Trend Calculation       │
│  - root_cause_analysis          │  - Business Rules Engine   │
│  - optimization_advisor         │  - Auto Memory Cleanup     │
├─────────────────────────────────────────────────────────────┤
│  🐍 Python ML Bridge            │  💾 Advanced Caching       │
│  - Render Service Primary       │  - Hash-based Keys         │
│  - Local JS Fallback           │  - TTL Management (5min)   │
│  - Exponential Backoff         │  - Performance Tracking    │
│  - AbortController Timeout     │  - Hit Rate Optimization   │
└─────────────────────────────────────────────────────────────┘
```

---

## 🧠 핵심 컴포넌트

### 1. MCP 오케스트레이터 (`src/core/mcp/mcp-orchestrator.ts`)

#### 🎯 주요 기능
- **자연어 쿼리 분석**: 키워드 기반 도구 자동 선택
- **컨텍스트 인식 처리**: 업무시간, 시스템 부하, 이전 결과 반영
- **하이브리드 실행**: 병렬/순차 실행 전략 자동 선택
- **결과 통합**: 다중 도구 결과의 지능형 결합

#### 🔧 사용법
```typescript
import { MCPOrchestrator, MCPRequest } from '@/core/mcp/mcp-orchestrator';

const orchestrator = new MCPOrchestrator();

const request: MCPRequest = {
  query: "시스템 성능을 분석하고 최적화 방안을 제안해주세요",
  parameters: {
    metrics: serverMetrics,
    data: historicalData
  },
  context: {
    session_id: "user_session_123",
    urgency: "high"
  }
};

const result = await orchestrator.process(request);
console.log('분석 결과:', result);
```

### 2. 컨텍스트 관리자 (`src/core/context/context-manager.ts`)

#### 🧠 지능형 메모리 시스템
- **단기 메모리**: Map 기반, 1시간 TTL
- **장기 메모리**: 중요 패턴 영구 저장 (중요도 0.8+)
- **세션 컨텍스트**: 사용자별 쿼리/결과 히스토리

#### 📈 실시간 트렌드 계산
```typescript
import { ContextManager } from '@/core/context/context-manager';

const contextManager = new ContextManager();

// 메트릭 추가 및 트렌드 계산
await contextManager.addMetric('cpu_usage', cpuData);
const trend = await contextManager.calculateTrend('cpu_usage');

console.log('CPU 트렌드:', trend.direction, trend.confidence);
```

### 3. Python ML 브릿지 (`src/services/python-bridge/ml-bridge.ts`)

#### 🌐 하이브리드 처리
- **Primary**: Render Python 서비스 (고급 ML)
- **Fallback**: 로컬 JavaScript (기본 통계)
- **자동 전환**: 네트워크 상태 기반

#### 🔧 사용법
```typescript
import { PythonMLBridge } from '@/services/python-bridge/ml-bridge';

const bridge = new PythonMLBridge(process.env.AI_ENGINE_URL!);

// 고급 분석 (Python 우선, 실패시 로컬 폴백)
const result = await bridge.call('statistical_analysis', {
  data: timeSeriesData,
  detailed: true
});

console.log('분석 결과:', result);
console.log('브릿지 통계:', bridge.getMetrics());
```

---

## 🛠️ 개발 가이드

### 1. 새로운 MCP 도구 추가

```typescript
// src/core/mcp/tools/custom-tool.ts
export class CustomAnalysisTool implements MCPTool {
  name = 'custom_analysis';
  description = '사용자 정의 분석 도구';

  async execute(params: any, context: any): Promise<any> {
    // 도구 로직 구현
    return {
      analysis_type: 'custom',
      result: analysisResult,
      confidence: 0.85
    };
  }
}

// 오케스트레이터에 등록
orchestrator.registerTool(new CustomAnalysisTool());
```

### 2. 컨텍스트 규칙 추가

```typescript
// src/core/context/business-rules.ts
export class CustomBusinessRule implements BusinessRule {
  name = 'high_cpu_alert';
  condition = (context: any) => context.cpu_usage > 90;
  
  apply(context: any): any {
    return {
      priority: 'critical',
      recommended_tools: ['anomaly_detection', 'optimization_advisor'],
      alert_level: 'high'
    };
  }
}
```

### 3. 로컬 폴백 기능 확장

```typescript
// Python 브릿지에 새로운 로컬 분석 추가
private async localCustomAnalysis(params: any): Promise<any> {
  // JavaScript 기반 분석 구현
  const result = performLocalAnalysis(params.data);
  
  return {
    analysis_type: 'custom_local',
    result,
    fallback_used: true,
    confidence: 0.6
  };
}
```

---

## 📊 API 사용법

### 1. MCP 전용 엔드포인트 (`/api/ai/mcp`)

```bash
# POST 요청 - AI 분석
curl -X POST http://localhost:3000/api/ai/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "query": "CPU 사용률 급증 원인 분석",
    "parameters": {
      "metrics": {
        "cpu": [45, 67, 89, 95, 92],
        "memory": [60, 65, 70, 75, 80]
      }
    },
    "context": {
      "session_id": "analysis_session",
      "urgency": "high"
    }
  }'

# GET 요청 - 시스템 상태
curl http://localhost:3000/api/ai/mcp?action=health
```

### 2. V1 통합 엔드포인트 (`/api/v1/ai/query`)

```bash
# MCP 우선 실행, 실패시 UnifiedAIEngine 폴백
curl -X POST http://localhost:3000/api/v1/ai/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "서버 성능 예측 분석",
    "context": {
      "serverMetrics": [...],
      "timeRange": {...}
    }
  }'
```

---

## 🧪 테스트 개발

### 1. MCP 도구 테스트

```typescript
// tests/mcp/tool.test.ts
import { MCPOrchestrator } from '@/core/mcp/mcp-orchestrator';

describe('MCP Tool Tests', () => {
  let orchestrator: MCPOrchestrator;

  beforeEach(() => {
    orchestrator = new MCPOrchestrator();
  });

  test('통계 분석 도구 테스트', async () => {
    const result = await orchestrator.process({
      query: '데이터 통계 분석',
      parameters: { data: [1, 2, 3, 4, 5] },
      context: { session_id: 'test' }
    });

    expect(result.success).toBe(true);
    expect(result.tools_used).toContain('statistical_analysis');
  });
});
```

### 2. 통합 테스트

```bash
# MCP 테스트 실행
npm run test:mcp

# 특정 시나리오 테스트
curl -X POST http://localhost:3000/api/ai/mcp/test \
  -H "Content-Type: application/json" \
  -d '{"testType": "advanced"}'
```

---

## ⚡ 성능 최적화

### 1. 캐싱 전략

```typescript
// 중요도 기반 캐싱
if (result.confidence > 0.8) {
  contextManager.storePattern(patternData, 'permanent');
} else {
  contextManager.storePattern(patternData, 'temporary');
}
```

### 2. 병렬 처리 최적화

```typescript
// 병렬 실행 가능한 도구들
const parallelTools = ['statistical_analysis', 'anomaly_detection', 'pattern_recognition'];
const parallelResults = await Promise.all(
  parallelTools.map(tool => tool.execute(params, context))
);
```

### 3. 메모리 관리

```typescript
// 자동 메모리 정리
setInterval(() => {
  contextManager.cleanupExpiredData();
  bridge.clearCache();
}, 600000); // 10분마다
```

---

## 🔧 디버깅 및 모니터링

### 1. 로깅 설정

```typescript
// MCP 처리 과정 로깅
console.log('🧠 MCP 요청:', {
  query: request.query.substring(0, 50) + '...',
  toolsSelected: selectedTools.map(t => t.name),
  contextId: context.id
});
```

### 2. 성능 모니터링

```typescript
// 도구별 성능 추적
const toolMetrics = {
  execution_time: Date.now() - startTime,
  confidence: result.confidence,
  cache_hit: result.cached || false
};
```

### 3. 헬스체크

```bash
# 시스템 상태 확인
curl http://localhost:3000/api/ai/mcp?action=health

# 도구 목록 확인
curl http://localhost:3000/api/ai/mcp?action=tools
```

---

## 🚀 배포 가이드

### 1. 환경 변수 설정

```bash
# .env.local
AI_ENGINE_URL=https://your-python-service.onrender.com
MCP_CACHE_TTL=300000
MCP_MAX_PARALLEL_TOOLS=3
```

### 2. 프로덕션 최적화

```typescript
// 프로덕션 환경 설정
const mcpConfig = {
  enablePythonFallback: process.env.NODE_ENV === 'production',
  cacheStrategy: 'aggressive',
  timeoutMs: 30000
};
```

---

## 🎯 모범 사례

### 1. 쿼리 설계
- **구체적인 질문**: "CPU 사용률 분석" → "지난 1시간 CPU 급증 원인 분석"
- **컨텍스트 제공**: 시간 범위, 우선순위, 세션 정보 포함
- **기대 결과 명시**: 통계, 예측, 최적화 방안 등

### 2. 성능 최적화
- **적절한 TTL 설정**: 데이터 특성에 맞는 캐시 시간
- **점진적 분석**: 간단한 도구부터 복잡한 분석 순으로
- **결과 재사용**: 세션 내 유사한 쿼리 최적화

### 3. 오류 처리
- **Graceful Degradation**: Python 실패시 로컬 폴백
- **사용자 피드백**: 분석 신뢰도 및 제한사항 명시
- **재시도 로직**: 네트워크 오류에 대한 지수 백오프

---

## 📚 추가 자료

- **[MCP 완성 보고서](../MCP_COMPLETION_REPORT.md)** - 4단계 구현 상세 내용
- **[API 문서](./03-API-배포-가이드.md)** - REST API 상세 가이드  
- **[문제해결 가이드](./06-문제해결-가이드.md)** - 일반적인 문제 해결

---

*MCP 개발 가이드 - OpenManager Vibe v5 - 2025년 1월 28일* 