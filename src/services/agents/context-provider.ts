/**
 * 서브 에이전트 컨텍스트 제공자
 * 각 에이전트에게 필요한 프로젝트 컨텍스트와 설정을 제공
 */

import { MCPValidator } from './mcp-validator';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface AgentContext {
  projectRoot: string;
  env: string;
  timestamp: string;
  agent: {
    type: string;
    name: string;
    description: string;
  };
  project: {
    name: string;
    version: string;
    techStack: string[];
    primaryLanguage: string;
  };
  mcp: {
    available: string[];
    validated: boolean;
    issues: string[];
  };
  specific?: Record<string, any>;
}

export class AgentContextProvider {
  /**
   * 기본 프로젝트 설정 로드
   */
  private static async loadProjectConfig(): Promise<any> {
    try {
      // package.json에서 기본 정보 추출
      const packageJsonPath = path.join(__dirname, '../../../package.json');
      const packageJsonContent = fs.readFileSync(packageJsonPath, 'utf-8');
      const packageJson = JSON.parse(packageJsonContent);

      return {
        name: packageJson.name || 'openmanager-vibe-v5',
        version: packageJson.version || '5.65.1',
        techStack: [
          'Next.js 15',
          'React 19',
          'TypeScript 5.7',
          'Tailwind CSS',
          'Prisma',
          'Vitest',
        ],
        primaryLanguage: 'TypeScript',
      };
    } catch (error) {
      console.warn('Failed to load project config:', error);
      return {
        name: 'openmanager-vibe-v5',
        version: '5.65.1',
        techStack: ['Next.js', 'React', 'TypeScript'],
        primaryLanguage: 'TypeScript',
      };
    }
  }

  /**
   * 에이전트별 특수 컨텍스트 로드
   */
  private static async loadAgentSpecificContext(
    agentType: string
  ): Promise<Record<string, any>> {
    const specificContexts: Record<string, Record<string, any>> = {
      'ai-systems-engineer': {
        aiConfig: {
          mode: process.env.GOOGLE_AI_ENABLED === 'true' ? 'DUAL' : 'LOCAL',
          googleAIKey: !!process.env.GOOGLE_AI_API_KEY,
          supabaseConfigured: !!process.env.SUPABASE_URL,
        },
        primaryFiles: [
          'src/services/ai/SimplifiedQueryEngine.ts',
          'src/services/ai/supabase-rag-engine.ts',
          'docs/ai-system-unified-guide.md',
        ],
      },
      'database-administrator': {
        databases: {
          supabase: {
            url: process.env.SUPABASE_URL,
            configured: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
          },
          redis: {
            configured: !!process.env.UPSTASH_REDIS_REST_URL,
          },
        },
        primaryFiles: [
          'prisma/schema.prisma',
          'src/services/supabase/SupabaseTimeSeriesManager.ts',
        ],
      },
      'mcp-server-admin': {
        mcpServers: [
          'filesystem',
          'github',
          'memory',
          'supabase',
          'context7',
          'tavily-mcp',
          'sequential-thinking',
          'playwright',
          'serena',
        ],
        configFile: '.claude/mcp.json',
      },
      'code-review-specialist': {
        lintConfig: '.eslintrc.json',
        prettierConfig: '.prettierrc',
        typescriptConfig: 'tsconfig.json',
        testFramework: 'vitest',
      },
      'test-automation-specialist': {
        testFrameworks: ['vitest', 'playwright'],
        testDirs: ['tests', 'src/__tests__'],
        coverageThreshold: 70,
      },
      'ux-performance-optimizer': {
        framework: 'Next.js 15',
        styling: 'Tailwind CSS',
        performanceTargets: {
          LCP: '< 2.5s',
          CLS: '< 0.1',
          FID: '< 100ms',
        },
      },
    };

    return specificContexts[agentType] || {};
  }

  /**
   * 에이전트 정의 정보 로드
   */
  private static getAgentDefinition(agentType: string): {
    name: string;
    description: string;
  } {
    const definitions: Record<string, { name: string; description: string }> = {
      'ai-systems-engineer': {
        name: 'AI 시스템 아키텍처 전문가',
        description:
          'Local AI와 Google AI 듀얼 모드 설계, SimplifiedQueryEngine 최적화',
      },
      'database-administrator': {
        name: '데이터베이스 최적화 전문가',
        description: 'Supabase PostgreSQL과 Upstash Redis 최적화',
      },
      'mcp-server-admin': {
        name: 'MCP 인프라 엔지니어',
        description: 'Claude Code MCP 서버 통합 관리',
      },
      'issue-summary': {
        name: 'DevOps 모니터링 엔지니어',
        description: '24/7 시스템 상태 감시와 인시던트 대응',
      },
      'code-review-specialist': {
        name: '코드 품질 검토 전문가',
        description: '중복 코드 탐지, 보안 취약점 스캔',
      },
      'doc-structure-guardian': {
        name: '문서 관리 전문가',
        description: 'JBGE 원칙으로 핵심 문서 관리',
      },
      'ux-performance-optimizer': {
        name: '프론트엔드 UX 엔지니어',
        description: 'Next.js 15 성능 최적화',
      },
      'gemini-cli-collaborator': {
        name: 'AI 협업 전문가',
        description: 'Gemini CLI로 Claude와 협업',
      },
      'test-automation-specialist': {
        name: 'QA 자동화 엔지니어',
        description: '테스트 자동화 및 커버리지 관리',
      },
      'central-supervisor': {
        name: '중앙 오케스트레이터',
        description: '복잡한 다중 작업 조율',
      },
    };

    return (
      definitions[agentType] || {
        name: agentType,
        description: 'Specialized agent',
      }
    );
  }

  /**
   * 완전한 에이전트 컨텍스트 구축
   */
  static async buildContext(agentType: string): Promise<AgentContext> {
    const projectConfig = await this.loadProjectConfig();
    const specificContext = await this.loadAgentSpecificContext(agentType);
    const agentDef = this.getAgentDefinition(agentType);

    // MCP 검증
    const mcpValidation = MCPValidator.validateForAgent(agentType);

    return {
      projectRoot: process.cwd(),
      env: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
      agent: {
        type: agentType,
        ...agentDef,
      },
      project: projectConfig,
      mcp: {
        available: [
          'filesystem',
          'github',
          'memory',
          'supabase',
          'context7',
          'tavily-mcp',
          'sequential-thinking',
          'playwright',
          'serena',
        ],
        validated: mcpValidation.valid,
        issues: [...mcpValidation.missing, ...mcpValidation.warnings],
      },
      specific: specificContext,
    };
  }

  /**
   * 컨텍스트를 프롬프트 형식으로 포맷
   */
  static formatContextForPrompt(context: AgentContext): string {
    let prompt = `## Agent Context

You are operating as: ${context.agent.name} (${context.agent.type})
Role: ${context.agent.description}

### Project Information
- Name: ${context.project.name} v${context.project.version}
- Primary Language: ${context.project.primaryLanguage}
- Tech Stack: ${context.project.techStack.join(', ')}
- Environment: ${context.env}
- Working Directory: ${context.projectRoot}

### MCP Server Status
- Available Servers: ${context.mcp.available.join(', ')}
- Validation: ${context.mcp.validated ? '✅ Passed' : '❌ Failed'}
`;

    if (context.mcp.issues.length > 0) {
      prompt += `- Issues:\n${context.mcp.issues.map(i => `  - ${i}`).join('\n')}\n`;
    }

    if (context.specific && Object.keys(context.specific).length > 0) {
      prompt += '\n### Agent-Specific Context\n';
      prompt += JSON.stringify(context.specific, null, 2);
    }

    return prompt;
  }
}
