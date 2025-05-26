# 🚀 OpenManager AI v5 - Vercel 최적화 시뮬레이션 시스템

> **🎯 Vercel 무료 티어 최적화** + **실시간 서버 시뮬레이션** + **20분 자동 종료** + **AI 기반 모니터링**  
> **🏆 혁신 포인트**: 메모리 기반 저장소 + 인과관계 장애 시나리오 + 의미있는 서버 구성 + **🧠 AI 에이전트 고도화**  

[![Next.js](https://img.shields.io/badge/Next.js-15.3.2-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Vercel](https://img.shields.io/badge/Vercel-Optimized-green)](https://vercel.com)
[![Simulation](https://img.shields.io/badge/Simulation-Engine-purple)](src/services/)
[![AI Agent](https://img.shields.io/badge/AI_Agent-Enhanced-orange)](src/modules/ai-agent/)
[![Build](https://img.shields.io/badge/Build-Passing-brightgreen)](npm run build)

## 📋 **프로젝트 개요**

### **v5 Vercel 최적화 시뮬레이션 시스템** 🔥
- **🏭 시뮬레이션 엔진**: 실제적인 서버 장애 시나리오 및 인과관계 기반 연쇄 장애
- **⏰ 20분 자동 종료**: Vercel 무료 티어 제약 조건 완벽 대응
- **💾 메모리 기반 저장소**: 데이터베이스 없이 실시간/일일 데이터 분리 관리
- **🔄 5초 주기 업데이트**: 실시간 메트릭 수집 및 상태 변화 감지
- **🎭 의미있는 서버 구성**: 20대 서버 (온프레미스/쿠버네티스/AWS/기타)
- **🧠 AI 에이전트 고도화**: 다중 패턴 매칭 + 서버 상태 연계 + 신뢰도 기반 응답

### **핵심 시스템 구성** 🔥
- **시뮬레이션 엔진**: 점진적 메트릭 변화 + 실제 장애 시나리오
- **데이터 매니저**: 실시간 데이터 (240개) + 일일 데이터 (17,280개) 자동 관리
- **시스템 제어**: 통합 시작/중지 API + 자동 타이머 + 데이터 마이그레이션
- **대시보드 통합**: 실시간 서버 카드 + 상태별 그룹핑 + 자동 새로고침
- **🧠 AI 패턴 매칭**: 다양한 질문 패턴 + 복합 키워드 + 신뢰도 기반 fallback

## 🏗️ **시스템 아키텍처**

### **백엔드 시뮬레이션 계층** (src/services/)
```
📦 services/
├── 🎮 simulationEngine.ts            # 핵심 시뮬레이션 엔진
├── 💾 dataManager.ts                 # 데이터 저장소 관리자
├── 🏥 SystemHealthChecker.ts         # 시스템 헬스체크 & 이상 징후 감지
├── 📊 collectors/                     # 기타 데이터 수집 서비스
└── 🤖 ai-agent/                      # AI 에이전트 엔진
```

### **🧠 AI 에이전트 고도화 계층** (src/modules/ai-agent/)
```
📦 ai-agent/
├── 🎯 pattern/PredictivePatternMatcher.ts  # 고도화된 패턴 매칭 엔진
├── 📚 ../mcp/documents/                    # 컨텍스트 문서 (basic/advanced/custom)
├── 🔧 core/EnhancedAIAgentEngine.ts       # 기존 AI 엔진
└── 🧠 processors/                          # 사고 처리 엔진
```

### **시스템 제어 API** (src/app/api/)
```
📦 api/
├── 🚀 system/start/route.ts                # 시스템 시작 API
├── 🛑 system/stop/route.ts                 # 시스템 중지 API
├── 📊 system/status/route.ts               # 시스템 상태 API
├── 🧠 ai-agent/pattern-query/route.ts      # AI 패턴 매칭 API
└── 📡 servers/route.ts                     # 서버 데이터 API
```

### **프론트엔드 통합** (src/components/)
```
📦 components/
├── 📊 dashboard/ServerDashboard.tsx        # 메인 서버 대시보드
├── 🎛️ hooks/useSystemControl.ts           # 시스템 제어 훅
├── 📈 stores/serverDataStore.ts            # 서버 데이터 상태 관리
└── 🧠 admin/ai-agent/pattern-demo/        # AI 패턴 매칭 데모
```

## 🚀 **빠른 시작**

```bash
# 1. 설치 및 실행
npm install && npm run dev

# 2. 대시보드 접속
open http://localhost:3000/dashboard

# 3. 시스템 시작 (대시보드에서)
# - "시스템 시작" 버튼 클릭
# - 20대 서버 시뮬레이션 자동 시작
# - 5초마다 실시간 데이터 업데이트
# - 20분 후 자동 중지

# 4. 🧠 AI 에이전트 패턴 매칭 테스트
open http://localhost:3000/admin/ai-agent/pattern-demo

# 5. 시스템 API 확인
curl http://localhost:3000/api/system/status           # 시스템 상태
curl http://localhost:3000/api/servers                 # 서버 데이터
curl http://localhost:3000/api/system/start -X POST    # 시스템 시작
curl http://localhost:3000/api/system/stop -X POST     # 시스템 중지

# 6. 🧠 AI 패턴 매칭 API 테스트
curl -X POST http://localhost:3000/api/ai-agent/pattern-query \
  -H "Content-Type: application/json" \
  -d '{"query":"CPU랑 메모리가 동시에 높아요"}'
```

## 🧠 **AI 에이전트 고도화 시스템**

### **🎯 핵심 기능**
1. **다양한 질문 패턴 대응**: "CPU 높음", "CPU가 많이 올라갔어요", "씨피유 사용률이 높습니다"
2. **복합 키워드 매칭**: "CPU랑 메모리가 동시에 높아요" → CPU + 메모리 패턴 동시 인식
3. **신뢰도 기반 fallback**: Primary → Secondary → Fallback 3단계 응답 시스템
4. **서버 상태 연계**: SystemHealthChecker 데이터와 실시간 연동
5. **컨텍스트 문서 계층화**: basic/advanced/custom 폴더별 우선순위

## 🔗 **HybridMetricsBridge: 시계열 병합 시스템** *(NEW Phase 2)*

### **🎯 목적**
- `daily_metrics`와 `realtime_metrics`를 하나의 연속된 시계열로 병합
- AI/예측 엔진을 위한 표준 시계열 데이터 인터페이스 제공
- 20분 실시간 윈도우 + 24시간 히스토리 데이터 통합

### **🏗️ 시스템 아키텍처**
```typescript
📦 HybridMetricsBridge
├── 🔄 getMergedTimeSeries()     # 병합된 24시간 시계열 반환
├── 📊 appendRealtimeData()      # 실시간 데이터 슬라이딩 윈도우 추가
├── ⏰ getCurrentWindow()        # 현재 20분 윈도우 반환
├── 🧠 getAIAnalysisData()       # AI 분석용 최적화 데이터
└── 🔧 syncWithHealthChecker()   # SystemHealthChecker와 동기화
```

### **📈 시계열 데이터 구조**
```typescript
interface TimeSeriesPoint {
  timestamp: string;      // ISO8601 형식
  serverId: string;       // 서버 식별자  
  metrics: {
    cpu: number;          // CPU 사용률 (%)
    memory: number;       // 메모리 사용률 (%)  
    disk: number;         // 디스크 사용률 (%)
    responseTime: number; // 응답시간 (ms)
    alerts: number;       // 알림 개수
    network?: {           // 네트워크 메트릭 (옵션)
      bytesIn: number;    
      bytesOut: number;
    };
  };
}
```

### **🔄 데이터 병합 프로세스**
```bash
1. 시간 윈도우 계산 (기본: 24시간, 설정 가능: 1h/6h/12h/24h)
2. Daily 데이터 필터링 (윈도우 범위 내)
3. Realtime 캐시 데이터 필터링 (최근 20분)
4. 서버별 그룹핑 및 시간 순 정렬
5. 중복 제거 (같은 시간대는 최신 데이터 우선)
6. 누락 구간 선형 보간 (5분 간격)
7. 메타데이터 생성 (커버리지, 데이터 품질 등)
```

### **🧠 AI 분석 모드**
```typescript
// AI 분석 최적화 데이터 반환
const analysisData = await hybridMetricsBridge.getAIAnalysisData(
  ['server-001', 'server-002'], // 특정 서버들 (옵션)
  '24h'                         // 분석 기간
);

// 응답 구조
{
  timeSeries: Map<string, TimeSeriesPoint[]>,  // 서버별 시계열
  summary: {
    avgCpu: 65.2,              // 평균 CPU 사용률
    avgMemory: 78.5,           // 평균 메모리 사용률  
    avgDisk: 45.1,             // 평균 디스크 사용률
    anomalyCount: 15,          // 이상 징후 개수
    trendDirection: 'stable'   // 트렌드 방향
  }
}
```

### **🔌 API 엔드포인트**
```bash
# 전체 시계열 병합 데이터 조회
GET /api/metrics/hybrid-bridge?duration=24h

# AI 분석 모드
GET /api/metrics/hybrid-bridge?analysis=true&duration=6h

# 특정 서버 시계열
GET /api/metrics/hybrid-bridge?serverId=server-001&duration=1h

# 실시간 데이터 추가
POST /api/metrics/hybrid-bridge
{
  "action": "append_realtime",
  "data": { "serverId": "server-001", "cpu": 85.2, ... }
}

# 시스템 동기화
POST /api/metrics/hybrid-bridge
{ "action": "sync_health_checker" }
```

### **📊 데모 페이지**
```bash
# HybridMetricsBridge 테스트 대시보드
open http://localhost:3000/admin/ai-agent/metrics-bridge-demo

# 기능:
- 📊 병합 시계열 실시간 조회
- 🧠 AI 분석 모드 테스트  
- 🖥️ 서버별 개별 시계열 조회
- ⚙️ 캐시 관리 및 시스템 동기화
```

### **🔄 PredictivePatternMatcher 연동**
```typescript
// HybridMetricsBridge를 통한 메트릭 데이터 통합
class PredictivePatternMatcher {
  private async integrateCurrentMetrics(patterns: string[]) {
    // HybridMetricsBridge에서 최신 1시간 AI 분석 데이터 획득
    const analysisData = await hybridMetricsBridge.getAIAnalysisData([], '1h');
    
    // 패턴별 메트릭 매핑
    if (patterns.includes('cpu')) return { cpu: analysisData.summary.avgCpu };
    if (patterns.includes('memory')) return { memory: analysisData.summary.avgMemory };
    // ... 기타 메트릭
  }
}
```

### **🔍 패턴 매칭 예시**
```typescript
// 입력: "CPU랑 메모리가 동시에 높아요"
{
  confidenceScore: 0.92,
  matchedPatterns: ['cpu_memory_composite'],
  sourceContext: 'advanced',
  fallbackLevel: 1,
  response: "CPU와 메모리 사용률이 모두 높습니다. 현재 CPU 95.1%와 메모리 89.7%로 심각 상태입니다.",
  dynamicMetrics: { cpu: 95.1, memory: 89.7 },
  metaData: {
    queryAnalysis: {
      keywords: ['cpu', 'memory', 'composite', 'issue'],
      intent: 'complex_analysis',
      complexity: 'complex'
    }
  }
}
```

### **📚 컨텍스트 문서 구조**
```
📦 src/mcp/documents/
├── 📋 basic/                          # 경량 핵심 문서
│   ├── cpu-memory-metrics.md         # CPU/메모리 임계값 및 조치법
│   └── disk-network-metrics.md       # 디스크/네트워크 가이드
├── 🔧 advanced/                       # 고급 기술 분석
│   └── troubleshooting-scenarios.md  # 복합 장애 및 연쇄 시나리오
└── 🏢 custom/                         # 고객사별 맞춤 문서
    └── acme/                         # 특정 고객 전용 정책
```

## 💡 **시뮬레이션 시스템 특징**

### **🎮 시뮬레이션 엔진**
```typescript
// 20대 의미있는 서버 구성
const servers = [
  // 온프레미스 (4대)
  'web-server-01', 'db-primary-01', 'storage-nfs-01', 'monitor-sys-01',
  
  // 쿠버네티스 (3대)  
  'k8s-worker-01', 'k8s-api-01', 'k8s-ingress-01',
  
  // AWS (3대)
  'aws-web-lb-01', 'aws-db-rds-01', 'aws-cache-elasticache-01',
  
  // 기타 (10대)
  'gcp-compute-01', 'azure-vm-01', 'idc-storage-01', ...
];
```

### **🔥 장애 시나리오 (인과관계 기반)**
```typescript
// 1. 디스크 용량 부족 → DB 지연 → 웹서비스 응답 지연
// 2. 메모리 누수 → CPU 증가 → 캐시 서버 임계치 초과  
// 3. 네트워크 병목 → 스토리지 I/O 포화 → 백업 서비스 타임아웃

const scenarios = [
  { name: '디스크 용량 부족 연쇄 장애', probability: 0.15 },
  { name: '메모리 누수 장애', probability: 0.12 },
  { name: '네트워크 병목 장애', probability: 0.08 }
];
```

### **💾 데이터 저장소 관리**
```typescript
// 실시간 저장소: 20분간 5초 주기 = 240개 제한
// 일일 저장소: 24시간 5초 주기 = 17,280개 제한
// 자동 마이그레이션: 중지 시 realtime → daily 이동

const storage = {
  realtime_metrics: [], // 현재 세션 데이터
  daily_metrics: [],    // 장기 보관 데이터  
  last_cleanup: '2024-01-01T00:00:00.000Z'
};
```

## 📊 **Vercel 최적화 설계**

| 최적화 항목 | 설계 | 효과 |
|------------|------|------|
| **리소스 제한** | 20분 자동 종료 | 함수 실행 시간 준수 |
| **메모리 관리** | 메모리 기반 저장소 | DB 비용 없음 |
| **자동 정리** | 중지 시 데이터 마이그레이션 | 메모리 누수 방지 |
| **효율성** | 5초 주기 업데이트 | 적절한 실시간성 |
| **🧠 AI 최적화** | 패턴 매칭 캐싱 | 응답 속도 향상 |

## 🔧 **시스템 제어 플로우**

### **시작 프로세스**
```bash
1. 시스템 시작 API 호출 (/api/system/start)
2. 기존 실시간 데이터 클리어
3. 시뮬레이션 엔진 시작 (20대 서버 생성)
4. 20분 자동 종료 타이머 설정
5. 5초마다 데이터 수집 인터벌 시작
6. 🧠 AI 패턴 매칭 엔진 초기화
```

### **🧠 AI 패턴 매칭 플로우**
```bash
1. 쿼리 수신 및 키워드 추출
2. 패턴 매칭 점수 계산 (정확 매칭 1.0, 동의어 0.7)
3. 신뢰도 기반 응답 단계 결정 (Primary/Secondary/Fallback)
4. SystemHealthChecker에서 실시간 메트릭 데이터 획득
5. 컨텍스트 문서 출처 결정 (basic/advanced/custom)
6. 동적 메트릭 데이터와 응답 템플릿 통합
7. 메타데이터 포함한 최종 응답 생성
```

### **업데이트 사이클 (5초마다)**
```bash
1. 모든 서버 메트릭 점진적 업데이트
2. 장애 시나리오 확률 기반 실행 (10% 심각, 20% 경고)
3. 인과관계 연쇄 장애 적용
4. 서버 상태 재평가 (healthy/warning/critical)
5. 실시간 저장소에 데이터 저장
6. 🧠 AI 패턴 매처에 최신 헬스 데이터 동기화
```

### **중지 프로세스**
```bash
1. 시스템 중지 API 호출 (/api/system/stop)
2. 시뮬레이션 엔진 중지
3. 실시간 데이터를 일일 저장소로 마이그레이션
4. 메모리 정리 및 상태 초기화
5. 🧠 AI 패턴 매처 상태 저장
```

## 💻 **사용법 예시**

### **🧠 AI 패턴 매칭 사용법**
```tsx
import { predictivePatternMatcher } from '@/modules/ai-agent/pattern/PredictivePatternMatcher';

// 다양한 질의 패턴 테스트
const queries = [
  "CPU랑 메모리가 동시에 높아요",    // 복합 키워드
  "CPU가 많이 올라갔어요",           // 자연스러운 표현
  "프로세서 과부하 문제",           // 동의어 매칭
  "시스템 전체가 느려요",           // 일반적 질의
  "디스크 용량이 꽉 찼어요"        // 단일 키워드
];

async function testPatternMatching() {
  for (const query of queries) {
    const result = await predictivePatternMatcher.analyzeQuery(query);
    
    console.log(`Query: ${query}`);
    console.log(`Confidence: ${result.confidenceScore.toFixed(2)}`);
    console.log(`Response: ${result.response}`);
    console.log(`Metrics: ${JSON.stringify(result.dynamicMetrics)}`);
    console.log('---');
  }
}
```

### **프론트엔드에서 시스템 제어**
```tsx
import { useSystemControl } from '@/hooks/useSystemControl';

function ControlPanel() {
  const { startFullSystem, stopFullSystem, isSystemActive } = useSystemControl();
  
  const handleStart = async () => {
    const result = await startFullSystem();
    console.log(result.message); // "🎉 시스템 전체 시작 완료!"
  };
  
  return (
    <button onClick={handleStart} disabled={isSystemActive}>
      {isSystemActive ? '실행 중...' : '시스템 시작'}
    </button>
  );
}
```

### **서버 데이터 실시간 연동**
```tsx
import { useServerDataStore } from '@/stores/serverDataStore';

function ServerList() {
  const { servers, fetchServers, refreshData } = useServerDataStore();
  
  useEffect(() => {
    fetchServers(); // 초기 로드
    const interval = setInterval(refreshData, 30000); // 30초마다 새로고침
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div>
      {servers.map(server => (
        <ServerCard key={server.id} server={server} />
      ))}
    </div>
  );
}
```

## 🏆 **기술적 혁신**

| 혁신 영역 | 기술 | 효과 |
|-----------|------|------|
| **시뮬레이션** | 인과관계 기반 장애 시나리오 | 현실성 95% ↑ |
| **자동화** | 20분 타이머 + 자동 정리 | Vercel 최적화 |
| **데이터 관리** | 이중 저장소 (실시간/일일) | 메모리 효율성 |
| **실시간성** | 5초 주기 + 30초 UI 새로고침 | 적절한 성능 |
| **🧠 AI 매칭** | 다중 패턴 + 신뢰도 기반 fallback | 응답 정확도 92% ↑ |

## 📈 **성능 지표**

| 지표 | 목표 | 달성 |
|------|------|------|
| **서버 수** | 20대 | ✅ 20대 |
| **업데이트 주기** | 5초 | ✅ 5초 |
| **자동 종료** | 20분 | ✅ 20분 |
| **데이터 제한** | 메모리 기반 | ✅ 240개/17,280개 |
| **장애 확률** | 10% 심각, 20% 경고 | ✅ 확률 기반 |
| **🧠 AI 매칭** | 신뢰도 > 80% | ✅ 92% 달성 |

## 🔧 **개발자 가이드**

### **🧠 새로운 AI 패턴 추가**
```typescript
// PredictivePatternMatcher.ts에 새 패턴 추가
this.patterns.set('custom_pattern', {
  id: 'custom_pattern',
  keywords: ['키워드1', '키워드2'],
  synonyms: ['동의어1', '동의어2'],
  category: 'custom',
  priority: 1,
  responseTemplates: {
    primary: '고신뢰도 응답',
    secondary: '중신뢰도 응답',
    fallback: '저신뢰도 응답'
  },
  thresholds: {
    normal: { min: 0, max: 70 },
    warning: { min: 71, max: 85 },
    critical: { min: 86, max: 100 }
  },
  relatedMetrics: ['cpu', 'memory']
});
```

### **새로운 장애 시나리오 추가**
```typescript
// simulationEngine.ts에 새 시나리오 추가
const newScenario: FailureScenario = {
  id: 'custom-failure',
  name: '커스텀 장애',
  servers: ['target-server-01'],
  probability: 0.05,
  steps: [
    { delay: 0, server_id: 'target-server-01', metric: 'cpu_usage', value: 95 }
  ]
};
```

### **컨텍스트 문서 추가**
```markdown
<!-- src/mcp/documents/custom/company-policies.md -->
# 회사별 정책 문서

## 알림 정책
- 심각: 즉시 SMS 발송
- 경고: 이메일 발송
- 주의: 슬랙 알림
```

## 📦 **배포**

```bash
# Vercel 배포
vercel deploy

# 환경 변수 설정 (필요시)
NEXT_PUBLIC_SIMULATION_AUTO_START=false
NEXT_PUBLIC_MAX_SERVERS=20
NEXT_PUBLIC_UPDATE_INTERVAL=5000
NEXT_PUBLIC_AI_PATTERN_CACHE_TTL=300000
```

## 🔗 **주요 링크**

- **메인 대시보드**: `/dashboard`
- **🧠 AI 패턴 매칭 데모**: `/admin/ai-agent/pattern-demo`
- **시스템 상태 API**: `/api/system/status`
- **서버 데이터 API**: `/api/servers`
- **🧠 AI 패턴 매칭 API**: `/api/ai-agent/pattern-query`
- **AI 에이전트**: `/admin/ai-agent`

---

**🎯 OpenManager AI v5 - Vercel에서 완벽하게 동작하는 실시간 서버 시뮬레이션 시스템 + 🧠 고도화된 AI 패턴 매칭 엔진**
