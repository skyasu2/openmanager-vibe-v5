# 서브에이전트별 MCP 서버 활용 현황

## 📊 MCP 서버 활용 현황 요약

### 프로젝트 로컬 설정 반영 상태
- **설정 위치**: `.claude/mcp.json`
- **명령어 형식**: Node.js 기반 `npx`, Python 기반 `uvx`
- **반영 완료**: mcp-server-admin, database-administrator, ai-systems-engineer, central-supervisor

### MCP 서버별 사용 서브에이전트

#### 1. filesystem (파일 시스템 작업)
- mcp-server-admin
- code-review-specialist
- doc-writer-researcher
- test-automation-specialist
- security-auditor
- doc-structure-guardian
- debugger-specialist

#### 2. github (GitHub 통합)
- doc-writer-researcher
- security-auditor
- debugger-specialist

#### 3. memory (지식 관리)
- mcp-server-admin
- ai-systems-engineer

#### 4. supabase (데이터베이스)
- database-administrator (전담)

#### 5. context7 (문서 검색)
- doc-writer-researcher

#### 6. tavily-mcp (웹 검색)
- doc-writer-researcher

#### 7. sequential-thinking (복잡한 추론)
- debugger-specialist

#### 8. playwright (브라우저 자동화)
- test-automation-specialist
- ux-performance-optimizer

#### 9. serena (코드 분석)
- (현재 직접 사용하는 서브에이전트 없음)

### MCP 미사용 서브에이전트
- **central-supervisor**: 조율 역할 (다른 에이전트들이 사용하는 MCP를 간접 활용)
- **gemini-cli-collaborator**: Bash 명령어로 Gemini CLI 직접 호출
- **issue-summary**: 기본 도구만으로 플랫폼 모니터링

## 개선 권장사항

1. **serena MCP 서버 활용**
   - code-review-specialist나 debugger-specialist에서 활용 검토
   - 고급 코드 분석 기능 활용 가능

2. **프로젝트 로컬 설정 미반영 서브에이전트**
   - 나머지 서브에이전트들에도 필요시 설정 정보 추가
   - 특히 MCP를 활용하는 서브에이전트 우선

3. **MCP 서버 관리 가이드**
   - 각 서브에이전트에서 MCP 서버 추가/수정 시 mcp-server-admin 활용
   - npx/uvx 명령어 형식 준수