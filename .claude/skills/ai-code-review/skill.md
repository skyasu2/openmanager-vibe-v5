---
name: ai-code-review
version: v2.0.0
description: Multi-AI code review orchestration using Codex, Gemini, Claude with automatic fallback. Triggers when user requests AI code review, cross-validation, or multi-AI analysis. Integrates with existing auto-ai-review.sh workflow.
---

# AI Code Review Skill v2.0.0

## Purpose

1. **리뷰 생성**: Codex/Gemini로 코드 리뷰 실행
2. **리뷰 평가**: pending/ 리뷰를 Claude Code가 평가
3. **히스토리 관리**: 평가 완료 → history/ 이동 + .evaluation-log 기록

## Trigger Keywords

- "/ai-code-review"
- "ai code review"
- "코드 리뷰"
- "리뷰 평가"
- "리뷰 결과"

## Workflow

### Phase 1: 리뷰 상태 확인

```bash
# pending 리뷰 확인
ls -la reports/ai-review/pending/*.md 2>/dev/null | tail -5

# 최신 리뷰 읽기
LATEST=$(ls -t reports/ai-review/pending/*.md 2>/dev/null | head -1)
if [ -f "$LATEST" ]; then cat "$LATEST"; fi
```

### Phase 2: 리뷰 평가 (Claude Code)

pending 리뷰 파일을 읽고 다음을 평가:

1. **점수 추출**: AI 리뷰에서 점수(X/10) 찾기
2. **핵심 이슈**: Critical/High 이슈 있는지 확인
3. **한줄평가**: 변경사항 요약 (20자 이내)

### Phase 3: 평가 결과 기록

```bash
# 1. .evaluation-log에 추가
DATE="2026-01-15"
COMMIT="abc1234"
SCORE="8.5/10"
ENGINE="codex"
COMMENT="스킬 구조 추가, 보안 개선 권장"

echo "$DATE | $COMMIT | $SCORE | $ENGINE | $COMMENT" >> reports/ai-review/.evaluation-log

# 2. history/로 이동
mkdir -p reports/ai-review/history/$(date +%Y-%m)
mv reports/ai-review/pending/review-*.md reports/ai-review/history/$(date +%Y-%m)/

# 3. 월간 통계 업데이트 (선택)
```

## 평가 기준

| 점수 | 의미 | 조치 |
|------|------|------|
| 9-10 | 우수 | 즉시 승인 |
| 7-8 | 양호 | 권고사항 참고 |
| 5-6 | 보통 | 개선 필요 |
| 1-4 | 미흡 | 수정 후 재커밋 |

## 한줄평가 예시

```
# .evaluation-log 형식
2026-01-15 | 9e04dae | 8.5/10 | codex | 스킬 구조 추가, execFileSync 보안 개선 권장
2026-01-14 | 6501af8 | 9/10 | gemini | React Flow 레이아웃 최적화 깔끔함
2026-01-13 | 5af3caa | 7/10 | codex | PostgresVectorDB 분리 좋으나 에러핸들링 보완 필요
```

## Output Format

```
📋 AI 코드 리뷰 평가 완료
━━━━━━━━━━━━━━━━━━━━━━━━━

📊 평가 결과:
  - 커밋: abc1234
  - AI 엔진: CODEX
  - 점수: 8.5/10
  - 평가: 양호 (권고사항 참고)

📝 한줄평가:
  스킬 구조 추가, execFileSync 보안 개선 권장

✅ 처리 완료:
  - 리뷰 파일 → history/2026-01/ 이동
  - .evaluation-log에 기록됨

━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Related Files

| 파일 | 용도 |
|------|------|
| `reports/ai-review/pending/` | 평가 대기 리뷰 |
| `reports/ai-review/history/` | 평가 완료 리뷰 |
| `reports/ai-review/.evaluation-log` | 평가 기록 (영구 보관) |
| `reports/ai-review/.reviewed-commits` | 리뷰 완료 커밋 해시 |

## Changelog

- 2026-01-15: v2.0.0 - pending/history 구조 + 자동 평가 시스템
  - pending/ 디렉토리에 리뷰 저장
  - Claude Code 평가 후 history/ 이동
  - .evaluation-log에 점수 + 한줄평가 기록
  - 월간 통계 지원 (.monthly-stats.json)
- 2025-12-29: v1.2.0 - 이슈 트래커 통합
- 2025-12-07: v1.1.0 - Claude CLI 수정 및 3-AI 순환 복원
