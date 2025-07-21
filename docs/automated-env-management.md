# 🤖 자동화된 환경변수 관리 시스템

## 개요

OpenManager Vibe v5의 자동화된 환경변수 관리 시스템은 CI/CD 파이프라인, Docker, Vercel 등 다양한 환경에서 암호화된 환경변수를 자동으로 관리합니다.

## 🎯 주요 기능

### 1. 환경 자동 감지

- 로컬 개발 환경
- CI/CD (GitHub Actions, GitLab CI 등)
- Vercel 배포 환경
- Docker 컨테이너
- 프로덕션 서버

### 2. 마스터 비밀번호 자동 로드

- 환경변수: `ENV_MASTER_PASSWORD`
- 파일: `.env.key`
- CI/CD 시크릿: `DECRYPT_PASSWORD`
- Docker 시크릿: `/run/secrets/env_master_password`

### 3. 환경별 최적화

- Vercel: 빌드 최적화 및 환경 설정
- Docker: 네트워크 설정 자동 조정
- CI/CD: 시크릿 관리 및 캐싱

## 🚀 빠른 시작

### 환경 검사

```bash
npm run env:check
```

현재 환경과 설정 상태를 확인합니다.

### 자동 설정

```bash
npm run env:auto-setup
```

환경을 자동으로 감지하고 환경변수를 로드합니다.

## 📋 환경별 설정 가이드

### 1. GitHub Actions

#### 시크릿 설정

1. 저장소 Settings → Secrets and variables → Actions
2. `ENV_MASTER_PASSWORD` 시크릿 추가

#### 워크플로우 생성

```bash
npm run env:github-workflow
```

생성된 워크플로우 예시:

```yaml
name: Deploy with Encrypted Env

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '22'

      - name: Install dependencies
        run: npm ci

      - name: Load encrypted environment
        env:
          ENV_MASTER_PASSWORD: ${{ secrets.ENV_MASTER_PASSWORD }}
        run: npm run env:auto-setup

      - name: Build
        run: npm run build
```

### 2. Vercel

#### 환경변수 설정

1. Vercel 대시보드 → Settings → Environment Variables
2. `ENV_MASTER_PASSWORD` 추가

#### package.json 빌드 스크립트

```json
{
  "scripts": {
    "vercel-build": "npm run env:auto-setup && npm run build"
  }
}
```

### 3. Docker

#### Docker Compose 설정 생성

```bash
npm run env:docker-compose
```

#### Dockerfile 예시

```dockerfile
FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# 빌드 시 환경변수 로드
RUN --mount=type=secret,id=env_master_password \
    ENV_MASTER_PASSWORD=$(cat /run/secrets/env_master_password) \
    npm run env:auto-setup && \
    npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

#### 실행 명령

```bash
# 시크릿 파일 생성
echo "your-master-password" > secrets/env_master_password.txt

# Docker 빌드
docker build --secret id=env_master_password,src=secrets/env_master_password.txt -t app .

# Docker Compose 실행
docker-compose up
```

## 🔄 API 키 로테이션

### 자동 로테이션 가이드

```bash
npm run env:rotate
```

### 로테이션 프로세스

1. 새 API 키 생성 (각 서비스에서)
2. 암호화된 설정 업데이트
3. 테스트 및 검증
4. 이전 키 비활성화

### 로테이션 스케줄

- **프로덕션**: 3개월마다
- **개발**: 6개월마다
- **긴급**: 보안 이슈 발생 시 즉시

## 💾 백업 관리

### 백업 생성

```bash
npm run env:backup
```

### 백업 위치

- `backups/env-backup-YYYY-MM-DD.json`

### 백업 정책

- 매주 자동 백업 (CI/CD)
- 중요 변경 전 수동 백업
- 30일 이상 된 백업 자동 삭제

## 🛡️ 보안 모범 사례

### 1. 마스터 비밀번호 관리

- **절대 하드코딩 금지**
- 팀 비밀번호 관리자 사용 (1Password, Bitwarden 등)
- 정기적인 비밀번호 변경

### 2. CI/CD 보안

- 브랜치 보호 규칙 설정
- 시크릿 접근 권한 제한
- 감사 로그 활성화

### 3. 로컬 개발 보안

```bash
# .gitignore에 포함 확인
.env*
.env.key
secrets/
backups/
```

## 📊 모니터링

### 환경변수 로드 상태

```typescript
// src/lib/monitoring/env-health.ts
export function checkEnvHealth() {
  const required = ['GOOGLE_AI_API_KEY', 'SUPABASE_URL', 'NEXTAUTH_SECRET'];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    console.error('Missing environment variables:', missing);
    // 알림 전송 (Slack, Discord 등)
  }
}
```

### 자동 알림 설정

- 환경변수 로드 실패
- API 키 만료 임박
- 비정상적인 접근 시도

## 🔧 문제 해결

### 환경변수 로드 실패

```bash
# 1. 환경 검사
npm run env:check

# 2. 수동 디버깅
DEBUG=* npm run env:auto-setup

# 3. 백업에서 복원
cp backups/env-backup-latest.json config/encrypted-env-config.ts
```

### CI/CD 빌드 실패

1. 시크릿 설정 확인
2. Node.js 버전 확인 (22+)
3. 네트워크 접근 권한 확인

### Docker 컨테이너 오류

```bash
# 컨테이너 내부 확인
docker exec -it <container-id> sh

# 환경변수 확인
env | grep -E "(API|SECRET|KEY)"

# 로그 확인
docker logs <container-id>
```

## 🚀 고급 기능

### 1. 멀티 환경 지원

```typescript
// config/env-profiles.ts
export const ENV_PROFILES = {
  development: 'dev-encrypted-env.json',
  staging: 'staging-encrypted-env.json',
  production: 'prod-encrypted-env.json',
};
```

### 2. 동적 환경변수

```typescript
// 런타임에 환경변수 추가
enhancedCryptoManager.addRuntimeVariable('DYNAMIC_KEY', value);
```

### 3. 환경변수 검증

```typescript
// src/lib/env-validator.ts
import { z } from 'zod';

const envSchema = z.object({
  GOOGLE_AI_API_KEY: z.string().min(20),
  NODE_ENV: z.enum(['development', 'production', 'test']),
  // ... 기타 검증 규칙
});

export function validateEnv() {
  return envSchema.safeParse(process.env);
}
```

## 📚 관련 자료

- [API 키 복원 가이드](./api-key-recovery-guide.md)
- [통합 암호화 시스템](./unified-encryption-system.md)
- [보안 토큰 관리](./secure-token-usage-guide.md)

---

이 자동화 시스템을 통해 환경변수를 안전하고 효율적으로 관리할 수 있습니다.
문의사항은 팀 DevOps 담당자에게 연락하세요.
