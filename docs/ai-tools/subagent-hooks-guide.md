# 서브에이전트 훅 설정 가이드

생성일: 2025-08-03 11:34 KST

## 📋 개요

이 문서는 서브에이전트의 자동 실행과 훅 설정에 대한 가이드입니다.

## 🤖 서브에이전트 자동 실행 메커니즘

### 1. PROACTIVE 키워드 기반 자동 실행

Claude Code는 서브에이전트의 `description` 필드에 "Use PROACTIVELY when:" 키워드가 있으면 해당 상황에서 자동으로 실행합니다.

#### 현재 PROACTIVE 설정된 서브에이전트 (15개)

| 서브에이전트                 | 자동 실행 조건                                                |
| ---------------------------- | ------------------------------------------------------------- |
| `git-cicd-specialist`        | git commit/push 실패, pre-commit/pre-push 훅 실패, CI/CD 에러 |
| `debugger-specialist`        | 스택 트레이스 발견, 에러 로그 감지, 런타임 예외               |
| `code-review-specialist`     | 복잡한 함수 작성, 성능 중요 코드 수정, 타입 에러              |
| `test-automation-specialist` | npm test 실패, 커버리지 80% 미만, E2E 테스트 타임아웃         |
| `database-administrator`     | mcp**supabase**\* 도구 사용, Memory Cache 메모리 80% 초과     |
| `quality-control-checker`    | 커밋 전, PR 생성, 배포 준비, 주간 감사                        |
| `structure-refactor-agent`   | 새 기능 구조 검토, 중복 임계값 초과, 리팩토링 계획            |
| `documentation-manager`      | 새 기능 문서 필요, JBGE 원칙 위반, 30일+ 미사용 문서          |
| `ux-performance-optimizer`   | Core Web Vitals 최적화, Lighthouse 점수 90 미만               |
| `vercel-platform-specialist` | 배포 최적화, Edge Function 분석, 대역폭 모니터링              |
| `central-supervisor`         | 3개+ 도메인 작업, 풀스택 기능 요청, 긴급 대응                 |
| `backend-gcp-specialist`     | GCP Functions 배포, Python 백엔드 최적화                      |
| `test-first-developer`       | 새 기능 요청, 테스트 없이 코드 작성 시도                      |
| `gemini-cli-collaborator`    | 사용자 명시적 요청, 대규모 코드베이스 분석                    |
| `ai-systems-engineer`        | AI 쿼리 타임아웃, 한국어 처리 느림                            |

### 2. Git Hooks 통합

#### Pre-push 훅 개선사항

`.husky/pre-push` 파일에 서브에이전트 추천 시스템이 추가되었습니다:

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

## 🔧 현재 훅 설정

### settings.local.json의 hooks 섹션

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "mcp__supabase__.*",
        "hooks": [
          {
            "type": "command",
            "command": "./hooks/pre-database-hook-ultra-minimal.sh"
          }
        ]
      }
    ]
  }
}
```

**주의**: 현재 Claude Code는 command 타입의 훅만 지원합니다. 서브에이전트 자동 실행 훅은 아직 지원되지 않습니다.

## 📊 서브에이전트 협업 코디네이터

### 사용 방법

```bash
# 단일 분석 실행
npm run test:coordinate

# 실시간 모니터링 (5분 간격)
npm run test:monitor

# 10분 간격 모니터링
tsx scripts/sub-agent-coordinator.ts --monitor 10

# 에이전트 작업 완료 표시
tsx scripts/sub-agent-coordinator.ts --complete test-automation-specialist --notes "테스트 3개 수정"
```

### 자동 추천 시나리오

1. **테스트 실패 많음 (5개+)**
   - `debugger-specialist`: 근본 원인 분석
2. **불안정한 테스트 발견**
   - `test-automation-specialist`: 테스트 안정화
3. **느린 테스트 (2초+)**
   - `ux-performance-optimizer`: 성능 최적화
4. **TDD RED 테스트**
   - `test-first-developer`: RED → GREEN 전환
5. **전체 테스트 성공률 < 80%**
   - `code-review-specialist`: 코드 품질 검토

## 🎯 권장 워크플로우

### 1. 커밋/푸시 워크플로우

```
1. git commit
   ↓
2. pre-commit 훅 실행 (lint-staged, 보안 검사)
   ↓
3. git push
   ↓
4. pre-push 훅 실행 (타입 체크, 테스트)
   ↓
5. 실패 시 서브에이전트 추천 메시지 표시
   ↓
6. Task 도구로 추천된 서브에이전트 실행
```

### 2. 주기적 품질 검사

```bash
# crontab에 추가 (매일 오전 9시)
0 9 * * * cd /path/to/project && npm run test:coordinate
```

### 3. CI/CD 통합

GitHub Actions나 다른 CI/CD 파이프라인에서 실패 시:

1. `git-cicd-specialist`가 자동으로 개입
2. 문제 해결 후 자동 재시도

## 💡 효율성 팁

### 자연적 선택이 더 좋은 경우

- 일반적인 코드 작성/수정
- 탐색적 디버깅
- 창의적 문제 해결
- 아키텍처 설계

### 훅 설정이 더 좋은 경우

- 반복적인 검증 작업
- 예측 가능한 에러 패턴
- 규칙 기반 검사
- 정기적인 품질 감사

## 🚀 향후 개선 계획

1. **Claude Code 훅 시스템 확장**
   - 서브에이전트 타입 훅 지원
   - 조건부 실행 로직
2. **스마트 컨텍스트 전달**
   - 에러 정보 자동 수집
   - 서브에이전트에 컨텍스트 전달
3. **성공률 추적**
   - 서브에이전트 추천 성공률 모니터링
   - 머신러닝 기반 추천 개선

## 📚 관련 문서

- [서브에이전트 협업 가이드](/docs/sub-agent-collaboration-guide.md)
- [서브에이전트 MCP 매핑 가이드](/docs/sub-agents-mcp-mapping-guide.md)
- [테스트 시스템 가이드](/docs/testing-system-guide.md)
