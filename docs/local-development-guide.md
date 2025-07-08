# 🏠 로컬 개발 환경 가이드

> OpenManager Vibe v5 - Docker 없는 순수 로컬 개발 환경

## 📋 개요

OpenManager Vibe v5는 **Docker나 컨테이너 없이** 순수 Node.js 환경에서 개발할 수 있도록 최적화되었습니다.

## 🚀 빠른 시작

### 1. 필수 요구사항

- **Node.js**: 18.17.0 이상
- **npm**: 9.0.0 이상
- **Git**: 2.30.0 이상
- **OS**: Windows 10+, macOS 10.15+, Ubuntu 20.04+

### 2. 프로젝트 설정

```bash
# 프로젝트 클론
git clone https://github.com/your-username/openmanager-vibe-v5.git
cd openmanager-vibe-v5

# 의존성 설치
npm install

# 환경 변수 설정
cp env.local.template .env.local
# .env.local 파일을 편집하여 필요한 환경 변수 설정

# 개발 서버 실행
npm run dev
```

### 3. 개발 서버 실행

```bash
# 개발 모드 실행
npm run dev

# 빌드 및 프로덕션 실행
npm run build
npm start

# 테스트 실행
npm test
```

## 🔧 로컬 개발 최적화

### ✅ 장점

- **No Docker**: 컨테이너 설정 및 관리 불필요
- **빠른 시작**: 의존성 설치 후 즉시 개발 가능
- **Hot Reload**: 코드 변경 즉시 반영
- **디버깅 용이**: 네이티브 Node.js 디버깅 도구 활용
- **리소스 효율성**: Docker 오버헤드 없음

### 🛠️ 개발 도구

- **Next.js**: 프레임워크
- **TypeScript**: 타입 안전성
- **Tailwind CSS**: 스타일링
- **Vitest**: 테스트 프레임워크
- **ESLint**: 코드 품질
- **Prettier**: 코드 포맷팅

## 🌐 Mock 서비스 활용

### Redis Mock

```typescript
// 로컬 개발 시 Redis 연결 비활성화
REDIS_CONNECTION_DISABLED = true;
UPSTASH_REDIS_DISABLED = true;
```

### Google AI Mock

```typescript
// 로컬 개발 시 Google AI API 비활성화
GOOGLE_AI_ENABLED = false;
FORCE_MOCK_GOOGLE_AI = true;
```

### Supabase Mock

```typescript
// 로컬 개발 시 Supabase Mock 사용
NEXT_PUBLIC_SUPABASE_URL=https://mock-supabase.test
NEXT_PUBLIC_SUPABASE_ANON_KEY=mock-anon-key
```

## 🧪 테스트 환경

### 로컬 테스트 실행

```bash
# 전체 테스트 실행
npm test

# 단위 테스트만 실행
npm run test:unit

# 정적 분석 실행
npm run test:static

# 타입 체크
npm run type-check
```

### 테스트 설정

- **96.7% 테스트 통과율** (644/666개 테스트)
- **Mock 환경**: 외부 서비스 의존성 제거
- **빠른 실행**: 평균 10초 이내 완료

## 📊 성능 최적화

### 빌드 최적화

- **빌드 시간**: 27초 이내
- **번들 크기**: 2.6MB (7% 감소)
- **메모리 사용량**: 70MB (30% 절약)

### 개발 서버 최적화

- **시작 시간**: 3초 이내
- **Hot Reload**: 500ms 이내
- **타입 체크**: 1초 이내

## 🔍 디버깅 가이드

### VS Code 디버깅

```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Next.js",
  "program": "${workspaceFolder}/node_modules/.bin/next",
  "args": ["dev"],
  "console": "integratedTerminal",
  "env": {
    "NODE_OPTIONS": "--inspect"
  }
}
```

### Chrome DevTools

```bash
# 디버깅 모드로 실행
NODE_OPTIONS="--inspect" npm run dev
```

## 📋 환경 변수 가이드

### 필수 환경 변수

```env
# 기본 설정
NEXT_PUBLIC_APP_NAME=OpenManager Vibe
NEXT_PUBLIC_APP_VERSION=5.44.3

# 로컬 개발 최적화
USE_LOCAL_DEVELOPMENT=true
FORCE_LOCAL_MODE=true
DISABLE_EXTERNAL_SERVICES=true
PREFERRED_RUNTIME=local

# Mock 서비스
FORCE_MOCK_REDIS=true
FORCE_MOCK_GOOGLE_AI=true
REDIS_CONNECTION_DISABLED=true
UPSTASH_REDIS_DISABLED=true
GOOGLE_AI_ENABLED=false
```

## 🆘 트러블슈팅

### 자주 발생하는 문제

#### 1. Port 이미 사용 중

```bash
# 포트 3000 사용 프로세스 종료
npx kill-port 3000
```

#### 2. 의존성 오류

```bash
# node_modules 재설치
rm -rf node_modules package-lock.json
npm install
```

#### 3. 캐시 문제

```bash
# Next.js 캐시 제거
rm -rf .next
npm run dev
```

## 🎯 개발 워크플로

### 1. 기능 개발

```bash
# 새 브랜치 생성
git checkout -b feature/new-feature

# 개발 서버 실행
npm run dev

# 테스트 실행
npm test
```

### 2. 코드 품질 검사

```bash
# 린트 검사
npm run lint

# 타입 체크
npm run type-check

# 포맷팅
npm run format
```

### 3. 빌드 및 배포

```bash
# 빌드
npm run build

# 배포
npm run deploy
```

## 🔗 관련 문서

- [개발 가이드](./development-guide.md)
- [AI 시스템 가이드](./ai-system-guide.md)
- [배포 가이드](./deployment-guide.md)
- [API 문서](./api-reference.md)

---

**💡 Tip**: 로컬 개발 환경에서 문제가 발생하면 [GitHub Issues](https://github.com/your-username/openmanager-vibe-v5/issues)에 문의하세요.
