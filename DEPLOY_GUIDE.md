# 🚀 OpenManager v5.21.0 배포 가이드

## 📋 배포 전 체크리스트

### 🔧 1단계: 로컬 검증
```bash
# 📦 패키지 의존성 확인
npm ci

# 🔍 타입 체크
npm run type-check

# 🧹 ESLint 검사
npm run lint

# 🏗️ 빌드 테스트
npm run build

# ✅ 모든 단계를 한번에 실행
npm run deploy-check
```

### 🤖 2단계: 자동 검증 스크립트 실행
```bash
# 배포 준비 검증 스크립트 실행
node scripts/deploy-check.js
```

### 📊 3단계: GitHub Actions 확인
- GitHub에서 자동으로 실행되는 CI/CD 파이프라인 확인
- `.github/workflows/deploy-check.yml`에서 모든 체크 통과 확인

## 🌍 환경별 배포 설정

### 🧪 개발 환경 (Development)
```env
NODE_ENV=development
REDIS_URL=localhost:6379  # 선택사항
SLACK_WEBHOOK_URL=        # 선택사항
```

### 🚀 프로덕션 환경 (Vercel)
```env
NODE_ENV=production
REDIS_URL=your-redis-url
UPSTASH_REDIS_REST_URL=your-upstash-url
SLACK_WEBHOOK_URL=your-slack-webhook
```

## 📁 배포 아키텍처

### 🔧 서버 데이터 생성기 역할
- **목적**: 실제 서버 환경 시뮬레이션만 담당
- **독립성**: 실제 운영 서버 모니터링과 완전 분리
- **리소스 최적화**: 로컬/Vercel 자원 차이에 따른 적응형 스케일링

### 🧠 AI 분석 시스템 (완전 분리)
- **고정 서버**: 8개 서버 (primary 4개, secondary 3개, monitoring 1개)
- **AI 추론 안정성**: 서버 수 변동과 무관한 일관된 분석
- **MCP 통합**: Model Context Protocol 기반 외부 도구 연동

### ⚡ 오토스케일링 시뮬레이션 (독립 운영)
- **동적 스케일링**: 8-30대 서버 자동 조절
- **정책**: 85% CPU 시 scale-out, 30% CPU 시 scale-in
- **리소스 최적화**: 환경별 자원 소모량 조절

### 🎨 Vibe Coding 시스템
- **AI 협업 방법론**: Cursor AI, Claude, GitHub Copilot 활용
- **실제 성과**: 65% 압축률, 100% TypeScript, 507줄 엔진 구현
- **포트폴리오**: 혁신적 개발 과정 시연 페이지

## 🗂️ 핵심 모듈 구조

### 📦 설계 기반 핵심 모듈
```typescript
// AI 에이전트 시스템
/src/modules/ai-agent/          // 핵심 AI 로직
/src/modules/ai-sidebar/        // 실시간 상호작용 UI

// 서버 데이터 생성기
/src/services/ScalingSimulationEngine.ts    // 운영 시뮬레이션 (8-30대)
/src/services/AdvancedSimulationEngine.ts   // AI 분석 (고정 8개)

// MCP 통합 시스템  
/src/core/mcp/                  // Model Context Protocol
/src/modules/mcp/               // MCP 래퍼 시스템

// 모니터링 시스템
/src/app/admin/charts/          // 대시보드
/src/app/admin/mcp-monitoring/  // MCP 상태 모니터링
/src/app/api/metrics/           // 메트릭 API

// 컨텍스트 관리
/src/core/context/              // 컨텍스트 매니저
/src/app/api/admin/context-manager/  // 컨텍스트 API
```

### 🛠️ 개발 및 배포 도구
```typescript
/.github/workflows/             // CI/CD 파이프라인
/scripts/deploy-check.js        // 배포 검증 자동화
/e2e/, /tests/                  // 테스트 시스템
```

### 🎨 포트폴리오 및 마케팅
```typescript
/src/app/vibe-coding/           // AI 협업 개발 성과 시연
/docs/                          // 프로젝트 문서화
```

## 🚀 배포 전 필수 체크리스트

### ✅ 코드 품질 검증
```bash
npm run type-check              # TypeScript 타입 체크
npm run lint                    # ESLint 코드 품질 검사  
npm run build                   # 프로덕션 빌드 테스트
npm run deploy-check            # 통합 배포 검증
```

### ✅ 기능별 동작 확인  
```bash
# AI 에이전트 시스템
curl http://localhost:3000/api/ai-agent/integrated

# MCP 시스템 상태
curl http://localhost:3000/api/admin/mcp-monitoring  

# 스케일링 시뮬레이션
curl http://localhost:3000/api/simulate/ai-separation

# 모니터링 대시보드
curl http://localhost:3000/api/metrics/performance
```

## 🔗 배포 과정

### 1️⃣ 로컬 준비 확인
```bash
# 의존성 동기화
npm install

# 모든 검증 통과 확인
npm run deploy-check
```

### 2️⃣ 코드 커밋 및 푸시
```bash
git add .
git commit -m "feat: v5.21.0 - AI 분석 & 오토스케일링 분리 구조"
git push origin main
```

### 3️⃣ Vercel 자동 배포
- GitHub push 시 자동으로 Vercel 배포 시작
- 빌드 과정에서 모든 체크 자동 실행
- 성공 시 자동으로 프로덕션 배포

### 4️⃣ 배포 후 검증
```bash
# 로컬에서 프로덕션 API 테스트
curl https://your-domain.vercel.app/api/health
curl https://your-domain.vercel.app/api/simulate/ai-separation
```

## 🛠️ 트러블슈팅

### ❌ npm ci 에러
```bash
# package-lock.json 재생성
rm package-lock.json
npm install
git add package-lock.json
git commit -m "fix: regenerate package-lock.json"
```

### ❌ 타입 에러
```bash
# 타입 체크로 문제 확인
npm run type-check

# 필요시 타입 정의 업데이트
npm install @types/node --save-dev
```

### ❌ ESLint 에러
```bash
# 자동 수정 가능한 것들 수정
npm run lint:fix

# 수동으로 나머지 에러 수정 후
npm run lint
```

### ❌ 빌드 에러
```bash
# 상세한 빌드 에러 확인
npm run build 2>&1 | tee build.log

# 캐시 클리어 후 재시도
rm -rf .next
npm run build
```

## 📊 성능 모니터링

### 🔍 배포 후 확인 사항
1. **AI 분석 시스템**: 고정 8개 서버 기반 안정적 동작
2. **오토스케일링**: 8-30대 서버 동적 스케일링 정상 작동
3. **분리 아키텍처**: AI 추론과 운영 시뮬이 독립적으로 동작
4. **리소스 효율성**: 환경에 맞는 적응적 자원 사용

### 📈 주요 API 엔드포인트
- `/api/health` - 시스템 상태 확인
- `/api/simulate/ai-separation` - 분리 구조 데이터
- `/api/dashboard` - 대시보드 데이터
- `/api/ai/integrated` - AI 통합 분석

## 🎯 버전 5.21.0 주요 기능

### ✨ 새로운 기능
- **AI 분석-오토스케일링 완전 분리** 구조
- **ScalingSimulationEngine**: 8-30대 동적 서버 관리
- **AdvancedSimulationEngine v4.0**: AI 분석 전용 엔진
- **새로운 API**: `/api/simulate/ai-separation`

### 🔧 개선사항
- **Redis 연결 안정화**: DummyRedisClient fallback
- **TypeScript 타입 안전성**: 완전한 타입 호환성
- **배포 안정성**: GitHub Actions CI/CD 파이프라인
- **개발 경험**: 로컬 배포 검증 스크립트

### 📋 호환성
- **기존 API 완전 호환**: 모든 기존 엔드포인트 정상 작동
- **점진적 마이그레이션**: 새 기능과 기존 기능 공존
- **무중단 배포**: 서비스 중단 없이 업데이트 가능

---

**🎉 축하합니다! OpenManager v5.21.0이 성공적으로 배포되었습니다.**

문제가 발생하면 위의 트러블슈팅 가이드를 참고하거나 GitHub Issues에 문의하세요. 