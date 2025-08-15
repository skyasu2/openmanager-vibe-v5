# CLAUDE.md WSL 환경 업데이트 스크립트

Write-Host "📝 CLAUDE.md WSL 환경 업데이트..." -ForegroundColor Green

# CLAUDE.md 파일 읽기
$claudeMdPath = "CLAUDE.md"
$content = Get-Content $claudeMdPath -Raw -Encoding UTF8

# Windows 문제 해결 섹션 제거 및 WSL 섹션으로 교체
$wslSection = @"
## 🐧 WSL 환경 설정 및 문제 해결

### WSL AI CLI 도구 실행
WSL에서 모든 AI CLI 도구가 완벽하게 작동합니다:

```bash
# WSL 내부에서 직접 실행
wsl
claude --version        # Claude Code v1.0.81
gemini --version        # Google Gemini CLI v0.1.21
qwen --version          # Qwen CLI v0.0.6

# Windows에서 WSL 도구 실행
.\claude-wsl-optimized.bat /status
.\gemini-wsl.bat --help
.\qwen-wsl.bat --help
.\ai-cli-wsl.bat claude --version
```

### WSL 최적화 상태 확인
```bash
# WSL 메모리 및 리소스 확인
wsl -e bash -c "free -h"          # 메모리: 9.7GB 사용 가능
wsl -e bash -c "df -h /"          # 디스크: 1TB 사용 가능

# sudo 비밀번호 없이 사용 확인
wsl sudo whoami                   # root (비밀번호 입력 없음)

# AI 도구 설치 상태 확인
wsl npm list -g --depth=0 | grep -E "(claude|gemini|qwen)"
```

### 문제 해결
**WSL 연결 문제**:
```powershell
# WSL 재시작
wsl --shutdown
wsl

# WSL 상태 확인
wsl --status
```

**AI 도구 재설치**:
```bash
# WSL에서 AI 도구 재설치
wsl
sudo npm install -g @anthropic-ai/claude-code
sudo npm install -g @google/gemini-cli
sudo npm install -g @qwen-code/qwen-code
```

### 생성된 WSL 도구들
- **`claude-wsl-optimized.bat`**: 최적화된 Claude Code 실행
- **`gemini-wsl.bat`**: Google Gemini CLI 실행
- **`qwen-wsl.bat`**: Qwen CLI 실행
- **`ai-cli-wsl.bat`**: 통합 AI CLI 실행기

### Windows 레거시 스크립트
Windows 환경에서 사용되던 모든 스크립트들은 `scripts/windows-legacy/` 폴더로 이동되었습니다. 
현재는 WSL 환경에서 모든 AI CLI 도구가 완벽하게 작동하므로 더 이상 필요하지 않습니다.
"@

# Windows 문제 해결 섹션을 찾아서 교체
$pattern = "## 🚨.*?(?=## |$)"
$newContent = $content -replace $pattern, $wslSection, "Singleline"

# 파일에 저장
$newContent | Out-File -FilePath $claudeMdPath -Encoding UTF8 -Force

Write-Host "✅ CLAUDE.md WSL 환경 업데이트 완료" -ForegroundColor Green