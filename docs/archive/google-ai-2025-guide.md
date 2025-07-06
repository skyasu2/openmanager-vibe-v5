# 🚀 Google AI API 무료 사용량 제한 및 모니터링 완벽 가이드 (2025년 7월 기준)

## 📋 **최신 정책 변화 요약**

### **🔥 2025년 주요 변경사항**

1. **모델 라인업 대폭 업데이트** (2025년 2월~6월)
   - 2025년 6월 기준으로 사용 가능한 모델은 Gemini 2.5 Flash, Gemini 2.5 Pro, Imagen 4, Veo 2 / 3가 있다
   - **Gemini 2.0 Flash**: 새로운 균형 잡힌 멀티모달 모델
   - **Gemini 2.5 시리즈**: 최신 고성능 모델

2. **무료 정책 확대**
   - 모든 국가에서 Google AI Studio를 무료로 사용할 수 있습니다
   - Gemini 2.5 Flash부터는 추론을 통해 답변을 생성하며, ChatGPT와 다르게 무제한으로 답변 생성이 가능하다

3. **요금제 세분화** (2025년 5월)
   - 2025년 5월 21일, Google I/O 2025 발표와 동시에 Gemini Advanced 요금제가 Gemini Pro와 Gemini Ultra 요금제로 세분화되었다

## 🆓 **무료 사용량 한도 (2025년 7월 최신)**

### **주요 무료 모델별 제한**

#### **1. Gemini 2.0 Flash (추천 모델) ⭐**

- **분당 요청**: 15회 (RPM)
- **분당 토큰**: 1,000,000개 (TPM)
- **일일 요청**: 1,500회 (RPD)
- **특징**: 모든 작업에서 우수한 성능을 제공하는 가장 균형 잡힌 멀티모달 모델

#### **2. Gemini 2.5 Flash Preview**

- **분당 요청**: 10회
- **분당 토큰**: 250,000개
- **일일 요청**: 500회
- **특징**: 최신 하이브리드 추론 모델

#### **3. Gemini 2.5 Pro Experimental**

- **분당 요청**: 5회
- **분당 토큰**: 250,000개
- **일일 요청**: 25회
- **특징**: 코딩 및 복잡한 추론에 탁월

#### **4. Gemini 2.0 Flash-Lite**

- **분당 요청**: 30회
- **분당 토큰**: 1,000,000개
- **일일 요청**: 1,500회
- **특징**: 대규모 사용을 위한 경량 모델

## 🚫 **자동 유료 전환 방지 확실함**

### **할당량 초과 시 동작**

실험해보니, 오류(google.api_core.exceptions.ResourceExhausted: 429 Resource has been exhausted (e.g. check quota))가 발생합니다

**결론**: 무료 할당량 초과 시 **자동으로 유료로 전환되지 않고 429 에러 발생**

## 📊 **사용량 모니터링 방법**

### **1. Google AI Studio (완전 무료)**

- **접속**: ai.google.dev
- **API Keys 섹션**에서 실시간 사용량 확인
- **모든 국가에서 완전 무료** 사용 가능

### **2. Google Cloud Console**

- **경로**: console.cloud.google.com → API 및 서비스 → 대시보드
- **기능**: 시간대별 사용량 그래프, 할당량 현황

### **3. API 레벨 모니터링**

#### **토큰 카운팅 API 활용**

```bash
POST https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:countTokens
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json

{
  "contents": [{"parts": [{"text": "your text here"}]}]
}
```

#### **비율 제한 체크**

비율 제한은 다음 4가지 측정기준에 따라 측정됩니다. 분당 요청 수 (RPM), 일일 요청 수 (RPD), 분당 토큰 수 (TPM), 일일 토큰 (TPD)

## 🎯 **2025년 7월 기준 추천 전략**

### **최적 모델 선택**

1. **일반 용도**: Gemini 2.0 Flash (15 RPM, 1M TPM)
2. **대용량 처리**: Gemini 2.0 Flash-Lite (30 RPM, 1M TPM)
3. **고급 추론**: Gemini 2.5 Pro Experimental (5 RPM, 250K TPM)

### **무료 한도 최대 활용법**

1. **Google AI Studio 병행 사용**: 완전 무료로 테스트
2. **토큰 효율성**: 프롬프트 최적화로 토큰 사용량 절약
3. **모델별 분산**: 용도에 따라 적절한 모델 선택

### **안전한 사용을 위한 체크리스트**

- ✅ Cloud Billing 비활성화 상태 유지
- ✅ 실시간 사용량 모니터링 구현
- ✅ 429 에러 핸들링 로직 구현
- ✅ 요청 전 할당량 사전 체크

## 🚨 **주의사항**

### **지역별 제한**

유럽 경제 지역, 스위스, 영국 사용자에게 API 클라이언트를 제공하는 경우에는 유료 서비스만 사용하여야 합니다

### **데이터 처리 정책**

민감한 정보, 기밀 정보 또는 개인 정보를 '무료 서비스'에 제출하지 마세요

### **프로덕션 사용 제한**

귀하는 'API 클라이언트'를 프로덕션 용도로 사용할 수 있으나 Google에서 사용량을 제한할 수 있습니다

## 🔮 **2025년 하반기 전망**

### **예상 변화**

1. **더 관대한 무료 할당량**: 2.0 Flash 기준 이미 대폭 증가
2. **추가 모델 출시**: Gemini 3.0 시리즈 예상
3. **Google 검색 연동**: 구글 검색을 지원한다. 단, 해당 기능을 이용하여 최신 정보를 찾으려면 검색 기능(Grounding with Google Search)을 반드시 켜야 한다

### **개발자 친화적 정책**

- 무료 등급 지속 확대
- 더 높은 성능의 무료 모델 제공
- 개발자 도구 개선

---

## 🛠️ **OpenManager Vibe v5에서 구현된 기능**

### **할당량 관리자 (GoogleAIQuotaManager)**

```typescript
// 2025년 최신 할당량 설정
const config = {
  dailyLimit: 1200, // 1500 → 안전 마진 1200
  minuteLimit: 12, // 15 → 안전 마진 12
  testLimit: 10, // 테스트 제한 완화
  model: 'gemini-2.0-flash', // 최신 모델 기본값
};
```

### **실시간 모니터링**

- 분당/시간당/일일 사용량 추적
- Circuit Breaker 패턴 (5회 연속 실패 시 30분 차단)
- Redis 기반 안전한 카운터 관리
- 429 에러 자동 처리

### **AI 어시스턴트 통합**

- 자연어 질의 전용 Google AI 사용
- 로컬 AI 엔진과 하이브리드 운영
- 할당량 보호 하에 안전한 운영

---

**핵심 결론**: 2025년 7월 기준으로 Google AI API는 **자동 유료 전환 없이**, **상당히 관대한 무료 할당량**을 제공하며, **실시간 모니터링**을 통해 안전하게 무료 범위 내에서 사용할 수 있습니다! 🎉

## 📈 **성능 비교표**

| 모델                  | RPM | TPM  | RPD  | 용도             | OpenManager 적용 |
| --------------------- | --- | ---- | ---- | ---------------- | ---------------- |
| Gemini 2.0 Flash      | 15  | 1M   | 1500 | 일반 용도 (추천) | ✅ 기본 모델     |
| Gemini 2.5 Flash      | 10  | 250K | 500  | 최신 추론        | ⚙️ 옵션          |
| Gemini 2.5 Pro        | 5   | 250K | 25   | 고급 추론        | ⚙️ 옵션          |
| Gemini 2.0 Flash-Lite | 30  | 1M   | 1500 | 대용량 처리      | ⚙️ 옵션          |

## 🔧 **환경 변수 설정**

```bash
# Google AI 2025년 설정
GOOGLE_AI_MODEL=gemini-2.0-flash
GOOGLE_AI_DAILY_LIMIT=1200
GOOGLE_AI_MINUTE_LIMIT=12
GOOGLE_AI_TEST_LIMIT_PER_DAY=10
GOOGLE_AI_QUOTA_PROTECTION=true
```

---

_최종 업데이트: 2024-12-19 (KST) by OpenManager Vibe v5 팀_
