# WSL 2 최적화 설정 (개인 환경)

**개인 개발 환경**: Windows + WSL 2 (Ubuntu) 최적화

## 💻 현재 WSL 환경

### 시스템 스펙
- **메모리**: 20GB 할당 (19GB → 20GB 업그레이드, 2025-09-30)
- **사용 가능**: 17GB (85% 여유도)
- **프로세서**: 8코어 완전 활용
- **커널**: Linux 6.6.87.2-microsoft-standard-WSL2
- **네트워킹**: 미러 모드 (MCP 서버 호환성)

### 성능 현황
- **MCP 상태**: 9/9 완벽 연결 (100% 성공률) 🎉
- **평균 응답**: 50ms 미만
- **안정성**: 99.9% 가동률
- **프로세스**: MCP/AI 관련 프로세스 17개 안정 실행

## ⚙️ .wslconfig 설정

```ini
[wsl2]
# 메모리 설정
memory=20GB              # 최소 16GB, 권장 20GB
swap=10GB               # 스왑 메모리

# CPU 설정
processors=8            # CPU 코어 수

# 네트워킹 (MCP 서버 필수)
networkingMode=mirrored # 미러 모드 필수
dnsTunneling=true       # MCP DNS 해석 필수
autoProxy=true          # MCP 프록시 연결 필수

# 성능 최적화
autoMemoryReclaim=gradual  # 점진적 메모리 회수 (dropcache 금지)
sparseVhd=true            # VHD 압축 활성화

# GUI 지원
guiApplications=true      # GUI 애플리케이션 지원
```

## ⚠️ 설정 변경 주의사항

### 🔒 절대 변경하지 말 것 (MCP 크래시 위험)
```ini
dnsTunneling=true     # MCP DNS 해석 필수
autoProxy=true        # MCP 프록시 연결 필수
memory=20GB          # 최소 16GB, 권장 20GB
networkingMode=mirrored  # 미러 모드 필수 (MCP 호환성)
```

### ✅ 안전한 변경 가능
```ini
autoMemoryReclaim=gradual  # 메모리 회수 방식
sparseVhd=true            # VHD 압축
processors=8              # CPU 코어 수 (성능 조절)
swap=10GB                 # 스왑 크기 (필요 시 조정)
guiApplications=true      # GUI 지원
```

### ❌ 호환성 문제로 사용 불가
```ini
pageReporting=true       # 최신 WSL 빌드에서만 지원
useWindowsDriver=true    # 실험적 기능으로 불안정
```

## 🛠️ WSL 설정 변경 후 체크리스트

1. `wsl --shutdown` 후 재시작
2. `claude mcp status` 명령으로 MCP 서버 상태 확인
3. 모든 서버가 정상 연결되는지 검증
4. 응답 시간이 50ms 이내인지 확인

## 🚀 성능 최적화 팁

### Node.js 메모리 설정
```bash
# ~/.bashrc에 추가
export NODE_OPTIONS="--max-old-space-size=12288"  # 12GB 할당
```

### WSL 종합 진단
```bash
# WSL 성능 모니터링
./scripts/wsl-monitor/wsl-monitor.sh --once

# 메모리 활용도 확인
free -h

# AI CLI 환경 확인
which claude gemini qwen codex
claude --version  # v2.0.8 확인
```

## 📊 WSL 최적화 성과 (2025-09-30)

- **메모리 현황**: 20GB 할당, 17GB 사용 가능 (85% 여유도)
- **MCP 상태**: 9/9 완벽 연결 (Vercel 재인증 완료)
- **프로세스 현황**: MCP/AI 관련 프로세스 17개 안정 실행
- **성능 개선**: 평균 응답 50ms 유지 (최적화 상태)
- **안정성**: 100% 연결 성공률 달성

## 🔗 관련 문서

- [메모리 요구사항](../../../../MEMORY-REQUIREMENTS.md)
- [WSL 모니터링 가이드](../../../../docs/troubleshooting/wsl-monitoring-guide.md)
- [WSL 최적화 분석 리포트](../../../../docs/development/wsl-optimization-analysis-report.md)
