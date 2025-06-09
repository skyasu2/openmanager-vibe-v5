# 🔧 MCP 설정 문제 해결 가이드

## ⚡ 빠른 해결: 자동 수정 스크립트

**대부분의 MCP 설정 문제를 자동으로 해결**:

```bash
npm run cursor:fix
```

이 명령어는 다음을 자동으로 수정합니다:
- ✅ 글로벌 `~/.cursor/mcp.json` 올바른 형식으로 수정
- ✅ `mcpServers must be an object` 오류 해결
- ✅ JSON 구문 오류 자동 수정
- ✅ 프로젝트 MCP 설정 검증
- ✅ Cursor 재시작 가이드 제공

---

## 🚨 현재 발견된 문제들

### 1. ✅ 해결됨: 글로벌 MCP 설정 오류들
- **문제 1**: "Global MCP config: JSON syntax error: Unexpected end of JSON input"
- **문제 2**: "Global MCP config: Invalid config: mcpServers must be an object"
- **원인**: `~/.cursor/mcp.json` 파일이 빈 파일이거나 잘못된 형식
- **해결방법**: `npm run cursor:fix` 자동 수정 스크립트로 해결됨

### 2. ⚠️ TypeScript 특화 MCP 서버가 표시되지 않음
- **문제**: magic-ui, shadcn-ui, cursor-mcp-installer가 Cursor UI에서 보이지 않음
- **원인**: Cursor가 프로젝트 전용 cursor.mcp.json을 완전히 로드하지 못함

### 3. ⚠️ filesystem MCP가 비활성화됨
- **문제**: 파일시스템 접근 MCP가 Disabled 상태

---

## 🛠️ 해결 단계

### 단계 0: ⚡ 자동 수정 먼저 시도

```bash
npm run cursor:fix
```

만약 자동 수정으로도 해결되지 않으면 아래 단계를 수동으로 진행하세요.

### 🔧 빠른 명령어 참조

| 문제 유형 | 해결 방법 | 명령어 |
|---------|---------|--------|
| **⚡ 자동 수정** | **모든 MCP 설정 자동 수정** | **`npm run cursor:fix`** |
| 설정 검증 | 전체 설정 확인 | `npm run cursor:mcp` |
| 서버 목록 | MCP 서버 상태 | `npm run mcp:list` |
| Magic MCP | API 키 설정 | `npm run mcp:magic:setup` |
| 로컬 서버 | MCP 서버 시작 | `npm run mcp:dev` |

### 단계 1: Cursor 완전히 재시작

**중요**: Cursor를 완전히 종료하고 재시작해야 합니다.

```bash
# Windows에서 Cursor 프로세스 강제 종료
taskkill /f /im Cursor.exe 2>nul || echo "Cursor가 실행되지 않음"

# 그 후 Cursor 재시작
```

### 단계 2: MCP 설정 검증

```bash
# 설정 유효성 검사
npm run cursor:mcp

# MCP 서버 목록 확인
npm run mcp:list
```

### 단계 3: Magic MCP API 키 설정

Magic MCP 사용을 위해 API 키가 필요합니다:

```bash
# .env 파일 생성 (프로젝트 루트)
echo "API_KEY=your-api-key-here" >> .env

# 또는 Windows 환경변수 설정
set API_KEY=your-api-key-here
```

**API 키 생성**: https://21st.dev/magic

### 단계 4: MCP 서버별 수동 테스트

개별 MCP 서버가 작동하는지 확인:

```bash
# DuckDuckGo Search 테스트
npx -y @modelcontextprotocol/server-duckduckgo-search

# Sequential Thinking 테스트  
npx -y @modelcontextprotocol/server-sequential-thinking

# Shadcn UI MCP 테스트
npx -y shadcn-ui-mcp-server
```

---

## 📋 설정 상태 점검 체크리스트

### ✅ 파일 존재 확인
- [ ] `cursor.mcp.json` (프로젝트 루트)
- [ ] `~/.cursor/mcp.json` (글로벌, 빈 JSON 객체 `{}`)
- [ ] `.env` (Magic MCP API 키 포함)

### ✅ MCP 서버 목록 (총 8개)
- [ ] openmanager-local (로컬 서버)
- [ ] filesystem (파일시스템)
- [ ] git (Git 저장소)
- [ ] duckduckgo-search (웹 검색)
- [ ] sequential-thinking (단계별 사고)
- [ ] magic-ui (Magic MCP)
- [ ] shadcn-ui (Shadcn UI)
- [ ] cursor-mcp-installer (MCP 설치 도구)

### ✅ 환경 설정
- [ ] NODE_ENV=development
- [ ] API_KEY 설정 (Magic MCP용)
- [ ] Cursor 재시작 완료

---

## 🔍 고급 트러블슈팅

### MCP 서버가 여전히 인식되지 않는 경우

1. **Cursor 설정 확인**
   ```bash
   # Cursor 설정 디렉토리 확인
   ls -la ~/.cursor/
   
   # MCP 로그 확인 (있는 경우)
   cat ~/.cursor/logs/mcp.log 2>/dev/null || echo "MCP 로그 없음"
   ```

2. **수동으로 글로벌 설정 백업 및 복원**
   ```bash
   # 백업된 설정 확인
   ls -la ~/.cursor/mcp.json.backup.*
   
   # 필요시 백업에서 복원
   # cp ~/.cursor/mcp.json.backup.* ~/.cursor/mcp.json
   ```

3. **프로젝트 전용 설정 우선순위 확인**
   ```bash
   # 현재 디렉토리 확인
   pwd
   
   # cursor.mcp.json 존재 확인
   ls -la cursor.mcp.json
   ```

### Magic MCP 특별 설정

Magic MCP는 API 키가 필요하므로 추가 설정이 필요합니다:

```bash
# Magic MCP 설정 가이드 출력
npm run mcp:magic:setup

# API 키 테스트
echo $API_KEY  # Linux/macOS
echo %API_KEY% # Windows
```

### filesystem MCP 활성화

filesystem MCP가 비활성화된 경우:

1. **Cursor UI에서 수동 활성화**
   - Cursor → Settings → MCP
   - filesystem 토글 활성화

2. **명령어로 테스트**
   ```bash
   # filesystem MCP 직접 테스트
   npx -y @modelcontextprotocol/server-filesystem ./src ./docs
   ```

---

## 🎯 기대되는 최종 상태

### Cursor MCP Tools 화면에서 확인해야 할 것들:

1. **오류 메시지 없음** ❌ ➜ ✅
2. **8개 MCP 서버 모두 표시** 📦
3. **각 서버의 tools enabled 수 표시** 🔧
4. **filesystem 활성화** 📁

### 사용법 예시:

```
# Magic MCP 사용
/ui 모던한 로그인 폼 만들어줘

# Shadcn UI 컴포넌트 문의
shadcn button 컴포넌트 사용법 알려줘

# Sequential Thinking 사용
복잡한 알고리즘을 단계별로 분석해줘

# MCP Installer 사용
새로운 MCP 서버 설치해줘
```

---

## 📞 여전히 문제가 있는 경우

1. **설정 검증 재실행**:
   ```bash
   npm run cursor:mcp
   ```

2. **TypeScript 특화 도구 확인**:
   ```bash
   npm run mcp:typescript
   ```

3. **Cursor 로그 확인**: 
   - Help → Toggle Developer Tools → Console

4. **MCP 서버 개별 테스트**:
   ```bash
   npm run mcp:local:status
   ```

성공적인 설정 후에는 TypeScript 개발이 훨씬 효율적이 될 것입니다! 🚀 