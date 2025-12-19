# WSL 재설치 시 개발 환경 복원 가이드

**작성일**: 2025-12-19
**버전**: 1.2.0
**대상**: OpenManager VIBE v5.83.1 개발 환경

---

## 📋 목차

1. [사전 준비 (백업)](#-사전-준비-백업)
2. [WSL 재설치](#-wsl-재설치)
3. [기본 시스템 설정](#-기본-시스템-설정)
4. [개발 도구 복원](#-개발-도구-복원)
5. [프로젝트 환경 복원](#-프로젝트-환경-복원)
6. [검증 및 테스트](#-검증-및-테스트)

---

## 🎯 사전 준비 (백업)

### 1. 패키지 스냅샷 생성

WSL 재설치 전 현재 설치된 모든 패키지를 백업합니다.

```bash
# 스냅샷 생성 스크립트 실행
# Git 리포지토리 최상위 디렉토리로 이동 (동적 경로)
cd "$(git rev-parse --show-toplevel)" && \
  chmod +x scripts/environment/create-wsl-snapshot.sh && \
  ./scripts/environment/create-wsl-snapshot.sh
```

**생성되는 파일** (`$HOME/wsl-restore-backup-YYYYMMDD_HHMMSS/`):

**참고**: 백업 디렉토리는 `wsl-restore-backup-YYYYMMDD_HHMMSS` 형식으로 타임스탬프 기반 생성됩니다. 실제 경로는 스크립트 실행 시 출력되는 메시지를 확인하세요.

- `apt-packages.txt` - apt 패키지 목록 (1076개)
- `npm-global-packages.json` - npm 글로벌 패키지
- `cargo-packages.txt` - Rust/Cargo 패키지
- `git-config.txt` - Git 설정
- `bashrc.backup` - Shell 설정
- `wslconfig.backup` - WSL 최적화 설정

### 2. Windows로 백업 복사

```bash
# Windows 파일 시스템으로 백업 복사 (안전한 곳에 보관)
cp -r $HOME/wsl-restore-backup /mnt/c/wsl-backup/
```

### 3. SSH 키 별도 백업 (중요!)

```bash
# SSH 키는 별도로 안전하게 백업 (외부 저장소 권장)
cp -r ~/.ssh /mnt/c/wsl-backup/ssh-keys-backup
```

---

## 🔄 WSL 재설치

### Windows PowerShell에서 실행:

```powershell
# 1. 현재 WSL 상태 확인
wsl --list --verbose

# 2. WSL 종료
wsl --shutdown

# 3. 기존 Ubuntu 제거 (데이터 손실 주의!)
wsl --unregister Ubuntu-24.04

# 4. 새 Ubuntu 설치
wsl --install -d Ubuntu-24.04

# 5. WSL 시작 및 사용자 생성
wsl
```

---

## ⚙️ 기본 시스템 설정

### 1. 시스템 업데이트

```bash
sudo apt update && sudo apt upgrade -y
```

### 2. 필수 도구 설치

```bash
# 빌드 도구 및 유틸리티
sudo apt install -y \
  build-essential \
  curl \
  wget \
  git \
  ca-certificates \
  gnupg \
  lsb-release \
  unzip \
  zip
```

### 3. .wslconfig 복원 (Windows 측)

```bash
# 백업한 .wslconfig 복사
cp /mnt/c/wsl-backup/wsl-restore-backup/wslconfig.backup /mnt/c/Users/$(whoami)/.wslconfig
```

**`.wslconfig` 내용 (수동 생성 시)**:

```ini
[wsl2]
memory=12GB          # 총 RAM의 60%
processors=6         # 6 코어
swap=8GB
localhostForwarding=true
# dnsTunneling=true  # 네트워크 문제 시 활성화
# autoProxy=true     # 프록시 필요 시 활성화

[experimental]
autoMemoryReclaim=gradual  # 자동 메모리 회수
```

### 4. Git 설정 복원

```bash
# Git 설정 복원
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# 또는 백업에서 자동 복원
# git config --global --list < /mnt/c/wsl-backup/wsl-restore-backup/git-config.txt
```

### 5. SSH 키 복원

```bash
# SSH 키 복원
mkdir -p ~/.ssh
cp -r /mnt/c/wsl-backup/ssh-keys-backup/* ~/.ssh/
chmod 700 ~/.ssh
chmod 600 ~/.ssh/id_*
chmod 644 ~/.ssh/id_*.pub
```

---

## 🛠 개발 도구 복원

### 1. Node.js 설치 (NVM)

```bash
# NVM 설치
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.0/install.sh | bash

# Shell 재시작
source ~/.bashrc

# Node.js 22.21.1 설치 (프로젝트 버전)
nvm install 22.21.1
nvm use 22.21.1
nvm alias default 22.21.1

# 버전 확인
node --version  # v22.21.1
npm --version   # v11.6.2
```

### 2. npm 글로벌 패키지 복원

```bash
# npm 글로벌 설치 경로 설정
mkdir -p ~/.npm-global
npm config set prefix ~/.npm-global

# .bashrc에 경로 추가
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc

# 글로벌 패키지 복원 (핵심 6개) - 2025.12.19 기준 최신화
npm install -g @anthropic-ai/claude-code@2.0.71
npm install -g @google/gemini-cli@0.25.0
npm install -g @openai/codex@0.73.0
npm install -g @qwen-code/qwen-code@0.5.1
npm install -g n@10.2.0
npm install -g vercel@48.9.0

# 설치 확인
npm list -g --depth=0
```

### 2-1. Docker Desktop 재연결 (중요)
WSL을 재설치하면 Docker Desktop과의 연결이 끊어집니다.
1.  **Windows**에서 Docker Desktop 실행
2.  Settings (톱니바퀴) > **Resources** > **WSL Integration**
3.  `Ubuntu-24.04` (또는 새로 설치한 배포판) 체크박스 **ON**
4.  Apply & Restart
5.  WSL 터미널에서 `docker ps` 잘 되는지 확인

### 3. Rust/Cargo 설치

```bash
# Rust 설치 (Serena 지원 필요)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env

# 버전 확인
rustc --version  # rustc 1.91.0
cargo --version
```

### 4. Python/uv 설치

```bash
# uv 설치 (Python 패키지 관리자)
curl -LsSf https://astral.sh/uv/install.sh | sh
source $HOME/.bashrc

# 버전 확인
uv --version  # 0.9.7
python3 --version  # Python 3.12.3
```

---

## 📦 프로젝트 환경 복원

### 1. 프로젝트 클론

```bash
# 프로젝트 디렉토리로 이동 (Windows 파일 시스템)
cd /mnt/d/cursor/openmanager-vibe-v5

# 또는 WSL 파일 시스템에 새로 클론 (권장 - 10배 빠름)
cd ~
git clone https://github.com/skyasu2/openmanager-vibe-v5.git
cd openmanager-vibe-v5
```

### 2. 프로젝트 의존성 설치

```bash
# Node.js 버전 확인
node --version  # v22.21.1

# npm 패키지 설치
npm install

# 설치 확인
npm list --depth=0
```

### 3. 환경 변수 설정

```bash
# .env.local 파일 생성 (비밀 값은 별도 관리)
cp .env.example .env.local

# 필수 환경 변수 확인
npm run env:check
```

---

## ✅ 검증 및 테스트

### 1. 시스템 정보 확인

```bash
# WSL 버전 정보
lsb_release -a
# Ubuntu 24.04.1 LTS

# 커널 버전
uname -r
# 6.6.87.2-microsoft-standard-WSL2

# 메모리 및 CPU
free -h
lscpu
```

### 2. 개발 도구 버전 확인

```bash
# Node.js 및 npm
node --version   # v22.21.1
npm --version    # v11.6.2

# Rust
rustc --version  # rustc 1.91.0

# Python/uv
python3 --version  # Python 3.12.3
uv --version       # uv 0.9.7

# Git
git --version
```

### 3. 글로벌 패키지 확인

```bash
# npm 글로벌 패키지 (6개)
npm list -g --depth=0

# 예상 출력:
# ├── @anthropic-ai/claude-code@latest
# ├── @google/gemini-cli@latest
# ├── @openai/codex@latest
# ├── @qwen-code/qwen-code@latest
# ├── n@latest
# └── vercel@latest
```

### 4. 프로젝트 빌드 테스트

```bash
# 타입 체크
npm run type-check

# 빠른 테스트
npm run test:super-fast

# 빌드 테스트
npm run build

# 개발 서버 시작
npm run dev
```

### 5. MCP 서버 연결 확인

```bash
# MCP 헬스 체크
./scripts/mcp/mcp-health-check.sh

# Claude Code에서 MCP 목록 확인
claude mcp list
```

---

## 🔧 트러블슈팅

### 문제 1: npm install 실패

**증상**: `npm install` 시 네트워크 또는 권한 오류

**해결책**:

```bash
# npm 캐시 정리
npm cache clean --force

# 권한 문제 해결
sudo chown -R $(whoami) ~/.npm
sudo chown -R $(whoami) ~/.npm-global

# 재시도
npm install
```

### 문제 2: WSL 네트워크 문제

**증상**: `npm install` 또는 `git clone` 시 연결 오류

**해결책**:

```bash
# .wslconfig에 DNS 설정 추가 (Windows 측)
# [wsl2]
# dnsTunneling=true
# autoProxy=true

# WSL 재시작
# (PowerShell에서) wsl --shutdown
# (PowerShell에서) wsl
```

### 문제 3: Node.js 버전 불일치

**증상**: `node --version`이 다른 버전 표시

**해결책**:

```bash
# nvm으로 올바른 버전 설치
nvm install 22.21.1
nvm use 22.21.1
nvm alias default 22.21.1

# .bashrc에 자동 활성화 추가
echo 'nvm use default' >> ~/.bashrc
source ~/.bashrc
```

---

## 📚 자동화 스크립트

### 패키지 스냅샷 생성 스크립트

```bash
# scripts/environment/create-wsl-snapshot.sh
chmod +x scripts/environment/create-wsl-snapshot.sh
./scripts/environment/create-wsl-snapshot.sh
```

### 복원 자동화 스크립트 (준비 중)

```bash
# 향후 구현 예정: scripts/environment/restore-from-snapshot.sh
# 스냅샷으로부터 자동으로 모든 패키지 복원
```

---

## 💡 베스트 프랙티스

1. **정기적인 스냅샷 생성**
   - 주요 변경 전 스냅샷 생성 (월 1회 권장)
   - Windows 파일 시스템에 백업 복사

2. **WSL 파일 시스템 사용**
   - 새 프로젝트는 `/home/` 아래 위치 (10배 빠름)
   - 기존 프로젝트는 `/mnt/d/` 유지 (호환성)

3. **환경 변수 관리**
   - `.env.local`은 Git 제외 (비밀 값)
   - 별도 안전한 곳에 백업

---

## 📖 관련 문서

- [WSL 최적화 가이드](./wsl-optimization.md)
- [MCP 설정 가이드](../../development/mcp/setup-guide.md)
- [프로젝트 환경 설정](../../../CLAUDE.md)

---

**마지막 업데이트**: 2025-12-19
**작성자**: Claude Code
**버전**: 1.1.1

---

**💡 중요**: WSL 재설치는 모든 데이터를 삭제하므로, 백업을 철저히 하고 신중하게 진행하세요!
