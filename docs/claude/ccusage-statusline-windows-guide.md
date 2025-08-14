# 🪟 Windows용 ccusage Statusline 완벽 가이드

> **최종 업데이트**: 2025-08-14 | **플랫폼**: Windows 10/11 | **상태**: ✅ 검증됨

## 📋 목차
- [개요](#개요)
- [Windows 환경 준비](#windows-환경-준비)
- [설치 방법](#설치-방법)
- [설정 옵션별 비교](#설정-옵션별-비교)
- [문제 해결](#문제-해결)
- [성능 최적화](#성능-최적화)
- [대안 도구](#대안-도구)

---

## 개요

ccusage statusline은 Claude Code IDE 하단에 실시간 사용량 통계를 표시하는 도구입니다.

### 표시 정보
- 🤖 **모델**: 현재 사용 중인 Claude 모델
- 💰 **세션 비용**: 현재 대화 세션 비용
- 💵 **일일 비용**: 오늘 총 사용 비용
- 📦 **블록 비용**: 5시간 청구 블록 (남은 시간 포함)
- 🔥 **시간당 비용**: 평균 소모율
- 🧠 **컨텍스트**: 토큰 사용량 및 백분율

### 예시 출력
```
🤖 Opus 4.1 | 💰 $0.23 session / $860.01 today / $25.36 block (3h 47m left) | 🔥 $37.04/hr | 🧠 10869 (14.2%)
```

---

## Windows 환경 준비

### 1. 필수 도구 확인

```powershell
# Node.js 설치 확인 (필수)
node --version

# npm 설치 확인
npm --version

# Git Bash 설치 확인 (권장)
where git

# Bun 설치 확인 (선택사항, 성능 향상)
bun --version
```

### 2. Bun 설치 (선택사항, 권장)

Bun은 Windows에서 ccusage 실행 속도를 **크게 향상**시킵니다.

```powershell
# PowerShell 관리자 권한으로 실행
powershell -c "irm bun.sh/install.ps1 | iex"

# 또는 npm으로 설치
npm install -g bun
```

### 3. PATH 환경변수 설정

Windows에서 npm 글로벌 패키지가 인식되지 않는 경우:

```powershell
# PowerShell에서 npm 글로벌 경로 확인
npm config get prefix

# 일반적으로: C:\Users\%USERNAME%\AppData\Roaming\npm
# 이 경로를 시스템 PATH에 추가

# PowerShell로 PATH 추가
[System.Environment]::SetEnvironmentVariable(
    "Path",
    $env:Path + ";C:\Users\$env:USERNAME\AppData\Roaming\npm",
    [System.EnvironmentVariableTarget]::User
)
```

### 4. Git Bash 경로 설정 (Claude Code 필수)

```powershell
# Git Bash 경로를 환경변수로 설정
[System.Environment]::SetEnvironmentVariable(
    'CLAUDE_CODE_GIT_BASH_PATH',
    'C:\Program Files\Git\bin\bash.exe',
    'User'
)
```

---

## 설치 방법

### 📌 방법 1: NPX 사용 (Windows 기본 권장)

**장점**: 설치 불필요, Windows 호환성 우수  
**단점**: Bun보다 느림

```json
{
  "statusLine": {
    "type": "command",
    "command": "npx -y ccusage statusline",
    "padding": 0
  }
}
```

### ⚡ 방법 2: Bun 사용 (성능 최적화)

**장점**: 가장 빠른 실행 속도  
**단점**: Bun 설치 필요

```json
{
  "statusLine": {
    "type": "command",
    "command": "bunx ccusage statusline",
    "padding": 0
  }
}
```

### 🌐 방법 3: 온라인 모드 (최신 가격)

**장점**: 항상 최신 가격 데이터  
**단점**: 네트워크 지연 발생 가능

```json
{
  "statusLine": {
    "type": "command",
    "command": "npx -y ccusage statusline --no-offline",
    "padding": 0
  }
}
```

### 🛠️ 방법 4: 전역 설치 후 사용

**장점**: 가장 빠른 시작 속도  
**단점**: 수동 업데이트 필요

```powershell
# 전역 설치
npm install -g ccusage

# settings.json 설정
```

```json
{
  "statusLine": {
    "type": "command",
    "command": "ccusage statusline",
    "padding": 0
  }
}
```

---

## 설정 옵션별 비교

| 방법 | 속도 | 설치 필요 | 자동 업데이트 | Windows 호환성 | 권장 상황 |
|------|------|-----------|---------------|----------------|----------|
| npx | 보통 | ❌ | ✅ | 최고 | **일반 사용자** |
| bunx | 빠름 | Bun 필요 | ✅ | 좋음 | 성능 중시 |
| 전역 설치 | 매우 빠름 | ✅ | ❌ | 최고 | 안정성 중시 |
| 온라인 모드 | 느림 | ❌ | ✅ | 최고 | 정확성 중시 |

---

## 환경변수 커스터마이징

### PowerShell에서 설정

```powershell
# 컨텍스트 사용량 색상 임계값 설정
# 녹색 < 60% < 노란색 < 85% < 빨간색

[System.Environment]::SetEnvironmentVariable('CCUSAGE_CONTEXT_LOW_THRESHOLD', '60', 'User')
[System.Environment]::SetEnvironmentVariable('CCUSAGE_CONTEXT_MEDIUM_THRESHOLD', '85', 'User')

# 설정 확인
echo $env:CCUSAGE_CONTEXT_LOW_THRESHOLD
echo $env:CCUSAGE_CONTEXT_MEDIUM_THRESHOLD
```

### 임시 설정 (현재 세션만)

```powershell
$env:CCUSAGE_CONTEXT_LOW_THRESHOLD = "60"
$env:CCUSAGE_CONTEXT_MEDIUM_THRESHOLD = "85"
```

---

## 문제 해결

### ⚠️ 중요 경고: 무한 프로세스 스폰 이슈

일부 Windows 환경에서 ccusage statusline이 **무한 프로세스를 생성**하여 CPU 100% 사용 문제가 발생할 수 있습니다.

**증상**:
- CPU 사용률 급증
- 시스템 응답 없음
- 작업 관리자에 수백 개의 node/npm 프로세스

**해결 방법**:
1. Claude Code 즉시 종료
2. 작업 관리자에서 모든 node.exe 프로세스 종료
3. 다른 설정 방법 시도 (npx → bunx 또는 전역 설치)

### 출력이 표시되지 않는 경우

```powershell
# 1. ccusage 동작 확인
npx -y ccusage --version

# 2. Claude 설정 파일 위치 확인
dir $env:USERPROFILE\.claude\settings.json
# 또는
dir $env:APPDATA\claude\settings.json

# 3. 설정 파일 내용 확인
type $env:USERPROFILE\.claude\settings.json

# 4. Claude Code 재시작
# 터미널에서 Ctrl+C로 종료 후 다시 실행
```

### N/A Session 문제

**원인**: Windows에서 세션 정보 동기화 지연

**해결책 우선순위**:
1. 온라인 모드 사용 (`--no-offline`)
2. Bun 대신 npx 사용
3. 전역 설치 후 직접 실행
4. Claude Code 재시작

### PowerShell 실행 정책 문제

```powershell
# 스크립트 실행이 차단되는 경우
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# 확인
Get-ExecutionPolicy -Scope CurrentUser
```

---

## 성능 최적화

### Windows 특화 최적화 팁

1. **Bun 사용**: npx 대비 3-5배 빠른 실행
2. **전역 설치**: 매번 다운로드 방지
3. **Windows Defender 예외**: node_modules 폴더 제외
4. **SSD 사용**: JSONL 파일 읽기 속도 향상

### 리소스 모니터링

```powershell
# CPU 사용률 확인
Get-Process node,npm,bun -ErrorAction SilentlyContinue | 
    Select-Object Name, CPU, WorkingSet

# ccusage 프로세스만 확인
Get-Process | Where-Object {$_.ProcessName -match "ccusage"}
```

---

## 대안 도구

### 1. ccstatusline

고급 커스터마이징이 필요한 경우:

```bash
npm install -g ccstatusline
```

**특징**:
- 배경색, 굵은 글씨 지원
- 멀티라인 지원
- TUI 설정 인터페이스

### 2. @chongdashu/cc-statusline

Git 통합이 필요한 경우:

```bash
npm install -g @chongdashu/cc-statusline
```

**특징**:
- Git 브랜치 표시
- 스마트 디렉토리 표시
- TTY 인식 색상

### 3. Claude Code Usage Monitor

고급 모니터링이 필요한 경우:

```bash
git clone https://github.com/Maciek-roboblog/Claude-Code-Usage-Monitor
```

**특징**:
- 실시간 예측
- 비용 경고
- 상세 분석

---

## 테스트 방법

### 수동 테스트

```powershell
# 모의 JSON 입력으로 테스트
echo '{"model":{"display_name":"Opus"},"workspace":{"current_dir":"C:\\test"}}' | npx -y ccusage statusline

# 실제 사용 데이터 확인
npx -y ccusage daily
npx -y ccusage blocks --current
```

### 자동화 테스트 스크립트

```powershell
# test-statusline.ps1
$testInput = @{
    model = @{ display_name = "Opus 4.1" }
    workspace = @{ current_dir = "D:\test" }
} | ConvertTo-Json

$testInput | npx -y ccusage statusline
```

---

## 업데이트 및 유지보수

### ccusage 업데이트

```powershell
# npx는 항상 최신 버전 사용
# 전역 설치의 경우 수동 업데이트
npm update -g ccusage

# 버전 확인
npm list -g ccusage
```

### Claude Code 업데이트

```powershell
# Claude Code 최신 버전으로 업데이트
npm update -g @anthropic-ai/claude-code

# 버전 확인
claude --version
```

---

## 추가 리소스

- [ccusage 공식 문서](https://ccusage.com/guide/statusline)
- [ccusage GitHub](https://github.com/ryoppippi/ccusage)
- [Claude Code 공식 문서](https://docs.anthropic.com/en/docs/claude-code)
- [Windows Claude Code 가이드](https://alikhallad.com/your-missing-guide-to-claude-code-on-windows-vs-code/)

---

## 요약

### Windows 사용자를 위한 권장 설정

```json
{
  "statusLine": {
    "type": "command",
    "command": "npx -y ccusage statusline",
    "padding": 0
  },
  "locale": "ko-KR",
  "timezone": "Asia/Seoul"
}
```

**이유**:
1. Windows 호환성 최고
2. 설치 불필요
3. 자동 업데이트
4. 안정적 작동

성능이 중요하다면 Bun 설치 후 `bunx ccusage statusline` 사용을 고려하세요.

---

**작성일**: 2025-08-14  
**플랫폼**: Windows 10/11  
**테스트 환경**: PowerShell 7.4, Node.js 20.x, npm 10.x