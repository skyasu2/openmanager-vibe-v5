'use client';

/**
 * Agent Status Indicator
 *
 * Displays real-time agent status changes during AI streaming.
 * Shows thinking, processing, and completed states with animations.
 *
 * @version 1.0.0
 * @created 2026-01-18
 */

import { Bot, Cpu, FileText, HelpCircle, Loader2, Search } from 'lucide-react';
import React, { memo } from 'react';

export type AgentStatus = 'thinking' | 'processing' | 'completed' | 'idle';

export interface AgentStatusIndicatorProps {
  /** Agent name */
  agent: string;
  /** Current status */
  status: AgentStatus;
  /** Compact inline mode */
  compact?: boolean;
}

// Agent name to icon mapping
const AGENT_ICONS: Record<string, typeof Bot> = {
  Orchestrator: Bot,
  'OpenManager Orchestrator': Bot,
  'NLQ Agent': Search,
  'Analyst Agent': Cpu,
  'Reporter Agent': FileText,
  'Advisor Agent': HelpCircle,
};

// Status to color/animation mapping
const STATUS_STYLES: Record<
  AgentStatus,
  { bg: string; text: string; border: string; animate?: string }
> = {
  thinking: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    animate: 'animate-pulse',
  },
  processing: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
  },
  completed: {
    bg: 'bg-green-50',
    text: 'text-green-700',
    border: 'border-green-200',
  },
  idle: {
    bg: 'bg-gray-50',
    text: 'text-gray-500',
    border: 'border-gray-200',
  },
};

// Status labels (Korean)
const STATUS_LABELS: Record<AgentStatus, string> = {
  thinking: '분석 중...',
  processing: '처리 중...',
  completed: '완료',
  idle: '대기',
};

/**
 * Parse agent_status event data
 */
export function parseAgentStatus(
  data: unknown
): { agent: string; status: AgentStatus } | null {
  if (!data || typeof data !== 'object') return null;

  const obj = data as Record<string, unknown>;
  if (typeof obj.agent !== 'string') return null;

  const status = obj.status as string;
  if (!['thinking', 'processing', 'completed', 'idle'].includes(status)) {
    return null;
  }

  return {
    agent: obj.agent,
    status: status as AgentStatus,
  };
}

/**
 * Agent Status Indicator Component
 */
export const AgentStatusIndicator = memo<AgentStatusIndicatorProps>(
  ({ agent, status, compact = false }) => {
    const Icon = AGENT_ICONS[agent] || Bot;
    const style = STATUS_STYLES[status];
    const label = STATUS_LABELS[status];

    if (compact) {
      return (
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${style.bg} ${style.text} ${style.animate || ''}`}
        >
          {(status === 'thinking' || status === 'processing') && (
            <Loader2 className="h-3 w-3 animate-spin" />
          )}
          <Icon className="h-3 w-3" />
          <span>{agent}</span>
        </span>
      );
    }

    return (
      <div
        className={`my-2 flex items-center justify-center ${style.animate || ''}`}
      >
        <div
          className={`flex items-center gap-2 rounded-full border px-3 py-1.5 ${style.bg} ${style.text} ${style.border}`}
        >
          {(status === 'thinking' || status === 'processing') && (
            <Loader2 className="h-4 w-4 animate-spin" />
          )}
          <Icon className="h-4 w-4" />
          <span className="text-sm font-medium">{agent}</span>
          <span className="text-xs opacity-75">• {label}</span>
        </div>
      </div>
    );
  }
);

AgentStatusIndicator.displayName = 'AgentStatusIndicator';

export default AgentStatusIndicator;
