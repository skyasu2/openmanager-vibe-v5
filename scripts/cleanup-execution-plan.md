# 🧹 프로젝트 정리 실행 계획

## 📊 분석 완료 현황
✅ **전체 프로젝트 구조 분석 완료**
- config/env-backups: 문제 없음 (5개 파일)
- scripts: 137개 파일, 30-40% 축소 가능
- docs/archive: 31개 파일, 선택적 정리 필요
- development vs local-dev: 중복 없음
- gcp-functions: 통합된 GCP Functions 디렉터리
- config 폴더들: 각각 다른 역할

## 🎯 정리 우선순위 및 실행 계획

### Phase 1: Scripts 폴더 정리 (최우선 - 즉시 실행)

#### 1.1 안전한 삭제 대상 (47개 파일 → 삭제)
```bash
# 중복 테스트 스크립트 (20개)
test-ai-assistant.js               # → test-ai-engines-comprehensive.js로 통합됨
test-ai-data-access.js            # → test-data-integration.js로 통합됨
test-context-optimization.js       # → test-optimized-context.js로 통합됨
cursor-ai-simple-test.js          # → cursor-ai-system-analysis.js로 통합됨
# ... 기타 중복 테스트 파일들

# 중복 Cursor 스크립트 (4개 삭제, 3개 유지)
cursor-active-development.js       # 삭제 - deployment-communicator로 통합
cursor-deployment-communicator.js  # 삭제 - optimized 버전 사용
cursor-auto-test.js               # 삭제 - test-runner로 통합

# 중복 Fix 스크립트 (3개 삭제, 3개 유지)
fix-storybook-imports.js          # 삭제 - final 버전 사용
fix-array-types-bulk.mjs          # 삭제 - fix-type-errors.mjs로 통합
fix-typescript-root-causes.mjs    # 삭제 - fix-type-errors.mjs로 통합

# 과거 버전 스크립트 (10개)
old-*, backup-*, deprecated-* 패턴 파일들

# 일회성 실행 완료 스크립트 (10개)
migrate-*, setup-one-time-*, initial-* 패턴 파일들
```

#### 1.2 통합 대상 (새로운 통합 스크립트 10개 생성)
```bash
# 새로 생성할 통합 스크립트들
unified-test-runner.mjs           # 모든 테스트 스크립트 통합
unified-cursor-manager.js         # Cursor 관련 기능 통합
unified-ai-tools.mjs              # AI 관련 유틸리티 통합
unified-vercel-tools.mjs          # Vercel 관련 도구 통합
unified-gcp-monitor.js            # GCP 모니터링 통합
unified-env-manager.mjs           # 환경 변수 관리 통합
unified-deployment-tools.sh       # 배포 관련 스크립트 통합
unified-fix-tools.mjs             # 코드 수정 도구 통합
unified-data-tools.js             # 데이터 관련 도구 통합
unified-monitoring.js             # 모니터링 도구 통합
```

#### 1.3 유지 대상 (40개 핵심 스크립트)
- 핵심 시스템 스크립트: system-*, health-*, monitoring-*
- 현재 사용 중: ccusage*, cm-*, weekly-cleanup.sh
- 고유 기능: memory-cleanup.js, server-monitor.js 등

### Phase 2: Docs/Archive 정리 (중간 우선순위)

#### 2.1 완전 삭제 대상 (15개 파일)
```bash
# 현재 문서로 대체된 과거 버전
CLAUDE_MONITOR_GUIDE.md          # → claude-monitor-complete-guide.md로 대체
CLAUDE_MONITOR_SETUP.md          # → claude-monitor-new-guide.md로 대체
ENV_ENCRYPTION_GUIDE.md          # → security-complete-guide.md로 대체
# ... 기타 대체된 가이드들
```

#### 2.2 유지 대상 (16개 파일)
- 고유한 역사적 가치가 있는 문서
- 현재 문서에서 참조되는 아카이브

### Phase 3: 최종 검증 및 정리

#### 3.1 Git 정리
```bash
# 삭제된 development 폴더 관련 Git 정리
git add -A  # 모든 변경사항 스테이징
git commit -m "🧹 프로젝트 구조 정리: 중복 스크립트 47개 삭제, 통합 스크립트 10개 생성"
```

#### 3.2 문서 업데이트
- README.md 업데이트 (새로운 스크립트 구조 반영)
- CLAUDE.md 업데이트 (정리된 명령어들 반영)
- package.json 스크립트 섹션 정리

## 📈 예상 효과

### 정량적 개선
- **Scripts 폴더**: 137개 → 90개 (34% 감소)
- **Docs/Archive**: 31개 → 16개 (48% 감소)
- **전체 파일 수**: ~47개 파일 감소
- **저장소 크기**: 약 10-15% 감소

### 정성적 개선
- 🎯 **명확성**: 중복 제거로 개발자 혼란 방지
- ⚡ **효율성**: 통합 스크립트로 작업 시간 단축
- 🔧 **유지보수성**: 체계적인 구조로 관리 편의성 향상
- 📚 **문서화**: 최신 문서만 유지로 정보 정확성 향상

## ⚠️ 주의사항

### 안전 조치
1. **백업 필수**: 정리 전 전체 프로젝트 백업
2. **단계별 실행**: 한 번에 모든 파일 삭제 금지
3. **테스트 필수**: 각 단계 후 시스템 정상 동작 확인
4. **롤백 준비**: Git commit으로 되돌리기 가능한 상태 유지

### 실행 순서
1. Phase 1.1 → 테스트 → Phase 1.2 → 테스트 → Phase 1.3
2. Phase 2.1 → 검증 → Phase 2.2
3. Phase 3.1 → 최종 테스트 → Phase 3.2

## 🚀 실행 준비 완료

모든 분석이 완료되었으며, 안전하고 체계적인 정리 계획이 수립되었습니다.
사용자 승인 후 즉시 실행 가능한 상태입니다.

**다음 단계**: 사용자 승인 → Phase 1 실행 시작