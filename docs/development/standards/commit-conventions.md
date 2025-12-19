---
id: commit-conventions
title: 커밋 컨벤션
keywords: [git, commit, convention, emoji, message]
priority: high
ai_optimized: true
related_docs:
  - 'git-hooks-best-practices.md'
  - '../../ai/common/workflow.md'
updated: '2025-12-19'
version: 'v5.83.1'
---

# 커밋 컨벤션

## 🎯 기본 원칙

**이모지 + 간결한 메시지** - 모든 커밋에 이모지 필수

---

## 📝 커밋 타입

### 주요 타입

| 이모지 | 타입 | 설명 | 예시 |
|--------|------|------|------|
| ✨ | **feat** | 새 기능 추가 | ✨ feat: AI 교차검증 시스템 추가 |
| 🐛 | **fix** | 버그 수정 | 🐛 fix: 타임아웃 오류 해결 |
| ♻️ | **refactor** | 리팩토링 | ♻️ refactor: AI 라우터 구조 개선 |
| 🔧 | **chore** | 빌드/설정 변경 | 🔧 chore: TypeScript strict 모드 활성화 |
| 📝 | **docs** | 문서 수정 | 📝 docs: CLAUDE.md 업데이트 |
| 🎨 | **style** | 코드 포맷팅 | 🎨 style: Prettier 적용 |
| 🧪 | **test** | 테스트 추가/수정 | 🧪 test: E2E 테스트 추가 |
| ⚡ | **perf** | 성능 개선 | ⚡ perf: StaticDataLoader 최적화 |
| 🔒 | **security** | 보안 개선 | 🔒 security: RLS 정책 강화 |
| 🚀 | **deploy** | 배포 관련 | 🚀 deploy: Vercel 프로덕션 배포 |

---

## ✍️ 커밋 메시지 작성 규칙

### 1. 구조
```
<이모지> <타입>: <제목>

[선택] <본문>

[선택] <푸터>
```

### 2. 제목 규칙
- **50자 이내**: 간결하게
- **명령형**: "추가했다" (X) → "추가" (O)
- **마침표 없음**: 끝에 마침표 사용 안 함
- **한글/영어 혼용 가능**: 기술 용어는 영어 사용

### 3. 본문 (선택사항)
- **72자마다 줄바꿈**
- **무엇을, 왜** 변경했는지 설명
- How보다는 What과 Why에 집중

### 4. 푸터 (선택사항)
- **이슈 참조**: `Closes #123`, `Fixes #456`
- **Breaking Changes**: `BREAKING CHANGE: 설명`

---

## ✅ 올바른 예시

### 예시 1: 간단한 커밋
```bash
✨ feat: AI 교차검증 시스템 추가
```

### 예시 2: 상세한 커밋
```bash
🐛 fix: Codex 타임아웃 오류 해결

- 타임아웃을 15초에서 30초로 증가
- P95 응답 시간 기준 안전 계수 1.67 적용
- 복잡한 코드 분석 시 100% 성공률 달성

Closes #234
```

### 예시 3: Breaking Change
```bash
♻️ refactor: AI 엔진 라우터 구조 변경

BREAKING CHANGE: AIEngine 인터페이스 변경
- queryAI() → query() 메서드 이름 변경
- 기존 코드 마이그레이션 필요
```

---

## ❌ 잘못된 예시

### 예시 1: 이모지 누락
```bash
feat: 새 기능 추가  # ❌ 이모지 필수
```

### 예시 2: 모호한 메시지
```bash
✨ feat: 수정  # ❌ 무엇을 수정했는지 불명확
```

### 예시 3: 과도하게 긴 제목
```bash
✨ feat: AI 교차검증 시스템을 추가하고 Codex, Gemini, Qwen을 통합하여 병렬 실행 가능하게 만듦  # ❌ 50자 초과
```

---

## 🔄 여러 변경사항이 있을 때

### 원칙: 논리적 단위로 분리

```bash
# ✅ 올바른 방법 (분리된 커밋)
git commit -m "✨ feat: TOC 자동 생성 기능 추가"
git commit -m "📝 docs: 버전 정보 중앙 관리"
git commit -m "♻️ refactor: Import 구조로 전환"

# ❌ 잘못된 방법 (한 커밋에 여러 작업)
git commit -m "✨ feat: 여러 기능 추가 및 문서 수정"
```

---

## 🎯 Side-Effect 고려

**모든 커밋은 사이드 이펙트를 고려해야 합니다**

### 체크리스트
- [ ] 관련 테스트 업데이트 완료
- [ ] 관련 문서 업데이트 완료
- [ ] 의존성 있는 코드 동시 수정 완료
- [ ] Breaking Change 문서화 완료

### 예시
```bash
✨ feat: AI 모드 선택 UI 추가

- AIModeSelector 컴포넌트 구현
- 관련 타입 정의 업데이트 (ai-types.ts)
- E2E 테스트 추가 (ai-assistant.spec.ts)
- 문서 업데이트 (CLAUDE.md)
```

---

## 📊 Git 커밋 자동화

### Claude Code에서 커밋
```bash
# Claude Code가 자동으로 생성
✨ feat: StaticDataLoader v5.71.0 적용

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>
```

### Pre-commit Hook
```bash
# .husky/pre-commit
npm run lint
npm run type-check
```

---

## 💡 실무 팁

1. **작은 커밋**: 한 가지 목적만 포함
2. **자주 커밋**: 작업 단위마다 커밋
3. **명확한 메시지**: 6개월 후에도 이해 가능하게
4. **이슈 연결**: 가능하면 이슈 번호 포함
