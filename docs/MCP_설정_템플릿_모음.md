# 🎯 MCP 설정 템플릿 모음

## 성공한 MCP 설정을 빠르게 복사해서 사용할 수 있는 템플릿 모음

### 📌 검증된 성공 사례

- **프로젝트**: OpenManager Vibe v5
- **성공일**: 2025-06-09
- **상태**: ✅ 100% 작동 확인됨

---

## 📁 `.cursor/mcp.json` 템플릿

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "."],
      "env": {
        "NODE_OPTIONS": "--max-old-space-size=512"
      },
      "description": "프로젝트 파일 시스템 접근",
      "enabled": true
    },
    "memory": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"],
      "env": {
        "MEMORY_STORE_PATH": "./mcp-memory"
      },
      "description": "지식 그래프 기반 메모리 시스템",
      "enabled": true
    },
    "duckduckgo-search": {
      "command": "npx",
      "args": ["-y", "duckduckgo-mcp-server"],
      "env": {
        "NODE_OPTIONS": "--max-old-space-size=256"
      },
      "description": "DuckDuckGo 웹 검색 (프라이버시 중심)",
      "enabled": true
    },
    "sequential-thinking": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"],
      "env": {
        "THINKING_MODE": "development",
        "MAX_DEPTH": "10"
      },
      "description": "고급 순차적 사고 처리",
      "enabled": true
    }
  }
}
```

---

## 📁 `cursor.mcp.json` 템플릿 (프로젝트 루트)

**⚠️ 중요**: `.cursor/mcp.json`과 동일한 내용을 프로젝트 루트에도 복사하세요!

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "."],
      "env": {
        "NODE_OPTIONS": "--max-old-space-size=512"
      },
      "description": "프로젝트 파일 시스템 접근",
      "enabled": true
    },
    "memory": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"],
      "env": {
        "MEMORY_STORE_PATH": "./mcp-memory"
      },
      "description": "지식 그래프 기반 메모리 시스템",
      "enabled": true
    },
    "duckduckgo-search": {
      "command": "npx",
      "args": ["-y", "duckduckgo-mcp-server"],
      "env": {
        "NODE_OPTIONS": "--max-old-space-size=256"
      },
      "description": "DuckDuckGo 웹 검색 (프라이버시 중심)",
      "enabled": true
    },
    "sequential-thinking": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"],
      "env": {
        "THINKING_MODE": "development",
        "MAX_DEPTH": "10"
      },
      "description": "고급 순차적 사고 처리",
      "enabled": true
    }
  }
}
```

---

## 📁 `.cursor/settings.json` 템플릿

```json
{
  "mcp.enabled": true,
  "mcp.servers": {},
  "workbench.sideBar.location": "left",
  "editor.minimap.enabled": true,
  "editor.lineNumbers": "on",
  "files.autoSave": "afterDelay",
  "files.autoSaveDelay": 1000,
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll": "explicit"
  }
}
```

---

## 📁 `package.json` 스크립트 추가 템플릿

기존 `package.json`에 추가할 스크립트들:

```json
{
  "scripts": {
    "mcp:setup": "node scripts/quick-mcp-setup.js",
    "mcp:setup:win": "powershell -ExecutionPolicy Bypass -File scripts/setup-mcp.ps1",
    "mcp:setup:unix": "bash scripts/setup-mcp.sh",
    "mcp:validate": "npm run mcp:validate:config && npm run mcp:validate:servers",
    "mcp:validate:config": "node -e \"console.log('✅ MCP 설정 파일 검증:', JSON.parse(require('fs').readFileSync('cursor.mcp.json', 'utf8')))\"",
    "mcp:validate:servers": "npx -y @modelcontextprotocol/server-filesystem --version && npx -y @modelcontextprotocol/server-memory --version"
  }
}
```

---

## 🔧 필수 환경변수 템플릿

### `.env.local` 추가 설정

```bash
# MCP 설정
MCP_ENABLED=true
MCP_MEMORY_PATH=./mcp-memory
NODE_OPTIONS=--max-old-space-size=512

# 선택적 설정
THINKING_MODE=development
MAX_DEPTH=10
```

---

## 📋 `.gitignore` 추가 항목 템플릿

```gitignore
# MCP 관련 파일
mcp-memory/
.cursor/logs/
*.mcp.log

# MCP 백업 파일
cursor.mcp.json.backup.*
.cursor/mcp.json.backup.*
```

---

## 🚀 빠른 설정 명령어 모음

### 1. 수동 설정 (복사-붙여넣기)

```bash
# 1. 디렉토리 생성
mkdir -p .cursor mcp-memory

# 2. Windows에서 PowerShell로
New-Item -ItemType Directory -Force -Path ".cursor", "mcp-memory"

# 3. 설정 파일 복사 (위 템플릿 내용을 복사)
```

### 2. 자동 설정 스크립트

```bash
# Windows PowerShell
.\scripts\setup-mcp.ps1

# Linux/macOS
chmod +x scripts/setup-mcp.sh
./scripts/setup-mcp.sh

# Node.js (크로스 플랫폼)
node scripts/quick-mcp-setup.js

# npm 스크립트로
npm run mcp:setup
```

### 3. 검증 명령어

```bash
# 설정 파일 존재 확인
ls -la .cursor/
ls -la cursor.mcp.json

# MCP 서버 패키지 확인
npx -y @modelcontextprotocol/server-filesystem --version
npx -y @modelcontextprotocol/server-memory --version
npx -y duckduckgo-mcp-server --version
npx -y @modelcontextprotocol/server-sequential-thinking --version

# npm 스크립트로 검증
npm run mcp:validate
```

---

## 🔄 다른 프로젝트로 이전하기

### 방법 1: 파일 복사

```bash
# 현재 성공한 프로젝트에서
tar -czf mcp-config-backup.tar.gz .cursor/ cursor.mcp.json mcp-memory/

# 새 프로젝트에서
tar -xzf mcp-config-backup.tar.gz
```

### 방법 2: Git으로 관리

```bash
# 현재 프로젝트에서 템플릿 커밋
git add .cursor/ cursor.mcp.json scripts/
git commit -m "✅ MCP 완벽 설정 템플릿 추가"

# 새 프로젝트에서 체리픽
git cherry-pick <커밋-해시>
```

### 방법 3: 스크립트 실행

```bash
# 새 프로젝트에서
curl -O https://raw.githubusercontent.com/your-repo/main/scripts/quick-mcp-setup.js
node quick-mcp-setup.js
```

---

## 🧪 테스트 체크리스트

설정 완료 후 반드시 확인해야 할 항목들:

### ✅ 파일 존재 확인

- [ ] `.cursor/mcp.json` 파일 존재
- [ ] `.cursor/settings.json` 파일 존재
- [ ] `cursor.mcp.json` 파일 존재 (프로젝트 루트)
- [ ] `mcp-memory/` 디렉토리 존재

### ✅ Cursor IDE 확인

- [ ] Cursor IDE 재시작 완료
- [ ] Cmd/Ctrl + Shift + P → "MCP" 검색 시 옵션 나타남
- [ ] MCP Tools 패널에서 4개 서버 모두 "Active" 상태
- [ ] 에러 메시지 없음

### ✅ 기능 테스트

- [ ] 파일 읽기/쓰기 기능 작동 (filesystem)
- [ ] 정보 저장/검색 기능 작동 (memory)
- [ ] 웹 검색 기능 작동 (duckduckgo-search)
- [ ] 고급 사고 기능 작동 (sequential-thinking)

---

## 🔧 고급 설정 옵션

### 개발/프로덕션 환경별 설정

```json
{
  "mcpServers": {
    "filesystem": {
      "enabled": true,
      "env": {
        "NODE_OPTIONS": "--max-old-space-size=1024"
      }
    },
    "memory": {
      "enabled": true,
      "env": {
        "MEMORY_STORE_PATH": "${NODE_ENV === 'production' ? '/app/mcp-memory' : './mcp-memory'}"
      }
    }
  }
}
```

### 팀 협업용 공유 설정

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "."],
      "description": "프로젝트 파일시스템 (팀 공유)",
      "enabled": true
    }
  }
}
```

---

## 📚 참고 자료

- [MCP 완벽 설정 가이드](./MCP_완벽_설정_가이드.md) - 상세 단계별 가이드
- [MCP 성공 사례](./MCP_SETUP_SUCCESS.md) - 실제 성공 사례 분석
- [MCP 공식 문서](https://github.com/modelcontextprotocol) - 공식 레퍼런스

**생성일**: 2025-06-09  
**최종 수정**: 2025-06-09  
**상태**: ✅ 검증 완료
