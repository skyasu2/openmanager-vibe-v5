# ☁️ Google Cloud 직접 접속 개발 환경 설정 가이드

> **최신 업데이트**: 2025년 7월 2일 - GCP 콘솔 직접 접속 및 개발 환경 통합
> **버전**: v5.48.0 - GCP CLI + 웹 콘솔 + 개발 도구 통합

## 📋 개요

OpenManager Vibe v5 프로젝트에서 Google Cloud Platform에 직접 접속하여 개발하고 모니터링하는 방법을 설명합니다. GCP CLI, 웹 콘솔, 그리고 프로젝트 내 개발 도구를 통합하여 효율적인 클라우드 개발 환경을 구축합니다.

### 🎯 주요 기능

- **GCP CLI 직접 접속**: 명령줄에서 GCP 리소스 관리
- **웹 콘솔 자동 접속**: 브라우저에서 GCP 대시보드 열기
- **실시간 모니터링**: 무료 티어 사용량 실시간 추적
- **개발 도구 통합**: 프로젝트 내 GCP 관리 스크립트
- **자동화된 접속**: npm 스크립트를 통한 원클릭 접속

---

## 🚀 빠른 시작

### 1. GCP 콘솔 직접 접속

```bash
# 메인 메뉴 표시
npm run gcp:console

# 특정 페이지 바로 열기
npm run gcp:console 1    # 메인 대시보드
npm run gcp:console 2    # 할당량 모니터링
npm run gcp:console 5    # Cloud Functions
npm run gcp:console 13   # 무료 한도 체크
npm run gcp:console 15   # 실시간 모니터링
```

### 2. GCP CLI 접속

```bash
# GCP CLI 상태 확인
npm run gcp:status

# 프로젝트 정보 확인
npm run gcp:info

# 리소스 목록 확인
npm run gcp:list
```

### 3. 실시간 모니터링

```bash
# 실시간 모니터링 화면
npm run gcp:monitor

# 무료 한도 체크
npm run gcp:quota-check

# 알림 설정
npm run gcp:alert setup
```

---

## 🔧 사전 설정

### 1. GCP CLI 설치

#### Windows (PowerShell)

```powershell
# GCP CLI 설치
winget install Google.CloudSDK

# 또는 수동 설치
# https://cloud.google.com/sdk/docs/install

# 환경 변수 설정
$env:PATH += ";C:\Program Files\Google\Cloud SDK\google-cloud-sdk\bin"
```

#### macOS

```bash
# Homebrew로 설치
brew install --cask google-cloud-sdk

# 또는 수동 설치
curl https://sdk.cloud.google.com | bash
exec -l $SHELL
```

#### Linux (Ubuntu/Debian)

```bash
# 공식 설치 스크립트
curl https://sdk.cloud.google.com | bash
exec -l $SHELL

# 또는 apt로 설치
echo "deb [signed-by=/usr/share/keyrings/cloud.google.gpg] https://packages.cloud.google.com/apt cloud-sdk main" | sudo tee -a /etc/apt/sources.list.d/google-cloud-sdk.list
curl https://packages.cloud.google.com/apt/doc/apt-key.gpg | sudo apt-key --keyring /usr/share/keyrings/cloud.google.gpg add -
sudo apt-get update && sudo apt-get install google-cloud-cli
```

### 2. GCP 인증 설정

```bash
# GCP 계정 로그인
gcloud auth login

# 프로젝트 설정
gcloud config set project openmanager-ai

# 리전 설정
gcloud config set compute/region asia-northeast3
gcloud config set functions/region asia-northeast3

# 현재 설정 확인
gcloud config list
```

### 3. 필수 API 활성화

```bash
# Cloud Functions API
gcloud services enable cloudfunctions.googleapis.com

# Cloud Build API
gcloud services enable cloudbuild.googleapis.com

# Compute Engine API
gcloud services enable compute.googleapis.com

# Cloud Storage API
gcloud services enable storage.googleapis.com

# Cloud Resource Manager API
gcloud services enable cloudresourcemanager.googleapis.com
```

---

## 🛠️ 개발 도구 설정

### 1. 프로젝트 스크립트 확인

```bash
# package.json의 GCP 관련 스크립트 확인
npm run | grep gcp

# 사용 가능한 명령어:
# gcp:console     - GCP 콘솔 접속
# gcp:status      - GCP 상태 확인
# gcp:monitor     - 실시간 모니터링
# gcp:quota-check - 무료 한도 체크
# gcp:alert       - 알림 설정
```

### 2. 환경 변수 설정

```bash
# .env.local에 GCP 설정 추가
GCP_PROJECT_ID=openmanager-ai
GCP_REGION=asia-northeast3
GCP_ZONE=asia-northeast3-a

# GCP Functions 설정
GCP_FUNCTIONS_ENABLED=true
GCP_FUNCTIONS_BASE_URL=https://asia-northeast3-openmanager-ai.cloudfunctions.net

# VM 설정
GCP_VM_INSTANCE=mcp-server
GCP_VM_IP=104.154.205.25
GCP_VM_PORT=10000
```

### 3. 개발 도구 스크립트

#### GCP 콘솔 접속 스크립트

```javascript
// scripts/gcp-console-helper.js
const { exec } = require('child_process');
const open = require('open');

const GCP_CONSOLE_URLS = {
  1: 'https://console.cloud.google.com/home/dashboard',
  2: 'https://console.cloud.google.com/apis/credentials',
  3: 'https://console.cloud.google.com/apis/library',
  4: 'https://console.cloud.google.com/apis/api/cloudfunctions.googleapis.com/metrics',
  5: 'https://console.cloud.google.com/functions',
  6: 'https://console.cloud.google.com/compute/instances',
  7: 'https://console.cloud.google.com/storage/browser',
  8: 'https://console.cloud.google.com/logs',
  9: 'https://console.cloud.google.com/monitoring',
  10: 'https://console.cloud.google.com/billing',
  11: 'https://console.cloud.google.com/iam-admin',
  12: 'https://console.cloud.google.com/apis/api/cloudfunctions.googleapis.com/quotas',
  13: 'https://console.cloud.google.com/billing/linkedaccount',
  14: 'https://console.cloud.google.com/apis/api/cloudfunctions.googleapis.com/overview',
  15: 'https://console.cloud.google.com/monitoring/dashboards',
};

function openGCPConsole(page = 1) {
  const url = GCP_CONSOLE_URLS[page] || GCP_CONSOLE_URLS[1];
  console.log(`🌐 GCP 콘솔 열기: ${url}`);
  open(url);
}

module.exports = { openGCPConsole };
```

#### GCP 상태 확인 스크립트

```javascript
// scripts/gcp-status-checker.js
const { exec } = require('child_process');

async function checkGCPStatus() {
  try {
    // 프로젝트 정보 확인
    const projectInfo = await execCommand('gcloud config get-value project');
    console.log(`📋 프로젝트: ${projectInfo}`);

    // 리전 정보 확인
    const regionInfo = await execCommand(
      'gcloud config get-value compute/region'
    );
    console.log(`🌍 리전: ${regionInfo}`);

    // Functions 상태 확인
    const functionsStatus = await execCommand(
      'gcloud functions list --region=asia-northeast3 --format="table(name,status,memory,timeout)"'
    );
    console.log(`⚡ Cloud Functions:\n${functionsStatus}`);

    // VM 상태 확인
    const vmStatus = await execCommand(
      'gcloud compute instances list --filter="name:mcp-server" --format="table(name,status,zone,externalIP)"'
    );
    console.log(`🖥️ Compute Engine:\n${vmStatus}`);
  } catch (error) {
    console.error('❌ GCP 상태 확인 실패:', error.message);
  }
}

function execCommand(command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) reject(error);
      else resolve(stdout.trim());
    });
  });
}

module.exports = { checkGCPStatus };
```

---

## 📊 실시간 모니터링

### 1. 무료 티어 사용량 모니터링

```bash
# 실시간 모니터링 시작
npm run gcp:monitor

# 출력 예시:
# 🎯 GCP 무료 한도 실시간 모니터링
# 📅 2025-07-02 15:30:00 (KST)
# 🔗 프로젝트: openmanager-ai | 지역: asia-northeast3
#
# ⚡ Cloud Functions
#    호출 수: ████████████████████████████████  2.3% (45,000/2,000,000)
#    GB-초: ████████████████████████████████  1.9% (7,500/400,000)
#    네트워크 송신: ████████████████████████████████  16.0% (0.8/5)
#
# 🖥️ Compute Engine
#    CPU 사용률: ████████████████████████████████  28.31%
#    메모리 사용률: ████████████████████████████████  45.2%
#    네트워크: ████████████████████████████████  12.5% (1.25/10)
#
# 💾 Cloud Storage
#    사용량: ████████████████████████████████  16.0% (0.8/5)
#    파일 수: 45개
```

### 2. 알림 설정

```bash
# 알림 설정
npm run gcp:alert setup

# 테스트 알림 발송
npm run gcp:alert test

# 알림 임계값 설정
npm run gcp:alert config
```

### 3. 상세 보고서 생성

```bash
# 종합 보고서 생성
npm run gcp:quota-report

# 생성된 보고서 위치
# reports/gcp-quota-report-[timestamp].md
```

---

## 🔧 개발 환경 통합

### 1. GCP Functions 개발

```bash
# Functions 목록 확인
gcloud functions list --region=asia-northeast3

# 특정 Function 로그 확인
gcloud functions logs read ai-gateway --region=asia-northeast3 --limit=10

# Function 재배포
cd gcp-functions/ai-gateway
gcloud functions deploy ai-gateway --source=. --region=asia-northeast3

# Function 테스트
curl -X POST https://asia-northeast3-openmanager-ai.cloudfunctions.net/ai-gateway \
  -H "Content-Type: application/json" \
  -d '{"query": "테스트", "context": {}, "mode": "test"}'
```

### 2. Compute Engine VM 관리

```bash
# VM 상태 확인
gcloud compute instances describe mcp-server --zone=asia-northeast3-a

# VM SSH 접속
gcloud compute ssh mcp-server --zone=asia-northeast3-a

# VM 재시작
gcloud compute instances reset mcp-server --zone=asia-northeast3-a

# VM 로그 확인
gcloud compute instances get-serial-port-output mcp-server --zone=asia-northeast3-a
```

### 3. Cloud Storage 관리

```bash
# 버킷 목록 확인
gsutil ls

# 파일 업로드
gsutil cp local-file.txt gs://openmanager-ai-bucket/

# 파일 다운로드
gsutil cp gs://openmanager-ai-bucket/remote-file.txt ./

# 버킷 내용 확인
gsutil ls gs://openmanager-ai-bucket/
```

---

## 🚨 문제 해결

### 1. GCP CLI 인증 문제

```bash
# 인증 상태 확인
gcloud auth list

# 재인증
gcloud auth login

# 서비스 계정 키 사용 (선택사항)
gcloud auth activate-service-account --key-file=path/to/service-account-key.json
```

### 2. 프로젝트 접근 권한 문제

```bash
# 현재 프로젝트 확인
gcloud config get-value project

# 프로젝트 변경
gcloud config set project openmanager-ai

# 권한 확인
gcloud projects get-iam-policy openmanager-ai
```

### 3. API 활성화 문제

```bash
# 활성화된 API 확인
gcloud services list --enabled

# 필요한 API 활성화
gcloud services enable cloudfunctions.googleapis.com
gcloud services enable compute.googleapis.com
gcloud services enable storage.googleapis.com
```

### 4. 리전 설정 문제

```bash
# 현재 리전 확인
gcloud config get-value compute/region
gcloud config get-value functions/region

# 리전 설정
gcloud config set compute/region asia-northeast3
gcloud config set functions/region asia-northeast3
```

---

## 📈 성능 최적화

### 1. GCP Functions 최적화

```bash
# Functions 메모리 최적화
gcloud functions deploy ai-gateway \
  --memory=256MB \
  --timeout=60s \
  --region=asia-northeast3

# 콜드 스타트 최소화
gcloud functions deploy ai-gateway \
  --min-instances=0 \
  --max-instances=10 \
  --region=asia-northeast3
```

### 2. Compute Engine 최적화

```bash
# VM 스케줄링 최적화
gcloud compute instances set-scheduling mcp-server \
  --maintenance-policy=MIGRATE \
  --zone=asia-northeast3-a

# 자동 스케일링 설정
gcloud compute instance-groups managed set-autoscaling mcp-server-group \
  --max-num-replicas=3 \
  --min-num-replicas=1 \
  --target-cpu-utilization=0.6 \
  --zone=asia-northeast3-a
```

### 3. 비용 최적화

```bash
# 무료 티어 사용량 확인
gcloud billing accounts list
gcloud billing projects describe openmanager-ai

# 예산 알림 설정
gcloud billing budgets create \
  --billing-account=YOUR_BILLING_ACCOUNT \
  --display-name="OpenManager Budget" \
  --budget-amount=0.00USD \
  --threshold-rule=percent=80
```

---

## 🔒 보안 설정

### 1. IAM 권한 관리

```bash
# 현재 사용자 확인
gcloud auth list

# 서비스 계정 생성 (필요시)
gcloud iam service-accounts create openmanager-service \
  --display-name="OpenManager Service Account"

# 권한 부여
gcloud projects add-iam-policy-binding openmanager-ai \
  --member="serviceAccount:openmanager-service@openmanager-ai.iam.gserviceaccount.com" \
  --role="roles/cloudfunctions.developer"
```

### 2. 방화벽 규칙 설정

```bash
# VM 방화벽 규칙 확인
gcloud compute firewall-rules list

# 특정 포트 허용
gcloud compute firewall-rules create allow-mcp-server \
  --allow tcp:10000 \
  --source-ranges 0.0.0.0/0 \
  --target-tags mcp-server
```

### 3. 암호화 설정

```bash
# Cloud Storage 암호화 확인
gsutil kms list gs://openmanager-ai-bucket

# 고객 관리 암호화 키 설정 (선택사항)
gcloud kms keys create openmanager-key \
  --keyring=openmanager-keyring \
  --location=asia-northeast3 \
  --purpose=encryption
```

---

## 📚 참고 자료

### 공식 문서

- [GCP CLI 설치 가이드](https://cloud.google.com/sdk/docs/install)
- [Cloud Functions 문서](https://cloud.google.com/functions/docs)
- [Compute Engine 문서](https://cloud.google.com/compute/docs)
- [Cloud Storage 문서](https://cloud.google.com/storage/docs)

### 프로젝트 내 문서

- [GCP 통합 가이드](./gcp-complete-guide.md)
- [배포 완전 가이드](./deployment-complete-guide.md)
- [무료 티어 설정 가이드](./archive/FREE_TIER_SETUP.md)

### 유용한 명령어

```bash
# GCP CLI 도움말
gcloud help

# 특정 명령어 도움말
gcloud functions deploy --help

# 설정 확인
gcloud config list

# 버전 확인
gcloud version
```

---

## 🎉 완료 체크리스트

### 기본 설정 ✅

- [ ] GCP CLI 설치 완료
- [ ] GCP 계정 인증 완료
- [ ] 프로젝트 설정 완료
- [ ] 필수 API 활성화 완료

### 개발 도구 ✅

- [ ] npm 스크립트 설정 완료
- [ ] 환경 변수 설정 완료
- [ ] 콘솔 접속 테스트 완료
- [ ] 모니터링 도구 설정 완료

### 보안 설정 ✅

- [ ] IAM 권한 확인 완료
- [ ] 방화벽 규칙 설정 완료
- [ ] 암호화 설정 완료
- [ ] 서비스 계정 설정 완료

### 최적화 ✅

- [ ] Functions 최적화 완료
- [ ] VM 최적화 완료
- [ ] 비용 최적화 완료
- [ ] 성능 모니터링 설정 완료

---

**문서 생성 날짜**: 2025년 7월 2일  
**최종 업데이트**: 2025년 7월 2일  
**버전**: v5.48.0
