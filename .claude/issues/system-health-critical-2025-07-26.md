# 🚨 긴급 시스템 이슈 - 2025-07-26

## 🔴 Critical Issues (24시간 내 조치 필요)

### 1. GCP Compute Engine VM 100% 사용

**심각도**: CRITICAL  
**영향**: 추가 VM 생성 불가, 비용 발생 위험  
**현재 상태**: e2-micro 인스턴스 1개 사용 중 (context-api-vm)  
**즉시 조치**:

```bash
# VM 리소스 확인
gcloud compute instances list

# 메모리/CPU 사용량 확인
gcloud compute ssh context-api-vm --command="top -b -n 1"

# 불필요한 프로세스 종료
gcloud compute ssh context-api-vm --command="sudo systemctl stop [service-name]"
```

### 2. Supabase MCP 서버 연결 실패

**심각도**: HIGH  
**영향**: 데이터베이스 작업 및 RAG 기능 불가  
**원인**: `SUPABASE_ACCESS_TOKEN` 환경변수 미설정  
**해결 단계**:

1. Supabase 대시보드 로그인
2. Account Settings > Access Tokens
3. "Generate new token" 클릭
4. `.env.local`에 추가:
   ```
   SUPABASE_ACCESS_TOKEN=sbp_[your-token-here]
   ```
5. Claude Code 재시작

### 3. GCP CLI 타임아웃 문제

**심각도**: MEDIUM  
**영향**: GCP 리소스 모니터링 불가  
**에러**: `spawnSync /bin/sh ETIMEDOUT`  
**임시 해결책**:

- GCP Console 웹 UI 사용
- 수동 모니터링: https://console.cloud.google.com

## 🟡 무료 티어 사용량 경고

### Upstash Redis (2025년 3월 업데이트)

- **현재**: 안전 (사용량 미미)
- **한도**: 500K 명령/월, 256MB 스토리지, 1GB 대역폭/월
- **권장**: 현재 사용량 모니터링 계속

### GCP 리소스

- **Cloud Functions**: 2.3% 사용 ✅
- **Cloud Storage**: 16% 사용 ✅
- **Compute Engine**: 100% 사용 🔴

## 🔧 긴급 조치 스크립트

```bash
#!/bin/bash
# emergency-fix.sh

# 1. Redis 상태 확인
npm run redis:test

# 2. Vercel 상태 확인
curl -I https://your-vercel-app.vercel.app/api/health

# 3. MCP 서버 상태
npm run mcp:verify

# 4. 시스템 전체 상태
npm run system:status
```

## 📌 다음 단계

1. **즉시**: GCP VM 리소스 최적화
2. **24시간 내**: Supabase 토큰 설정
3. **48시간 내**: GCP CLI 문제 해결
4. **1주일 내**: 자동 모니터링 시스템 구축

---

**생성일시**: 2025-07-26 11:50 KST  
**다음 점검**: 2025-07-27 12:00 KST
