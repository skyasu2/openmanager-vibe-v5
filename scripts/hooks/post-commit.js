#!/usr/bin/env node

/**
 * Cross-platform Post-commit Hook
 * Launches background AI review (WSL/Linux only)
 * On Windows, provides guidance for manual review
 */

const { spawn } = require('child_process');
const os = require('os');
const path = require('path');
const fs = require('fs');

const isWindows = os.platform() === 'win32';
const cwd = process.cwd();

console.log('🚀 Post-commit validation started...');

if (isWindows) {
  // Windows: Background process not supported, skip gracefully
  console.log('ℹ️  Background AI review skipped (Windows native)');
  console.log('💡 For AI review, run: npm run review:show');
  console.log('   Or use WSL for full background support');
  process.exit(0);
}

// Unix/WSL: Run background script
const scriptPath = path.join(cwd, 'scripts/git/post-commit-background.sh');
const logPath = path.join(cwd, 'logs/post-commit.log');

// Ensure logs directory exists
const logsDir = path.dirname(logPath);
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

try {
  // Check if background script exists
  if (!fs.existsSync(scriptPath)) {
    console.log('⚠️  Background script not found, skipping');
    process.exit(0);
  }

  // Launch detached background process
  const logStream = fs.openSync(logPath, 'a');
  const child = spawn('bash', [scriptPath], {
    cwd,
    detached: true,
    stdio: ['ignore', logStream, logStream],
  });
  child.unref();

  console.log('✅ Background tasks launched.');
  console.log(`💡 Logs: ${logPath}`);
} catch (err) {
  console.log('⚠️  Background launch failed:', err.message);
  console.log('   This is non-blocking, commit succeeded.');
}

process.exit(0);
