# 🔒 Google AI 할당량 보호 시스템

> OpenManager Vibe v5.44.1에서 구현된 Google AI API 할당량 안전 관리 시스템

## 📋 개요

Google AI API는 일일/시간당 할당량 제한이 있어 과도한 사용 시 서비스 중단이 발생할 수 있습니다. 이를 방지하기 위한 포괄적인 보호 시스템을 구현했습니다.

## 🛡️ 주요 보호 기능

### 1. 헬스체크 캐싱 (24시간)

- **목적**: 시스템 시작 시에만 실제 API 호출
- **기본값**: 24시간 캐시
- **설정**: `GOOGLE_AI_HEALTH_CHECK_CACHE_HOURS=24`

```typescript
// 헬스체크 요청 가능 여부 확인
const healthCheck = await quotaManager.canPerformHealthCheck();
if (healthCheck.cached) {
  // 캐시된 결과 사용 (API 호출 없음)
}
```

### 2. 테스트 제한 (일일 5회)

- **목적**: 개발/테스트 시 과도한 API 사용 방지
- **기본값**: 하루 5회
- **설정**: `GOOGLE_AI_TEST_LIMIT_PER_DAY=5`

```typescript
// 테스트 가능 여부 확인
const testCheck = await quotaManager.canPerformTest();
if (!testCheck.allowed) {
  console.log(`테스트 제한: ${testCheck.reason}`);
}
```

### 3. 일일/시간당 할당량 관리

- **일일 제한**: 100회 (기본값)
- **시간당 제한**: 20회 (기본값)
- **설정**:
  - `GOOGLE_AI_DAILY_LIMIT=100`
  - `GOOGLE_AI_HOURLY_LIMIT=20`

### 4. Circuit Breaker 패턴

- **목적**: 연속 실패 시 자동 차단
- **임계값**: 5회 연속 실패 (기본값)
- **차단 시간**: 30분
- **설정**: `GOOGLE_AI_CIRCUIT_BREAKER_THRESHOLD=5`

## 🎛️ 환경변수 설정

### 필수 설정

```bash
# Google AI API 키 (암호화 저장)
GOOGLE_AI_API_KEY=your_api_key_here

# Google AI 활성화
GOOGLE_AI_ENABLED=true

# 할당량 보호 활성화
GOOGLE_AI_QUOTA_PROTECTION=true
```

### 할당량 제한 설정

```bash
# 일일 API 호출 제한
GOOGLE_AI_DAILY_LIMIT=100

# 시간당 API 호출 제한
GOOGLE_AI_HOURLY_LIMIT=20

# 일일 테스트 제한
GOOGLE_AI_TEST_LIMIT_PER_DAY=5

# 헬스체크 캐시 시간 (시간)
GOOGLE_AI_HEALTH_CHECK_CACHE_HOURS=24

# Circuit Breaker 임계값
GOOGLE_AI_CIRCUIT_BREAKER_THRESHOLD=5
```

### Mock 모드 설정

```bash
# 강제 Mock 모드 (테스트 환경)
FORCE_MOCK_GOOGLE_AI=true

# 개발 환경에서 엄격한 할당량 적용
GOOGLE_AI_QUOTA_PROTECTION=strict
```

## 🔧 사용법

### 1. 기본 사용 (자동 보호 적용)

```typescript
import { GoogleAIQuotaManager } from '@/services/ai/engines/GoogleAIQuotaManager';

const quotaManager = new GoogleAIQuotaManager();

// API 호출 전 권한 확인
const permission = await quotaManager.canPerformAPICall();
if (permission.allowed) {
  // 실제 API 호출
  const result = await callGoogleAI();

  // 성공 시 사용량 기록
  await quotaManager.recordAPIUsage();
} else {
  console.log(`API 호출 제한: ${permission.reason}`);
}
```

### 2. 헬스체크 (캐싱 적용)

```typescript
// 헬스체크 권한 확인
const healthCheck = await quotaManager.canPerformHealthCheck();

if (healthCheck.cached) {
  // 캐시된 결과 사용
  return { success: true, cached: true };
} else if (healthCheck.allowed) {
  // 실제 헬스체크 수행
  const result = await performHealthCheck();

  if (result.success) {
    await quotaManager.recordHealthCheckSuccess();
  } else {
    await quotaManager.recordAPIFailure();
  }
}
```

### 3. 테스트 (제한 적용)

```typescript
// 테스트 권한 확인
const testCheck = await quotaManager.canPerformTest();

if (testCheck.allowed) {
  // 테스트 수행
  const result = await performTest();

  // 테스트 사용량 기록
  await quotaManager.recordTestUsage();

  console.log(`남은 테스트 횟수: ${testCheck.remaining! - 1}`);
} else {
  return {
    error: testCheck.reason,
    remaining: testCheck.remaining,
  };
}
```

## 🚨 주의사항

### 테스트 서버 운영 시

1. **환경변수 확인**: `GOOGLE_AI_QUOTA_PROTECTION=true` 설정
2. **Mock 모드 활용**: `FORCE_MOCK_GOOGLE_AI=true` 권장
3. **테스트 제한 준수**: 하루 5회 이내 테스트

### 개발 환경에서

1. **과도한 헬스체크 금지**: 시스템 시작 시 1회만
2. **테스트 최소화**: 1-2회 질문으로 제한
3. **할당량 모니터링**: 관리 페이지에서 실시간 확인

### 프로덕션 환경에서

1. **할당량 보호 필수**: `GOOGLE_AI_QUOTA_PROTECTION=true`
2. **적절한 제한 설정**: 실제 사용량에 맞게 조정
3. **모니터링 알림**: Circuit Breaker 활성화 시 알림

## 📊 모니터링

### 관리 페이지에서 확인

- **경로**: `/admin/ai-agent` > Google AI 탭
- **정보**: 일일/시간당/테스트 사용량, Circuit Breaker 상태, 헬스체크 캐시

### API로 상태 확인

```bash
# 할당량 상태 조회
curl http://localhost:3000/api/ai/google-ai/status

# 테스트 상태 조회
curl http://localhost:3000/api/ai/google-ai/test
```

## 🔄 자동 복구

### Circuit Breaker 리셋

- 성공적인 API 호출 시 자동 리셋
- 수동 리셋: 시스템 재시작

### 헬스체크 캐시 갱신

- 24시간 후 자동 만료
- 수동 갱신: 관리 페이지에서 "상태 새로고침"

## 🛠️ 문제 해결

### "할당량 초과" 오류

```bash
# 현재 사용량 확인
curl http://localhost:3000/api/ai/google-ai/status

# Mock 모드로 전환
export FORCE_MOCK_GOOGLE_AI=true

# 제한 완화 (임시)
export GOOGLE_AI_DAILY_LIMIT=200
```

### "Circuit Breaker 활성화" 오류

```bash
# 시스템 재시작으로 리셋
npm run dev

# 또는 Redis에서 수동 삭제
redis-cli DEL google_ai_quota:circuit_breaker
```

### 헬스체크 캐시 강제 갱신

```bash
# Redis에서 캐시 삭제
redis-cli DEL google_ai_quota:health_check
```

## 📈 최적화 팁

1. **개발 환경**: Mock 모드 활용으로 할당량 절약
2. **테스트 환경**: 최소한의 실제 API 호출
3. **프로덕션**: 적절한 캐싱과 제한으로 안정성 확보
4. **모니터링**: 정기적인 사용량 확인으로 예방적 관리

---

> **중요**: Google AI API 할당량은 유한한 자원입니다. 이 보호 시스템을 통해 안정적이고 지속 가능한 서비스를 제공할 수 있습니다.
