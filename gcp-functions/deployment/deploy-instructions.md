# 🚀 GCP Functions 배포 실행 가이드

> **gcloud CLI 설치 완료**: ✅  
> **버전**: Google Cloud SDK 548.0.0  
> **다음 단계**: 인증 및 배포

---

## 1️⃣ GCP 인증 (필수)

### 방법 A: 브라우저 인증 (권장)

```bash
# gcloud 경로 추가
export PATH="/tmp/google-cloud-sdk/bin:$PATH"

# 인증 시작 (브라우저 자동 열림)
gcloud auth login

# 프로젝트 설정
gcloud config set project openmanager-free-tier
```

### 방법 B: 서비스 계정 키 사용

```bash
# 1. GCP Console에서 서비스 계정 키 다운로드
# https://console.cloud.google.com/iam-admin/serviceaccounts?project=openmanager-free-tier

# 2. 키 파일로 인증
gcloud auth activate-service-account --key-file=/path/to/key.json

# 3. 프로젝트 설정
gcloud config set project openmanager-free-tier
```

---

## 2️⃣ 배포 실행

### 자동 배포 (전체 Functions)

```bash
# 환경 변수 설정
export PATH="/tmp/google-cloud-sdk/bin:$PATH"
export GCP_PROJECT_ID="openmanager-free-tier"
export GCP_REGION="asia-northeast3"

# 배포 스크립트 실행
cd /mnt/d/cursor/openmanager-vibe-v5/gcp-functions/deployment
./deploy-optimized.sh
```

### 수동 배포 (개별 Function)

```bash
export PATH="/tmp/google-cloud-sdk/bin:$PATH"

# Python Function 예시
cd /mnt/d/cursor/openmanager-vibe-v5/gcp-functions/enhanced-korean-nlp
gcloud functions deploy enhanced-korean-nlp \
  --runtime python310 \
  --trigger-http \
  --allow-unauthenticated \
  --memory=256MB \
  --timeout=60s \
  --region=asia-northeast3 \
  --entry-point=main

# Node.js Function 예시
cd /mnt/d/cursor/openmanager-vibe-v5/gcp-functions/ai-gateway
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

## 3️⃣ 배포 확인

```bash
export PATH="/tmp/google-cloud-sdk/bin:$PATH"

# Functions 목록
gcloud functions list --region=asia-northeast3

# 헬스체크
curl https://asia-northeast3-openmanager-free-tier.cloudfunctions.net/health-check
```

---

## 🔧 현재 상태

- ✅ gcloud CLI 설치 완료 (`/tmp/google-cloud-sdk/bin/gcloud`)
- ⏳ 인증 대기 중 (위 방법 A 또는 B 실행 필요)
- ⏳ 배포 대기 중

---

## 📝 빠른 실행 (복사 & 붙여넣기)

```bash
# 1. 경로 추가
export PATH="/tmp/google-cloud-sdk/bin:$PATH"

# 2. 인증
gcloud auth login

# 3. 프로젝트 설정
gcloud config set project openmanager-free-tier

# 4. 환경 변수
export GCP_PROJECT_ID="openmanager-free-tier"
export GCP_REGION="asia-northeast3"

# 5. 배포
cd /mnt/d/cursor/openmanager-vibe-v5/gcp-functions/deployment
./deploy-optimized.sh
```

---

**다음 단계**: 위 명령어를 WSL 터미널에서 실행하세요.
