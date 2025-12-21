# 📋 AI Agent Optimization Plan (Cost & Performance)

> **Created**: 2025-12-21
> **Objective**: Optimize AI Agents to prevent Vercel timeouts, reduce token costs, and improve user experience.

## 🚀 1. Supervisor Optimization (Anti-Timeout)
- **Goal**: Prevent `504 Gateway Timeout` on Vercel by forcing an immediate "First Byte" response.
- **Action**:
  - Update `SUPERVISOR_PROMPT` in `multi-agent-supervisor.ts`.
  - Add instruction: *"Start response immediately with 'Analyzing request...' before calling tools."*
  - Enable streaming "Thought" process visibility (if possible) or at least a filler phrase to keep connection alive.

## 💰 2. Worker Agents Prompt Engineering (Cost Control)
- **Goal**: Reduce token usage by eliminating verbose introductions and enforcing strict output formats.
- **Action**:
  - **Reporter Agent**:
    - Enforce Strict JSON or Markdown template.
    - Constraint: *"No conversational fillers. No 'Hello, I am Reporter Agent'. Start directly with content."*
    - limit output length (e.g., max 3 sentences per section).
  - **NLQ Agent**:
    - Instruction: *"Summarize metrics in 3 bullet points. Do not read raw numbers unless asked."*
  - **Analyst Agent**:
    - Instruction: *"Interpret the context of data trends, don't just state statistical results."*

## ⚡ 3. Infrastructure & Safety
- **Goal**: Ensure stability under free-tier constraints.
- **Action**:
  - **Rate Limiting**: Monitor the newly applied `10 requests/min` limit on production.
  - **Failover**: Verify that Gemini -> Llama (Groq) failover logic preserves the prompt constraints.

## 📅 Roadmap
- [x] Update `multi-agent-supervisor.ts` prompts (2025-12-21 완료)
  - Supervisor: 간결한 라우팅 규칙으로 수정
  - NLQ Agent: 3줄 이내 요약 형식 강제
  - Analyst Agent: 3섹션 의미 해석 형식
  - Reporter Agent: 엄격한 마크다운 템플릿
  - Anti-Timeout: 즉시 "분석을 시작합니다..." 첫 바이트 전송
- [ ] Test Vercel timeout behavior with long-running analysis
- [ ] Verify token usage reduction in Groq/Gemini dashboard
