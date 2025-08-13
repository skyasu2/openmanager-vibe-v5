# 📝 Git 워크플로우 간소화 가이드

> 2025-01-13 작성 - Claude Code 베스트 프랙티스 기반

## 🎯 핵심 원칙

Claude Code의 GitHub 기능을 최대한 활용하여 **단순하고 효율적인** Git 워크플로우 구현

## ✅ 권장 커밋 메시지 형식 (간소화)

### 이전 (과도하게 복잡함) ❌
```bash
git commit -m "$(cat <<'EOF'
✨ feat: Phase 5 완료 - 클라우드 네이티브 모니터링 및 프로덕션 준비

## 🎯 주요 성과

### 📊 클라우드 플랫폼 모니터링 (MCP 활용)
- ✅ Vercel: A급 성능 (90/100점) - 빌드 7초, 번들 190KB
- ✅ Supabase: 75/100점 - 무료티어 0.01% 사용 

[... 30줄 이상의 설명 ...]

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

### 현재 (단순하고 명확함) ✅
```bash
# Claude Code가 자동으로 diff에서 생성
git commit -m "feat: 클라우드 모니터링 개선 - Vercel A급 성능 달성"

# 또는 필요시 간단한 설명 추가
git commit -m "fix: TypeScript 타입 에러 65개 해결

- SystemEventHandler 타입 수정
- 테스트 커버리지 85% 달성"
```

## 🚀 개선된 워크플로우

### 1. 표준 커밋 (권장) ⭐
```bash
# Claude Code가 변경사항을 분석하여 자동으로 커밋 메시지 생성
git add .
git commit -m "feat: 새 기능 추가"  # 간단명료
git push
```

### 2. 긴급 수정 (빠른 배포)
```bash
# Hook 건너뛰기가 필요한 경우만
HUSKY=0 git commit -m "hotfix: 긴급 버그 수정"
git push
```

### 3. 대규모 변경 (PR 활용)
```bash
# 기능 브랜치 사용
git checkout -b feature/new-feature
git commit -m "feat: 대규모 리팩토링"
git push -u origin feature/new-feature

# Claude Code로 PR 생성 (자동으로 상세 설명 생성)
gh pr create --title "대규모 리팩토링" --body "주요 변경사항 요약"
```

## 📋 Conventional Commits 규칙

### 타입 (필수)
- `feat`: 새로운 기능
- `fix`: 버그 수정
- `docs`: 문서 변경
- `style`: 코드 포맷팅
- `refactor`: 리팩토링
- `test`: 테스트 추가/수정
- `chore`: 빌드/설정 변경

### 예시
```bash
feat: 사용자 인증 기능 추가
fix: 로그인 버그 수정
docs: README 업데이트
refactor: API 구조 개선
test: 유닛 테스트 추가
```

## 🛠️ Pre-commit Hook 최적화

### 현재 설정 유지
- **lint-staged**: 변경된 파일만 검사 (빠름)
- **보안 검사**: 하드코딩된 시크릿 체크 (중요)
- **HUSKY=0**: 필요시 bypass 가능

### 불필요한 요소 제거
- ❌ 복잡한 heredoc 구문
- ❌ 과도한 이모지 사용
- ❌ Co-Authored-By 태그 (Claude Code는 도구일 뿐)
- ❌ 30줄 이상의 커밋 메시지

## 🎯 Claude Code 활용 팁

### 1. 자동 커밋 메시지 생성
```bash
# Claude Code가 diff를 분석하여 적절한 메시지 제안
"현재 변경사항을 분석해서 conventional commit 메시지를 만들어줘"
```

### 2. Slash Commands 활용 (.claude/commands/)
```bash
# 커스텀 명령어 생성 가능
/commit  # 자동 커밋
/pr      # PR 생성
/deploy  # 배포
```

### 3. Hooks 시스템 활용
```json
// .claude/hooks.json
{
  "pre-commit": "npm run lint:fix",
  "pre-push": "npm test"
}
```

## 📊 개선 효과

| 항목 | 이전 | 현재 | 개선율 |
|------|------|------|--------|
| 커밋 메시지 길이 | 30-50줄 | 1-3줄 | 90% 감소 |
| 커밋 시간 | 2-3분 | 10-30초 | 80% 단축 |
| 복잡도 | 높음 | 낮음 | 크게 개선 |
| 가독성 | 낮음 | 높음 | 크게 개선 |

## ⚡ 빠른 참조

```bash
# 일반 커밋
git commit -m "feat: 기능 추가"

# 버그 수정
git commit -m "fix: 버그 수정"

# 긴급 배포 (검사 스킵)
HUSKY=0 git commit -m "hotfix: 긴급 수정"

# PR 생성
gh pr create --title "제목" --body "설명"
```

## 🔄 마이그레이션 계획

1. **즉시 적용**: 새로운 커밋부터 간소화된 형식 사용
2. **점진적 개선**: 기존 복잡한 설정 단계적 제거
3. **팀 교육**: 새로운 워크플로우 공유

## 📚 참고 자료

- [Conventional Commits](https://www.conventionalcommits.org/)
- [Claude Code Docs - Git Integration](https://docs.anthropic.com/en/docs/claude-code)
- [GitHub CLI Documentation](https://cli.github.com/)