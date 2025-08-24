# AI Scripts - Archived

AI 교차 검증 시스템 관련 스크립트들은 다음 위치로 이동되었습니다:

```
archive/ai-scripts-backup/$(date +%Y%m%d)/
```

## 이동된 스크립트들

- `ai-agent-sync.mjs` - AI 에이전트 동기화
- `ai-collaborate.sh` - AI 협업 스크립트
- `ai-collaboration-workflow.mjs` - AI 협업 워크플로우
- `ai-review-reporter.mjs` - AI 리뷰 리포터
- `ai-review-system.mjs` - AI 리뷰 시스템 (메인)
- `auto-trigger-system.mjs` - 자동 트리거 시스템
- `check-ai-context.js` - AI 컨텍스트 체크
- `queue-processor.sh` - 큐 처리기
- `subagent-recovery.sh` - 서브에이전트 복구
- `test-sub-agents.sh` - 서브에이전트 테스트
- `unified-agent-interface.mjs` - 통합 에이전트 인터페이스

## 복원 방법

필요 시 다음 명령어로 복원할 수 있습니다:

```bash
cp -r archive/ai-scripts-backup/YYYYMMDD/* scripts/ai/
```