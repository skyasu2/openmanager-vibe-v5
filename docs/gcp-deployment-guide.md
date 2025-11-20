# 🚀 GCP Functions 배포 가이드

> **작성일**: 2025-11-20  
> **대상**: OpenManager VIBE v5 GCP Functions 배포

---

## 📋 현재 .env.local 설정 확인

### GCP 프로젝트 정보
```bash
GOOGLE_CLOUD_PROJECT=openmanager-free-tier
GCP_VM_NAME=gcp-server
GCP_VM_ZONE=us-central1-a
GCP_VM_EXTERNAL_IP=35.209.146.37
```

### GCP Functions URL
```bash
NEXT_PUBLIC_GCP_FUNCTIONS_URL=https://asia-northeast3-openmanager-free-tier.cloudfunctions.net
```

**리전**: `asia-northeast3` (서울)

---

## 🔧 배포 전 환경 변수 설정

### 1. 터미널에서 환경 변수 설정

```bash
# GCP 프로젝트 ID
export GCP_PROJECT_ID="openmanager-free-tier"

# GCP 리전 (서울)
export GCP_REGION="asia-northeast3"

# 확인
echo "프로젝트: $GCP_PROJECT_ID"
echo "리전: $GCP_REGION"
```

### 2. GCP 인증

```bash
# 로그인
gcloud auth login

# 프로젝트 설정
gcloud config set project openmanager-free-tier

# 현재 설정 확인
gcloud config list
```

---

## 🚀 배포 실행

### 방법 1: 자동 배포 스크립트 (권장)

```bash
cd /mnt/d/cursor/openmanager-vibe-v5/gcp-functions/deployment
./deploy-optimized.sh
```

**특징**:
- ✅ 환경 변수 자동 검증
- ✅ 6개 Functions 일괄 배포
- ✅ 배포 후 자동 검증
- ✅ 에러 발생 시 상세 로그

### 방법 2: 개별 배포

#### Python Functions

```bash
# 1. enhanced-korean-nlp
cd /mnt/d/cursor/openmanager-vibe-v5/gcp-functions/enhanced-korean-nlp
gcloud functions deploy enhanced-korean-nlp \
  --runtime python310 \
  --trigger-http \
  --allow-unauthenticated \
  --memory=256MB \
  --timeout=60s \
  --region=asia-northeast3 \
  --entry-point=main

# 2. ml-analytics-engine
cd /mnt/d/cursor/openmanager-vibe-v5/gcp-functions/ml-analytics-engine
gcloud functions deploy ml-analytics-engine \
  --runtime python310 \
  --trigger-http \
  --allow-unauthenticated \
  --memory=384MB \
  --timeout=45s \
  --region=asia-northeast3 \
  --entry-point=main

# 3. unified-ai-processor
cd /mnt/d/cursor/openmanager-vibe-v5/gcp-functions/unified-ai-processor
gcloud functions deploy unified-ai-processor \
  --runtime python310 \
  --trigger-http \
  --allow-unauthenticated \
  --memory=512MB \
  --timeout=120s \
  --region=asia-northeast3 \
  --entry-point=main
```

#### Node.js Functions

```bash
# 4. ai-gateway
cd /mnt/d/cursor/openmanager-vibe-v5/gcp-functions/ai-gateway
gcloud functions deploy ai-gateway \
  --runtime nodejs20 \
  --trigger-http \
  --allow-unauthenticated \
  --memory=256MB \
  --timeout=60s \
  --region=asia-northeast3 \
  --entry-point=aiGateway

# 5. health-check
cd /mnt/d/cursor/openmanager-vibe-v5/gcp-functions/health
gcloud functions deploy health-check \
  --runtime nodejs20 \
  --trigger-http \
  --allow-unauthenticated \
  --memory=128MB \
  --timeout=10s \
  --region=asia-northeast3 \
  --entry-point=healthCheck

# 6. rule-engine
cd /mnt/d/cursor/openmanager-vibe-v5/gcp-functions/rule-engine
gcloud functions deploy rule-engine \
  --runtime nodejs20 \
  --trigger-http \
  --allow-unauthenticated \
  --memory=256MB \
  --timeout=30s \
  --region=asia-northeast3 \
  --entry-point=ruleEngine
```

---

## ✅ 배포 후 검증

### 1. Functions 목록 확인

```bash
gcloud functions list --region=asia-northeast3
```

**예상 출력**:
```
NAME                    STATUS  TRIGGER       REGION
ai-gateway              ACTIVE  HTTP Trigger  asia-northeast3
enhanced-korean-nlp     ACTIVE  HTTP Trigger  asia-northeast3
health-check            ACTIVE  HTTP Trigger  asia-northeast3
ml-analytics-engine     ACTIVE  HTTP Trigger  asia-northeast3
rule-engine             ACTIVE  HTTP Trigger  asia-northeast3
unified-ai-processor    ACTIVE  HTTP Trigger  asia-northeast3
```

### 2. 개별 Function 상세 정보

```bash
gcloud functions describe enhanced-korean-nlp --region=asia-northeast3
```

### 3. 헬스체크 테스트

```bash
# health-check Function 테스트
curl https://asia-northeast3-openmanager-free-tier.cloudfunctions.net/health-check
```

**예상 응답**:
```json
{
  "status": "healthy",
  "timestamp": "2025-11-20T11:14:35.000Z",
  "functions": {
    "ai-gateway": "active",
    "enhanced-korean-nlp": "active",
    "ml-analytics-engine": "active",
    "rule-engine": "active",
    "unified-ai-processor": "active"
  }
}
```

---

## 📊 배포 후 모니터링

### 1. 로그 확인

```bash
# 최근 50개 로그
gcloud functions logs read enhanced-korean-nlp --limit=50

# 실시간 로그 스트리밍
gcloud functions logs read enhanced-korean-nlp --limit=10 --follow
```

### 2. Cloud Console에서 확인

```
https://console.cloud.google.com/functions/list?project=openmanager-free-tier
```

**확인 항목**:
- ✅ 호출 횟수
- ✅ 평균 실행 시간
- ✅ 에러 발생률
- ✅ 메모리 사용량

### 3. 무료 티어 사용량 확인

```bash
# 스크립트 실행
cd /mnt/d/cursor/openmanager-vibe-v5/gcp-functions/deployment
./monitor-usage.sh
```

---

## 🚨 문제 해결

### 배포 실패 시

#### 1. API 활성화 확인
```bash
# Cloud Functions API 확인
gcloud services list --enabled | grep cloudfunctions

# 활성화 (필요 시)
gcloud services enable cloudfunctions.googleapis.com
gcloud services enable cloudbuild.googleapis.com
```

#### 2. 권한 확인
```bash
# 현재 계정 확인
gcloud auth list

# 프로젝트 권한 확인
gcloud projects get-iam-policy openmanager-free-tier
```

#### 3. 빌드 로그 확인
```bash
# 최근 빌드 로그
gcloud builds list --limit=5

# 특정 빌드 상세
gcloud builds describe BUILD_ID
```

### 타임아웃 발생 시

```bash
# 타임아웃 증가 (필요 시)
gcloud functions deploy FUNCTION_NAME \
  --timeout=120s \
  --update-timeout
```

### 메모리 부족 시

```bash
# 메모리 증가 (필요 시)
gcloud functions deploy FUNCTION_NAME \
  --memory=512MB \
  --update-memory
```

---

## 🔄 업데이트 배포

### 코드 변경 후 재배포

```bash
# 1. 변경사항 커밋
git add .
git commit -m "feat: GCP Functions 업데이트"

# 2. 재배포
cd /mnt/d/cursor/openmanager-vibe-v5/gcp-functions/deployment
./deploy-optimized.sh
```

### 특정 Function만 업데이트

```bash
cd /mnt/d/cursor/openmanager-vibe-v5/gcp-functions/enhanced-korean-nlp
gcloud functions deploy enhanced-korean-nlp \
  --runtime python310 \
  --trigger-http \
  --allow-unauthenticated \
  --memory=256MB \
  --timeout=60s \
  --region=asia-northeast3
```

---

## 🗑️ Functions 삭제

### 개별 삭제
```bash
gcloud functions delete FUNCTION_NAME --region=asia-northeast3
```

### 전체 삭제
```bash
# 주의: 모든 Functions 삭제
gcloud functions list --region=asia-northeast3 --format="value(name)" | \
  xargs -I {} gcloud functions delete {} --region=asia-northeast3 --quiet
```

---

## 💰 비용 관리

### 무료 티어 한도
```
호출: 2,000,000회/월
컴퓨팅: 400,000 GB-초/월
네트워크: 5 GB/월
```

### 현재 예상 사용량
```
호출: 50,000회/월 (2.5%)
컴퓨팅: 8,000 GB-초/월 (2.0%)
네트워크: 0.3 GB/월 (6%)
```

### 비용 알림 설정

```bash
# Cloud Console에서 설정
https://console.cloud.google.com/billing/budgets?project=openmanager-free-tier

# 알림 임계값 권장
- 50% 사용 시 경고
- 80% 사용 시 알림
- 90% 사용 시 긴급 알림
```

---

## 📝 체크리스트

### 배포 전
- [ ] GCP 프로젝트 ID 확인
- [ ] 환경 변수 설정 (`GCP_PROJECT_ID`, `GCP_REGION`)
- [ ] GCP 인증 완료 (`gcloud auth login`)
- [ ] API 활성화 확인

### 배포 중
- [ ] 배포 스크립트 실행
- [ ] 에러 없이 완료 확인
- [ ] 6개 Functions 모두 배포 확인

### 배포 후
- [ ] Functions 목록 확인
- [ ] 헬스체크 테스트
- [ ] 로그 확인
- [ ] 무료 티어 사용량 확인
- [ ] .env.local URL 업데이트 (필요 시)

---

## 🔗 참고 링크

- [GCP Functions 문서](https://cloud.google.com/functions/docs)
- [무료 티어 한도](https://cloud.google.com/free/docs/gcp-free-tier)
- [Cloud Console](https://console.cloud.google.com/functions/list?project=openmanager-free-tier)

---

**작성자**: Kiro AI  
**최종 업데이트**: 2025-11-20
