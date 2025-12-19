---
id: auto-code-review
title: 자동 코드 리뷰 워크플로우
keywords: [code-review, automation, codex, gemini, git-hooks, ci]
priority: high
ai_optimized: true
related_docs:
  - '../standards/git-hooks-best-practices.md'
  - '../standards/commit-conventions.md'
  - 'progressive-lint-guide.md'
updated: '2025-12-19'
version: 'v5.83.1'
---

# 🤖 자동 코드 리뷰 워크플로우

**Codex → Gemini 폴백 자동 리뷰 + Claude Code 개선 시스템** (v2.0.0)

---

## 📋 개요

Git 커밋 시 자동으로 AI가 변경사항을 리뷰하고, Claude Code가 그 결과를 분석하여 개선점을 파악하는 워크플로우입니다.

### 🎯 목적

- **자동화**: 커밋 시 자동으로 AI 리뷰 실행 (Codex 우선, Gemini 폴백)
- **품질 향상**: 실무 관점의 코드 검토
- **안정성**: 99.9% 가용성 보장 (Codex OR Gemini)
- **효율성**: Claude Code가 리뷰 결과를 빠르게 분석

### 🔄 AI 엔진 전략 (v2.0.0)

**Codex → Gemini 자동 폴백**:
- **1차**: Codex CLI 우선 시도 (GPT-5 기반)
- **2차**: Rate limit/quota 감지 시 Gemini CLI로 자동 폴백
- **결과**: AI 엔진 이름이 리뷰 파일명에 자동 표시 (`review-{AI}-{DATE}-{TIME}.md`)

---

## 🚀 사용 방법

### 1️⃣  일반적인 커밋 (자동 리뷰)

```bash
# 변경사항 커밋
git add .
git commit -m "✨ feat: 새 기능 추가"

# 자동 실행됨:
# - .husky/pre-commit: Serena 안티패턴 검사
# - .husky/post-commit: AI 자동 리뷰 (Codex → Gemini 폴백, 백그라운드)
```

**결과**:
- 리뷰 파일이 `logs/code-reviews/review-{AI}-YYYY-MM-DD-HH-MM-SS.md`에 자동 생성
  - `{AI}`: `codex` (성공 시) 또는 `gemini` (폴백 시)
- 백그라운드로 실행되므로 커밋은 즉시 완료
- Rate limit 발생 시 자동으로 Gemini로 전환 (사용자 개입 불필요)

---

### 2️⃣  리뷰 결과 확인 (Claude Code)

Claude Code에서 다음과 같이 요청하세요:

```
방금 커밋한 코드를 Codex가 리뷰했어. 
scripts/code-review/analyze-codex-review.sh 실행해서 
리뷰 결과를 분석하고 개선점이 있으면 알려줘.
```

**또는 직접 실행**:

```bash
./scripts/code-review/analyze-codex-review.sh
```

**출력 예시**:
```
📊 Codex 리뷰 분석 중...

📈 분석 결과:
  - 종합 점수: 8/10
  - 버그 위험: 2 항목
  - 보안 이슈: 1 항목

💬 Claude Code에게 전달할 메시지
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Codex가 방금 커밋한 변경사항을 리뷰했습니다.

📂 리뷰 파일: logs/code-reviews/review-2025-11-19-14-30-45.md

다음 작업을 수행해주세요:
1️⃣  리뷰 파일 확인
2️⃣  개선 필요 사항 파악
3️⃣  코드 수정 제안
4️⃣  재커밋 여부 판단
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

### 3️⃣  개선 및 재커밋

Claude Code의 분석 결과를 바탕으로:

```bash
# 필요한 수정 수행
# (Claude Code가 제안한 개선사항 적용)

# 재커밋
git add .
git commit -m "🔧 fix: Codex 리뷰 반영 - 타입 안전성 개선"
```

---

## 📊 리뷰 리포트 구조

### 생성된 리뷰 파일 예시

```markdown
# 🤖 Codex 자동 코드 리뷰 리포트

**날짜**: 2025-11-19 14:30:45
**커밋**: `abc1234`
**브랜치**: `main`

---

## 📊 변경사항 요약

## 📄 src/components/LoginClient.tsx

```diff
- const [user, setUser] = useState<any>(null);
+ const [user, setUser] = useState<User | null>(null);
```

---

## 🤖 Codex 리뷰 결과

### 1️⃣  버그 위험
- ❌ any 타입 사용으로 인한 타입 안전성 상실
- ⚠️  null 체크 누락 가능성

### 2️⃣  개선 제안
- ✅ User 인터페이스 정의 권장
- 💡 null 체크 로직 강화

### 3️⃣  TypeScript 안전성
- 🔴 any 타입 1개 발견
- 🟢 타입 단언은 적절히 사용됨

### 4️⃣  보안 이슈
- ✅ 보안 취약점 없음

### 5️⃣  종합 평가
- ⭐ 점수: 8/10
- ✅ 승인: 조건부 승인 (타입 개선 권장)

---

## 📋 체크리스트

- [ ] 버그 위험 사항 확인 완료
- [ ] 개선 제안 검토 완료
- [ ] TypeScript 안전성 확인 완료
- [ ] 보안 이슈 확인 완료
- [ ] 종합 평가 확인 완료
```

---

## 🔧 설정 파일

### `.husky/post-commit`

```bash
# Auto AI Code Review (Codex → Gemini Fallback, 백그라운드 실행)
if [ -f "scripts/code-review/auto-ai-review.sh" ]; then
    echo "🤖 Starting AI code review (Codex → Gemini fallback)..."
    bash scripts/code-review/auto-ai-review.sh &
    echo "   ✅ Review will be saved to logs/code-reviews/"
fi
```

**특징**:
- 백그라운드 실행 (`&`)으로 커밋 즉시 완료
- 리뷰는 비동기로 진행
- Codex 실패 시 자동으로 Gemini로 폴백 (사용자 개입 불필요)

---

## 💡 활용 팁

### 1️⃣  리뷰 전 확인사항

```bash
# 커밋 전 변경사항 확인
git diff --cached

# Serena 안티패턴 수동 검사 (선택)
.husky/pre-commit
```

### 2️⃣  리뷰 히스토리 관리

```bash
# 최근 7일 리뷰 목록
find logs/code-reviews -name "review-*.md" -mtime -7

# 특정 날짜 리뷰 확인
cat logs/code-reviews/review-2025-11-19-*.md
```

### 3️⃣  Claude Code 통합 패턴

**권장 프롬프트**:
```
최신 Codex 리뷰를 분석하고, 
심각한 문제가 있으면 수정 제안해줘.
우선순위는:
1. 보안 이슈 (최우선)
2. 버그 위험
3. TypeScript 안전성
4. 성능/가독성 개선
```

---

## 🎯 기대 효과

### 품질 향상

- ✅ **자동화**: 커밋마다 일관된 코드 리뷰
- 🔍 **실무 관점**: Codex의 GPT-5 기반 분석
- 📊 **정량 평가**: 점수 및 체크리스트

### 효율성

- ⚡ **백그라운드 실행**: 커밋 지연 없음
- 🤖 **Claude Code 통합**: 분석 및 개선 자동화
- 📝 **히스토리 관리**: 리뷰 기록 자동 저장

### 학습 효과

- 📚 **패턴 학습**: 반복되는 리뷰 피드백을 통한 개선
- 🎓 **베스트 프랙티스**: 실무 관점의 코드 작성법 습득

---

## 🔗 관련 문서

- **[CLAUDE.md](../../../CLAUDE.md)** - 메인 프로젝트 가이드
- **[서브에이전트 가이드](../ai/claude-code/subagents-complete-guide.md)** - codex-specialist
- **[AI 코딩 표준](../ai/common/ai-coding-standards.md)** - 코드 리뷰 기준

---

**💡 핵심**: 자동화 + 분석 + 개선의 3단계 워크플로우로 코드 품질을 지속적으로 향상시킵니다!
