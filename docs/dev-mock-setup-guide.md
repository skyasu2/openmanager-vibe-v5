# 개발용 Mock 시스템 설정 가이드

> Windows + WSL + Claude Code 개발 환경을 위한 완전한 Mock 시스템

## 🎯 목적

실제 클라우드 서비스(Google AI, Supabase, GCP Functions)를 사용하지 않고 로컬에서 개발/테스트할 수 있는 Mock 시스템을 제공합니다.

- **비용 절감**: API 호출 비용 0원
- **오프라인 개발**: 인터넷 연결 없이도 개발 가능
- **빠른 응답**: 네트워크 지연 없음
- **Windows 호환**: WSL 환경에서 안정적으로 동작

## 🚀 Quick Start

### 1. 환경 변수 설정 (.env.local)

```bash
# Mock 시스템 강제 활성화 (선택사항)
FORCE_MOCK_GOOGLE_AI=true
FORCE_MOCK_SUPABASE=true
FORCE_MOCK_GCP_FUNCTIONS=true

# 개발 환경에서는 자동으로 Mock 사용됨
NODE_ENV=development
```

### 2. 개발 서버 실행

```bash
# WSL 터미널에서
npm run dev
```

### 3. Mock 상태 확인

브라우저 콘솔에서 다음 메시지 확인:
- `🎭 Mock Google AI 사용 중 (API 사용량 0)`
- `🎭 Mock Supabase 사용 중 (API 사용량 0)`
- `🎭 Mock GCP Functions 사용 중 (API 사용량 0)`

## 📦 Mock 시스템 구성

### 1. DevMockGoogleAI
- **위치**: `src/lib/ai/dev-mock-google-ai.ts`
- **기능**: Gemini API 시뮬레이션
- **특징**: 서버 모니터링 도메인 특화 응답

### 2. DevMockSupabase
- **위치**: `src/lib/supabase/dev-mock-supabase.ts`
- **기능**: Supabase 전체 기능 시뮬레이션
  - Database (CRUD)
  - Auth (로그인/로그아웃)
  - Storage (파일 업로드/다운로드)
  - Realtime (실시간 구독)
- **데이터**: 서버 모니터링 샘플 데이터 내장

### 3. DevMockGCPFunctions
- **위치**: `src/lib/gcp/dev-mock-gcp-functions.ts`
- **기능**: GCP Functions 시뮬레이션
  - Korean NLP 분석
  - ML Analytics (이상 감지, 트렌드 분석)
  - 통합 AI 처리

## 🔧 사용 방법

### Google AI 사용 예시

```typescript
import { getGoogleAIClient } from '@/lib/ai/google-ai-client';

const client = getGoogleAIClient(); // 자동으로 Mock/실제 선택
const model = client.getGenerativeModel({ model: 'gemini-pro' });

const result = await model.generateContent({
  contents: [{ role: 'user', parts: [{ text: '서버 상태 확인' }] }],
});
```

### Supabase 사용 예시

```typescript
import { supabase } from '@/lib/supabase/supabase-client';

// 자동으로 Mock/실제 선택
const { data, error } = await supabase
  .from('servers')
  .select('*')
  .eq('status', 'healthy');
```

### GCP Functions 사용 예시

```typescript
import { analyzeKoreanNLP, analyzeMLMetrics } from '@/lib/gcp/gcp-functions-client';

// Korean NLP
const nlpResult = await analyzeKoreanNLP('서버 CPU 사용률 확인', { 
  servers: [...] 
});

// ML Analytics
const mlResult = await analyzeMLMetrics([
  { timestamp: '2024-01-19T12:00:00', value: 75, server_id: 'web-001', metric_type: 'cpu' }
]);
```

## 📊 Mock 데이터 관리

### 기본 제공 데이터

```typescript
// 서버 데이터
const MOCK_SERVERS = [
  { id: 'srv-001', name: 'web-prd-01', type: 'web', status: 'healthy', cpu: 45 },
  { id: 'srv-002', name: 'api-prd-01', type: 'api', status: 'warning', cpu: 78 },
  { id: 'srv-003', name: 'db-prd-01', type: 'database', status: 'healthy', cpu: 35 }
];

// 사용자 데이터
const MOCK_USERS = [
  { id: 'user-001', email: 'admin@example.com', role: 'admin' },
  { id: 'user-002', email: 'developer@example.com', role: 'developer' }
];
```

### 커스텀 데이터 추가

```typescript
import { addSupabaseMockData } from '@/lib/supabase/supabase-client';
import { addMockScenario } from '@/lib/ai/google-ai-client';

// Supabase 데이터 추가
addSupabaseMockData('servers', [
  { id: 'custom-001', name: 'custom-server', status: 'healthy' }
]);

// Google AI 시나리오 추가
addMockScenario(
  'customAlert',
  ['긴급', '장애'],
  ['긴급 상황이 감지되었습니다. 즉시 확인이 필요합니다.'],
  0.95
);
```

## 🐛 디버깅

### Mock 통계 확인

```typescript
import { getMockStats } from '@/lib/ai/google-ai-client';
import { getSupabaseMockStats } from '@/lib/supabase/supabase-client';
import { getGCPFunctionsMockStats } from '@/lib/gcp/gcp-functions-client';

// 사용 통계 조회
console.log('Google AI Stats:', getMockStats());
console.log('Supabase Stats:', getSupabaseMockStats());
console.log('GCP Functions Stats:', getGCPFunctionsMockStats());
```

### Mock 초기화

```typescript
import { resetSupabaseMock } from '@/lib/supabase/supabase-client';
import { resetGCPFunctionsMock } from '@/lib/gcp/gcp-functions-client';

// 데이터 초기화
resetSupabaseMock();
resetGCPFunctionsMock();
```

## ⚙️ 고급 설정

### Mock 동작 커스터마이징

```typescript
// 지연 시간 설정
const mockSupabase = new DevMockSupabase({
  enableLogging: true,
  latency: 200, // 200ms 지연
  errorRate: 0.1, // 10% 에러율
});

// Google AI Mock 설정
const mockGoogleAI = new DevMockGoogleAI({
  enableLogging: true,
  responseDelay: 300,
  simulateQuota: true,
});
```

### 조건부 Mock 사용

```typescript
// 특정 조건에서만 Mock 사용
const useProductionAPI = process.env.USE_PRODUCTION_API === 'true';

if (!useProductionAPI) {
  process.env.FORCE_MOCK_GOOGLE_AI = 'true';
  process.env.FORCE_MOCK_SUPABASE = 'true';
  process.env.FORCE_MOCK_GCP_FUNCTIONS = 'true';
}
```

## 🔍 문제 해결

### 일반적인 문제

1. **Mock이 활성화되지 않음**
   - NODE_ENV가 'development' 또는 'test'인지 확인
   - 환경 변수가 제대로 로드되었는지 확인

2. **TypeScript 타입 오류**
   - Mock 인터페이스가 실제 라이브러리와 호환되는지 확인
   - 필요시 타입 정의 업데이트

3. **메모리 부족**
   - Mock 데이터가 너무 많은 경우 초기화
   - 불필요한 로그 비활성화

### WSL 특화 문제

1. **파일 시스템 권한**
   ```bash
   # WSL에서 권한 문제 해결
   chmod -R 755 node_modules
   ```

2. **포트 충돌**
   ```bash
   # 사용 중인 포트 확인
   netstat -tulpn | grep 3000
   ```

## 📋 체크리스트

개발 시작 전 확인사항:

- [ ] NODE_ENV=development 설정
- [ ] .env.local 파일 생성
- [ ] npm install 완료
- [ ] Mock 시스템 로그 확인
- [ ] 테스트 실행 (`npm test`)

## 🎬 고급 Mock 시나리오

### 서버 모니터링 시나리오

Mock 시스템은 실제 운영 환경에서 발생 가능한 복잡한 시나리오를 제공합니다:

1. **캐스케이딩 장애 (Cascading Failure)**
   - DB 서버 장애가 API, 웹 서버로 연쇄 전파
   - 실제 장애 복구 과정 시뮬레이션

2. **피크 부하 (Peak Load)**
   - 프로모션/이벤트로 인한 트래픽 급증
   - 오토스케일링 및 부하 분산 과정

3. **메모리 누수 (Memory Leak)**
   - 점진적인 메모리 증가로 인한 성능 저하
   - GC 오버헤드 및 서비스 재시작

4. **네트워크 분할 (Network Partition)**
   - 데이터센터 간 네트워크 장애
   - 서비스 간 통신 두절 및 복구

### 시나리오 사용법

```typescript
import { startMockScenario, getActiveScenarios } from '@/lib/ai/google-ai-client';

// 시나리오 시작
startMockScenario('cascading-failure');

// 랜덤 시나리오
startMockScenario('random');

// 활성 시나리오 확인
const scenarios = getActiveScenarios();
console.log('현재 실행 중:', scenarios);
```

### 시나리오 테스트 페이지

개발 환경에서 시나리오를 시각적으로 테스트:

```
http://localhost:3000/dev/mock-scenarios
```

### Korean NLP 엣지 케이스

Mock 시스템은 다양한 한국어 처리 케이스를 지원합니다:

- **기술 용어 혼용**: "CPU utilization이 90% 넘었는데..."
- **비즈니스 맥락**: "블랙프라이데이 때문에 주문 서버..."
- **축약어/은어**: "디비 커넥션 풀 확인 ㄱㄱ"
- **오타 처리**: "서버 사앹 확인햊주세요"

### ML Analytics 패턴

서버 타입별 실제 워크로드 패턴 제공:

- **웹 서버**: 일일 트래픽 패턴, 주말 효과
- **API 서버**: 마이크로서비스 통신 패턴
- **데이터베이스**: OLTP/OLAP 워크로드 차이
- **캐시 서버**: 메모리 사용 패턴, TTL 효과

## 🚀 다음 단계

1. **테스트 작성**: Mock을 활용한 단위 테스트
2. **시나리오 확장**: 도메인별 Mock 시나리오 추가
3. **성능 측정**: Mock vs 실제 API 성능 비교
4. **CI/CD 통합**: 테스트 환경에서 Mock 자동 사용

---

**참고**: 이 Mock 시스템은 개발/테스트 전용입니다. 프로덕션 배포 시에는 자동으로 실제 API를 사용합니다.