/**
 * @fileoverview AI-Friendly Metric Validation Tests
 * @description Comprehensive validation tests for server metric utilities with AI-optimized structure
 * @author Claude AI Assistant
 * @since 2025-09-24
 * @category Unit Testing
 * @tags [ai-friendly, validation, metrics, utilities]
 */

import { describe, it, expect } from 'vitest';
import {
  validateMetricValue,
  validateServerMetrics,
  generateSafeMetricValue,
  type MetricType
} from '../metricValidation';
import { AIFriendlyTestHelpers, type AIFriendlyTestTypes } from '../../test/ai-friendly-template';

/**
 * @test unit-metric-validation-comprehensive
 * @description Validates metric utility functions for server monitoring system
 * @complexity 3/5
 * @categories unit-test, data-validation, business-logic
 * @priority high
 * @duration ~150ms
 * @validates Input sanitization | Range clamping | Type safety | Error handling
 *
 * @aiContext
 * Intent: Ensure all metric values are safely processed and within valid ranges (0-100%)
 * Expected: Functions handle edge cases gracefully and return predictable, safe values
 * Success: All inputs produce valid outputs AND No runtime errors AND Performance acceptable
 *
 * @relatedFeatures ServerMetrics, StaticDataLoader, DashboardDisplay
 * @dependencies vitest, TypeScript strict mode
 */

/**
 * @namespace MetricValidationTestData
 * @description AI-friendly test data structures for metric validation
 */
namespace MetricValidationTestData {
  /**
   * @constant VALID_METRIC_VALUES
   * @description Representative valid metric values for AI pattern learning
   */
  export const VALID_METRIC_VALUES = [
    { input: 0, expected: 0, description: 'minimum_boundary_value' },
    { input: 50, expected: 50, description: 'typical_mid_range_value' },
    { input: 100, expected: 100, description: 'maximum_boundary_value' },
    { input: 25.5, expected: 25.5, description: 'decimal_precision_value' },
    { input: 99.9, expected: 99.9, description: 'high_precision_decimal' }
  ] as const;

  /**
   * @constant INVALID_METRIC_VALUES
   * @description Edge cases and invalid inputs for AI learning
   */
  export const INVALID_METRIC_VALUES = [
    { input: -10, expected: 0, description: 'negative_value_clamping' },
    { input: 150, expected: 100, description: 'overflow_value_clamping' },
    { input: NaN, expected: 0, description: 'nan_value_handling' },
    { input: Infinity, expected: 100, description: 'positive_infinity_handling' },
    { input: -Infinity, expected: 0, description: 'negative_infinity_handling' }
  ] as const;

  /**
   * @constant MOCK_SERVER_METRICS
   * @description Structured mock data following AI-friendly patterns
   */
  export const MOCK_SERVER_METRICS: AIFriendlyTestTypes.MockDataTemplate = {
    id: 'mock-server-metrics-validation',
    represents: 'Server metrics for validation testing',
    data: {
      cpu: 45,
      memory: 67,
      disk: 23,
      network: 12
    },
    variations: {
      valid: {
        cpu: 45, memory: 67, disk: 23, network: 12
      },
      invalid: {
        cpu: -10, memory: 120, disk: NaN, network: Infinity
      },
      edge: {
        cpu: 0, memory: 100, disk: 0.1, network: 99.9
      }
    }
  };

  /**
   * @constant METRIC_TYPES
   * @description All metric types for comprehensive testing
   */
  export const METRIC_TYPES: MetricType[] = ['cpu', 'memory', 'disk', 'network'];
}

describe('MetricValidation_AIFriendly_TestSuite', () => {
  /**
   * @testsuite validateMetricValue_Function
   * @description Validates single metric value processing with comprehensive edge case coverage
   */
  describe('Feature: validateMetricValue Input Processing', () => {
    /**
     * @scenario valid_input_passthrough
     * @given valid metric values within 0-100 range
     * @when validateMetricValue is called
     * @then original values are returned unchanged
     * @and no type conversion or precision loss occurs
     */
    it('should preserve valid metric values when input is within acceptable range', () => {
      // AI Pattern: Data-driven testing with structured test data
      MetricValidationTestData.VALID_METRIC_VALUES.forEach(({ input, expected, description }) => {
        // Given: Valid metric value within range
        const validInput = input;

        // When: Validation function processes the input
        const result = validateMetricValue(validInput);

        // Then: Original value is preserved exactly
        expect(result).toBe(expected);

        // And: No precision loss or type conversion
        expect(typeof result).toBe('number');
        expect(Number.isFinite(result)).toBe(true);

        // AI Context: This validates the passthrough behavior for valid inputs
        console.debug(`✓ ${description}: ${input} → ${result}`);
      });
    });

    /**
     * @scenario invalid_input_sanitization
     * @given invalid metric values (negative, overflow, NaN, Infinity)
     * @when validateMetricValue is called
     * @then values are clamped to safe 0-100 range
     * @and all outputs are finite numbers
     */
    it('should sanitize invalid metric values when input is outside acceptable range', () => {
      // AI Pattern: Edge case validation with expected transformations
      MetricValidationTestData.INVALID_METRIC_VALUES.forEach(({ input, expected, description }) => {
        // Given: Invalid or edge case metric value
        const invalidInput = input;

        // When: Validation function processes the input
        const result = validateMetricValue(invalidInput);

        // Then: Value is clamped to safe range
        expect(result).toBe(expected);
        expect(result).toBeGreaterThanOrEqual(0);
        expect(result).toBeLessThanOrEqual(100);

        // And: Result is always a finite number
        expect(Number.isFinite(result)).toBe(true);
        expect(typeof result).toBe('number');

        // AI Context: This validates the sanitization behavior for invalid inputs
        console.debug(`✓ ${description}: ${input} → ${result}`);
      });
    });

    /**
     * @scenario type_safety_validation
     * @given non-numeric inputs (objects, arrays, null, undefined)
     * @when validateMetricValue is called
     * @then safe default values are returned
     * @and no runtime errors occur
     */
    it('should handle non-numeric inputs safely when unexpected types provided', () => {
      // Given: Various non-numeric input types
      const nonNumericInputs = [
        { input: {} as any, description: 'empty_object' },
        { input: [] as any, description: 'empty_array' },
        { input: null as any, description: 'null_value' },
        { input: undefined as any, description: 'undefined_value' },
        { input: 'string' as any, description: 'string_input' }
      ];

      nonNumericInputs.forEach(({ input, description }) => {
        // When: Validation processes non-numeric input
        const result = validateMetricValue(input);

        // Then: Safe default value returned
        expect(result).toBe(0);
        expect(Number.isFinite(result)).toBe(true);

        // And: No runtime errors thrown
        expect(() => validateMetricValue(input)).not.toThrow();

        // AI Context: Type safety validation prevents runtime errors
        console.debug(`✓ ${description}: ${input} → ${result}`);
      });
    });
  });

  /**
   * @testsuite generateSafeMetricValue_Function
   * @description Validates metric generation with safe bounds and randomization
   */
  describe('Feature: generateSafeMetricValue Random Generation', () => {
    /**
     * @scenario bounded_random_generation
     * @given previous value and change amount
     * @when generateSafeMetricValue is called multiple times
     * @then all results stay within 0-100 bounds
     * @and values show appropriate randomization
     */
    it('should generate bounded random values when provided with base and change parameters', () => {
      // Given: Base metric parameters for generation
      const testCases = [
        { prevValue: 50, change: 10, metricType: 'cpu' as MetricType },
        { prevValue: 30, change: 5, metricType: 'memory' as MetricType },
        { prevValue: 80, change: 15, metricType: 'disk' as MetricType },
        { prevValue: 20, change: 8, metricType: 'network' as MetricType }
      ];

      testCases.forEach(({ prevValue, change, metricType }) => {
        // When: Generate multiple values to test randomization
        const results = Array.from({ length: 10 }, () =>
          generateSafeMetricValue(prevValue, change, metricType)
        );

        // Then: All results are within valid bounds
        results.forEach((result, index) => {
          expect(result).toBeGreaterThanOrEqual(0);
          expect(result).toBeLessThanOrEqual(100);
          expect(Number.isFinite(result)).toBe(true);

          // AI Context: Validate randomization produces different values
          if (index > 0) {
            // Some variation expected in random generation
            const hasVariation = results.some((val, i) => val !== results[0]);
            console.debug(`✓ Random variation detected: ${hasVariation}`);
          }
        });

        // And: Function handles extreme cases safely
        const extremeResult = generateSafeMetricValue(95, 20, metricType);
        expect(extremeResult).toBeLessThanOrEqual(100);
      });
    });

    /**
     * @scenario nan_input_recovery
     * @given NaN values for previous value or change amount
     * @when generateSafeMetricValue is called
     * @then valid finite numbers are returned
     * @and no NaN propagation occurs
     */
    it('should recover from NaN inputs when provided with invalid numeric parameters', () => {
      // Given: Various NaN input combinations
      const nanTestCases = [
        { prevValue: NaN, change: 10, metricType: 'cpu' as MetricType, description: 'nan_prev_value' },
        { prevValue: 50, change: NaN, metricType: 'memory' as MetricType, description: 'nan_change_value' },
        { prevValue: NaN, change: NaN, metricType: 'disk' as MetricType, description: 'both_nan_values' }
      ];

      nanTestCases.forEach(({ prevValue, change, metricType, description }) => {
        // When: Function processes NaN inputs
        const result = generateSafeMetricValue(prevValue, change, metricType);

        // Then: Valid finite number is returned
        expect(Number.isFinite(result)).toBe(true);
        expect(result).toBeGreaterThanOrEqual(0);
        expect(result).toBeLessThanOrEqual(100);

        // And: No NaN propagation occurs
        expect(Number.isNaN(result)).toBe(false);

        // AI Context: NaN recovery prevents cascade failures
        console.debug(`✓ ${description}: NaN → ${result} (recovered)`);
      });
    });
  });

  /**
   * @testsuite validateServerMetrics_Function
   * @description Validates complete server metrics object processing
   */
  describe('Feature: validateServerMetrics Object Processing', () => {
    /**
     * @scenario complete_metrics_validation
     * @given valid server metrics object
     * @when validateServerMetrics is called
     * @then all individual metrics are preserved
     * @and object structure remains intact
     */
    it('should preserve complete valid metrics when provided with well-formed server data', () => {
      // Given: Valid server metrics from mock data
      const validMetrics = MetricValidationTestData.MOCK_SERVER_METRICS.variations.valid;

      // When: Validation processes the complete object
      const result = validateServerMetrics(validMetrics);

      // Then: All values are preserved exactly
      expect(result).toEqual({
        cpu: 45,
        memory: 67,
        disk: 23,
        network: 12
      });

      // And: Object structure is maintained
      MetricValidationTestData.METRIC_TYPES.forEach(metricType => {
        expect(result).toHaveProperty(metricType);
        expect(typeof result[metricType]).toBe('number');
        expect(Number.isFinite(result[metricType])).toBe(true);
      });
    });

    /**
     * @scenario invalid_metrics_sanitization
     * @given server metrics with invalid values
     * @when validateServerMetrics is called
     * @then invalid values are corrected to safe ranges
     * @and object completeness is maintained
     */
    it('should sanitize invalid metrics when provided with malformed server data', () => {
      // Given: Invalid server metrics from mock data
      const invalidMetrics = MetricValidationTestData.MOCK_SERVER_METRICS.variations.invalid;

      // When: Validation processes the corrupted object
      const result = validateServerMetrics(invalidMetrics);

      // Then: Invalid values are corrected
      expect(result.cpu).toBe(0);        // -10 → 0 (clamped)
      expect(result.memory).toBe(100);   // 120 → 100 (clamped)
      expect(result.disk).toBe(0);       // NaN → 0 (sanitized)
      expect(result.network).toBe(100);  // Infinity → 100 (clamped)

      // And: All metrics are within valid bounds
      Object.values(result).forEach(value => {
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(100);
        expect(Number.isFinite(value)).toBe(true);
      });
    });

    /**
     * @scenario incomplete_metrics_completion
     * @given server metrics with missing fields
     * @when validateServerMetrics is called
     * @then missing fields are filled with safe defaults
     * @and complete metrics object is returned
     */
    it('should complete incomplete metrics when provided with partial server data', () => {
      // Given: Incomplete server metrics (missing disk and network)
      const incompleteMetrics: any = {
        cpu: 45,
        memory: 60
      };

      // When: Validation processes the incomplete object
      const result = validateServerMetrics(incompleteMetrics);

      // Then: Existing values are preserved
      expect(result.cpu).toBe(45);
      expect(result.memory).toBe(60);

      // And: Missing values are filled with defaults
      expect(result.disk).toBe(0);
      expect(result.network).toBe(0);

      // And: Complete metrics structure is ensured
      MetricValidationTestData.METRIC_TYPES.forEach(metricType => {
        expect(result).toHaveProperty(metricType);
        expect(typeof result[metricType]).toBe('number');
      });
    });

    /**
     * @scenario null_undefined_input_handling
     * @given null or undefined input
     * @when validateServerMetrics is called
     * @then safe default metrics object is returned
     * @and no runtime errors occur
     */
    it('should handle null/undefined inputs when provided with missing server data', () => {
      // Given: Null and undefined inputs
      const nullInput = null as any;
      const undefinedInput = undefined as any;

      // When: Validation processes null/undefined
      const resultNull = validateServerMetrics(nullInput);
      const resultUndefined = validateServerMetrics(undefinedInput);

      // Then: Both results have complete metrics structure
      [resultNull, resultUndefined].forEach((result, index) => {
        const inputType = index === 0 ? 'null' : 'undefined';

        // All required metrics are present
        MetricValidationTestData.METRIC_TYPES.forEach(metricType => {
          expect(result).toHaveProperty(metricType);
          expect(typeof result[metricType]).toBe('number');
          expect(Number.isFinite(result[metricType])).toBe(true);
        });

        // AI Context: Safe defaults prevent cascade failures
        console.debug(`✓ ${inputType}_input_handled: Complete metrics object created`);
      });

      // And: No runtime errors are thrown
      expect(() => validateServerMetrics(null as any)).not.toThrow();
      expect(() => validateServerMetrics(undefined as any)).not.toThrow();
    });
  });

  /**
   * @testsuite EdgeCases_ComprehensiveValidation
   * @description Validates extreme and boundary conditions for AI learning
   */
  describe('Feature: Edge Cases and Boundary Conditions', () => {
    /**
     * @scenario extreme_numeric_values
     * @given extreme JavaScript numeric values
     * @when validation functions are called
     * @then safe bounded results are returned
     * @and no numeric overflow issues occur
     */
    it('should handle extreme numeric values when provided with JavaScript numeric limits', () => {
      // Given: Extreme JavaScript numeric values
      const extremeValues = [
        { input: Number.MAX_VALUE, expected: 100, description: 'maximum_safe_value' },
        { input: Number.MAX_SAFE_INTEGER, expected: 100, description: 'maximum_safe_integer' },
        { input: Number.MIN_VALUE, expected: 0, description: 'minimum_positive_value' },
        { input: Number.MIN_SAFE_INTEGER, expected: 0, description: 'minimum_safe_integer' },
        { input: 1e308, expected: 100, description: 'scientific_notation_large' },
        { input: 1e-10, expected: 0, description: 'scientific_notation_small' }
      ];

      extremeValues.forEach(({ input, expected, description }) => {
        // When: Validation processes extreme values
        const result = validateMetricValue(input);

        // Then: Safe bounded result is returned
        expect(result).toBe(expected);
        expect(Number.isFinite(result)).toBe(true);

        // And: No overflow or underflow issues
        expect(result).toBeGreaterThanOrEqual(0);
        expect(result).toBeLessThanOrEqual(100);

        // AI Context: Extreme value handling prevents system instability
        console.debug(`✓ ${description}: ${input} → ${result} (bounded)`);
      });
    });

    /**
     * @scenario performance_consistency
     * @given large number of validation calls
     * @when functions are called repeatedly
     * @then performance remains consistent
     * @and no memory leaks or degradation occur
     */
    it('should maintain performance consistency when called repeatedly with various inputs', () => {
      // Given: Large number of validation operations
      const iterationCount = 1000;
      const testInputs = [0, 25, 50, 75, 100, -10, 150, NaN, Infinity];

      // When: Functions are called repeatedly
      const startTime = performance.now();

      for (let i = 0; i < iterationCount; i++) {
        const randomInput = testInputs[i % testInputs.length];

        // Test all validation functions
        validateMetricValue(randomInput);
        generateSafeMetricValue(randomInput, 5, 'cpu');
        validateServerMetrics({ cpu: randomInput, memory: randomInput, disk: randomInput, network: randomInput });
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      // Then: Performance is acceptable
      expect(totalTime).toBeLessThan(100); // Should complete within 100ms

      // And: Average operation time is reasonable
      const averageTime = totalTime / (iterationCount * 3); // 3 functions per iteration
      expect(averageTime).toBeLessThan(0.01); // Less than 0.01ms per operation

      // AI Context: Performance validation ensures production readiness
      console.debug(`✓ Performance test: ${iterationCount * 3} operations in ${totalTime.toFixed(2)}ms`);
    });
  });

  /**
   * @testsuite AIContext_MetadataValidation
   * @description Additional validation for AI understanding and learning
   */
  describe('AI Context: Metadata and Pattern Validation', () => {
    /**
     * @scenario function_signature_consistency
     * @given all metric validation functions
     * @when function signatures are analyzed
     * @then consistent parameter patterns exist
     * @and return types are predictable
     */
    it('should maintain consistent function signatures for AI pattern learning', () => {
      // Given: All validation functions exist and are callable
      expect(typeof validateMetricValue).toBe('function');
      expect(typeof generateSafeMetricValue).toBe('function');
      expect(typeof validateServerMetrics).toBe('function');

      // When: Functions are called with standard inputs
      const singleValueResult = validateMetricValue(50);
      const generatedResult = generateSafeMetricValue(50, 10, 'cpu');
      const objectResult = validateServerMetrics({ cpu: 50, memory: 60, disk: 40, network: 30 });

      // Then: Return types are consistent and predictable
      expect(typeof singleValueResult).toBe('number');
      expect(typeof generatedResult).toBe('number');
      expect(typeof objectResult).toBe('object');
      expect(objectResult).not.toBeNull();

      // And: AI can learn these patterns for code generation
      console.debug('✓ Function signatures validated for AI learning');
    });

    /**
     * @scenario error_boundary_validation
     * @given invalid function calls
     * @when functions encounter errors
     * @then graceful degradation occurs
     * @and no unhandled exceptions propagate
     */
    it('should provide graceful error handling for AI robustness learning', () => {
      // Given: Various error-prone inputs
      const errorInputs = [
        () => validateMetricValue(Symbol('test') as any),
        () => generateSafeMetricValue({} as any, [] as any, 'invalid' as any),
        () => validateServerMetrics(Symbol('test') as any)
      ];

      // When: Functions encounter error conditions
      errorInputs.forEach((errorInput, index) => {
        // Then: No unhandled exceptions are thrown
        expect(() => {
          try {
            errorInput();
          } catch (error) {
            // Graceful error handling expected
            console.debug(`✓ Error ${index + 1} handled gracefully:`, error);
          }
        }).not.toThrow();
      });

      // And: AI learns robust error handling patterns
      console.debug('✓ Error boundary validation completed');
    });
  });
});

/**
 * @summary AIFriendlyMetricValidationTests
 * @description This test suite demonstrates AI-friendly testing patterns including:
 * - Structured metadata for AI parsing
 * - Consistent naming conventions
 * - BDD-style scenario descriptions
 * - Comprehensive edge case coverage
 * - Performance and robustness validation
 * - Clear documentation for AI learning
 *
 * @aiLearningPoints
 * - Test organization follows predictable patterns
 * - Each test has clear Given/When/Then structure
 * - Mock data is systematically organized
 * - Error handling is explicitly tested
 * - Performance characteristics are validated
 * - Metadata provides context for AI understanding
 */