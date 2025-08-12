# WSL 경로 최적화 가이드

📅 **작성일**: 2025년 08월 12일  
🎯 **목적**: WSL 환경에서 파일 시스템 성능 30-50배 향상

## 🚨 핵심 문제: WSL 파일 시스템 성능

### 성능 비교 (Microsoft 공식 문서 기반)

| 파일 위치 | 상대 성능 | npm install 속도 | 빌드 속도 |
|----------|----------|----------------|----------|
| WSL 네이티브 (`~/projects/`) | **100%** ⚡ | 30초 | 15초 |
| Windows 경로 (`/mnt/c/`) | **2-3%** 🐌 | 15-20분 | 8-10분 |
| Windows 경로 (`/mnt/d/`) | **2-3%** 🐌 | 15-20분 | 8-10분 |

**결론**: `/mnt/` 경로는 WSL 네이티브보다 **30-50배 느림**

## 🔧 즉시 적용 가능한 최적화

### 1. 프로젝트 위치 이전 (가장 효과적)

```bash
# ❌ 잘못된 위치 (Windows 파일 시스템)
/mnt/c/projects/myapp
/mnt/d/cursor/openmanager-vibe-v5

# ✅ 올바른 위치 (WSL 파일 시스템)
~/projects/openmanager-vibe-v5
/home/username/projects/openmanager-vibe-v5
```

#### 프로젝트 이전 스크립트

```bash
#!/bin/bash
# migrate-to-wsl.sh

# 1. WSL 홈에 프로젝트 디렉토리 생성
mkdir -p ~/projects

# 2. 현재 프로젝트 복사 (git 히스토리 유지)
cd /mnt/d/cursor/openmanager-vibe-v5
git clone . ~/projects/openmanager-vibe-v5

# 3. 새 위치로 이동
cd ~/projects/openmanager-vibe-v5

# 4. 의존성 재설치 (30초 vs 15분)
rm -rf node_modules package-lock.json
npm install

# 5. 성능 테스트
time npm run build
```

### 2. Node.js 최적화

```bash
# Node.js 버전 확인 (Linux 네이티브여야 함)
which node
# ✅ 올바른 경로: /usr/bin/node 또는 ~/.nvm/versions/node/...
# ❌ 잘못된 경로: /mnt/c/Program Files/nodejs/node

# nvm으로 Linux 네이티브 Node.js 설치
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 22.15.1
nvm use 22.15.1
```

### 3. WSL2 성능 튜닝

#### ~/.wslconfig 파일 생성 (Windows 측)

```ini
# C:\Users\<username>\.wslconfig
[wsl2]
memory=8GB              # RAM 할당 (시스템 RAM의 50%)
processors=4            # CPU 코어 할당
swap=2GB               # 스왑 파일 크기
localhostForwarding=true

# Windows 11 22H2+ 전용
networkingMode=mirrored  # 네트워크 성능 향상
dnsTunneling=true       # DNS 성능 개선
firewall=false          # 개발 환경용
autoProxy=true
```

#### WSL 재시작

```bash
# PowerShell (관리자 권한)
wsl --shutdown
wsl
```

### 4. VS Code/Cursor 최적화

```json
// .vscode/settings.json
{
  "remote.WSL.fileWatcher.polling": false,
  "files.watcherExclude": {
    "**/node_modules/**": true,
    "**/.git/**": true,
    "**/dist/**": true,
    "**/build/**": true,
    "**/.next/**": true
  },
  "search.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/build": true,
    "**/.next": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "remote.autoForwardPorts": false
}
```

## 📊 성능 벤치마크

### 테스트 스크립트

```bash
#!/bin/bash
# benchmark.sh

echo "🔍 WSL 파일 시스템 성능 테스트"
echo "================================"

# 1. 파일 생성 테스트
echo -n "1000개 파일 생성: "
time (for i in {1..1000}; do touch test_$i.txt; done && rm test_*.txt) 2>&1 | grep real

# 2. npm 패키지 설치 테스트
echo -n "npm install (캐시 없음): "
rm -rf node_modules package-lock.json
time npm install --silent 2>&1 | grep real

# 3. TypeScript 빌드 테스트
echo -n "TypeScript 컴파일: "
time npm run build 2>&1 | grep real

# 4. Git 작업 테스트
echo -n "Git status: "
time git status 2>&1 | grep real
```

### 예상 결과

| 작업 | /mnt/d/ (현재) | ~/projects/ (최적화) | 개선율 |
|-----|---------------|-------------------|--------|
| 1000개 파일 생성 | 45초 | 1.5초 | **30x** |
| npm install | 15분 | 30초 | **30x** |
| TypeScript 빌드 | 8분 | 15초 | **32x** |
| Git status | 12초 | 0.3초 | **40x** |

## 🚀 단계별 마이그레이션 가이드

### Phase 1: 즉시 적용 (5분)

```bash
# 1. WSL 설정 최적화
cat > ~/.wslconfig << EOF
[wsl2]
memory=8GB
processors=4
EOF

# 2. Node.js 환경 변수
echo 'export NODE_OPTIONS="--max-old-space-size=8192"' >> ~/.bashrc
source ~/.bashrc
```

### Phase 2: 프로젝트 이전 (30분)

```bash
# 1. 백업
tar -czf ~/backup-$(date +%Y%m%d).tar.gz /mnt/d/cursor/openmanager-vibe-v5

# 2. 새 위치로 복사
cp -r /mnt/d/cursor/openmanager-vibe-v5 ~/projects/

# 3. Git 원격 저장소 확인
cd ~/projects/openmanager-vibe-v5
git remote -v

# 4. 의존성 재설치
rm -rf node_modules package-lock.json
npm install
```

### Phase 3: 개발 환경 검증 (10분)

```bash
# 1. 빌드 테스트
npm run build

# 2. 개발 서버 테스트
npm run dev

# 3. 테스트 실행
npm test

# 4. Git 작업 테스트
git status
git diff
```

## 🛠️ 문제 해결

### 문제 1: 권한 오류

```bash
# 파일 권한 재설정
chmod -R 755 ~/projects/openmanager-vibe-v5
chmod -R 644 ~/projects/openmanager-vibe-v5/**/*.{js,ts,tsx,json,md}
```

### 문제 2: Windows 도구 연동

```bash
# Windows 경로 심볼릭 링크 (선택적)
ln -s ~/projects/openmanager-vibe-v5 /mnt/c/Users/$(whoami)/Desktop/project-link
```

### 문제 3: Docker 성능

```json
// docker-compose.yml
version: '3.8'
services:
  app:
    volumes:
      # ❌ 느림
      # - /mnt/d/project:/app
      
      # ✅ 빠름
      - ~/projects/openmanager-vibe-v5:/app
```

## 📈 성능 모니터링

### 실시간 I/O 모니터링

```bash
# I/O 통계 확인
iostat -x 1

# 파일 시스템 활동 모니터링
dstat -d --disk-util

# 프로세스별 I/O 확인
iotop
```

### 성능 로그 수집

```bash
#!/bin/bash
# collect-metrics.sh

LOG_FILE=~/wsl-performance-$(date +%Y%m%d).log

echo "WSL Performance Metrics - $(date)" >> $LOG_FILE
echo "===================================" >> $LOG_FILE

# 현재 경로
echo "Current Path: $(pwd)" >> $LOG_FILE

# npm 빌드 시간
echo -n "Build Time: " >> $LOG_FILE
{ time npm run build; } 2>&1 | grep real >> $LOG_FILE

# 파일 시스템 타입
echo "Filesystem: $(df -T . | tail -1 | awk '{print $2}')" >> $LOG_FILE

# 메모리 사용량
echo "Memory: $(free -h | grep Mem | awk '{print $3"/"$2}')" >> $LOG_FILE
```

## ✅ 체크리스트

- [ ] WSL2 최신 버전 확인 (`wsl --version`)
- [ ] 프로젝트를 WSL 파일 시스템으로 이전
- [ ] Linux 네이티브 Node.js 설치
- [ ] `.wslconfig` 파일 생성 및 최적화
- [ ] VS Code/Cursor WSL 확장 설치
- [ ] 파일 감시자 제외 설정
- [ ] 성능 벤치마크 실행
- [ ] Git 설정 확인

## 🎯 예상 효과

### 개발 생산성 향상

| 작업 | 이전 | 이후 | 일일 절약 시간 |
|-----|-----|-----|--------------|
| npm install | 15분 x 3회 | 30초 x 3회 | **43.5분** |
| 빌드 | 8분 x 10회 | 15초 x 10회 | **77.5분** |
| 테스트 | 5분 x 5회 | 10초 x 5회 | **24분** |
| **총 절약** | | | **145분/일** |

**연간 절약**: 145분 x 250일 = **604시간** (75.5 근무일)

## 🔗 참고 자료

- [Microsoft WSL 성능 가이드](https://learn.microsoft.com/en-us/windows/wsl/compare-versions)
- [WSL2 파일 시스템 성능](https://learn.microsoft.com/en-us/windows/wsl/filesystems)
- [Node.js on WSL](https://learn.microsoft.com/en-us/windows/dev-environment/javascript/nodejs-on-wsl)
- [VS Code WSL 개발](https://code.visualstudio.com/docs/remote/wsl)

---

💡 **핵심 원칙**: WSL 네이티브 파일 시스템 사용으로 **30-50배 성능 향상**