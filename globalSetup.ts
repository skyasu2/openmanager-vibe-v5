import * as dotenv from 'dotenv';
import * as path from 'path';

/**
 * Playwright Global Setup
 *
 * This runs once before any tests start, ensuring environment variables
 * are loaded into process.env and available to all worker processes.
 *
 * Unlike dotenv.config() in individual files, this guarantees:
 * - Environment variables are set before workers spawn
 * - Variables persist across test retries
 * - Consistent behavior in all test contexts
 */
export default function globalSetup() {
  console.log('🔧 [Global Setup] Loading environment variables from .env');

  // Load .env file
  const result = dotenv.config({ path: path.resolve(__dirname, '.env') });

  if (result.error) {
    console.error('❌ [Global Setup] Failed to load .env file:', result.error);
    throw new Error(`Failed to load .env file: ${result.error.message}`);
  }

  // Validate critical environment variables
  const requiredVars = ['VERCEL_AUTOMATION_BYPASS_SECRET', 'TEST_SECRET_KEY'];

  const missing: string[] = [];

  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      missing.push(varName);
    } else {
      // Log first 10 characters for verification (security)
      const value = process.env[varName]!;
      console.log(`✅ [Global Setup] ${varName}: ${value.substring(0, 10)}...`);
    }
  }

  if (missing.length > 0) {
    const errorMsg = `Missing required environment variables: ${missing.join(', ')}`;
    console.error(`❌ [Global Setup] ${errorMsg}`);
    throw new Error(errorMsg);
  }

  console.log(
    '✅ [Global Setup] All environment variables loaded successfully'
  );
  console.log(
    '📋 [Global Setup] Variables will be available to all worker processes'
  );
}
