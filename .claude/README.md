# Claude Code 프로젝트 설정

이 폴더는 OpenManager VIBE 프로젝트의 Claude Code 설정을 포함합니다.

## 🚀 빠른 시작

```bash
# Git Bash 또는 PowerShell에서 실행
cd D:\cursor\openmanager-vibe-v5
# PowerShell
.\scripts\install-all-mcp-servers.ps1
# 또는 Git Bash
./scripts/install-all-mcp-servers.sh
```

## 📁 파일 구조

- `mcp.json` - MCP 서버 설정 (프로젝트 전용) ✅
- `settings.local.json` - 권한 및 도구 설정 ✅
- `README.md` - 이 문서 ✅

### 🗑️ 제거된 중복 파일들

- ~~`mcp-windows.json`~~ - `mcp.json`과 동일하여 제거됨
- ~~`mcp-minimal.json`~~ - 빈 설정 파일로 제거됨
- ~~`mcp.json.backup*`~~ - 불필요한 백업 파일 제거됨
- ~~루트의 `mcp.json`~~ - 중복으로 제거됨

## 🔧 설정 우선순위

1. **프로젝트 설정 (.claude 폴더)** - 최우선
2. 글로벌 설정 (AppData/Roaming/Claude) - 백업용

⚠️ **중요**: `claude.mcp.json` 파일은 이 프로젝트에서 사용하지 않습니다. `.claude/mcp.json`이 유일한 MCP 설정 파일입니다.

## 🛠️ 활성화된 MCP 도구 (6개)

### 1. **filesystem** - 파일 시스템 접근

- 프로젝트 파일 읽기/쓰기/검색
- 디렉토리: `D:\cursor\openmanager-vibe-v5`
- 함수 프리픽스: `mcp__filesystem__*`

### 2. **github** - GitHub API 통합

- 이슈, PR, 커밋 관리
- 환경변수: `GITHUB_TOKEN`
- 함수 프리픽스: `mcp__github__*`

### 3. **memory** - 프로젝트 메모리

- 프로젝트 컨텍스트 저장/검색
- 지식 그래프 관리
- 함수 프리픽스: `mcp__memory__*`

### 4. **supabase** - 데이터베이스 통합

- Supabase DB 쿼리 및 관리
- 환경변수: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- 함수 프리픽스: `mcp__supabase__*`

### 5. **context7** - 문서 검색

- 라이브러리 문서 검색
- API 레퍼런스 조회
- 함수 프리픽스: `mcp__context7__*`

### 6. **tavily-mcp** - AI 웹 검색

- 실시간 웹 검색
- npx 실행 방식: `npx -y tavily-mcp@0.2.8`
- 환경변수: `TAVILY_API_KEY`
- 함수 프리픽스: `mcp__tavily-mcp__*` 또는 `mcp__tavily__*`

## 🚫 비활성화된 도구

- **brave-search** - Tavily로 대체됨
- **playwright** - 필요시 별도 활성화
- **redis** - 프로젝트에서 제거됨
- **gemini-cli-bridge** - MCP 지원 중단, Gemini v5.0 개발 도구 사용 권장 (`./tools/g`)

## ⚙️ WSL 환경 전용 설정

### 환경변수 설정 (자동화됨)

- `.env.local`에서 자동으로 읽어 `~/.bashrc`에 추가
- `GITHUB_TOKEN`, `SUPABASE_URL`, `TAVILY_API_KEY` 등

### Gemini CLI WSL 별칭

```bash
gemini     # Windows gemini.exe 실행
gp         # gemini -p 단축키
gs         # gemini /stats
gc         # gemini /clear
gcomp      # gemini /compress
gemini-pipe # 파이프 입력 지원
```

### 경로 설정

- Windows 네이티브 경로 사용 (`D:\` 형식)
- `npx` 명령어로 패키지 자동 설치
- 프로젝트별 독립적인 MCP 서버 실행

## 📝 업데이트 방법

1. `.claude/mcp.json` 파일 수정
2. Claude Code 재시작
3. 프로젝트 다시 열기
4. `/mcp` 명령으로 확인

## 🔐 보안 주의사항

- API 키는 환경변수로 관리
- `.gitignore`에 민감한 설정 제외
- 암호화된 키 사용 권장

## ✅ 설정 검증

```bash
# MCP 서버 상태 확인
/mcp

# 특정 MCP 도구 테스트
mcp__filesystem__list_directory({ path: "D:\\cursor\\openmanager-vibe-v5" })
mcp__memory__read_graph()
```

## 🎣 서브에이전트 자동화 훅 (Hooks)

### 개요
Claude Code가 특정 이벤트 발생 시 자동으로 서브에이전트를 활성화하는 강력한 자동화 시스템입니다.

### 구성된 훅 (7개)

#### 📝 PostToolUse 훅 (4개)
1. **테스트 파일 자동 검증**
   - 트리거: `*.test.ts`, `*.spec.ts` 파일 수정
   - 에이전트: `test-automation-specialist`
   - 동작: 테스트 실행 및 커버리지 확인

2. **대형 파일 모듈화**
   - 트리거: 1500줄 초과 파일 생성/수정
   - 에이전트: `structure-refactor-agent`
   - 동작: 파일 분할 및 모듈화 제안

3. **DB 쿼리 최적화**
   - 트리거: 100ms 이상 쿼리 실행
   - 에이전트: `database-administrator`
   - 동작: EXPLAIN ANALYZE 및 인덱스 최적화

4. **빌드/테스트 실패 디버깅**
   - 트리거: `npm run build` 또는 `npm test` 실패
   - 에이전트: `debugger-specialist`
   - 동작: 5단계 체계적 디버깅 프로세스

#### 🔒 PreToolUse 훅 (2개)
1. **보안 코드 사전 검사**
   - 트리거: auth/payment/credentials 관련 파일 수정 전
   - 에이전트: `security-auditor`
   - 동작: 취약점 사전 차단

2. **커밋 전 품질 검사**
   - 트리거: `git commit` 실행 전
   - 에이전트: `quality-control-checker`
   - 동작: CLAUDE.md 규칙 준수 확인

#### 💬 UserPromptSubmit 훅 (1개)
1. **복잡한 요청 자동 분해**
   - 트리거: 3개 이상 작업 또는 "전체", "모든" 키워드
   - 에이전트: `central-supervisor`
   - 동작: 작업 분해 및 멀티 에이전트 조율

### 테스트 방법
```bash
# 훅 테스트 스크립트 실행
node .claude/test-hooks.js

# 대형 파일 생성 테스트 (1500줄 이상)
# test-large-file.sample.ts 자동 생성됨
```

### 설정 파일 위치
- `.claude/settings.json` - hooks 섹션 포함
- `.claude/settings.json.backup-hooks-20250815` - 백업

## 🔄 최근 업데이트 (2025-08-15)

### 서브에이전트 훅 시스템 추가
- **7개 자동화 훅**: 테스트, 보안, 성능, 품질 자동 검사
- **정확한 에이전트 이름**: 18개 서브에이전트 정확히 매칭
- **1500줄 임계치**: 대형 파일 자동 모듈화 트리거
- **테스트 스크립트**: test-hooks.js로 검증 가능

## 🔄 이전 업데이트 (2025-07-15)

### Windows 네이티브 설정 완료

- **통합 설정 스크립트**: PowerShell 및 Git Bash 지원
- **환경변수 자동화**: `.env.local`에서 자동으로 읽어 설정
- **Gemini CLI**: Windows 네이티브 실행
- **Gemini 개발 도구**: MCP 대신 `./tools/g` 직접 실행 도구 사용

### settings.local.json 권한 추가

- **Supabase MCP**: `select`, `insert`, `update`, `get_schema` 권한 추가
- **Tavily MCP**: `search`, `search_news`, `search_context`, `extract` 권한 추가
- **Filesystem MCP**: `create_directory`, `search_files` 권한 추가
- **GitHub MCP**: `search_repositories`, `create_repository`, `create_or_update_file`, `create_issue`, `create_pull_request`, `search_code` 권한 추가
- **Memory MCP**: `create_relations`, `add_observations` 권한 추가

최종 업데이트: 2025-07-15 (WSL 전용 설정 완료)
