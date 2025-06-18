# 🏠 집에서 개발하기 - OpenManager Vibe v5 워크플로우 가이드

## 🚀 빠른 시작

### 1단계: 환경 설정

```bash
# 1. 저장소 클론 (이미 완료)
git clone https://github.com/your-repo/openmanager-vibe-v5.git
cd openmanager-vibe-v5

# 2. 의존성 설치
npm install

# 3. 환경변수 설정
cp .env.local.template .env.local
# .env.local 파일이 자동으로 모든 서비스 연결 정보를 포함합니다
```

### 2단계: 서비스 상태 확인

```bash
# 모든 외부 서비스 상태 확인
npm run check-services

# 개발 서버 시작과 동시에 상태 확인
npm run dev:monitor
```

### 3단계: 개발 서버 실행

```bash
# 기본 개발 서버 (포트 3000 또는 3001)
npm run dev

# 특정 포트로 실행
npm run dev:port:3200
```

## 🛠️ 개발 도구 활용

### 실시간 서비스 모니터링

- **웹 대시보드**: http://localhost:3000/dev-tools
- **터미널 명령어**: `npm run check-services`
- **자동 새로고침**: 웹 대시보드에서 10초마다 자동 업데이트

### 지원되는 서비스들

✅ **Supabase** - PostgreSQL 데이터베이스 (ap-southeast-1)
✅ **Redis (Upstash)** - 캐시 및 세션 스토리지
✅ **Google AI (Gemini)** - AI 추론 엔진 (일일 10,000개 할당량)
✅ **Render MCP Server** - AI 컨텍스트 프로토콜 서버
✅ **Vercel Deployment** - 프로덕션 배포 환경

## 📊 개발 중 상태 확인 방법

### 방법 1: 터미널에서 빠른 확인

```bash
# 컬러풀한 상태 리포트
npm run check-services

# 간단한 API 호출
curl http://localhost:3000/api/dev/services-status
```

### 방법 2: 웹 대시보드 (권장)

1. 브라우저에서 http://localhost:3000/dev-tools 접속
2. 자동 새로고침 ON 설정
3. 개발하면서 실시간 모니터링

### 방법 3: Cursor IDE 통합

- Cursor 터미널에서 `npm run check-services` 실행
- 개발 중 언제든지 서비스 상태 확인 가능

## 🔧 문제 해결

### 환경변수 문제

```bash
# 환경변수 파일 재생성
cp .env.local.template .env.local

# 환경변수 로드 확인
npm run dev
```

### 서비스 연결 실패

1. **Supabase 오류**: `system_logs` 테이블 생성 필요
2. **Redis 오류**: 환경변수 확인 (.env.local)
3. **Google AI 오류**: API 키 할당량 확인
4. **Render MCP 오류**: 서버 슬립 모드 (자동 복구됨)

### 포트 충돌

```bash
# 포트 정리
npm run clean:ports

# 다른 포트로 실행
npm run dev:port:3201
```

## 🚀 배포 워크플로우

### 개발 → 스테이징

```bash
# 1. 로컬 테스트
npm run validate:quick

# 2. 빌드 테스트
npm run build

# 3. 프리뷰 배포
npm run deploy:preview
```

### 스테이징 → 프로덕션

```bash
# 1. 전체 검증
npm run validate:all

# 2. 프로덕션 배포
npm run deploy:prod

# 3. 배포 확인
npm run health-check:prod
```

## 💡 개발 팁

### 효율적인 개발 환경

1. **멀티 터미널 설정**:

   - 터미널 1: `npm run dev` (개발 서버)
   - 터미널 2: `npm run check-services` (상태 확인)
   - 터미널 3: 일반 작업용

2. **브라우저 탭 구성**:

   - http://localhost:3000 (메인 앱)
   - http://localhost:3000/dev-tools (개발 도구)
   - https://openmanager-vibe-v5.vercel.app (프로덕션)

3. **실시간 모니터링**:
   - 개발 도구 페이지를 항상 열어두기
   - 자동 새로고침 활성화
   - 서비스 오류 시 즉시 알림

### 성능 최적화

```bash
# 번들 분석
npm run build:analyze

# 성능 테스트
npm run perf-test

# 타입 체크
npm run type-check
```

### 테스트 실행

```bash
# 단위 테스트
npm run test:unit

# 통합 테스트
npm run test:integration

# E2E 테스트
npm run test:e2e
```

## 🔄 회사 ↔ 집 동기화

### 회사에서 집으로

```bash
# 1. 회사에서 커밋 & 푸시
git add -A
git commit -m "🏢 회사 작업 완료"
git push origin main

# 2. 집에서 풀
git pull origin main
npm install  # 새로운 의존성이 있을 경우
npm run check-services  # 환경 확인
```

### 집에서 회사로

```bash
# 1. 집에서 커밋 & 푸시
git add -A
git commit -m "🏠 집 작업 완료"
git push origin main

# 2. 회사에서 풀
git pull origin main
npm install  # 새로운 의존성이 있을 경우
npm run check-services  # 환경 확인
```

## 📱 모바일에서 확인

### 네트워크 접속

- 로컬 IP: http://192.168.0.104:3000 (개발 서버 시작 시 표시됨)
- 개발 도구: http://192.168.0.104:3000/dev-tools

### 프로덕션 확인

- 메인: https://openmanager-vibe-v5.vercel.app
- 상태: https://openmanager-vibe-v5.vercel.app/dev-tools

## 🆘 응급 상황 대응

### 서비스 전체 다운

```bash
# 1. 상태 확인
npm run check-services

# 2. 개발 서버 재시작
npm run dev:clean

# 3. 캐시 정리
npm run clean
```

### 배포 실패

```bash
# 1. 로컬 빌드 테스트
npm run build

# 2. 타입 오류 확인
npm run type-check

# 3. 린트 오류 확인
npm run lint:fix
```

### 긴급 롤백

```bash
# GitHub에서 이전 커밋으로 롤백
git revert HEAD
git push origin main
```

---

## 🎯 핵심 명령어 요약

| 명령어                   | 설명                        |
| ------------------------ | --------------------------- |
| `npm run check-services` | 모든 서비스 상태 확인       |
| `npm run dev:monitor`    | 상태 확인 후 개발 서버 시작 |
| `npm run dev`            | 개발 서버 시작              |
| `npm run validate:quick` | 빠른 검증 (타입체크 + 린트) |
| `npm run build`          | 프로덕션 빌드               |
| `npm run deploy:prod`    | 프로덕션 배포               |

**🌟 개발 효율성을 위해 http://localhost:3000/dev-tools 페이지를 항상 열어두세요!**
