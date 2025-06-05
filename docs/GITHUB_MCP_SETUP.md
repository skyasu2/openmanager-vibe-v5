# GitHub MCP 서버 설정 가이드

## 개요
GitHub MCP 서버를 통해 Cursor AI가 GitHub 리포지토리에 직접 접근하여 이슈, PR, 파일 등을 관리할 수 있습니다.

## 1. GitHub Personal Access Token 생성

### 단계별 가이드:
1. GitHub에 로그인 후 Settings → Developer settings → Personal access tokens → Tokens (classic) 이동
2. "Generate new token (classic)" 클릭
3. 토큰 이름 입력 (예: "Cursor AI MCP")
4. 만료 기간 설정 (권장: 90일)
5. 다음 권한 선택:
   - `repo` (전체 리포지토리 접근)
   - `read:user` (사용자 정보 읽기)
   - `read:org` (조직 정보 읽기)
   - `workflow` (GitHub Actions 접근)

### 보안 주의사항:
- 토큰을 안전한 곳에 저장하세요
- 토큰이 노출되면 즉시 재생성하세요
- 필요한 최소 권한만 부여하세요

## 2. MCP 설정 파일 업데이트

### Cursor AI 설정 위치:
- Windows: `%APPDATA%\Cursor\User\globalStorage\cursor.mcp\mcp.json`
- 또는 프로젝트 루트의 `mcp.json` 파일

### 설정 내용:
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
    },
    "github": {
      "command": "npx",
      "args": ["@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
      }
    }
  }
}
```

## 3. 토큰 설정 방법

### 방법 1: 직접 설정
1. 생성한 GitHub 토큰을 복사
2. `mcp.json` 파일에서 `YOUR_GITHUB_TOKEN_HERE`를 실제 토큰으로 교체

### 방법 2: 환경 변수 사용 (권장)
```json
"github": {
  "command": "npx",
  "args": ["@modelcontextprotocol/server-github"],
  "env": {
    "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_TOKEN}"
  }
}
```

시스템 환경 변수에 `GITHUB_TOKEN` 설정

## 4. 설정 확인

### Cursor AI 재시작:
1. Cursor AI 완전 종료
2. 다시 시작
3. MCP 서버 연결 상태 확인

### 테스트 명령어:
- "GitHub에서 최근 이슈 목록 보여줘"
- "이 리포지토리의 PR 상태 확인해줘"
- "README 파일 업데이트해줘"

## 5. 사용 가능한 GitHub MCP 기능

### 리포지토리 관리:
- 파일 읽기/쓰기
- 브랜치 관리
- 커밋 히스토리 조회

### 이슈 관리:
- 이슈 생성/수정/닫기
- 라벨 관리
- 코멘트 추가

### Pull Request:
- PR 생성/수정
- 리뷰 요청
- 머지 관리

### 검색 기능:
- 코드 검색
- 이슈/PR 검색
- 사용자/조직 검색

## 6. 문제 해결

### 일반적인 오류:
1. **토큰 인증 실패**: 토큰 권한 확인
2. **서버 연결 실패**: 네트워크 및 방화벽 확인
3. **권한 부족**: 토큰 스코프 재확인

### 로그 확인:
- Cursor AI 개발자 도구에서 MCP 서버 로그 확인
- GitHub API 응답 상태 코드 확인

## 7. 보안 모범 사례

### 토큰 관리:
- 정기적인 토큰 갱신
- 사용하지 않는 토큰 삭제
- 토큰 활동 모니터링

### 접근 제한:
- 필요한 리포지토리만 접근 허용
- 조직 설정에서 토큰 정책 확인
- 2FA 활성화 권장

---

**참고**: 이 설정은 OpenManager V5 프로젝트에 최적화되어 있습니다. 다른 프로젝트에서 사용할 때는 경로를 적절히 수정하세요. 