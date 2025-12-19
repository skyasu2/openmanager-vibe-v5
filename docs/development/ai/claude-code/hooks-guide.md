# Claude Code Hooks 설정 가이드

**Claude Code v2.0+ Hooks 시스템 활용**

## 📚 개요

Claude Code는 `~/.claude/settings.json`에서 Hooks를 설정하여 파일 편집/생성 시 자동으로 검증 명령어를 실행할 수 있습니다.

공식 문서: https://docs.claude.com/en/docs/claude-code/hooks

---

## 🎯 권장 Hooks 설정

### 기본 설정 (`~/.claude/settings.json`)

```json
{
  "alwaysThinkingEnabled": true,
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit",
        "hooks": [
          {
            "type": "command",
            "command": "npm run type-check",
            "timeout": 30,
            "cwd": "/mnt/d/cursor/openmanager-vibe-v5"
          }
        ]
      },
      {
        "matcher": "Write",
        "hooks": [
          {
            "type": "command",
            "command": "npm run format:check",
            "timeout": 15,
            "cwd": "/mnt/d/cursor/openmanager-vibe-v5"
          }
        ]
      }
    ]
  }
}
```

---

## 📝 Hook 타입 설명

### 1. PostToolUse Hook

**파일 수정/생성 후 자동 실행**

```json
{
  "PostToolUse": [
    {
      "matcher": "Edit", // Edit 도구 사용 시
      "hooks": [
        {
          "type": "command",
          "command": "npm run type-check",
          "timeout": 30,
          "cwd": "/mnt/d/cursor/openmanager-vibe-v5"
        }
      ]
    }
  ]
}
```

**matcher 옵션:**

- `Edit`: 파일 편집 시
- `Write`: 파일 생성 시
- `Bash`: Bash 명령 실행 시
- `*`: 모든 도구 실행 시

### 2. UserPromptSubmit Hook

**사용자 프롬프트 제출 시 실행**

```json
{
  "UserPromptSubmit": [
    {
      "hooks": [
        {
          "type": "command",
          "command": "git status --short",
          "timeout": 5
        }
      ]
    }
  ]
}
```

---

## ⚙️ 프로젝트별 최적 설정

### OpenManager VIBE 프로젝트용

```json
{
  "alwaysThinkingEnabled": true,
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit",
        "hooks": [
          {
            "type": "command",
            "command": "npm run type-check",
            "timeout": 30,
            "cwd": "/mnt/d/cursor/openmanager-vibe-v5",
            "continueOnError": true
          }
        ]
      },
      {
        "matcher": "Write",
        "hooks": [
          {
            "type": "command",
            "command": "npx prettier --check {file}",
            "timeout": 10,
            "cwd": "/mnt/d/cursor/openmanager-vibe-v5",
            "continueOnError": true
          }
        ]
      }
    ]
  }
}
```

**주의사항:**

- `continueOnError: true`: 에러 발생해도 계속 진행
- `timeout`: 너무 길면 개발 속도 저하

---

## 🚨 주의사항

### 1. 성능 영향

**❌ 피해야 할 설정:**

```json
{
  "PostToolUse": [
    {
      "matcher": "*", // 모든 도구에 적용 (느림)
      "hooks": [
        {
          "command": "npm run build" // 빌드는 너무 느림
        }
      ]
    }
  ]
}
```

**✅ 권장 설정:**

```json
{
  "PostToolUse": [
    {
      "matcher": "Edit", // 편집 시만
      "hooks": [
        {
          "command": "npm run type-check", // 빠른 검사만
          "timeout": 20
        }
      ]
    }
  ]
}
```

### 2. WSL 환경 호환성

**절대 경로 사용 필수:**

```json
{
  "cwd": "/mnt/d/cursor/openmanager-vibe-v5" // 절대 경로
}
```

### 3. 타임아웃 설정

| 명령어             | 권장 타임아웃 |
| ------------------ | ------------- |
| `prettier --check` | 10초          |
| `type-check`       | 30초          |
| `lint:fast`        | 20초          |
| `test:quick`       | 15초          |

---

## 🎯 Best Practices

### 1. 가벼운 검증만 실행

```json
{
  "PostToolUse": [
    {
      "matcher": "Edit",
      "hooks": [
        {
          "command": "npm run type-check", // 빠른 타입 체크만
          "timeout": 30,
          "continueOnError": true // 에러 발생해도 계속
        }
      ]
    }
  ]
}
```

### 2. 프로젝트별 분리

```bash
# 프로젝트별 hooks 설정 파일
~/.claude/projects/openmanager-vibe/hooks.json
```

### 3. 선택적 활성화

```json
{
  "hooks": {
    "enabled": true,  // 전체 hooks 활성화/비활성화
    "PostToolUse": [...]
  }
}
```

---

## 🧪 테스트 방법

### 1. Hooks 동작 확인

```bash
# 1. 파일 편집
echo "test" >> src/test.ts

# 2. Claude Code로 파일 편집 시뮬레이션
# → PostToolUse Hook 자동 실행됨

# 3. 로그 확인
# Claude Code 출력에서 hook 실행 결과 확인
```

### 2. 성능 측정

```bash
# Hook 실행 시간 측정
time npm run type-check  # ~10초
time npm run format:check  # ~3초
```

---

## 📊 현재 프로젝트 상태

### Git Hooks (이미 구현됨)

| Hook               | 실행 시간 | 검증 내용               |
| ------------------ | --------- | ----------------------- |
| **pre-commit**     | < 5초     | Prettier + 보안 체크    |
| **pre-push**       | ~15초     | 유닛 테스트 + 보안 체크 |
| **CI/CD (Vercel)** | ~2분      | 전체 빌드 + 전체 테스트 |

### Claude Code Hooks (선택적)

- **PostToolUse (Edit)**: type-check (선택적)
- **PostToolUse (Write)**: format:check (선택적)

**권장:** Git hooks만으로도 충분하므로 Claude Code hooks는 선택적으로 사용

---

## 🔗 관련 문서

- [Claude Code 공식 Hooks 문서](https://docs.claude.com/en/docs/claude-code/hooks)
- [Git Hooks Best Practices](../standards/git-hooks-best-practices.md)
- [개인 워크플로우](workflows.md)

---

**💡 결론:** Git hooks가 이미 잘 구현되어 있으므로 Claude Code hooks는 개인 선호도에 따라 선택적으로 사용하세요.
