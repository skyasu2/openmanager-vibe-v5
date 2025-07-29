# 🚨 서브에이전트 시스템 주요 문제점 및 즉시 개선 필요사항

## 📊 점검 결과 요약

전체 13개 서브에이전트 점검 결과, **5개 카테고리에서 심각한 문제점** 발견:

### 1. 🔴 역할 중복 (Critical)
| 중복 에이전트 | 문제점 | 즉시 개선 방안 |
|-------------|--------|--------------|
| debugger-specialist ↔ code-review-specialist | 코드 분석 영역 중첩 | debugger는 런타임 오류만, code-review는 정적 분석만 |
| doc-structure-guardian ↔ doc-writer-researcher | 문서 관리 책임 모호 | guardian은 정리/구조화, writer는 신규 작성만 |
| issue-summary ↔ central-supervisor | 모니터링 역할 혼재 | issue는 외부 서비스, central은 에이전트 조율만 |

### 2. 🟡 MCP 권한 과다
- **code-review-specialist**: `mcp__serena__*` 불필요
- **test-automation-specialist**: `mcp__github__*` 과다
- **gemini-cli-collaborator**: 대부분 MCP 불필요
- **security-auditor**: `mcp__supabase__*` 누락 (추가 필요)

### 3. 🟡 구조적 문제
- YAML frontmatter 형식 불일치
- Read 우선 규칙이 13개 파일에 중복 (420줄 중복!)
- 섹션 구조와 언어 사용 불일치

### 4. 🟡 트리거 조건 문제
- **너무 광범위**: code-review가 모든 TS 파일 수정에 트리거
- **너무 모호**: "Claude needs alternative perspective" 같은 주관적 조건
- **측정 불가능**: 객관적 지표 부재

### 5. 🟢 문서화 미흡
- 실제 사용 예시 부족 (5개 에이전트)
- 에이전트 간 협업 플로우 불명확
- 버전 관리 체계 없음

## 🚀 즉시 적용 가능한 개선사항

### Phase 1: 역할 명확화 (오늘 중)

1. **boundaries 섹션 추가**
```yaml
# 각 에이전트 파일에 추가
boundaries:
  includes: [명확한 책임 영역]
  excludes: [다른 에이전트가 담당할 영역]
  collaborates_with: [협업 에이전트 목록]
```

2. **구체적 적용 예시**
```yaml
# debugger-specialist.md
boundaries:
  includes: [런타임 오류, 스택 트레이스, 메모리 누수, 성능 병목]
  excludes: [코드 스타일, 설계 패턴, 정적 분석]
  collaborates_with: [code-review-specialist, test-automation-specialist]

# code-review-specialist.md  
boundaries:
  includes: [코드 품질, SOLID 원칙, DRY 위반, 복잡도 분석]
  excludes: [런타임 디버깅, 오류 수정, 테스트 작성]
  collaborates_with: [debugger-specialist, security-auditor]
```

### Phase 2: MCP 권한 최소화 (내일)

```yaml
# 각 에이전트별 필수 MCP만 명시
ai-systems-engineer: [mcp__memory__*, mcp__sequential-thinking__*]
database-administrator: [mcp__supabase__*]  # DB 전담
debugger-specialist: [mcp__sequential-thinking__*]
security-auditor: [mcp__supabase__*, mcp__github__*]  # 추가 필요
# 나머지는 기본 도구만 사용
```

### Phase 3: 트리거 조건 구체화 (3일 내)

```markdown
# ❌ Before (모호함)
Use when: Claude needs alternative perspective

# ✅ After (측정 가능)
Use when:
- Code complexity score > 10
- Test coverage < 70%
- Build time > 60s
- Error rate > 5%
```

## 📋 실행 체크리스트

### 오늘 (Critical)
- [ ] debugger vs code-review 역할 분리
- [ ] doc-guardian vs doc-writer 역할 분리  
- [ ] issue-summary vs central-supervisor 역할 분리
- [ ] 각 파일에 boundaries 섹션 추가

### 이번 주 (High)
- [ ] MCP 권한 최소화 적용
- [ ] Read 우선 규칙 중앙화 (`.claude/common-rules.md`)
- [ ] YAML frontmatter 표준화
- [ ] 트리거 조건 객관화

### 다음 주 (Medium)
- [ ] 에이전트별 실사용 예시 3개 추가
- [ ] 협업 플로우 다이어그램 작성
- [ ] 성능 벤치마크 추가

## ⚠️ 위험 요소

1. **역할 중복 미해결 시**: 
   - 동일 작업에 여러 에이전트 중복 실행
   - 리소스 낭비 및 혼란 가중

2. **MCP 권한 과다 시**:
   - 보안 취약점 노출
   - 의도하지 않은 작업 실행 위험

3. **트리거 조건 모호 시**:
   - 불필요한 에이전트 호출
   - 중요한 작업 누락 가능성

## 📊 예상 개선 효과

- **효율성**: 중복 실행 90% 감소
- **정확성**: 역할 명확화로 작업 정확도 향상
- **보안성**: 최소 권한 원칙으로 위험 감소
- **유지보수성**: 구조 표준화로 관리 용이

---

**작성일**: 2025-07-29  
**우선순위**: 🔴 Critical - 즉시 적용 필요  
**상세 보고서**: `.claude/audit/subagent-analysis-report.md`