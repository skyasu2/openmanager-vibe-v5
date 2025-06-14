# 🚀 OpenManager Vibe v5 DevContainer 가이드

이 DevContainer는 OpenManager Vibe v5 프로젝트의 완전한 개발 환경을 제공합니다.

## 📋 포함된 구성 요소

### 🔧 개발 도구

- **Node.js 20 (LTS)** - 최신 안정 버전
- **TypeScript** - 타입 안전성
- **ESLint + Prettier** - 코드 품질 관리
- **Vitest** - 단위 테스트 프레임워크
- **Playwright** - E2E 테스트 (Chromium 브라우저 포함)
- **Storybook** - UI 컴포넌트 개발 및 문서화

### 🗄️ 데이터베이스 & 캐시

- **PostgreSQL 15** - 메인 데이터베이스
- **Redis 7** - 캐싱 및 세션 관리
- **Adminer** - PostgreSQL 웹 관리 도구 (<http://localhost:8080>)
- **Redis Commander** - Redis 웹 관리 도구 (<http://localhost:8081>)

### 🤖 AI & MCP

- **MCP (Model Context Protocol)** - AI 컨텍스트 관리
- **Google AI API** - AI 엔진 통합
- **벡터 데이터베이스** - RAG 엔진 지원

### 🌐 웹 서비스

- **Next.js 개발 서버** - 포트 3000
- **MCP 서버** - 포트 3100
- **Storybook** - 포트 6006

## 🚀 빠른 시작

### 1. DevContainer 열기

1. VS Code에서 프로젝트 폴더 열기
2. 왼쪽 하단의 "Reopen in Container" 클릭
3. 또는 Command Palette (`Ctrl+Shift+P`)에서 "Dev Containers: Reopen in Container" 선택

### 2. 초기 설정 확인

DevContainer가 시작되면 자동으로 실행됩니다:

- Node.js 의존성 설치
- 데이터베이스 초기화
- 환경 변수 파일 생성
- 개발 도구 설정

### 3. 환경 변수 설정

`.env.local` 파일에서 실제 API 키들을 설정하세요:

```bash
# Google AI API 키 (필수)
GOOGLE_AI_API_KEY=your-actual-api-key-here

# Slack 웹훅 (선택사항)
SLACK_WEBHOOK_URL=your-slack-webhook-url-here
```

### 4. 개발 서버 시작

```bash
# Next.js 개발 서버 시작
npm run dev

# 또는 모니터링과 함께 시작
npm run dev:monitor
```

## 📊 포트 매핑

| 포트 | 서비스 | 설명 |
|------|--------|------|
| 3000 | Next.js | 메인 웹 애플리케이션 |
| 3001 | 통합 서버 | 통합 개발 서버 |
| 3100 | MCP 서버 | AI 컨텍스트 프로토콜 |
| 5432 | PostgreSQL | 데이터베이스 |
| 6379 | Redis | 캐시 서버 |
| 6006 | Storybook | UI 컴포넌트 뷰어 |
| 8080 | Adminer | PostgreSQL 관리 |
| 8081 | Redis Commander | Redis 관리 |
| 9229 | Node.js 디버거 | 디버깅 포트 |

## 🔧 유용한 명령어

### 개발 서버

```bash
npm run dev              # Next.js 개발 서버
npm run dev:monitor      # 모니터링 포함 개발 서버
npm run storybook        # Storybook UI 뷰어
```

### 테스트

```bash
npm run test:unit        # 단위 테스트
npm run test:e2e         # E2E 테스트
npm run test:coverage    # 테스트 커버리지
npm run validate:quick   # 빠른 검증 (린트+타입체크)
npm run validate:all     # 전체 검증 (테스트+빌드 포함)
```

### 데이터베이스

```bash
psql-dev                 # PostgreSQL 접속 (별칭)
redis-cli                # Redis 접속 (별칭)
```

### AI & MCP

```bash
npm run mcp:status       # MCP 서버 상태 확인
npm run ai:test          # AI 엔진 테스트
npm run test:google-ai   # Google AI 연동 테스트
```

## 🗄️ 데이터베이스 구조

### 개발용 스키마

- `dev_monitoring` - 서버 모니터링 데이터
- `dev_ai_engine` - AI 엔진 요청/응답 로그
- `dev_mcp` - MCP 세션 관리

### 샘플 데이터

초기화 시 다음 샘플 데이터가 자동으로 삽입됩니다:

- 4개의 개발 서버 데이터
- 다양한 상태 (active, warning, critical)
- CPU, 메모리, 디스크 사용률 데이터

## 🔍 디버깅

### VS Code 디버깅

1. `F5` 키 또는 Run and Debug 패널 사용
2. Next.js 애플리케이션 디버깅 지원
3. 포트 9229에서 Node.js 디버거 연결

### 로그 확인

```bash
# 개발 서버 로그
npm run dev

# 컨테이너 로그 확인
docker-compose logs app
docker-compose logs postgres
docker-compose logs redis
```

## 🔧 트러블슈팅

### 데이터베이스 연결 문제

```bash
# PostgreSQL 연결 확인
pg_isready -h postgres -p 5432 -U postgres

# Redis 연결 확인
redis-cli -h redis -p 6379 ping
```

### 의존성 문제

```bash
# Node.js 의존성 재설치
rm -rf node_modules package-lock.json
npm install

# MCP 서버 의존성 재설치
cd mcp-server && npm install
```

### 포트 충돌

DevContainer는 자동으로 포트를 매핑하므로, 호스트의 동일한 포트가 사용 중이면 자동으로 다른 포트를 사용합니다.

## 🌟 고급 기능

### 성능 최적화

- Docker 볼륨을 사용한 node_modules 캐싱
- 멀티 시스템 대응 (cached/delegated 마운트)
- 한국어 로케일 설정

### 보안

- 개발 환경 전용 설정
- 프로덕션 키 분리
- Git 안전 디렉토리 설정

### AI 개발 지원

- MCP 서버 자동 설정
- Google AI API 통합
- 벡터 데이터베이스 지원
- 실시간 AI 로깅

## 📚 추가 리소스

- [프로젝트 README](../README.md)
- [개발 워크플로우 가이드](../DEV-WORKFLOW-GUIDE.md)
- [AI 시스템 문서](../docs/)
- [배포 가이드](../PRODUCTION-READY.md)

## 🤝 기여하기

DevContainer 설정 개선 사항이 있으면 언제든 PR을 보내주세요!

---

> 💡 **팁**: VS Code의 Settings Sync를 사용하면 개발 환경 설정을 팀원들과 쉽게 공유할 수 있습니다.
