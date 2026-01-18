/**
 * Architecture Diagrams Data
 * 랜딩 페이지 Feature Card 모달용 아키텍처 다이어그램 데이터
 *
 * @version 5.88.0
 * @updated 2026-01-15
 */

export interface DiagramNode {
  id: string;
  label: string;
  sublabel?: string;
  type: 'primary' | 'secondary' | 'tertiary' | 'highlight';
  icon?: string;
}

export interface DiagramConnection {
  from: string;
  to: string;
  label?: string;
  type?: 'solid' | 'dashed';
}

export interface DiagramLayer {
  title: string;
  color: string;
  nodes: DiagramNode[];
}

export interface ArchitectureDiagram {
  id: string;
  title: string;
  description: string;
  layers: DiagramLayer[];
  connections?: DiagramConnection[];
}

/**
 * 4개 카드별 아키텍처 다이어그램 데이터
 */
export const ARCHITECTURE_DIAGRAMS: Record<string, ArchitectureDiagram> = {
  /**
   * 1. AI Assistant - Multi-Agent 오케스트레이션
   */
  'ai-assistant-pro': {
    id: 'ai-assistant-pro',
    title: 'Multi-Agent Architecture',
    description:
      'Vercel AI SDK 기반 5-Agent 멀티 에이전트 시스템. Orchestrator가 의도를 분석하고 전문 에이전트로 라우팅합니다.',
    layers: [
      {
        title: 'Client',
        color: 'from-blue-500 to-blue-600',
        nodes: [
          {
            id: 'user',
            label: 'User Query',
            sublabel: 'AI Chat Interface',
            type: 'primary',
            icon: '💬',
          },
        ],
      },
      {
        title: 'Vercel (Frontend)',
        color: 'from-slate-600 to-slate-700',
        nodes: [
          {
            id: 'vercel-proxy',
            label: 'Next.js API',
            sublabel: '/api/ai/supervisor',
            type: 'secondary',
            icon: '▲', // Vercel Triangle
          },
        ],
      },
      {
        title: 'Google Cloud Run (AI Engine)',
        color: 'from-indigo-500 to-purple-600',
        nodes: [
          {
            id: 'orchestrator',
            label: 'Orchestrator',
            sublabel: 'Cerebras llama-3.3-70b',
            type: 'highlight',
            icon: '🧠', // Brain for Orchestrator
          },
        ],
      },
      {
        title: 'Specialized Agents',
        color: 'from-purple-500 to-pink-500',
        nodes: [
          {
            id: 'nlq',
            label: 'NLQ Agent',
            sublabel: 'Server Metrics (w/ Fallback)',
            type: 'secondary',
            icon: '🔍',
          },
          {
            id: 'analyst',
            label: 'Analyst Agent',
            sublabel: 'RCA & Anomaly (w/ Fallback)',
            type: 'secondary',
            icon: '📊',
          },
          {
            id: 'reporter',
            label: 'Reporter Agent',
            sublabel: 'Incident Report (w/ Fallback)',
            type: 'secondary',
            icon: '📑', // Document for report
          },
          {
            id: 'advisor',
            label: 'Advisor Agent',
            sublabel: 'GraphRAG + Reasoning',
            type: 'secondary',
            icon: '💡',
          },
        ],
      },
    ],
    connections: [
      { from: 'user', to: 'vercel-proxy', label: 'POST' },
      { from: 'vercel-proxy', to: 'orchestrator', label: 'Proxy' },
      { from: 'orchestrator', to: 'nlq', label: 'Handoff' },
      { from: 'orchestrator', to: 'analyst', label: 'Handoff' },
      { from: 'orchestrator', to: 'reporter', label: 'Handoff' },
      { from: 'orchestrator', to: 'advisor', label: 'Handoff' },
    ],
  },

  /**
   * 2. Cloud Platform - Hybrid Infrastructure
   */
  'cloud-platform': {
    id: 'cloud-platform',
    title: 'Hybrid Cloud Architecture',
    description:
      '4개 클라우드 플랫폼을 연동한 하이브리드 아키텍처. 프론트엔드와 AI 백엔드 분리로 독립적 스케일링.',
    layers: [
      {
        title: 'Compute Layer',
        color: 'from-slate-600 to-slate-700',
        nodes: [
          {
            id: 'vercel',
            label: 'Vercel',
            sublabel: 'Next.js 16 + Edge CDN',
            type: 'primary',
            icon: '▲',
          },
          {
            id: 'cloudrun',
            label: 'Cloud Run',
            sublabel: 'Node.js 22 + Hono + AI SDK',
            type: 'highlight',
            icon: '🚀', // Rocket for Cloud Run
          },
        ],
      },
      {
        title: 'Data Layer',
        color: 'from-emerald-500 to-teal-600',
        nodes: [
          {
            id: 'supabase',
            label: 'Supabase',
            sublabel: 'PostgreSQL + pgVector + RLS',
            type: 'primary',
            icon: '⚡', // Bolt (Supabase uses bolt often) or Generic DB 🗄️. Sticking with simple.
          },
          {
            id: 'upstash',
            label: 'Upstash Redis',
            sublabel: 'Response Cache + Rate Limit',
            type: 'secondary',
            icon: '🔄', // Redis fast cycle
          },
        ],
      },
      {
        title: 'Platform Features',
        color: 'from-purple-500 to-pink-500',
        nodes: [
          {
            id: 'feature-1',
            label: 'Scale to Zero',
            sublabel: '무료 티어 최적화',
            type: 'tertiary',
            icon: '📉',
          },
          {
            id: 'feature-2',
            label: 'Auto Scaling',
            sublabel: '트래픽 기반 확장',
            type: 'tertiary',
            icon: '📈',
          },
          {
            id: 'feature-3',
            label: 'Global CDN',
            sublabel: 'Edge 배포',
            type: 'tertiary',
            icon: '🌍',
          },
        ],
      },
    ],
    connections: [
      { from: 'vercel', to: 'supabase', label: 'Query' },
      { from: 'vercel', to: 'cloudrun', label: 'AI Proxy' },
      { from: 'cloudrun', to: 'supabase', label: 'GraphRAG' },
      { from: 'vercel', to: 'upstash', label: 'Cache' },
      { from: 'cloudrun', to: 'upstash', label: 'Cache' },
    ],
  },

  /**
   * 3. Tech Stack - Frontend Architecture
   */
  'tech-stack': {
    id: 'tech-stack',
    title: 'Frontend Architecture',
    description:
      'Next.js 16 + React 19 + TypeScript 5.9 기반 Next-Gen 프론트엔드 스택. 레이어별 기술 분리.',
    layers: [
      {
        title: 'Presentation Layer',
        color: 'from-pink-500 to-rose-500',
        nodes: [
          {
            id: 'react',
            label: 'React 19',
            sublabel: 'Server Components',
            type: 'primary',
            icon: '⚛️',
          },
          {
            id: 'tailwind',
            label: 'Tailwind CSS 4.1',
            sublabel: 'Oxides Engine',
            type: 'secondary',
            icon: '🎨',
          },
          {
            id: 'animate',
            label: 'Tailwind Animate',
            sublabel: 'CSS Animations',
            type: 'secondary',
            icon: '🎭', // Mask for animation/drama
          },
        ],
      },
      {
        title: 'State Layer',
        color: 'from-amber-500 to-orange-500',
        nodes: [
          {
            id: 'zustand',
            label: 'Zustand 5.0',
            sublabel: 'Global State',
            type: 'primary',
            icon: '🐻',
          },
          {
            id: 'tanstack',
            label: 'TanStack Query v5',
            sublabel: 'Server State',
            type: 'secondary',
            icon: '📡', // Satellite for remote data
          },
          {
            id: 'hooks',
            label: 'React 19 Hooks',
            sublabel: 'Local State',
            type: 'tertiary',
            icon: '⚓', // Hook
          },
        ],
      },
      {
        title: 'Framework Layer',
        color: 'from-blue-500 to-indigo-600',
        nodes: [
          {
            id: 'nextjs',
            label: 'Next.js 16',
            sublabel: 'App Router + PPR',
            type: 'highlight',
            icon: '▲',
          },
          {
            id: 'typescript',
            label: 'TypeScript 5.9',
            sublabel: 'Strict Mode',
            type: 'primary',
            icon: '📘', // Blue book for TS
          },
          {
            id: 'radix',
            label: 'Radix UI',
            sublabel: 'Accessible Primitives',
            type: 'secondary',
            icon: '🧩',
          },
        ],
      },
      {
        title: 'Build & Tools',
        color: 'from-gray-500 to-gray-600',
        nodes: [
          {
            id: 'biome',
            label: 'Biome',
            sublabel: 'Lint + Format',
            type: 'tertiary',
            icon: '🌿',
          },
          {
            id: 'vitest',
            label: 'Vitest',
            sublabel: 'Unit Tests',
            type: 'tertiary',
            icon: '🧪',
          },
          {
            id: 'playwright',
            label: 'Playwright',
            sublabel: 'E2E Tests',
            type: 'tertiary',
            icon: '🎭',
          },
        ],
      },
    ],
    connections: [
      // Framework → Presentation
      { from: 'nextjs', to: 'react', label: 'Renders' },
      { from: 'radix', to: 'react', label: 'Components' },
      { from: 'tailwind', to: 'react', label: 'Styles' },
      // State → Presentation
      { from: 'zustand', to: 'react', label: 'Global' },
      { from: 'hooks', to: 'react', label: 'Local' },
      // State → Framework
      { from: 'tanstack', to: 'nextjs', label: 'Server State' },
      // Framework internal
      { from: 'typescript', to: 'nextjs', label: 'Types' },
      // Build → Framework
      { from: 'biome', to: 'typescript', label: 'Lint' },
      { from: 'vitest', to: 'nextjs', label: 'Test' },
    ],
  },

  /**
   * 4. Vibe Coding - Development Environment
   * Note: Google Antigravity 사용 중 (Cursor/VSCode는 이전에 사용, 현재 미사용)
   */
  'vibe-coding': {
    id: 'vibe-coding',
    title: 'Development Environment',
    description:
      'Google Antigravity IDE + WSL Terminal + Claude Code 중심의 Agentic Development 환경. AI가 만들고 AI가 검증.',
    layers: [
      {
        title: 'IDE (Agent-First)',
        color: 'from-yellow-500 to-amber-600',
        nodes: [
          {
            id: 'antigravity',
            label: 'Google Antigravity',
            sublabel: 'Agent-first IDE (Google)',
            type: 'highlight',
            icon: '🪐', // Planet/Gravity
          },
        ],
      },
      {
        title: 'WSL Terminal (Main)',
        color: 'from-purple-500 to-indigo-600',
        nodes: [
          {
            id: 'claude-code',
            label: 'Claude Code',
            sublabel: 'Main Agent (v2.0+)',
            type: 'highlight',
            icon: '🤖',
          },
          {
            id: 'codex',
            label: 'Codex CLI',
            sublabel: 'Code Review Primary',
            type: 'secondary',
            icon: '🔍',
          },
          {
            id: 'gemini',
            label: 'Gemini CLI',
            sublabel: 'Code Review Secondary',
            type: 'secondary',
            icon: '💎',
          },
        ],
      },
      {
        title: 'MCP Servers (8개)',
        color: 'from-cyan-500 to-teal-600',
        nodes: [
          {
            id: 'serena',
            label: 'Serena',
            sublabel: 'Code Intelligence',
            type: 'secondary',
            icon: '🧠',
          },
          {
            id: 'context7',
            label: 'Context7',
            sublabel: 'Library Docs',
            type: 'secondary',
            icon: '📚',
          },
          {
            id: 'supabase-mcp',
            label: 'Supabase',
            sublabel: 'Database Access',
            type: 'secondary',
            icon: '⚡',
          },
          {
            id: 'vercel-mcp',
            label: 'Vercel',
            sublabel: 'Platform Access',
            type: 'secondary',
            icon: '▲',
          },
          {
            id: 'playwright-mcp',
            label: 'Playwright',
            sublabel: 'E2E Testing',
            type: 'tertiary',
            icon: '🎭',
          },
          {
            id: 'github-mcp',
            label: 'GitHub',
            sublabel: 'Repo Management',
            type: 'tertiary',
            icon: '🐙',
          },
          {
            id: 'tavily-mcp',
            label: 'Tavily',
            sublabel: 'Web Research',
            type: 'tertiary',
            icon: '🌐',
          },
          {
            id: 'seq-think',
            label: 'Sequential Thinking',
            sublabel: 'Complex Planning',
            type: 'tertiary',
            icon: '🔗', // Chain of thought
          },
        ],
      },
    ],
    connections: [
      { from: 'antigravity', to: 'claude-code', label: 'Terminal' },
      { from: 'claude-code', to: 'codex', label: '2-AI Review' },
      { from: 'claude-code', to: 'gemini', label: '2-AI Review' },
      // MCP Servers (8개 전체)
      { from: 'claude-code', to: 'serena', label: 'MCP' },
      { from: 'claude-code', to: 'context7', label: 'MCP' },
      { from: 'claude-code', to: 'supabase-mcp', label: 'MCP' },
      { from: 'claude-code', to: 'vercel-mcp', label: 'MCP' },
      { from: 'claude-code', to: 'playwright-mcp', label: 'MCP' },
      { from: 'claude-code', to: 'github-mcp', label: 'MCP' },
      { from: 'claude-code', to: 'tavily-mcp', label: 'MCP' },
      { from: 'claude-code', to: 'seq-think', label: 'MCP' },
    ],
  },
};

/**
 * 카드 ID로 다이어그램 데이터 조회
 */
export function getDiagramByCardId(cardId: string): ArchitectureDiagram | null {
  return ARCHITECTURE_DIAGRAMS[cardId] || null;
}

/**
 * 노드 타입별 스타일 매핑
 */
export const NODE_STYLES: Record<
  DiagramNode['type'],
  { bg: string; border: string; text: string }
> = {
  primary: {
    bg: 'bg-white/15',
    border: 'border-white/30',
    text: 'text-white',
  },
  secondary: {
    bg: 'bg-white/10',
    border: 'border-white/20',
    text: 'text-white/90',
  },
  tertiary: {
    bg: 'bg-white/5',
    border: 'border-white/10',
    text: 'text-white/70',
  },
  highlight: {
    bg: 'bg-gradient-to-br from-yellow-500/20 to-amber-500/20',
    border: 'border-yellow-400/50',
    text: 'text-yellow-100',
  },
};
