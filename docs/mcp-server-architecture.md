# MCP 서버 아키텍처

## 🏗️ 통합 구조 (v5.46.24)

### 이전 구조 (분산형)
```
프로젝트 루트/
├── mcp-server/           # 단일 파일시스템 서버
│   └── server.js
└── mcp-servers/          # Gemini CLI 브릿지만
    └── gemini-cli-bridge/
```

### 현재 구조 (통합형)
```
프로젝트 루트/
└── mcp-servers/          # 모든 MCP 서버 통합
    ├── README.md         # 통합 가이드
    ├── filesystem/       # 파일시스템 서버
    │   ├── README.md
    │   ├── server.js     # HTTP 헬스체크 포함
    │   ├── health-check.js
    │   └── package.json
    └── gemini-cli-bridge/  # Gemini CLI 브릿지 v3.0
        ├── README.md
        ├── src/
        │   ├── index.js
        │   ├── adaptive-gemini-bridge-v3.js
        │   └── tools-v3.js
        └── package.json
```

## 🎯 각 서버의 역할

### 1. filesystem 서버
- **목적**: 파일시스템 작업 + HTTP 헬스체크
- **사용처**: 
  - Render 배포 시 (HTTP 헬스체크 필요)
  - 커스텀 파일시스템 작업이 필요한 경우
- **특징**:
  - 보안 경로 검증
  - 캐싱 시스템
  - HTTP /health 엔드포인트

### 2. gemini-cli-bridge 서버
- **목적**: Claude ↔ Gemini CLI 통합
- **사용처**: Claude Code MCP 통합
- **특징**:
  - v3.0: --prompt 최적화
  - 자동 모델 선택
  - 작업별 최적화 도구

## 📝 사용 가이드

### Claude Code 설정 (.claude/mcp.json)

#### 공식 패키지 사용 (권장)
```json
{
  "mcpServers": {
    "filesystem": {
      "command": "node",
      "args": ["node_modules/@modelcontextprotocol/server-filesystem/dist/index.js"]
    }
  }
}
```

#### 커스텀 서버 사용 (HTTP 헬스체크 필요시)
```json
{
  "mcpServers": {
    "filesystem-custom": {
      "command": "node",
      "args": ["mcp-servers/filesystem/server.js"],
      "env": {
        "ENABLE_HTTP": "true",
        "PORT": "10000"
      }
    }
  }
}
```

### Render 배포
```yaml
# render.yaml
services:
  - type: web
    name: mcp-filesystem-server
    env: node
    buildCommand: cd mcp-servers/filesystem && npm install
    startCommand: cd mcp-servers/filesystem && npm start
    envVars:
      - key: NODE_ENV
        value: production
```

## 🚀 새 서버 추가하기

1. **폴더 생성**
   ```bash
   mkdir -p mcp-servers/my-new-server
   cd mcp-servers/my-new-server
   ```

2. **package.json 작성**
   ```json
   {
     "name": "mcp-my-new-server",
     "version": "1.0.0",
     "type": "module",
     "dependencies": {
       "@modelcontextprotocol/sdk": "^1.12.1"
     }
   }
   ```

3. **서버 구현**
   ```javascript
   // index.js
   import { Server } from '@modelcontextprotocol/sdk/server/index.js';
   import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
   
   const server = new Server({
     name: 'my-new-server',
     version: '1.0.0'
   });
   
   // 도구 및 리소스 구현...
   ```

4. **Claude Code 등록**
   ```json
   // .claude/mcp.json에 추가
   "my-new-server": {
     "command": "node",
     "args": ["mcp-servers/my-new-server/index.js"]
   }
   ```

## 📚 참고 문서

- [MCP SDK 문서](https://github.com/modelcontextprotocol/sdk)
- [MCP 완전 가이드](./mcp-complete-guide.md)
- [Gemini CLI 브릿지 v3.0](./gemini-cli-bridge-v3-improvements.md)