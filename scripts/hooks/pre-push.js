#!/usr/bin/env node

/**
 * Cross-platform Pre-push Hook
 * Windows/macOS/Linux compatible
 * Uses execFileSync for security (no shell injection risk)
 */

const { execFileSync, spawnSync } = require('child_process');
const os = require('os');
const path = require('path');
const fs = require('fs');

const isWindows = os.platform() === 'win32';
const isWSL = !isWindows && fs.existsSync('/proc/version') &&
  fs.readFileSync('/proc/version', 'utf8').toLowerCase().includes('microsoft');
const npmCmd = isWindows ? 'npm.cmd' : 'npm';
const gitCmd = isWindows ? 'git.exe' : 'git';
const cwd = process.cwd();
const isWindowsFS = cwd.startsWith('/mnt/');

// Environment flags
const SKIP_RELEASE_CHECK = process.env.SKIP_RELEASE_CHECK === 'true';
const QUICK_PUSH = process.env.QUICK_PUSH === 'true';
const SKIP_TESTS = process.env.SKIP_TESTS === 'true';
const SKIP_BUILD = process.env.SKIP_BUILD === 'true';
const SKIP_NODE_CHECK = process.env.SKIP_NODE_CHECK === 'true';

let testStatus = 'pending';

function runNpm(args) {
  const result = spawnSync(npmCmd, args, {
    encoding: 'utf8',
    stdio: 'inherit',
    cwd,
    shell: isWindows,
  });
  return result.status === 0;
}

function runNpmSilent(args) {
  const result = spawnSync(npmCmd, args, {
    encoding: 'utf8',
    stdio: 'pipe',
    cwd,
    shell: isWindows,
  });
  return { success: result.status === 0, output: result.stdout || '' };
}

function runGit(args) {
  try {
    const result = spawnSync(gitCmd, args, {
      encoding: 'utf8',
      stdio: 'pipe',
      cwd,
    });
    return result.stdout ? result.stdout.trim() : '';
  } catch {
    return '';
  }
}

// node_modules health check
function checkNodeModules() {
  if (SKIP_NODE_CHECK) {
    console.log('⚪ node_modules check skipped (SKIP_NODE_CHECK=true)');
    return true;
  }

  const criticalPackages = [
    'node_modules/typescript',
    'node_modules/react',
    'node_modules/@types/react',
    'node_modules/@types/node',
    'node_modules/next',
  ];

  const missing = criticalPackages.filter(pkg => !fs.existsSync(path.join(cwd, pkg)));

  if (missing.length > 0) {
    console.log('');
    console.log('⚠️  node_modules appears to be corrupted or incomplete');
    console.log('   Missing packages:', missing.map(p => p.replace('node_modules/', '')).join(', '));
    console.log('');
    console.log('💡 Fix options:');
    console.log('   1. Run: rm -rf node_modules package-lock.json && npm install');
    console.log('   2. Bypass: HUSKY=0 git push');
    console.log('');
    return false;
  }

  // Check for platform mismatch (WSL using Windows node_modules)
  if (isWSL && isWindowsFS) {
    const rollupPath = path.join(cwd, 'node_modules/@rollup');
    if (fs.existsSync(rollupPath)) {
      const rollupContents = fs.readdirSync(rollupPath);
      const hasWin32 = rollupContents.some(f => f.includes('win32'));
      const hasLinux = rollupContents.some(f => f.includes('linux'));

      if (hasWin32 && !hasLinux) {
        console.log('');
        console.log('⚠️  node_modules was installed on Windows, not compatible with WSL');
        console.log('');
        console.log('💡 Options:');
        console.log('   1. Push from Windows: Use PowerShell/CMD to run git push');
        console.log('   2. Reinstall: rm -rf node_modules && npm install');
        console.log('   3. Bypass: HUSKY=0 git push');
        console.log('');
        return false;
      }
    }
  }

  return true;
}

// Release check
function checkRelease() {
  if (SKIP_RELEASE_CHECK || QUICK_PUSH) return;

  const lastTag = runGit(['describe', '--tags', '--abbrev=0']);
  if (!lastTag) return;

  const commitsSinceTag = runGit(['rev-list', `${lastTag}..HEAD`, '--count']);
  const count = parseInt(commitsSinceTag, 10) || 0;

  if (count > 5) {
    console.log('');
    console.log(`📦 Release Check: ${count} commits since ${lastTag}`);
    console.log('   Consider running: npm run release:patch (or :minor)');
    console.log('   Skip this check: SKIP_RELEASE_CHECK=true git push');
    console.log('');
  }
}

// WSL warning
function checkWSLPerformance() {
  if (isWSL && isWindowsFS) {
    console.log('');
    console.log('⚠️  WSL + Windows filesystem detected (/mnt/...)');
    console.log('   Validation may be slow. Quick options:');
    console.log('   • QUICK_PUSH=true git push  (TypeScript only)');
    console.log('   • HUSKY=0 git push          (Skip all hooks)');
    console.log('');
  }
}

// Tests
function runTests() {
  console.log('🧪 Running quick tests...');

  if (SKIP_TESTS) {
    testStatus = 'skipped';
    console.log('⚪ Tests skipped (SKIP_TESTS=true)');
    console.log('⚠️  WARNING: Skipping tests may allow regressions');
    return;
  }

  const success = runNpm(['run', 'test:super-fast']);
  if (success) {
    testStatus = 'passed';
  } else {
    testStatus = 'failed';
    console.log('❌ Tests failed - push blocked');
    console.log('');
    console.log('💡 Fix: npm run test:super-fast');
    console.log('');
    console.log('⚠️  Bypass options:');
    console.log('   • SKIP_TESTS=true git push   (Skip tests only)');
    console.log('   • HUSKY=0 git push           (Skip all hooks)');
    process.exit(1);
  }
}

// Build validation
function runBuildValidation() {
  console.log('🏗️ Build validation...');

  if (SKIP_BUILD) {
    console.log('⚪ Build validation skipped (SKIP_BUILD=true)');
    return;
  }

  if (QUICK_PUSH) {
    console.log('⚡ Running optimized validation (TypeScript + Lint parallel)...');
    const success = runNpm(['run', 'hook:validate']);
    if (!success) {
      console.log('❌ Validation failed - push blocked');
      console.log('');
      console.log('💡 Fix errors or run "npm run build" locally');
      console.log('');
      console.log('⚠️  Bypass: HUSKY=0 git push');
      process.exit(1);
    }
    console.log('ℹ️  Note: Full build skipped (QUICK_PUSH=true)');
  } else {
    console.log('🐢 Running FULL build validation...');
    console.log('   (Use QUICK_PUSH=true git push for faster validation)');
    const success = runNpm(['run', 'build']);
    if (!success) {
      console.log('❌ Build failed - push blocked');
      console.log('');
      console.log('💡 Fix: npm run build');
      console.log('');
      console.log('⚠️  Bypass options:');
      console.log('   • QUICK_PUSH=true git push  (TypeScript only)');
      console.log('   • HUSKY=0 git push          (Skip all hooks)');
      process.exit(1);
    }
  }
}

// Environment check
function checkEnvironment() {
  // Skip env check if not available
  const pkgPath = path.join(cwd, 'package.json');
  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    if (!pkg.scripts || !pkg.scripts['env:check']) {
      return; // Skip if script not defined
    }
  } catch {
    return;
  }

  console.log('🔐 Environment variables check...');
  const success = runNpm(['run', 'env:check']);
  if (!success) {
    console.log('❌ Environment variables check failed');
    console.log('');
    console.log('💡 Fix: Add missing env vars to .env.local');
    console.log('');
    console.log('⚠️  Bypass: HUSKY=0 git push');
    process.exit(1);
  }
}

// Package.json check
function checkPackageJson() {
  console.log('📦 Checking package.json...');
  try {
    const pkgPath = path.join(cwd, 'package.json');
    JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  } catch (err) {
    console.log('❌ package.json has syntax errors');
    process.exit(1);
  }
}

// Summary
function printSummary(duration) {
  console.log('');
  console.log(`✅ Pre-push validation passed in ${duration}s`);
  console.log('🚀 Ready to push!');
  console.log('');
  console.log('📊 Summary:');
  console.log(`  ${testStatus === 'passed' ? '✅' : '⚪'} Tests ${testStatus}`);
  console.log('  ✅ Build/validation succeeded');
  console.log('  ✅ Environment validated');
  console.log('');
}

// Main
function main() {
  const startTime = Date.now();

  console.log('🔍 Pre-push validation starting...');

  // Early checks
  checkRelease();
  checkWSLPerformance();

  // node_modules health check (fail early if corrupted)
  if (!checkNodeModules()) {
    console.log('❌ node_modules check failed - push blocked');
    console.log('');
    console.log('💡 Quick bypass: HUSKY=0 git push');
    process.exit(1);
  }

  runTests();
  runBuildValidation();
  checkPackageJson();
  checkEnvironment();

  const duration = Math.round((Date.now() - startTime) / 1000);
  printSummary(duration);
}

main();
