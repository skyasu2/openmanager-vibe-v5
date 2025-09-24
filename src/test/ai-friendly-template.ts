/**
 * @fileoverview AI-Friendly Test Template for OpenManager VIBE
 * @description Standardized test template optimized for AI parsing and understanding
 * @author Claude AI Assistant
 * @since 2025-09-24
 * @category Testing Template
 * @tags [ai-friendly, template, standardized]
 */

/**
 * @namespace AIFriendlyTestTypes
 * @description Type definitions for AI-friendly testing patterns
 */
export namespace AIFriendlyTestTypes {
  /**
   * @interface TestMetadata
   * @description Structured metadata for AI parsing
   */
  export interface TestMetadata {
    /** @description Unique identifier for this test */
    testId: string;

    /** @description Human-readable test purpose */
    purpose: string;

    /** @description Test complexity level (1-5) */
    complexity: 1 | 2 | 3 | 4 | 5;

    /** @description Test categories for AI classification */
    categories: TestCategory[];

    /** @description Expected execution time in milliseconds */
    expectedDuration: number;

    /** @description Dependencies this test requires */
    dependencies: string[];

    /** @description What this test validates */
    validates: string[];

    /** @description Test priority level */
    priority: 'critical' | 'high' | 'medium' | 'low';

    /** @description Related components or features */
    relatedFeatures: string[];

    /** @description AI context hints */
    aiContext: {
      intent: string;
      expectedBehavior: string;
      errorScenarios: string[];
      successCriteria: string[];
    };
  }

  /**
   * @type TestCategory
   * @description Predefined categories for AI classification
   */
  export type TestCategory =
    | 'unit-test'
    | 'integration-test'
    | 'e2e-test'
    | 'performance-test'
    | 'security-test'
    | 'ui-component'
    | 'api-endpoint'
    | 'data-validation'
    | 'error-handling'
    | 'accessibility'
    | 'user-interaction'
    | 'business-logic'
    | 'edge-cases';

  /**
   * @interface TestScenario
   * @description Structured test scenario for AI understanding
   */
  export interface TestScenario {
    /** @description Scenario name following consistent pattern */
    name: string;

    /** @description What this scenario tests */
    description: string;

    /** @description Initial state or setup */
    given: string;

    /** @description Action being tested */
    when: string;

    /** @description Expected outcome */
    then: string;

    /** @description Additional assertions */
    and?: string[];
  }

  /**
   * @interface MockDataTemplate
   * @description Standardized mock data structure
   */
  export interface MockDataTemplate {
    /** @description Mock data identifier */
    id: string;

    /** @description What this mock represents */
    represents: string;

    /** @description Mock data structure */
    data: Record<string, any>;

    /** @description Variations for different test scenarios */
    variations: {
      valid: Record<string, any>;
      invalid: Record<string, any>;
      edge: Record<string, any>;
    };
  }
}

/**
 * @class AIFriendlyTestTemplate
 * @description Base template class for creating AI-friendly tests
 */
export class AIFriendlyTestTemplate {
  private metadata: AIFriendlyTestTypes.TestMetadata;

  constructor(metadata: AIFriendlyTestTypes.TestMetadata) {
    this.metadata = metadata;
  }

  /**
   * @method getTestHeader
   * @description Generates standardized test header for AI parsing
   * @returns {string} Formatted test header with metadata
   */
  public getTestHeader(): string {
    return `
/**
 * @test ${this.metadata.testId}
 * @description ${this.metadata.purpose}
 * @complexity ${this.metadata.complexity}/5
 * @categories ${this.metadata.categories.join(', ')}
 * @priority ${this.metadata.priority}
 * @duration ~${this.metadata.expectedDuration}ms
 * @validates ${this.metadata.validates.join(' | ')}
 *
 * @aiContext
 * Intent: ${this.metadata.aiContext.intent}
 * Expected: ${this.metadata.aiContext.expectedBehavior}
 * Success: ${this.metadata.aiContext.successCriteria.join(' AND ')}
 *
 * @relatedFeatures ${this.metadata.relatedFeatures.join(', ')}
 * @dependencies ${this.metadata.dependencies.join(', ')}
 */
`;
  }

  /**
   * @method createTestSuite
   * @description Creates structured test suite with AI-friendly patterns
   * @param {AIFriendlyTestTypes.TestScenario[]} scenarios - Test scenarios
   * @returns {string} Formatted test suite code
   */
  public createTestSuite(scenarios: AIFriendlyTestTypes.TestScenario[]): string {
    const header = this.getTestHeader();
    const suiteContent = scenarios.map(scenario => this.formatScenario(scenario)).join('\n\n');

    return `${header}
describe('${this.metadata.testId}: ${this.metadata.purpose}', () => {
${suiteContent}
});`;
  }

  /**
   * @method formatScenario
   * @description Formats individual test scenario with BDD pattern
   * @param {AIFriendlyTestTypes.TestScenario} scenario - Test scenario
   * @returns {string} Formatted scenario code
   * @private
   */
  private formatScenario(scenario: AIFriendlyTestTypes.TestScenario): string {
    return `  /**
   * @scenario ${scenario.name}
   * @given ${scenario.given}
   * @when ${scenario.when}
   * @then ${scenario.then}
   ${scenario.and ? `* @and ${scenario.and.join(' AND ')}` : ''}
   */
  it('${scenario.description}', async () => {
    // Given: ${scenario.given}
    // When: ${scenario.when}
    // Then: ${scenario.then}
    ${scenario.and ? `// And: ${scenario.and.join(' AND ')}` : ''}

    // TODO: Implement test logic
    expect(true).toBe(true); // Placeholder
  });`;
  }
}

/**
 * @namespace AIFriendlyTestHelpers
 * @description Helper functions for AI-friendly testing
 */
export namespace AIFriendlyTestHelpers {
  /**
   * @function createMockData
   * @description Creates consistent mock data following AI-friendly patterns
   * @param {string} type - Type of mock data to create
   * @param {Partial<AIFriendlyTestTypes.MockDataTemplate>} overrides - Custom overrides
   * @returns {AIFriendlyTestTypes.MockDataTemplate} Structured mock data
   */
  export function createMockData(
    type: string,
    overrides: Partial<AIFriendlyTestTypes.MockDataTemplate> = {}
  ): AIFriendlyTestTypes.MockDataTemplate {
    return {
      id: `mock-${type}-${Date.now()}`,
      represents: `Mock data for ${type}`,
      data: {},
      variations: {
        valid: {},
        invalid: {},
        edge: {}
      },
      ...overrides
    };
  }

  /**
   * @function validateTestStructure
   * @description Validates test structure for AI compatibility
   * @param {any} testStructure - Test structure to validate
   * @returns {boolean} Whether structure is AI-friendly
   */
  export function validateTestStructure(testStructure: any): boolean {
    // Basic validation for AI-friendly structure
    const required = ['describe', 'it', 'expect'];
    return required.every(key =>
      typeof testStructure[key] === 'function' ||
      testStructure.toString().includes(key)
    );
  }

  /**
   * @function generateTestMetadata
   * @description Auto-generates test metadata for AI consumption
   * @param {string} componentName - Name of component being tested
   * @param {string} testType - Type of test (unit, integration, e2e)
   * @returns {AIFriendlyTestTypes.TestMetadata} Generated metadata
   */
  export function generateTestMetadata(
    componentName: string,
    testType: string
  ): AIFriendlyTestTypes.TestMetadata {
    return {
      testId: `${testType}-${componentName.toLowerCase()}-${Date.now()}`,
      purpose: `${testType} tests for ${componentName}`,
      complexity: 2,
      categories: [testType as AIFriendlyTestTypes.TestCategory],
      expectedDuration: 100,
      dependencies: ['vitest', '@testing-library/react'],
      validates: [`${componentName} functionality`],
      priority: 'medium',
      relatedFeatures: [componentName],
      aiContext: {
        intent: `Validate ${componentName} behavior`,
        expectedBehavior: `Component should work as designed`,
        errorScenarios: ['Invalid props', 'Missing dependencies'],
        successCriteria: ['Renders correctly', 'Handles interactions']
      }
    };
  }
}

/**
 * @constant AI_FRIENDLY_TEST_PATTERNS
 * @description Common patterns for AI to learn and replicate
 */
export const AI_FRIENDLY_TEST_PATTERNS = {
  /**
   * @pattern NAMING_CONVENTIONS
   * @description Consistent naming patterns for AI learning
   */
  NAMING_CONVENTIONS: {
    testFiles: /^.*\.ai-test\.(ts|tsx)$/,
    testSuites: /^(Unit|Integration|E2E|Performance)Test_.*$/,
    testCases: /^should_.*_when_.*$/,
    mockData: /^mock[A-Z][a-zA-Z]*Data$/,
    assertions: /^(expect|assert)[A-Z][a-zA-Z]*$/
  },

  /**
   * @pattern STRUCTURE_TEMPLATES
   * @description Standard structures for AI replication
   */
  STRUCTURE_TEMPLATES: {
    basicTest: `
      describe('ComponentName Tests', () => {
        it('should behave correctly when condition met', () => {
          // Arrange
          // Act
          // Assert
        });
      });
    `,

    bddTest: `
      describe('Feature: ComponentName', () => {
        it('should outcome when action performed', () => {
          // Given: initial state
          // When: action performed
          // Then: expected outcome
        });
      });
    `,

    aiContextTest: `
      /**
       * @aiTest true
       * @purpose Validate specific behavior
       * @complexity 2/5
       */
      describe('AI-Friendly Test Suite', () => {
        // AI can understand this structure
      });
    `
  }
} as const;

/**
 * @example AI_FRIENDLY_TEST_USAGE
 * @description Example usage for AI learning
 *
 * ```typescript
 * import { AIFriendlyTestTemplate, AIFriendlyTestHelpers } from './ai-friendly-template';
 *
 * // 1. Generate metadata
 * const metadata = AIFriendlyTestHelpers.generateTestMetadata('ServerCard', 'unit');
 *
 * // 2. Create template instance
 * const template = new AIFriendlyTestTemplate(metadata);
 *
 * // 3. Define scenarios
 * const scenarios = [
 *   {
 *     name: 'render_success',
 *     description: 'should render server card when valid data provided',
 *     given: 'valid server data is provided',
 *     when: 'component is rendered',
 *     then: 'card displays server information correctly'
 *   }
 * ];
 *
 * // 4. Generate test suite
 * const testSuite = template.createTestSuite(scenarios);
 * ```
 */

export default AIFriendlyTestTemplate;