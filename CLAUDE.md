# CLAUDE.md

Project guidance for Claude Code (claude.ai/code) when working with this repository.

## 🎯 프로젝트 개요

**OpenManager VIBE v5**: AI 기반 실시간 서버 모니터링 플랫폼

- 100% 무료 티어로 운영 (Vercel + GCP + Supabase)
- 엔터프라이즈급 성능 (152ms 응답, 99.95% 가동률)
- Next.js 15 + TypeScript strict mode

## 🛠️ 개발 환경

- **OS**: Windows 11 + WSL Ubuntu
- **Node.js**: v22.15.1
- **Package Manager**: npm
- **언어**: 한국어 우선 (기술 용어는 영어 병기)

## 📂 프로젝트 구조

```
src/
├── app/         # Next.js 15 App Router
├── services/    # 비즈니스 로직 (AI, Auth, MCP)
├── components/  # React 컴포넌트 (UI, 대시보드)
├── lib/         # 유틸리티 (Supabase, Redis, 환경설정)
└── types/       # TypeScript 타입 정의
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

# 검증
npm run validate:all     # 린트 + 타입 + 테스트
```

## 📝 개발 규칙 (필수)

1. **TypeScript**: `any` 타입 절대 금지, strict mode 필수
2. **파일 크기**: 500줄 권장, 1500줄 초과 시 분리
3. **코드 재사용**: 기존 코드 검색 후 작성
4. **커밋**: 매 커밋마다 CHANGELOG.md 업데이트
5. **문서**: 루트에는 README, CHANGELOG, CLAUDE, GEMINI만

## 💡 핵심 시스템

### AI 엔진

- **UnifiedAIEngineRouter**: 모든 AI 서비스 중앙 관리
- **엔진**: Google AI, Supabase RAG, Korean NLP
- **자동 폴백**: 실패 시 다른 엔진으로 자동 전환

### 인증

- **Supabase Auth**: GitHub OAuth
- **세션 관리**: JWT + Refresh Token

### 데이터베이스

- **PostgreSQL**: Supabase (500MB 무료)
- **Redis**: Upstash (256MB 무료)
- **Vector DB**: pgvector 확장

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

## ⚠️ 주의사항

1. **환경 변수**: `.env.local` 필수 (template 참조)
2. **무료 티어 한계**:
   - Vercel: 100GB 대역폭/월
   - Supabase: 500MB 저장소
   - GCP: 2백만 요청/월
3. **Git Hooks**: Husky 자동 실행 (pre-commit, pre-push)

## 📚 추가 문서

- 상세 가이드: `/docs` 폴더
- API 문서: `/docs/api`
- 서브 에이전트: `/docs/sub-agents-mcp-mapping-guide.md`
- Gemini 협업: `GEMINI.md`

---

💡 **핵심 원칙**: 간결성, 재사용성, 타입 안전성, 무료 티어 최적화
