---
name: commit-commands
description: Create a git commit with automatic AI code review (Codex/Gemini rotation). Triggers on /commit.
version: v1.0.0
user-invocable: true
allowed-tools: Bash, Read, Grep, Edit
---

# Git Commit with AI Review

커밋 생성 후 자동으로 Codex 또는 Gemini로 코드 리뷰를 실행합니다.

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

### 4. AI Code Review (Automatic)

After successful commit, run AI review:

```bash
# Get AI engine for review (alternating Codex/Gemini)
LAST_ENGINE=$(cat reports/ai-review/.last-engine 2>/dev/null || echo "gemini")
if [ "$LAST_ENGINE" = "codex" ]; then
  REVIEW_ENGINE="gemini"
else
  REVIEW_ENGINE="codex"
fi

# Run review based on engine
if [ "$REVIEW_ENGINE" = "codex" ]; then
  DIFF=$(git diff HEAD~1 | head -300)
  echo "커밋: $(git log -1 --oneline)
변경 파일: $(git diff HEAD~1 --name-only | wc -l)개

다음 변경사항을 리뷰해주세요:
1. 코드 품질 점수 (1-10)
2. 보안 이슈
3. 개선사항
4. 결론: 승인/거부

$DIFF" | codex --json 2>&1 | head -100
else
  DIFF=$(git diff HEAD~1 | head -300)
  gemini -m gemini-2.5-flash "커밋: $(git log -1 --oneline)
다음 변경사항을 리뷰해주세요. 한국어로 답변.
1. 점수 (1-10)
2. 보안 이슈
3. 개선사항
4. 결론: 승인/거부

$DIFF" 2>&1 | head -100
fi

# Save last engine
echo "$REVIEW_ENGINE" > reports/ai-review/.last-engine
```

### 5. Summary

Display:
- Commit hash and message
- AI review score and verdict
- Any critical issues found

## Output Format

```
✅ 커밋 완료: abc1234 feat: add new feature

🤖 AI 리뷰 (Codex/Gemini):
- 점수: 8/10
- 보안: 이슈 없음
- 결론: 승인

💡 개선 제안:
- (있으면 표시)
```

## Notes

- AI 리뷰는 백그라운드가 아닌 실시간으로 실행됩니다
- Codex와 Gemini가 번갈아가며 리뷰합니다 (Cross-model validation)
- 리뷰 결과는 `reports/ai-review/` 디렉토리에 저장됩니다
