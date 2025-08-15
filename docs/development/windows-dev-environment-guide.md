# Windows 11 개발 환경 최적화 가이드

> 🪟 **Windows 11 Pro 환경에서 OpenManager VIBE v5 개발을 위한 전용 최적화 가이드**

## 📋 목차

1. [환경 개요](#환경-개요)
2. [리소스 최적화](#리소스-최적화)
3. [개발 서버 관리](#개발-서버-관리)
4. [PowerShell 스크립트 활용](#powershell-스크립트-활용)
5. [성능 모니터링](#성능-모니터링)
6. [문제 해결](#문제-해결)

## 🎯 환경 개요

### 현재 개발 환경

- **OS**: Windows 11 Pro (22H2)
- **Shell**: PowerShell 7.x + Git Bash
- **터미널**: Windows Terminal (멀티탭 지원)
- **Node.js**: v22.18.0 (nvm-windows)
- **Package Manager**: npm v10.9.3
- **IDE**: Claude Code (주) + VS Code (보조)

### 시스템 요구사항

- **메모리**: 8GB+ 권장 (Node.js + AI 모델)
- **디스크**: SSD 권장 (빠른 I/O)
- **네트워크**: 안정적인 인터넷 (AI API 호출)

## ⚡ 리소스 최적화

### 메모리 사용량 최적화

#### 현재 문제점

- **Node.js 프로세스**: 29개 과다 실행
- **메모리 사용량**: ~1.5GB (Node.js만)
- **대형 프로세스**: 263MB, 201MB 등 비효율적 사용

#### 최적화 방법

**1. 메모리 할당량 조정**

```json
// package.json 최적화
{
  "dev": "NODE_OPTIONS='--max-old-space-size=6144' next dev", // 8GB → 6GB
  "dev:optimized": "NODE_OPTIONS='--max-old-space-size=4096 --optimize-for-size' next dev" // 경량화 버전
}
```

**2. 프로세스 정리 자동화**

```powershell
# 비활성 Node.js 프로세스 정리
npm run env:clean
```

**3. 환경 변수 최적화**

```powershell
$env:NODE_OPTIONS = "--max-old-space-size=4096 --optimize-for-size"
$env:NEXT_TELEMETRY_DISABLED = "1"  # 텔레메트리 비활성화
$env:NODE_ENV = "development"
```

### CPU 사용량 최적화

**1. Turbo 모드 활용**

```bash
# Turbopack 사용 (70% 빌드 속도 향상)
npm run dev:turbo
```

**2. 병렬 작업 제한**

```javascript
// 동시 실행 작업 수 제한
const maxConcurrency = Math.max(1, os.cpus().length - 2);
```

## 🚀 개발 서버 관리

### 빠른 시작 스크립트

**1. 원클릭 시작**

```powershell
# 빠른 시작 (개발 서버만)
npm run dev:fast

# 전체 환경 (모든 도구)
npm run dev:full

# 정리 후 시작
npm run dev:start
```

**2. 수동 Windows Terminal 레이아웃**

```powershell
# tmux 스타일 멀티탭 환경
.\scripts\tmux-alternative.ps1

# 커스텀 세션 생성
.\scripts\tmux-alternative.ps1 -SessionName "my-dev"
```

### 개발 서버 구성

**탭 1: 개발 서버**

```powershell
npm run dev:turbo  # 🚀 Next.js Turbo 모드
```

**탭 2: 테스트 환경**

```powershell
npm run test:watch  # 🧪 Vitest 워치 모드
```

**탭 3: 타입 체크**

```powershell
npm run type-check -- --watch  # 🔷 TypeScript 실시간 체크
```

**탭 4: 린트 체크**

```powershell
npm run lint:quick -- --watch  # 🔍 ESLint 워치 모드
```

**탭 5: 리소스 모니터**

```powershell
npm run env:monitor  # 📊 실시간 리소스 모니터링
```

## 🛠️ PowerShell 스크립트 활용

### 주요 스크립트

#### 1. 개발 환경 최적화 (`dev-env-optimizer.ps1`)

```powershell
# 전체 최적화
.\scripts\dev-env-optimizer.ps1 -All

# 프로세스 정리만
.\scripts\dev-env-optimizer.ps1 -CleanupProcesses

# 메모리 최적화만
.\scripts\dev-env-optimizer.ps1 -OptimizeMemory

# 최적화된 서버 시작
.\scripts\dev-env-optimizer.ps1 -StartOptimized

# 실시간 모니터링
.\scripts\dev-env-optimizer.ps1 -Monitor
```

#### 2. tmux 대안 (`tmux-alternative.ps1`)

```powershell
# 기본 개발 레이아웃 생성
.\scripts\tmux-alternative.ps1

# 환경 정리
.\scripts\tmux-alternative.ps1 -Clean

# 리소스 모니터링
.\scripts\tmux-alternative.ps1 -Monitor
```

#### 3. 빠른 시작 (`quick-dev-start.ps1`)

```powershell
# 빠른 모드
.\scripts\quick-dev-start.ps1 -Fast

# 전체 모드
.\scripts\quick-dev-start.ps1 -Full

# 정리 후 시작
.\scripts\quick-dev-start.ps1 -Clean -Fast

# 모니터링만
.\scripts\quick-dev-start.ps1 -Monitor
```

### npm 명령어로 간편 실행

```bash
# 환경 최적화
npm run env:optimize

# 프로세스 정리
npm run env:clean

# 리소스 모니터링
npm run env:monitor

# 빠른 개발 시작
npm run dev:fast

# 전체 개발 환경
npm run dev:full
```

## 📊 성능 모니터링

### 실시간 리소스 모니터링

**모니터링 화면 구성**

```
🔍 OpenManager VIBE v5 - 리소스 모니터 (2025-08-14 15:30:45)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🟢 Node.js 프로세스: 5개 (총 메모리: 456.2MB)
  📊 PID 12345: 156.3MB (CPU: 45.2s)
  📊 PID 23456: 123.8MB (CPU: 23.1s)
  📊 PID 34567: 98.4MB (CPU: 12.5s)

🌐 개발 서버 포트 상태:
  ✅ :3000 - 활성 (Next.js 개발 서버)
  ⚪ :3001 - 비활성
  ⚪ :3002 - 비활성
  ✅ :5432 - 활성 (PostgreSQL)

💾 사용 가능 메모리: 3,456MB
🔷 TypeScript 컴파일러 실행 중

⏹️ Ctrl+C를 눌러 모니터링 종료
```

### 성능 지표 추적

**주요 메트릭**

- **Node.js 프로세스 수**: 5개 이하 권장
- **총 메모리 사용량**: 500MB 이하 권장
- **개발 서버 응답 시간**: 152ms 목표
- **빌드 시간**: 20초 이하

**알림 기준**

- **메모리 경고**: 70% 이상 사용
- **메모리 위험**: 85% 이상 사용
- **CPU 경고**: 60% 이상 사용
- **CPU 위험**: 80% 이상 사용

## 🔧 문제 해결

### 자주 발생하는 문제

#### 1. 메모리 부족 오류

**증상**: "JavaScript heap out of memory"

```powershell
# 해결 방법
npm run env:clean        # 프로세스 정리
npm run env:optimize     # 전체 최적화
npm run dev:optimized    # 경량화 모드로 시작
```

#### 2. 포트 충돌

**증상**: "EADDRINUSE: address already in use"

```powershell
# 포트 사용 프로세스 확인
netstat -ano | findstr :3000

# 프로세스 강제 종료
taskkill /PID [PID번호] /F

# 또는 자동 정리
npm run env:clean
```

#### 3. Node.js 프로세스 과다 실행

**증상**: 29개 이상의 node.exe 프로세스

```powershell
# 자동 정리
npm run env:clean

# 수동 확인
tasklist | findstr "node.exe"

# 강제 정리 (주의)
taskkill /IM node.exe /F
```

#### 4. Windows Terminal 실행 실패

**증상**: wt 명령어 인식 불가

```powershell
# Windows Terminal 설치 확인
Get-Command wt -ErrorAction SilentlyContinue

# 대안: 개별 PowerShell 창 사용
Start-Process pwsh -ArgumentList "-NoExit", "-Command", "npm run dev"
```

### 성능 최적화 체크리스트

- [ ] Node.js 프로세스 5개 이하
- [ ] 총 메모리 사용량 500MB 이하
- [ ] 불필요한 프로세스 정리
- [ ] Turbo 모드 활성화
- [ ] 텔레메트리 비활성화
- [ ] 환경 변수 최적화
- [ ] SSD 사용 확인
- [ ] 백그라운드 앱 최소화

### 일일 점검 루틴

**아침 시작 시**

```powershell
# 1. 환경 정리
npm run env:clean

# 2. 최적화된 개발 시작
npm run dev:fast

# 3. 상태 확인
npm run env:monitor
```

**작업 종료 시**

```powershell
# 전체 프로세스 정리
npm run env:clean

# Git 상태 확인
npm run git:status
```

## 📚 추가 리소스

### 관련 문서

- [CLAUDE.md](../../CLAUDE.md) - 전체 프로젝트 가이드
- [MCP 설정 가이드](../MCP-SETUP-GUIDE.md) - MCP 서버 구성
- [성능 최적화 가이드](../../docs/performance/) - 상세 성능 최적화

### 유용한 도구

- **Windows Terminal**: 멀티탭 터미널
- **PowerShell 7**: 크로스 플랫폼 호환성
- **Git Bash**: Unix 명령어 호환
- **Process Monitor**: 프로세스 상세 모니터링
- **Resource Monitor**: 시스템 리소스 분석

## 🎯 최적화 효과

**적용 전**

- Node.js 프로세스: 29개
- 메모리 사용량: 1.5GB+
- 개발 서버 시작: 수동 관리

**적용 후**

- Node.js 프로세스: 5개 이하
- 메모리 사용량: 500MB 이하
- 개발 서버 시작: 원클릭 자동화
- 리소스 모니터링: 실시간 추적

---

💡 **핵심 포인트**: Windows 11의 강력한 멀티태스킹 환경을 활용하되, 리소스를 효율적으로 관리하여 최적의 개발 경험을 제공합니다.
