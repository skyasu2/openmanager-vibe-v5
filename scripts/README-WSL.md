# Claude Code WSL 전용 스크립트 가이드

## 🚀 통합 설정 스크립트

### setup-claude-code-wsl.sh

Claude Code를 WSL에서 사용하기 위한 모든 설정을 한번에 처리하는 통합 스크립트입니다.

**실행 방법:**

```bash
cd /mnt/d/cursor/openmanager-vibe-v5
./scripts/setup-claude-code-wsl.sh
```

**수행 작업:**

1. ✅ 환경변수 설정 (`.env.local` → `~/.bashrc`)
2. ✅ Gemini CLI 별칭 설정
3. ✅ MCP 서버 설정 확인
4. ✅ npm 의존성 설치
5. ✅ Git 설정 확인

## 📁 스크립트 구조

### 활성 스크립트 (WSL용)

- `setup-claude-code-wsl.sh` - 통합 설정 스크립트
- `setup-mcp-env-wsl.sh` - 환경변수만 설정 (부분 설정)
- `setup-mcp-wsl.sh` - MCP 서버 설정 (참고용)
- `restart-claude-wsl.sh` - Claude Code 재시작

### 유틸리티 스크립트

- `diagnose-mcp-issue.ps1` - 문제 진단 (PowerShell에서 실행)
- `gemini-helpers.ps1` - Gemini CLI 헬퍼 함수 (참고용)

### 보관된 Windows 스크립트

`archived-windows/` 폴더에 이동된 PowerShell 스크립트들은 더 이상 사용하지 않습니다.

## 🔧 환경변수 관리

### 확인 방법

```bash
# 설정된 환경변수 확인
printenv | grep -E "(GITHUB|SUPABASE|TAVILY|GOOGLE_AI)"

# 개별 확인
echo $GITHUB_TOKEN
echo $SUPABASE_URL
echo $TAVILY_API_KEY
```

### 재설정 방법

```bash
# 전체 재설정
./scripts/setup-claude-code-wsl.sh

# 환경변수만 재설정
./scripts/setup-mcp-env-wsl.sh
```

## 🐛 문제 해결

### MCP 서버가 작동하지 않을 때

1. Claude Code 재시작
2. `/mcp` 명령으로 상태 확인
3. 환경변수 확인: `printenv | grep -E "(GITHUB|SUPABASE|TAVILY)"`

### Gemini CLI가 작동하지 않을 때

1. Windows에서 `gemini --version` 확인
2. WSL에서 `gemini --version` 확인
3. 별칭 재설정: `source ~/.bashrc`

### 권한 문제

```bash
# 스크립트 실행 권한 부여
chmod +x scripts/*.sh

# 프로젝트 소유권 수정
sudo chown -R $USER:$USER /mnt/d/cursor/openmanager-vibe-v5
```

## 📌 중요 사항

1. **WSL 전용**: 모든 설정은 WSL 환경에 최적화되어 있습니다
2. **경로 형식**: `/mnt/d/...` 형식의 WSL 경로 사용
3. **환경변수**: `.env.local`에서 자동으로 읽어 설정
4. **Gemini CLI**: Windows의 gemini.exe를 WSL에서 사용

최종 업데이트: 2025-07-15
