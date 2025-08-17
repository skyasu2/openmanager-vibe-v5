# 🐧 WSL 개발 환경 최적화 가이드

> WSL 2 + Claude Code 완벽 최적화 설정

## 🎯 개요

Windows 11 + WSL 2 환경에서 OpenManager VIBE v5 개발을 위한 완전 최적화 가이드입니다.

## ⚙️ WSL 2 기본 설정

### 1. WSL 설정 파일 (.wslconfig)

```ini
# C:\Users\[username]\.wslconfig
[wsl2]
memory=10GB
processors=8
swap=8GB
localhostForwarding=true
nestedVirtualization=true
pageReporting=true
guiApplications=true
debugConsole=false
vmIdleTimeout=60000

[experimental]
autoMemoryReclaim=gradual
networkingMode=mirrored
dnsTunneling=true
firewall=true
autoProxy=true
```

### 2. Ubuntu 최적화 설정

```bash
# ~/.bashrc 설정
export NODE_ENV=development
export BROWSER=none
export TERM=xterm-256color

# 메모리 최적화
export NODE_OPTIONS="--max-old-space-size=4096"

# 성능 별칭
alias ll='ls -alF'
alias la='ls -A'
alias l='ls -CF'
alias aptup='sudo apt update && sudo apt upgrade'
alias npmig='npm install -g'
alias npmls='npm list -g --depth=0'

# Git 별칭
alias gs='git status'
alias ga='git add'
alias gc='git commit -m'
alias gp='git push'
alias gl='git log --oneline -10'
```

### 3. Systemd 활성화

```bash
# /etc/wsl.conf
[boot]
systemd=true

[user]
default=ubuntu

[interop]
enabled=true
appendWindowsPath=true

[network]
generateHosts=true
generateResolvConf=true
```

## 🚀 개발 도구 최적화

### 1. Node.js 환경 설정

```bash
# Node.js 22 설치 (WSL 내부)
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

# npm 글로벌 패키지 경로 설정
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc

# 필수 글로벌 패키지
npm install -g @anthropic-ai/claude-code
npm install -g @google/gemini-cli
npm install -g @qwen-code/qwen-code
npm install -g ccusage
npm install -g typescript
npm install -g @vercel/cli
```

### 2. Git 최적화 설정

```bash
# Git 설정
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
git config --global init.defaultBranch main
git config --global core.autocrlf false
git config --global core.eol lf

# Git 성능 최적화
git config --global core.preloadindex true
git config --global core.fscache true
git config --global gc.auto 256

# 한국어 커밋 메시지 지원
git config --global core.quotepath false
```

### 3. Claude Code 최적화

```bash
# Claude Code 설정 디렉토리
mkdir -p ~/.claude

# Statusline 설정
cat > ~/.claude/settings.json << 'EOF'
{
  "statusLine": {
    "type": "command",
    "command": "ccusage statusline",
    "padding": 0
  },
  "editor": {
    "wordWrap": "on",
    "fontSize": 14,
    "fontFamily": "Consolas, 'Courier New', monospace"
  },
  "terminal": {
    "shell": "/bin/bash"
  }
}
EOF
```

## 🔧 시스템 최적화

### 1. 메모리 관리

```bash
# 메모리 모니터링 스크립트
cat > ~/scripts/memory-check.sh << 'EOF'
#!/bin/bash
echo "=== WSL 메모리 사용량 ==="
free -h
echo ""
echo "=== 프로세스별 메모리 사용량 ==="
ps aux --sort=-%mem | head -10
echo ""
echo "=== Node.js 프로세스 ==="
ps aux | grep node
EOF

chmod +x ~/scripts/memory-check.sh

# 30분마다 메모리 체크
(crontab -l 2>/dev/null; echo "*/30 * * * * ~/scripts/memory-check.sh >> ~/logs/memory.log 2>&1") | crontab -
```

### 2. 파일 시스템 최적화

```bash
# 파일 시스템 캐시 최적화
echo 'vm.vfs_cache_pressure=50' | sudo tee -a /etc/sysctl.conf
echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf

# 파일 감시 한도 증가 (VS Code 등을 위해)
echo 'fs.inotify.max_user_watches=524288' | sudo tee -a /etc/sysctl.conf

# 변경사항 적용
sudo sysctl -p
```

### 3. 네트워크 최적화

```bash
# DNS 설정 최적화
sudo tee /etc/systemd/resolved.conf << 'EOF'
[Resolve]
DNS=8.8.8.8 1.1.1.1
FallbackDNS=8.8.4.4 1.0.0.1
Cache=yes
DNSSEC=no
DNSOverTLS=no
EOF

sudo systemctl restart systemd-resolved
```

## 🛠️ 개발 워크플로우 최적화

### 1. 프로젝트 설정

```bash
# 프로젝트 디렉토리로 이동
cd /mnt/d/cursor/openmanager-vibe-v5

# 빠른 개발 명령어 별칭
echo "alias dev='npm run dev'" >> ~/.bashrc
echo "alias build='npm run build'" >> ~/.bashrc
echo "alias test='npm run test:quick'" >> ~/.bashrc
echo "alias lint='npm run lint'" >> ~/.bashrc
echo "alias validate='npm run validate:all'" >> ~/.bashrc
```

### 2. 자동화 스크립트

```bash
# 개발 환경 시작 스크립트
cat > ~/scripts/dev-start.sh << 'EOF'
#!/bin/bash
cd /mnt/d/cursor/openmanager-vibe-v5

echo "🚀 OpenManager VIBE v5 개발 환경 시작..."

# 의존성 체크
if [ ! -d "node_modules" ]; then
  echo "📦 의존성 설치 중..."
  npm install
fi

# 환경 변수 체크
if [ ! -f ".env.local" ]; then
  echo "⚠️  .env.local 파일이 없습니다."
  echo "📋 .env.local.template를 복사하여 설정하세요."
fi

# 개발 서버 시작
echo "🏁 개발 서버 시작..."
npm run dev
EOF

chmod +x ~/scripts/dev-start.sh
```

### 3. VS Code 통합

```json
// .vscode/settings.json (WSL 전용)
{
  "terminal.integrated.defaultProfile.linux": "bash",
  "terminal.integrated.cwd": "/mnt/d/cursor/openmanager-vibe-v5",
  "files.watcherExclude": {
    "**/node_modules/**": true,
    "**/.git/objects/**": true,
    "**/.git/subtree-cache/**": true,
    "**/dist/**": true,
    "**/build/**": true
  },
  "search.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/build": true,
    "**/.next": true
  },
  "typescript.preferences.includePackageJsonAutoImports": "on",
  "eslint.workingDirectories": ["./"],
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

## 🔍 모니터링 및 디버깅

### 1. 성능 모니터링

```bash
# WSL 성능 모니터링 스크립트
cat > ~/scripts/wsl-monitor.sh << 'EOF'
#!/bin/bash
echo "=== WSL 시스템 상태 ==="
echo "현재 시간: $(date)"
echo "업타임: $(uptime)"
echo ""
echo "=== CPU 사용률 ==="
top -bn1 | grep "Cpu(s)" | sed "s/.*, *\\([0-9.]*\\)%* id.*/\\1/" | awk '{print 100 - $1"%"}'
echo ""
echo "=== 메모리 사용률 ==="
free | grep Mem | awk '{printf("사용률: %.2f%%\n", $3/$2 * 100.0)}'
echo ""
echo "=== 디스크 사용률 ==="
df -h / | tail -1 | awk '{print "사용률: " $5}'
echo ""
echo "=== 네트워크 연결 ==="
ss -tuln | wc -l | awk '{print "활성 연결: " $1 "개"}'
EOF

chmod +x ~/scripts/wsl-monitor.sh
```

### 2. 로그 관리

```bash
# 로그 디렉토리 생성
mkdir -p ~/logs

# 로그 로테이션 설정
cat > ~/scripts/log-rotate.sh << 'EOF'
#!/bin/bash
LOG_DIR="$HOME/logs"
KEEP_DAYS=7

find $LOG_DIR -name "*.log" -type f -mtime +$KEEP_DAYS -delete
find $LOG_DIR -name "*.log.*" -type f -mtime +$KEEP_DAYS -delete

echo "$(date): 로그 정리 완료" >> $LOG_DIR/cleanup.log
EOF

chmod +x ~/scripts/log-rotate.sh

# 매일 자정에 로그 정리
(crontab -l 2>/dev/null; echo "0 0 * * * ~/scripts/log-rotate.sh") | crontab -
```

## 🚨 문제 해결

### 1. 일반적인 문제들

```bash
# WSL 메모리 부족
# Windows PowerShell에서 실행:
# wsl --shutdown
# wsl

# 파일 권한 문제
sudo chown -R $USER:$USER /mnt/d/cursor/openmanager-vibe-v5
chmod -R 755 /mnt/d/cursor/openmanager-vibe-v5

# npm 권한 문제
sudo chown -R $USER:$USER ~/.npm-global
```

### 2. 성능 문제 진단

```bash
# CPU 사용률 높은 프로세스 확인
ps aux --sort=-%cpu | head -10

# 메모리 사용률 높은 프로세스 확인
ps aux --sort=-%mem | head -10

# 디스크 I/O 모니터링
iostat -x 1

# 네트워크 사용량 확인
nethogs
```

## 📚 관련 문서

### 개발 환경

- **[개발 가이드](./development-guide.md)**
- **[TypeScript 설정](./typescript-guide.md)**
- **[Git 워크플로우](./git-workflow.md)**

### 성능 최적화

- **[API 최적화](../performance/api-optimization-guide.md)**
- **[메모리 최적화](../performance/memory-optimization-guide.md)**

### 문제 해결

- **[문제 해결 가이드](../TROUBLESHOOTING.md)**

---

> **WSL 환경 문제가 있나요?** [문제 해결 가이드](../TROUBLESHOOTING.md#wsl-관련-문제)를 확인해주세요.
