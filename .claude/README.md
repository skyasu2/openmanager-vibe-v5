# Claude Code WSL 전용 설정

이 폴더는 OpenManager VIBE 프로젝트의 Claude Code WSL 전용 설정을 포함합니다.

## 🚀 빠른 시작 (WSL 전용)

```bash
# WSL 터미널에서 실행
cd /mnt/d/cursor/openmanager-vibe-v5
./scripts/setup-claude-code-wsl.sh
source ~/.bashrc
```

## 📁 파일 구조

- `mcp.json` - MCP 서버 설정 (프로젝트 전용) ✅
- `settings.local.json` - 권한 및 도구 설정 ✅
- `README.md` - 이 문서 ✅

### 🗑️ 제거된 중복 파일들

- ~~`mcp-windows.json`~~ - `mcp.json`과 동일하여 제거됨
- ~~`mcp-minimal.json`~~ - 빈 설정 파일로 제거됨
- ~~`mcp.json.backup*`~~ - 불필요한 백업 파일 제거됨
- ~~루트의 `mcp.json`~~ - WSL 경로 사용, 중복으로 제거됨

## 🔧 설정 우선순위

1. **프로젝트 설정 (.claude 폴더)** - 최우선
2. 글로벌 설정 (AppData/Roaming/Claude) - 백업용

⚠️ **중요**: `claude.mcp.json` 파일은 이 프로젝트에서 사용하지 않습니다. `.claude/mcp.json`이 유일한 MCP 설정 파일입니다.

## 🛠️ 활성화된 MCP 도구 (6개)

### 1. **filesystem** - 파일 시스템 접근

- 프로젝트 파일 읽기/쓰기/검색
- 디렉토리: `/mnt/d/cursor/openmanager-vibe-v5`
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

- Windows 경로 사용 (`/mnt/d/` 형식)
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
mcp__filesystem__list_directory({ path: "/mnt/d/cursor/openmanager-vibe-v5" })
mcp__memory__read_graph()
```

## 🔄 최근 업데이트 (2025-07-15)

### WSL 전용 설정 완료

- **통합 설정 스크립트**: `setup-claude-code-wsl.sh` 생성
- **환경변수 자동화**: `.env.local`에서 자동으로 읽어 `~/.bashrc`에 설정
- **Gemini CLI 별칭**: WSL에서 Windows gemini.exe 사용을 위한 별칭 추가
- **Gemini 개발 도구**: MCP 대신 `./tools/g` 직접 실행 도구 사용

### settings.local.json 권한 추가

- **Supabase MCP**: `select`, `insert`, `update`, `get_schema` 권한 추가
- **Tavily MCP**: `search`, `search_news`, `search_context`, `extract` 권한 추가
- **Filesystem MCP**: `create_directory`, `search_files` 권한 추가
- **GitHub MCP**: `search_repositories`, `create_repository`, `create_or_update_file`, `create_issue`, `create_pull_request`, `search_code` 권한 추가
- **Memory MCP**: `create_relations`, `add_observations` 권한 추가

최종 업데이트: 2025-07-15 (WSL 전용 설정 완료)
