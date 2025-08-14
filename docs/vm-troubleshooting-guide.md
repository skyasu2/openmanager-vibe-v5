# 🔧 GCP VM Troubleshooting Guide

**버전**: 1.0  
**작성일**: 2025-08-14 14:55 KST  
**프로젝트**: OpenManager VIBE v5

## 📋 목차

1. [일반적인 문제](#일반적인-문제)
2. [연결 문제](#연결-문제)
3. [API 오류](#api-오류)
4. [PM2 문제](#pm2-문제)
5. [성능 문제](#성능-문제)
6. [배포 문제](#배포-문제)
7. [긴급 복구 절차](#긴급-복구-절차)

## 🚨 일반적인 문제

### 문제: VM에 접속할 수 없음

**증상:**
- SSH 연결 실패
- "Connection refused" 오류

**원인:**
- Windows에서 gcloud SSH 미지원
- 방화벽 규칙 문제
- VM이 중지됨

**해결 방법:**

1. **Cloud Shell 사용 (권장)**
```bash
# 브라우저에서 Cloud Shell 열기
https://shell.cloud.google.com

# VM 접속
gcloud compute ssh mcp-server --zone=us-central1-a
```

2. **VM 상태 확인**
```bash
# Windows에서 API로 확인
node test-vm-api.js

# 응답이 없으면 VM 재시작 필요
```

3. **VM 재시작 (Cloud Shell)**
```bash
gcloud compute instances reset mcp-server --zone=us-central1-a
```

---

### 문제: API가 응답하지 않음

**증상:**
- 모든 API 호출이 timeout
- "ECONNREFUSED" 오류

**원인:**
- Management API 프로세스 중지
- 포트 10000 차단
- 네트워크 문제

**해결 방법:**

1. **기본 연결 테스트**
```bash
# Windows PowerShell
Test-NetConnection -ComputerName 104.154.205.25 -Port 10000
```

2. **헬스체크 확인**
```bash
# cURL
curl http://104.154.205.25:10000/health

# Node.js
node -e "require('http').get('http://104.154.205.25:10000/health', r => r.on('data', d => console.log(d.toString())))"
```

3. **Cloud Shell에서 프로세스 확인**
```bash
# VM 접속 후
pm2 status
pm2 restart mgmt-api
```

## 🔌 연결 문제

### 문제: 401 Unauthorized 오류

**증상:**
- 보안 엔드포인트 접근 실패
- `{"error":"Unauthorized"}` 응답

**원인:**
- Bearer Token 누락
- 잘못된 Token 값

**해결 방법:**

```javascript
// 올바른 Token 사용
const TOKEN = 'f3b06ab39909bb0bdd61f15ae0d5d1deb03b9c5d6a6dc00daba684ec49035c00';

// 헤더에 포함
const headers = {
  'Authorization': `Bearer ${TOKEN}`
};
```

---

### 문제: CORS 오류

**증상:**
- 브라우저에서 "CORS policy" 오류
- Preflight 요청 실패

**원인:**
- 브라우저 보안 정책
- OPTIONS 메소드 미처리

**해결 방법:**

1. **프록시 서버 사용**
```javascript
// 로컬 프록시 설정
// package.json
"proxy": "http://104.154.205.25:10000"
```

2. **서버 사이드 요청**
```javascript
// Next.js API Route 사용
// app/api/vm-proxy/route.ts
export async function GET(request: Request) {
  const response = await fetch('http://104.154.205.25:10000/api/status');
  return Response.json(await response.json());
}
```

## 🔴 API 오류

### 문제: 404 Not Found

**증상:**
- `{"error":"Not found","path":"/api/wrong"}` 응답

**원인:**
- 잘못된 엔드포인트 경로
- 오타

**해결 방법:**

```javascript
// 올바른 엔드포인트 확인
const ENDPOINTS = {
  health: '/health',                    // ✅
  apiHealth: '/api/health',            // ✅
  status: '/api/status',               // ✅
  metrics: '/api/metrics',             // ✅
  logs: '/api/logs',                   // ✅ (인증 필요)
  pm2: '/api/pm2',                     // ✅ (인증 필요)
  files: '/api/files',                 // ✅ (인증 필요)
  execute: '/api/execute',            // ✅ (인증 필요)
  deploy: '/api/deploy',               // ✅ (인증 필요)
  restart: '/api/restart'             // ✅ (인증 필요)
};
```

---

### 문제: 500 Internal Server Error

**증상:**
- `{"error":"서버 오류 메시지"}` 응답

**원인:**
- 서버 내부 오류
- 메모리 부족
- 잘못된 요청 데이터

**해결 방법:**

1. **로그 확인**
```bash
# API로 로그 조회
curl -H "Authorization: Bearer {TOKEN}" \
     http://104.154.205.25:10000/api/logs?lines=100
```

2. **메모리 상태 확인**
```bash
curl http://104.154.205.25:10000/api/status
# memory.free가 100MB 미만이면 문제
```

3. **PM2 재시작**
```bash
# Cloud Shell에서
pm2 restart mgmt-api
pm2 save
```

## 🔄 PM2 문제

### 문제: PM2 프로세스 자주 재시작

**증상:**
- PM2 restarts 카운트가 높음 (15회 이상)
- 불안정한 서비스

**원인:**
- 메모리 누수
- 처리되지 않은 예외
- 포트 충돌

**해결 방법:**

1. **PM2 로그 분석**
```bash
# Cloud Shell에서
pm2 logs mgmt-api --lines 200 > /tmp/pm2-analysis.log
grep -i error /tmp/pm2-analysis.log
```

2. **메모리 제한 설정**
```bash
# PM2 재시작 with 메모리 제한
pm2 delete mgmt-api
pm2 start /tmp/mgmt-api.js --name mgmt-api --max-memory-restart 200M
```

3. **오류 모니터링 추가**
```javascript
// 오류 핸들러 추가
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  // 로그 기록 후 안전하게 종료
  process.exit(1);
});
```

---

### 문제: PM2 프로세스를 찾을 수 없음

**증상:**
- `pm2 status`에 프로세스가 없음
- API가 작동하지만 PM2에서 보이지 않음

**원인:**
- PM2가 다른 사용자로 실행됨
- PM2 데몬 문제

**해결 방법:**

```bash
# PM2 리셋
pm2 kill
pm2 start /tmp/mgmt-api.js --name mgmt-api
pm2 save
pm2 startup
```

## ⚡ 성능 문제

### 문제: API 응답 속도 느림

**증상:**
- 응답 시간 > 1초
- 타임아웃 발생

**원인:**
- 네트워크 지연
- 서버 과부하
- 메모리 부족

**해결 방법:**

1. **성능 메트릭 확인**
```javascript
// 응답 시간 측정
console.time('api-call');
const response = await fetch('http://104.154.205.25:10000/api/status');
console.timeEnd('api-call');
```

2. **리소스 최적화**
```bash
# Cloud Shell에서 불필요한 프로세스 정리
pm2 list
pm2 delete [불필요한_프로세스]
```

3. **캐싱 구현**
```javascript
// 로컬 캐싱
const cache = new Map();
const CACHE_TTL = 60000; // 1분

async function getCachedStatus() {
  const cached = cache.get('status');
  if (cached && Date.now() - cached.time < CACHE_TTL) {
    return cached.data;
  }
  
  const data = await fetchStatus();
  cache.set('status', { data, time: Date.now() });
  return data;
}
```

## 🚀 배포 문제

### 문제: 새 코드 배포 실패

**증상:**
- `/api/deploy` 호출 후 변경사항 미반영
- PM2가 새 버전을 로드하지 않음

**원인:**
- 파일 권한 문제
- PM2 캐시
- 구문 오류

**해결 방법:**

1. **수동 배포 (Cloud Shell)**
```bash
# 기존 프로세스 정리
pm2 stop mgmt-api
pm2 delete mgmt-api

# 새 코드 배포
cat > /tmp/mgmt-api-new.js << 'EOF'
[새 코드]
EOF

# 문법 검사
node -c /tmp/mgmt-api-new.js

# PM2로 시작
pm2 start /tmp/mgmt-api-new.js --name mgmt-api
```

2. **권한 확인**
```bash
ls -la /tmp/mgmt-api.js
chmod 644 /tmp/mgmt-api.js
```

## 🆘 긴급 복구 절차

### 완전 복구 스크립트

Cloud Shell에서 실행:

```bash
#!/bin/bash
# emergency-recovery.sh

echo "🚨 긴급 복구 시작..."

# 1. VM 접속
gcloud compute ssh mcp-server --zone=us-central1-a --command="

# 2. 모든 PM2 프로세스 정리
pm2 kill

# 3. 백업 확인
ls -la /tmp/backup-*.js 2>/dev/null || echo '백업 없음'

# 4. 최소 API 서버 생성
cat > /tmp/emergency-api.js << 'EOF'
const http = require('http');
const PORT = 10000;

http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  
  if (req.url === '/health') {
    res.writeHead(200);
    res.end(JSON.stringify({
      status: 'emergency',
      message: 'Minimal API running',
      timestamp: new Date()
    }));
  } else {
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Not found' }));
  }
}).listen(PORT, () => {
  console.log('Emergency API on port', PORT);
});
EOF

# 5. 긴급 서버 시작
pm2 start /tmp/emergency-api.js --name emergency
pm2 save

echo '✅ 긴급 복구 완료'
echo '테스트: curl http://localhost:10000/health'
"
```

### 복구 확인

Windows에서:
```bash
# 헬스체크
curl http://104.154.205.25:10000/health

# 응답 확인
# {"status":"emergency","message":"Minimal API running"}
```

## 📊 문제 진단 체크리스트

### 빠른 진단 (1분)

- [ ] VM ping 응답 확인
- [ ] 포트 10000 연결 확인
- [ ] `/health` 엔드포인트 응답 확인
- [ ] API 버전 확인 (v2.0)

### 상세 진단 (5분)

- [ ] 모든 엔드포인트 테스트
- [ ] 인증 토큰 검증
- [ ] PM2 프로세스 상태 확인
- [ ] 메모리 사용률 확인
- [ ] 로그 파일 분석

### 심화 진단 (10분)

- [ ] 네트워크 경로 추적 (traceroute)
- [ ] 방화벽 규칙 검토
- [ ] VM 리소스 사용률 분석
- [ ] 시스템 로그 검토
- [ ] 보안 설정 확인

## 📞 지원 연락처

### 긴급 지원

1. **자동 복구 시도**
   - 위의 긴급 복구 스크립트 실행

2. **Cloud Shell 직접 접속**
   - https://shell.cloud.google.com

3. **GitHub Issues**
   - 프로젝트 이슈 트래커에 문제 보고

## 🔍 유용한 디버깅 명령어

### Windows (로컬)

```powershell
# 네트워크 진단
nslookup 104.154.205.25
ping 104.154.205.25
Test-NetConnection -ComputerName 104.154.205.25 -Port 10000

# API 테스트
node test-vm-api.js
npm run vm:health
```

### Cloud Shell

```bash
# 시스템 상태
top
free -h
df -h
netstat -tlnp | grep 10000

# PM2 디버깅
pm2 monit
pm2 info mgmt-api
pm2 logs mgmt-api --err --lines 100

# 프로세스 추적
strace -p $(pm2 pid mgmt-api)
```

## 📚 관련 문서

- [GCP VM 프로젝트 현황](./gcp-vm-project-status.md)
- [VM API Reference](./vm-api-reference.md)
- [Cloud Shell 접속 가이드](../CLOUD-SHELL-VM-ACCESS.md)

---

**마지막 업데이트**: 2025-08-14 14:55 KST  
**다음 리뷰**: 문제 발생 시 즉시 업데이트