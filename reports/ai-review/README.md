# AI Code Review Reports

AI 코드 리뷰 결과와 상태 파일이 저장되는 폴더입니다.

## 구조

```
reports/ai-review/
├── review-*.md          # 리뷰 결과 (tracked)
├── .ai-usage-state      # AI 사용 카운터 (ignored)
├── .reviewed-commits    # 검토된 커밋 (ignored)
├── .reviewed-by-human   # 사람 검토 완료 (ignored)
├── .issue-tracking.json # 이슈 추적 (ignored)
└── .review-lock         # 락 파일 (ignored)
```

## 워크플로우

```
커밋 → auto-ai-review.sh → reports/ai-review/*.md
                                    ↓ (완료)
                         reports/history/completed-reviews/
```

## 관련 스크립트

| 스크립트 | 용도 |
|---------|------|
| `auto-ai-review.sh` | 자동 코드 리뷰 |
| `review-tracker.sh` | 리뷰 상태 추적 |
| `review-issue-tracker.sh` | 이슈 추적 |

_Last Updated: 2026-01-14_
