---
name: commit-push-pr
version: v1.0.0
description: Commit, push, and open a PR in one command. Includes AI code review.
---

# Commit, Push, and Create PR

커밋 → 푸시 → PR 생성을 한 번에 수행합니다.

## Trigger Keywords

- "/commit-push-pr"
- "커밋 푸시 PR"
- "PR까지 해줘"

## Workflow

1. **Commit**: `/commit` skill 실행
2. **Push**: `git push -u origin <branch>`
3. **Create PR**: `gh pr create` with auto-generated description
4. **AI Review**: 자동 코드 리뷰 포함

## Output

```
✅ 커밋: abc1234 feat: add feature
✅ 푸시: origin/feature-branch
✅ PR 생성: https://github.com/repo/pull/123

🤖 AI 리뷰: 8/10 - 승인
```
