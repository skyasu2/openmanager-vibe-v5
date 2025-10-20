# Progressive Lint Strategy Guide

**목적**: 대규모 코드베이스 변경 시 점진적 품질 개선 전략

---

## 🎯 기본 원칙

**기본값: Strict Mode (엄격 모드)**

- Pre-commit hook: `--max-warnings=0` (자동 실행)
- CI pipeline: `--max-warnings=0` (자동 실행)
- 모든 ESLint 경고를 에러로 처리

**Progressive Mode는 예외 상황 전용 "Escape Hatch"**

---

## 🚨 언제 사용하는가?

### ✅ 사용해야 하는 경우

1. **Next.js 메이저 업그레이드** (예: v14 → v15)
   - 새로운 ESLint 규칙 도입 시
   - 100개 이상의 경고가 한 번에 발생하는 경우

2. **TypeScript 대규모 마이그레이션**
   - `any` → `unknown` 전환
   - strict mode 활성화

3. **대규모 리팩토링**
   - 아키텍처 전체 재설계
   - 디렉토리 구조 변경

### ❌ 사용하지 말아야 하는 경우

- ❌ 일반적인 개발
- ❌ 버그 수정
- ❌ 작은 기능 추가
- ❌ "귀찮아서"

---

## 📋 사용 방법

### 1단계: Pre-commit Hook 비활성화

```bash
# 환경변수로 Husky 비활성화
HUSKY=0 git commit -m "WIP: 대규모 리팩토링 중"
```

### 2단계: Progressive Lint 실행

```bash
# 최대 50개 경고까지 허용
npm run lint:progressive
```

### 3단계: 점진적 개선

```bash
# 현재 경고 개수 확인
npm run lint:progressive 2>&1 | grep "warnings"

# 목표: 50 → 25 → 10 → 5 → 0
```

### 4단계: Strict Mode 복귀

```bash
# 최종 검증
npm run lint:strict

# ✅ 0 warnings 달성 시
git commit -m "feat: 리팩토링 완료 (0 warnings)"
```

---

## ⚠️ 주의사항

### CI는 여전히 Strict Mode

```yaml
# .github/workflows/simple-deploy.yml
- name: Lint check (품질 게이트)
  run: npm run lint:strict # --max-warnings=0
```

**의미**: Progressive Mode로 로컬 작업 가능하지만, **PR 머지 전 반드시 0 warnings 달성 필수**

### 절대 Merge하지 말 것

```bash
# ❌ 절대 금지
git push origin feature/with-warnings

# ✅ 올바른 방법
# 1. 로컬에서 0 warnings 달성
npm run lint:strict
# 2. 성공 후 push
git push origin feature/completed
```

---

## 📊 실제 시나리오 예시

### 시나리오 1: Next.js 15 업그레이드

```bash
# 1. 업그레이드 실행
npm install next@15

# 2. 새로운 ESLint 규칙으로 120개 경고 발생
npm run lint:strict
# ❌ Error: ESLint found 120 warnings

# 3. Progressive Mode 활성화
HUSKY=0 npm run lint:progressive
# ✅ 50개 이하로 줄일 때까지 작업

# 4. 점진적 개선
# Day 1: 120 → 50 warnings
# Day 2: 50 → 25 warnings
# Day 3: 25 → 0 warnings

# 5. Strict Mode 복귀
npm run lint:strict
# ✅ No warnings

# 6. Commit & Push
git commit -m "feat: upgrade to Next.js 15 (0 warnings)"
git push
```

### 시나리오 2: TypeScript strict 모드 활성화

```bash
# 1. tsconfig.json 수정
# "strict": true

# 2. 200개 타입 에러 발견
npm run type-check
# ❌ 200 type errors

# 3. Progressive Lint로 ESLint 경고 관리
HUSKY=0 npm run lint:progressive

# 4. 일주일 동안 점진적 수정
# Week 1: Fix 80% of issues
# Week 2: Fix remaining 20%

# 5. 완료
npm run lint:strict && npm run type-check
# ✅ 0 warnings, 0 type errors
```

---

## 🔧 기술 세부사항

### lint:progressive Script

```json
{
  "scripts": {
    "lint:progressive": "eslint . --max-warnings=50 --cache"
  }
}
```

**옵션 설명**:

- `--max-warnings=50`: 최대 50개 경고까지 허용
- `--cache`: 캐시 활용으로 속도 향상
- `.`: 전체 프로젝트 검사

### 왜 50개인가?

- **10개**: 너무 적음 (대규모 변경 불가능)
- **50개**: 적당함 (한 번에 수정 가능한 양)
- **100개**: 너무 많음 (품질 관리 어려움)

---

## 📚 관련 문서

- [Git Hooks Best Practices](../claude/standards/git-hooks-best-practices.md)
- [TypeScript Rules](../claude/standards/typescript-rules.md)
- [CI/CD Workflows](../claude/environment/workflows.md)

---

## 💡 핵심 메시지

> **"Progressive Mode는 최후의 수단이다"**
>
> 기본은 항상 Strict Mode (`--max-warnings=0`).
>
> Progressive Mode는 대규모 변경 시 임시로만 사용하고,
>
> **반드시 0 warnings로 복귀해야 한다**.

---

**작성일**: 2025-10-20
**버전**: 1.0.0
**상태**: Active
