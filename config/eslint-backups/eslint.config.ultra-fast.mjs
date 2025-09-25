import js from '@eslint/js';

export default [
  // Global ignores - extensive for maximum speed
  {
    ignores: [
      // Standard ignores
      'node_modules/',
      '.next/',
      'out/',
      'build/',
      'dist/',
      
      // Performance ignores
      'scripts/',
      'config/',
      'public/',
      'docs/',
      'archive/',
      'reports/',
      'coverage/',
      'playwright-report/',
      'test-results/',
      
      // File type ignores
      '**/*.test.*',
      '**/*.spec.*',
      '**/*.stories.*',
      '**/*.config.*',
      '**/*.d.ts',
      '*.tsbuildinfo',
      'next-env.d.ts',
      
      // Keep only essential checks - ignore heavy directories
      'src/types/**',
      'src/app/api/ai/**',
      'src/app/api/admin/**',
      'src/services/ai/**',
      'src/components/ui/**',
      'src/lib/supabase/**',
    ],
  },

  // Basic JavaScript rules only - skip TypeScript entirely
  js.configs.recommended,

  // Only check JavaScript files for maximum speed
  {
    files: ['src/**/*.{js,jsx,mjs,cjs}'],
    rules: {
      // Only the most critical rules
      'no-unused-vars': ['error', { 
        argsIgnorePattern: '^_', 
        varsIgnorePattern: '^_' 
      }],
      'no-console': 'off',
      'prefer-const': 'warn',
      'no-var': 'warn',
      'no-undef': 'off',
    },
  },
];