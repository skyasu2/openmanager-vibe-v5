# Development Workflows

개발 워크플로우 가이드 문서 모음입니다.

## 문서 목록

| 문서 | 설명 |
|------|------|
| [Auto Code Review](./auto-code-review.md) | 자동 코드 리뷰 워크플로우 |
| [Progressive Lint Guide](./progressive-lint-guide.md) | 점진적 린트 적용 가이드 |

## 핵심 워크플로우

### 1. 코드 리뷰
```bash
npm run validate:all     # 전체 검증
./scripts/code-review/auto-ai-review.sh  # AI 코드 리뷰
```

### 2. 커밋 전 검증
```bash
git add .
git commit  # pre-commit 훅 자동 실행
```

## 관련 문서

- [Standards](../standards/) - 개발 표준
- [AI Workflow](../ai/common/workflow.md) - AI 협업 워크플로우

---

**Last Updated**: 2025-12-19
