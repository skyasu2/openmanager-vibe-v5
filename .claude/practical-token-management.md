# 🔐 실용적인 토큰 관리 가이드

## 📌 현재 상황 정리

개인 프로젝트이므로 즉각적인 위험은 낮지만, 향후 관리를 위해 정리가 필요합니다.

## ✅ 최소 권장 조치

### 1. **환경변수로 이동** (필수)

`.env.local` 생성:
```bash
# Upstash Redis
KV_REST_API_URL=https://your_redis_host_here
KV_REST_API_TOKEN=SENSITIVE_INFO_REMOVED

# 또는 ioredis용
UPSTASH_REDIS_HOST=your_redis_host_here
UPSTASH_REDIS_PASSWORD=SENSITIVE_INFO_REMOVED
```

### 2. **코드 수정**

`src/lib/redis.ts` 수정:
```typescript
// 기존 하드코딩 대신
host: process.env.UPSTASH_REDIS_HOST || process.env.GCP_REDIS_HOST,
password: process.env.UPSTASH_REDIS_PASSWORD || process.env.GCP_REDIS_PASSWORD,
```

### 3. **Git 저장소 설정**

Private 저장소인지 확인:
```bash
# GitHub 설정 확인
git remote -v

# Private으로 변경 (필요시)
# GitHub > Settings > General > Change repository visibility
```

## 💡 향후 관리 팁

### 개발 편의성 유지하면서 보안 강화

1. **개발용 기본값 설정**
```typescript
// 개발 환경에서만 기본값 사용
const isDev = process.env.NODE_ENV === 'development';
const redisHost = process.env.UPSTASH_REDIS_HOST || 
  (isDev ? 'your_redis_host_here' : undefined);
```

2. **환경별 설정 파일**
```
.env.development  # 개발용 (Git에 포함 가능)
.env.local        # 로컬 오버라이드 (Git 제외)
.env.production   # 프로덕션 (Vercel에서 관리)
```

3. **Vercel 환경변수 사용**
```bash
# Vercel CLI로 설정
vercel env add KV_REST_API_TOKEN
```

## 🎯 실용적 보안 체크리스트

### 바로 해야 할 것
- [x] 환경변수 파일 생성 (`.env.local`)
- [ ] 코드에서 하드코딩 제거
- [ ] `.gitignore`에 `.env*` 확인

### 시간 날 때 하면 좋은 것
- [ ] Upstash 대시보드에서 사용량 모니터링 설정
- [ ] IP 화이트리스트 고려 (프로덕션 시)
- [ ] 정기적으로 토큰 교체 (3-6개월)

### 나중에 고려할 것
- [ ] Read-only / Read-write 토큰 분리
- [ ] GitHub Secrets 활용
- [ ] 환경변수 암호화

## 📝 Quick Setup

```bash
# 1. 환경변수 파일 생성
cp .env.example .env.local

# 2. 토큰 정보 입력
# .env.local 편집

# 3. 개발 서버 재시작
npm run dev
```

## 🚀 앞으로의 개발 워크플로우

1. **새 프로젝트 시작 시**
   - 처음부터 환경변수 사용
   - `.env.example` 템플릿 활용

2. **팀 프로젝트로 전환 시**
   - 토큰 재발급
   - 권한 분리
   - CI/CD 시크릿 설정

3. **오픈소스 공개 시**
   - Git 히스토리 정리
   - 모든 시크릿 제거
   - 문서화

---

💬 **결론**: 개인 프로젝트에서는 실용성과 보안의 균형이 중요합니다. 
최소한 환경변수로 분리하여 관리하면, 나중에 확장하거나 공유할 때 문제가 없습니다.