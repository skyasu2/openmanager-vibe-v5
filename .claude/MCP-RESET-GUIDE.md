# MCP 서버 재설정 가이드

## 🚨 발견된 문제점

1. **중복된 설정 파일**:
   - `.mcp.json` (프로젝트 루트 - 구버전 방식, 백업 폴더로 이동됨)
   - `~/.claude.json` (CLI 설정 - 실제 사용됨)

2. **하드코딩된 API 키**:
   - GitHub 토큰
   - Tavily API 키
   - Upstash Redis 자격증명
   - Supabase 액세스 토큰

## 📝 올바른 MCP 설정 방법

### 1. 환경변수 설정 (필수)

```bash
# .bashrc 또는 .zshrc에 추가
export GITHUB_TOKEN="ghp_your_actual_github_personal_access_token"
export TAVILY_API_KEY="tvly_your_tavily_api_key"

# 프로젝트 .env.local에서 자동 로드
source scripts/mcp/setup-env.sh
```

### 2. MCP 서버 재설정 (CLI 명령어)

```bash
# 기존 서버 제거 (하드코딩된 값 정리)
claude mcp remove github
claude mcp remove tavily-mcp
claude mcp remove supabase
claude mcp remove context7

# 환경변수를 사용하여 재설정
# GitHub (환경변수 참조)
claude mcp add github npx -e GITHUB_PERSONAL_ACCESS_TOKEN=$GITHUB_TOKEN -- -y @modelcontextprotocol/server-github@latest

# Tavily (환경변수 참조)
claude mcp add tavily-mcp npx -e TAVILY_API_KEY=$TAVILY_API_KEY -- -y tavily-mcp@0.2.9

# Supabase (환경변수 참조)
claude mcp add supabase npx -e SUPABASE_URL=$SUPABASE_URL -e SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY -- -y @supabase/mcp-server-supabase@latest --project-ref=vnswjnltnhpsueosfhmw

# Context7 (환경변수 참조)
claude mcp add context7 npx -e UPSTASH_REDIS_REST_URL=$UPSTASH_REDIS_REST_URL -e UPSTASH_REDIS_REST_TOKEN=$UPSTASH_REDIS_REST_TOKEN -- -y @upstash/context7-mcp@latest

# Claude API 재시작
claude api restart
```

### 3. 설정 확인

```bash
# MCP 서버 상태 확인
claude mcp list

# 진단 실행
claude /doctor
```

## 🔐 보안 권장사항

1. **절대 하드코딩 금지**:
   - API 키나 토큰을 직접 설정 파일에 입력하지 마세요
   - 항상 환경변수 참조 사용

2. **환경변수 관리**:
   - `.env.local`은 `.gitignore`에 포함되어야 함
   - 민감한 정보는 환경변수로만 관리

3. **정기적인 토큰 갱신**:
   - GitHub Personal Access Token 주기적 갱신
   - API 키 노출 시 즉시 재발급

## 📚 참고 문서

- [Claude Code MCP 설정 가이드](https://docs.anthropic.com/en/docs/claude-code/mcp)
- [프로젝트 MCP 가이드](/docs/mcp-servers-complete-guide.md)

---

⚠️ **중요**: 이미 노출된 API 키들은 보안을 위해 재발급이 필요합니다.
