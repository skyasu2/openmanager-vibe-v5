# Upstash Redis 통합 작업 계획서

**작성일**: 2025-12-25
**버전**: v1.0
**목표 버전**: v5.84.0
**우선순위**: 무료 티어 보호 & 안정적 성능

---

## 1. 프로젝트 개요

### 1.1 목표
Upstash Redis를 도입하여 **모든 무료 티어 서비스를 보호**하고 **시스템 안정성을 향상**시킨다.

### 1.2 핵심 원칙
| 원칙 | 설명 |
|------|------|
| **무료 티어 유지** | 월 $0 운영 목표 (모든 서비스) |
| **Graceful Degradation** | 장애 시에도 서비스 가용성 우선 |
| **점진적 도입** | 단계별 구현으로 리스크 최소화 |
| **기존 코드 최소 변경** | 래퍼 패턴으로 영향 범위 제한 |

### 1.3 예상 효과
- Rate Limiting 응답: 20-100ms → **<1ms** (95% 개선)
- Supabase RPC 호출: **80% 감소**
- Cloud Run 보호: **정확도 향상**
- AI 응답 캐싱: 반복 질문 **즉시 응답**

---

## 2. 현재 상태 분석

### 2.1 무료 티어 현황
| 서비스 | 무료 한도 | 현재 사용률 | 위험도 |
|--------|----------|------------|--------|
| Upstash Redis | 월 500K 명령어 | 0% (미사용) | 🟢 |
| Google AI | 225 RPD, 9 RPM | ~50% | 🟡 |
| Cloud Run | 월 180K vCPU-sec | ~10% | 🟢 |
| Supabase | 500MB + RPC | ~30% | 🟡 |
| Groq | 14,400 RPD | <5% | 🟢 |

### 2.2 현재 Rate Limiting 구현
- **위치**: `src/lib/security/rate-limiter.ts`
- **방식**: Supabase RPC 기반
- **문제점**:
  - 매 요청 2회 RPC 호출 (분당 + 일일)
  - 20-100ms 지연
  - Supabase 장애 시 보호 무효화

### 2.3 환경 변수 (이미 설정됨)
```bash
KV_REST_API_URL=https://enabled-tetra-50830.upstash.io
KV_REST_API_TOKEN=AcaOAAIncD...
REDIS_URL=rediss://default:...@enabled-tetra-50830.upstash.io:6379
```

---

## 3. 구현 단계

### Phase 1: 기반 구축 (Day 1)
> Redis 클라이언트 설정 및 기본 인프라

#### 3.1.1 Redis 클라이언트 싱글톤
**파일**: `src/lib/redis/client.ts` (신규)

```typescript
// 싱글톤 Redis 클라이언트
// - enableAutoPipelining: 자동 배칭
// - Graceful fallback 지원
```

#### 3.1.2 패키지 설치
```bash
npm install @upstash/redis @upstash/ratelimit
```

#### 3.1.3 환경 변수 정리
**파일**: `.env.example` 업데이트

---

### Phase 2: Rate Limiting 교체 (Day 1-2)
> Supabase RPC → Upstash Redis

#### 3.2.1 새 Rate Limiter 구현
**파일**: `src/lib/redis/rate-limiter.ts` (신규)

```typescript
// Upstash Ratelimit 기반
// - slidingWindow 알고리즘
// - ephemeralCache (DoS 방어)
// - 분당 + 일일 통합 제한
```

#### 3.2.2 기존 Rate Limiter 래퍼
**파일**: `src/lib/security/rate-limiter.ts` (수정)

```typescript
// 기존 인터페이스 유지
// 내부적으로 Redis Rate Limiter 호출
// Fallback: Redis 실패 시 Supabase 사용
```

#### 3.2.3 적용 엔드포인트
| 엔드포인트 | 분당 제한 | 일일 제한 | 비고 |
|-----------|----------|----------|------|
| `/api/ai/supervisor` | 10 | 100 | Cloud Run 보호 |
| `/api/ai/*` | 10 | 100 | AI 전체 |
| `/api/servers/*` | 30 | - | 모니터링 |
| 기본 | 100 | - | 일반 API |

---

### Phase 3: AI 응답 캐싱 (Day 2-3)
> Cloud Run 호출 최소화 & Google AI RPD 절감

#### 3.3.1 캐시 서비스 구현
**파일**: `src/lib/redis/ai-cache.ts` (신규)

```typescript
// 쿼리 해시 기반 캐싱
// TTL: 1시간 (신선도 유지)
// 캐시 히트 시 Cloud Run 호출 생략
```

#### 3.3.2 Supervisor 프록시 수정
**파일**: `src/app/api/ai/supervisor/route.ts` (수정)

```typescript
// 캐시 확인 → 히트 시 즉시 반환
// 미스 시 Cloud Run 호출 → 캐싱
```

#### 3.3.3 캐시 키 전략
```
ai:supervisor:{sessionId}:{queryHash}  → AI 응답
ai:health:{service}                    → 헬스 체크 결과
```

---

### Phase 4: 분산 Circuit Breaker (Day 3)
> Vercel 인스턴스 간 장애 상태 공유

#### 3.4.1 Redis Circuit Breaker
**파일**: `src/lib/redis/circuit-breaker.ts` (신규)

```typescript
// Redis 카운터 기반 분산 Circuit Breaker
// - 3회 실패 → Circuit OPEN
// - 60초 후 HALF-OPEN → 테스트
// - 성공 시 CLOSED
```

#### 3.4.2 기존 Circuit Breaker 통합
**파일**: `src/lib/ai/circuit-breaker.ts` (수정)

```typescript
// 기존 로컬 상태 + Redis 동기화
// Redis 우선, 실패 시 로컬 폴백
```

---

### Phase 5: 세션 캐싱 (Day 4, 선택적)
> Supabase auth 호출 감소

#### 3.5.1 세션 캐시 서비스
**파일**: `src/lib/redis/session-cache.ts` (신규)

```typescript
// 인증 세션 Redis 캐싱
// TTL: 24시간 (슬라이딩)
// Supabase getUser() 호출 감소
```

---

## 4. 파일 변경 목록

### 4.1 신규 파일
| 파일 | 설명 | 우선순위 |
|------|------|---------|
| `src/lib/redis/client.ts` | Redis 클라이언트 싱글톤 | P1 |
| `src/lib/redis/rate-limiter.ts` | Upstash Rate Limiter | P1 |
| `src/lib/redis/ai-cache.ts` | AI 응답 캐시 | P2 |
| `src/lib/redis/circuit-breaker.ts` | 분산 Circuit Breaker | P2 |
| `src/lib/redis/session-cache.ts` | 세션 캐시 | P3 |
| `src/lib/redis/index.ts` | 모듈 exports | P1 |

### 4.2 수정 파일
| 파일 | 변경 내용 | 영향도 |
|------|----------|--------|
| `src/lib/security/rate-limiter.ts` | Redis 래퍼 적용 | 중간 |
| `src/app/api/ai/supervisor/route.ts` | 캐싱 레이어 추가 | 낮음 |
| `src/lib/ai/circuit-breaker.ts` | Redis 동기화 | 낮음 |
| `package.json` | 의존성 추가 | 낮음 |
| `.env.example` | 환경 변수 문서화 | 낮음 |

### 4.3 영향 없는 파일 (기존 유지)
- `src/lib/cache/unified-cache.ts` - 메모리 캐시 (용도 다름)
- `src/lib/auth/auth-cache.ts` - Phase 5에서 선택적 통합

---

## 5. 테스트 전략

### 5.1 단위 테스트
```typescript
// tests/lib/redis/rate-limiter.test.ts
describe('Redis Rate Limiter', () => {
  it('should allow requests within limit');
  it('should block requests exceeding limit');
  it('should reset after window expires');
  it('should fallback to Supabase on Redis failure');
});
```

### 5.2 통합 테스트
```typescript
// tests/integration/redis-integration.test.ts
describe('Redis Integration', () => {
  it('should rate limit AI supervisor endpoint');
  it('should cache AI responses');
  it('should share circuit breaker state');
});
```

### 5.3 E2E 테스트
```bash
# Playwright 시나리오 추가
npm run test:vercel:e2e
```

### 5.4 수동 테스트 체크리스트
- [ ] Rate Limit 동작 확인 (429 응답)
- [ ] 캐시 히트 확인 (응답 시간 측정)
- [ ] Redis 장애 시 Supabase 폴백 확인
- [ ] Vercel Preview 배포 테스트
- [ ] Production 배포 전 Staging 검증

---

## 6. 롤백 계획

### 6.1 즉시 롤백 (5분 이내)
```bash
# 환경 변수로 Redis 비활성화
REDIS_ENABLED=false

# 또는 Vercel 이전 배포로 롤백
vercel rollback
```

### 6.2 코드 롤백
```bash
# 이전 커밋으로 복원
git revert HEAD
git push
```

### 6.3 Fallback 로직 (자동)
```typescript
// Redis 실패 시 자동으로 Supabase 폴백
if (!redisAvailable) {
  return supabaseRateLimiter.checkLimit(request);
}
```

---

## 7. 모니터링 계획

### 7.1 Upstash 대시보드
- 일일 명령어 사용량
- 응답 시간 (latency)
- 에러율

### 7.2 알림 설정
| 지표 | 임계값 | 액션 |
|------|--------|------|
| 월간 명령어 | 400K (80%) | Slack 알림 |
| 응답 시간 | > 100ms | 로그 경고 |
| 에러율 | > 1% | 자동 폴백 |

### 7.3 로깅
```typescript
// Redis 연산 로깅
logger.info('[Redis] Rate limit check', {
  ip, path, allowed, remaining, latencyMs
});
```

---

## 8. 예상 리소스 사용량

### 8.1 Redis 명령어 (월간)
| 기능 | 일일 | 월간 | 비율 |
|------|------|------|------|
| Rate Limiting | 600 | 18,000 | 3.6% |
| AI 캐싱 | 200 | 6,000 | 1.2% |
| Circuit Breaker | 30 | 900 | 0.2% |
| 세션 캐시 (P3) | 100 | 3,000 | 0.6% |
| **총계** | **930** | **27,900** | **5.6%** |

### 8.2 무료 한도 대비
```
월 500,000 명령어 중 27,900 사용 = 5.6%
여유: 472,100 명령어 (94.4%)
```

---

## 9. 일정

| 단계 | 작업 | 예상 시간 |
|------|------|----------|
| **Phase 1** | 기반 구축 (클라이언트, 패키지) | 1시간 |
| **Phase 2** | Rate Limiting 교체 | 2시간 |
| **Phase 3** | AI 응답 캐싱 | 2시간 |
| **Phase 4** | 분산 Circuit Breaker | 1시간 |
| **테스트** | 단위/통합/수동 테스트 | 1시간 |
| **배포** | Preview → Production | 30분 |
| **총계** | | **~8시간** |

---

## 10. 성공 기준

### 10.1 기능적 기준
- [ ] Rate Limiting이 Redis로 동작
- [ ] AI 응답 캐싱 동작 (캐시 히트 확인)
- [ ] Supabase 폴백 동작
- [ ] 모든 기존 테스트 통과

### 10.2 성능 기준
- [ ] Rate Limit 체크: < 5ms
- [ ] 캐시 히트: < 10ms
- [ ] 전체 API 응답 시간 개선

### 10.3 안정성 기준
- [ ] Redis 장애 시 서비스 정상 동작
- [ ] 무료 티어 한도 내 유지 (< 50%)
- [ ] 에러율 < 0.1%

---

## 11. 승인

| 역할 | 확인 | 날짜 |
|------|------|------|
| 개발 | ⬜ | |
| 리뷰 | ⬜ | |
| 배포 | ⬜ | |

---

## 12. 참고 자료

- [Upstash Redis 문서](https://upstash.com/docs/redis)
- [Upstash Ratelimit 문서](https://upstash.com/docs/redis/sdks/ratelimit-ts)
- [기존 Rate Limiter](src/lib/security/rate-limiter.ts)
- [Cloud Run 프록시](src/lib/ai-proxy/proxy.ts)

---

_작성: Claude Code_
_최종 수정: 2025-12-25_
