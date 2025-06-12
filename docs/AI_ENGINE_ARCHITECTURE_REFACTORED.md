# 🏗️ **OpenManager Vibe v5 AI 엔진 아키텍처 정리**

## 🎯 **AI 엔진 역할 명확화**

### 1. **MasterAIEngine** (마스터 통합 엔진)

**역할**: 모든 AI 엔진의 최상위 통합 인터페이스
**사용 위치**:

- `/api/version/status/route.ts`
- `/api/ai/correlation/route.ts`
- `/api/ai/mcp/route.ts`

**핵심 기능**:

- 6개 오픈소스 엔진 + 5개 커스텀 엔진 통합
- 엔진별 라우팅 및 폴백 로직
- 성능 최적화 및 지연 로딩
- 사고과정 로그 시스템

**유지 결정**: ✅ **유지** (API 엔드포인트에서 활발히 사용)

### 2. **UnifiedAIEngine** (통합 분석 엔진)

**역할**: MCP + Google AI + RAG 통합 분석
**사용 위치**:

- `/api/v1/ai/monitor/route.ts`
- `/api/ai/unified/route.ts`
- `SmartFallbackEngine.ts`

**핵심 기능**:

- MCP (Model Context Protocol) 통합
- Google AI 베타 연동
- RAG (Retrieval-Augmented Generation) 엔진
- Graceful Degradation Architecture

**유지 결정**: ✅ **유지** (핵심 분석 기능)

### 3. **AIAgentEngine** (AI 에이전트 전용)

**역할**: 독립적인 AI 에이전트 처리
**사용 위치**:

- `modules/ai-agent/index.ts`
- `tests/unit/edge-runtime.test.ts`

**핵심 기능**:

- 지능형 경량 AI 추론
- MCP 기반 의도 분류
- 실시간 사고 과정 로깅

**유지 결정**: ⚠️ **조건부 유지** (사용도 낮음, 통합 검토 필요)

### 4. **HybridAIEngine** (하이브리드 처리)

**역할**: 하이브리드 AI 처리
**사용 위치**:

- `tests/integration/hybrid-tensorflow.test.ts`

**핵심 기능**:

- 하이브리드 AI 처리

**유지 결정**: ❌ **통합 검토** (테스트에서만 사용)

## 🔄 **리팩토링 계획**

### Phase 1: 역할 명확화 (완료)

- [x] 각 엔진의 역할 정의
- [x] 사용 위치 파악
- [x] 중복 기능 식별

### Phase 2: 통합 및 최적화 (진행 중)

- [ ] AIAgentEngine과 다른 엔진들의 통합 검토
- [ ] HybridAIEngine의 필요성 재검토
- [ ] 중복 기능 제거

### Phase 3: 성능 최적화 (예정)

- [ ] 엔진 간 통신 최적화
- [ ] 메모리 사용량 최적화
- [ ] 응답 시간 개선

## 📊 **최적화 목표**

| 항목        | 현재  | 목표  | 상태      |
| ----------- | ----- | ----- | --------- |
| AI 엔진 수  | 4개   | 3개   | 🔄 진행중 |
| 중복 함수   | 15개+ | 0개   | 🔄 진행중 |
| 타입 안전성 | 85%   | 100%  | 🔄 진행중 |
| 응답 시간   | 200ms | 100ms | ⏳ 예정   |

## 🎯 **경연 최적화 포인트**

1. **시연 효과**: MasterAIEngine의 통합 기능 어필
2. **코드 품질**: 명확한 역할 분담과 깔끔한 아키텍처
3. **성능**: 빠른 응답 시간과 효율적인 리소스 사용
4. **확장성**: 모듈화된 설계로 확장 가능성 어필
