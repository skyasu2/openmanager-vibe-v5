# 🎭 OpenManager VIBE v5 - Mock 시스템 개발 가이드

최종 업데이트: 2025-08-02

## 📌 개요

OpenManager VIBE v5는 **하이브리드 Mock 시스템**을 통해 개발 효율성과 비용 절감을 동시에 달성합니다.

### 핵심 특징
- **무료 티어 최적화**: API 사용량 80% 절감
- **하이브리드 전략**: 상황별 Mock/Real 자동 선택
- **개발자 친화적**: 오프라인 개발 가능
- **성능 최적화**: Mock 응답 시간 10ms vs Real 100-500ms
- **Windows/WSL 호환**: WSL 환경에서 안정적으로 동작

## 🚀 빠른 시작

### 1. Mock 모드로 개발 시작
```bash
# 모든 서비스를 Mock으로 강제
npm run dev:mock

# 실제 서비스 강제 사용
npm run dev:real

# 하이브리드 모드 (권장)
npm run dev:hybrid
```

### 2. 상태 확인
```bash
# Mock 시스템 상태 확인
npm run mock:status

# Mock 사용 통계
npm run mock:stats

# 무료 티어 사용량 확인
npm run check:usage
```

### 3. 브라우저 콘솔 확인

개발 중 다음 메시지들을 확인할 수 있습니다:
- `🎭 Mock Google AI 사용 중 (API 사용량 0)`
- `🎭 Mock Supabase 사용 중 (API 사용량 0)`
- `🧠 통합 Mock Memory Cache 활성화`
- `🎭 Mock GCP Functions 사용 중`

## 🔧 환경 설정

### .env.local 설정
```env
# === Mock 시스템 설정 ===
MOCK_MODE=dev                     # off | dev | test | force
# - off: 실제 서비스만 사용
# - dev: 개발 환경에서 자동 선택 (기본값)
# - test: 테스트 환경에서만 Mock 사용
# - force: 항상 Mock 사용

# Mock 옵션
MOCK_RESPONSE_DELAY=0             # Mock 응답 지연 시간 (ms)
MOCK_ENABLE_PERSISTENCE=true      # Mock 데이터 영속성
MOCK_ENABLE_LOGGING=false         # Mock 로깅 활성화
MOCK_STATS_ENABLED=true           # Mock 사용 통계 수집

# 무료 티어 사용량 추적
TRACK_FREE_TIER_USAGE=true        # 무료 티어 사용량 추적
WARN_AT_USAGE_PERCENT=80          # 사용량 경고 임계값 (%)
```

## 📊 하이브리드 전략

### 자동 Mock 사용 조건
```javascript
// Mock 사용 (대량 작업)
- 빌드/CI/테스트
- 대량 데이터 처리
- 서버 시뮬레이션
- AI 트레이닝
- 벡터 처리

// Real 사용 (가벼운 작업)
- Keep-alive
- 간단한 캐싱
- 사용자 세션
- API 응답 캐시
- 시스템 상태 체크
```

### 임계값 설정
- **분당 요청**: 50회 초과 시 Mock 전환
- **데이터 크기**: 100KB 초과 시 Mock 사용
- **동시 작업**: 10개 초과 시 Mock 전환

## 🎯 서비스별 Mock 구현

### 1. Google AI Mock
```typescript
// src/lib/ai/dev-mock-google-ai.ts
- 모든 Gemini 모델 응답 시뮬레이션
- 스트리밍 응답 지원
- 에러 시나리오 테스트
- 응답 시간: 10-50ms
```

### 2. Supabase Mock
```typescript
// src/lib/supabase/dev-mock-supabase.ts
- 전체 CRUD 작업 지원
- 인증 플로우 시뮬레이션
- 실시간 구독 모의
- 로컬 JSON 파일 영속성
```

### 3. Memory Cache Mock (통합)
```typescript
// src/lib/memory cache/dev-mock-memory cache.ts
- 모든 기본 Memory Cache 명령어
- Set 연산 지원
- 파이프라인 처리
- TTL 자동 만료
- 개발 환경에서 영속성 지원
```

### 4. GCP Functions Mock
```typescript
// src/lib/gcp/dev-mock-gcp-functions.ts
- 한국어 NLP 처리
- ML 분석 엔진
- 통합 AI 프로세서
- 로컬 실행 가능
```

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

## 📈 개발 워크플로우

### 1. 일일 개발 (Mock 우선)
```bash
# 아침: Mock으로 빠른 개발
npm run dev:mock

# 점심: 하이브리드로 일부 실제 테스트
npm run dev:hybrid

# 저녁: 실제 서비스로 최종 확인
npm run dev:real
```

### 2. 기능 개발 사이클
```bash
# 1. Mock으로 초기 개발
FORCE_MOCK_ALL=true npm run dev

# 2. 단위 테스트 (Mock 자동 사용)
npm test

# 3. 통합 테스트 (하이브리드)
MOCK_MODE=hybrid npm run test:integration

# 4. E2E 테스트 (실제 서비스)
USE_REAL_SERVICES=true npm run test:e2e
```

## 🔍 Mock 데이터 관리

### 데이터 위치
```
.memory cache-mock-data/         # Memory Cache Mock 데이터
.supabase-mock-data/      # Supabase Mock 데이터
.mock-stats-*.json        # 서비스별 통계
```

### 데이터 초기화
```bash
# Mock 데이터 전체 초기화
rm -rf .memory cache-mock-data .supabase-mock-data .mock-stats-*

# 특정 서비스만 초기화
rm -rf .memory cache-mock-data
```

## 💰 비용 절감 분석

### Mock 사용 효과
- **API 호출 절감**: 월 150,000+ 요청
- **예상 절약 비용**: 월 $2-5
- **개발 속도 향상**: 3-5배
- **오프라인 개발**: 100% 가능

### 무료 티어 사용률 (Mock 사용 시)
```
Google AI:     15% → 3%
Supabase:      20% → 5%
Upstash Memory Cache: 25% → 8%
Vercel:        30% → 30% (변화 없음)
GCP Functions: 10% → 2%
```

## 📊 Mock 데이터 관리

### 기본 제공 데이터

```typescript
// 서버 데이터
const MOCK_SERVERS = [
  {
    id: 'srv-001',
    name: 'web-prd-01',
    type: 'web',
    status: 'healthy',
    cpu: 45,
  },
  {
    id: 'srv-002',
    name: 'api-prd-01',
    type: 'api',
    status: 'warning',
    cpu: 78,
  },
  {
    id: 'srv-003',
    name: 'db-prd-01',
    type: 'database',
    status: 'healthy',
    cpu: 35,
  },
];

// 사용자 데이터
const MOCK_USERS = [
  { id: 'user-001', email: 'admin@example.com', role: 'admin' },
  { id: 'user-002', email: 'developer@example.com', role: 'developer' },
];
```

### 커스텀 데이터 추가

```typescript
import { addSupabaseMockData } from '@/lib/supabase/supabase-client';
import { addMockScenario } from '@/lib/ai/google-ai-client';

// Supabase 데이터 추가
addSupabaseMockData('servers', [
  { id: 'custom-001', name: 'custom-server', status: 'healthy' },
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

## 🚨 주의사항

### 1. Mock과 Real의 차이점
- Mock은 실제 데이터베이스 제약 조건을 검증하지 않음
- Mock은 네트워크 지연이 없어 타이밍 이슈 감지 어려움
- Mock은 실제 인증/권한을 완전히 시뮬레이션하지 않음

### 2. 프로덕션 배포 전 체크리스트
- [ ] `USE_REAL_SERVICES=true`로 전체 테스트 실행
- [ ] 실제 API 응답 시간 확인
- [ ] 에러 처리 로직 검증
- [ ] 무료 티어 사용량 확인

### 3. Mock 데이터 보안
- `.gitignore`에 Mock 데이터 디렉토리 포함 확인
- 민감한 정보는 Mock 데이터에 저장하지 않기
- 정기적으로 Mock 데이터 정리

## 🛠️ 문제 해결

### Mock이 작동하지 않을 때
```bash
# 1. 환경 변수 확인
npm run mock:status

# 2. Mock 파일 존재 확인
ls -la src/lib/*/dev-mock-*.ts

# 3. 강제 Mock 활성화
FORCE_MOCK_ALL=true npm run dev
```

### 실제 서비스 연결 문제
```bash
# 1. 환경 변수 확인
grep -E "(SUPABASE|MEMORY_CACHE|GOOGLE)" .env.local

# 2. 강제 실제 서비스 사용
USE_REAL_SERVICES=true npm run dev

# 3. 개별 서비스 디버깅
FORCE_MOCK_SUPABASE=false npm run dev
```

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

3. **메모리 부족**
   ```bash
   # WSL 메모리 할당 증가 (.wslconfig)
   [wsl2]
   memory=8GB
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
import {
  startMockScenario,
  getActiveScenarios,
} from '@/lib/ai/google-ai-client';

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

## 📚 추가 리소스

### 관련 문서
- [Mock 시스템 아키텍처](./architecture/mock-system.md)
- [무료 티어 최적화 가이드](./free-tier-optimization.md)
- [하이브리드 전략 상세](./hybrid-strategy-details.md)
- [Tavily MCP 트러블슈팅](./tavily-mcp-troubleshooting.md)
- [서브 에이전트 MCP 매핑 가이드](./sub-agents-mcp-mapping-guide.md)

### 유용한 도구
- **Mock 대시보드**: `http://localhost:3000/dev/mock-dashboard` (개발 중)
- **시나리오 테스터**: `http://localhost:3000/dev/mock-scenarios`
- **성능 모니터**: `npm run perf:analyze`

## 🚀 다음 단계

1. **테스트 작성**: Mock을 활용한 단위 테스트
2. **시나리오 확장**: 도메인별 Mock 시나리오 추가
3. **성능 측정**: Mock vs 실제 API 성능 비교
4. **CI/CD 통합**: 테스트 환경에서 Mock 자동 사용
5. **Mock 경량화**: 현재 2,536줄 → 1,500줄 목표

## 🎯 Mock 시스템 최적화 로드맵

### 단기 목표 (1-2주)
- [ ] Mock 파일 크기 30% 축소
- [ ] 스마트 폴백 시스템 구현
- [ ] Mock 대시보드 UI 개발

### 중기 목표 (1개월)
- [ ] 시나리오 기반 테스트 자동화
- [ ] Mock 데이터 버전 관리
- [ ] 성능 벤치마크 자동화

### 장기 목표 (3개월)
- [ ] AI 기반 Mock 응답 생성
- [ ] 분산 Mock 시스템
- [ ] 프로덕션 데이터 Mock 변환기

---

💡 **핵심 원칙**: 개발 초기에는 Mock을 적극 활용하고, 배포 전에만 실제 서비스로 검증하는 것이 가장 효율적입니다.

📝 **참고**: 이 Mock 시스템은 개발/테스트 전용입니다. 프로덕션 배포 시에는 자동으로 실제 API를 사용합니다.

🙏 **기여**: Mock 시스템 개선 아이디어나 버그 리포트는 [GitHub Issues](https://github.com/your-repo/issues)에 등록해주세요.
