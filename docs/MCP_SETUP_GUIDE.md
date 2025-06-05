# 🔧 MCP (Model Context Protocol) 설정 가이드

## 📋 개요
이 가이드는 OpenManager Vibe v5 프로젝트에서 MCP를 안전하게 설정하는 방법을 설명합니다.

## 🚀 빠른 설정

### 1. MCP 의존성 설치
```bash
npm install @modelcontextprotocol/sdk @modelcontextprotocol/server-filesystem @modelcontextprotocol/server-memory git-mob-mcp-server @modelcontextprotocol/server-github
```

### 2. 환경변수 설정
`.env.local` 파일을 생성하고 다음 내용을 추가하세요:
```env
GITHUB_TOKEN=your_github_personal_access_token_here
```

### 3. MCP 설정 파일 생성
`mcp.json.template`을 복사하여 `mcp.json` 파일을 생성하세요:
```bash
cp mcp.json.template mcp.json
```

### 4. Cursor IDE MCP 설정
`c:\Users\[사용자명]\.cursor\mcp.json` 파일에 다음 내용을 추가하세요:
```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["@modelcontextprotocol/server-filesystem", "D:/cursor/openmanager-vibe-v5/docs", "D:/cursor/openmanager-vibe-v5/src"],
      "env": {
        "NODE_ENV": "development"
      }
    },
    "memory": {
      "command": "npx", 
      "args": ["@modelcontextprotocol/server-memory"]
    },
    "git": {
      "command": "npx",
      "args": ["git-mob-mcp-server"]
    }
  }
}
```

## 🔒 보안 주의사항

### ⚠️ 중요: 민감한 정보 보호
- **절대로** GitHub Personal Access Token을 코드에 직접 포함하지 마세요
- 모든 토큰은 환경변수로 관리하세요
- `mcp.json` 파일은 `.gitignore`에 포함되어 있습니다

### 🛡️ GitHub Token 생성 방법
1. GitHub → Settings → Developer settings → Personal access tokens
2. "Generate new token (classic)" 클릭
3. 필요한 권한 선택:
   - `repo` (전체 리포지토리 접근)
   - `read:user` (사용자 정보 읽기)
   - `read:org` (조직 정보 읽기)
4. 생성된 토큰을 안전한 곳에 저장

## 🧪 테스트 방법

### Cursor AI에서 테스트:
```
1. "프로젝트 파일 구조 보여줘"
2. "최근 Git 커밋 히스토리 확인해줘"
3. "AI 관련 코드 파일들 찾아줘"
```

### API 테스트:
```bash
curl -X POST http://localhost:3001/api/mcp/test \
     -H "Content-Type: application/json" \
     -d '{"query":"MCP 연동 테스트"}'
```

## 🔧 문제 해결

### 일반적인 문제들:
1. **MCP 서버 연결 실패**: Node.js 버전 확인 (v18+ 권장)
2. **GitHub 인증 실패**: 토큰 권한 및 유효성 확인
3. **파일 접근 권한 오류**: 경로 설정 확인

### 로그 확인:
```bash
# MCP 서버 로그 확인
npx @modelcontextprotocol/server-filesystem --help

# Git Mob 서버 상태 확인
npx git-mob-mcp-server --version
```

## 📈 성능 최적화

### 권장 설정:
- **캐싱 활성화**: 메모리 서버 사용
- **파일 필터링**: 필요한 디렉토리만 포함
- **토큰 재사용**: 환경변수로 중앙 관리

### 모니터링:
- MCP 응답 시간 추적
- 메모리 사용량 모니터링
- API 호출 빈도 최적화

---

**🎯 다음 단계**: [AI 엔진 설정 가이드](./AI_ENGINE_SETUP.md)를 참조하여 AI 기능을 활성화하세요. 