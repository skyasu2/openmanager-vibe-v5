# AI Code Review Reports

AI 코드 리뷰 결과가 저장되는 동적 문서 폴더입니다.

## 워크플로우

```
커밋 → auto-ai-review.sh 실행 → reports/ai-review/*.md 생성
                                      ↓ (리뷰 완료)
                           reports/history/completed-reviews/
```

## 파일 명명 규칙

```
review-{AI}-{YYYY-MM-DD}-{HH-MM-SS}.md
```

- **AI**: codex, gemini 등 리뷰 수행 AI
- **날짜**: 리뷰 생성 일시

## 수명 주기

1. **생성**: 커밋 시 자동 생성
2. **검토**: 개발자가 리뷰 내용 확인
3. **완료**: `reports/history/completed-reviews/`로 이동

## 관련 파일

- 스크립트: `scripts/code-review/auto-ai-review.sh`
- AI 상태: `logs/code-reviews/.ai-usage-state` (휘발성)

_Last Updated: 2026-01-14_
