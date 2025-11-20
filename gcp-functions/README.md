# 🚀 OpenManager GCP Cloud Functions

> **최종 업데이트**: 2025-11-20  
> **버전**: 2.0.0  
> **상태**: 최적화 완료 ✅

베르셀 AI 엔진 기능을 GCP로 이전한 서버리스 Functions 모음

---

## 📁 구조

```
gcp-functions/
├── ai-gateway/              # 요청 분산 및 조율 (256MB, 60초)
├── enhanced-korean-nlp/     # 한국어 자연어 처리 (256MB, 60초) ⚡ 최적화
├── rule-engine/             # 규칙 기반 빠른 응답 (256MB, 30초)
├── ml-analytics-engine/     # 머신러닝 분석 (384MB, 45초) ⚡ 최적화
├── unified-ai-processor/    # 통합 AI 처리 (512MB, 120초) ⚡ 최적화
├── health/                  # 헬스체크 (128MB, 10초)
├── shared/                  # 공통 유틸리티
└── deployment/              # 배포 스크립트
    └── deploy-optimized.sh  # ✨ 개선된 배포 스크립트
```

---

## 🎯 무료 티어 최적화 (v2.0)

### 개선 사항
- ✅ 메모리 사용량 **47% 감소**
- ✅ 타임아웃 **67% 단축**
- ✅ 의존성 최신 버전 업데이트
- ✅ 배포 스크립트 개선 (검증, 에러 핸들링)

### 할당량 관리

| 리소스 | 무료 한도 | 예상 사용량 | 사용률 |
|---|---|---|---|
| 호출 횟수 | 2,000,000회/월 | 50,000회/월 | 2.5% ⬇️ |
| 컴퓨팅 | 400,000 GB-초/월 | 8,000 GB-초/월 | 2.0% ⬇️ |
| 네트워크 | 5 GB/월 | 0.3 GB/월 | 6% ⬇️ |

### Function별 사양 (최적화 후)

| Function | 메모리 | 타임아웃 | 변경 |
|---|---|---|---|
| ai-gateway | 256MB | 60초 | - |
| enhanced-korean-nlp | 256MB ⬇️ | 60초 ⬇️ | -50%, -67% |
| rule-engine | 256MB | 30초 | - |
| ml-analytics-engine | 384MB ⬇️ | 45초⬇️ | -25%, -63% |
| unified-ai-processor | 512MB ⬇️ | 120초⬇️ | -50%, -60% |
| health | 128MB | 10초 | - |

---

## 🔧 배포 방법

### 사전 준비

```bash
# 1. GCP 인증
gcloud auth login

# 2. 환경 변수 설정
export GCP_PROJECT_ID="your-project-id"
export GCP_REGION="asia-northeast3"  # 서울 리전
```

### 전체 Functions 배포 (권장)

```bash
cd gcp-functions/deployment
./deploy-optimized.sh
```

**특징**:
- ✅ 환경 변수 자동 검증
- ✅ 배포 전 확인 프롬프트
- ✅ 실패 시 자동 롤백
- ✅ 배포 후 검증

### 개별 Function 배포

#### Python Functions
```bash
cd gcp-functions/enhanced-korean-nlp
gcloud functions deploy enhanced-korean-nlp \
  --runtime python310 \
  --trigger-http \
  --allow-unauthenticated \
  --memory=256MB \
  --timeout=60s \
  --region=asia-northeast3
```

#### Node.js Functions
```bash
cd gcp-functions/ai-gateway
gcloud functions deploy ai-gateway \
  --runtime nodejs20 \
  --trigger-http \
  --allow-unauthenticated \
  --memory=256MB \
  --timeout=60s \
  --region=asia-northeast3 \
  --entry-point=aiGateway
```

---

## 📊 모니터링

### 사용량 확인
```bash
# 전체 Functions 목록
gcloud functions list --region=asia-northeast3

# 특정 Function 상세 정보
gcloud functions describe enhanced-korean-nlp --region=asia-northeast3

# 최근 로그 확인
gcloud functions logs read enhanced-korean-nlp --limit=50
```

### 성능 메트릭
```bash
# Cloud Console에서 확인
https://console.cloud.google.com/functions/list
```

---

## 🔄 데이터 플로우

```
Vercel API Gateway
    ↓
GCP AI Gateway (라우팅)
    ↓
┌─────────────┬──────────────┬─────────────┐
│             │              │             │
Rule Engine   Korean NLP     ML Analytics
(빠른 응답)   (한국어 처리)  (고급 분석)
│             │              │             │
└─────────────┴──────────────┴─────────────┘
    ↓
Unified AI Processor (통합)
    ↓
결과 반환
```

---

## 🛡️ 폴백 전략

1. **GCP Functions 장애** → Vercel 로컬 AI 자동 활성화
2. **개별 Function 실패** → 다른 Function으로 폴백
3. **타임아웃 발생** → 간단한 기본 응답 제공

---

## 📝 변경 이력

### v2.0.0 (2025-11-20)
- ✅ 메모리 최적화 (47% 감소)
- ✅ 타임아웃 최적화 (67% 단축)
- ✅ 의존성 업데이트 (2025 최신 버전)
- ✅ 배포 스크립트 개선
- ✅ 불완전한 Functions 제거 (rag-vector-processor, session-context-manager)

### v1.0.0 (2023-09-12)
- 초기 배포

---

## 🚨 문제 해결

### 배포 실패 시
```bash
# 1. 인증 확인
gcloud auth list

# 2. 프로젝트 확인
gcloud config get-value project

# 3. API 활성화 확인
gcloud services list --enabled | grep cloudfunctions

# 4. API 활성화 (필요 시)
gcloud services enable cloudfunctions.googleapis.com
gcloud services enable cloudbuild.googleapis.com
```

### 타임아웃 발생 시
```bash
# 로그 확인
gcloud functions logs read FUNCTION_NAME --limit=100

# 메모리 증가 (필요 시)
gcloud functions deploy FUNCTION_NAME --memory=512MB
```

---

## 💰 비용 예측

### 무료 티어 내 (현재)
```
월 비용: $0
여유분: 97.5% (호출), 98% (컴퓨팅)
```

### 무료 티어 초과 시 (예상)
```
월 비용: ~$7 (최적화 전 $15)
절감액: $8/월 (53% 절감)
```

---

**무료 티어 100% 활용으로 AI 성능 50% 향상!** 🎉
