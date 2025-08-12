# UnifiedAIEngineRouter 리팩토링 계획

## 📅 작성일: 2025-01-30

## 🎯 목표
1,027줄의 God Class인 UnifiedAIEngineRouter를 단일 책임 원칙(SRP)에 따라 분리

## 📊 현재 상태 분석

### 파일 정보
- **위치**: `/src/services/ai/UnifiedAIEngineRouter.ts`
- **크기**: 1,027줄
- **메서드 수**: 31개 (public: 7개, private: 24개)

### 식별된 책임들
1. **라우팅 핵심 로직** (메인 책임)
   - `route()` - 메인 라우팅 메서드
   - `selectEngine()` - 엔진 선택 로직
   - `executeEngine()` - 엔진 실행

2. **보안 처리** (별도 서비스로 분리 필요)
   - `applySecurity()` - 보안 적용
   - `createSecurityBlockedResponse()` - 보안 차단 응답
   - PromptSanitizer, AIResponseFilter 사용

3. **토큰 관리** (별도 매니저로 분리)
   - `checkTokenLimits()` - 토큰 제한 확인
   - `recordTokenUsage()` - 토큰 사용량 기록
   - `resetDailyLimits()` - 일일 제한 리셋
   - `createTokenLimitResponse()` - 토큰 제한 응답

4. **Circuit Breaker** (별도 패턴 구현)
   - `isCircuitOpen()` - 회로 상태 확인
   - `recordFailure()` - 실패 기록
   - `resetCircuitBreakers()` - 회로 리셋
   - `createCircuitOpenResponse()` - 회로 차단 응답

5. **캐싱 로직** (별도 캐시 매니저)
   - `generateCacheKey()` - 캐시 키 생성
   - `getCachedResponse()` - 캐시 조회
   - `setCachedResponse()` - 캐시 저장
   - `clearCache()` - 캐시 초기화

6. **한국어 NLP 처리** (별도 프로세서)
   - `executeKoreanNLP()` - 한국어 NLP 실행
   - `convertKoreanNLPResponse()` - 응답 변환
   - `calculateKoreanRatio()` - 한국어 비율 계산

7. **메트릭 수집** (별도 컬렉터)
   - `updateMetrics()` - 메트릭 업데이트
   - `getMetrics()` - 메트릭 조회

8. **에러 처리 및 폴백** (별도 핸들러)
   - `retryWithDifferentEngine()` - 다른 엔진으로 재시도
   - `retryWithFallback()` - 폴백 재시도
   - `getFallbackEngine()` - 폴백 엔진 선택
   - `createErrorResponse()` - 에러 응답 생성

## 🏗️ 제안하는 구조

```
src/services/ai/
├── UnifiedAIEngineRouter.ts (핵심 라우팅만 - 200줄)
├── routing/
│   ├── AISecurityService.ts (보안 처리 - 150줄)
│   ├── TokenUsageManager.ts (토큰 관리 - 120줄)
│   ├── CircuitBreakerService.ts (회로 차단기 - 150줄)
│   ├── AICacheManager.ts (캐싱 - 100줄)
│   ├── KoreanNLPProcessor.ts (한국어 처리 - 100줄)
│   ├── AIMetricsCollector.ts (메트릭 수집 - 80줄)
│   └── AIErrorHandler.ts (에러 처리 - 120줄)
└── index.ts (통합 export)
```

## 🚀 리팩토링 단계

### Phase 1: 인터페이스 정의 (30분)
1. 각 서비스의 인터페이스 정의
2. 의존성 주입을 위한 타입 정의
3. 공통 타입 추출

### Phase 2: 서비스 분리 (각 20-30분)
1. **AISecurityService** 생성
   - `applySecurity()` 메서드 이동
   - PromptSanitizer, AIResponseFilter 통합
   - 보안 관련 응답 생성 로직

2. **TokenUsageManager** 생성
   - 토큰 사용량 추적 로직
   - 일일/사용자별 제한 관리
   - 토큰 관련 응답 생성

3. **CircuitBreakerService** 생성
   - 엔진별 회로 상태 관리
   - 실패 임계값 및 재시도 로직
   - 회로 차단 응답 생성

4. **AICacheManager** 생성
   - 캐시 키 생성 및 관리
   - TTL 기반 캐시 만료
   - 캐시 크기 제한 관리

5. **KoreanNLPProcessor** 생성
   - 한국어 감지 로직
   - NLP API 호출 및 응답 변환
   - 한국어 특화 처리

6. **AIMetricsCollector** 생성
   - 요청/응답 메트릭 수집
   - 엔진별 사용량 추적
   - 통계 데이터 제공

7. **AIErrorHandler** 생성
   - 에러 타입별 처리 로직
   - 폴백 전략 관리
   - 에러 응답 생성

### Phase 3: 통합 및 테스트 (1시간)
1. UnifiedAIEngineRouter 리팩토링
   - 분리된 서비스 주입
   - 핵심 라우팅 로직만 유지
   - 코디네이터 역할로 축소

2. 의존성 주입 설정
   - 서비스 간 의존성 관리
   - 테스트 가능한 구조 확보

3. 기존 API 호환성 유지
   - 공개 인터페이스 변경 없음
   - 점진적 마이그레이션 지원

## ✅ 예상 효과

1. **코드 품질 향상**
   - 단일 책임 원칙 준수
   - 각 클래스 200줄 이하로 관리
   - 명확한 역할 분리

2. **유지보수성 개선**
   - 각 기능별 독립적 수정 가능
   - 테스트 용이성 증가
   - 재사용성 향상

3. **확장성 확보**
   - 새로운 엔진 추가 용이
   - 기능별 개선 가능
   - 플러그인 아키텍처 지원

## ⚠️ 주의사항

1. **API 호환성**: 기존 공개 메서드 시그니처 유지
2. **성능**: 과도한 추상화로 인한 성능 저하 방지
3. **순환 참조**: 서비스 간 의존성 주의
4. **점진적 적용**: 한 번에 모든 변경 대신 단계별 적용

## 📋 체크리스트

- [ ] 인터페이스 정의 완료
- [ ] AISecurityService 분리
- [ ] TokenUsageManager 분리
- [ ] CircuitBreakerService 분리
- [ ] AICacheManager 분리
- [ ] KoreanNLPProcessor 분리
- [ ] AIMetricsCollector 분리
- [ ] AIErrorHandler 분리
- [ ] UnifiedAIEngineRouter 리팩토링
- [ ] 통합 테스트 작성
- [ ] 문서 업데이트