---
name: commit-commands
description: Create a git commit with automatic Claude Code review. Triggers on /commit.
version: v2.0.0
user-invocable: true
allowed-tools: Bash, Read, Grep, Edit
---

# Git Commit with Claude Code Review

커밋 생성 후 Claude Code가 직접 코드 리뷰를 실행합니다.

## Trigger Keywords

- "/commit"
- "커밋해줘"
- "변경사항 커밋"

## Workflow

### 1. Staged Changes Check

```bash
# Check for staged changes
git diff --cached --stat
```

If no staged changes, prompt user to stage files first.

### 2. Generate Commit Message

Analyze staged changes and generate a conventional commit message:
- `feat:` new feature
- `fix:` bug fix
- `refactor:` code refactoring
- `docs:` documentation
- `chore:` maintenance

### 3. Create Commit

```bash
git commit -m "$(cat <<'EOF'
<commit message>

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

### 4. Claude Code Review (Automatic)

After successful commit, Claude Code directly reviews the changes:

```bash
# Get diff
DIFF=$(git diff HEAD~1 | head -300)

# Review criteria:
# 1. 코드 품질 점수 (1-10)
# 2. 보안 이슈
# 3. 개선사항
# 4. 결론: 승인/거부
```

### 5. Summary

Display:
- Commit hash and message
- Claude review score and verdict
- Any critical issues found

## Output Format

```
✅ 커밋 완료: abc1234 feat: add new feature

🤖 Claude Code 리뷰:
- 점수: 8/10
- 보안: 이슈 없음
- 결론: 승인

💡 개선 제안:
- (있으면 표시)
```

## Notes

- Claude Code가 직접 리뷰하므로 외부 AI 의존성 없음
- 리뷰 결과는 `reports/ai-review/` 디렉토리에 저장됩니다

## Changelog

- v2.0.0 (2026-01-28): Claude Code 단독 리뷰 시스템으로 전환
  - Codex/Gemini 로테이션 제거
  - Claude Code 직접 리뷰로 변경
- v1.0.0: Initial release with Codex/Gemini rotation
