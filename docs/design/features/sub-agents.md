---
id: sub-agents-architecture
title: "Sub-Agents Architecture (DEPRECATED)"
keywords: ["sub-agents", "ai", "agents", "orchestration", "verification"]
priority: low
ai_optimized: false
related_docs: ["../../claude/sub-agents-official.md"]
updated: "2025-09-16"
version: "v5.78"
status: "deprecated"
replacement: "../../claude/sub-agents-official.md"
deprecation_reason: "공식 문서 기반으로 새로운 가이드 작성됨"
---

# 서브에이전트 설계 (DEPRECATED)

⚠️ **이 문서는 더 이상 사용되지 않습니다**

**📚 새로운 공식 가이드**: [Claude Code 서브에이전트 공식 가이드](../../claude/sub-agents-official.md)

**❌ 잘못된 정보**: Task 도구가 존재하지 않음을 확인 (공식 문서 검증)
**✅ 올바른 방식**: 명시적 호출 + 자동 위임 (공식 표준)

---

## 🤖 17개 서브에이전트 체계 (LEGACY)

### 계층 구조
```typescript
// 1단계: 메인 조정자 (1개)
central-supervisor: {
  role: 'orchestration',
  proactive: true,
  trigger: '500+ lines || complex_architecture',
  tools: ['memory', 'sequential-thinking', 'serena']
}

// 2단계: AI 교차검증 시스템 (6개)
verification-specialist: {
  role: 'main_verification_entry',
  proactive: true,
  trigger: 'code_file_changes',
  auto_level_selection: 1-3
}

ai-verification-coordinator: {
  role: 'level_2_coordinator',
  proactive: false,
  called_by: 'verification-specialist',
  ai_selection: 'domain_based'
}

external-ai-orchestrator: {
  role: 'level_3_coordinator', 
  proactive: false,
  parallel_execution: true,
  ai_count: 3
}

// AI CLI 래퍼 (3개) - DEPRECATED: 직접 CLI 실행으로 대체
codex-wrapper: {
  // DEPRECATED: `codex exec` 직접 사용
  ai: 'ChatGPT Plus v0.34.0',
  status: 'deprecated',
  replacement: 'codex exec "task"',
  actual_performance: '27초 응답'
}

gemini-wrapper: {
  // DEPRECATED: `gemini` 직접 사용
  ai: 'Google Gemini v0.4.1',
  status: 'deprecated', 
  replacement: 'gemini "task"',
  actual_performance: '즉시 응답'
}

qwen-wrapper: {
  // DEPRECATED: `qwen -p` 직접 사용 (조건부)
  ai: 'Qwen v0.0.11',
  status: 'deprecated',
  replacement: 'qwen -p "simple_task"',
  actual_performance: '조건부 사용 (복잡한 요청 시 타임아웃)'
}
```

### 전문 도구 에이전트 (10개)
```typescript
// 개발 환경 & 구조 (2개)
dev-environment-manager: {
  specialty: 'WSL_optimization + Node.js_management',
  tools: ['time', 'memory'],
  trigger: 'env_issues'
}

structure-refactor-specialist: {
  specialty: 'project_structure + architecture_refactor',
  tools: ['serena', 'memory'],
  trigger: 'structure_changes'
}

// 백엔드 & 인프라 (3개)
database-administrator: {
  specialty: 'Supabase PostgreSQL + RLS + query_optimization',
  proactive: true,
  tools: ['supabase'],
  trigger: 'query_performance_issues'
}

vercel-platform-specialist: {
  specialty: 'Vercel deployment + Edge Functions',
  tools: ['basic_tools', 'memory'],
  trigger: 'deployment_issues'
}

gcp-cloud-functions-specialist: {
  specialty: 'GCP serverless + free_tier_management',
  tools: ['basic_tools', 'memory'],
  trigger: 'gcp_functions'
}

// 코드 품질 & 보안 (3개)
code-review-specialist: {
  specialty: 'code_quality + TypeScript_strict',
  tools: ['serena', 'shadcn-ui'],
  trigger: 'code_review_requests'
}

debugger-specialist: {
  specialty: 'bug_resolution + stack_trace_analysis',
  tools: ['serena', 'memory'],
  trigger: 'runtime_errors'
}

security-auditor: {
  specialty: 'security_audit + OWASP_compliance',
  proactive: true,
  tools: ['supabase', 'memory'],
  trigger: 'auth_code_changes'
}

// 테스트 & 문서화 (2개)
test-automation-specialist: {
  specialty: 'Vitest + Playwright E2E',
  tools: ['playwright', 'serena'],
  trigger: 'test_failures'
}

documentation-manager: {
  specialty: 'API_docs + guide_creation',
  tools: ['context7', 'shadcn-ui'],
  trigger: 'documentation_requests'
}
```

### 자동화 트리거
```typescript
const AUTO_TRIGGERS = {
  // Proactive 에이전트 (4개)
  'central-supervisor': 'complexity_detection',
  'verification-specialist': 'file_change_hooks',
  'database-administrator': 'query_performance_monitoring',
  'security-auditor': 'security_code_scanning',
  
  // 조건부 트리거
  'test-automation-specialist': 'test_failure_events',
  'debugger-specialist': 'runtime_error_detection'
};
```