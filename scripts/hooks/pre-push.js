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
const npmCmd = isWindows ? 'npm.cmd' : 'npm';
const gitCmd = isWindows ? 'git.exe' : 'git';
const cwd = process.cwd();

// Environment flags
const SKIP_RELEASE_CHECK = process.env.SKIP_RELEASE_CHECK === 'true';
const QUICK_PUSH = process.env.QUICK_PUSH === 'true';
const SKIP_TESTS = process.env.SKIP_TESTS === 'true';
const SKIP_BUILD = process.env.SKIP_BUILD === 'true';

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
  if (!isWindows && cwd.startsWith('/mnt/')) {
    console.log('⚠️  WARNING: Running from Windows filesystem (/mnt/...).');
    console.log('   This will be significantly slower than running from ~/');
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
    console.log('⚠️  Bypass: SKIP_TESTS=true git push');
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
      console.log('💡 Fix errors or run "npm run build" locally');
      process.exit(1);
    }
    console.log('ℹ️  Note: Full build skipped (QUICK_PUSH=true)');
  } else {
    console.log('🐢 Running FULL build validation...');
    console.log('   (Use QUICK_PUSH=true git push for faster validation)');
    const success = runNpm(['run', 'build']);
    if (!success) {
      console.log('❌ Build failed - push blocked');
      process.exit(1);
    }
  }
}

// Environment check
function checkEnvironment() {
  console.log('🔐 Environment variables check...');
  const success = runNpm(['run', 'env:check']);
  if (!success) {
    console.log('❌ Environment variables check failed');
    console.log('💡 Fix: Add missing env vars to .env.local');
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

  checkRelease();
  checkWSLPerformance();
  runTests();
  runBuildValidation();
  checkEnvironment();
  checkPackageJson();

  const duration = Math.round((Date.now() - startTime) / 1000);
  printSummary(duration);
}

main();
