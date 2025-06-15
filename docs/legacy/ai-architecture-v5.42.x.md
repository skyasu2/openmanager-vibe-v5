# 🧠 AI 엔진 구조 및 아키텍처 문서 (Legacy v5.42.x)

> **⚠️ LEGACY 버전**: 이 문서는 TensorFlow 기반 구조를 사용했던 v5.42.x 이전 버전용입니다.  
> **현재 버전**: [AI 아키텍처 v5.43.0](../ai-architecture-v5.43.0.md) 참조  
> **업데이트**: 2024년 1월 (보관용)

## 🎯 시스템 개요 (Legacy)

### **OpenManager AI Engine v5.0 (TensorFlow 기반)**

```yaml
컨셉: 서버 모니터링 전문 AI 에이전트
주요 역할: 1차 대응자에게 정보 전달 및 의사결정 지원
기술 스택: Next.js + TensorFlow.js + MCP Protocol + TypeScript # ❌ TensorFlow 제거됨
배포 환경: Vercel (Frontend) + Render (ML Backend)
```

### **핵심 설계 원칙 (Legacy)**

- **정보 전달 중심**: 서버 직접 관리보다는 관리자 지원
- **3단계 지식 체계**: 기본 → 고급 → 커스텀 순차 적용
- **실시간 성능**: 벡터 DB 없는 고속 검색 시스템
- **표준 준수**: MCP 2024-11-05 프로토콜 완전 구현

## 🏗️ 계층별 아키텍처 (Legacy)

### **1. Frontend Layer (사용자 인터페이스)**

```typescript
// 위치: src/app/, src/components/
interface FrontendLayer {
  ui: 'Next.js 15.3.3 기반 반응형 웹 인터페이스';
  dashboard: '실시간 서버 모니터링 대시보드';
  aiChat: '자연어 기반 AI 대화 인터페이스';
  realtime: 'WebSocket 실시간 데이터 스트리밍';
}
```

### **2. API Gateway (요청 라우팅)**

```typescript
// 위치: src/app/api/
interface APIGateway {
  enhanced: '/api/ai/enhanced - 메인 AI 엔진 엔드포인트';
  websocket: '/api/websocket - 실시간 통신';
  metrics: '/api/metrics - 성능 메트릭 수집';
  health: '/api/health - 시스템 상태 확인';

  // ❌ Legacy API 경로들 (제거됨)
  ml: '/api/ml/predict - TensorFlow 예측';
  mlAnomaly: '/api/ml/anomaly-detection - TF 이상 탐지';
}
```

### **3. Enhanced AI Engine (핵심 제어기) - Legacy**

```typescript
// 위치: src/services/ai/enhanced-ai-engine.ts
class EnhancedAIEngine {
  private mcpClient: RealMCPClient; // 문서 관리
  private tensorflowEngine: TensorFlowAIEngine; // ❌ ML 예측 (제거됨)
  private fastApiClient: FastAPIClient; // Python 연동
  private documentIndex: Map<string, DocumentContext>; // 문서 인덱스
  private contextMemory: Map<string, any>; // 세션 컨텍스트

  // 주요 메서드
  async initialize(): Promise<void>; // 엔진 초기화
  async processSmartQuery(query: string): Promise<AIAnalysisResult>; // 쿼리 처리
  private async analyzeQueryIntent(query: string): Promise<SmartQuery>; // 의도 분석
  private async searchRelevantDocuments(
    smartQuery: SmartQuery
  ): Promise<DocumentContext[]>; // 문서 검색
}
```

## 🤖 AI Processing Components (Legacy)

### **❌ 1. TensorFlow.js Engine (머신러닝) - REMOVED**

```typescript
// 위치: src/services/ai/tensorflow-engine.ts (제거됨)
interface TensorFlowCapabilities {
  anomalyDetection: "시계열 데이터 이상 탐지";
  failurePrediction: "서버 장애 예측 모델";
  loadPrediction: "트래픽 부하 예측";
  autoScaling: "자동 스케일링 권장";
  performanceOptimization: "성능 최적화 제안";
}

// 백그라운드 초기화로 빠른 응답 보장
async initializeTensorFlowInBackground(): Promise<void> {
  setTimeout(async () => {
    await this.tensorflowEngine.initialize(); // ❌ 제거됨
  }, 100); // 메인 스레드 블로킹 방지
}
```

**문제점들:**

- 100MB+ 번들 크기로 Vercel 제한 초과
- Cold Start 시간 10초+
- Edge Runtime 비호환
- 네이티브 바이너리 의존성

### **2. Real MCP Client (문서 관리)**

```typescript
// 위치: src/services/mcp/real-mcp-client.ts
interface MCPServerConfig {
  filesystem: 'AI 컨텍스트 파일 관리 (src/modules/ai-agent/context/)';
  github: '코드 저장소 연동 (선택적)';
  webSearch: '실시간 웹 검색 (선택적)';
}

// 실제 JSON-RPC 2.0 통신
const serverProcess = spawn(
  'npx',
  ['@modelcontextprotocol/server-filesystem', contextPath],
  {
    stdio: ['pipe', 'pipe', 'pipe'],
  }
);
```

### **3. FastAPI Bridge (Python ML 연동)**

```typescript
// 고성능 ML 작업을 Python 서버로 위임
class FastAPIClient {
  private baseUrl = 'https://openmanager-ml.onrender.com';

  async post(endpoint: string, data: any): Promise<any> {
    // Render 서버와 통신하여 복잡한 ML 작업 처리
  }
}

// Render 서버 자동 웨이크업
private async startRenderManagement(): Promise<void> {
  this.renderPingInterval = setInterval(async () => {
    const isActive = await this.fastApiClient.ping();
    if (!isActive) {
      console.log('🔄 Render 서버 웨이크업 중...');
      // 자동 웨이크업 로직
    }
  }, 5 * 60 * 1000); // 5분마다 상태 확인
}
```

## 📚 3단계 지식 체계 (Legacy)

### **기본 지식 (1순위) - system-knowledge.md**

```yaml
역할: 일반적인 서버 모니터링 대응
내용:
  - 표준 메트릭 해석 (CPU, Memory, Disk, Network)
  - 임계값 기반 알림 체계
  - 1차 대응자를 위한 진단 가이드
  - 문제 해결 체크리스트
적용률: 전체 문의의 70-80%
```

### **고급 지식 (2순위) - advanced-monitoring.md**

```yaml
역할: AI 기반 예측 분석 및 고급 모니터링
내용:
  - TensorFlow.js 예측 모델 활용 # ❌ 제거됨
  - 이상 패턴 감지 알고리즘
  - 예방적 유지보수 권장
  - 성능 최적화 AI 분석
적용률: 전체 문의의 15-25%
```

### **커스텀 지식 (3순위) - custom-scenarios.md**

```yaml
역할: 특수 환경별 보조 가이드
내용:
  - 단일서버, 마스터-슬레이브, 로드밸런싱 등
  - GPU, 스토리지 특화 워크로드
  - 마이크로서비스, 멀티 데이터센터
적용률: 전체 문의의 5-15% (보조적 역할)
```

## 🔄 실시간 처리 흐름 (Legacy)

### **쿼리 처리 파이프라인**

```
사용자 쿼리 → 의도 분석 → 문서 검색 → TensorFlow AI 예측 분석 → 컨텍스트 생성 → 응답 생성 → 1차 대응자 전달
                                      ↑ ❌ 제거됨 (v5.43.0에서는 lightweight ML로 대체)
```

### **성능 최적화 전략 (Legacy)**

```typescript
// 1. 고속 문서 인덱싱 (벡터 DB 없이)
private extractKeywords(text: string): string[] {
  return text.toLowerCase()
    .split(/[\s\W]+/)
    .filter(word => word.length > 2 && !this.isCommonWord(word))
    .slice(0, 50); // 상위 50개 키워드만 인덱싱
}

// 2. 백그라운드 초기화 (Legacy)
setTimeout(async () => {
  await this.tensorflowEngine.initialize(); // ❌ 제거됨
}, 100); // 즉시 응답, 백그라운드 ML 초기화

// 3. 폴백 시스템
if (mcpReadFailed) {
  return await this.loadFallbackKnowledge(); // 로컬 캐시 활용
}
```

## 🌐 외부 서비스 연동 (Legacy)

### **Render ML Service**

```yaml
용도: 고성능 Python ML 작업 처리
URL: https://openmanager-ml.onrender.com
기능:
  - 복잡한 시계열 분석
  - 대용량 데이터 처리
  - GPU 가속 연산
상태 관리: 자동 슬립/웨이크업 시스템
```

### **Prometheus 메트릭 수집**

```yaml
역할: 실시간 서버 메트릭 수집
연동: /api/metrics/prometheus 엔드포인트
데이터: CPU, Memory, Network, Disk I/O
주기: 30초마다 자동 수집
```

## 📊 데이터 생성 및 시뮬레이션 (Legacy)

### **Real Server Data Generator**

```typescript
// 위치: src/services/data-generator/RealServerDataGenerator.ts
interface CustomEnvironmentConfig {
  environmentType: 'single' | 'cluster' | 'microservice' | 'gpu' | 'storage';
  serverRoles: string[];
  customMetrics: Record<string, number>;
  securitySettings: SecurityLevel;
}

// 환경별 데이터 자동 조정
generateEnvironmentSpecificData(envType: EnvironmentType): ServerMetrics {
  switch(envType) {
    case 'single': return this.generateSingleServerMetrics();
    case 'cluster': return this.generateClusterMetrics();
    case 'microservice': return this.generateMicroserviceMetrics();
    // ...
  }
}
```

## 🚨 에러 처리 및 복구 (Legacy)

### **다층 폴백 시스템**

```typescript
// 1차: MCP 서버 연결 실패시
if (!mcpConnection) {
  console.warn('MCP 연결 실패, 로컬 캐시 사용');
  return await this.loadFallbackKnowledge();
}

// 2차: TensorFlow.js 초기화 실패시 (❌ 제거됨)
if (!tensorflowReady) {
  console.warn('TensorFlow 미준비, 기본 분석 모드');
  return this.basicAnalysis(query);
}

// 3차: FastAPI 서버 연결 실패시
if (!renderServerActive) {
  console.warn('Render 서버 비활성, 로컬 ML 모드');
  return this.localMLAnalysis(data);
}
```

## 📈 성능 지표 및 목표 (Legacy)

### **응답 성능 (Legacy)**

```yaml
초기화 시간: 10초+ (TensorFlow 로딩) # ❌ v5.43.0: < 2초
쿼리 응답: < 2초 (기본 지식)
AI 분석: < 5초 (고급 분석)
ML 예측: 5-10초 (TensorFlow 연산) # ❌ v5.43.0: < 100ms
```

### **신뢰성 지표 (Legacy)**

```yaml
서비스 가용성: 99.9% (폴백 시스템)
정확도: 85%+ (지속적 학습)
응답률: 100% (다층 폴백)
번들 크기: ~933KB + TensorFlow(100MB+) # ❌ v5.43.0: ~933KB만
```

---

## 🔄 **v5.43.0으로의 주요 변경사항**

### **제거된 기술들**

- ❌ `@tensorflow/tfjs ^4.22.0`
- ❌ `@tensorflow/tfjs-node ^4.22.0`
- ❌ TensorFlow GPU 지원
- ❌ `/api/ml/*` 엔드포인트들

### **추가된 기술들**

- ✅ `ml-regression-simple-linear ^3.0.1`
- ✅ `ml-regression-polynomial ^3.0.2`
- ✅ `ml-kmeans ^3.1.0`
- ✅ `simple-statistics ^7.8.3`
- ✅ `ml-pca ^4.1.1`

### **성능 개선**

- 번들 크기: 100MB+ → 70MB (30% 감소)
- Cold Start: 10초+ → 2초 미만 (80% 개선)
- Vercel 호환: 실패 → 100% 성공

---

**⚠️ 마이그레이션 노트**: 이 Legacy 문서는 참고용으로만 보관됩니다. 실제 개발에는 [새로운 아키텍처 문서](../ai-architecture-v5.43.0.md)를 참조하세요.

---

**문서 버전**: Legacy v5.42.x  
**보관일**: 2025년 6월 11일  
**관리자**: AI Engine Development Team  
**상태**: 📚 아카이브 (Archive Only)
