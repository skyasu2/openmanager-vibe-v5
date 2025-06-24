# 🚀 Cursor IDE → Render 직접 배포 가이드

## 📋 개요

OpenManager Vibe v5에서 Cursor IDE를 사용하여 Render로 직접 배포할 수 있는 통합 배포 시스템입니다.

## ✨ 주요 기능

### 🎯 원클릭 배포

- **자동 검증**: TypeScript, ESLint, 빌드 테스트
- **Git 관리**: 자동 커밋, 푸시, 충돌 해결
- **배포 모니터링**: 실시간 상태 확인
- **헬스체크**: 배포 완료 후 자동 검증

### 🔧 스마트 기능

- **환경 감지**: 개발/프로덕션 환경 자동 인식
- **오류 복구**: 배포 실패 시 자동 롤백 옵션
- **로그 추적**: 상세한 배포 과정 로깅
- **성능 최적화**: 빌드 캐시 및 압축 최적화

## 🚀 빠른 시작

### 1. 기본 배포

```bash
npm run cursor:deploy
```

### 2. 자동 커밋 배포

```bash
npm run cursor:deploy:auto
```

### 3. Render 전용 배포

```bash
npm run render:deploy
```

## 📊 배포 프로세스

### 🔍 1단계: 환경 검증

```
✅ Node.js 버전 확인
✅ Git 브랜치 확인
✅ MCP 서버 디렉토리 존재 확인
✅ 의존성 설치 상태 확인
```

### 🧪 2단계: 코드 검증

```
✅ TypeScript 타입 체크
✅ ESLint 규칙 검사
✅ 빠른 품질 검증
```

### 📋 3단계: Git 상태 관리

```
✅ 변경사항 감지
✅ 자동 커밋 (옵션)
✅ 원격 저장소 동기화
```

### 🚀 4단계: 배포 트리거

```
✅ Git 푸시 실행
✅ Render 자동 배포 트리거
✅ 배포 URL 확인
```

### 👀 5단계: 배포 모니터링

```
✅ 배포 진행 상황 추적
✅ 실시간 상태 업데이트
✅ 오류 감지 및 알림
```

### ✅ 6단계: 배포 검증

```
✅ 헬스체크 실행
✅ MCP 도구 테스트
✅ 서비스 가용성 확인
```

## 🔧 고급 설정

### 환경 변수 설정

#### 필수 환경 변수

```bash
# Render 대시보드에서 설정
GITHUB_TOKEN=your_github_token
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_key
UPSTASH_REDIS_REST_URL=your_redis_url
UPSTASH_REDIS_REST_TOKEN=your_redis_token
GOOGLE_AI_API_KEY=your_google_ai_key
```

#### 배포 전용 환경 변수

```bash
NODE_ENV=production
RENDER=true
CURSOR_DEPLOY=true
ENABLE_HTTP=true
PORT=10000
AI_ENGINE_MODE=true
DEPLOY_SOURCE=cursor-ide
```

### Render 서비스 설정

#### 기본 설정

```yaml
name: openmanager-mcp-cursor
runtime: node
plan: free
region: oregon
branch: main
rootDir: mcp-server
autoDeploy: true
```

#### 빌드 명령

```bash
npm ci --production=false
npm run build
```

#### 시작 명령

```bash
npm start
```

#### 헬스체크

```
경로: /health
간격: 30초
타임아웃: 10초
재시도: 3회
```

## 📈 모니터링 및 로깅

### 실시간 모니터링

- **CPU 사용률**: 80% 초과 시 알림
- **메모리 사용률**: 90% 초과 시 알림
- **응답 시간**: 5초 초과 시 알림
- **에러율**: 5% 초과 시 알림

### 로그 수집

```
📝 배포 로그: /opt/render/project/logs/deploy.log
🎯 Cursor 로그: /opt/render/project/logs/cursor-deploy.log
📊 성능 로그: /opt/render/project/logs/performance.log
🚨 에러 로그: /opt/render/project/logs/error.log
```

### 상태 대시보드

```
🌐 서비스 URL: https://openmanager-vibe-v5.onrender.com
🏥 헬스체크: https://openmanager-vibe-v5.onrender.com/health
📊 상태 페이지: https://openmanager-vibe-v5.onrender.com/admin/status
📈 메트릭: https://openmanager-vibe-v5.onrender.com/metrics
```

## 🔒 보안 설정

### CORS 설정

```javascript
origins: [
  "vscode-webview://*",
  "https://*.cursor.sh", 
  "http://localhost:*"
]
methods: ["GET", "POST", "PUT", "DELETE"]
headers: ["Content-Type", "Authorization", "X-Cursor-Token"]
```

### API 보호

```javascript
rate_limit: 100/minute
ip_whitelist: ["0.0.0.0/0"] // 개발 단계
env_encryption: AES-256-GCM
```

### 환경 변수 암호화

```bash
# 민감한 정보는 Render 대시보드에서 설정
# 코드에 하드코딩 금지
# 환경 변수 자동 암호화 적용
```

## 🛠️ 문제 해결

### 일반적인 오류

#### 1. Git 푸시 실패

```bash
# 해결 방법
git status
git pull origin main
git push origin main
```

#### 2. 빌드 실패

```bash
# 해결 방법
npm run validate:quick
npm run build
```

#### 3. 환경 변수 누락

```bash
# Render 대시보드에서 확인
# 필수 환경 변수 설정 확인
```

#### 4. 헬스체크 실패

```bash
# 배포 완료까지 2-3분 대기
# 로그 확인: Render 대시보드
```

### 디버깅 명령어

#### 로컬 테스트

```bash
# 빠른 검증
npm run validate:quick

# 전체 테스트
npm run test:all

# AI 시스템 테스트
node test-vercel-ai-system.js
```

#### 원격 확인

```bash
# 헬스체크
curl https://openmanager-vibe-v5.onrender.com/health

# MCP 도구 테스트
curl -X POST https://openmanager-vibe-v5.onrender.com/mcp/tools/list_directory \
  -H "Content-Type: application/json" \
  -d '{"path": "."}'
```

## 📚 추가 리소스

### 공식 문서

- [Render 배포 가이드](https://render.com/docs)
- [Cursor IDE 문서](https://cursor.sh/docs)
- [OpenManager API 문서](./api-reference-v5.43.5.md)

### 관련 파일

```
📁 infra/config/render-cursor-deploy.yaml  # 배포 설정
📁 scripts/cursor-render-deploy.js         # 배포 스크립트
📁 mcp-server/                             # MCP 서버 코드
📁 docs/cursor-render-deployment.md        # 이 문서
```

### 지원 채널

- **GitHub Issues**: 버그 리포트 및 기능 요청
- **Discord**: 실시간 개발자 지원
- **이메일**: <support@openmanager.dev>

## 🎯 성능 최적화

### 빌드 최적화

```javascript
// 번들 크기 최적화
compression: ["gzip", "br"]
cache: {
  static_files: "24h",
  api_responses: "5m"
}

// 메모리 최적화
max_heap_size: "400MB"
gc_interval: "30s"
```

### 배포 속도 개선

```bash
# 증분 빌드 활성화
INCREMENTAL_BUILD=true

# 캐시 최적화
BUILD_CACHE=true

# 병렬 처리
PARALLEL_BUILD=true
```

## 🚀 CI/CD 통합

### GitHub Actions 연동

```yaml
name: Cursor Render Deploy
on:
  push:
    branches: [main]
    paths: ['mcp-server/**']

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Render
        run: npm run cursor:deploy:auto
```

### 자동 배포 워크플로우

```
1. 코드 변경 → Git 푸시
2. GitHub Actions 트리거
3. Render 자동 배포
4. 헬스체크 실행
5. 슬랙 알림 전송
```

---

## 📋 체크리스트

### 배포 전 확인사항

- [ ] 모든 테스트 통과
- [ ] 환경 변수 설정 완료
- [ ] Git 상태 정리
- [ ] 브랜치 확인 (main)
- [ ] 의존성 최신화

### 배포 후 확인사항

- [ ] 헬스체크 통과
- [ ] MCP 도구 정상 작동
- [ ] API 엔드포인트 응답
- [ ] 로그 정상 수집
- [ ] 모니터링 활성화

---

**🎉 Cursor IDE에서 Render로의 원활한 배포를 위한 완전한 가이드입니다!**
