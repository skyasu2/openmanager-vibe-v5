# 🐳 Docker/로컬 환경 자동 감지 시스템 가이드

OpenManager Vibe v5에서는 Docker 컨테이너 환경과 로컬 개발 환경을 자동으로 감지하여 각각에 맞는 설정과 동작을 수행합니다.

## 📋 시스템 개요

### 🔍 자동 감지 방식

1. **환경변수 우선 확인**: `DEV_MODE` 설정
2. **is-docker 패키지**: 표준 Docker 감지
3. **추가 검증**: DevContainer, Docker Compose 특정 환경변수 확인

### 🎯 분기 동작

- **Docker 환경** → 내부 서비스 연결, 컨테이너 최적화
- **로컬 환경** → localhost 연결, 개발자 친화적 설정

## 🚀 빠른 시작

### 1. DevContainer에서 개발 (권장)

```bash
# VS Code에서 프로젝트 열고
# 왼쪽 하단 "Reopen in Container" 클릭
# 또는 Ctrl+Shift+P → "Dev Containers: Reopen in Container"
```

### 2. 로컬 환경에서 개발

```bash
# 환경 설정 파일 생성
cp dev-env.example .env.local

# 로컬 실행 스크립트 사용 (권장)
./run-local.sh

# 또는 직접 실행
export DEV_MODE=local
npm run dev
```

## 📁 파일 구조

```
my-project/
├── src/utils/
│   ├── dev-env.ts               ← 핵심 감지 로직
│   └── init-dev-env.ts          ← 초기화 스크립트
├── src/examples/
│   └── environment-usage.ts     ← 사용 예시 코드
├── .devcontainer/               ← DevContainer 설정
│   ├── devcontainer.json
│   ├── docker-compose.yml
│   └── README.md
├── dev-env.example              ← 환경변수 템플릿
├── run-local.sh                 ← 로컬 실행 자동화
└── ENVIRONMENT-DETECTION-GUIDE.md
```

## 🛠️ 환경별 설정

### 🐳 Docker/DevContainer 환경

**자동 연결 서비스:**

```typescript
const config = {
  database: {
    host: 'postgres',
    port: 5432,
    url: 'postgresql://postgres:postgres@postgres:5432/openmanager_dev',
  },
  redis: {
    host: 'redis',
    port: 6379,
    url: 'redis://redis:6379',
  },
};
```

**활성화 기능:**

- 내부 서비스 최적화
- 컨테이너 전용 로깅
- 자동 헬스 체크 (30초 간격)
- 개발 도구 웹 UI
  - Adminer: <http://localhost:8080>
  - Redis Commander: <http://localhost:8081>

### 🏠 로컬 개발 환경

**연결 설정:**

```typescript
const config = {
  database: {
    host: 'localhost',
    port: 5432,
    url: 'postgresql://postgres:password@localhost:5432/openmanager_local',
  },
  redis: {
    host: 'localhost',
    port: 6379,
    url: 'redis://localhost:6379',
  },
};
```

**활성화 기능:**

- 외부 서비스 재시도 로직
- 개발자 친화적 에러 표시
- 자동 헬스 체크 (60초 간격)
- 상세 로그 파일 생성

## 💻 코드 사용법

### 기본 환경 정보 가져오기

```typescript
import { getDevEnvironmentInfo } from '@/utils/init-dev-env';

const envInfo = getDevEnvironmentInfo();
console.log(`현재 환경: ${envInfo.type}`); // 'docker' 또는 'local'
console.log(`DB 호스트: ${envInfo.database.host}`);
```

### 환경별 분기 실행

```typescript
import { executeInDevEnvironment } from '@/utils/init-dev-env';

const apiConfig = executeInDevEnvironment(
  // Docker 환경에서 실행될 코드
  () => ({ timeout: 10000, retries: 3 }),
  // 로컬 환경에서 실행될 코드
  () => ({ timeout: 5000, retries: 1 })
);
```

### 환경 타입 확인

```typescript
import { getCurrentEnvironmentType } from '@/utils/init-dev-env';

const envType = getCurrentEnvironmentType(); // 'docker' | 'local' | 'production'

if (envType === 'docker') {
  // Docker 전용 로직
} else if (envType === 'local') {
  // 로컬 전용 로직
}
```

## ⚙️ 환경 강제 설정

자동 감지가 잘못될 경우 환경변수로 강제 설정 가능:

### .env.local 파일에서

```bash
# Docker 모드 강제
DEV_MODE=docker

# 로컬 모드 강제
DEV_MODE=local

# 자동 감지 (기본값)
# DEV_MODE=
```

### 실행 시 임시 설정

```bash
# Docker 모드로 실행
DEV_MODE=docker npm run dev

# 로컬 모드로 실행
DEV_MODE=local npm run dev
```

## 🔧 트러블슈팅

### 문제 1: 환경 감지가 잘못됨

**해결책:**

```bash
# 강제 설정으로 해결
export DEV_MODE=docker  # 또는 local
npm run dev
```

### 문제 2: 로컬에서 DB 연결 실패

**해결책:**

```bash
# PostgreSQL 설치 및 실행
brew install postgresql    # macOS
sudo apt install postgresql # Ubuntu

# 또는 Docker로 실행
docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres
```

### 문제 3: 로컬에서 Redis 연결 실패

**해결책:**

```bash
# Redis 설치 및 실행
brew install redis    # macOS
sudo apt install redis # Ubuntu

# 또는 Docker로 실행
docker run -d -p 6379:6379 redis
```

### 문제 4: DevContainer에서 서비스 연결 실패

**해결책:**

```bash
# 컨테이너 재시작
# VS Code에서 Ctrl+Shift+P → "Dev Containers: Rebuild Container"

# 또는 Docker Compose 재시작
docker-compose -f .devcontainer/docker-compose.yml down
docker-compose -f .devcontainer/docker-compose.yml up -d
```

## 📊 환경별 비교표

| 기능               | Docker 환경    | 로컬 환경        |
| ------------------ | -------------- | ---------------- |
| **설정 복잡도**    | 매우 간단      | 중간             |
| **초기 설정 시간** | 5-10분         | 30-60분          |
| **성능**           | 약간 느림      | 빠름             |
| **일관성**         | 완벽           | 환경에 따라 다름 |
| **디버깅**         | 제한적         | 완전 지원        |
| **DB/Redis**       | 자동 설치      | 수동 설치 필요   |
| **포트 충돌**      | 없음           | 발생 가능        |
| **팀 협업**        | 동일 환경 보장 | 환경 차이 가능   |

## 🎯 권장사항

### 🥇 1순위: DevContainer (Docker)

**언제 사용:**

- 팀 프로젝트
- 빠른 환경 구성 필요
- 일관된 개발 환경 요구
- 복잡한 의존성이 있는 경우

### 🥈 2순위: 로컬 개발

**언제 사용:**

- 개인 프로젝트
- 최고 성능 필요
- 시스템 레벨 디버깅 필요
- Docker 사용 불가한 환경

## 📚 추가 리소스

- [DevContainer 설정 가이드](.devcontainer/README.md)
- [환경별 사용 예시](src/examples/environment-usage.ts)
- [개발 워크플로우 가이드](DEV-WORKFLOW-GUIDE.md)
- [프로덕션 배포 가이드](PRODUCTION-READY.md)

## 🤝 기여하기

환경 감지 시스템 개선 사항이나 버그 발견 시:

1. GitHub Issues에 리포트
2. 개선 사항 PR 제출
3. 문서 업데이트 제안

---

> 💡 **팁**: 처음 사용하시는 분은 DevContainer를 권장합니다. VS Code에서 "Reopen in Container"만 클릭하면 모든 설정이 자동으로 완료됩니다!
