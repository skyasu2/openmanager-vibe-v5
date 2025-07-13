# MCP (Model Context Protocol) 완전 정복 가이드

## 1. MCP(Model Context Protocol)란 무엇인가?

MCP는 AI 어시스턴트(Claude Code, Cursor 등)가 파일 시스템, 데이터베이스, API와 같은 외부 도구 및 리소스와 안전하고 표준화된 방식으로 상호작용할 수 있게 해주는 프로토콜입니다. 간단히 말해, AI를 위한 강력한 플러그인 시스템입니다.

### 핵심 특징
- **표준화된 통신**: JSON-RPC 기반의 STDIO 통신으로 안정적인 데이터 교환을 보장합니다.
- **모듈식 아키텍처**: 필요한 기능(MCP 서버)만 선택적으로 활성화하여 리소스를 효율적으로 사용합니다.
- **강화된 보안**: 각 MCP 서버별로 권한 및 접근 제어가 가능하여 안전한 작업 환경을 제공합니다.
- **높은 확장성**: 누구나 커스텀 MCP 서버를 개발하여 AI의 기능을 무한히 확장할 수 있습니다.

## 2. OpenManager VIBE v5의 MCP 아키텍처

본 프로젝트는 개발, 배포, 프로덕션 각 단계에 최적화된 3가지 유형의 MCP 서버를 활용합니다.

### 아키텍처 다이어그램
```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Development    │     │  Vercel Dev     │     │  Production     │
│     MCP         │     │  Tools MCP      │     │     MCP         │
│   (Local)       │     │ (@vercel/mcp)   │     │  (GCP VM)       │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                         │
    개발 도구(IDE)          배포 환경 모니터링         AI 엔진 통합
    코드 자동완성,            실시간 상태 확인           Supabase RAG + NLP
    DB 직접 관리              원격 디버깅 및 테스트      실시간 데이터 처리
         │                       │                         │
         └───────────────────────┴─────────────────────────┘
                                 │
                         OpenManager Vibe v5
                           애플리케이션
```

## 3. MCP 서버 설정 및 관리 (Claude Code v1.0.51+ 기준)

**중요:** Claude Code v1.0.51부터는 `~/.claude/settings.json` 파일을 직접 수정하는 방식이 아닌, `claude mcp` CLI 명령어를 사용해야 합니다.

### 🚀 자동 설정 (권장)
가장 쉽고 빠른 방법은 미리 준비된 npm 스크립트를 사용하는 것입니다.

```bash
# 프로젝트에 필요한 모든 MCP 서버를 자동으로 설정합니다.
# (내부적으로 `claude mcp add` 명령어를 실행)
npm run mcp:setup

# 설정된 MCP 서버 목록 확인
npm run mcp:list
```
**⚠️ 주의:** 위 명령어는 Claude Code 내장 터미널이 아닌, **일반 터미널(WSL, PowerShell, Git Bash 등)**에서 실행해야 합니다.

### 🔧 수동 설정 (개별 서버 추가)
필요한 MCP 서버만 개별적으로 추가할 수 있습니다.

```bash
# 예시: Filesystem MCP 서버 추가
claude mcp add filesystem node \
  "/path/to/project/node_modules/@modelcontextprotocol/server-filesystem/dist/index.js" \
  "/path/to/project" # 허용할 디렉토리 경로

# 예시: GitHub MCP 서버 추가 (환경변수 사용)
claude mcp add github node \
  "/path/to/project/node_modules/@modelcontextprotocol/server-github/dist/index.js" \
  -e GITHUB_PERSONAL_ACCESS_TOKEN="${GITHUB_TOKEN}"
```

## 4. 주요 MCP 서버 상세 가이드

### Filesystem MCP
- **기능**: 로컬 파일 읽기, 쓰기, 검색 등 파일 시스템에 접근합니다.
- **설정 시 주의사항**:
  - **반드시 허용할 디렉토리를 `args`로 전달해야 합니다.** 환경변수(`ALLOWED_DIRECTORIES`) 방식은 더 이상 작동하지 않습니다.
  - 보안을 위해 프로젝트 루트 디렉토리 등 최소한의 범위로 경로를 제한하는 것이 좋습니다.

### Supabase MCP
- **기능**: Supabase 데이터베이스 쿼리, 데이터 조작, 실시간 구독 등을 지원합니다.
- **사용 예시**:
  ```
  @supabase
  -- 활성 상태인 서버 목록 조회
  SELECT * FROM servers WHERE status = 'active';
  ```

### Gemini CLI Bridge v3.0
- **기능**: Claude와 Gemini 간의 양방향 통신을 중계하는 핵심 브릿지입니다. v3.0으로 업데이트되면서 `--prompt` 최적화 및 자동 모델 선택 기능이 강화되었습니다.
- **사용 예시**:
  ```
  @gemini-cli-bridge
  # Flash 모델로 코드 리뷰 요청
  gemini_chat_flash("다음 코드의 개선점을 알려줘: [코드 스니펫]")
  ```

### Tavily MCP
- **기능**: AI 기반 웹 검색 엔진으로 실시간 정보 검색, 웹 컨텐츠 추출, 사이트 크롤링, 사이트맵 생성 등을 지원합니다.
- **주요 도구**:
  - `tavily-search`: 웹 검색 및 필터링
  - `tavily-extract`: URL에서 컨텐츠 추출  
  - `tavily-crawl`: 사이트 크롤링
  - `tavily-map`: 사이트 구조 매핑
- **사용 예시**:
  ```
  @tavily
  # Vercel 무료 티어 한도 검색
  tavily_search("Vercel free tier limits monthly 2025", include_domains=["vercel.com"])
  ```

## 5. 문제 해결(Troubleshooting) 완전 가이드

### 🔥 최신 해결 사례: Filesystem MCP 서버 실패
- **문제**: `mcp-server-filesystem <allowed-directory>` 오류와 함께 서버 시작 실패.
- **원인**: 허용 디렉토리를 `args`가 아닌 `env`로 전달.
- **해결**: `claude mcp add` 명령어 사용 시, 아래와 같이 마지막 인자로 허용 디렉토리 경로를 직접 추가해야 합니다.
  ```json
  // ❌ 잘못된 설정 (구 방식)
  "env": { "ALLOWED_DIRECTORIES": "D:/cursor/openmanager-vibe-v5" }

  // ✅ 올바른 설정 (신 방식)
  "args": [
    "./node_modules/@modelcontextprotocol/server-filesystem/dist/index.js",
    "D:/cursor/openmanager-vibe-v5"  // 디렉터리를 마지막 인자로 전달
  ]
  ```

### 자주 발생하는 문제와 해결법

| 문제 상황 | 원인 | 해결 방법 |
| --- | --- | --- |
| `claude mcp list`에 서버가 안 보임 | Claude Code가 설정을 제대로 읽지 못함 | 1. Claude Code를 완전히 종료 후 재시작<br>2. `npm run mcp:reset` 후 `npm run mcp:setup`으로 재설정 |
| "Unrecognized field: mcpServers" 오류 | `~/.claude/settings.json`에 남아있는 구버전 설정 | `~/.claude/settings.json` 파일을 열어 `mcpServers` 필드를 완전히 삭제 |
| "Raw mode is not supported" 오류 | Claude Code 내장 터미널에서 설정 스크립트 실행 | 일반 터미널(WSL, PowerShell 등)에서 스크립트 실행 |
| 환경변수 관련 오류 (API 키 등) | MCP 프로세스가 환경변수를 상속받지 못함 | `claude mcp add` 명령어의 `-e` 옵션을 사용하여 환경변수를 명시적으로 주입 |
| "ENOENT: no such file or directory" | 파일 또는 디렉토리 경로가 잘못됨 | WSL 환경에서는 `/mnt/d/...` 와 같은 경로를 사용하고, 경로가 올바른지 재확인 |
| "Permission denied" | 파일 실행 권한 없음 | `chmod +x <file>` 명령어로 스크립트 또는 서버 파일에 실행 권한 부여 |

### 디버깅 심화 과정
1.  **Claude Code 로그 확인**: `~/.claude/logs/` 디렉토리에서 최신 로그 파일을 확인하여 오류 단서를 찾습니다.
2.  **MCP 서버 직접 실행**: 터미널에서 MCP 서버 파일을 직접 실행하여 오류 메시지를 확인합니다.
    ```bash
    # 디버그 모드로 Filesystem 서버 실행
    DEBUG=* node ./node_modules/@modelcontextprotocol/server-filesystem/dist/index.js /path/to/project
    ```

## 6. 보안 및 권장사항

- **인증 정보 보호**: API 키나 서비스 키는 절대로 코드나 설정 파일에 직접 하드코딩하지 말고, 환경변수를 통해 안전하게 주입하세요.
- **최소 권한 원칙**: Filesystem MCP에는 꼭 필요한 디렉토리만 허용하고, 데이터베이스 계정은 필요한 권한만 가지도록 제한하세요.
- **정기적인 업데이트**: `npm outdated` 명령어로 MCP 서버 패키지의 최신 버전을 확인하고 정기적으로 업데이트하여 보안 및 성능을 개선하세요.

---
이 문서는 OpenManager VIBE v5 프로젝트의 MCP 설정 및 사용에 대한 모든 것을 담고 있습니다. 문제가 발생하면 이 문서를 가장 먼저 참고해주세요.
