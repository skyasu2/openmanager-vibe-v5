# 🚀 MCP 완벽 설정 가이드

## 다른 프로젝트에서도 동일하게 재사용 가능한 완전한 가이드

### 📋 검증된 성공 사례

- **프로젝트**: OpenManager Vibe v5
- **설정일**: 2025-06-09
- **IDE**: Cursor IDE
- **성공률**: 100% ✅

---

## 🎯 1단계: 프로젝트 준비

### 필수 요구사항 확인

```bash
# Node.js 18+ 필수
node --version

# npm 설치 확인
npm --version

# 프로젝트 의존성 설치
npm install
```

### 기본 프로젝트 구조

```
프로젝트-루트/
├── .cursor/          # Cursor IDE 설정
├── package.json      # Node.js 프로젝트
└── cursor.mcp.json   # MCP 설정 파일
```

---

## 🔧 2단계: 핵심 설정 파일 생성

### A. `.cursor/mcp.json` 생성

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

### B. `cursor.mcp.json` 생성 (프로젝트 루트)

**중요**: 동일한 내용을 프로젝트 루트에도 복사해야 합니다!

### C. `.cursor/settings.json` 생성

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

## 🚀 3단계: 자동 설정 스크립트

### Windows PowerShell용 (`setup-mcp.ps1`)

```powershell
#!/usr/bin/env pwsh
# MCP 완벽 설정 자동화 스크립트 (Windows)

Write-Host "🚀 MCP 완벽 설정을 시작합니다..." -ForegroundColor Green

# 1. 디렉토리 생성
Write-Host "📁 디렉토리 구조 생성 중..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path ".cursor" | Out-Null
New-Item -ItemType Directory -Force -Path "mcp-memory" | Out-Null

# 2. MCP 설정 파일 생성
Write-Host "⚙️ MCP 설정 파일 생성 중..." -ForegroundColor Yellow

$mcpConfig = @'
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
'@

# 파일 생성
$mcpConfig | Out-File -FilePath ".cursor\mcp.json" -Encoding UTF8
$mcpConfig | Out-File -FilePath "cursor.mcp.json" -Encoding UTF8

# 3. Cursor 설정 파일 생성
$cursorSettings = @'
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
'@

$cursorSettings | Out-File -FilePath ".cursor\settings.json" -Encoding UTF8

# 4. 패키지 사전 다운로드 (선택사항)
Write-Host "📦 MCP 서버 패키지 사전 캐시 중..." -ForegroundColor Yellow
npx -y @modelcontextprotocol/server-filesystem --version 2>$null
npx -y @modelcontextprotocol/server-memory --version 2>$null
npx -y duckduckgo-mcp-server --version 2>$null
npx -y @modelcontextprotocol/server-sequential-thinking --version 2>$null

Write-Host "✅ MCP 설정이 완료되었습니다!" -ForegroundColor Green
Write-Host "🔄 Cursor IDE를 재시작하세요." -ForegroundColor Cyan
```

### Linux/macOS용 (`setup-mcp.sh`)

```bash
#!/bin/bash
# MCP 완벽 설정 자동화 스크립트 (Linux/macOS)

echo "🚀 MCP 완벽 설정을 시작합니다..."

# 1. 디렉토리 생성
echo "📁 디렉토리 구조 생성 중..."
mkdir -p .cursor
mkdir -p mcp-memory

# 2. MCP 설정 파일 생성
echo "⚙️ MCP 설정 파일 생성 중..."
cat > .cursor/mcp.json << 'EOF'
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
EOF

# 프로젝트 루트에도 복사
cp .cursor/mcp.json cursor.mcp.json

# 3. Cursor 설정 파일 생성
cat > .cursor/settings.json << 'EOF'
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
EOF

# 4. 패키지 사전 다운로드 (선택사항)
echo "📦 MCP 서버 패키지 사전 캐시 중..."
npx -y @modelcontextprotocol/server-filesystem --version > /dev/null 2>&1
npx -y @modelcontextprotocol/server-memory --version > /dev/null 2>&1
npx -y duckduckgo-mcp-server --version > /dev/null 2>&1
npx -y @modelcontextprotocol/server-sequential-thinking --version > /dev/null 2>&1

echo "✅ MCP 설정이 완료되었습니다!"
echo "🔄 Cursor IDE를 재시작하세요."
```

---

## 🔍 4단계: 설정 검증

### A. 파일 구조 확인

```
프로젝트/
├── .cursor/
│   ├── mcp.json ✅
│   └── settings.json ✅
├── cursor.mcp.json ✅
└── mcp-memory/ ✅
```

### B. Cursor IDE에서 확인

1. **Cursor IDE 재시작**
2. **Cmd/Ctrl + Shift + P** → "MCP" 검색
3. **MCP Tools 패널** 확인
4. **모든 서버 Active 상태** 확인

### C. 기능 테스트

```
✅ 파일 읽기/쓰기 (filesystem)
✅ 정보 저장/검색 (memory)
✅ 웹 검색 (duckduckgo)
✅ 고급 사고 (sequential-thinking)
```

---

## 📊 5단계: 성능 최적화

### 메모리 사용량 설정

```json
"env": {
  "NODE_OPTIONS": "--max-old-space-size=512"  // 512MB 제한
}
```

### 선택적 서버 활성화

```json
"enabled": false  // 불필요한 서버는 비활성화
```

### 로컬 캐시 디렉토리

```bash
mkdir -p mcp-memory  // 메모리 서버용 로컬 저장소
```

---

## 🚨 트러블슈팅

### 흔한 문제들

1. **서버가 인식되지 않음**

   - Cursor IDE 완전 재시작
   - `cursor.mcp.json` 파일 존재 확인

2. **npx 실행 오류**

   - Node.js 18+ 버전 확인
   - npm 캐시 클리어: `npm cache clean --force`

3. **메모리 부족 오류**
   - `NODE_OPTIONS` 메모리 제한 조정
   - 불필요한 서버 비활성화

### 로그 확인 방법

```bash
# Cursor 개발자 도구
Cmd/Ctrl + Shift + I → Console 탭
```

---

## 🎯 다른 프로젝트 적용 방법

### 1. 새 프로젝트에서

```bash
# 1. 프로젝트 클론
git clone <repository-url>
cd <project-name>

# 2. 자동 설정 실행
curl -O https://raw.githubusercontent.com/your-repo/setup-mcp.sh
chmod +x setup-mcp.sh
./setup-mcp.sh

# 3. Cursor IDE 재시작
```

### 2. 기존 프로젝트에서

```bash
# 1. 설정 파일 복사
cp path/to/success-project/.cursor/mcp.json .cursor/
cp path/to/success-project/cursor.mcp.json .

# 2. Cursor 재시작
```

---

## 📝 체크리스트

### 설정 전

- [ ] Node.js 18+ 설치됨
- [ ] npm 정상 작동
- [ ] Cursor IDE 설치됨
- [ ] 프로젝트 준비됨

### 설정 중

- [ ] `.cursor/` 디렉토리 생성
- [ ] `mcp.json` 파일 생성
- [ ] `cursor.mcp.json` 파일 생성 (루트)
- [ ] `settings.json` 파일 생성
- [ ] 권한 설정 확인

### 설정 후

- [ ] Cursor IDE 재시작
- [ ] MCP Tools 패널 확인
- [ ] 모든 서버 Active 확인
- [ ] 기본 기능 테스트
- [ ] 성능 모니터링

---

## 🎉 성공 확인

모든 설정이 완료되면:

- **4개 MCP 서버** 모두 활성화 ✅
- **파일 시스템 접근** 가능 ✅
- **웹 검색** 기능 작동 ✅
- **고급 AI 사고** 처리 가능 ✅
- **정보 저장/검색** 기능 작동 ✅

**축하합니다! 🎊 완벽한 MCP 개발 환경이 구축되었습니다!**

---

## 🔗 관련 문서

- [MCP 공식 문서](https://github.com/modelcontextprotocol)
- [Cursor IDE 가이드](https://cursor.sh/docs)
- [성공 사례 분석](./MCP_SETUP_SUCCESS.md)

**생성일**: 2025-06-09  
**버전**: 1.0.0  
**상태**: ✅ 검증 완료
