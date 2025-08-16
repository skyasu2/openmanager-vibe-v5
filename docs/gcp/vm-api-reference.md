# GCP VM Management API 참조

> **GCP VM 인스턴스 관리를 위한 Express API 구현**  
> 포트 10000에서 실행되는 경량 관리 API

## 📋 API 엔드포인트

### Health Check

```bash
GET /health
GET /api/health
```

### System Status

```bash
GET /api/status    # 시스템 메모리, CPU, 업타임
GET /api/metrics   # Node.js 프로세스 메트릭
```

### 인증 필요 엔드포인트

```bash
GET  /api/logs?lines=50     # 시스템 로그 조회
GET  /api/pm2               # PM2 프로세스 상태
POST /api/execute           # 명령 실행
POST /api/restart           # PM2 재시작
GET  /api/files?dir=/tmp    # 파일 목록
```

## 🔐 보안 설정

### 환경변수

```bash
VM_API_TOKEN=your_secure_token_here
```

### 인증 헤더

```bash
Authorization: Bearer your_secure_token_here
```

### 보안 제한사항

- 파일 접근: `/tmp`, `/var/log`만 허용
- 위험한 명령: `rm -rf /` 등 차단
- CORS: 모든 origin 허용 (개발용)

## 📦 배포 방법

### PM2 시작

```bash
pm2 start /tmp/mgmt-api.js --name mgmt-api
pm2 save
```

### 상태 확인

```bash
pm2 status
curl http://localhost:10000/health
```

## ⚠️ 보안 권장사항

1. **프로덕션 환경**
   - 환경변수로 토큰 관리
   - HTTPS 사용 필수
   - IP 화이트리스트 설정

2. **접근 제한**
   - 특정 디렉토리만 접근
   - 실행 권한 최소화
   - 정기적 토큰 교체

---

**참조**: [GCP 완전 가이드](./gcp-complete-guide.md)  
**최종 업데이트**: 2025-08-16
