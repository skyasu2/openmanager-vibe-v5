# 🚀 OpenManager VIBE v5 완전 설정 가이드

> **Windows 전용 환경 복원 매뉴얼** | 다른 컴퓨터에서 git clone 후 완벽한 개발 환경 구축  
> **최종 업데이트**: 2025-08-20 | **테스트 환경**: Windows 11 Pro

## 🎯 개요

OpenManager VIBE v5를 새로운 Windows 컴퓨터에서 완벽하게 복원하는 종합 가이드입니다.

**지원하는 2가지 Windows 시나리오:**
1. **🐧 Windows + WSL 2** (권장): Linux 네이티브 성능으로 Claude Code 사용
2. **🪟 Windows 네이티브**: Windows PowerShell에서 직접 Claude Code 사용

---

## 🔄 빠른 선택 가이드

| 시나리오 | 추천 대상 | 장점 | 단점 |
|----------|-----------|------|------|
| **WSL 2** | 개발자, AI 도구 집중 사용 | 🟢 Linux 네이티브 성능<br>🟢 MCP 서버 완벽 지원<br>🟢 **모든 AI CLI 도구** 지원<br>🟢 Codex CLI 사용 가능 | 🔴 WSL 설치 필요<br>🔴 메모리 8GB+ 권장 |
| **Windows 네이티브** | 일반 사용자, 간단한 개발 | 🟢 설치 간단<br>🟢 Windows 친숙한 환경 | 🔴 일부 MCP 제한<br>🔴 **Codex CLI 미지원**<br>🔴 AI 도구 성능 차이 |

### 🤖 AI CLI 도구 지원 현황

| 도구 | WSL 2 | Windows 네이티브 | 비고 |
|------|-------|------------------|------|
| **Claude Code** | ✅ 완벽 지원 | ✅ 완벽 지원 | 두 환경 모두 동일 |
| **Codex CLI** | ✅ 완벽 지원 | ❌ **미지원** | **WSL 전용** |
| **Gemini CLI** | ✅ 완벽 지원 | ✅ 완벽 지원 | 두 환경 모두 동일 |
| **Qwen CLI** | ✅ 완벽 지원 | ✅ 완벽 지원 | 두 환경 모두 동일 |
| **ccusage** | ✅ 완벽 지원 | ✅ 완벽 지원 | 사용량 모니터링 |

> ⚠️ **중요**: **Codex CLI는 현재 WSL에서만 지원**됩니다. Windows 네이티브에서는 Claude Code + Gemini CLI + Qwen CLI만 사용 가능합니다.

---

## 🐧 시나리오 1: Windows + WSL 2 (권장)

**Linux 네이티브 성능으로 최적의 개발 경험을 제공합니다**

### 📋 사전 요구사항

- **OS**: Windows 11 Pro 22H2+
- **메모리**: 8GB+ (WSL에 8GB 할당)
- **디스크**: 5GB+ 여유 공간
- **네트워크**: 안정적인 인터넷 연결

### 🚀 자동 설정 (권장)

#### 1단계: WSL 2 설치 (Windows에서 실행)

```powershell
# 관리자 권한 PowerShell에서 실행
wsl --install Ubuntu-24.04
```

#### 2단계: 프로젝트 클론 및 설정 (WSL 내부)

```bash
# WSL 터미널에서 실행
git clone https://github.com/skyasu2/openmanager-vibe-v5.git
cd openmanager-vibe-v5

# 자동 환경 설정 실행
chmod +x bootstrap.sh
./bootstrap.sh
```

**예상 소요 시간**: 5-10분

### 🔧 수동 설정 (문제 발생 시)

<details>
<summary>📖 수동 설정 단계별 가이드 (클릭하여 펼치기)</summary>

#### 1. WSL 환경 확인

```bash
# WSL 환경인지 확인
grep -q Microsoft /proc/version && echo "✅ WSL 환경" || echo "❌ WSL이 아님"

# 배포판 확인
cat /etc/os-release | grep "^NAME="
```

#### 2. Node.js 설치

```bash
# NodeSource 저장소 추가 및 설치
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

# 버전 확인
node --version  # v22.18.0+
npm --version   # 10.5.0+
```

#### 3. 패키지 의존성 설치

```bash
# 프로젝트 디렉토리에서
npm cache clean --force
npm ci  # 또는 npm install

# 설치 확인
ls node_modules | wc -l  # 수백개 패키지
```

#### 4. 환경변수 설정

```bash
# .env.local 생성
cp .env.example .env.local

# 필수 설정 수정
nano .env.local
```

**필수 수정 항목:**
```bash
# GitHub 토큰 설정 (MCP GitHub 서버용)
GITHUB_PERSONAL_ACCESS_TOKEN=ghp_your_actual_token_here

# Google AI API 키 (선택사항)
GOOGLE_AI_API_KEY=AIza_your_actual_key_here
```

#### 5. WSL 환경변수 적용

```bash
# 환경변수 자동 설정 스크립트 실행
bash scripts/env/setup-env-local.sh

# bashrc 새로고침
source ~/.bashrc

# 설정 확인
env | grep -E "(GITHUB|GOOGLE|SUPABASE)" | wc -l  # 3개 이상
```

#### 6. Python 및 uvx 설치 (MCP 서버용)

```bash
# Python 설치
sudo apt-get install -y python3 python3-pip python3-venv

# uv 및 uvx 설치
curl -LsSf https://astral.sh/uv/install.sh | sh
export PATH="$HOME/.local/bin:$PATH"

# 설치 확인
python3 --version
uvx --version
```

#### 7. AI CLI 도구 설치

```bash
# Claude Code는 이미 설치되어 있어야 함
claude --version

# 기타 AI 도구들 (선택사항)
sudo npm install -g @google/gemini-cli
sudo npm install -g @qwen-code/qwen-code
sudo npm install -g ccusage

# 설치 확인
gemini --version
qwen --version
ccusage --version
```

#### 8. MCP 서버 설정

```bash
# MCP 의존성 설치
bash scripts/monitoring/install-dependencies.sh

# MCP 환경 설정
bash scripts/monitoring/setup-mcp-environment.sh
```

#### 9. Git 설정

```bash
# Git 사용자 정보 설정 (필요 시)
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# WSL용 줄바꿈 설정
git config --global core.autocrlf input
```

#### 10. 빌드 및 테스트

```bash
# TypeScript 컴파일 확인
npx tsc --noEmit --skipLibCheck

# 빠른 테스트 실행
npm run test:quick

# 개발 서버 시작
npm run dev
```

</details>

### ✅ WSL 환경 검증

```bash
# 환경 검증 스크립트 실행
./verify-wsl-environment.sh

# 예상 결과:
# ✅ WSL 환경: Ubuntu 24.04 LTS
# ✅ Node.js: v22.18.0
# ✅ npm 패키지: 설치됨
# ✅ 환경변수: 4개 설정됨
# ✅ AI 도구: Claude, Gemini, Qwen
# ✅ MCP 서버: 11개 연결
```

### 🎯 WSL 다음 단계

```bash
# 1. 개발 서버 시작 (WSL)
npm run dev

# 2. 브라우저 확인 (Windows)
# http://localhost:3000

# 3. Claude Code 시작 (WSL)
claude

# 4. Windows에서 WSL Claude 실행
# ./claude-wsl-optimized.bat
```

---

## 🪟 시나리오 2: Windows 네이티브

**Windows PowerShell 환경에서 직접 Claude Code를 사용합니다**

> ⚠️ **AI 도구 제한사항**: Windows 네이티브에서는 **Codex CLI가 지원되지 않습니다**. Claude Code + Gemini CLI + Qwen CLI만 사용 가능합니다.

### 📋 사전 요구사항

- **OS**: Windows 11 Pro 22H2+
- **PowerShell**: 5.1+ (관리자 권한)
- **메모리**: 4GB+ 
- **디스크**: 3GB+ 여유 공간

### 🚀 자동 설정 (권장)

#### 1단계: 프로젝트 클론

```powershell
# Git이 없는 경우 설치
winget install Git.Git

# 프로젝트 클론
git clone https://github.com/skyasu2/openmanager-vibe-v5.git
cd openmanager-vibe-v5
```

#### 2단계: 자동 환경 설정

```powershell
# 관리자 권한 PowerShell에서 실행
Set-ExecutionPolicy Bypass -Scope Process -Force
.\bootstrap.ps1
```

**예상 소요 시간**: 10-15분

### 🔧 수동 설정 (문제 발생 시)

<details>
<summary>📖 수동 설정 단계별 가이드 (클릭하여 펼치기)</summary>

#### 1. Chocolatey 설치 (패키지 관리자)

```powershell
# 관리자 권한 PowerShell에서
Set-ExecutionPolicy Bypass -Scope Process -Force
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# PATH 새로고침 후 확인
choco --version
```

#### 2. Node.js 설치

```powershell
# Chocolatey로 Node.js 설치
choco install nodejs --version="22.18.0" -y

# PATH 새로고침 후 확인
node --version  # v22.18.0
npm --version   # 10.5.0+
```

#### 3. 패키지 의존성 설치

```powershell
# 프로젝트 디렉토리에서
npm cache clean --force
npm ci  # 또는 npm install

# 설치 확인
Get-ChildItem node_modules | Measure-Object | Select-Object Count
```

#### 4. 환경변수 설정

```powershell
# .env.local 생성
Copy-Item ".env.example" ".env.local"

# Windows 기본 편집기로 수정
notepad .env.local
```

**Windows 특화 설정 추가:**
```bash
# 기본 환경변수 + Windows 특화 설정
PLATFORM=windows
USE_WSL=false
NEXT_PUBLIC_PLATFORM=windows
```

#### 5. Git 설정

```powershell
# Git 설치 (없는 경우)
choco install git -y

# Git 사용자 정보 설정
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# Windows용 줄바꿈 설정
git config --global core.autocrlf true
```

#### 6. Claude Code 설치

```powershell
# Claude Code 다운로드 및 설치
# https://docs.anthropic.com/en/docs/claude-code

# 설치 확인
claude --version
```

#### 7. Python 설치 (선택사항)

```powershell
# Python 설치
choco install python -y

# pip 업그레이드
python -m pip install --upgrade pip

# 버전 확인
python --version
```

#### 8. 빌드 및 테스트

```powershell
# TypeScript 컴파일 확인
npx tsc --noEmit --skipLibCheck

# 빠른 테스트 실행
npm run test:quick

# 개발 서버 시작
npm run dev
```

</details>

### ✅ Windows 네이티브 환경 검증

```powershell
# 환경 검증 스크립트 실행
.\verify-windows-environment.ps1

# 예상 결과:
# ✅ Windows 환경: Windows 11 Pro
# ✅ Node.js: v22.18.0
# ✅ npm 패키지: 설치됨
# ✅ 환경변수: .env.local 설정됨
# ✅ Git: 설정 완료
# ✅ Claude Code: 설치됨
```

### 🎯 Windows 네이티브 다음 단계

```powershell
# 1. 개발 서버 시작
npm run dev

# 2. 브라우저 확인
# http://localhost:3000

# 3. Claude Code 시작
claude

# 4. 환경변수 수정 (필요 시)
notepad .env.local
```

---

## 🔍 문제 해결 (Troubleshooting)

### 🐧 WSL 관련 문제

<details>
<summary>WSL 설치/실행 문제</summary>

**문제**: WSL 설치 실패 또는 시작되지 않음

**해결책**:
```powershell
# 1. Windows 기능 활성화 확인
dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart
dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart

# 2. 재부팅 후 WSL 업데이트
wsl --update

# 3. 기본 버전을 WSL 2로 설정
wsl --set-default-version 2

# 4. Ubuntu 설치
wsl --install Ubuntu-24.04
```
</details>

<details>
<summary>WSL 메모리 부족 문제</summary>

**문제**: WSL에서 메모리 부족 오류

**해결책**:
1. `C:\Users\[사용자명]\.wslconfig` 파일 생성:
```ini
[wsl2]
memory=8GB
processors=4
swap=2GB
```

2. WSL 재시작:
```powershell
wsl --shutdown
wsl
```
</details>

<details>
<summary>WSL 파일 권한 문제</summary>

**문제**: 스크립트 실행 권한 없음

**해결책**:
```bash
# 실행 권한 부여
chmod +x bootstrap.sh
chmod +x scripts/*.sh

# 소유권 변경
sudo chown -R $USER:$USER .
```
</details>

### 🪟 Windows 네이티브 관련 문제

<details>
<summary>PowerShell 실행 정책 문제</summary>

**문제**: "이 시스템에서 스크립트를 실행할 수 없습니다"

**해결책**:
```powershell
# 관리자 권한 PowerShell에서
Set-ExecutionPolicy RemoteSigned -Force

# 또는 현재 세션만
Set-ExecutionPolicy Bypass -Scope Process -Force
```
</details>

<details>
<summary>Chocolatey 설치 실패</summary>

**문제**: Chocolatey 설치 중 오류

**해결책**:
```powershell
# 1. TLS 보안 프로토콜 설정
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

# 2. 관리자 권한 확인
$currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
$principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
$isAdmin = $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) { Write-Error "관리자 권한이 필요합니다" }

# 3. 수동 설치
iwr https://community.chocolatey.org/install.ps1 -UseBasicParsing | iex
```
</details>

<details>
<summary>Node.js 설치 실패</summary>

**문제**: Node.js 설치 또는 버전 문제

**해결책**:
```powershell
# 1. 기존 Node.js 완전 제거
choco uninstall nodejs -y

# 2. 새로 설치
choco install nodejs --version="22.18.0" -y

# 3. PATH 새로고침
$env:PATH = [System.Environment]::GetEnvironmentVariable("PATH","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("PATH","User")

# 4. 확인
node --version
npm --version
```
</details>

### 🔄 공통 문제

<details>
<summary>npm 설치 실패</summary>

**문제**: npm install 중 오류

**해결책**:
```bash
# 1. 캐시 정리
npm cache clean --force

# 2. node_modules 삭제 후 재설치
rm -rf node_modules package-lock.json
npm install

# 3. 권한 문제 (WSL)
sudo chown -R $(whoami) ~/.npm

# 4. 네트워크 문제 시 registry 변경
npm config set registry https://registry.npmjs.org/
```
</details>

<details>
<summary>환경변수 문제</summary>

**문제**: .env.local이 로드되지 않음

**해결책**:

**WSL:**
```bash
# 환경변수 수동 로드
source .env.local
export $(grep -v '^#' .env.local | xargs)

# bashrc에 추가
echo 'export $(grep -v "^#" /path/to/.env.local | xargs)' >> ~/.bashrc
```

**Windows:**
```powershell
# .env.local을 PowerShell 환경변수로 로드
Get-Content .env.local | ForEach-Object {
    if ($_ -match '^([^#][^=]+)=(.*)$') {
        [System.Environment]::SetEnvironmentVariable($matches[1], $matches[2], "Process")
    }
}
```
</details>

<details>
<summary>Claude Code 연결 문제</summary>

**문제**: Claude Code가 프로젝트를 인식하지 못함

**해결책**:
```bash
# 1. 프로젝트 루트에서 실행 확인
pwd
ls package.json  # 존재해야 함

# 2. Claude Code 재시작
claude api restart

# 3. 설정 확인
claude config list

# 4. 로그 확인
claude logs
```
</details>

---

## 📊 성능 최적화 팁

### 🐧 WSL 최적화

```ini
# C:\Users\[사용자명]\.wslconfig
[wsl2]
memory=8GB                    # 메모리 8GB 할당
processors=6                  # CPU 6코어 할당  
swap=16GB                     # 스왑 16GB (AI 작업용)
localhostForwarding=true      # 네트워크 최적화
nestedVirtualization=true     # 중첩 가상화
```

### 🪟 Windows 네이티브 최적화

```powershell
# Node.js 메모리 증가
$env:NODE_OPTIONS="--max-old-space-size=4096"

# npm 병렬 처리 증가  
npm config set maxsockets 50

# 캐시 크기 증가
npm config set cache-max 1000000000
```

---

## 🎯 최종 체크리스트

### 기본 요구사항
- [ ] Windows 11 Pro 22H2+
- [ ] 안정적인 인터넷 연결
- [ ] 관리자 권한 (Windows 네이티브) 또는 sudo 권한 (WSL)

### WSL 시나리오
- [ ] WSL 2 설치 및 Ubuntu 24.04 LTS
- [ ] Node.js v22.18.0+
- [ ] npm 패키지 설치 완료
- [ ] .env.local 설정
- [ ] 환경변수 bashrc 적용
- [ ] AI CLI 도구 설치 (Claude, Gemini, Qwen, ccusage)
- [ ] MCP 서버 11개 연결
- [ ] 개발 서버 정상 시작 (npm run dev)
- [ ] http://localhost:3000 접속 가능

### Windows 네이티브 시나리오  
- [ ] Chocolatey 패키지 관리자 설치
- [ ] Node.js v22.18.0+
- [ ] npm 패키지 설치 완료
- [ ] .env.local 설정 (Windows 특화)
- [ ] Git 설정 완료
- [ ] Claude Code 설치
- [ ] 개발 서버 정상 시작 (npm run dev)
- [ ] http://localhost:3000 접속 가능

---

## 🚀 다음 단계

✅ **환경 설정 완료 후** 다음 문서들을 참고하세요:

| 목적 | 문서 | 예상 소요시간 |
|------|------|---------------|
| **빠른 시작** | [docs/QUICK-START.md](docs/QUICK-START.md) | 5분 |
| **AI 도구 활용** | [CLAUDE.md](CLAUDE.md) | 15분 |
| **MCP 서버 활용** | [docs/MCP-GUIDE.md](docs/MCP-GUIDE.md) | 20분 |
| **전체 아키텍처** | [docs/system-architecture.md](docs/system-architecture.md) | 15분 |

---

## 💬 지원 및 피드백

**문제가 계속 발생하는 경우:**

1. **로그 확인**: `setup.log` (WSL) 또는 `setup-windows.log` (Windows)
2. **상세 가이드**: [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)
3. **GitHub Issues**: https://github.com/skyasu2/openmanager-vibe-v5/issues

---

💡 **핵심 원칙**: Windows 2가지 시나리오 지원 + 완전 자동화 + 완벽한 환경 복원