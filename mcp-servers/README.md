# MCP Servers

이 디렉터리는 프로젝트에서 사용하는 모든 MCP (Model Context Protocol) 서버들을 포함합니다.

## 📁 서버 목록

### 1. **filesystem** 
- **목적**: 파일시스템 작업을 위한 MCP 서버
- **특징**: 
  - HTTP 헬스체크 지원 (Render 배포용)
  - 보안 경로 검증
  - 캐싱 시스템
- **사용처**: Render 배포 시 파일시스템 접근이 필요한 경우
- **참고**: Claude Code는 공식 `@modelcontextprotocol/server-filesystem` 패키지 사용

### 2. **gemini-cli-bridge** (v3.0)
- **목적**: Claude ↔ Gemini CLI 양방향 통합
- **특징**:
  - PowerShell 최적화
  - 자동 모델 선택 (Pro/Flash)
  - 작업별 최적화 도구
  - 사용량 추적
- **사용처**: Claude Code에서 Gemini CLI 기능 활용

## 🔧 구조

```
mcp-servers/
├── filesystem/          # 파일시스템 MCP 서버
│   ├── server.js       # 메인 서버 (HTTP 헬스체크 포함)
│   ├── health-check.js # 헬스체크 스크립트
│   └── package.json    # 의존성
│
└── gemini-cli-bridge/   # Gemini CLI 브릿지
    ├── src/            # 소스 코드
    │   ├── index.js    # 진입점
    │   ├── adaptive-gemini-bridge-v3.js
    │   └── tools-v3.js
    └── package.json    # 의존성
```

## 📝 사용법

### 로컬 개발 (Claude Code)
`.claude/mcp.json`에서 각 서버 설정:
```json
{
  "mcpServers": {
    "filesystem": {
      "command": "node",
      "args": ["node_modules/@modelcontextprotocol/server-filesystem/dist/index.js"]
    },
    "gemini-cli": {
      "command": "node",
      "args": ["mcp-servers/gemini-cli-bridge/src/index.js"]
    }
  }
}
```

### Render 배포 (filesystem 서버)
```bash
cd mcp-servers/filesystem
npm install
npm start
```

## 🚀 새 MCP 서버 추가하기

1. `mcp-servers/` 아래에 새 폴더 생성
2. 표준 MCP SDK 사용하여 구현
3. package.json과 README 작성
4. `.claude/mcp.json`에 서버 등록

## 📚 참고 문서

- [MCP 완전 가이드](../docs/mcp-complete-guide.md)
- [Gemini CLI 브릿지 v3.0](../docs/gemini-cli-bridge-v3-improvements.md)
- [Claude Code MCP 설정](../docs/claude-code-mcp-setup.md)