# Reports (동적 문서)

동적으로 생성/완료되는 문서를 관리합니다.

## 개념 정리

| 폴더 | 성격 | Git |
|------|------|-----|
| `docs/` | 정적 (가이드) | ✅ Tracked |
| `reports/` | 동적 (계획, 리뷰) | ✅ Tracked |
| `reports/history/` | 아카이브 | ❌ Ignored |
| `logs/` | 휘발성 (로그) | ❌ Ignored |

## 폴더 구조

```
reports/
├── planning/     # 진행 중 계획 (tracked)
├── ai-review/    # AI 리뷰 결과 (tracked)
└── history/      # 완료 아카이브 (gitignored, local only)
```

## 워크플로우

```
[계획]   planning/*.md  →  완료  →  history/completed-plans/
[리뷰]   ai-review/*.md →  완료  →  history/completed-reviews/
```

_Last Updated: 2026-01-14_
