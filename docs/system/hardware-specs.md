# 개발 환경 시스템 스펙 및 WSL 최적화 설정

## 📋 목차

- [시스템 스펙](#시스템-스펙)
- [WSL 최적화 설정](#wsl-최적화-설정)
- [성능 벤치마크](#성능-벤치마크)
- [개발 환경 권장사항](#개발-환경-권장사항)

## 🖥️ 시스템 스펙

> **⚠️ 주의사항**: 아래 하드웨어 스펙은 특정 작업 환경(노트북)에 기반한 설정입니다.  
> 다른 하드웨어 환경에서는 CPU, 메모리, 스토리지 용량이 다를 수 있으며,  
> WSL 최적화 설정도 해당 환경에 맞게 조정이 필요합니다.

### 하드웨어 사양

- **CPU**: AMD Ryzen 7 7735HS with Radeon Graphics
  - 코어: 8코어 16스레드
  - 아키텍처: Zen 3+ (7nm)
  - 베이스 클럭: ~3.2GHz
  - 부스트 클럭: ~4.75GHz
- **메모리**: 32GB DDR4/DDR5
- **스토리지**:
  - C: 드라이브: 476GB (여유 공간: 407GB)
  - D: 드라이브: 466GB (여유 공간: 460GB)
- **GPU**: AMD Radeon 내장 그래픽

### 소프트웨어 환경

- **OS**: Windows 10 Pro (Build 2009)
- **WSL**: Version 2.5.10.0
- **커널**: 6.6.87.2-1
- **WSLg**: 1.0.66
- **MSRDC**: 1.2.6074
- **Direct3D**: 1.611.1-81528511

## ⚙️ WSL 최적화 설정

> **📝 설정 참고**: 다음 WSL 설정은 32GB RAM 환경에 최적화되어 있습니다.  
> 다른 메모리 용량의 시스템에서는 `memory`, `swap` 값을 시스템 사양에 맞게 조정하세요.  
> 일반적으로 전체 메모리의 50-75% 할당을 권장합니다.

### `.wslconfig` 설정 파일

위치: `%USERPROFILE%\.wslconfig`

```ini
# WSL2 최적화 설정
[wsl2]
# 메모리 할당 (32GB 중 24GB 할당 - 개발용 최적화)
memory=24GB

# CPU 코어 할당 (16 스레드 모두 활용)
processors=16

# 스왑 메모리 (8GB로 증가)
swap=8GB

# 스왑 파일 경로 (D 드라이브 활용)
swapFile=D:\\wsl-swap.vhdx

# 로컬호스트 포워딩 활성화
localhostForwarding=true

# 중첩 가상화 활성화 (Docker 등을 위해)
nestedVirtualization=true

# 메모리 회수 모드 (점진적 회수로 성능 향상)
vmIdleTimeout=60000

# 디버그 콘솔 비활성화 (성능 향상)
debugConsole=false

[experimental]
# 자동 메모리 회수 활성화
autoMemoryReclaim=gradual

# 희소 VHD 활성화 (디스크 공간 절약)
sparseVhd=true
```

### WSL Ubuntu 환경

- **배포판**: Ubuntu 24.04 LTS
- **할당된 메모리**: 24GB (전체 32GB 중 75%)
- **할당된 CPU**: 16 스레드 (100% 활용)
- **스왑 메모리**: 8GB
- **가상 디스크**: 1TB (희소 VHD 방식)

## 📊 성능 벤치마크

### 최적화 전후 비교

| 항목        | 최적화 전 | 최적화 후 | 개선율 |
| ----------- | --------- | --------- | ------ |
| 할당 메모리 | 15GB      | 24GB      | +60%   |
| 스왑 메모리 | 4GB       | 8GB       | +100%  |
| CPU 할당    | 16 스레드 | 16 스레드 | 유지   |
| 디스크 성능 | 기본      | 희소 VHD  | 향상   |

### 리소스 활용률 (최적화 후)

```bash
# 메모리 사용량
$ free -h
               total        used        free      shared  buff/cache   available
Mem:            23Gi       629Mi        22Gi       3.2Mi       328Mi        22Gi
Swap:          8.0Gi          0B       8.0Gi

# CPU 정보
$ nproc
16

# 디스크 용량
$ df -h /
Filesystem      Size  Used Avail Use% Mounted on
/dev/sdd       1007G  6.8G  949G   1% /
```

## 🚀 개발 환경 권장사항

### OpenManager VIBE v5 프로젝트 최적화

1. **메모리 집약적 작업**:
   - Claude Code 실행: 24GB 메모리로 여유로운 실행
   - 대규모 프로젝트 빌드: Next.js + TypeScript 빌드 최적화
   - AI 모델 로드: 로컬 AI 모델 실행 가능

2. **개발 도구 설정**:
   - VS Code WSL 확장 활용
   - Docker Desktop WSL2 백엔드 사용
   - Node.js 개발 환경 WSL 내 구성

3. **성능 모니터링**:

   ```bash
   # 실시간 리소스 모니터링
   htop

   # 메모리 사용량 확인
   free -h

   # 디스크 I/O 모니터링
   iotop
   ```

### 추가 최적화 팁

1. **Windows 터미널**: WSL 기본 터미널로 설정
2. **Git 설정**: WSL 내에서 Git 구성
3. **SSH 키**: WSL 환경에서 SSH 키 관리
4. **포트 포워딩**: 개발 서버 접근을 위한 네트워크 설정

## 🔧 시스템 유지보수

### 정기 점검 항목

1. **WSL 업데이트**:

   ```powershell
   wsl --update
   ```

2. **Ubuntu 패키지 업데이트**:

   ```bash
   sudo apt update && sudo apt upgrade
   ```

3. **디스크 정리**:

   ```bash
   # WSL 디스크 압축
   wsl --shutdown
   # Windows에서: Optimize-VHD 명령 사용
   ```

4. **메모리 모니터링**:
   ```bash
   # 메모리 사용량 지속 모니터링
   watch -n 1 free -h
   ```

## 📝 변경 기록

- **2025-01-21**: 초기 시스템 스펙 문서화
- **2025-01-21**: WSL2 최적화 설정 적용 (메모리 24GB, 스왑 8GB)

## 🔗 관련 문서

- [WSL 설치 가이드](./setup/wsl-installation.md)
- [개발 환경 설정](./development/environment-setup.md)
- [성능 튜닝 가이드](./performance/optimization.md)

---

## 💡 다른 하드웨어 환경에서의 적용 가이드

> **중요**: 이 문서의 설정은 특정 노트북 환경(AMD Ryzen 7 7735HS + 32GB RAM)에 최적화되어 있습니다.

### 메모리별 권장 WSL 설정

- **8GB 시스템**: `memory=4GB`, `swap=2GB`
- **16GB 시스템**: `memory=8GB`, `swap=4GB`
- **32GB 시스템**: `memory=24GB`, `swap=8GB` (현재 설정)
- **64GB+ 시스템**: `memory=48GB`, `swap=16GB`

### CPU별 권장 설정

- **4코어 8스레드**: `processors=8`
- **6코어 12스레드**: `processors=12`
- **8코어 16스레드**: `processors=16` (현재 설정)

### 작업 환경별 고려사항

- **개발용 데스크톱**: 더 높은 메모리/CPU 할당 가능
- **회사 노트북**: 보안 정책에 따른 제한 가능
- **클라우드 VM**: 네트워크 및 스토리지 설정 추가 필요
- **맥북 (ARM)**: 다른 아키텍처별 최적화 필요

### 설정 전 확인사항

1. 시스템 총 메모리 용량 확인
2. 다른 애플리케이션의 메모리 사용량 고려
3. 개발 작업의 리소스 요구사항 분석
4. WSL 외 Windows 운영체제용 최소 8GB 메모리 확보

> **⚠️ 주의**: WSL에 과도한 메모리를 할당하면 Windows 시스템 전체 성능이 저하될 수 있습니다.
