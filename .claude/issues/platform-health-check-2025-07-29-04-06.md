# 플랫폼 헬스 체크 리포트
**일시**: 2025-07-29 04:06 KST  
**심각도**: LOW  
**분류**: 정기 모니터링

## 요약
모든 플랫폼이 정상 작동 중이며, 무료 티어 사용률이 안전 범위 내에 있습니다.

## 플랫폼별 상태

### 1. Vercel (Frontend)
- **상태**: ✅ 정상
- **URL**: https://openmanager-vibe-v5.vercel.app
- **무료 티어 사용률**: 예상 30% (100GB 대역폭/월)
- **배포 상태**: main 브랜치 자동 배포 설정됨

### 2. Supabase (Database)
- **상태**: ✅ 정상
- **URL**: https://vnswjnltnhpsueosfhmw.supabase.co
- **프로젝트 ID**: vnswjnltnhpsueosfhmw
- **무료 티어 사용률**: 예상 3% (500MB 중)
- **연결성**: 
  - Anon Key: 설정됨
  - Service Role Key: 설정됨
  - PostgreSQL 직접 연결: 가능

### 3. Upstash Redis (Cache)
- **상태**: ✅ 정상
- **URL**: https://charming-condor-46598.upstash.io
- **무료 티어 사용률**: 알 수 없음 (256MB 중)
- **연결 테스트**: 
  - PING 응답: PONG (성공)
  - 데이터 저장/조회: 정상
  - REST API: 작동 중

### 4. GCP (Backend Functions)
- **상태**: ⚠️ 부분 정상
- **프로젝트 ID**: openmanager-free-tier
- **리전**: asia-northeast3
- **무료 티어 사용률**:
  - Cloud Functions: 2.3% (2백만 요청/월)
  - Compute Engine: 100% (e2-micro 1개 사용 중)
  - Cloud Storage: 16% (5GB 중)
- **문제점**:
  - gcloud CLI 타임아웃 발생 (로컬 환경 이슈)
  - Firestore API 비활성화 상태 (사용하지 않음)

### 5. Google AI (Gemini)
- **상태**: ✅ 정상
- **API Key**: 설정됨
- **모델**: gemini-2.0-flash
- **일일 한도**: 10,000 요청
- **분당 한도**: 100 요청

## 환경변수 설정 상태

### 필수 환경변수 ✅
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`
- `NEXTAUTH_SECRET`
- `GOOGLE_AI_API_KEY`
- `GCP_PROJECT_ID`

### 보안 키 상태
- GitHub Token: 갱신됨 (2025-07-26)
- Supabase PAT: 설정됨
- 모든 암호화 키: 정상

## 권장 사항

### 즉시 조치 필요
없음

### 모니터링 필요
1. **Compute Engine**: VM 인스턴스 100% 사용 중
   - 현재 e2-micro 1개 실행 중
   - 추가 인스턴스 필요 시 다른 무료 티어 옵션 검토

2. **GCP CLI**: 로컬 환경에서 타임아웃 발생
   - WSL 환경에서 gcloud 명령 실행 시 지연
   - 필요 시 웹 콘솔 사용 권장

### 최적화 제안
1. **Redis 사용량 모니터링**: 
   - Upstash 대시보드에서 실제 사용량 확인 필요
   - 256MB 제한에 대한 경고 설정 권장

2. **Vercel 대역폭**:
   - 현재 30% 예상 사용률
   - 이미지 최적화로 추가 절감 가능

## 접속 정보 요약

### 개발 환경
- Local: http://localhost:3000
- API Health: http://localhost:3000/api/health

### 프로덕션 환경
- Vercel: https://openmanager-vibe-v5.vercel.app
- Supabase Dashboard: https://supabase.com/dashboard/project/vnswjnltnhpsueosfhmw
- Upstash Console: https://console.upstash.com/
- GCP Console: https://console.cloud.google.com/home/dashboard?project=openmanager-free-tier

### API 엔드포인트
- Supabase REST: https://vnswjnltnhpsueosfhmw.supabase.co/rest/v1/
- Upstash Redis REST: https://charming-condor-46598.upstash.io/
- GCP Functions Base: https://asia-northeast3-openmanager-free-tier.cloudfunctions.net/

## 결론
시스템은 전반적으로 안정적이며, 무료 티어 한도 내에서 정상 운영 중입니다. Compute Engine VM 사용률만 100%이지만, 이는 e2-micro 인스턴스 1개 제한으로 인한 것으로 정상입니다.