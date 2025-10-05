/**
 * Input Validation Utilities
 *
 * Protects against command injection and malformed queries
 * Based on Qwen's security recommendations
 */

/**
 * Validates query input before passing to AI clients
 *
 * @throws {Error} If query is invalid
 */
export function validateQuery(query: string): void {
  // Check for empty query
  if (!query || !query.trim()) {
    throw new Error('Query cannot be empty');
  }

  // Check length limit (prevent resource exhaustion)
  // Increased to 2500 for complex project analysis
  if (query.length > 2500) {
    throw new Error(`Query too long (max 2500 characters, got ${query.length})`);
  }

  // Check for dangerous shell metacharacters
  const dangerousPatterns = [
    /[\$`]/,      // Shell variable substitution and command substitution
    /[;&|]/,      // Shell control characters (command chaining)
    /\x00/,       // Null byte injection
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(query)) {
      throw new Error('Query contains dangerous characters');
    }
  }
}
