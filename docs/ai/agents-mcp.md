---
id: agents-mcp
title: "Sub-Agents & MCP Mapping (DEPRECATED)"
keywords: ["subagent", "mcp", "tools", "mapping"]
priority: low
ai_optimized: false
updated: "2025-09-16"
status: "deprecated"
replacement: "../claude/sub-agents-official.md"
deprecation_reason: "Task 도구 사용법이 잘못됨 - 공식 표준으로 교체"
---

# 🤖 Sub-Agents & MCP Mapping (DEPRECATED)

⚠️ **이 문서는 더 이상 사용되지 않습니다**

**📚 새로운 공식 가이드**: [Claude Code 서브에이전트 공식 가이드](../claude/sub-agents-official.md)

**❌ 이 문서의 문제점**: 
- Task 도구 사용법 기재 (실제로는 존재하지 않음)
- 잘못된 호출 방식 안내

**✅ 올바른 정보는 새 문서 참조**

## 🎯 핵심 서브에이전트

### 🏆 메인 조정자 (1개)
```bash
Task central-supervisor "복잡한 작업 분해 및 에이전트 조율"
```

### 🤖 AI 교차검증 (6개)
```bash
Task verification-specialist "코드 검증 진입점"
Task ai-verification-coordinator "3단계 레벨 조정"  
Task external-ai-orchestrator "외부 AI 3개 병렬"
Task codex-wrapper "Codex CLI 래퍼"
Task gemini-wrapper "Gemini CLI 래퍼"
Task qwen-wrapper "Qwen CLI 래퍼"
```

### ⚙️ 전문 도구 (10개)
```bash
# 개발 환경
Task dev-environment-manager "WSL 최적화"
Task structure-refactor-specialist "프로젝트 구조 정리"

# 백엔드 & 인프라  
Task database-administrator "Supabase 최적화"
Task vercel-platform-specialist "Vercel 배포 최적화"
Task gcp-cloud-functions-specialist "GCP 함수 관리"

# 코드 품질 & 보안
Task code-review-specialist "코드 품질 검토"
Task debugger-specialist "버그 해결"
Task security-auditor "보안 감사"

# 테스트 & 문서
Task test-automation-specialist "테스트 자동화"
Task documentation-manager "문서 관리"
```

## 🔌 MCP 서버 매핑

### 핵심 시스템 (3개)
- **memory**: Knowledge Graph 관리
- **shadcn-ui**: 46개 UI 컴포넌트
- **time**: 시간대 변환

### AI & 분석 (3개)
- **sequential-thinking**: 순차 사고
- **context7**: 라이브러리 문서
- **serena**: 코드 분석

### 데이터 & 개발 (2개)
- **supabase**: SQL 쿼리
- **playwright**: 브라우저 자동화

## 📋 매핑 예시

### database-administrator
```bash
# 주요 MCP
mcp__supabase__query("SELECT * FROM user_sessions")
mcp__supabase__execute_sql("CREATE INDEX idx_performance")

# 보조 MCP  
mcp__memory__create_entities([{name: "DBOptimization"}])
```

### test-automation-specialist
```bash
# 주요 MCP
mcp__playwright__browser_navigate('/login')
mcp__playwright__browser_click("button[type='submit']")

# 보조 MCP
mcp__serena__analyze_code("test/login.spec.ts")
```

### code-review-specialist  
```bash
# 주요 MCP
mcp__serena__analyze_code("src/components/Button.tsx")
mcp__shadcn-ui__get_component("button")

# 보조 MCP
mcp__context7__search_libraries("typescript strict")
```

## 💡 활용 팁

### 프롬프트에 MCP 명시
```bash
# ❌ 나쁜 예
Task database-administrator "DB 최적화해주세요"

# ✅ 좋은 예  
Task database-administrator "
mcp__supabase__query로 pg_stat_user_tables 조회 후
느린 쿼리 식별하여 mcp__supabase__execute_sql로 인덱스 생성"
```

### 단계별 가이드
```bash
Task verification-specialist "
Step 1: mcp__serena__analyze_code로 코드 분석
Step 2: mcp__memory__search_nodes로 이전 검토 결과 조회
Step 3: 개선점 제시 및 구현"
```

## 📊 효율성 지표

**현재 MCP 활용률**: 95% (8개 서버 모두 최적화)
**에이전트 매핑**: 17개 에이전트 완벽 매핑
**토큰 절약**: 27% 감소 달성

---

💡 **Quick Start**: `Task [에이전트명] "작업 설명 + MCP 도구 명시"`