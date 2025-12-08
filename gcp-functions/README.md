# 🚀 OpenManager GCP Cloud Run

> **최종 업데이트**: 2025-12-09
> **버전**: 3.1.0
> **상태**: 통합 완료 ✅ (1 Service - Cloud Run)

Vercel AI 엔진 기능을 GCP Cloud Run으로 통합한 단일 서비스

---

## 📊 아키텍처 변경 (v3.0.0)

### Before (Cloud Functions - 6 Services)
```
❌ ai-gateway            (Node.js - 배포 실패)
❌ health                (Node.js - 배포 실패)
❌ rule-engine           (Node.js - 배포 실패)
❌ enhanced-korean-nlp   (Python - 중복)
❌ ml-analytics-engine   (Python - 중복)
✅ unified-ai-processor  (Python - 활성)
```

### After (Cloud Run - 1 Service)
```
✅ unified-ai-processor  (Python/Flask - 모든 기능 통합)
```

**변경 이유**:
- Cloud Functions Gen2 health check 요구사항으로 Node.js 함수 배포 실패
- Python 서비스 간 기능 중복 해소
- 단일 배포 단위로 유지보수 간소화

---

## 🔗 엔드포인트

```
Base URL: Cloud Run URL (배포 후 확인)

POST /process   - 통합 AI 처리 (메인)
GET  /health    - 헬스체크
POST /gateway   - 게이트웨이 라우팅
POST /rules     - 규칙 엔진
POST /smart     - 스마트 처리 (fast-path + intelligent routing)
GET  /stats     - 통계 정보
```

---

## 🧪 API 테스트

### Health Check
```bash
curl http://localhost:8080/health
```

**응답 예시**:
```json
{
  "status": "healthy",
  "version": "3.1.0",
  "modules": {
    "nlp_engine": "initialized",
    "ml_engine": "initialized",
    "gateway_router": "ready",
    "rule_engine": "ready"
  },
  "timestamp": "2025-12-09T00:00:00Z"
}
```

### Smart Processing (권장)
```bash
curl -X POST http://localhost:8080/smart \
  -H "Content-Type: application/json" \
  -d '{"query": "서버 상태 확인해줘"}'
```

**응답 예시**:
```json
{
  "success": true,
  "response": "서버 상태를 확인해보겠습니다. 현재 모든 서버가 정상 운영 중입니다.",
  "source": "rule_engine",
  "fast_path": true,
  "confidence": 0.9,
  "routing": {
    "primary_processor": "rule_engine",
    "mode": "auto_rule"
  },
  "processing_time_ms": 5.2
}
```

### Gateway Routing
```bash
curl -X POST http://localhost:8080/gateway \
  -H "Content-Type: application/json" \
  -d '{"query": "CPU 사용량 분석해줘", "mode": "auto"}'
```

### Rule Engine
```bash
curl -X POST http://localhost:8080/rules \
  -H "Content-Type: application/json" \
  -d '{"query": "안녕하세요"}'
```

---

## 📁 구조

```
gcp-functions/
├── unified-ai-processor/     # ✅ 통합 Cloud Run 서비스
│   ├── main.py               # Flask 앱 (모든 엔드포인트)
│   ├── Dockerfile            # Cloud Run 컨테이너
│   ├── requirements.txt      # Python 의존성
│   └── modules/
│       ├── nlp_engine.py     # 한국어 + 영어 NLP
│       ├── ml_engine.py      # ML Analytics
│       ├── gateway.py        # 지능형 라우팅
│       └── rule_engine.py    # 규칙 기반 응답
├── deployment/               # 배포 스크립트
├── DEPRECATION_NOTICE.md     # 폐기 서비스 문서
└── README.md                 # 이 파일
```

---

## 🔧 로컬 개발

### Docker 실행
```bash
cd gcp-functions/unified-ai-processor

# 빌드
docker build -t unified-ai-processor .

# 실행
docker run -p 8080:8080 unified-ai-processor
```

### Docker Compose (개발)
```bash
cd gcp-functions
docker-compose -f docker-compose.dev.yml up
```

---

## 🚀 Cloud Run 배포

### 사전 준비
```bash
# GCP 인증
gcloud auth login

# 환경 변수 설정
export GCP_PROJECT_ID="openmanager-free-tier"
export GCP_REGION="asia-northeast3"
```

### 배포
```bash
cd gcp-functions/unified-ai-processor

# 이미지 빌드 및 푸시
gcloud builds submit --tag gcr.io/$GCP_PROJECT_ID/unified-ai-processor

# Cloud Run 배포
gcloud run deploy unified-ai-processor \
  --image gcr.io/$GCP_PROJECT_ID/unified-ai-processor \
  --platform managed \
  --region $GCP_REGION \
  --allow-unauthenticated \
  --memory 512Mi \
  --timeout 120s
```

---

## 📦 오픈소스 의존성

> **최종 정리**: 2025-12-09 (미사용 라이브러리 6개 제거)

### Python 라이브러리 (9개)

| 카테고리 | 라이브러리 | 버전 | 용도 | 라이선스 |
|----------|-----------|------|------|----------|
| **Web Framework** | Flask | 3.0.3 | REST API 서버 | BSD-3 |
| | Gunicorn | Latest | WSGI HTTP Server (Docker) | MIT |
| **Data Science** | NumPy | 1.26.4 | 수치 계산, 배열 연산 | BSD-3 |
| | Pandas | 2.2.3 | 데이터 분석, DataFrame | BSD-3 |
| **Machine Learning** | scikit-learn | 1.5.2 | ML 알고리즘 (KMeans, TF-IDF, LogisticRegression) | BSD-3 |
| | statsmodels | 0.14.4 | 통계 모델, Holt-Winters 시계열 예측 | BSD-3 |
| **NLP (English)** | spaCy | 3.7.4 | 영어 NLP (NER, 토큰화) | MIT |
| | en_core_web_sm | 3.7.1 | spaCy 영어 모델 | MIT |
| **Networking** | httpx | 0.27.0 | 비동기 HTTP 클라이언트 | BSD-3 |
| **Caching** | cachetools | 5.3.3 | TTL 캐시 (응답 캐싱) | MIT |
| **Monitoring** | structlog | 24.4.0 | 구조화된 로깅 | MIT |

### 제거된 라이브러리 (2025-12-09)

| 라이브러리 | 제거 이유 |
|-----------|----------|
| KoNLPy 0.6.0 | 규칙 기반 패턴 매칭으로 대체 (Java 의존성 제거) |
| soynlp 0.0.493 | 미사용 |
| regex | 표준 라이브러리 `re` 사용 |
| orjson | 표준 `json` 모듈 사용 |
| google-cloud-storage | GCS 연동 미사용 |
| google-cloud-pubsub | Pub/Sub 연동 미사용 |

### 시스템 의존성 (Docker)

| 컴포넌트 | 버전 | 용도 |
|----------|------|------|
| Python | 3.10-slim | 런타임 환경 |
| build-essential | Latest | C 확장 컴파일 |
| g++ | Latest | C++ 의존성 빌드 (spaCy, scikit-learn) |

> **참고**: Java (OpenJDK)는 KoNLPy 제거로 더 이상 필요하지 않음 → Docker 이미지 크기 대폭 감소

### ML 알고리즘 사용 현황

```
┌─────────────────────────────────────────────────────────────┐
│                    ML 알고리즘 스택                           │
├─────────────────────────────────────────────────────────────┤
│  Intent Classification                                       │
│  ├─ TF-IDF Vectorizer (ngram_range=1-2)                     │
│  └─ Logistic Regression (C=10.0)                            │
├─────────────────────────────────────────────────────────────┤
│  Anomaly Detection                                           │
│  └─ Z-Score Method (threshold: 3σ)                          │
├─────────────────────────────────────────────────────────────┤
│  Time Series Forecasting                                     │
│  ├─ Holt-Winters Exponential Smoothing (primary)            │
│  └─ Linear Regression (fallback)                            │
├─────────────────────────────────────────────────────────────┤
│  Server Clustering                                           │
│  └─ K-Means (n_clusters=3, StandardScaler 정규화)           │
├─────────────────────────────────────────────────────────────┤
│  NLP Processing                                              │
│  ├─ spaCy NER (en_core_web_sm) - 영어                       │
│  └─ Rule-based Pattern Matching - 한국어 (표준 re 모듈)     │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 모듈 상세

### nlp_engine.py
- **기능**: 한국어 + 영어 NLP 처리
- **의존성**: spaCy (en_core_web_sm), konlpy, soynlp
- **분류기**: TF-IDF + Logistic Regression (Hybrid)

### ml_engine.py
- **기능**: ML 기반 메트릭 분석
- **의존성**: scikit-learn, numpy, pandas, statsmodels
- **분석**: 이상 탐지, 추세 분석, 패턴 인식

### gateway.py
- **기능**: 쿼리 기반 지능형 라우팅
- **라우팅 모드**: korean, rule, ml, unified, auto
- **자동 감지**: 한국어 여부, 복잡도, 서버 컨텍스트 필요 여부

### rule_engine.py
- **기능**: 규칙 기반 빠른 응답 (Fast-path)
- **규칙 카테고리**: server, monitoring, notification, faq, commands
- **매칭 유형**: pattern (정규식), keyword, fuzzy, fallback

---

## 🎯 무료 티어 최적화

### 예상 사용량 (단일 서비스)

| 리소스 | 무료 한도 | 예상 사용량 | 사용률 |
|--------|-----------|-------------|--------|
| 호출 횟수 | 2,000,000회/월 | 50,000회/월 | 2.5% |
| 컴퓨팅 | 180,000 vCPU-초/월 | 5,000 vCPU-초/월 | 2.8% |
| 메모리 | 360,000 GiB-초/월 | 10,000 GiB-초/월 | 2.8% |
| 네트워크 | 1GB/월 무료 | 0.2GB/월 | 20% |

### 비용

```
월 비용: $0 (무료 티어 내)
```

---

## 🔄 데이터 플로우

```
Vercel API Gateway
    ↓
unified-ai-processor (Cloud Run)
    │
    ├─ /smart (권장)
    │   ├─ Rule Engine (fast-path)
    │   │   └─ 매칭 시 즉시 응답
    │   └─ Gateway Router
    │       └─ NLP/ML 처리
    │
    ├─ /process (통합 처리)
    │   ├─ NLP Engine
    │   ├─ ML Engine
    │   └─ Rule Engine
    │   └─ 결과 집계
    │
    └─ /gateway, /rules (개별 접근)
```

---

## 🛡️ 폴백 전략

1. **Cloud Run 장애** → Vercel 로컬 AI 자동 활성화
2. **개별 모듈 실패** → 다른 모듈로 폴백 (processor_weights 기반)
3. **타임아웃 발생** → Rule Engine fallback 응답

---

## 📝 변경 이력

### v3.1.0 (2025-12-09)
- ✅ Gateway 모듈 통합 (ai-gateway → gateway.py)
- ✅ Rule Engine 모듈 통합 (rule-engine → rule_engine.py)
- ✅ Health 엔드포인트 추가
- ✅ Smart 엔드포인트 추가 (fast-path + routing)
- ✅ 중복 서비스 제거 (5개 → 1개)

### v3.0.0 (2025-12-08)
- ✅ Cloud Functions → Cloud Run 마이그레이션
- ✅ Python 서비스 통합 시작

### v2.0.0 (2025-11-20)
- ✅ 메모리 최적화
- ✅ Cloud Functions Gen2 시도 (Node.js 실패)

---

## 🚨 문제 해결

### 로컬 테스트 실패
```bash
# spaCy 모델 다운로드
python -m spacy download en_core_web_sm

# 의존성 재설치
pip install -r requirements.txt
```

### Docker 빌드 실패
```bash
# 캐시 없이 빌드
docker build --no-cache -t unified-ai-processor .

# 로그 확인
docker logs <container_id>
```

### Cloud Run 배포 실패
```bash
# 로그 확인
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=unified-ai-processor" --limit=50

# 서비스 상태 확인
gcloud run services describe unified-ai-processor --region=$GCP_REGION
```

---

**단일 서비스로 모든 AI 기능 통합 완료!** 🎉
