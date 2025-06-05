# 🔧 Cursor IDE - mcp.json 설정 가이드

## 📍 설정 파일 위치

Cursor IDE의 MCP 설정 파일은 다음 위치에 있습니다:
```
c:\Users\skyasu-pc\.cursor\mcp.json
```

## 🚀 권장 설정 (D 드라이브 최적화)

현재 프로젝트에 최적화된 `mcp.json` 설정입니다:

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
    "postgres": {
      "command": "npx",
      "args": ["@modelcontextprotocol/server-postgres"],
      "env": {
        "DATABASE_URL": "postgresql://localhost:5432/openmanager"
      }
    },
    "git": {
      "command": "npx",
      "args": ["@modelcontextprotocol/server-git", "--repository", "D:/cursor/openmanager-vibe-v5"]
    },
    "github": {
      "command": "npx", 
      "args": [
        "-y", 
        "@smithery/cli@latest", 
        "run", 
        "@smithery-ai/github",
        "--config", 
        "{\"githubPersonalAccessToken\":\"YOUR_GITHUB_TOKEN\"}"
      ]
    },
    "brave-search": {
      "command": "npx",
      "args": ["@modelcontextprotocol/server-brave-search"],
      "env": {
        "BRAVE_API_KEY": "YOUR_BRAVE_API_KEY_HERE"
      },
      "disabled": true
    }
  }
}
```

## 🔍 각 서버별 설명

### 1. **📁 Filesystem Server**
- **용도**: 프로젝트 문서 및 소스코드 검색
- **경로**: `docs/`, `src/` 폴더 접근
- **기능**: 파일 읽기, 검색, 구조 분석

### 2. **🧠 Memory Server**
- **용도**: 대화 세션 및 컨텍스트 저장
- **기능**: 이전 대화 기억, 컨텍스트 유지

### 3. **🗄️ PostgreSQL Server**
- **용도**: 데이터베이스 연동 및 쿼리
- **설정**: 로컬 PostgreSQL 연결
- **기능**: SQL 쿼리, 데이터 분석

### 4. **🔧 Git Server**
- **용도**: 버전 관리 및 코드 히스토리 분석
- **저장소**: D 드라이브 프로젝트
- **기능**: 커밋 히스토리, 브랜치 분석

### 5. **🐙 GitHub Server** (Smithery AI)
- **용도**: GitHub 저장소 및 이슈 관리
- **제공업체**: Smithery AI (@smithery-ai/github)
- **기능**: 저장소 정보, 이슈/PR 관리, 브랜치 작업
- **설정**: GitHub Personal Access Token 필요

### 6. **🌐 Brave Search Server** (선택사항)
- **용도**: 웹 검색 및 최신 정보 조회
- **상태**: 기본적으로 비활성화 (`disabled: true`)
- **설정**: Brave API 키 필요

## 🔑 GitHub 토큰 설정

### GitHub Personal Access Token 생성
1. **GitHub 접속**: https://github.com/settings/tokens
2. **새 토큰 생성**: "Generate new token (classic)" 클릭
3. **권한 설정**:
   - `repo`: 저장소 전체 접근
   - `read:user`: 사용자 정보 읽기
   - `read:org`: 조직 정보 읽기 (필요시)
4. **토큰 복사**: 생성된 토큰을 안전한 곳에 저장

### 설정 파일에 토큰 적용
```json
{
  "github": {
    "command": "npx", 
    "args": [
      "-y", 
      "@smithery/cli@latest", 
      "run", 
      "@smithery-ai/github",
      "--config", 
      "{\"githubPersonalAccessToken\":\"ghp_여기에실제토큰입력\"}"
    ]
  }
}
```

⚠️ **보안 주의사항**:
- 토큰을 Git 저장소에 커밋하지 마세요
- `.gitignore`에 설정 파일 추가 고려
- 주기적으로 토큰 갱신

## 🛠️ 설정 적용 방법

### 방법 1: 수동 편집
1. 파일 탐색기에서 `c:\Users\{사용자명}\.cursor\mcp.json` 열기
2. 위의 JSON 내용으로 전체 교체
3. Cursor IDE 재시작

### 방법 2: 명령줄 사용
```bash
# 프로젝트 루트에서 실행
notepad "c:\Users\skyasu-pc\.cursor\mcp.json"
```

### 방법 3: PowerShell 사용
```powershell
# 설정 파일 편집
notepad "c:\Users\skyasu-pc\.cursor\mcp.json"

# 또는 VSCode로 편집
code "c:\Users\skyasu-pc\.cursor\mcp.json"
```

## 🔧 설정 검증

### 1. Cursor 재시작 후 확인
- Cursor IDE 완전 종료 후 재시작
- MCP 서버 연결 상태 확인

### 2. 터미널에서 개별 서버 테스트
```bash
# 파일시스템 서버 테스트
npx @modelcontextprotocol/server-filesystem D:/cursor/openmanager-vibe-v5/docs D:/cursor/openmanager-vibe-v5/src

# 메모리 서버 테스트
npx @modelcontextprotocol/server-memory

# Git 서버 테스트
npx @modelcontextprotocol/server-git --repository D:/cursor/openmanager-vibe-v5

# GitHub 서버 테스트 (토큰 필요)
npx -y @smithery/cli@latest run @smithery-ai/github --config '{"githubPersonalAccessToken":"YOUR_TOKEN"}'
```

### 3. 프로젝트 내 MCP API 테스트
```bash
# 개발 서버 실행
npm run dev

# MCP 테스트 API 호출
curl -X POST http://localhost:3000/api/mcp/test -H "Content-Type: application/json" -d "{\"query\":\"테스트\"}"
```

## ⚡ 성능 최적화 팁

### 1. 경로 설정
- **절대 경로 사용**: `D:/cursor/openmanager-vibe-v5/...`
- **슬래시 사용**: Windows에서도 `/` 사용 권장
- **공백 없는 경로**: 가능하면 공백이 없는 경로 사용

### 2. 환경 변수
```json
{
  "env": {
    "NODE_ENV": "development",
    "DEBUG": "mcp:*",
    "MCP_LOG_LEVEL": "info"
  }
}
```

### 3. 타임아웃 설정
```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["@modelcontextprotocol/server-filesystem", "..."],
      "timeout": 30000
    }
  }
}
```

## 🚨 문제 해결

### 연결 실패 시
1. **패키지 설치 확인**
   ```bash
   npm list @modelcontextprotocol/sdk
   npm list @modelcontextprotocol/server-filesystem
   ```

2. **경로 확인**
   - D 드라이브 경로가 정확한지 확인
   - 폴더 존재 여부 확인

3. **권한 확인**
   - 폴더 읽기 권한 확인
   - Cursor 관리자 권한으로 실행

### 서버 시작 실패 시
```bash
# 수동으로 서버 테스트
npx @modelcontextprotocol/server-filesystem --help

# 로그 확인
DEBUG=mcp:* npx @modelcontextprotocol/server-filesystem D:/cursor/openmanager-vibe-v5/docs
```

## 📊 모니터링

### 실시간 연결 상태 확인
```bash
# MCP 모니터링 API
curl http://localhost:3000/api/mcp/monitoring

# 상세 서버 상태
curl -X POST http://localhost:3000/api/mcp/test -d '{"query":"상태 확인"}'
```

---

## 🎯 다음 단계

1. **설정 적용**: 위의 JSON을 `mcp.json`에 복사
2. **Cursor 재시작**: 설정 적용을 위해 재시작
3. **기능 테스트**: 프로젝트에서 MCP 기능 사용
4. **성능 모니터링**: 연결 상태 및 응답 시간 확인

이제 Cursor IDE에서 D 드라이브 프로젝트와 완전 통합된 MCP 기능을 사용할 수 있습니다! 🚀 