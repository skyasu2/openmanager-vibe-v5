# Reports (분석 리포트 및 기록)

이 폴더는 **시점별 스냅샷** 성격의 문서를 보관합니다.
`docs/`의 순수 문서와 달리, 특정 시점의 분석 결과나 완료된 작업 기록입니다.

## 폴더 구조

```
reports/
├── planning/           # 계획 및 분석 (활성) - 7 files
│   ├── TODO.md         # 현재 작업 목록
│   └── *-plan.md       # 진행 중인 계획서
│
└── history/            # 완료된 작업 기록 (보관) - 112 files
    ├── docs/               # 완료된 문서 (guides, migrations, designs)
    ├── completed-plans/    # 완료된 계획서
    ├── completed-analysis/ # 완료된 분석 보고서
    └── completed-reviews/  # 완료된 코드 리뷰
```

## 워크플로우

### 1. 작업 계획 (Planning)
```
reports/planning/TODO.md    → 신규 작업 추가
reports/planning/*-plan.md  → 상세 계획서 작성
```

### 2. AI 코드 리뷰
```
# 자동 생성 리뷰 (gitignored)
logs/code-reviews/review-{AI}-{DATE}.md

# 주요 리뷰 결과 (tracked)
reports/history/completed-reviews/*.md
```

### 3. 문서 수명 주기
```
1. 신규 → reports/planning/*.md
2. 진행 → 상태 업데이트
3. 완료 → reports/history/completed-*/
```

## vs docs/

| 구분 | `docs/` | `reports/` |
|------|---------|------------|
| 성격 | 최신 유지 필요 | 시점별 스냅샷 |
| 예시 | 가이드, API 문서 | 분석 결과, 완료 보고서 |
| 개수 | 35 files | 119 files |
| Git | Tracked | Tracked (history 포함) |

_Last Updated: 2026-01-14_
