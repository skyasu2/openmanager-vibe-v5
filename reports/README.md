# Reports (동적 문서)

동적으로 생성/완료되는 문서를 관리합니다.

## 개념 정리

| 폴더 | 성격 | 예시 |
|------|------|------|
| `docs/` | 정적 | 가이드, API 문서 |
| `reports/` | 동적 | 계획, 리뷰, 분석 |
| `logs/` | 휘발성 | 실행 로그, 상태 파일 |

## 폴더 구조

```
reports/
├── planning/     # 진행 중 (7 files)
├── ai-review/    # AI 리뷰 결과 (1 file)
└── history/      # 완료 보관 (42 files)
    ├── completed-plans/
    ├── completed-analysis/
    └── completed-reviews/
```

## 워크플로우

### 작업 계획
```
신규 → reports/planning/*.md → 완료 → reports/history/completed-plans/
```

### AI 코드 리뷰
```
커밋 → reports/ai-review/*.md → 완료 → reports/history/completed-reviews/
```

_Last Updated: 2026-01-14_
