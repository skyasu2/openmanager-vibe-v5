# Claude Code MCP (Model Context Protocol) 설정 가이드

## 🎯 MCP 서버 설정 완료!

Claude Code v1.0.51에서 MCP 서버가 성공적으로 설정되었습니다.

## ✅ 현재 설정된 MCP 서버 목록 (7개)

| 서버 이름 | 설명 | 용도 |
|-----------|------|------|
| **filesystem** | 파일 시스템 접근 | 프로젝트 파일 읽기/쓰기/검색 |
| **github** | GitHub API 통합 | 이슈/PR 관리, 저장소 작업 |
| **brave-search** | 웹 검색 | 최신 기술 정보 및 문서 검색 |
| **memory** | 컨텍스트 메모리 | 프로젝트 지식 저장 및 검색 |
| **supabase** | 데이터베이스 통합 | Supabase DB 쿼리 및 관리 |
| **context7** | 문서 검색 | 라이브러리 문서 및 API 참조 |
| **gemini-cli-bridge** | Gemini CLI 브릿지 v2.0 | 양방향 Claude ↔ Gemini 통합 |

## 📝 MCP 설정 방법

### 1. 기본 명령어 구조
```bash
claude mcp add <이름> <명령어> [인수...] [옵션]
```

### 2. 실제 설정 예시

#### 파일시스템 MCP
```bash
claude mcp add filesystem "npx" "@modelcontextprotocol/server-filesystem" "/mnt/d/cursor"
```

#### GitHub MCP (환경변수 포함)
```bash
claude mcp add github "node" "경로/server-github/dist/index.js" \
  -e GITHUB_PERSONAL_ACCESS_TOKEN="${GITHUB_TOKEN}"
```

#### Supabase MCP (다중 환경변수)
```bash
claude mcp add supabase "node" "경로/server-supabase/dist/index.js" \
  -e SUPABASE_URL="https://your-project.supabase.co" \
  -e SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

### 3. 설정 확인 및 관리
```bash
# 설정된 서버 목록 보기
claude mcp list

# 특정 서버 제거
claude mcp remove <서버이름>

# 도움말
claude mcp --help
```

## 🔧 고급 설정

### 환경변수 설정
```bash
# -e 옵션으로 환경변수 추가
claude mcp add <이름> <명령어> <인수> -e KEY=value -e KEY2=value2
```

### 설정 스코프
```bash
# 로컬 프로젝트에만 적용 (기본값)
claude mcp add -s local ...

# 사용자 전역 설정
claude mcp add -s user ...

# 프로젝트 전체 설정
claude mcp add -s project ...
```

## 🚀 MCP 서버 활용 예시

### 1. 파일 작업
```
"filesystem MCP를 사용해서 /mnt/d/cursor 디렉토리의 파일을 검색해줘"
```

### 2. GitHub 작업
```
"github MCP로 현재 레포지토리의 이슈 목록을 가져와줘"
```

### 3. 웹 검색
```
"brave-search MCP로 최신 Next.js 15 문서를 검색해줘"
```

### 4. 데이터베이스 쿼리
```
"supabase MCP로 users 테이블의 데이터를 조회해줘"
```

### 5. 컨텍스트 관리
```
"memory MCP에 프로젝트 정보를 저장해줘: AI 기반 서버 모니터링 플랫폼"
```

### 6. 문서 검색
```
"context7 MCP로 Next.js Image 컴포넌트 사용법을 찾아주세요"
```

### 7. Gemini CLI 브릿지
```
"Gemini CLI로 코드 리뷰를 요청해주세요"
"현재 호출 컨텍스트 정보를 확인해주세요"
```

## 📍 설정 파일 위치

- **로컬 프로젝트**: `.claude/settings.local.json` (permissions)
- **MCP 설정**: Claude가 내부적으로 관리
- **홈 디렉토리**: `~/.claude/settings.json` (직접 수정 시)
- **프로젝트 MCP 예시**: `.claude/mcp.json` (참고용)

## ⚠️ 주의사항

1. **환경변수 보안**: API 키나 토큰은 환경변수로 관리하세요
2. **경로 확인**: 절대 경로를 사용하거나 상대 경로가 정확한지 확인
3. **의존성 설치**: MCP 서버 모듈이 설치되어 있어야 합니다
   ```bash
   npm install @modelcontextprotocol/server-filesystem
   npm install @modelcontextprotocol/server-github
   # ... 기타 필요한 MCP 서버 패키지
   ```

## 🆘 문제 해결

### MCP 서버가 작동하지 않을 때
1. 모듈이 설치되어 있는지 확인
2. 경로가 올바른지 확인
3. 환경변수가 제대로 설정되었는지 확인
4. `claude --debug` 모드로 실행하여 상세 로그 확인

### 권한 문제
- 파일시스템 MCP의 경우 `ALLOWED_DIRECTORIES` 확인
- GitHub MCP의 경우 토큰 권한 확인

## 📚 참고 자료

- [MCP 공식 문서](https://github.com/modelcontextprotocol)
- [Claude Code 문서](https://docs.anthropic.com/en/docs/claude-code)
- [MCP 완전 가이드](./mcp-complete-guide.md)
- [Gemini CLI 브릿지 v2.0 가이드](./gemini-cli-bridge-v2-guide.md)
- 프로젝트 MCP 설정 파일: `.claude/claude_workspace.json`

---

이 설정으로 Claude Code가 더 강력하고 효율적으로 작동합니다! 🚀