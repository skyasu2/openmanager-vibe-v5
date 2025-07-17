# 🔧 수파베이스 MCP 연결 문제 해결 가이드

## 📋 문제 진단 결과

현재 수파베이스 MCP가 Claude Code에서 작동하지 않는 이유:

1. **Personal Access Token 미설정**: 수파베이스 MCP는 API 키가 아닌 Personal Access Token을 요구합니다
2. **잘못된 환경변수**: `SUPABASE_SERVICE_ROLE_KEY` 대신 `SUPABASE_ACCESS_TOKEN` 필요
3. **프로젝트 참조 누락**: 보안을 위해 `--project-ref` 설정 권장

## 🛠️ 해결 방법

### 1단계: Personal Access Token 생성

1. [수파베이스 토큰 페이지](https://supabase.com/dashboard/account/tokens) 방문
2. "Generate new token" 클릭
3. 토큰 이름: "Claude MCP Server" (또는 원하는 이름)
4. 생성된 토큰 복사 (⚠️ 한 번만 표시되므로 안전하게 저장)

### 2단계: MCP 설정 파일 생성

#### 옵션 A: Claude Code 글로벌 설정 (권장)

**Windows:**
```powershell
# PowerShell에서 실행
$configPath = "$env:APPDATA\claude-code\mcpServers.json"
New-Item -ItemType Directory -Force -Path (Split-Path $configPath)
```

**Linux/Mac:**
```bash
mkdir -p ~/.config/claude-code
```

#### 옵션 B: 프로젝트별 설정

`.claude/mcp-settings.json` 파일 생성:

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": [
        "-y",
        "@supabase/mcp-server-supabase@latest",
        "--read-only",
        "--project-ref=your_supabase_project_id_here"
      ],
      "env": {
        "SUPABASE_ACCESS_TOKEN": "YOUR_PERSONAL_ACCESS_TOKEN_HERE"
      }
    }
  }
}
```

### 3단계: Windows 사용자 추가 설정

Windows에서는 `cmd` 래퍼가 필요합니다:

```json
{
  "mcpServers": {
    "supabase": {
      "command": "cmd",
      "args": [
        "/c",
        "npx",
        "-y",
        "@supabase/mcp-server-supabase@latest",
        "--read-only",
        "--project-ref=your_supabase_project_id_here"
      ],
      "env": {
        "SUPABASE_ACCESS_TOKEN": "YOUR_PERSONAL_ACCESS_TOKEN_HERE"
      }
    }
  }
}
```

### 4단계: 보안 권장사항

1. **읽기 전용 모드**: `--read-only` 플래그 사용 (기본 설정됨)
2. **프로젝트 범위 제한**: `--project-ref` 사용 (설정됨)
3. **기능 제한**: 필요한 기능만 활성화
   ```
   --features=database,docs
   ```

### 5단계: 환경변수 설정 (선택사항)

토큰을 환경변수로 설정하면 설정 파일에서 제외할 수 있습니다:

**Windows (PowerShell):**
```powershell
[Environment]::SetEnvironmentVariable("SUPABASE_ACCESS_TOKEN", "your-token", "User")
```

**Linux/Mac:**
```bash
echo 'export SUPABASE_ACCESS_TOKEN="your-token"' >> ~/.bashrc
source ~/.bashrc
```

## ✅ 설정 완료 확인

1. Claude Code 완전히 종료
2. Claude Code 재시작
3. 새 채팅에서 다음 테스트:
   ```
   mcp__supabase__list_tables 도구를 사용할 수 있나요?
   ```

## 🚨 문제 해결

### "MCP error -32000: Connection closed" 오류
- Node.js가 설치되어 있는지 확인 (`node -v`)
- PATH에 Node.js가 있는지 확인
- Windows: `npx` 경로 확인 (`where npx`)

### 권한 오류
- Personal Access Token이 올바른지 확인
- 프로젝트 ID가 정확한지 확인

### 도구가 보이지 않음
- Claude Code 캐시 정리 후 재시작
- MCP 서버 로그 확인

## 📝 추가 정보

- **프로젝트 ID**: `your_supabase_project_id_here`
- **공식 문서**: [Supabase MCP Server](https://github.com/supabase-community/supabase-mcp)
- **보안 주의**: Personal Access Token을 절대 커밋하지 마세요!