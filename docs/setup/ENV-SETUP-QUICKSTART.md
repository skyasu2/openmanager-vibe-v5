# 🚀 환경변수 설정 빠른 시작 가이드

## 📋 개요

하드코딩된 시크릿이 성공적으로 제거되었습니다. 이제 3단계로 환경변수를 설정하세요.

## ⚡ 빠른 설정 (3단계)

### 1️⃣ 로컬 환경변수 설정

```bash
# 대화형 설정 (권장)
npm run env:setup

# 또는 직접 실행
./scripts/setup-env-interactive.sh
```

### 2️⃣ Vercel 환경변수 설정

```bash
# Vercel 로그인
vercel login

# 환경변수 자동 설정
npm run env:vercel
```

### 3️⃣ 배포 및 테스트

```bash
# 변경사항 커밋
git add .
git commit -m "🔐 환경변수 설정 완료"
git push origin main

# 배포
npm run deploy
```

## 🔍 설정 검증

### 로컬 환경변수 확인

```bash
npm run env:check
```

### Vercel 환경변수 확인

```bash
vercel env ls
```

## 📝 필요한 정보

### 🗄️ Supabase

- **URL**: `https://supabase.com/dashboard` → 프로젝트 선택 → Settings → API
- **필요 정보**: Project URL, Anon Key, Service Role Key

### 🔴 Redis (Upstash)

- **URL**: `https://console.upstash.com/`
- **필요 정보**: REST URL, REST Token

### 🔐 GitHub OAuth

- **URL**: `https://github.com/settings/developers`
- **필요 정보**: Client ID, Client Secret

### 🤖 Google AI

- **URL**: `https://makersuite.google.com/app/apikey`
- **필요 정보**: API Key

## 🚨 문제 해결

### 일반적인 오류

```bash
# 1. 환경변수 플레이스홀더 오류
npm run env:setup  # 다시 설정

# 2. Vercel 연결 오류
vercel link --yes  # 프로젝트 재연결

# 3. 배포 실패
npm run env:check  # 환경변수 확인
```

### 도움말 명령어

```bash
npm run env:guide    # 상세 가이드
npm run env:check    # 환경변수 검증
npm run env:vercel   # Vercel 설정
```

## ✅ 성공 확인

### 로컬 테스트

```bash
npm run dev
# http://localhost:3000 접속
```

### 프로덕션 테스트

```bash
# 배포 후 확인
# https://openmanager-vibe-v5.vercel.app
```

---

## 💡 팁

1. **환경변수 순서**: 로컬 → Vercel → 배포
2. **보안**: .env.local 파일은 절대 커밋하지 마세요
3. **검증**: 각 단계마다 검증 스크립트 실행
4. **백업**: 설정 전 중요 데이터 백업

---

🎉 **이 가이드를 따라하면 5분 안에 환경변수 설정이 완료됩니다!**
