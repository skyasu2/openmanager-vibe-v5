# WSL 2 개발 환경 설정

> Windows Subsystem for Linux 완전 가이드

## 개요

이 프로젝트는 **WSL 2 (Ubuntu)** 환경에서 개발하며, Windows 호스트의 브라우저로 접속합니다.

```
┌─────────────────────────────────────────────────────────┐
│  Windows (Host)                                         │
│  ┌──────────────────┐    ┌────────────────────────┐    │
│  │ IDE (Cursor,     │    │ 브라우저               │    │
│  │ VS Code)         │    │ http://localhost:3000  │    │
│  └────────┬─────────┘    └───────────┬────────────┘    │
│           │                          │                  │
│  ─────────┴──────────────────────────┴─────────────────│
│                    WSL2 네트워크 브릿지                  │
│  ─────────────────────────────────────────────────────  │
│  ┌─────────────────────────────────────────────────┐   │
│  │  WSL2 (Ubuntu)                                   │   │
│  │  ┌─────────────────────────────────────────┐    │   │
│  │  │  Next.js Dev Server (포트 3000)          │    │   │
│  │  │  + Claude Code CLI                       │    │   │
│  │  └─────────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

## WSL 2 설치

### 1. WSL 활성화

```powershell
# PowerShell (관리자)
wsl --install
wsl --set-default-version 2
```

### 2. Ubuntu 설치

```powershell
wsl --install -d Ubuntu-22.04
```

### 3. WSL 메모리 최적화

```bash
# Windows에서 .wslconfig 생성
cat > /mnt/c/Users/$USER/.wslconfig << 'EOF'
[wsl2]
memory=19GB
processors=8
swap=10GB
networkingMode=mirrored
dnsTunneling=true
autoProxy=true
EOF

# WSL 재시작
wsl --shutdown
```

## 개발 환경 설정

### Node.js (nvm 사용)

```bash
# nvm 설치
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
source ~/.bashrc

# Node.js 설치 (프로젝트 버전)
nvm install 22.21.1
nvm use 22.21.1
nvm alias default 22.21.1

# 확인
node -v  # v22.21.1
npm -v   # 10.9.2
```

### Git 설정

```bash
git config --global user.name "Your Name"
git config --global user.email "your@email.com"
git config --global core.autocrlf input
git config --global init.defaultBranch main
```

### SSH 키 (GitHub)

```bash
ssh-keygen -t ed25519 -C "your@email.com"
cat ~/.ssh/id_ed25519.pub
# GitHub Settings > SSH Keys에 추가
```

## 개발 서버 실행

### 필수: `dev:network` 사용

```bash
# WSL 터미널에서 실행
npm run dev:network
```

이 명령어는 `next dev -H 0.0.0.0`으로 외부 접속을 허용합니다.

### 접속 방법

| 방법 | URL | 용도 |
|------|-----|------|
| Localhost | `http://localhost:3000` | 일반 개발 |
| WSL IP | `http://[WSL-IP]:3000` | 모바일 테스트 |

### WSL IP 확인

```bash
hostname -I | awk '{print $1}'
```

## 주의사항

### PowerShell 직접 실행 금지

```powershell
# ❌ 하지 마세요
cd C:\path\to\project
npm run dev
```

이유:
- 경로 구분자 문제 (`\` vs `/`)
- 심볼릭 링크 미지원
- 파일 감시(watch) 성능 저하

### 파일 시스템 주의

```bash
# ✅ WSL 파일 시스템 사용 (빠름)
/home/user/projects/openmanager-vibe-v5

# ⚠️ Windows 마운트 (느림, 권한 문제)
/mnt/c/Users/user/projects/...
```

## 트러블슈팅

### 포트 충돌

```bash
# 포트 사용 확인
lsof -i :3000

# 프로세스 종료
kill -9 <PID>
```

### WSL 네트워크 문제

```bash
# DNS 재설정
sudo rm /etc/resolv.conf
sudo bash -c 'echo "nameserver 8.8.8.8" > /etc/resolv.conf'
sudo chattr +i /etc/resolv.conf
```

### 메모리 부족

```bash
# 캐시 정리
sudo sh -c 'echo 3 > /proc/sys/vm/drop_caches'

# npm 캐시 정리
npm cache clean --force
```

## 추천 IDE 설정

### VS Code / Cursor

1. "Remote - WSL" 확장 설치
2. WSL에서 `code .` 또는 `cursor .` 실행
3. 터미널은 WSL bash 사용

### 확장 프로그램 (필수)

- ESLint
- Prettier
- Tailwind CSS IntelliSense
- GitLens

## 관련 문서

- [개발 도구](./dev-tools.md)
- [프로젝트 설정](./project-setup.md)
- [Vibe Coding](../vibe-coding/README.md)
