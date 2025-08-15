# AGENTS.md - Codex CLI 통합 설정 파일

> **이 파일은 Codex CLI 및 AI 도구 통합을 위한 핵심 설정 파일입니다**  
> **언어 정책: 한국어로 우선 대화, 기술 용어는 영어 사용 허용**  
> **최종 업데이트**: 2025-08-15 | **환경**: WSL 2

## 🌐 언어 사용 지침

### 한국어 우선 정책
- **대화**: 한국어로 우선 소통
- **기술 용어**: 영어 사용 허용 (예: TypeScript, API, MCP)
- **코드 주석**: 중요한 로직은 한국어로 설명
- **문서화**: 한/영 병행 작성 권장
- **커밋 메시지**: 이모지 + 한국어/영어 혼용 가능

## 🤖 에이전트 계층 구조

### 1️⃣ Claude Code (최상위 통제자)
- **역할**: 모든 개발 작업의 메인 통제자
- **설정 파일**: `CLAUDE.md`, `.claude/settings.json`
- **권한**: 전체 코드베이스 제어
- **협업**: 서브에이전트 오케스트레이션

### 2️⃣ 프로젝트 서브에이전트 (`.claude/agents/`)
- **codex-cli**: Codex CLI 도구 통합, 한국어 개발 지원
- **database-administrator**: Supabase PostgreSQL 전문 관리
- **mcp-server-admin**: 11개 MCP 서버 인프라 관리
- **test-automation-specialist**: Vitest/Playwright 테스트 자동화
- **ai-systems-engineer**: AI 엔진 통합 및 최적화

### 3️⃣ AI CLI 통합 도구
- **Gemini CLI**: Google AI 통합, 코드 리뷰 (사용자 요청 시)
- **Qwen CLI**: 병렬 개발, 독립 모듈 작업 (사용자 요청 시)
- **OpenAI CLI**: GPT 모델 활용 (선택적)

## 📁 프로젝트 구조

### 설정 파일 위치
```
/mnt/d/cursor/openmanager-vibe-v5/
├── AGENTS.md (이 파일 - Codex CLI 설정)
├── CLAUDE.md (Claude Code 가이드)
├── GEMINI.md (Gemini CLI 가이드)
├── QWEN.md (Qwen CLI 가이드)
├── .env.local (환경변수)
└── .claude/
    ├── settings.json (프로젝트 설정)
    ├── .mcp.json (MCP 서버 설정)
    └── agents/ (서브에이전트 정의)
        ├── codex-cli.md
        ├── database-administrator.md
        ├── mcp-server-admin.md
        ├── test-automation-specialist.md
        └── ai-systems-engineer.md
```

## 🔌 MCP 서버 통합 (11개)

### 활성화된 MCP 서버
1. **filesystem** - 파일 시스템 작업
2. **memory** - 지식 그래프 관리
3. **github** - GitHub 저장소 관리
4. **supabase** - PostgreSQL DB 관리
5. **tavily-mcp** - 웹 검색/크롤링
6. **playwright** - 브라우저 자동화
7. **time** - 시간/시간대 변환
8. **sequential-thinking** - 복잡한 문제 해결
9. **context7** - 라이브러리 문서
10. **shadcn-ui** - UI 컴포넌트 관리
11. **serena** - LSP 기반 코드 분석

## ⚙️ Codex CLI 환경 설정

### WSL 환경 변수
```bash
# 프로젝트 루트 (WSL 경로)
export PROJECT_ROOT="/mnt/d/cursor/openmanager-vibe-v5"

# 언어 설정
export LANG="ko_KR.UTF-8"
export LANGUAGE="ko:en"
export CODEX_LANGUAGE="ko-KR"

# AI CLI 도구 경로
export CLAUDE_CLI_PATH="/usr/local/bin/claude"
export GEMINI_CLI_PATH="/usr/local/bin/gemini"
export QWEN_CLI_PATH="/usr/local/bin/qwen"

# 문서 관리 정책
export DOCS_AUTO_ORGANIZE="true"
export AGENTS_ROOT_FIXED="true"
export JBGE_PRINCIPLE="true"

# MCP 서버 환경변수 (.env.local 참조)
source /mnt/d/cursor/openmanager-vibe-v5/.env.local
```

## 📋 서브에이전트 사용법

### Task 도구를 통한 호출
```typescript
// 서브에이전트 호출 예시
await Task({
  subagent_type: "codex-cli",
  description: "한국어 문서 정리",
  prompt: "docs 폴더의 한국어 문서를 체계적으로 정리해주세요"
});

await Task({
  subagent_type: "database-administrator",
  description: "DB 최적화",
  prompt: "Supabase 쿼리 성능을 분석하고 개선점을 제안해주세요"
});
```

## 🚀 개발 원칙

### 핵심 철학
1. **Type-First Development** - 타입 정의 우선
2. **Test-Driven Development** - 테스트 먼저 작성
3. **이모지 커밋 컨벤션** - 시각적 구분

### 코드 품질 기준
- TypeScript strict mode 필수
- any 타입 사용 금지
- 파일당 500줄 권장 (1500줄 초과 시 분리)
- 테스트 커버리지 70% 이상
- 한국어 주석으로 복잡한 로직 설명

## 📊 현재 프로젝트 상태

### 환경 정보
- **OS**: WSL 2 (Ubuntu 24.04 LTS)
- **Node.js**: v22.18.0
- **Framework**: Next.js 15 + TypeScript (strict)
- **Database**: Supabase PostgreSQL + pgvector
- **Cache**: Upstash Redis (500K cmd/월)

### 성능 지표
- **응답 시간**: 152ms (Korean NLP)
- **가동률**: 99.95%
- **테스트 커버리지**: 98.2%
- **TypeScript 에러**: 382개 (개선 진행 중)

## 📝 참고 문서

- [CLAUDE.md](./CLAUDE.md) - Claude Code 전체 가이드
- [MCP 설정 가이드](./docs/MCP-SETUP-GUIDE.md)
- [서브에이전트 가이드](./docs/technical/ai-engines/sub-agents-comprehensive-guide.md)
- [개발 가이드](./docs/development/development-guide.md)

---

**💡 이 파일은 루트에 고정되어야 합니다 (JBGE 원칙)**  
**🌏 한국어 우선, 기술 용어는 영어 허용**  
**🤖 Powered by Claude Code + Codex CLI Integration**