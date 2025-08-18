# 🔄 서브에이전트 가이드 이전 안내

> **중요**: 이 문서는 최신 버전으로 이전되었습니다.

## 📍 새로운 위치

**최신 서브에이전트 완전 가이드**는 다음 위치로 이전되었습니다:

➡️ **[📖 Claude Code 서브에이전트 완전 가이드](../claude/sub-agents-complete-guide.md)**

## 🔄 변경 사항 (2025-08-18)

### ⬆️ 업그레이드 내용
- **에이전트 수**: 18개 → **19개** (최신)
- **복구 시스템**: 🆕 **자동 복구 스크립트 추가**
- **문서 구조**: 더 체계적이고 상세한 가이드
- **트러블슈팅**: 완전한 문제 해결 가이드

### 📦 아카이브
구버전 문서는 다음 위치에 보관됩니다:
- **아카이브**: `docs/archive/2025-08-18/sub-agents-comprehensive-guide-v5.67.13.md`

## 🚀 새로운 기능

### 🛠️ 자동 복구 스크립트
```bash
# 서브에이전트 상태 확인
./scripts/subagent-recovery.sh --check

# 전체 복구
./scripts/subagent-recovery.sh --full
```

### 📊 19개 에이전트 완전 분석
- **계층적 구조**: Claude Code → Central Supervisor → 전문 에이전트
- **MCP 통합**: 94개 도구 완전 활용
- **협업 패턴**: 멀티 AI 병렬 처리

## 🔗 관련 문서

- **[📖 메인 가이드](../claude/sub-agents-complete-guide.md)** - 19개 에이전트 완전 분석
- **[🔧 복구 스크립트](../../scripts/subagent-recovery.sh)** - 자동 복구 도구
- **[📁 Claude 폴더 구조](../../.claude/README.md)** - 에이전트 파일 구조
- **[📚 MCP 가이드](../MCP-GUIDE.md)** - MCP 서버 통합 가이드

---

💡 **빠른 링크**: [**→ 최신 가이드로 이동**](../claude/sub-agents-complete-guide.md)