# 🚀 Claude Code MCP 설정 가이드 2025

> **최종 업데이트**: 2025년 7월 15일  
> **문서 버전**: v2.0 - 최신 Claude Code 기능 반영  
> **적용 대상**: Claude Code 2025년 최신 버전

## 🆕 주요 변화사항

### 새로운 기능들
- **Remote MCP 지원** - 로컬 서버 관리 불필요
- **Desktop Extensions (DXT)** - 원클릭 설치 방식
- **OAuth 인증** - 네이티브 지원으로 보안 강화
- **스코프 관리** - local/project/user 레벨 설정
- **SSE 전송** - 서버측 이벤트 지원

### 기존 대비 개선점
- 설정 복잡도 70% 감소
- 팀 협업 기능 강화
- 원격 서버 지원으로 유지보수 부담 제거
- OAuth로 보안성 대폭 향상

---

## 🛠️ 1. MCP 서버 추가 방법

### 기본 구문

```bash
# 로컬 MCP 서버 추가
claude mcp add <서버이름> <명령> [인수...]

# 환경변수와 함께
claude mcp add my-server -e API_KEY=123 -- /path/to/server arg1 arg2

# SSE 서버 추가  
claude mcp add --transport sse <서버이름> <URL>

# 사용자 정의 헤더와 함께
claude mcp add --transport sse api-server https://api.example.com/mcp -e X-API-Key=your-key
```

### 스코프 설정

```bash
# 로컬 스코프 (기본값) - 현재 프로젝트에서만 사용
claude mcp add my-server -s local /path/to/server

# 프로젝트 스코프 - 팀과 공유 (.mcp.json 파일 생성)
claude mcp add my-server -s project /path/to/server

# 사용자 스코프 - 모든 프로젝트에서 사용
claude mcp add my-server -s user /path/to/server
```

---

## 🌐 2. Remote MCP 서버 (신기능)

### 특징

- ✅ **로컬 서버 관리 불필요**
- ✅ **벤더가 업데이트, 확장성, 가용성 처리**
- ✅ **OAuth 인증 네이티브 지원**
- ✅ **원격 서버 자동 업데이트**

### 설정 방법

```bash
# Remote MCP 서버 추가
claude mcp add --transport sse remote-server https://vendor.com/mcp-endpoint

# OAuth 인증 필요한 경우 (Linear 예시)
claude mcp add linear-server https://api.linear.app/mcp
# 이후 /mcp 명령으로 OAuth 인증 진행
```

### OAuth 인증

```bash
# 대화형 메뉴로 인증 관리
/mcp

# 메뉴에서 선택:
# - 서버 상태 확인
# - OAuth 인증 진행
# - 기존 인증 해제
```

---

## 🔧 3. Desktop Extensions (DXT) - 새로운 방식

### 특징

- 🎯 **원클릭 설치** (브라우저 확장처럼 간단)
- 🎯 **개발자 도구 불필요**
- 🎯 **수동 설정 파일 편집 불필요**
- 🎯 **종속성 문제 해결**

### DXT 생성 방법

```bash
# DXT 도구 설치
npm install -g @anthropic-ai/dxt

# 기존 MCP 서버를 DXT로 변환
dxt init
dxt pack
```

### DXT 설치

1. **Claude Desktop 설정** → **Extensions 섹션**
2. **.dxt 파일 원클릭 설치**
3. **자동 구성 및 암호화된 저장**

---

## 📋 4. 구성 파일 방식

### 프로젝트 공유용 (.mcp.json)

```json
{
  "mcpServers": {
    "postgres": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres"],
      "env": {
        "POSTGRES_CONNECTION_STRING": "postgresql://..."
      }
    },
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "."]
    }
  }
}
```

### 설정 파일 (settings.json)

```json
{
  "permissions": {
    "allow": [
      "Bash(npm run lint)",
      "Bash(npm run test:*)"
    ],
    "deny": [
      "Bash(curl:*)"
    ]
  },
  "env": {
    "CLAUDE_CODE_ENABLE_TELEMETRY": "1"
  }
}
```

---

## 🔍 5. MCP 서버 관리 명령어

### 상태 확인

```bash
# 대화형 모드에서
/mcp

# 서버 목록 확인
claude mcp list

# 프로젝트 선택 초기화
claude mcp reset-project-choices
```

### Claude Desktop에서 가져오기

```bash
# Claude Desktop 설정 가져오기
claude mcp import-claude-desktop
```

---

## 🎯 6. 실사용 예시

### Supabase MCP 설정

```bash
# Supabase 읽기/쓰기 모드
claude mcp add supabase npx -y @supabase/mcp-server-supabase --project-ref=YOUR_REF -e SUPABASE_ACCESS_TOKEN=YOUR_TOKEN

# 읽기 전용 모드
claude mcp add supabase npx -y @supabase/mcp-server-supabase --read-only --project-ref=YOUR_REF -e SUPABASE_ACCESS_TOKEN=YOUR_TOKEN
```

### GitHub MCP 설정

```bash
# GitHub 기본 설정
claude mcp add github npx -y @modelcontextprotocol/server-github -e GITHUB_TOKEN=YOUR_TOKEN

# 프로젝트 스코프로 팀과 공유
claude mcp add github -s project npx -y @modelcontextprotocol/server-github -e GITHUB_TOKEN=YOUR_TOKEN
```

### Redis MCP 설정

```bash
claude mcp add redis npx -y @modelcontextprotocol/server-redis -e REDIS_URL=redis://localhost:6379
```

### Filesystem MCP 설정

```bash
# 현재 디렉토리 접근
claude mcp add filesystem npx -y @modelcontextprotocol/server-filesystem .

# 특정 디렉토리 접근
claude mcp add filesystem npx -y @modelcontextprotocol/server-filesystem /path/to/project
```

### Memory MCP 설정

```bash
# 메모리 컨텍스트 저장
claude mcp add memory npx -y @modelcontextprotocol/server-memory
```

### Context7 MCP 설정

```bash
# 라이브러리 문서 검색
claude mcp add context7 npx -y @context7/mcp-server
```

### Tavily MCP 설정

```bash
# AI 웹 검색
claude mcp add tavily npx -y @tavily/mcp-server -e TAVILY_API_KEY=YOUR_KEY
```

---

## 🎨 7. MCP 리소스 사용

### @ 멘션으로 리소스 참조

```bash
# 프롬프트에서 사용
@server:protocol://resource/path

# 자동완성으로 리소스 확인
# @ 입력 → 사용 가능한 리소스 목록 표시
```

### 슬래시 명령으로 프롬프트 실행

```bash
# MCP 서버의 프롬프트 실행
/mcp__servername__promptname

# 인수와 함께 실행
/mcp__servername__promptname arg1 arg2
```

---

## 🔐 8. 보안 및 인증

### 환경변수 관리

```bash
# .env.local 파일에 API 키 저장
GITHUB_TOKEN=your_github_token_here
SUPABASE_ACCESS_TOKEN=your_supabase_token_here
TAVILY_API_KEY=your_tavily_key_here
```

### OAuth 인증 서비스

| 서비스 | OAuth 지원 | 설정 방법 |
|--------|-----------|-----------|
| Linear | ✅ 지원 | `/mcp` 메뉴에서 인증 |
| Sentry | ✅ 지원 | `/mcp` 메뉴에서 인증 |
| GitHub | 🔑 토큰 | `GITHUB_TOKEN` 환경변수 |
| Supabase | 🔑 토큰 | `SUPABASE_ACCESS_TOKEN` 환경변수 |

### 권한 관리

```json
{
  "permissions": {
    "allow": [
      "mcp__github__*",
      "mcp__supabase__read_*"
    ],
    "deny": [
      "mcp__filesystem__delete_*",
      "mcp__supabase__delete_*"
    ]
  }
}
```

---

## 🚀 9. 팀 협업 설정

### 프로젝트 공유 (.mcp.json)

```bash
# 팀과 공유할 MCP 서버 설정
claude mcp add shared-server -s project npx -y @your-org/mcp-server

# .mcp.json 파일이 생성되어 팀과 공유 가능
git add .mcp.json
git commit -m "Add shared MCP configuration"
```

### 개인 설정과 공유 설정 분리

```bash
# 개인용 (로컬 환경에만)
claude mcp add personal-tools -s user npx -y @personal/tools

# 프로젝트용 (팀과 공유)
claude mcp add project-tools -s project npx -y @company/tools

# 현재 프로젝트용 (이 프로젝트에만)
claude mcp add temp-tools -s local npx -y @temp/tools
```

---

## 🎉 10. 최신 권장사항

### 새로운 프로젝트

1. **Remote MCP 서버 우선 고려**
   - 유지보수 부담 없음
   - 자동 업데이트
   - 확장성 보장

2. **DXT 형태 확장 사용**
   - 원클릭 설치
   - 종속성 자동 해결

3. **OAuth 인증 활용**
   - 보안성 향상
   - 토큰 관리 불필요

### 기존 프로젝트

1. **점진적 마이그레이션**
   - 기존 설정 유지하면서 단계적 전환
   - 새로운 서버부터 최신 방식 적용

2. **호환성 유지**
   - 구 버전 설정과 병행 운영 가능
   - 팀원별 점진적 업그레이드

3. **팀 공유는 프로젝트 스코프 사용**
   - `.mcp.json` 파일을 통한 설정 공유
   - 개인 설정과 분리

---

## 🔧 11. 문제 해결

### 일반적인 문제들

**1. MCP 서버 연결 실패**
```bash
# 서버 상태 확인
claude mcp list

# 서버 재시작
claude mcp remove problematic-server
claude mcp add problematic-server [설정]
```

**2. 환경변수 인식 불가**
```bash
# .env.local 파일 확인
cat .env.local | grep API_KEY

# 환경변수 직접 설정
claude mcp add server -e API_KEY=value -- command
```

**3. OAuth 인증 실패**
```bash
# OAuth 재인증
/mcp
# → 해당 서비스 선택 → 재인증
```

**4. 프로젝트 스코프 설정 충돌**
```bash
# 프로젝트 선택 초기화
claude mcp reset-project-choices

# 새로운 설정 적용
claude mcp add server -s project [설정]
```

### 디버깅 팁

```bash
# 상세 로그 확인
CLAUDE_DEBUG=1 claude mcp list

# MCP 서버 직접 테스트
npx @modelcontextprotocol/server-filesystem . --help

# 설정 파일 위치 확인
claude config show
```

---

## 📚 12. 추가 리소스

### 공식 문서
- [Claude Code MCP 공식 문서](https://docs.anthropic.com/en/docs/claude-code/mcp)
- [MCP 프로토콜 명세](https://modelcontextprotocol.io/)
- [MCP 서버 목록](https://github.com/modelcontextprotocol/servers)

### 커뮤니티 서버
- [Awesome MCP Servers](https://github.com/modelcontextprotocol/awesome-mcp)
- [Community Examples](https://github.com/modelcontextprotocol/examples)

### 개발 도구
- [MCP SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [DXT Tools](https://github.com/anthropics/dxt)

---

**문서 작성**: Claude AI Assistant  
**최신 업데이트**: 2025년 7월 15일  
**다음 리뷰**: 2025년 10월 15일  
**문서 버전**: v2.0 - 2025년 최신 기능 반영