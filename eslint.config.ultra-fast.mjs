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
      
      // Ignore most src subdirectories for speed
      'src/app/api/ai/**',
      'src/app/api/admin/**',
      'src/app/api/agents/**',
      'src/services/ai/**',
      'src/components/ui/**',
      'src/lib/supabase/**',
      'src/utils/**',
    ],
  },

  // Minimal rules for remaining files
  {
    files: ['src/**/*.{js,jsx,ts,tsx}'],
    rules: {
      // Only the most critical rules
      'no-unused-vars': ['error', { 
        argsIgnorePattern: '^_', 
        varsIgnorePattern: '^_' 
      }],
      'no-console': 'off',
      'prefer-const': 'warn',
      'no-var': 'warn',
      
      // Disable everything else
      'no-undef': 'off',
    },
  },
];