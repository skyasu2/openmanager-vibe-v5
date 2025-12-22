#!/usr/bin/env node

/**
 * Cross-platform Parallel Validation Script
 * Runs Type Check and Lint in parallel
 * Windows/macOS/Linux compatible
 */

const { spawn } = require('child_process');
const os = require('os');

const isWindows = os.platform() === 'win32';
const npmCmd = isWindows ? 'npm.cmd' : 'npm';

const skipLint = process.env.SKIP_LINT === 'true' || process.env.QUICK_PUSH === 'true';

console.log('🚀 Starting Parallel Validation...');
const startTime = Date.now();

function runCommand(name, args, silent = true) {
  return new Promise((resolve) => {
    const proc = spawn(npmCmd, args, {
      stdio: silent ? 'pipe' : 'inherit',
      shell: isWindows,
    });

    let output = '';
    if (silent && proc.stdout) {
      proc.stdout.on('data', (data) => { output += data; });
    }
    if (silent && proc.stderr) {
      proc.stderr.on('data', (data) => { output += data; });
    }

    proc.on('close', (code) => {
      resolve({ name, code, output });
    });
  });
}

async function main() {
  const tasks = [];

  // TypeScript check (always required)
  console.log('  📘 TypeScript...');
  tasks.push(runCommand('TypeScript', ['run', 'type-check']));

  // Lint check (skip in QUICK_PUSH mode)
  if (!skipLint) {
    console.log('  🔍 Biome...');
    tasks.push(runCommand('Biome', ['run', 'lint:quick']));
  } else {
    console.log('  ⚪ Biome lint skipped (QUICK_PUSH mode)');
  }

  const results = await Promise.all(tasks);

  let hasError = false;
  for (const result of results) {
    if (result.code === 0) {
      console.log(`  ✅ ${result.name} Passed`);
    } else {
      console.log(`  ❌ ${result.name} Failed`);
      // Re-run to show output
      await runCommand(result.name, ['run', result.name === 'TypeScript' ? 'type-check' : 'lint:quick'], false);
      hasError = true;
    }
  }

  const duration = Math.round((Date.now() - startTime) / 1000);

  if (!hasError) {
    console.log(`🎉 Validation Successful in ${duration}s`);
    process.exit(0);
  } else {
    console.log(`💥 Validation Failed in ${duration}s`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Validation error:', err);
  process.exit(1);
});
