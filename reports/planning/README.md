# Planning Directory

**Last Updated**: 2025-12-29

## Structure

```
reports/planning/
├── TODO.md              # 메인 TODO
├── README.md            # 이 파일 (가이드 포함)
├── analysis/            # 점검/분석 리포트
└── archive/             # 완료된 계획서
    └── 2025-12/
        ├── completed/   # 구현 완료된 계획서
        └── templates/   # 템플릿
```

## Domain-Specific TODOs

| Domain | Location |
|--------|----------|
| AI Development | `docs/development/ai/TODO.md` |

---

## 작업 계획서 작성 가이드

### 언제 계획서를 작성하나?

| 상황 | 계획서 필요 | 대안 |
|------|------------|------|
| 대규모 아키텍처 변경 | ✅ Yes | - |
| 마이그레이션 작업 | ✅ Yes | - |
| 새 기능 (3+ 파일 수정) | ✅ Yes | - |
| 버그 수정 | ❌ No | 커밋 메시지로 충분 |
| 리팩토링 (1-2 파일) | ❌ No | PR 설명으로 충분 |
| 탐색/분석 작업 | ❌ No | Claude Code Plan Mode |

### 계획서 vs Claude Code Plan Mode

```
┌─────────────────────────────────────────────────────────────────┐
│  📄 작업 계획서 (Markdown)                                       │
│  - 팀 공유 / 히스토리 보존 필요 시                                │
│  - 복잡한 마이그레이션, 아키텍처 변경                             │
│  - Git에 커밋하여 영구 보존                                       │
│  - 예: langchain-to-vercel-ai-sdk-migration-plan.md             │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  🤖 Claude Code Plan Mode (세션 내)                              │
│  - 즉시 구현할 작업의 설계 검토                                   │
│  - 복잡한 구현 전 사용자 승인                                     │
│  - 세션 종료 시 사라짐                                            │
│  - 예: "Add dark mode" → Plan → Approve → Implement             │
└─────────────────────────────────────────────────────────────────┘
```

### 계획서 템플릿

```markdown
# [작업명] 계획서

**버전**: v1.0.0
**작성일**: YYYY-MM-DD
**목표 버전**: vX.Y.Z
**상태**: 계획 수립 | 진행 중 | 완료

---

## 1. 배경
- 현재 문제점
- 해결 방안 개요

## 2. 변경 범위
| 파일/컴포넌트 | 변경 내용 |
|--------------|----------|
| ... | ... |

## 3. 구현 단계
- [ ] Phase 1: ...
- [ ] Phase 2: ...

## 4. 리스크 및 대응
| 리스크 | 대응 방안 |
|-------|----------|
| ... | ... |

## 5. 완료 기준
- [ ] 기준 1
- [ ] 기준 2
```

### 계획서 라이프사이클

```
1. 작성 → reports/planning/ 또는 docs/development/{domain}/
2. 진행 → 상태를 "진행 중"으로 업데이트
3. 완료 → reports/planning/archive/YYYY-MM/completed/ 로 이동
```

---

_Archive Location:_ `reports/planning/archive/`
