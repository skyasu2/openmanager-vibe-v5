# MCP 서버와 서브에이전트 매핑 분석 리포트

**생성일**: 2025-08-01
**분석자**: Claude Code

## 📊 MCP 서버별 사용 에이전트 현황

### 1. `mcp__filesystem__*` (파일 시스템)

**사용 에이전트 (7개)**:

- git-cicd-specialist ✅
- structure-refactor-agent ✅
- code-review-specialist ✅
- documentation-manager ✅
- test-first-developer ✅
- security-auditor ✅
- debugger-specialist ✅
- test-automation-specialist ✅
- backend-gcp-specialist ✅
- quality-control-checker ✅
- mcp-server-admin ✅

**CLAUDE.md 명시 (7개)**: documentation-manager, mcp-server-admin, test-automation-specialist, security-auditor, debugger-specialist, backend-gcp-specialist, code-review-specialist

**불일치**: 실제 11개 vs 문서 7개 (git-cicd-specialist, structure-refactor-agent, test-first-developer, quality-control-checker 추가)

### 2. `mcp__memory__*` (지식 그래프)

**사용 에이전트 (6개)**:

- ai-systems-engineer ✅
- gemini-cli-collaborator ✅
- structure-refactor-agent ✅
- test-first-developer ✅
- test-automation-specialist ✅
- mcp-server-admin ✅

**CLAUDE.md 명시 (4개)**: mcp-server-admin, test-automation-specialist, ai-systems-engineer, gemini-cli-collaborator

**불일치**: 실제 6개 vs 문서 4개 (structure-refactor-agent, test-first-developer 추가)

### 3. `mcp__github__*` (GitHub)

**사용 에이전트 (5개)**:

- git-cicd-specialist ✅
- documentation-manager ✅
- security-auditor ✅
- debugger-specialist ✅
- backend-gcp-specialist ✅

**CLAUDE.md 명시 (5개)**: documentation-manager, security-auditor, debugger-specialist, backend-gcp-specialist, git-cicd-specialist

**일치**: ✅ 완벽 일치

### 4. `mcp__supabase__*` (데이터베이스)

**사용 에이전트 (1개)**:

- database-administrator ✅

**CLAUDE.md 명시 (1개)**: database-administrator

**일치**: ✅ 완벽 일치

### 5. `mcp__context7__*` (문서 검색)

**사용 에이전트 (10개)**:

- git-cicd-specialist ✅
- ai-systems-engineer ✅
- database-administrator ✅
- ux-performance-optimizer ✅
- documentation-manager ✅
- security-auditor ✅
- debugger-specialist ✅
- test-automation-specialist ✅
- backend-gcp-specialist ✅

**CLAUDE.md 명시 (6개)**: documentation-manager, test-automation-specialist, ux-performance-optimizer, backend-gcp-specialist, database-administrator, ai-systems-engineer

**불일치**: 실제 9개 vs 문서 6개 (git-cicd-specialist, security-auditor, debugger-specialist 추가)

### 6. `mcp__tavily-mcp__*` (웹 검색)

**사용 에이전트 (4개)**:

- vercel-platform-specialist ✅
- documentation-manager ✅
- debugger-specialist ✅
- backend-gcp-specialist ✅

**CLAUDE.md 명시 (3개)**: documentation-manager, vercel-platform-specialist, backend-gcp-specialist

**불일치**: 실제 4개 vs 문서 3개 (debugger-specialist 추가)

### 7. `mcp__sequential-thinking__*` (복잡한 문제 해결)

**사용 에이전트 (9개)**:

- vercel-platform-specialist ✅
- ux-performance-optimizer ✅
- structure-refactor-agent ✅
- code-review-specialist ✅
- test-first-developer ✅
- debugger-specialist ✅
- backend-gcp-specialist ✅
- quality-control-checker ✅
- mcp-server-admin ✅

**CLAUDE.md 명시 (2개)**: mcp-server-admin, debugger-specialist

**불일치**: 실제 9개 vs 문서 2개 (vercel-platform-specialist, ux-performance-optimizer, structure-refactor-agent, code-review-specialist, test-first-developer, backend-gcp-specialist, quality-control-checker 추가)

### 8. `mcp__playwright__*` (브라우저 자동화)

**사용 에이전트 (2개)**:

- ux-performance-optimizer ✅
- test-automation-specialist ✅

**CLAUDE.md 명시 (2개)**: test-automation-specialist, ux-performance-optimizer

**일치**: ✅ 완벽 일치

### 9. `mcp__serena__*` (코드 분석)

**사용 에이전트 (7개)**:

- ai-systems-engineer ✅
- ux-performance-optimizer ✅
- structure-refactor-agent ✅
- code-review-specialist ✅
- debugger-specialist ✅
- test-automation-specialist ✅

**CLAUDE.md 명시 (5개)**: test-automation-specialist, ux-performance-optimizer, debugger-specialist, ai-systems-engineer, code-review-specialist

**불일치**: 실제 6개 vs 문서 5개 (structure-refactor-agent 추가)

### 10. `mcp__time__*` (시간대 변환)

**사용 에이전트 (4개)**:

- vercel-platform-specialist ✅
- database-administrator ✅
- documentation-manager ✅
- debugger-specialist ✅

**CLAUDE.md 명시 (4개)**: vercel-platform-specialist, documentation-manager, debugger-specialist, database-administrator

**일치**: ✅ 완벽 일치

## 🔍 주요 발견사항

### 1. 문서화 불일치

- **10개 MCP 서버 중 5개**에서 CLAUDE.md와 실제 사용 현황이 불일치
- 특히 `mcp__sequential-thinking__*`의 경우 문서에는 2개만 기록되어 있으나 실제로는 9개 에이전트가 사용

### 2. 과도한 MCP 도구 사용

- `mcp__filesystem__*`: 11개 에이전트가 사용 (너무 많음)
- `mcp__context7__*`: 9개 에이전트가 사용
- `mcp__sequential-thinking__*`: 9개 에이전트가 사용

### 3. 특화된 MCP 사용 (Good)

- `mcp__supabase__*`: database-administrator만 사용 ✅
- `mcp__playwright__*`: 테스트 관련 2개 에이전트만 사용 ✅

### 4. 새로 추가된 에이전트들의 MCP 사용

- `structure-refactor-agent`: 4개 MCP 사용 (filesystem, serena, sequential-thinking, memory)
- `test-first-developer`: 3개 MCP 사용 (filesystem, sequential-thinking, memory)
- `quality-control-checker`: 2개 MCP 사용 (filesystem, sequential-thinking)

## 🚨 문제점

1. **문서 업데이트 필요**: CLAUDE.md의 MCP 서버별 활용 에이전트 목록이 오래됨
2. **과도한 권한**: 일부 에이전트가 필요 이상으로 많은 MCP 도구 접근
3. **역할 중복**: 여러 에이전트가 동일한 MCP 도구를 사용하여 역할 경계 모호
4. **성능 영향**: 과도한 MCP 연결이 성능에 영향을 줄 수 있음

## 💡 개선 권장사항

### 1. MCP 사용 최적화

- 각 에이전트의 핵심 역할에 필요한 MCP 도구만 할당
- 특히 `mcp__filesystem__*`는 파일 작업이 핵심인 에이전트만 사용하도록 제한

### 2. 문서 업데이트

- CLAUDE.md의 MCP 서버별 활용 에이전트 목록을 실제 현황에 맞게 업데이트
- 각 에이전트의 MCP 사용 근거 명시

### 3. 역할 명확화

- 중복되는 MCP 사용을 줄이고 각 에이전트의 전문성 강화
- 예: code-review-specialist는 serena만 사용, filesystem은 제거 고려

### 4. 성능 모니터링

- MCP 연결 수가 성능에 미치는 영향 측정
- 필요시 연결 수 제한 정책 수립
