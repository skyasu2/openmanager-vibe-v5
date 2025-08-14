# VM Management API 배포 가이드

## 🚀 빠른 배포 (Cloud Shell 사용)

### 1. Cloud Shell 열기
```bash
https://shell.cloud.google.com/?project=openmanager-free-tier
```

### 2. VM에 SSH 접속
```bash
gcloud compute ssh mcp-server --zone=us-central1-a
```

### 3. Management API 서버 생성
```bash
# 기존 서버 백업
cp /tmp/simple.js /tmp/simple.js.backup

# 새 Management API 서버 생성
cat > /tmp/management-api.js << 'EOF'
[vm-management-api.js 내용 붙여넣기]
EOF

# 환경변수 설정
export API_TOKEN="your-secure-token-here"

# PM2로 전환
pm2 stop simple
pm2 delete simple
pm2 start /tmp/management-api.js --name mcp-server
pm2 save
```

### 4. 테스트
```bash
# VM 내부에서 테스트
curl http://localhost:10000/health
curl -H "Authorization: Bearer your-secure-token-here" http://localhost:10000/api/status
```

## 📝 로컬에서 사용

### 환경변수 설정 (.env.local)
```bash
VM_API_TOKEN=your-secure-token-here
```

### API 클라이언트 사용
```bash
# 상태 확인
node vm-api-client.js status

# 로그 확인
node vm-api-client.js logs 100

# 명령 실행
node vm-api-client.js exec "pm2 status"

# 코드 배포
node vm-api-client.js deploy my-app.js

# PM2 상태
node vm-api-client.js pm2

# 서비스 재시작
node vm-api-client.js restart
```

## 🔒 보안 설정

### 1. 강력한 토큰 생성
```bash
# Linux/Mac/Git Bash
openssl rand -hex 32

# Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2. 환경변수로 토큰 관리
```bash
# VM에서 (PM2 환경변수)
pm2 set API_TOKEN "your-secure-token"
pm2 restart mcp-server

# 로컬에서 (.env.local)
VM_API_TOKEN=your-secure-token
```

### 3. 방화벽 규칙 (선택사항)
특정 IP만 허용하려면:
```bash
gcloud compute firewall-rules create allow-api-from-office \
  --allow tcp:10000 \
  --source-ranges="YOUR_OFFICE_IP/32" \
  --target-tags=http-server
```

## 🧪 로컬 테스트 (VM 없이)

### 1. 로컬에서 Management API 실행
```bash
# 포트 변경하여 로컬 실행
API_TOKEN=test-token node vm-management-api.js
```

### 2. 로컬 테스트
```bash
# 다른 터미널에서
export VM_API_TOKEN=test-token
node vm-api-client.js status
```

## 📊 모니터링

### API 사용량 확인
```bash
node vm-api-client.js exec "grep 'GET\\|POST' /tmp/vm-api.log | tail -20"
```

### 에러 로그 확인
```bash
node vm-api-client.js exec "grep ERROR /tmp/vm-api.log"
```

### PM2 모니터링
```bash
node vm-api-client.js pm2
```

## 🔄 업데이트 방법

### 1. 새 버전 준비
```bash
# 로컬에서 수정
edit vm-management-api.js
```

### 2. 배포
```bash
# API를 통한 업데이트
node vm-api-client.js update vm-management-api.js

# 또는 Cloud Shell에서 직접
gcloud compute ssh mcp-server --zone=us-central1-a --command="cat > /tmp/management-api.js" < vm-management-api.js
```

## ⚠️ 트러블슈팅

### Connection Refused
- VM이 실행 중인지 확인
- 포트 10000이 열려있는지 확인
- 방화벽 규칙 확인

### Unauthorized
- API 토큰이 올바른지 확인
- 환경변수 VM_API_TOKEN 설정 확인

### Command Failed
- 명령어 권한 확인
- 위험한 명령어는 차단됨

## 📌 유용한 명령어

```bash
# 종합 헬스체크
npm run vm:health

# 빠른 상태 확인
npm run vm:status

# 로그 스트리밍 (실시간)
watch -n 2 "node vm-api-client.js logs 20"

# PM2 프로세스 모니터링
watch -n 5 "node vm-api-client.js pm2"
```

---

**작성일**: 2025-08-14 09:30 KST
**버전**: Management API v2.0