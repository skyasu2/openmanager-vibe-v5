# 🔧 환경변수 설정 가이드

## 📋 개요
하드코딩된 시크릿이 성공적으로 제거되었습니다. 이제 실제 환경변수를 설정해야 합니다.

## 🚀 1단계: 실제 환경변수 값 확인

### 🔴 Redis (Upstash) 설정
1. **Upstash 콘솔 접속**: https://console.upstash.com/
2. **Redis 인스턴스 선택**: 기존 Redis DB 선택
3. **연결 정보 복사**:
   ```bash
   # REST API 정보
   UPSTASH_REDIS_REST_URL=https://your-instance.upstash.io
   UPSTASH_REDIS_REST_TOKEN=your_token_here
   
   # Connection String
   KV_URL=rediss://default:your_password@your-instance.upstash.io:6379
   ```

### 🗄️ Supabase 설정
1. **Supabase 대시보드 접속**: https://supabase.com/dashboard
2. **프로젝트 선택**: OpenManager Vibe v5
3. **Settings → API** 이동
4. **API 키 복사**:
   ```bash
   SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```

### 🔐 GitHub OAuth 설정
1. **GitHub → Settings → Developer settings → OAuth Apps**
2. **기존 OAuth 앱 확인**: OpenManager Vibe v5
3. **클라이언트 정보 복사**:
   ```bash
   GITHUB_CLIENT_ID=your_client_id_here
   GITHUB_CLIENT_SECRET=your_client_secret_here
   ```

### 🤖 Google AI API 설정
1. **Google AI Studio 접속**: https://makersuite.google.com/app/apikey
2. **API 키 생성/확인**:
   ```bash
   GOOGLE_AI_API_KEY=your_google_ai_api_key_here
   ```

## 🔧 2단계: .env.local 파일 업데이트

```bash
# .env.local 파일 편집
nano .env.local
```

다음 값들을 1단계에서 확인한 실제 값으로 교체:

```bash
# Supabase
SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Redis
UPSTASH_REDIS_REST_URL=https://your-instance.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token_here
KV_URL=rediss://default:your_password@your-instance.upstash.io:6379
KV_REST_API_URL=https://your-instance.upstash.io
KV_REST_API_TOKEN=your_token_here

# GitHub OAuth
GITHUB_CLIENT_ID=your_client_id_here
GITHUB_CLIENT_SECRET=your_client_secret_here

# Google AI
GOOGLE_AI_API_KEY=your_google_ai_api_key_here
```

## 🚀 3단계: Vercel 환경변수 설정

### A. Vercel CLI 로그인
```bash
vercel login
```

### B. 프로젝트 연결 확인
```bash
vercel link --yes
# 프로젝트 선택: skyasus-projects/openmanager-vibe-v5
```

### C. 환경변수 추가
```bash
# Supabase 환경변수
vercel env add SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_URL  
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY

# Redis 환경변수
vercel env add UPSTASH_REDIS_REST_URL
vercel env add UPSTASH_REDIS_REST_TOKEN
vercel env add KV_URL
vercel env add KV_REST_API_URL
vercel env add KV_REST_API_TOKEN

# GitHub OAuth 환경변수
vercel env add GITHUB_CLIENT_ID
vercel env add GITHUB_CLIENT_SECRET
vercel env add NEXTAUTH_SECRET

# Google AI 환경변수
vercel env add GOOGLE_AI_API_KEY
```

### D. 환경변수 확인
```bash
vercel env ls
```

## 🔍 4단계: 로컬 테스트

```bash
# 개발 서버 시작
npm run dev

# 브라우저에서 확인
# http://localhost:3000
```

## 🚀 5단계: 배포 및 테스트

### A. 변경사항 커밋
```bash
git add .
git commit -m "🔐 보안: 하드코딩된 시크릿 제거 및 환경변수 시스템 적용"
git push origin main
```

### B. 배포 상태 확인
```bash
vercel --prod
```

### C. 프로덕션 테스트
- **메인 사이트**: https://openmanager-vibe-v5.vercel.app
- **로그인 테스트**: GitHub OAuth 동작 확인
- **AI 기능 테스트**: Google AI API 연결 확인
- **데이터 저장 테스트**: Supabase 연결 확인

## ⚠️ 주의사항

1. **절대 Git에 커밋하지 말 것**:
   - `.env.local` 파일은 `.gitignore`에 포함되어 있음
   - 실제 API 키나 시크릿은 절대 커밋하지 마세요

2. **환경변수 검증**:
   - 설정 후 반드시 기능 테스트 수행
   - 에러 발생 시 환경변수 값 재확인

3. **보안 모범 사례**:
   - API 키는 정기적으로 갱신
   - 사용하지 않는 토큰은 즉시 폐기
   - 로그에 민감한 정보 노출 방지

## 🆘 트러블슈팅

### 일반적인 문제
1. **Vercel 연결 오류**: `vercel link --yes` 재실행
2. **환경변수 누락**: `vercel env ls`로 확인
3. **API 키 오류**: 각 서비스 콘솔에서 키 유효성 확인

### 빠른 해결책
```bash
# 환경변수 검증 스크립트
npm run verify:env

# 헬스 체크
npm run health-check

# 전체 검증
npm run validate:all
```

---

✅ **이 가이드를 따라 설정하면 보안이 강화된 환경변수 시스템이 완성됩니다.**