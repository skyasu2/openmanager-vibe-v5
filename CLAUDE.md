# CLAUDE.md

Project guidance for Claude Code (claude.ai/code) when working with this repository.

📚 **Claude Code 공식 문서**: https://docs.anthropic.com/en/docs/claude-code/overview

## 🎯 프로젝트 개요

**OpenManager VIBE v5**: AI 기반 실시간 서버 모니터링 플랫폼

### 핵심 특징

- 100% 무료 티어로 운영 (Vercel + GCP + Supabase)
- 엔터프라이즈급 성능 (152ms 응답, 99.95% 가동률)
- Next.js 14.2.4 + React 18.2.0 + TypeScript strict mode

### 무료 티어 아키텍처

- **Frontend**: Vercel Edge Runtime (100GB 대역폭/월)
- **Backend API**: GCP Functions Python 3.11 (2백만 요청/월)
- **Database**: Supabase PostgreSQL (500MB)
- **Cache**: Upstash Redis (256MB)
- **Future**: GCP VM 무료 티어 활용 예정 (e2-micro)

### 주요 기능

- 📊 **실시간 모니터링**: CPU, Memory, Disk, Network (15초 간격)
- 🤖 **AI 분석**: 이상 징후 감지, 성능 예측, 자연어 질의
- 🔐 **인증**: GitHub OAuth 기반 접근 제어
- 📈 **대시보드**: 반응형 UI, 실시간 차트, 알림 시스템

## 🛠️ 개발 환경

- **OS**: Windows 11 + WSL Ubuntu
- **Node.js**: v22.15.1
- **Package Manager**: npm
- **언어**: 한국어 우선 (기술 용어는 영어 병기)
- **Python**: 3.11 (GCP Functions)

## 📂 프로젝트 구조

```
openmanager-vibe-v5/
├── src/             # 소스 코드
│   ├── app/         # Next.js 14 App Router
│   ├── services/    # 비즈니스 로직 (AI, Auth, MCP)
│   ├── components/  # React 컴포넌트
│   └── lib/         # 유틸리티
├── docs/            # 상세 문서 (100+개)
├── scripts/         # 자동화 스크립트
├── gcp-functions/   # Python 3.11 서버리스 (무료 티어)
│   ├── enhanced-korean-nlp/    # 한국어 처리
│   ├── ml-analytics-engine/    # ML 분석
│   └── unified-ai-processor/   # AI 통합 처리
└── tests/           # 테스트 코드
```

## 🚀 자주 사용하는 명령어

```bash
# 개발
npm run dev              # http://localhost:3000
npm run build            # 프로덕션 빌드
npm run lint:fix         # ESLint 자동 수정
npm run type-check       # TypeScript 검사

# 테스트
npm test                 # Vitest 실행
npm run test:e2e         # Playwright E2E
npm run test:coverage    # 커버리지 (목표: 70%+)

# 검증
npm run validate:all     # 린트 + 타입 + 테스트

# 모니터링
npx ccusage@latest blocks --live    # Claude 사용량 실시간
npm run health-check                 # API 상태 확인
```

## 📝 개발 규칙 (필수)

1. **TypeScript**: `any` 타입 절대 금지, strict mode 필수
2. **파일 크기**: 500줄 권장, 1500줄 초과 시 분리
3. **코드 재사용**: 기존 코드 검색 후 작성 (`@codebase` 활용)
4. **커밋**: 매 커밋마다 CHANGELOG.md 업데이트
5. **문서**: 루트에는 README, CHANGELOG, CLAUDE, GEMINI만
6. **사고 모드**: "think hard" 항상 활성화
7. **SOLID 원칙**: 모든 코드에 적용

### 타입 안전성 유틸리티

프로젝트 전반에서 타입 안전성을 위해 다음 유틸리티 함수들을 사용:

```typescript
// src/types/type-utils.ts
getErrorMessage(error); // error.message 대신 사용
safeArrayAccess(array, index); // array[index] 대신 사용
safeObjectAccess(obj, key); // obj.key 대신 사용
safeParseFloat(value); // parseFloat() 대신 사용

// src/types/react-utils.ts
useSafeEffect(() => {
  // 안전한 useEffect
  // cleanup 함수 자동 반환
}, [deps]);

useAsyncEffect(async () => {
  // 비동기 useEffect
  // 안전한 비동기 처리
}, [deps]);
```

## 💡 핵심 시스템

### AI 엔진

- **UnifiedAIEngineRouter**: 모든 AI 서비스 중앙 관리
- **엔진**: Google AI, Supabase RAG, Korean NLP
- **자동 폴백**: 실패 시 다른 엔진으로 자동 전환

### GCP Functions (서버리스)

- **enhanced-korean-nlp**: 한국어 자연어 처리
- **ml-analytics-engine**: ML 기반 분석
- **unified-ai-processor**: 통합 AI 처리
- **배포**: `scripts/deployment/deploy-all.sh`

### 인증

- **Supabase Auth**: GitHub OAuth
- **세션 관리**: JWT + Refresh Token

### 데이터베이스

- **PostgreSQL**: Supabase (500MB 무료)
  - 공식 문서: https://supabase.com/docs
- **Redis**: Upstash (256MB 무료)
  - Overview & 시작 가이드: https://upstash.com/docs/redis/overall/getstarted
  - SDK & Quickstart: https://upstash.com/docs/redis/sdks/ts/overview
- **Vector DB**: pgvector 확장

## 🔌 주요 API 엔드포인트

- `/api/servers/*` - 서버 메트릭 CRUD
- `/api/ai/*` - AI 분석 및 예측
- `/api/auth/*` - 인증/인가
- `/api/realtime/*` - 실시간 데이터 스트림
- `/api/admin/*` - 관리자 기능

## 🔧 MCP 서버 (9개)

현재 사용 가능한 MCP 서버:

- `filesystem`, `github`, `memory`, `supabase`
- `context7`, `tavily-mcp`, `sequential-thinking`
- `playwright`, `serena`

자세한 설정: `.claude/mcp.json`

## 🤖 유용한 Sub Agents

복잡한 작업 시 Task 도구로 서브 에이전트 활용:

| 작업 유형   | 추천 Agent                   | 용도                  |
| ----------- | ---------------------------- | --------------------- |
| 복잡한 작업 | `central-supervisor`         | 작업 분배 및 조율     |
| 코드 품질   | `code-review-specialist`     | SOLID 원칙, 타입 검사 |
| DB 최적화   | `database-administrator`     | 쿼리 성능, 인덱스     |
| 성능 개선   | `ux-performance-optimizer`   | Core Web Vitals       |
| 테스트      | `test-automation-specialist` | 테스트 작성/수정      |
| AI 시스템   | `ai-systems-engineer`        | AI 엔진 최적화        |
| 문서 관리   | `doc-structure-guardian`     | JBGE 원칙 적용        |

### 🚀 서브 에이전트 자율성

**중요**: 서브 에이전트는 스스로 판단하여 최적의 도구와 방법을 선택합니다.

- **central-supervisor**: 유일하게 tools 필드 없음 → **모든 도구 자동 상속**
- **기타 에이전트**: 필요한 MCP 도구를 스스로 선택하여 사용
- **프롬프트**: 작업 목표만 제시, 구체적인 방법은 에이전트가 결정

```typescript
// 권장 방식 - 작업 목표만 제시
Task({
  subagent_type: 'database-administrator',
  description: 'DB 최적화',
  prompt: 'Supabase 데이터베이스 성능을 최적화해주세요.',
});

// 병렬 처리 - 독립적인 작업은 동시 실행
Task({ subagent_type: 'issue-summary', prompt: '현재 시스템 이슈 분석' });
Task({
  subagent_type: 'ux-performance-optimizer',
  prompt: '프론트엔드 성능 개선',
});
Task({
  subagent_type: 'database-administrator',
  prompt: '데이터베이스 최적화',
});
```

### 🔗 서브 에이전트 체이닝 패턴

서브 에이전트들은 자동으로 연계하여 복잡한 작업을 처리합니다:

```
code-review-specialist (문제 발견)
  └─ 심각도 HIGH 이상 시 → issue-summary (영향 분석)
      └─ 시스템 전체 영향 시 → central-supervisor (대응 조율)
```

### 📊 실전 성공 사례

- **병렬 처리 효과**: 3개 에이전트 동시 실행으로 30-40% 시간 단축
- **자동 폴백**: AI 엔진 실패 시 200ms 이내 다른 엔진으로 전환
- **캐싱 최적화**: 반복 쿼리 70-80% 시간 절약

## ⚠️ 주의사항 및 트러블슈팅

### 환경 설정

1. **환경 변수**: `.env.local` 필수 (env.local.template 참조)
2. **무료 티어 한계**:
   - Vercel: 100GB 대역폭/월
   - Supabase: 500MB 저장소
   - GCP: 2백만 요청/월
3. **Git Hooks**: Husky 자동 실행 (pre-commit, pre-push)

### 자주 발생하는 문제

- **MCP 연결 오류**: `bash scripts/mcp/reset.sh` 실행
- **타입 에러**: `npm run type-check` → `npm run lint:fix`
- **OAuth 실패**: `.env.local`의 GitHub 키 확인
- **빌드 실패**: Node.js 버전 확인 (v22.15.1 필수)

### 파일 읽기/쓰기 에러

```
Error: File has not been read yet. Read it first before writing to it
```

- **원인**: Claude Code는 기존 파일 수정 시 반드시 Read 도구 먼저 사용
- **해결**: Write/Edit 전에 항상 Read 도구 사용
- **주의**: Sub agents도 동일한 규칙 적용

### 메모리 관리

```bash
# 개발 환경
--max-old-space-size=8192  # 8GB

# 프로덕션
--max-old-space-size=4096  # 4GB
```

## 🚀 배포 및 무료 티어 전략

### Vercel (Frontend)

- **공식 문서**: https://vercel.com/docs
- **명령어**: `vercel --prod` (main 브랜치 자동 배포)
- **환경 변수**: Vercel 대시보드에서 설정
- **무료 한계**: 100GB 대역폭/월, 100시간 빌드/월

### GCP Functions (Backend API)

- **공식 문서**: https://cloud.google.com/docs
- **Python 함수**: `gcp-functions/` 디렉토리
- **배포**: `scripts/deployment/deploy-all.sh`
- **무료 한계**: 2백만 호출/월, 400,000 GB-초

### 무료 티어 최적화 전략

- **캐싱**: Redis로 반복 요청 최소화
- **Edge Runtime**: Vercel Edge로 서버 부하 감소
- **요청 배치**: 여러 요청을 하나로 묶어 처리
- **자동 스케일링**: 트래픽에 따라 자동 조절

### 무료 티어 환경변수 상세 설정

```bash
# 서버리스 함수 제한
SERVERLESS_FUNCTION_TIMEOUT=8      # 8초 타임아웃
MEMORY_LIMIT_MB=40                 # 40MB 메모리 제한

# API 할당량 보호
GOOGLE_AI_DAILY_LIMIT=1000         # Google AI 일일 1000회
SUPABASE_MONTHLY_LIMIT=40000       # Supabase 월 40000회
REDIS_DAILY_LIMIT=8000             # Redis 일일 8000회

# 메모리 관리 강화
MEMORY_WARNING_THRESHOLD=35        # 35MB 경고 임계값
FORCE_GARBAGE_COLLECTION=true      # 강제 가비지 컬렉션

# Cron 작업 보안
CRON_SECRET=[YOUR_SECURE_CRON_SECRET_KEY]  # 크론 작업 인증키
```

## 💰 Claude + Gemini 협업 전략

토큰 사용량 최적화를 위한 Claude Code와 Gemini CLI 역할 분담:

| 작업 유형   | Claude Code | Gemini CLI | 토큰 절감률 |
| ----------- | ----------- | ---------- | ----------- |
| 코드 생성   | ✅ 주력     | 보조       | -           |
| 코드 분석   | 보조        | ✅ 주력    | 60%         |
| 문서 작성   | ✅ 주력     | 검토       | -           |
| 테스트 작성 | ✅ 주력     | 실행       | -           |
| 리팩토링    | 설계        | ✅ 실행    | 40%         |
| 디버깅      | 분석        | ✅ 해결    | 50%         |

### 실전 협업 예시

```bash
# 1단계: Gemini로 코드 분석 (무료)
gemini analyze src/services --complexity

# 2단계: Claude로 핵심 부분만 개선 (토큰 절약)
"complexity가 높은 processData 함수만 리팩토링해줘"

# 3단계: Gemini로 결과 검증 (무료)
gemini review --changes
```

## 📚 추가 문서

### 프로젝트 문서

- 상세 가이드: `/docs` 폴더
- API 문서: `/docs/api`
- 서브 에이전트: `/docs/sub-agents-mcp-mapping-guide.md`
- Gemini 협업: `GEMINI.md`

### Claude Code 공식 문서

- [Claude Code 개요](https://docs.anthropic.com/en/docs/claude-code/overview)
- [MCP (Model Context Protocol)](https://docs.anthropic.com/en/docs/claude-code/mcp)
- [서브 에이전트](https://docs.anthropic.com/en/docs/claude-code/sub-agents)
- [설정 가이드](https://docs.anthropic.com/en/docs/claude-code/settings)

---

💡 **핵심 원칙**: 간결성, 재사용성, 타입 안전성, 무료 티어 최적화

📊 **프로젝트 현황**:

- 코드 품질: 475개 → 400개 문제 (15.8% 개선), Critical 에러 99% 해결
- 무료 티어 사용률: Vercel 30%, GCP 15%, Supabase 3%
- GCP Functions: 3개 배포 완료, Python 3.11 최적화
