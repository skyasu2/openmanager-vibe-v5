# 🚀 MCP 빠른 설정 가이드

> **목적**: 프로젝트 클론 후 3분 안에 Cursor MCP 완벽 구성  
> **갱신일**: 2025년 6월 2일  
> **대상**: 모든 개발자 (Windows/Mac/Linux)

---

## ⚡ 원클릭 자동 설정

### 🔧 **방법 1: 자동 스크립트 (권장)**

프로젝트를 클론한 후 단 한 번의 명령어로 MCP 설정 완료:

```bash
# 프로젝트 클론
git clone [레포지토리-URL]
cd openmanager-vibe-v5

# 자동 MCP 설정 (패키지 설치 + 설정 적용)
npm run mcp:full-setup
```

### 📋 **방법 2: 단계별 설정**

```bash
# 1. 필수 MCP 패키지 설치
npm run mcp:install

# 2. MCP 설정 적용
npm run mcp:setup

# 3. Cursor 재시작
```

---

## 🎯 적용되는 MCP 설정

### **활성화되는 서버**
```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["@modelcontextprotocol/server-filesystem", "{프로젝트경로}/docs", "{프로젝트경로}/src"]
    },
    "github": {
      "command": "npx", 
      "args": ["@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_TOKEN}"
      }
    }
  }
}
```

### **제공되는 기능**
- 📁 **Filesystem**: 프로젝트 파일 분석 및 관리 (11개 도구)
- 🐙 **GitHub**: 저장소 연동 및 협업 (~10개 도구)

---

## 🔑 GitHub Token 설정 (선택사항)

GitHub MCP 서버 완전 활용을 위해 Personal Access Token 설정:

### **토큰 생성**
1. https://github.com/settings/tokens 접속
2. "Generate new token (classic)" 클릭
3. 다음 권한 선택:
   - ✅ `repo` (전체 저장소 접근)
   - ✅ `workflow` (GitHub Actions)
   - ✅ `read:org` (조직 정보)
   - ✅ `user:email` (이메일 정보)

### **환경변수 설정**

#### **Windows**
```powershell
setx GITHUB_TOKEN "ghp_your_token_here"
```

#### **Mac/Linux**
```bash
export GITHUB_TOKEN="ghp_your_token_here"
echo 'export GITHUB_TOKEN="ghp_your_token_here"' >> ~/.bashrc
```

---

## 🧪 설정 검증

### **자동 검증 스크립트**
```bash
npm run mcp:setup
```

실행 결과에서 다음을 확인:
```
✅ MCP 설정 적용 완료
📋 적용된 MCP 서버:
  - filesystem: npx @modelcontextprotocol/server-filesystem [경로]
  - github: npx @modelcontextprotocol/server-github
```

### **Cursor에서 수동 확인**
1. **Cursor 재시작**
2. **새 대화 시작**
3. **우측 상단 MCP 아이콘에서 2개 서버 로딩 확인**
4. **테스트 명령**: "현재 프로젝트의 docs 폴더 구조를 보여줘"

---

## 🔧 문제 해결

### **패키지 설치 실패**
```bash
# 관리자 권한으로 실행 (Windows)
npm install -g @modelcontextprotocol/server-filesystem @modelcontextprotocol/server-github

# Mac에서 권한 문제
sudo npm install -g @modelcontextprotocol/server-filesystem @modelcontextprotocol/server-github
```

### **설정 파일 경로 확인**
```bash
node -e "console.log(require('./scripts/setup-mcp.js').getCursorConfigPath())"
```

### **수동 설정 복사**
자동 스크립트가 실패하면 수동으로 설정:

1. 프로젝트 루트의 `mcp.json.template` 파일 열기
2. `{{PROJECT_PATH}}`를 실제 프로젝트 경로로 변경
3. 결과를 `~/.cursor/mcp.json`에 저장

---

## 🎉 완료!

이제 **어떤 환경에서 프로젝트를 클론하더라도** 3분 안에 완벽한 MCP 환경이 구성됩니다!

### **다음 단계**
1. ✅ MCP 설정 완료
2. 🔄 Cursor 재시작  
3. 🚀 **개발 효율성 3-5배 향상** 체험

---

**🔗 관련 문서**
- [MCP 상세 설정 가이드](./MCP_설정_적용_가이드.md)
- [GitHub MCP 고급 활용](./GITHUB_MCP_SETUP.md)
- [MCP 시스템 아키텍처](./WHY_MCP_AI_ENGINE.md) 