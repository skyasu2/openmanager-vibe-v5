# 서브에이전트 훅 설정 개선 보고서

생성일: 2025-08-03 11:38 KST

## 📋 요약

사용자 요청에 따라 서브에이전트 자동 실행 설정과 훅 설정을 분석하고 개선했습니다.

## 🔍 분석 결과

### 1. 서브에이전트 자동 실행 현황

- **17개 중 15개** 서브에이전트가 "Use PROACTIVELY when:" 키워드 포함
- Claude Code가 특정 상황에서 자동으로 서브에이전트 실행 가능
- 자연적인 컨텍스트 기반 실행이 주로 활용됨

### 2. Git Hooks 현황

- **기존**: 서브에이전트와 연동 없음
- **개선**: pre-commit, pre-push 훅에 서브에이전트 추천 시스템 추가

### 3. 훅 설정 제약사항

- Claude Code는 현재 command 타입 훅만 지원
- 서브에이전트 자동 실행 훅은 미지원
- PreToolUse 훅으로 스크립트 실행만 가능

## 🚀 구현 내용

### 1. Git Hooks 개선

#### Pre-push 훅 (`/.husky/pre-push`)

```bash
# TypeScript 타입 체크 실패 시
if [ "$TYPE_CHECK_FAILED" = "1" ]; then
    echo "📝 TypeScript 타입 에러 해결:"
    echo "Task({ subagent_type: 'code-review-specialist', prompt: 'TypeScript 타입 에러 수정' })"
fi

# 테스트 실패 시
if [ "$TEST_FAILED" = "1" ]; then
    echo "🧪 테스트 실패 해결:"
    echo "Task({ subagent_type: 'test-automation-specialist', prompt: '실패한 테스트 수정' })"
fi
```

#### Pre-commit 훅 (`/.husky/pre-commit`)

```bash
# Lint 실패 시
echo "🤖 서브에이전트 추천:"
echo "   - 코드 품질 검토: Task({ subagent_type: 'code-review-specialist', prompt: 'Lint 에러 수정' })"

# 보안 검사 실패 시
echo "   - 보안 감사: Task({ subagent_type: 'security-auditor', prompt: '하드코딩된 시크릿 제거' })"
```

### 2. 문서화

- `/docs/subagent-hooks-guide.md` 작성
- 서브에이전트 자동 실행 메커니즘 설명
- 권장 워크플로우 제시

## 📊 효율성 분석

### 훅 설정이 효과적인 경우

1. **반복적 에러 패턴**
   - 테스트 실패 → test-automation-specialist
   - 타입 에러 → code-review-specialist
   - 보안 문제 → security-auditor

2. **예측 가능한 워크플로우**
   - PR 생성 → code-review-specialist
   - 배포 전 → quality-control-checker
   - DB 작업 → database-administrator

### 자연적 선택이 효과적인 경우

1. **창의적 작업**
   - 새 기능 설계
   - 복잡한 문제 해결
   - 아키텍처 결정

2. **탐색적 작업**
   - 디버깅
   - 코드 리서치
   - 성능 최적화

## 💡 권장사항

1. **즉시 활용**
   - Git hooks의 서브에이전트 추천 메시지 활용
   - test:coordinate 스크립트로 주기적 분석

2. **향후 개선**
   - Claude Code 훅 시스템 확장 시 서브에이전트 타입 훅 추가
   - GitHub Actions에 서브에이전트 추천 통합

3. **베스트 프랙티스**
   - 에러 발생 시 추천된 서브에이전트 즉시 실행
   - 주기적 품질 검사로 선제적 문제 해결
   - Memory MCP로 서브에이전트 간 정보 공유

## 🎯 결론

현재 Claude Code의 제약사항 내에서 최적의 서브에이전트 활용 방안을 구현했습니다. Git hooks와 협업 코디네이터를 통해 효율적인 워크플로우를 구축했으며, 자연적 선택과 자동화의 균형을 맞췄습니다.
