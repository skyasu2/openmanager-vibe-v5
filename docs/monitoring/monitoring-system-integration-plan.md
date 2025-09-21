# 모니터링 시스템 통합 계획

## 🎯 목표
WSL 환경에서 중복된 모니터링 도구들을 통합하여 효율적이고 체계적인 모니터링 시스템 구축

## 📊 현재 상태 분석

### ✅ 유지할 도구들 (정상 작동 중)
- `scripts/wsl-monitor/wsl-monitor.sh` - WSL 시스템 리소스 모니터링
- `scripts/emergency-recovery.sh` - WSL 응급 복구 도구
- `scripts/memory-monitor.ts` - Node.js 메모리 모니터링
- `scripts/dev/project-health-monitor.ts` - 프로젝트 건강도 검사

### ⚠️ 통합 대상 (MCP 모니터링 중복)
- `scripts/mcp/mcp-auto-monitor.sh` - 자동 헬스체크, 문제 감지, 자동 복구
- `scripts/mcp/monitor-mcp-servers.sh` - 기본 MCP 서버 상태 모니터링
- `scripts/monitoring/mcp-stability-monitor.sh` - CPU/메모리 안정성 모니터링

## 🚀 통합 방안

### 1단계: MCP 모니터링 통합
```bash
# 새로운 통합 도구 생성
scripts/monitoring/mcp-unified-monitor.sh

# 기능 통합:
# - 기본 상태 체크 (monitor-mcp-servers.sh)
# - CPU/메모리 안정성 (mcp-stability-monitor.sh)
# - 자동 복구 (mcp-auto-monitor.sh)
```

### 2단계: 계층적 모니터링 구조
```
scripts/monitoring/
├── master-monitor.sh           # 마스터 컨트롤러
├── wsl-system-monitor.sh      # WSL 시스템 (기존 유지)
├── mcp-unified-monitor.sh     # MCP 서버 통합
├── project-health-monitor.ts  # 프로젝트 건강도
└── reports/                   # 통합 리포트
```

### 3단계: 중앙 집중식 대시보드
```bash
# 통합 모니터링 명령어
./scripts/monitoring/master-monitor.sh --all       # 전체 모니터링
./scripts/monitoring/master-monitor.sh --mcp       # MCP만
./scripts/monitoring/master-monitor.sh --health    # 프로젝트 건강도만
```

## 📋 실행 계획

### 즉시 실행 (안전한 통합)
1. 기존 MCP 모니터링 도구들 백업
2. 통합 MCP 모니터 생성
3. 기능 테스트 후 점진적 전환

### 장기 계획 (체계적 모니터링)
1. 마스터 컨트롤러 구축
2. 통합 리포트 시스템
3. 자동 알림 및 복구 시스템

## 💡 예상 효과

- **중복 제거**: MCP 모니터링 도구 3개 → 1개 통합
- **효율성 증대**: 통합 명령어로 간편한 모니터링
- **유지보수 개선**: 단일 도구 관리로 복잡성 감소
- **기능 향상**: 통합된 자동 복구 및 알림 시스템

## 🔧 마이그레이션 가이드

### 기존 사용자를 위한 호환성 유지
```bash
# 기존 명령어 (deprecated but working)
./scripts/mcp/mcp-auto-monitor.sh
# → 새로운 명령어로 자동 리다이렉트
./scripts/monitoring/mcp-unified-monitor.sh --auto

# 기존 명령어
./scripts/mcp/monitor-mcp-servers.sh
# → 새로운 명령어
./scripts/monitoring/mcp-unified-monitor.sh --status
```

---

**작성일**: 2025-09-21
**작성자**: Claude Code 중단 원인 분석 및 개선 프로젝트