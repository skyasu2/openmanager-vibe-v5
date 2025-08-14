# GCP 인증 및 VM 복구 가이드

## 📅 작성일: 2025년 8월 14일

## 🔐 1단계: GCP 인증 완료

### 브라우저 기반 인증 (권장)

1. **PowerShell 또는 Git Bash에서 실행:**
```bash
./google-cloud-sdk/bin/gcloud auth login
```

2. **브라우저가 자동으로 열리면:**
   - Google 계정으로 로그인
   - 권한 승인
   - 인증 완료 메시지 확인

3. **브라우저가 열리지 않으면:**
   - 터미널에 표시된 URL을 복사
   - 브라우저에서 직접 열기
   - 인증 후 코드 복사하여 터미널에 붙여넣기

### 인증 확인
```bash
# 인증된 계정 확인
./google-cloud-sdk/bin/gcloud auth list

# 프로젝트 설정
./google-cloud-sdk/bin/gcloud config set project openmanager-free-tier

# Zone 설정
./google-cloud-sdk/bin/gcloud config set compute/zone us-central1-a
```

## 🖥️ 2단계: VM SSH 접속

### SSH 접속 명령어
```bash
./google-cloud-sdk/bin/gcloud compute ssh mcp-server \
  --zone=us-central1-a \
  --project=openmanager-free-tier
```

### 첫 접속 시
- SSH 키 생성 여부 물으면 'Y' 입력
- 패스프레이즈는 비워두고 Enter (선택사항)

## 🔧 3단계: VM 내부에서 서비스 복구

### SSH 접속 후 실행할 명령어

```bash
# 1. 현재 PM2 상태 확인
pm2 status
pm2 logs --lines 50

# 2. 서비스 재시작
pm2 restart all

# 3. 헬스체크 확인
curl http://localhost:10000/health
curl http://localhost:10000/api/health

# 4. 만약 404 에러가 계속되면 설정 스크립트 실행
wget https://raw.githubusercontent.com/YOUR_REPO/setup-vm-services.sh
bash setup-vm-services.sh
```

## 📋 4단계: 복구 확인

### 로컬에서 확인 (Windows)
```bash
# 헬스체크 테스트
curl http://104.154.205.25:10000/health
curl http://104.154.205.25:10000/api/health
curl http://104.154.205.25:10000/api/status
curl http://104.154.205.25:10000/api/metrics
```

## 🚀 자동 복구 스크립트 실행

### 인증 완료 후 실행
```bash
# 복구 스크립트 실행 (로컬에서)
bash scripts/gcp-vm-recovery.sh
```

## ⚠️ 문제 해결

### 인증 오류 시
```bash
# 기존 인증 제거
./google-cloud-sdk/bin/gcloud auth revoke --all

# 재인증
./google-cloud-sdk/bin/gcloud auth login
```

### SSH 접속 실패 시
```bash
# SSH 키 재생성
rm -rf ~/.ssh/google_compute_*

# 다시 접속 시도
./google-cloud-sdk/bin/gcloud compute ssh mcp-server --zone=us-central1-a
```

### PM2 프로세스 없음
```bash
# PM2 설치
npm install -g pm2

# 서비스 시작
pm2 start server.js --name mcp-server
pm2 save
pm2 startup
```

## 📊 현재 VM 상태

### ✅ 정상 작동
- VM 인스턴스: `mcp-server` (104.154.205.25)
- 포트 10000: 열림
- `/health` 엔드포인트: 정상 (200 OK)

### ❌ 수정 필요
- `/api/*` 경로: 404 에러
- PM2 프로세스: 확인 필요
- 모니터링 시스템: 미설정

## 📝 준비된 파일들

1. **API 라우팅 수정 코드**
   - `scripts/fix-vm-api-routing.js`
   
2. **PM2 설정 파일**
   - `scripts/ecosystem.config.js`
   
3. **자동 설정 스크립트**
   - `scripts/setup-vm-services.sh`
   
4. **복구 스크립트**
   - `scripts/gcp-vm-recovery.sh`

## 🎯 예상 소요 시간

- GCP 인증: 2-3분
- SSH 접속: 1분
- 서비스 복구: 5-10분
- 전체 완료: 15분 이내

---

**다음 단계**: 브라우저에서 GCP 인증을 완료하고 위 가이드를 따라 진행하세요.