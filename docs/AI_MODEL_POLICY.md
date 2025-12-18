# Google AI 모델 정책 및 Free Tier 현황 (2025.12)

이 문서는 2025년 12월 기준 Google AI Studio (Gemini API)의 무료 티어 접근 가능성을 정리합니다.

> **최종 테스트**: 2025-12-18 (실제 API 호출로 검증)

---

## 📊 모델별 접근성 요약

| 모델 | 상태 | RPM | RPD | TPM | 비고 |
|---|---|---|---|---|---|
| `gemini-1.5-flash` | ❌ **NOT_FOUND** | - | - | - | 2025년 이후 사용 불가 |
| `gemini-1.5-pro` | ❌ **NOT_FOUND** | - | - | - | 2025년 이후 사용 불가 |
| `gemini-2.0-flash` | ⚠️ **QUOTA** | - | - | - | 존재하지만 할당량 초과 |
| `gemini-2.0-flash-exp` | ⚠️ **QUOTA** | - | - | - | 존재하지만 할당량 초과 |
| **`gemini-2.5-flash`** | ✅ **유효** | 5 | 20 | 250K | **유일한 Free Tier 모델** |
| `gemini-2.5-pro` | ⚠️ **QUOTA** | 2 | 5 | 32K | 유료 플랜 권장 |

- **RPM**: Requests Per Minute (분당 요청 수)
- **RPD**: Requests Per Day (일일 요청 수)
- **TPM**: Tokens Per Minute (분당 토큰 수)

---

## 🚨 2025년 Free Tier 제한 (대폭 축소)

```typescript
// 이전 (2024) vs 현재 (2025)
DAILY_REQUESTS:     1500 → 20   // 🔻 98.7% 축소
REQUESTS_PER_MINUTE:  15 → 5    // 🔻 66.7% 축소
CONTEXT_TOKENS:      1M → 250K  // 🔻 75% 축소
```

### 임계값 설정
| 상태 | 사용량 | 동작 |
|---|---|---|
| ✅ OK | < 15회 | 정상 |
| ⚠️ WARNING | 15회 (75%) | 경고 표시 |
| 🔴 CRITICAL | 18회 (90%) | 사용 제한 권고 |
| ❌ LIMIT | 20회 | API 차단 |

### 리셋 시간
- **태평양 표준시 (PST) 자정** 기준으로 일일 한도 리셋
- 한국 시간 기준: **오후 5시** (PST 00:00 = KST 17:00)

---

## 🛑 주요 변화 및 주의사항

### 1. Gemini 1.5 계열 완전 종료
- `gemini-1.5-flash`, `gemini-1.5-pro` 모두 `404 Not Found`
- 모든 레거시 코드에서 `gemini-2.5-flash`로 마이그레이션 필수

### 2. Gemini 2.0 / 2.5 Pro 사실상 사용 불가
- API 목록에 존재하나 요청 시 즉시 `429 Quota Exceeded`
- 유료 플랜 업그레이드 없이는 사용 불가

### 3. 유일한 대안: `gemini-2.5-flash`
- 현재 무료 API 키로 정상 작동하는 유일한 모델
- 하루 20회 제한으로 인해 **공격적 캐싱 필수**

---

## 💡 사용 최적화 권장사항

```typescript
// src/config/google-ai-usage-limits.ts
export const USAGE_OPTIMIZATION_CONFIG = {
  CACHE_TTL_HOURS: 24,              // 24시간 캐시 유지
  ENABLE_AGGRESSIVE_CACHING: true,  // 공격적 캐싱 활성화
  CACHE_SIMILAR_QUERIES: true,      // 유사 쿼리 캐시 활용
  PREFER_LOCAL_AI: true,            // 로컬 AI 우선 사용
  AUTO_DISABLE_ON_LIMIT: true,      // 한도 도달 시 자동 비활성화
};
```

### 권장 전략
1. **캐시 우선 사용**으로 API 호출 최소화
2. **Local AI 모드**를 기본으로 설정
3. 복잡한 쿼리만 Google AI 사용
4. 유사한 질문들을 **배치로 처리**
5. 일일 사용량 **모니터링 강화**
6. 태평양 표준시 자정 이후 **사용량 리셋 활용**

---

## 🔧 프로젝트 설정

### 환경 변수
```env
GOOGLE_AI_MODEL=gemini-2.5-flash
GOOGLE_AI_ENABLED=true
GOOGLE_AI_DAILY_LIMIT=20
GOOGLE_AI_RPM_LIMIT=5
GOOGLE_AI_QUOTA_PROTECTION=true
```

### 폴백 구성
```
1순위: gemini-2.5-flash (Free Tier)
2순위: Local AI / 캐시
3순위: 에러 응답 (Graceful Degradation)
```

---

## 📝 테스트 스크립트

```bash
# 모델 유효성 테스트
node scripts/test-gemini-models.mjs

# 결과 확인
cat logs/gemini-model-test-results.json
```

---

## 📚 참고 자료

- [Google AI for Developers](https://ai.google.dev/)
- [Gemini API Pricing](https://ai.google.dev/pricing)
- [Rate Limits Documentation](https://ai.google.dev/gemini-api/docs/rate-limits)

---

> **Note**: 이 정보는 Google의 정책 변경에 따라 예고 없이 변동될 수 있습니다.
> Free Tier 정책은 매우 유동적이므로 주기적인 확인이 필요합니다.

_Last Updated: 2025-12-18_
