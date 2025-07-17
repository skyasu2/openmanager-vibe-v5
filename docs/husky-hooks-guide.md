# 🪝 Husky Git Hooks 가이드

> **최종 업데이트**: 2025년 7월 17일  
> **적용 버전**: v5.46.42  
> **문제 해결**: pre-push 훅 오류 수정

## 📋 개요

Husky Git hooks가 최신 버전에서 deprecated되어 새로운 방식으로 수정되었습니다.

## 🔧 현재 설정

### Pre-commit Hook

```bash
# .husky/pre-commit
#!/bin/sh

# 타입 체크와 린트를 실행
npm run type-check && npm run lint
```

**실행 내용**:
- TypeScript 타입 체크
- ESLint 코드 품질 검사

### Pre-push Hook

```bash
# .husky/pre-push
#!/bin/sh

# 전체 품질 검사
npm run type-check && npm run lint && npm run test:quick
```

**실행 내용**:
- TypeScript 타입 체크
- ESLint 코드 품질 검사
- 빠른 테스트 실행

## 🚀 사용법

### 정상 작동

```bash
# 일반적인 커밋과 푸시
git commit -m "feat: 새 기능 추가"
git push origin main
```

### Hook 건너뛰기

```bash
# 긴급한 경우 hook을 건너뛸 수 있습니다
HUSKY=0 git commit -m "hotfix: 긴급 수정"
HUSKY=0 git push origin main

# 또는
git commit --no-verify -m "hotfix: 긴급 수정"
git push --no-verify origin main
```

## 🐛 문제 해결

### 1. "cannot open .husky/_/husky.sh" 오류

이전 버전의 Husky 구문이 사용되고 있습니다. 다음 라인을 제거하세요:

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"
```

대신 다음을 사용하세요:

```bash
#!/bin/sh
```

### 2. 권한 오류

```bash
chmod +x .husky/pre-commit
chmod +x .husky/pre-push
```

### 3. WSL 환경 문제

WSL에서는 다음과 같이 설정하세요:

```bash
# Git이 WSL의 실행 권한을 인식하도록 설정
git config core.filemode true
```

## 📝 Hook 추가/수정

### 새 Hook 추가

```bash
# 예: pre-merge hook 추가
echo '#!/bin/sh
echo "🔀 Merge 전 검증..."
npm run test:unit
' > .husky/pre-merge

chmod +x .husky/pre-merge
```

### 기존 Hook 수정

1. `.husky/` 디렉토리의 해당 파일 편집
2. 실행 권한 확인 (`chmod +x`)
3. 테스트 실행

## ⚙️ 권장 설정

### 개발 환경

```bash
# 개발 중에는 빠른 피드백을 위해 가벼운 검사만
echo '#!/bin/sh
npm run lint
' > .husky/pre-commit
```

### 프로덕션 환경

```bash
# 프로덕션 배포 전 전체 검증
echo '#!/bin/sh
npm run type-check && npm run lint && npm run test && npm run build
' > .husky/pre-push
```

## 🎯 팁

1. **시간 단축**: `test:quick` 스크립트로 빠른 테스트만 실행
2. **선택적 실행**: 환경 변수로 특정 검사만 실행
3. **CI/CD 통합**: GitHub Actions와 동일한 검증 수행

## 🔗 관련 문서

- [Git Hooks 공식 문서](https://git-scm.com/docs/githooks)
- [Husky 공식 문서](https://typicode.github.io/husky/)
- [개발 도구 가이드](./development-tools.md)