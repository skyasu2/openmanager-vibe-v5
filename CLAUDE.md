# CLAUDE.md

Project guidance for Claude Code (claude.ai/code) when working with this repository.

## 🌏 개발 환경

- **OS**: Windows 11 + WSL Ubuntu
- **Node.js**: v22.15.1
- **언어**: 한국어 우선 (기술 용어는 영어 병기)
- **사고 모드**: "think hard" 항상 활성화

## 📦 MCP 서버 구성

### 로컬 개발용 (9개)

- `filesystem`, `github`, `memory`, `supabase`, `context7`
- `tavily-mcp`, `sequential-thinking`, `playwright`, `serena`

### GCP VM용

- AI 어시스턴트 전용 (파일시스템 MCP만 구현)
- 자연어 질의 처리용

## 🚀 핵심 명령어

```bash
# 개발
npm run dev              # 개발 서버
npm run build            # 프로덕션 빌드

# 테스트 (TDD 필수)
npm test                 # 전체 테스트
npm run test:coverage    # 커버리지 (목표: 70%+)

# 코드 품질
npm run lint:fix         # 린트 자동 수정
npm run validate:all     # 종합 검증

# 모니터링
npm run ccusage:live     # Claude 사용량 실시간
npm run health-check     # API 상태 확인
```

## 🏗️ 프로젝트 구조

```
src/
├── app/         # Next.js 15 App Router
├── services/    # 비즈니스 로직
├── domains/     # DDD 도메인 모듈
├── components/  # React 컴포넌트
└── lib/         # 유틸리티
```

### AI 엔진 아키텍처

- **UnifiedAIEngineRouter**: 모든 AI 서비스 중앙 관리
- **Multi-Engine**: Google AI, Supabase RAG, Korean NLP, MCP Context
- **Fallback Strategy**: 자동 엔진 전환

## 📝 개발 가이드라인

### 필수 규칙

- ✅ TypeScript strict mode (any 금지)
- ✅ SOLID 원칙 준수
- ✅ 파일당 500줄 권장, 1500줄 초과 시 분리
- ✅ 기존 코드 재사용 우선 (`@codebase` 활용)
- ✅ 커밋마다 CHANGELOG.md 업데이트

### 문서 위치

- **루트**: README.md, CHANGELOG.md, CLAUDE.md, GEMINI.md만 허용
- **기타 문서**: `/docs` 폴더에 저장
- ⚠️ 루트에 다른 문서 생성 금지

### 환경 변수

- `GOOGLE_AI_API_KEY`: Google AI 키
- `SUPABASE_*`: Supabase 인증
- 백업: `npm run env:backup`

## 🤖 Sub Agents (10개) - 정상 동작 확인됨

### 에이전트별 추천 MCP 서버 매핑

1. **🤖 ai-systems-engineer** - AI 시스템 아키텍처
   - 주요: `supabase`, `memory`, `sequential-thinking`, `filesystem`
   - 보조: `tavily-mcp`, `context7`

2. **🛠️ mcp-server-admin** - MCP 인프라 관리
   - 주요: `filesystem`, `tavily-mcp`, `github`
   - 보조: `memory`, `sequential-thinking`

3. **🚨 issue-summary** - DevOps 모니터링
   - 주요: `supabase`, `filesystem`, `tavily-mcp`
   - 보조: `memory`, `sequential-thinking`

4. **🗄️ database-administrator** - DB 최적화
   - 주요: `supabase`, `filesystem`, `memory`
   - 보조: `context7`, `sequential-thinking`

5. **🔍 code-review-specialist** - 코드 품질 검토
   - 주요: `filesystem`, `github`, `serena`
   - 보조: `context7`, `sequential-thinking`

6. **📚 doc-structure-guardian** - 문서 구조 관리
   - 주요: `filesystem`, `github`, `memory`
   - 보조: `sequential-thinking`

7. **🎨 ux-performance-optimizer** - 프론트엔드 성능
   - 주요: `filesystem`, `playwright`, `tavily-mcp`
   - 보조: `context7`, `memory`

8. **🤖 gemini-cli-collaborator** - AI 협업
   - 주요: `filesystem`, `github`, `sequential-thinking`
   - 보조: `memory`, `tavily-mcp`

9. **🧪 test-automation-specialist** - 테스트 자동화
   - 주요: `filesystem`, `playwright`, `github`
   - 보조: `context7`, `memory`

10. **🧬 agent-evolution-manager** - 에이전트 진화 관리
    - 주요: `memory`, `filesystem`, `sequential-thinking`, `github`
    - 보조: `tavily-mcp`, `supabase`

### 서브 에이전트 사용 예시

```bash
# AI 시스템 최적화 작업
Task(
  subagent_type="🤖-ai-systems-engineer",
  description="SimplifiedQueryEngine 성능 개선",
  prompt="주요 MCP: supabase, memory, sequential-thinking 활용"
)

# 코드 리뷰 요청
Task(
  subagent_type="🔍-code-review-specialist",
  description="PR #123 보안 검토",
  prompt="serena와 github MCP를 활용한 취약점 스캔"
)

# 에이전트 성능 자동 개선 (백그라운드 실행)
Task(
  subagent_type="🧬-agent-evolution-manager",
  description="에이전트 주간 성능 리뷰",
  prompt="모든 에이전트의 성능 메트릭 분석 및 자동 개선"
)
```

💡 **팁**: 각 에이전트는 작업 특성에 맞는 MCP 조합으로 최적화되어 있습니다.
상세 가이드: `docs/sub-agents-mcp-mapping-guide.md`

## 💡 사용 팁

### Claude Code 사용량 모니터링

```bash
npx ccusage@latest blocks --live    # 실시간 대시보드
npm run ccusage:daily               # 일별 사용량
```

### 메모리 관리

- 개발: 8GB (`--max-old-space-size=8192`)
- 프로덕션: 4GB (`--max-old-space-size=4096`)

### 성능 최적화

- Vercel 무료 티어 최적화
- Edge Runtime 활용
- 캐싱 전략 구현

## 🔍 트러블슈팅

- **메모리 에러**: package.json의 Node.js 메모리 제한 확인
- **AI 타임아웃**: API 키와 네트워크 연결 확인
- **빌드 실패**: `npm run type-check`로 TypeScript 이슈 확인

## 📚 관련 문서

- **MCP 가이드**: `docs/claude-code-mcp-setup-2025.md`
- **AI 시스템**: `docs/ai-system-unified-guide.md`
- **보안 가이드**: `docs/security-complete-guide.md`
- **개발 도구**: `docs/development-tools.md`

---

💡 **핵심 원칙**: 간결성, 재사용성, 타입 안전성, 무료 티어 최적화
