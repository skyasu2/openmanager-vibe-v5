# GCP VM 백엔드 서비스 복구 가이드

**긴급 복구 상황** (2025-08-10)
- VM: `mcp-server` (104.154.205.25:10000)  
- 상태: 포트 열림, HTTP 서비스 404 응답
- 원인: PM2/Node.js 백엔드 서비스 미실행

## 🚀 즉시 실행 복구 단계

### 1단계: Google Cloud 인증 완료

```bash
# 인증 시작 (URL이 표시됨)
gcloud auth login --no-launch-browser

# 표시된 URL을 브라우저에서 열고 skyasu2@gmail.com으로 로그인
# 인증 코드를 받아서 터미널에 입력
```

### 2단계: VM 상태 확인

```bash
# VM 목록 확인
gcloud compute instances list

# VM 상세 정보
gcloud compute instances describe mcp-server --zone=us-central1-a
```

### 3단계: SSH 접속 및 서비스 진단

```bash
# SSH 접속
gcloud compute ssh mcp-server --zone=us-central1-a

# 접속 후 서비스 상태 확인
sudo systemctl status pm2-skyasu
pm2 status
pm2 logs
ps aux | grep node
netstat -tlnp | grep 10000
```

### 4단계: PM2 서비스 복구

```bash
# PM2 프로세스 재시작
pm2 restart all
pm2 save

# 서비스 상태 확인
pm2 status
pm2 logs --lines 20

# HTTP 서비스 테스트
curl http://localhost:10000/api/health
```

### 5단계: 서비스 검증

```bash
# 외부에서 접근 테스트
curl http://104.154.205.25:10000/api/health

# PM2 서비스를 시스템 서비스로 등록 (재부팅 시 자동 시작)
pm2 startup
pm2 save
```

## 🔧 추가 복구 명령어

### Node.js 프로세스가 완전히 중단된 경우

```bash
# 포트 10000 사용 프로세스 확인 및 종료
sudo lsof -ti:10000 | xargs sudo kill -9

# Node.js 애플리케이션 재시작
cd /opt/openmanager-vibe
npm start
```

### PM2 완전 재설치

```bash
# PM2 완전 제거 후 재설치
pm2 delete all
pm2 kill
npm install -g pm2

# 애플리케이션 재시작
cd /opt/openmanager-vibe
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## 🛡️ 장애 방지책

### 자동 모니터링 스크립트 설치

```bash
# 크론 작업으로 5분마다 서비스 상태 점검
echo "*/5 * * * * /usr/bin/curl -f http://localhost:10000/api/health || /usr/bin/pm2 restart all" | crontab -
```

### VM 메타데이터에 시작 스크립트 추가

```bash
# VM 시작 시 자동으로 서비스 복구
gcloud compute instances add-metadata mcp-server \
  --metadata startup-script='#!/bin/bash
cd /opt/openmanager-vibe
pm2 start ecosystem.config.js
pm2 save
pm2 startup' \
  --zone=us-central1-a
```

## 📊 복구 후 검증 체크리스트

- [ ] VM SSH 접속 가능
- [ ] PM2 프로세스 정상 실행 (`pm2 status`)
- [ ] HTTP 서비스 응답 (`curl http://localhost:10000/api/health`)
- [ ] 외부 접근 가능 (`curl http://104.154.205.25:10000/api/health`)
- [ ] 자동 시작 설정 완료 (`pm2 startup`, `pm2 save`)
- [ ] 모니터링 크론 작업 설정

## 🆘 긴급 연락처

- GCP 프로젝트: `openmanager-free-tier`
- VM 지역: `us-central1-a`  
- 계정: `skyasu2@gmail.com`

---
*생성 시간: 2025-08-10 16:35 KST*
*복구 대상: OpenManager VIBE v5 백엔드 서비스*