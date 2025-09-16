---
id: sub-agents-architecture
title: "Sub-Agents Architecture"
keywords: ["sub-agents", "ai", "agents", "orchestration", "verification"]
priority: high
ai_optimized: true
related_docs: ["ai-system.md", "mcp.md", "../../ai/workflow.md"]
updated: "2025-09-16"
version: "v5.77"
---

# 서브에이전트 설계

## 🤖 17개 서브에이전트 체계

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

// AI CLI 래퍼 (3개)
codex-wrapper: {
  ai: 'ChatGPT Plus',
  weight: 0.99,
  specialty: 'practical_code_review',
  timeout: '60s'
}

gemini-wrapper: {
  ai: 'Google Gemini',
  weight: 0.98,
  specialty: 'large_data_analysis',
  limit: '1K/day'
}

qwen-wrapper: {
  ai: 'Qwen OAuth',
  weight: 0.97,
  specialty: 'algorithm_optimization',
  limit: '2K/day'
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