# 🐙 GitHub MCP 서버 설정 가이드

> **작성일**: 2025년 6월 2일  
> **개발자**: jhhong (개인 프로젝트)  
> **목적**: Smithery AI GitHub MCP 서버 설정 및 사용법

---

## 📋 개요

GitHub MCP 서버는 Smithery AI에서 제공하는 MCP 서버로, GitHub 저장소와의 통합을 제공합니다. 이를 통해 Cursor IDE에서 직접 GitHub 저장소를 관리하고 이슈를 추적할 수 있습니다.

### **주요 기능**
- 📁 저장소 정보 조회 및 관리
- 🐛 이슈 및 Pull Request 분석
- 🌿 브랜치 관리 및 작업
- 📊 커밋 히스토리 분석
- ⚡ GitHub Actions 통합

---

## 🔑 GitHub Personal Access Token 생성

### **Step 1: GitHub 설정 페이지 접속**
1. GitHub에 로그인
2. https://github.com/settings/tokens 접속
3. "Generate new token (classic)" 클릭

### **Step 2: 토큰 설정**
```
Token name: Cursor MCP GitHub Integration
Expiration: 90 days (권장)
```

### **Step 3: 권한 설정**
다음 권한들을 체크하세요:

#### **필수 권한**
- ✅ `repo` - 저장소 전체 접근
- ✅ `read:user` - 사용자 정보 읽기

#### **선택적 권한** (조직 사용 시)
- ✅ `read:org` - 조직 정보 읽기
- ✅ `read:project` - 프로젝트 보드 읽기

### **Step 4: 토큰 생성 및 저장**
1. "Generate token" 클릭
2. 생성된 토큰을 안전한 곳에 복사 저장
3. ⚠️ **주의**: 페이지를 벗어나면 토큰을 다시 볼 수 없습니다

---

## 🛠️ MCP 설정 파일 구성

### **설정 파일 위치**
```
Windows: c:\Users\{사용자명}\.cursor\mcp.json
macOS: ~/.cursor/mcp.json
Linux: ~/.cursor/mcp.json
```

### **GitHub MCP 서버 추가**
기존 MCP 설정에 다음을 추가하세요:

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
      "args": ["git-mob-mcp-server", "--repository", "D:/cursor/openmanager-vibe-v5"]
    },
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
}
```

### **토큰 교체**
`"ghp_여기에실제토큰입력"` 부분을 실제 생성한 토큰으로 교체하세요.

---

## 📦 필요한 패키지 설치

### **Smithery CLI 설치**
```bash
# 전역 설치 (권장)
npm install -g @smithery/cli

# 또는 프로젝트별 설치
npm install @smithery/cli
```

### **설치 확인**
```bash
# Smithery CLI 버전 확인
npx @smithery/cli --version

# GitHub MCP 서버 테스트
npx -y @smithery/cli@latest run @smithery-ai/github --help
```

---

## 🔧 설정 적용 및 테스트

### **Step 1: 설정 파일 저장**
1. `mcp.json` 파일에 GitHub 서버 설정 추가
2. 실제 GitHub 토큰으로 교체
3. 파일 저장

### **Step 2: Cursor IDE 재시작**
1. Cursor IDE 완전 종료
2. 다시 시작
3. MCP 서버 연결 상태 확인

### **Step 3: 연결 테스트**
```bash
# 터미널에서 직접 테스트
npx -y @smithery/cli@latest run @smithery-ai/github \
  --config '{"githubPersonalAccessToken":"YOUR_ACTUAL_TOKEN"}'
```

### **Step 4: Cursor에서 확인**
1. Cursor IDE에서 `Settings > MCP Tools` 접속
2. GitHub 서버가 활성화되어 있는지 확인
3. 연결 상태가 "Connected"인지 확인

---

## 🎯 사용 예시

### **저장소 정보 조회**
```
"현재 저장소의 기본 정보를 알려주세요"
"이 저장소의 최근 커밋 10개를 분석해주세요"
```

### **이슈 관리**
```
"현재 열린 이슈 목록을 보여주세요"
"우선순위가 높은 이슈들을 분석해주세요"
"새로운 버그 이슈를 생성해주세요"
```

### **Pull Request 분석**
```
"현재 열린 PR들의 상태를 확인해주세요"
"코드 리뷰가 필요한 PR을 찾아주세요"
```

### **브랜치 관리**
```
"현재 브랜치 목록을 보여주세요"
"feature 브랜치들의 상태를 분석해주세요"
```

---

## 🚨 문제 해결

### **토큰 인증 실패**
```bash
# 토큰 권한 확인
curl -H "Authorization: token YOUR_TOKEN" https://api.github.com/user

# 응답 예시 (성공)
{
  "login": "your-username",
  "id": 12345,
  ...
}
```

### **MCP 서버 연결 실패**
1. **Smithery CLI 설치 확인**
   ```bash
   npm list -g @smithery/cli
   ```

2. **토큰 형식 확인**
   - GitHub Classic Token: `ghp_...`
   - Fine-grained Token: `github_pat_...`

3. **JSON 형식 확인**
   - 이중 따옴표 사용
   - 이스케이프 문자 확인

### **권한 부족 오류**
토큰 권한을 다시 확인하고 필요한 권한을 추가하세요:
- `repo`: 저장소 접근
- `read:user`: 사용자 정보
- `read:org`: 조직 정보 (필요시)

---

## 🔒 보안 고려사항

### **토큰 보안**
- ✅ 토큰을 Git 저장소에 커밋하지 마세요
- ✅ 정기적으로 토큰을 갱신하세요
- ✅ 불필요한 권한은 부여하지 마세요
- ✅ 토큰 사용 로그를 모니터링하세요

### **설정 파일 보안**
```bash
# .gitignore에 추가
echo ".cursor/mcp.json" >> .gitignore

# 또는 환경변수 사용 고려
export GITHUB_TOKEN="your_token_here"
```

---

## 📊 모니터링 및 로그

### **GitHub API 사용량 확인**
```bash
# API 사용량 확인
curl -H "Authorization: token YOUR_TOKEN" \
  https://api.github.com/rate_limit
```

### **MCP 서버 로그**
```bash
# 디버그 모드로 실행
DEBUG=mcp:* npx -y @smithery/cli@latest run @smithery-ai/github \
  --config '{"githubPersonalAccessToken":"YOUR_TOKEN"}'
```

---

## 🎉 완료 확인

설정이 완료되면 다음을 확인하세요:

- [ ] GitHub Personal Access Token 생성 완료
- [ ] MCP 설정 파일에 GitHub 서버 추가
- [ ] Smithery CLI 설치 완료
- [ ] Cursor IDE에서 GitHub MCP 서버 연결 확인
- [ ] 기본 GitHub 명령어 테스트 성공

이제 Cursor IDE에서 GitHub 저장소를 직접 관리할 수 있습니다! 🚀

---

## 📚 추가 자료

- [Smithery AI GitHub MCP 문서](https://smithery.ai/protocols/github)
- [GitHub Personal Access Token 가이드](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token)
- [MCP 프로토콜 공식 문서](https://modelcontextprotocol.io/) 