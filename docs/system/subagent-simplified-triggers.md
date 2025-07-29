# 서브에이전트 트리거 조건 간소화 가이드

## 🎯 핵심 원칙: 자동 실행 최소화, 명시적 호출 권장

### Before: 너무 빈번한 자동 트리거 ❌

```markdown
# code-review-specialist
Use PROACTIVELY when:
- Write/Edit/MultiEdit on *.ts|*.tsx|*.js|*.jsx files completed
- git diff detects changes in api/|services/|components/
- pre-PR creation
- post-commit with >3 files changed
- test failures detected
- TypeScript errors found
```

### After: 명시적 호출 위주 ✅

```markdown
# code-review-specialist
Use ON REQUEST when:
- User explicitly requests code review
- PR creation with review needed
- Critical security files modified (auth/payment)

AVOID automatic triggers for routine edits
```

## 📋 서브에이전트별 간소화된 트리거

### 1. database-administrator
```markdown
# Before (너무 많은 자동 트리거)
- mcp__supabase__* tool usage detected
- schema files modified
- API response time >500ms
- Redis memory usage >80%
- Query execution time >100ms

# After (필수만)
- User requests database optimization
- DROP/TRUNCATE commands attempted
- Production database migration needed
```

### 2. security-auditor
```markdown
# Before (모든 보안 파일에 자동)
- auth/admin/payment files modified
- API endpoints created or updated
- User input handling code added
- Database queries written

# After (명시적 요청)
- User requests security audit
- Deployment to production
- New authentication flow implementation
```

### 3. test-automation-specialist
```markdown
# Before (테스트 실패마다)
- Test commands fail
- Coverage drops below 80%
- Write/Edit on test files
- New components without tests

# After (필요시만)
- User requests test creation
- Major feature completion
- Coverage report requested
```

### 4. debugger-specialist
```markdown
# Before (모든 에러에)
- Stack traces found
- Error logs detected
- API timeouts occur
- Runtime exceptions thrown

# After (복잡한 문제만)
- User reports unexplained behavior
- Recurring errors after fixes
- Performance degradation investigation
```

### 5. code-review-specialist
```markdown
# Before (모든 코드 수정)
- Any *.ts/*.tsx file modified
- Multiple files changed
- Pre-commit hooks

# After (중요한 변경만)
- User requests review
- Architecture changes
- New API endpoints
```

## 🔧 구현 방법

### 1. 훅에서 권장으로 변경

```bash
# Before: 자동 위임
delegate_to_subagent "code-review-specialist" "코드 리뷰"

# After: 권장만
echo "💡 코드 리뷰가 필요하면:"
echo "   Task(subagent_type='code-review-specialist', ...)"
```

### 2. 에이전트 설정 파일 수정

```yaml
# Before
trigger: "PROACTIVELY"
conditions: ["많은", "자동", "조건들"]

# After  
trigger: "ON_REQUEST"
conditions: ["명시적 요청", "중요한 작업만"]
```

### 3. 사용자 중심 워크플로우

```markdown
# 사용자가 원할 때만
"코드 리뷰 해줘" → code-review-specialist 실행
"DB 최적화 필요해" → database-administrator 실행
"보안 검사 해줘" → security-auditor 실행

# 자동 실행은 최소화
- 위험한 DB 작업 시도 시만 자동 차단
- 나머지는 모두 권장 메시지
```

## 📊 효과

| 지표 | 변경 전 | 변경 후 |
|-----|---------|---------|
| 자동 트리거 빈도 | 매우 높음 | 최소 |
| 사용자 제어권 | 낮음 | 높음 |
| 시스템 복잡도 | 높음 | 낮음 |
| 개발 흐름 방해 | 자주 | 거의 없음 |

## 💡 추천 사용 패턴

### 일상 개발
- 훅은 조용히 백그라운드에서 최소한의 보호만 제공
- 필요할 때 사용자가 직접 서브에이전트 호출

### 중요한 작업
- PR 생성 전: "code-review 실행해줘"
- 배포 전: "security audit 실행해줘"
- 성능 문제: "performance check 해줘"

### 위험한 작업
- DB 삭제 시도: 자동 차단 (유일한 자동 개입)
- 보안 파일 수정: 권장 메시지만 표시

---

**목표**: 개발자가 필요할 때만 도움을 요청하는 자연스러운 워크플로우