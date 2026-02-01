---
description: Create a git commit with conventional commit message
---

## Context

- Current git status: $GIT_STATUS
- Current git diff (staged and unstaged changes): $GIT_DIFF
- Current branch: $GIT_BRANCH
- Recent commits: $GIT_LOG

## Your task

Based on the above changes, create a single git commit.

### Rules

1. **Staged changes check**: If no staged changes exist, stage the modified files shown in git status (exclude untracked files unless clearly related to the task).

2. **Commit message**: Use conventional commits format analyzing the diff:
   - `feat:` new feature
   - `fix:` bug fix
   - `refactor:` code refactoring
   - `docs:` documentation
   - `chore:` maintenance
   - `style:` formatting, no logic change
   - `test:` adding/updating tests

3. **Create commit**: Use HEREDOC format:
   ```bash
   git commit -m "$(cat <<'EOF'
   <type>(<scope>): <description>

   Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
   EOF
   )"
   ```

4. **After commit**: Run `git status` to verify success.

You have the capability to call multiple tools in a single response. Stage and create the commit using a single message. Do not use any other tools or do anything else. Do not send any other text or messages besides these tool calls.
