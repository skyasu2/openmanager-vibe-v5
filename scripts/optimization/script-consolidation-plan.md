# 🔧 스크립트 통합 최적화 계획

<!-- Version: 2.0.0 | Updated: 2025-12-10 -->

## 📊 현재 상태 (2025-12-10 업데이트)

- **총 스크립트 파일**: 163개 (이전 370개에서 56% 감소)
- **셸 스크립트**: 73개
- **최적화 목표**: Phase 1-2 완료, Phase 3-4 선택적 진행

## ✅ 완료된 최적화

### Phase 1: Archive 폴더 제거 ✅ 완료
- `scripts/archive/` 폴더 제거됨
- `scripts/monitoring/mcp-config-backup.sh` 제거됨

### Phase 2: MCP 스크립트 통합 ✅ 완료
**현재 MCP 관련 스크립트 (4개, 모두 고유 역할)**:
- `scripts/mcp/mcp-health-check.sh` - 메인 헬스체크 (독립 실행)
- `scripts/mcp/restart-mcp-servers.sh` - 서버 재시작
- `scripts/check-mcp-env.js` - 환경변수 체크 (JavaScript)
- `scripts/wsl-monitor/lib/mcp-checker.sh` - WSL 모니터 모듈 (라이브러리)

중복 스크립트가 모두 정리됨 - 추가 통합 불필요.

## 🎯 선택적 추가 최적화 (Phase 3-4)

### Phase 3: Package.json 스크립트 정리 (선택)

현재 lint/dev/test 스크립트가 잘 분류되어 있음.
필요 시 package.json 분석 후 중복 제거 가능.

### Phase 4: Recovery 스크립트 통합 (선택)

**현재 Recovery 관련 스크립트**:
```bash
find scripts -name "*recovery*" -o -name "*emergency*"
```

필요 시 검토 가능.

## 📈 달성된 효과

| 항목 | 이전 | 현재 | 변화 |
|------|------|------|------|
| 총 파일 수 | 370+ | 163 | -56% |
| 셸 스크립트 | 150+ | 73 | -51% |
| MCP 중복 | 4개 | 0개 | 완전 제거 |
| Archive 폴더 | 16+ 파일 | 0개 | 완전 제거 |

## 📝 결론

**Phase 1-2 최적화 완료**로 스크립트 수가 56% 감소함.
추가 최적화는 필요 시 Phase 3-4 진행 가능.

---

**최종 업데이트**: 2025-12-10
