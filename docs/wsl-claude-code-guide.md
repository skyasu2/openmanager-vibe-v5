# 🚀 WSL + Claude Code 개발 환경 최적화 가이드

## 📋 목차

1. [초기 설정](#초기-설정)
2. [tmux 개발 환경](#tmux-개발-환경)
3. [성능 최적화](#성능-최적화)
4. [일상 워크플로우](#일상-워크플로우)
5. [문제 해결](#문제-해결)
6. [명령어 참조](#명령어-참조)

## 🎯 초기 설정

### 1. WSL 메모리 설정

Windows 사용자 홈 디렉토리(`C:\Users\사용자명`)에 `.wslconfig` 파일 생성:

```ini
[wsl2]
memory=8GB    # WSL2에 할당할 메모리
processors=4  # 할당할 프로세서 개수
swap=4GB      # 스왑 파일 크기
localhostForwarding=true
```

설정 후 PowerShell에서:
```powershell
wsl --shutdown
```

### 2. Claude Code 별칭 설정

```bash
# 별칭 설정 스크립트 실행
./scripts/setup-claude-aliases.sh

# 별칭 활성화
source ~/.bashrc

# 사용 가능한 명령어 확인
cchelp
```

### 3. tmux 설정 적용

```bash
# tmux 설정 파일 복사
cp .tmux.conf ~/.tmux.conf

# tmux 재시작
tmux kill-server
```

## 🏥 환경 건강 체크

### 건강 체크 실행

```bash
# 전체 환경 건강 체크
cchealth
```

건강 체크 항목:
- WSL 환경 확인
- Node.js 및 npm 버전
- Git 설정 상태
- 프로젝트 파일 검증
- 시스템 리소스 사용량
- 포트 상태 확인

### 메모리 정리

```bash
# 메모리 부족 시 정리
ccclean
```

정리 대상:
- Node.js 프로세스 (개발 서버 제외)
- npm 캐시
- 시스템 페이지 캐시
- Next.js 빌드 캐시 (선택적)

## 🖥️ tmux 개발 환경

### 빠른 시작

```bash
# Claude Code 통합 개발 환경 시작
ccdev

# 또는 tmux만 시작
cctmux
```

### tmux 레이아웃

```
┌─────────────────┬─────────────────┐
│                 │                 │
│   개발 서버     │   시스템 모니터  │
│  (npm run dev)  │    (htop)       │
│                 │                 │
├─────────────────┼─────────────────┤
│                 │                 │
│   로그/테스트   │   작업 공간     │
│                 │                 │
└─────────────────┴─────────────────┘
```

### tmux 단축키

- **창 전환**: `Ctrl+b` + 숫자 (0-3)
- **창 분할**: 
  - 수평: `Ctrl+b` + `"`
  - 수직: `Ctrl+b` + `%`
- **창 이동**: `Ctrl+b` + 화살표
- **세션 분리**: `Ctrl+b` + `d`
- **세션 재연결**: `tmux attach`

## ⚡ 성능 최적화

### 1. Node.js 메모리 설정

`.bashrc`에 추가:
```bash
export NODE_OPTIONS="--max-old-space-size=4096"
```

### 2. WSL 파일 시스템 성능

**권장사항**:
- 프로젝트는 Windows 드라이브(`/mnt/d/`)에 유지
- 빌드 캐시는 WSL 네이티브 경로 사용
- `node_modules`는 Windows Defender 제외 추가

### 3. 성능 모니터링

```bash
# WSL 성능 모니터 실행
ccperf

# 주요 지표:
# - CPU 사용률 < 80%
# - 메모리 사용률 < 80%
# - 디스크 여유 공간 > 10GB
```

## 📅 일상 워크플로우

### 아침 시작

```bash
# 1. 개발 환경 시작
ccdev

# 2. Git 상태 확인
ccgit

# 3. 최신 변경사항 pull
git pull origin main

# 4. 의존성 업데이트 확인
npm outdated
```

### 개발 중

```bash
# 빠른 검증 (테스트 + 타입 + 린트)
ccquick

# 특정 파일 테스트
cctest  # 옵션 5 선택

# ESLint 자동 수정
ccfix
```

### 커밋 전

```bash
# 전체 검증
npm run validate:all

# 또는 빠른 검증
ccquick
```

### 하루 마무리

```bash
# 상태 확인
ccstatus

# tmux 세션 분리 (종료하지 않음)
Ctrl+b d
```

## 🔧 문제 해결

### Bus error (메모리 부족)

```bash
# 1. 불필요한 프로세스 종료
pkill node

# 2. npm 캐시 정리
npm cache clean --force

# 3. WSL 재시작
wsl --shutdown  # PowerShell에서
```

### 개발 서버가 시작되지 않음

```bash
# 포트 3000 사용 프로세스 확인
lsof -i :3000

# 프로세스 종료
kill -9 [PID]

# 서버 재시작
ccrestart
```

### tmux 세션 문제

```bash
# 모든 tmux 세션 확인
tmux ls

# 문제 세션 종료
tmux kill-session -t openmanager-dev

# 새로 시작
cctmux
```

## 📌 명령어 참조

### Claude Code 별칭

| 명령어 | 설명 |
|--------|------|
| `ccdev` | 통합 개발 환경 시작 |
| `cctmux` | tmux 개발 세션 시작 |
| `cctest` | tmux에서 테스트 실행 |
| `ccperf` | WSL 성능 모니터 |
| `cclog` | Next.js 추적 로그 |
| `ccrestart` | 개발 서버 재시작 |
| `ccquick` | 빠른 검증 (테스트+타입+린트) |
| `ccfix` | ESLint 자동 수정 |
| `ccbuild` | 프로덕션 빌드 |
| `ccgit` | Git 상태 확인 |
| `cchealth` | 개발 환경 건강 체크 |
| `ccclean` | 메모리 정리 |
| `ccstatus` | 개발 환경 상태 |
| `cchelp` | 도움말 |
| `om` | 프로젝트 디렉토리로 이동 |

### 유용한 WSL 명령어

```bash
# WSL 버전 확인
wsl -l -v

# WSL 상태
wsl --status

# 메모리 사용량
free -h

# 디스크 사용량
df -h /mnt/d

# CPU 정보
lscpu
```

## 💡 프로 팁

1. **tmux 세션 유지**: 개발 서버는 tmux에서 실행하여 SSH 연결이 끊어져도 계속 실행
2. **병렬 작업**: tmux 창을 활용하여 개발/테스트/모니터링 동시 진행
3. **성능 모니터링**: `ccperf`를 별도 창에서 실행하여 실시간 모니터링
4. **Git 작업**: tmux workspace 창에서 Git 작업 수행
5. **로그 확인**: 별도 창에서 `cclog`로 실시간 로그 모니터링

## 🔗 관련 문서

- [Claude Code 프로젝트 가이드](../CLAUDE.md)
- [개발 환경 설정](../README.md)
- [테스트 시스템 가이드](./testing-system-guide.md)

---

최종 업데이트: 2025-08-05