/**
 * MCP 환경변수 검증 시스템
 * 서브 에이전트가 사용하는 MCP 서버들의 필수 환경변수를 검증
 */

export interface ValidationResult {
  valid: boolean;
  missing: string[];
  warnings: string[];
}

export interface MCPRequirements {
  [mcpName: string]: string[];
}

export class MCPValidator {
  /**
   * MCP별 필수 환경변수 정의
   */
  private static readonly MCP_REQUIREMENTS: MCPRequirements = {
    github: ['GITHUB_TOKEN'],
    supabase: ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'],
    'tavily-mcp': ['TAVILY_API_KEY'],
    // filesystem, memory, sequential-thinking, playwright, context7는 환경변수 불필요
  };

  // 선택적 환경변수 (MCP 동작에는 필수 아님)
  private static readonly OPTIONAL_VARS = {
    supabase: ['SUPABASE_PROJECT_REF', 'SUPABASE_ACCESS_TOKEN'],
  };

  /**
   * 모든 MCP 서버의 환경변수 검증
   */
  static validateEnvironment(): ValidationResult {
    const missing: string[] = [];
    const warnings: string[] = [];

    // 각 MCP별 검증
    Object.entries(this.MCP_REQUIREMENTS).forEach(([mcp, vars]) => {
      vars.forEach(varName => {
        const value = process.env[varName];

        if (!value || value.trim() === '') {
          missing.push(`${mcp}: ${varName}`);
        } else if (value.includes('PLACEHOLDER')) {
          warnings.push(`${mcp}: ${varName} contains placeholder value`);
        }
      });
    });

    // 추가 검증: Supabase URL 형식
    const supabaseUrl = process.env.SUPABASE_URL;
    if (supabaseUrl && !supabaseUrl.includes('.supabase.co')) {
      warnings.push('SUPABASE_URL does not appear to be a valid Supabase URL');
    }

    return {
      valid: missing.length === 0,
      missing,
      warnings,
    };
  }

  /**
   * 특정 MCP 서버의 환경변수 검증
   */
  static validateMCP(mcpName: string): ValidationResult {
    const requirements = this.MCP_REQUIREMENTS[mcpName] || [];
    const missing: string[] = [];
    const warnings: string[] = [];

    requirements.forEach(varName => {
      const value = process.env[varName];

      if (!value || value.trim() === '') {
        missing.push(varName);
      } else if (value.includes('PLACEHOLDER')) {
        warnings.push(`${varName} contains placeholder value`);
      }
    });

    return {
      valid: missing.length === 0,
      missing,
      warnings,
    };
  }

  /**
   * 환경변수 검증 결과를 사람이 읽기 쉬운 형태로 출력
   */
  static formatValidationResult(result: ValidationResult): string {
    if (result.valid && result.warnings.length === 0) {
      return '✅ All MCP environment variables are properly configured';
    }

    let output = '';

    if (result.missing.length > 0) {
      output += '❌ Missing required environment variables:\n';
      result.missing.forEach(item => {
        output += `   - ${item}\n`;
      });
    }

    if (result.warnings.length > 0) {
      output += '\n⚠️  Warnings:\n';
      result.warnings.forEach(warning => {
        output += `   - ${warning}\n`;
      });
    }

    return output;
  }

  /**
   * 서브 에이전트별 필요한 MCP 검증
   */
  static validateForAgent(agentType: string): ValidationResult {
    // 에이전트별 주요 MCP 매핑
    const agentMCPMap: { [agent: string]: string[] } = {
      'ai-systems-engineer': ['supabase'],
      'database-administrator': ['supabase'],
      'mcp-server-admin': ['github'],
      'issue-summary': ['supabase', 'tavily-mcp'],
      'code-review-specialist': ['github'],
      'gemini-cli-collaborator': ['github'],
      'test-automation-specialist': ['github'],
    };

    const requiredMCPs = agentMCPMap[agentType] || [];
    const allMissing: string[] = [];
    const allWarnings: string[] = [];

    requiredMCPs.forEach(mcp => {
      const result = this.validateMCP(mcp);
      result.missing.forEach(m => allMissing.push(`${mcp}: ${m}`));
      result.warnings.forEach(w => allWarnings.push(w));
    });

    return {
      valid: allMissing.length === 0,
      missing: allMissing,
      warnings: allWarnings,
    };
  }
}
