#!/usr/bin/env node

/**
 * Cross-platform Post-commit Hook
 * v4.0.0 - Simplified (commit notification only)
 */

const { execFileSync } = require('child_process');

const tryGit = (args) => {
  try {
    return execFileSync('git', args, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return null;
  }
};

const commitHash = tryGit(['rev-parse', '--short', 'HEAD']) || 'unknown';
const commitMsg = tryGit(['log', '-1', '--format=%s']) || 'unknown';

console.log('');
console.log(`Commit complete: ${commitHash} ${commitMsg.substring(0, 50)}`);
console.log('');

process.exit(0);
