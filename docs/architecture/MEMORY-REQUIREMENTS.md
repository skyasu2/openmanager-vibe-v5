# 메모리 사용 가이드 - 팀 협업 및 환경별 설정

**생성일**: 2025-08-24  
**기반**: 4-AI 교차검증 결과 (Claude 8.2/10, Gemini 6.2/10, Codex 6.0/10, Qwen 9.5/10)

## 🚨 중요 공지

**JavaScript heap out of memory 문제 해결을 위해 메모리 설정이 업데이트되었습니다.**

⚠️ **환경 불일치 방지**: 글로벌 NODE_OPTIONS 설정을 제거하고 스크립트별 설정으로 전환했습니다.

### 🧩 WSL 상위 리소스 정책 정렬 (2025-08-28)

WSL 전체 상한을 과도하게(24GB/전체 75%) 할당한 이전 구성에서 16GB(50%)로 축소하여 Windows 호스트 여유, 브라우저/IDE 반응성, 스왑 I/O를 개선합니다.

| 항목 | 이전 | 신규 권장 | 근거 |
|------|------|----------|------|
| memory | 24GB | 16GB | Node 힙 최대 8GB + DB/툴 여유 포함 16GB 현실적 상한 |
| processors | 16 | 12 | 호스트 스케줄링 여유 확보 (약 25% 예약) |
| swap | 8GB | 4GB | 과도한 스왑 회피, 관측 후 필요 시 상향 |
| nestedVirtualization | true | 제거 | 비공식/효과 미미, 잡음 제거 |
| vmIdleTimeout | 60000 | 제거 | 공식 키 아님 (적용 불확실) |

수동 반영 절차(자동 재시작 금지 요구 반영):

```powershell
# 모든 WSL 셸 닫은 뒤 수동 적용
wsl --shutdown
# 새 터미널에서 확인
free -h
nproc
```

관련 파일: `.wslconfig` (2025-08-28 개선 주석 포함)

## 📊 환경별 권장 메모리 설정

### 🎯 개발 환경 (WSL/Linux/macOS)

| 작업 유형 | 메모리 설정 | 명령어 | 권장 상황 |
|-----------|-------------|--------|-----------|
| **일반 개발** | 4GB | `npm run dev` | 대부분의 개발 작업 |
| **경량 개발** | 2GB | `npm run dev:light` | 리소스 절약 필요시 |
| **대용량 작업** | 8GB | `npm run dev:heavy` | AI 개발, 대규모 빌드 |

### 🏗️ 빌드 환경

| 환경 | 메모리 설정 | 명령어 | 용도 |
|------|-------------|--------|------|
| **기본 빌드** | 2GB | `npm run build` | 일반적인 프로덕션 빌드 |
| **개발 빌드** | 4GB | `npm run build:dev` | 개발용 빌드 (소스맵 포함) |
| **대용량 빌드** | 8GB | `npm run build:heavy` | 복잡한 최적화 작업 |
| **CI 환경** | 1.5GB | `npm run build:ci` | GitHub Actions 최적화 |
| **Vercel 빌드** | 1.5GB | 자동 적용 | Vercel 플랫폼 제한 |

### 💻 Claude Code 실행

| 용도 | 메모리 설정 | 명령어 | 권장 상황 |
|------|-------------|--------|-----------|
| **일반 사용** | 4GB | `claude-dev` | 표준 AI 개발 작업 |
| **경량 사용** | 2GB | `claude-light` | 간단한 질문, 리소스 절약 |
| **집중 작업** | 8GB | `claude-heavy` | 복잡한 코딩, 대화형 개발 |
| **스크립트** | 가변 | `claude-memory` | 자동 메모리 설정 |

## 🔍 메모리 부족 증상 및 해결책

### ⚠️ 증상 체크리스트

- [ ] `JavaScript heap out of memory` 오류
- [ ] 빌드/개발 서버가 갑자기 중단됨  
- [ ] 시스템 전체 응답 속도 저하
- [ ] 빌드 시간이 평소보다 10배 이상 소요
- [ ] TypeScript 컴파일이 멈춤

### 🚀 즉시 해결 방법

```bash
# 1단계: 경량 모드로 시작
npm run dev:light        # 2GB로 시작

# 2단계: 표준 모드로 증가
npm run dev              # 4GB로 증가

# 3단계: 대용량 모드로 확장
npm run dev:heavy        # 8GB로 확장

# 4단계: Claude Code 메모리 안전 모드
claude-memory            # 스크립트 자동 설정
```

### 📊 메모리 사용량 모니터링

```bash
# 실시간 메모리 모니터링
npm run monitor:memory

# 개발 서버 + 메모리 추적
npm run monitor:memory:dev

# 빌드 + 메모리 추적  
npm run monitor:memory:build

# 연속 모니터링 (5초 간격)
node scripts/memory-monitor.js --watch
```

## 👥 팀 협업 가이드라인

### 🔄 새로운 팀원 온보딩

1. **필수 설정 확인**

    ```bash
   # ~/.bashrc 확인 (글로벌 NODE_OPTIONS 없어야 함)
   grep NODE_OPTIONS ~/.bashrc
   
   # 별칭 설정 확인
   alias | grep claude
   ```

2. **첫 번째 실행 테스트**

    ```bash
   # 메모리 모니터링과 함께 개발 서버 시작
   npm run monitor:memory:dev
   ```

### 💡 Code Review 체크리스트

- [ ] 메모리 집약적 코드에 대한 주석 추가
- [ ] 대용량 배열/객체 생성 시 정당성 검토
- [ ] 메모리 누수 가능성 있는 패턴 확인 (이벤트 리스너, 타이머 등)
- [ ] 프로덕션 환경 메모리 제한 고려

### 🚨 환경별 주의사항

#### WSL 사용자

```bash
# WSL 메모리 상태 확인
free -h

# WSL 메모리 부족 시 Windows 설정 조정 필요
# .wslconfig 파일에서 memory 설정 확인
```

#### macOS 사용자  

```bash
# 시스템 메모리 확인
vm_stat

# Docker 사용시 메모리 제한 확인
docker stats
```

#### Windows 사용자

```powershell
# 시스템 메모리 확인
Get-WmiObject -Class Win32_OperatingSystem | Select-Object TotalVisibleMemorySize,FreePhysicalMemory
```

## 📈 성능 최적화 전략

### 🎯 Qwen AI 수학적 모델 기반 최적화

#### V8 힙 크기 최적화 공식

```text
최적 힙 크기 = (현재 사용량 × 1.5) 반올림 512MB 단위
안전 범위 = 1024MB ~ 8192MB
```

#### 환경별 효율성 매트릭스

| 환경 | 권장 힙 | 효율성 | 안정성 | 비용 |
|------|---------|--------|--------|------|
| **로컬 개발** | 4GB | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **CI/CD** | 1.5GB | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **프로덕션** | 1.5GB | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

### 🔧 자동 메모리 최적화

#### 동적 메모리 할당 스크립트

```bash
#!/bin/bash
# scripts/auto-memory.sh
AVAILABLE_MEMORY=$(free -m | awk 'NR==2{printf "%.0f", $7}')

if [ "$AVAILABLE_MEMORY" -gt 16000 ]; then
    export NODE_OPTIONS="--max-old-space-size=8192"
elif [ "$AVAILABLE_MEMORY" -gt 8000 ]; then
    export NODE_OPTIONS="--max-old-space-size=4096"
else
    export NODE_OPTIONS="--max-old-space-size=2048"
fi

echo "자동 설정: NODE_OPTIONS=$NODE_OPTIONS (여유 메모리: ${AVAILABLE_MEMORY}MB)"
```

## 🎯 문제 해결 플레이북

### 🚨 Emergency: 메모리 부족으로 작업 중단

```bash
# 1. 즉시 경량 모드로 전환
pkill -f "next dev" || pkill -f "node"
npm run dev:light

# 2. 메모리 상태 확인
npm run monitor:memory

# 3. 시스템 메모리 정리
# Linux/WSL
sudo sh -c 'echo 3 > /proc/sys/vm/drop_caches'

# 4. 안전 모드로 Claude 재시작
claude-light
```

### 📊 성능 분석

```bash
# GC 패턴 분석
NODE_OPTIONS="--trace-gc --max-old-space-size=4096" npm run build

# 힙 스냅샷 생성
NODE_OPTIONS="--inspect --max-old-space-size=4096" npm run dev
# Chrome DevTools에서 Memory 탭 → Heap Snapshot
```

## 📋 빠른 참조

### 명령어 치트시트

```bash
# 개발
npm run dev              # 4GB (표준)
npm run dev:light        # 2GB (경량)  
npm run dev:heavy        # 8GB (대용량)

# 빌드
npm run build            # 2GB (표준)
npm run build:dev        # 4GB (개발용)
npm run build:ci         # 1.5GB (CI)

# Claude Code  
claude-dev               # 4GB (표준)
claude-light             # 2GB (경량)
claude-heavy             # 8GB (대용량)

# 모니터링
npm run monitor:memory   # 현재 상태
node scripts/memory-monitor.js --watch  # 연속 모니터링
```

### 환경변수 설정

```bash
# .env.local (프로젝트별 설정)
NODE_MAX_MEMORY=4096

# 임시 설정 (현재 세션만)
export NODE_OPTIONS="--max-old-space-size=4096"
```

---

## ✅ 체크리스트

팀원 모두가 확인해야 할 설정:

- [ ] 글로벌 NODE_OPTIONS 설정 제거 확인
- [ ] 별칭 명령어 (`claude-dev`, `claude-light` 등) 작동 확인  
- [ ] 첫 실행 시 `npm run monitor:memory` 결과 확인
- [ ] 메모리 부족 증상 발생시 단계적 해결 방법 숙지
- [ ] Code Review 시 메모리 사용량 체크 습관화

**문제 발생시**: 이 문서의 "Emergency" 섹션 참조 또는 팀 Slack #dev-support 채널 문의

**마지막 업데이트**: 2025-08-24 (4-AI 교차검증 완료)
