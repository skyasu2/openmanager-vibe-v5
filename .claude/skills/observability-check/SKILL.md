---
name: observability-check
description: AI observability analysis via Langfuse traces and Sentry issues. Triggers when user requests Langfuse traces, Sentry errors, AI monitoring, or observability check.
version: v1.0.0
user-invocable: true
allowed-tools: Bash, Read, Grep
---

# Observability Check (Langfuse + Sentry)

## Purpose

Unified observability analysis for AI Engine monitoring - combines Langfuse traces (AI execution) and Sentry issues (errors/performance).

## Trigger Keywords

- "/observability"
- "/langfuse"
- "/sentry"
- "AI 모니터링"
- "랭퓨즈 확인"
- "센트리 확인"
- "observability check"
- "AI traces"
- "error monitoring"

## Context

- **Project**: OpenManager VIBE v5.85.0
- **Langfuse**: AI SDK execution traces, tool calls, latency
- **Sentry**: Error tracking, performance issues (N+1, etc.)
- **Credentials**: `.env.local` (LANGFUSE_SECRET_KEY, SENTRY_AUTH_TOKEN)

## Prerequisites

```bash
# Required in .env.local:
LANGFUSE_SECRET_KEY=sk-lf-...
LANGFUSE_PUBLIC_KEY=pk-lf-...
SENTRY_AUTH_TOKEN=sntryu_...  # Optional, for API access
```

## Workflow

### 1. Check Credentials

```bash
# Langfuse (required)
grep -q "LANGFUSE_SECRET_KEY" .env.local && echo "✅ Langfuse configured"

# Sentry (optional)
grep -q "SENTRY_AUTH_TOKEN" .env.local && echo "✅ Sentry API configured" || echo "⚠️ Sentry: DSN only (web dashboard access)"
```

### 2. Fetch Langfuse Traces

```bash
# Get recent AI traces (last 24h)
curl -s -u "$LANGFUSE_PUBLIC_KEY:$LANGFUSE_SECRET_KEY" \
  "https://cloud.langfuse.com/api/public/traces?limit=20" | jq '.data[:5]'
```

**Extract**:
- Trace ID, name, timestamp
- Total latency, token usage
- Tools called (getServerMetrics, filterServers, etc.)
- Success/failure status

### 3. Fetch Sentry Issues (if token available)

```bash
# Get unresolved issues
curl -s -H "Authorization: Bearer $SENTRY_AUTH_TOKEN" \
  "https://sentry.io/api/0/organizations/om-4g/issues/?query=is:unresolved" | jq '.[0:5]'
```

**Extract**:
- Issue ID, title, level (error/warning/info)
- Culprit (affected route/function)
- Count, first/last seen
- Priority (low/medium/high)

### 4. Correlate Data

**AI Issues → Sentry**:
- If Langfuse shows failed traces → Check Sentry for related errors
- If Sentry shows AI-related errors → Cross-reference with Langfuse traces

**Performance Analysis**:
- Langfuse: AI latency > 5s → Investigate
- Sentry: N+1 API calls → Identify duplicate fetches

## Output Format

```
🔍 Observability Report
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 Langfuse AI Traces (Last 24h)
├─ Total Traces: {count}
├─ Success Rate: {percent}%
├─ Avg Latency: {ms}ms
└─ Most Used Tools:
   ├─ getServerMetrics: {count}
   ├─ filterServers: {count}
   └─ searchKnowledgeBase: {count}

🐛 Sentry Issues (Unresolved)
├─ Total: {count}
├─ Critical: {count}
├─ High: {count}
└─ Top Issues:
   ├─ {issue1}: {title} ({count} events)
   └─ {issue2}: {title} ({count} events)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 Recommendations:
1. {recommendation1}
2. {recommendation2}

📁 Dashboards:
- Langfuse: https://cloud.langfuse.com/project/{id}
- Sentry: https://om-4g.sentry.io/issues/
```

## Edge Cases

**Case 1: Langfuse API Unavailable**
- Fallback: Check local logs in `logs/ai-engine/`
- Message: "Langfuse API unreachable. Check local logs."

**Case 2: Sentry Token Missing**
- Continue with Langfuse only
- Message: "Sentry: DSN only. Use web dashboard for details."
- URL: https://om-4g.sentry.io/issues/

**Case 3: No Recent Traces**
- Check if AI Engine is deployed and running
- Verify Cloud Run health: `curl https://ai-engine-*.run.app/health`

**Case 4: High Error Rate in Langfuse**
- Alert threshold: > 10% failure rate
- Action: Check Sentry for corresponding errors
- Verify API keys and model availability

## Success Criteria

- Langfuse traces fetched successfully
- Sentry issues retrieved (if token available)
- Correlation analysis completed
- Clear recommendations provided

## Related Skills

- `cloud-run-deploy` - Deploy AI Engine fixes
- `validation-analysis` - Post-commit code quality
- `security-audit-workflow` - Security issue deep dive

## API Reference

### Langfuse API
- Base URL: `https://cloud.langfuse.com/api/public`
- Auth: Basic (public_key:secret_key)
- Endpoints:
  - `GET /traces` - List traces
  - `GET /traces/{id}` - Trace details
  - `GET /sessions` - List sessions

### Sentry API
- Base URL: `https://sentry.io/api/0`
- Auth: Bearer token
- Endpoints:
  - `GET /organizations/{org}/issues/` - List issues
  - `GET /issues/{id}/events/` - Issue events
  - `GET /issues/{id}/events/{eventId}/` - Event details

## Changelog

- 2026-01-28: v1.0.0 - Initial implementation
  - Langfuse trace analysis
  - Sentry issue fetching
  - Cross-correlation recommendations
