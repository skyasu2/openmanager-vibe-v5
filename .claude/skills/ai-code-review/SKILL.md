---
name: ai-code-review
description: AI 코드 리뷰 결과 분석 및 개선 실행. pending 리뷰(Claude 기본)를 읽고, 개선 필요사항을 분석하여 실제 코드 수정까지 진행. 평가는 부산물.
version: v3.1.0
user-invocable: true
allowed-tools: Bash, Read, Grep, Edit
---

# AI Code Review Analysis & Action

## Purpose

1. **리뷰 분석**: pending/ 리뷰에서 지적사항 추출
2. **개선 판단**: 진짜 문제인지, 오탐인지 분석
3. **코드 수정**: 필요시 실제 개선 진행
4. **평가 기록**: 조치 결과를 부산물로 기록

## Trigger Keywords

- "/ai-code-review"
- "리뷰 분석"
- "코드 리뷰 검토"
- "개선사항 확인"

## Workflow

### Phase 1: 리뷰 읽기

```bash
# pending 리뷰 확인
ls reports/ai-review/pending/*.md 2>/dev/null

# 최신 리뷰 읽기
cat reports/ai-review/pending/review-*.md
```

### Phase 2: 개선 필요사항 분석

리뷰에서 지적된 각 항목을 분석:

| 분류 | 설명 | 조치 |
|------|------|------|
| **Critical** | 버그, 보안 이슈 | 반드시 수정 |
| **High** | 성능, 안정성 문제 | 수정 권장 |
| **Medium** | 코드 품질 개선 | 검토 후 결정 |
| **Low** | 스타일, 권장사항 | 선택적 |
| **False Positive** | 오탐, 해당없음 | 스킵 + 사유 기록 |

### Phase 3: 실제 개선 진행

개선이 필요한 항목에 대해:

1. **파일 읽기**: 지적된 코드 위치 확인
2. **문제 분석**: 실제로 문제가 맞는지 판단
3. **코드 수정**: Edit 도구로 수정
4. **검증**: 수정이 올바른지 확인

### Phase 4: 평가 기록 (부산물)

**중요: 각 리뷰 분석 완료 직후 즉시 이동** (컨텍스트 초과 방지)

```bash
# 1. 조치 결과 기록
echo "$(date +%Y-%m-%d) | abc1234 | 8/10 | claude | Critical 1건 수정" >> reports/ai-review/.evaluation-log

# 2. 해당 리뷰만 즉시 이동 (와일드카드 금지!)
mkdir -p reports/ai-review/history/$(date +%Y-%m)
mv reports/ai-review/pending/review-claude-2026-01-15-XXX.md reports/ai-review/history/$(date +%Y-%m)/
```

**절대 금지**: `mv review-*.md` 와일드카드 사용 → 미분석 파일까지 이동됨

## 분석 예시

```
📋 AI 리뷰 분석 결과
━━━━━━━━━━━━━━━━━━━━━━━━━

📊 지적사항 요약:
  - Critical: 0건
  - High: 1건 (로그 파일 비대화)
  - Low: 2건 (주석 추가 권장)

🔍 상세 분석:

1. [High] 로그 파일 비대화 방지
   - 위치: scripts/hooks/post-commit.js:52
   - 판정: ✅ 유효한 지적
   - 조치: 1MB 초과 시 초기화 로직 추가

2. [Low] 주석 추가 권장
   - 판정: ⏭️ 스킵 (이미 충분함)

✏️ 수정 진행 중...
   - post-commit.js 수정 완료

📝 평가 기록:
   8/10 | High 1건 수정, Low 스킵
━━━━━━━━━━━━━━━━━━━━━━━━━
```

## 오탐(False Positive) 처리

AI 리뷰가 잘못 지적한 경우:

```bash
# .evaluation-log에 오탐 사유 기록
echo "$(date +%Y-%m-%d) | abc1234 | 9/10 | claude | 오탐: limit 검증은 Mock 핸들러라 해당없음" >> reports/ai-review/.evaluation-log
```

## Changelog

- 2026-01-22: v3.1.0 - 즉시 이동 정책 추가
  - 각 리뷰 분석 완료 직후 즉시 history로 이동
  - 와일드카드 사용 금지 명시 (컨텍스트 초과 방지)
- 2026-01-15: v3.0.0 - 분석 + 개선 실행 워크플로우
  - 단순 평가 → 실제 코드 수정까지 진행
  - 평가는 조치 결과의 부산물로 기록
  - 오탐 처리 프로세스 추가
