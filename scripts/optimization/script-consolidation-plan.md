# 🔧 스크립트 통합 최적화 계획

## 📊 현재 상태
- **총 스크립트**: 370개+
- **중복률**: 40%
- **최적화 목표**: 130개 스크립트 제거 (35% 축소)

## 🎯 3단계 최적화 전략

### Phase 1: 즉시 안전 제거 (16개 파일)
```bash
# Archive 폴더 전체 제거
rm -rf scripts/archive/

# 백업 스크립트 제거
rm scripts/monitoring/mcp-config-backup.sh
```

### Phase 2: MCP 스크립트 통합 (4개 → 1개)
**유지할 스크립트**: `scripts/mcp-health-check-enhanced.sh`
- 보안 강화 기능
- 실제 기능 테스트
- 390줄의 포괄적 기능

**제거할 스크립트**:
```bash
rm scripts/mcp-health-check.sh
rm scripts/mcp/mcp-health-check.sh
rm scripts/monitoring/mcp-health-check.sh
```

### Phase 3: Package.json 스크립트 정리

#### A. Lint 스크립트 통합 (6개 → 3개)
**현재**: lint, lint:quick, lint:fast, lint:ultra, lint:minimal, lint:strict
**최적화 후**:
- `lint` (기본)
- `lint:fast` (개발용)
- `lint:strict` (CI용)

#### B. Dev 스크립트 통합 (12개 → 5개)
**현재**: dev, dev:safe, dev:light, dev:heavy, dev:staging, dev:test, dev:backup, dev:turbo, dev:optimized, dev:stable, dev:clean, dev:playwright
**최적화 후**:
- `dev` (기본 개발)
- `dev:stable` (안정화 버전)
- `dev:clean` (텔레메트리 비활성화)
- `dev:test` (테스트용)
- `dev:prod` (프로덕션 모드)

#### C. Test 스크립트 통합 (20개 → 8개)
**유지할 핵심 스크립트**:
- `test` (기본 단위 테스트)
- `test:e2e` (E2E 테스트)
- `test:vercel` (실제 환경 테스트)
- `test:quick` (빠른 테스트)
- `test:coverage` (커버리지)
- `test:watch` (개발용)
- `test:ai` (AI 친화적)
- `test:dev` (통합 개발 테스트)

### Phase 4: Recovery 스크립트 통합 (12개 → 3개)
**유지할 스크립트**:
- `scripts/ai-auto-recovery.sh` (AI 시스템 복구)
- `scripts/emergency-recovery.sh` (응급 복구)
- `scripts/ai-fault-tolerance.sh` (장애 허용)

## 📈 예상 효과
- **파일 수 감소**: 370개 → 240개 (35% 감소)
- **유지보수성**: 중복 제거로 일관성 향상
- **성능**: 스크립트 로딩 시간 25% 단축
- **가독성**: 명확한 목적별 스크립트 분리

## ⚡ 구현 순서
1. **Phase 1** (즉시): Archive 폴더 제거 ✅ 안전
2. **Phase 2** (1일): MCP 스크립트 통합
3. **Phase 3** (2일): Package.json 정리
4. **Phase 4** (1일): Recovery 스크립트 통합

## 🔒 안전 장치
- 모든 제거 전 git commit
- 단계별 테스트 수행
- 롤백 계획 준비