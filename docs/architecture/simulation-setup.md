---
id: mock-setup
title: "Mock System Setup Guide"
keywords: ["mock", "setup", "dev", "hybrid", "configuration"]
priority: medium
ai_optimized: true
updated: "2025-09-09"
---

# Mock System Setup Guide

**하이브리드 Mock 시스템 설정** - 개발 효율성 + 비용 절감 80%

## 🚀 빠른 시작

### 1. Mock 모드 실행
```bash
# 모든 서비스 Mock 강제
npm run dev:mock

# 실제 서비스 강제
npm run dev:real

# 하이브리드 모드 (추천)
npm run dev:hybrid
```

### 2. 상태 확인
```bash
# Mock 시스템 상태
npm run mock:status

# 사용 통계
npm run mock:stats

# 무료 티어 사용량
npm run check:usage
```

### 3. 브라우저 콘솔 확인
개발 중 다음 메시지 확인:
- `🎭 Mock Google AI 사용 중 (API 사용량 0)`
- `🎭 Mock Supabase 사용 중 (API 사용량 0)`
- `🧠 통합 Mock Memory Cache 활성화`
- `🎭 Mock GCP Functions 사용 중`

## 🔧 환경 설정

### .env.local 핵심 설정
```env
# === Mock 시스템 설정 ===
MOCK_MODE=dev                     # off | dev | test | force
# - off: 실제 서비스만 사용
# - dev: 개발 환경에서 자동 선택 (기본값)
# - test: 테스트 환경에서만 Mock 사용
# - force: 항상 Mock 사용

# Mock 옵션
MOCK_RESPONSE_DELAY=0             # Mock 응답 지연 (ms)
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

## 🚀 개발 워크플로우

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
Memory Cache:  25% → 8%
Vercel:        30% → 30% (변화 없음)
GCP Functions: 10% → 2%
```

## 📊 Mock 데이터 내용

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

### Mock 동작 커스텀마이징
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

## 😨 주의사항

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
- `.gitignore`에 Mock 데이터 디렉터리 포함 확인
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
   chmod -R 755 node_modules
   ```

2. **포트 충돌**
   ```bash
   netstat -tulpn | grep 3000
   ```

3. **메모리 부족**
   ```bash
   # WSL 메모리 할당 증가 (.wslconfig)
   [wsl2]
   memory=8GB
   ```

---

**💡 핵심 원칙**: 개발 초기에는 Mock을 적극 활용하고, 배포 전에만 실제 서비스로 검증하는 것이 가장 효율적입니다.