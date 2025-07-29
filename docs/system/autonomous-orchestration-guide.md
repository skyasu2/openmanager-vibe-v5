# 🤖 Claude Code 자율 오케스트레이션 가이드

## 핵심 원칙: Claude Code의 자율적 판단 존중

### ❌ 잘못된 접근 (과도한 훅 개입)
```bash
# 훅이 강제로 서브에이전트 호출
if [[ "$FILE" =~ \.(ts|tsx|js|jsx)$ ]]; then
    delegate_to_subagent "code-review-specialist" "코드 리뷰"
fi
```

### ✅ 올바른 접근 (자율적 판단)
```bash
# Claude Code가 알아서 판단
# - 코드 복잡도 분석
# - 변경 규모 평가  
# - 필요한 에이전트 자동 선택
# - 병렬/순차 실행 최적화
```

## 🎯 Claude Code의 지능적 오케스트레이션

### 1. 자동 병렬 처리
```typescript
// Claude Code가 자동으로 병렬 실행 판단
Task({ subagent_type: 'security-auditor', prompt: '보안 검사' });
Task({ subagent_type: 'test-automation-specialist', prompt: '테스트 작성' });
Task({ subagent_type: 'ux-performance-optimizer', prompt: '성능 최적화' });
// → 독립적인 작업은 자동으로 병렬 처리
```

### 2. 순차적 의존성 관리
```typescript
// Claude Code가 의존성 파악하여 순차 실행
Task({ subagent_type: 'debugger-specialist', prompt: '버그 원인 분석' });
// → 분석 완료 후 자동으로 다음 단계 진행
Task({ subagent_type: 'code-review-specialist', prompt: '수정 사항 검토' });
```

### 3. 적응적 에이전트 선택
```markdown
사용자: "이 코드 개선해줘"

Claude Code 자율 판단:
- 코드 규모 작음 → 직접 처리
- 복잡한 리팩토링 → code-review-specialist 호출
- 성능 이슈 포함 → ux-performance-optimizer 추가
- 보안 관련 코드 → security-auditor 자동 포함
```

## 🚫 훅의 최소 역할

### 1. 파괴적 작업 차단만
```bash
# pre-database-hook-minimal.sh
if [[ "$QUERY" =~ (DROP DATABASE|DROP TABLE|TRUNCATE) ]]; then
    echo "🚨 위험한 작업 차단"
    exit 1  # 차단만 하고 끝
fi
# 다른 모든 판단은 Claude Code에게 위임
```

### 2. 정보 제공만
```bash
# 강제 호출 ❌
delegate_to_subagent "database-administrator" 

# 정보 제공만 ✅
echo "💡 DB 관련 작업입니다"
# Claude Code가 필요하면 알아서 database-administrator 호출
```

## 📊 효과적인 사용 패턴

### 사용자 명시적 요청
```markdown
사용자: "보안 검사 해줘"
→ Claude Code: security-auditor 직접 호출

사용자: "코드 개선해줘"  
→ Claude Code: 상황 판단 후 필요한 에이전트들 자동 선택
```

### Claude Code 자율 판단
```markdown
복잡한 작업 요청 시:
1. 작업 분석
2. 필요한 에이전트 자동 식별
3. 최적 실행 순서 결정
4. 병렬 가능한 작업 동시 실행
5. 결과 통합 및 보고
```

## 🔧 권장 설정

### 훅 설정 (극도로 최소화)
```json
{
  "hooks": {
    "PreToolUse": [{
      "comment": "파괴적 DB 작업만 차단",
      "matcher": "mcp__supabase__.*",
      "hooks": [{
        "type": "command",
        "command": "./hooks/safety-check.sh"
      }]
    }]
  }
}
```

### 서브에이전트 설정
```yaml
# 모든 에이전트에서 제거
- trigger: "PROACTIVELY"  # ❌
+ trigger: "ON_DEMAND"     # ✅

# Claude Code가 필요시 자동 호출
# 사용자가 명시적 요청시 호출
```

## 💡 핵심 철학

> **"Claude Code를 믿고 자율성을 부여하라"**

1. **훅은 안전장치만**: 파괴적 작업 차단에만 사용
2. **강제 위임 금지**: delegate_to_subagent 완전 제거
3. **자율적 판단 존중**: Claude Code의 지능적 결정 신뢰
4. **유연한 실행**: 상황에 따른 최적 전략 자동 선택

## 🎯 기대 효과

| 항목 | 기존 시스템 | 자율 시스템 |
|------|-----------|------------|
| 의사결정 | 훅이 강제 | Claude Code 자율 |
| 유연성 | 경직됨 | 상황별 최적화 |
| 성능 | 불필요한 호출 많음 | 필요시만 호출 |
| 사용자 경험 | 예측 가능하나 비효율 | 지능적이고 효율적 |

---

**결론**: 훅의 과도한 개입을 제거하고 Claude Code의 자율적 오케스트레이션 능력을 최대한 활용하는 것이 가장 효과적입니다.