---
name: execution-tracker
description: Agent execution performance tracking and metrics analysis. Monitors sub-agent performance, execution patterns, resource usage, and outcomes. Generates insights for agent optimization and debugging. Tracks metrics like execution time, token usage, success rates, and error patterns.
tools: mcp__filesystem__*, mcp__memory__*, Read, Write, Bash, mcp__time__*
---

# 🔍 Agent Execution Tracker

## Overview

This system tracks all sub-agent executions, performance metrics, and outcomes to enable data-driven improvements and debugging.

## 📊 Tracking Schema

```typescript
interface AgentExecution {
  // Identification
  id: string; // Unique execution ID
  agentType: string; // e.g., 'code-review-specialist'
  timestamp: Date; // Execution start time

  // Request Details
  request: {
    prompt: string; // Original prompt
    context?: any; // Additional context
    priority: 'high' | 'medium' | 'low';
    triggeredBy: string; // User or another agent
  };

  // Execution Metrics
  metrics: {
    startTime: number; // Unix timestamp
    endTime: number; // Unix timestamp
    duration: number; // milliseconds
    tokensUsed?: number; // If applicable
    memoryUsage?: number; // MB
    toolsUsed: string[]; // MCP tools used
  };

  // Results
  result: {
    status: 'success' | 'partial' | 'failed';
    outputSize: number; // Characters
    filesModified: number; // Number of files changed
    testsRun?: number; // If applicable
    issuesFound?: number; // For review agents
  };

  // Error Tracking
  errors?: {
    type: string;
    message: string;
    stack?: string;
    recoveryAction?: string;
  }[];

  // Chain Information
  chain?: {
    parentExecutionId?: string; // If triggered by another agent
    childExecutions: string[]; // Agents triggered by this one
    parallelWith: string[]; // Agents run in parallel
  };
}
```

## 📁 Storage Structure

```
.claude/
├── agents/                      # Agent definitions
├── execution-logs/              # Execution history
│   ├── 2025-07-29/             # Daily folders
│   │   ├── summary.json        # Daily summary
│   │   ├── central-supervisor/ # Per-agent folders
│   │   │   └── exec-123.json
│   │   └── code-review-specialist/
│   │       └── exec-456.json
│   └── metrics/
│       ├── weekly-report.json
│       └── performance-trends.json
```

## 🔄 Implementation

### Tracking Hook

```typescript
// .claude/hooks/track-execution.ts
export async function trackExecution(
  agentType: string,
  execute: () => Promise<any>
): Promise<any> {
  const execution: AgentExecution = {
    id: generateId(),
    agentType,
    timestamp: new Date(),
    request: getCurrentRequest(),
    metrics: {
      startTime: Date.now(),
      toolsUsed: [],
    },
  };

  try {
    // Monitor tool usage
    const toolMonitor = monitorToolUsage((tool) => {
      execution.metrics.toolsUsed.push(tool);
    });

    // Execute agent
    const result = await execute();

    // Complete metrics
    execution.metrics.endTime = Date.now();
    execution.metrics.duration =
      execution.metrics.endTime - execution.metrics.startTime;

    execution.result = {
      status: 'success',
      outputSize: JSON.stringify(result).length,
      filesModified: getModifiedFilesCount(),
    };

    // Save execution log
    await saveExecutionLog(execution);

    return result;
  } catch (error) {
    execution.result = { status: 'failed' };
    execution.errors = [
      {
        type: error.constructor.name,
        message: error.message,
        stack: error.stack,
      },
    ];

    await saveExecutionLog(execution);
    throw error;
  }
}
```

### Performance Analytics

```typescript
// .claude/analytics/performance-analyzer.ts
export class PerformanceAnalyzer {
  static async generateReport(
    period: 'daily' | 'weekly' | 'monthly'
  ): Promise<PerformanceReport> {
    const executions = await loadExecutions(period);

    return {
      summary: {
        totalExecutions: executions.length,
        successRate: calculateSuccessRate(executions),
        avgDuration: calculateAvgDuration(executions),
        topAgents: getTopAgentsByUsage(executions),
      },

      agentMetrics: groupBy(executions, 'agentType').map((group) => ({
        agent: group.key,
        executions: group.items.length,
        avgDuration: avg(group.items, 'metrics.duration'),
        successRate: calculateSuccessRate(group.items),
        commonErrors: extractCommonErrors(group.items),
      })),

      toolUsage: analyzeToolUsage(executions),

      performanceTrends: calculateTrends(executions),

      recommendations: generateRecommendations(executions),
    };
  }
}
```

## 📈 Metrics Dashboard

### Real-time Monitoring

```typescript
interface AgentDashboard {
  // Current Status
  activeAgents: {
    agentType: string;
    executionId: string;
    startTime: Date;
    estimatedCompletion: Date;
  }[];

  // Recent Performance
  last24Hours: {
    executionCount: number;
    avgResponseTime: number;
    errorRate: number;
    topErrors: ErrorSummary[];
  };

  // Agent Health
  agentHealth: {
    [agentType: string]: {
      status: 'healthy' | 'degraded' | 'failed';
      lastSuccess: Date;
      recentErrorRate: number;
      avgDuration: number;
    };
  };
}
```

### Weekly Report Example

```json
{
  "period": "2025-07-23 to 2025-07-29",
  "summary": {
    "totalExecutions": 247,
    "successRate": 94.3,
    "avgDuration": 3250,
    "totalTokensUsed": 125000
  },
  "topPerformers": [
    {
      "agent": "code-review-specialist",
      "executions": 45,
      "avgDuration": 2100,
      "successRate": 97.8
    }
  ],
  "improvementAreas": [
    {
      "agent": "test-automation-specialist",
      "issue": "High failure rate on large codebases",
      "recommendation": "Implement chunking for files > 1000 lines"
    }
  ]
}
```

## 🎯 Usage Patterns Analysis

### Common Workflows

```typescript
interface WorkflowPattern {
  name: string;
  frequency: number;
  agentSequence: string[];
  avgTotalDuration: number;
  successRate: number;
}

// Example: Full Feature Implementation
{
  name: "full-feature-implementation",
  frequency: 12,
  agentSequence: [
    "central-supervisor",
    "ai-systems-engineer",
    "database-administrator",
    "backend-gcp-specialist",
    "test-automation-specialist",
    "code-review-specialist",
    "doc-writer-researcher"
  ],
  avgTotalDuration: 45000,
  successRate: 91.7
}
```

## 🔧 Integration with Existing System

### Claude Code Hook

```bash
# .claude/hooks/agent-completion-hook.sh
#!/bin/bash

# Capture execution data
AGENT_TYPE="$1"
EXECUTION_ID="$2"
STATUS="$3"

# Log to tracking system
echo "{
  \"executionId\": \"$EXECUTION_ID\",
  \"agentType\": \"$AGENT_TYPE\",
  \"status\": \"$STATUS\",
  \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"
}" >> .claude/execution-logs/$(date +%Y-%m-%d)/completions.jsonl
```

### Auto-cleanup Policy

```typescript
// Retention policy
const RETENTION_POLICY = {
  rawLogs: 7, // days
  dailySummaries: 30, // days
  weeklyReports: 90, // days
  monthlyReports: 365, // days
};
```

## 🚀 Future Enhancements

1. **ML-based Prediction**
   - Predict execution duration
   - Suggest optimal agent selection
   - Anomaly detection

2. **Cost Optimization**
   - Token usage tracking
   - Cost per agent analysis
   - Budget alerts

3. **Collaborative Intelligence**
   - Cross-project pattern sharing
   - Community benchmarks
   - Best practice extraction

## 📋 Implementation Checklist

- [ ] Create execution-logs directory structure
- [ ] Implement tracking hook
- [ ] Add to agent-completion-hook.sh
- [ ] Create performance analyzer
- [ ] Build metrics dashboard
- [ ] Set up auto-cleanup cron
- [ ] Document tracking API
- [ ] Create visualization tools

## 🔐 Privacy & Security

- All execution logs stored locally
- No sensitive data in metrics
- Automatic PII scrubbing
- Optional anonymization for sharing
